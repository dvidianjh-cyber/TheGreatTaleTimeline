/**
 * DataStore.js — In-Memory Data Manager
 * Last Modified: 2026-05-15
 *
 * Holds parsed, validated data and provides fast query APIs.
 * Maintains sorted indices for binary-search lookups.
 */

import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';

class DataStore {
    constructor() {
        /** @type {Object|null} */
        this.worldConfig = null;

        /** @type {Array<Object>} */
        this.events = [];

        /** @type {Array<Object>} */
        this.entities = [];

        /** @type {Array<Object>} */
        this.lanes = [];

        // ── Indices ──
        /** @type {Map<string, Object>} Event ID → Event */
        this._eventIndex = new Map();

        /** @type {Map<string, Object>} Entity ID → Entity */
        this._entityIndex = new Map();

        /** @type {Map<string, Object>} Lane ID → Lane */
        this._laneIndex = new Map();

        /** @type {Array<Object>} Events sorted by start TU */
        this._eventsByStart = [];

        /** @type {Map<string, Array<Object>>} Lane ID → Events in that lane */
        this._eventsByLane = new Map();

        /** @type {Map<string, Array<Object>>} Entity ID → Events involving that entity */
        this._eventsByEntity = new Map();

        /** @type {Map<string, Map<string, number>>} Lane ID → { SubArea Name → Index } */
        this._subAreaIndicesByLane = new Map();
    }

    /**
     * Load a full validated dataset.
     * @param {Object} dataset - { world_config, events, entities, lanes }
     */
    loadDataset(dataset) {
        this.clear();

        this.worldConfig = dataset.world_config || null;
        this.events = dataset.events || [];
        this.entities = dataset.entities || [];
        this.lanes = dataset.lanes || [];

        // Load config into TemporalEngine first
        if (this.worldConfig) {
            temporalEngine.loadConfig(this.worldConfig);
        }

        // Pre-compute start_tu and end_tu for all events using temporalEngine
        this.events.forEach(evt => {
            const dateUnit = evt.time_extent.date_unit || 'TU';
            evt.start_tu = temporalEngine.relativeToAbsoluteTU(evt.time_extent.start, dateUnit);
            evt.end_tu = temporalEngine.relativeToAbsoluteTU(evt.time_extent.end, dateUnit);
        });

        // Pre-compute absolute lifespan values (start_tu, death_tu, departure_tu) for all entities
        this.entities.forEach(ent => {
            if (ent.lifespan) {
                const dateUnit = ent.lifespan.date_unit || 'TU';
                if (ent.lifespan.birth !== undefined) {
                    ent.lifespan.start_tu = temporalEngine.relativeToAbsoluteTU(ent.lifespan.birth, dateUnit);
                }
                if (ent.lifespan.death !== undefined) {
                    ent.lifespan.death_tu = temporalEngine.relativeToAbsoluteTU(ent.lifespan.death, dateUnit);
                }
                if (ent.lifespan.departure !== undefined) {
                    ent.lifespan.departure_tu = temporalEngine.relativeToAbsoluteTU(ent.lifespan.departure, dateUnit);
                }
            }
        });

        this._buildIndices();

        // Initialize state visibility to show everything
        state.setAllLanesVisible(this.lanes.map(l => l.id));
        state.setAllEntitiesVisible(this.entities.map(e => e.id));
        state.setWorldConfig(this.worldConfig);

        // Auto-enable all time systems and epoch rulers
        if (this.worldConfig) {
            if (Array.isArray(this.worldConfig.time_systems)) {
                state.setActiveTimeSystems(this.worldConfig.time_systems.map(s => s.id));
            }
            if (Array.isArray(this.worldConfig.epochs)) {
                state.setActiveEpochRulers(this.worldConfig.epochs.map(e => e.id));
            }
        }

        bus.emit(Events.DATA_LOADED, {
            eventCount: this.events.length,
            entityCount: this.entities.length,
            laneCount: this.lanes.length,
        });
    }

    /**
     * Build all internal lookup indices.
     * @private
     */
    _buildIndices() {
        // Event index
        this._eventIndex.clear();
        this.events.forEach(evt => this._eventIndex.set(evt.id, evt));

        // Entity index
        this._entityIndex.clear();
        this.entities.forEach(ent => this._entityIndex.set(ent.id, ent));

        // Lane index
        this._laneIndex.clear();
        this.lanes.forEach(lane => this._laneIndex.set(lane.id, lane));

        // Events sorted by start time
        this._eventsByStart = [...this.events].sort(
            (a, b) => a.start_tu - b.start_tu
        );

        // Events grouped by lane
        this._eventsByLane.clear();
        this.events.forEach(evt => {
            if (evt.lane_id) {
                if (!this._eventsByLane.has(evt.lane_id)) {
                    this._eventsByLane.set(evt.lane_id, []);
                }
                this._eventsByLane.get(evt.lane_id).push(evt);
            }
        });

        // Events grouped by entity (participant)
        this._eventsByEntity.clear();
        this.events.forEach(evt => {
            if (Array.isArray(evt.participants)) {
                evt.participants.forEach(entityId => {
                    if (!this._eventsByEntity.has(entityId)) {
                        this._eventsByEntity.set(entityId, []);
                    }
                    this._eventsByEntity.get(entityId).push(evt);
                });
            }
        });

        // Sort entity event lists chronologically
        for (const [, evtList] of this._eventsByEntity) {
            evtList.sort((a, b) => a.start_tu - b.start_tu);
        }

        // Sub-area indexing
        this._subAreaIndicesByLane.clear();
        this.events.forEach(evt => {
            if (evt.lane_id) {
                const subArea = evt.sub_area || (evt.metadata && evt.metadata.sub_area) || 'default';
                if (!this._subAreaIndicesByLane.has(evt.lane_id)) {
                    this._subAreaIndicesByLane.set(evt.lane_id, new Map());
                    this._subAreaIndicesByLane.get(evt.lane_id).set('default', 0);
                }
                const laneSubAreas = this._subAreaIndicesByLane.get(evt.lane_id);
                if (!laneSubAreas.has(subArea)) {
                    laneSubAreas.set(subArea, laneSubAreas.size);
                }
            }
        });
    }

    // ─── Query APIs ─────────────────────────────────────

    /**
     * Get events within a time range (binary search).
     * @param {number} startTu
     * @param {number} endTu
     * @returns {Array<Object>}
     */
    getEventsInRange(startTu, endTu) {
        const result = [];
        // Binary search for first event >= startTu
        let lo = 0, hi = this._eventsByStart.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >>> 1;
            if (this._eventsByStart[mid].end_tu < startTu) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        // Scan forward from lo
        for (let i = lo; i < this._eventsByStart.length; i++) {
            const evt = this._eventsByStart[i];
            if (evt.start_tu > endTu) break;
            result.push(evt);
        }
        return result;
    }

    /**
     * Get events in a specific lane.
     * @param {string} laneId
     * @returns {Array<Object>}
     */
    getEventsByLane(laneId) {
        return this._eventsByLane.get(laneId) || [];
    }

    /**
     * Get events involving a specific entity.
     * @param {string} entityId
     * @returns {Array<Object>}
     */
    getEventsByEntity(entityId) {
        return this._eventsByEntity.get(entityId) || [];
    }

    /**
     * Get entities filtered by race metadata.
     * @param {string} race
     * @returns {Array<Object>}
     */
    getEntitiesByRace(race) {
        return this.entities.filter(e => e.metadata && e.metadata.race === race);
    }

    /**
     * Get events at or above an importance threshold.
     * @param {number} minImportance
     * @returns {Array<Object>}
     */
    getEventsByImportance(minImportance) {
        return this.events.filter(e => (e.importance || 5) >= minImportance);
    }

    /**
     * Get a single event by ID.
     * @param {string} id
     * @returns {Object|undefined}
     */
    getEvent(id) {
        return this._eventIndex.get(id);
    }

    /**
     * Get a single entity by ID.
     * @param {string} id
     * @returns {Object|undefined}
     */
    getEntity(id) {
        return this._entityIndex.get(id);
    }

    /**
     * Get a single lane by ID.
     * @param {string} id
     * @returns {Object|undefined}
     */
    /**
     * Get the vertical slot index for a sub-area within a lane.
     * @param {string} laneId
     * @param {string} subArea
     * @returns {number}
     */
    getSubAreaIndex(laneId, subArea = 'default') {
        const laneSubAreas = this._subAreaIndicesByLane.get(laneId);
        if (!laneSubAreas) return 0;
        return laneSubAreas.get(subArea) || 0;
    }

    /**
     * Get the total number of sub-area slots in a lane.
     * @param {string} laneId
     * @returns {number}
     */
    getSubAreaCount(laneId) {
        const laneSubAreas = this._subAreaIndicesByLane.get(laneId);
        return laneSubAreas ? laneSubAreas.size : 1;
    }

    /**
     * Get the minimum and maximum Time Units (TUs) across all events and epochs.
     * @returns {{ minTu: number, maxTu: number }}
     */
    getTimeExtents() {
        let minTu = 0;
        let maxTu = 50000;

        if (this.worldConfig && this.worldConfig.epochs && this.worldConfig.epochs.length > 0) {
            minTu = Math.min(...this.worldConfig.epochs.map(e => e.start_tu));
            maxTu = Math.max(...this.worldConfig.epochs.map(e => e.end_tu || (e.start_tu + 10000)));
        }

        if (this.events.length > 0) {
            const eventMin = Math.min(...this.events.map(e => e.start_tu));
            const eventMax = Math.max(...this.events.map(e => e.end_tu));
            minTu = Math.min(minTu, eventMin);
            maxTu = Math.max(maxTu, eventMax);
        }

        return { minTu, maxTu };
    }

    getLane(id) {
        return this._laneIndex.get(id);
    }

    /**
     * Get all unique race values from entities.
     * @returns {string[]}
     */
    getAllRaces() {
        const races = new Set();
        this.entities.forEach(e => {
            if (e.metadata && e.metadata.race) races.add(e.metadata.race);
        });
        return [...races].sort();
    }

    /**
     * Get all unique event types.
     * @returns {string[]}
     */
    getAllEventTypes() {
        const types = new Set();
        this.events.forEach(e => { if (e.type) types.add(e.type); });
        return [...types].sort();
    }

    /**
     * Get the full dataset as a serializable object (for export).
     * @returns {Object}
     */
    toJSON() {
        return {
            world_config: this.worldConfig,
            events: this.events,
            entities: this.entities,
            lanes: this.lanes,
        };
    }

    /**
     * Clear all data.
     */
    clear() {
        this.worldConfig = null;
        this.events = [];
        this.entities = [];
        this.lanes = [];
        this._eventIndex.clear();
        this._entityIndex.clear();
        this._laneIndex.clear();
        this._eventsByStart = [];
        this._eventsByLane.clear();
        this._eventsByEntity.clear();
        bus.emit(Events.DATA_CLEARED);
    }

    /**
     * Check if any data is loaded.
     * @returns {boolean}
     */
    get hasData() {
        return this.events.length > 0 || this.entities.length > 0;
    }
}

/** Singleton instance */
const dataStore = new DataStore();
export default dataStore;
