/**
 * StateManager.js — Reactive Global State
 * Last Modified: 2026-05-15
 *
 * Central state singleton. Mutations automatically emit events via EventBus.
 * All UI and canvas modules read from here.
 */

import bus, { Events } from './EventBus.js';

/**
 * @typedef {'geographic' | 'biographical'} ViewMode
 */

/**
 * @typedef {Object} AppState
 * @property {number} zoom - Zoom level (1 = default, higher = more zoomed in)
 * @property {{ x: number, y: number }} panOffset - Pan offset in pixels
 * @property {ViewMode} viewMode - Current axis mode
 * @property {Set<string>} visibleLanes - Set of visible lane IDs
 * @property {Set<string>} visibleEntities - Set of visible entity IDs
 * @property {number} importanceThreshold - Minimum importance to display (1-10)
 * @property {string[]} activeTimeSystems - Active ruler system IDs (e.g., ['solar', 'valian'])
 * @property {string|null} selectedEventId - Currently selected event ID
 * @property {boolean} showPrologue - Whether the Great Void prologue is visible
 * @property {Object|null} worldConfig - Loaded world configuration
 * @property {number} viewportWidth - Canvas width in pixels
 * @property {number} viewportHeight - Canvas height in pixels
 */

class StateManager {
    constructor() {
        /** @type {AppState} */
        this._state = {
            zoomX: 1,
            zoomY: 1,
            panOffset: { x: 0, y: 0 },
            viewMode: 'geographic',
            visibleLanes: new Set(),
            visibleEntities: new Set(),
            importanceThreshold: 1,
            activeTimeSystems: ['solar'],
            selectedEventId: null,
            baseFontSize: 1.1,
            worldConfig: null,
            viewportWidth: 0,
            viewportHeight: 0,
            activeEpochRulers: new Set(),
        };
    }

    // ─── Getters ─────────────────────────────────────────

    /** @returns {number} Alias for zoomX */
    get zoom() { return this._state.zoomX; }

    /** @returns {number} */
    get zoomX() { return this._state.zoomX; }

    /** @returns {number} */
    get zoomY() { return this._state.zoomY; }

    /** @returns {{ x: number, y: number }} */
    get panOffset() { return { ...this._state.panOffset }; }

    /** @returns {ViewMode} */
    get viewMode() { return this._state.viewMode; }

    /** @returns {Set<string>} */
    get visibleLanes() { return new Set(this._state.visibleLanes); }

    /** @returns {Set<string>} */
    get visibleEntities() { return new Set(this._state.visibleEntities); }

    /** @returns {number} */
    get importanceThreshold() { return this._state.importanceThreshold; }

    /** @returns {string[]} */
    get activeTimeSystems() { return [...this._state.activeTimeSystems]; }

    /** @returns {string|null} */
    get selectedEventId() { return this._state.selectedEventId; }

    /** @returns {number} */
    get baseFontSize() { return this._state.baseFontSize; }

    /** @returns {Object|null} */
    get worldConfig() { return this._state.worldConfig; }

    /** @returns {number} */
    get viewportWidth() { return this._state.viewportWidth; }

    /** @returns {number} */
    get viewportHeight() { return this._state.viewportHeight; }

    /** @returns {Set<string>} */
    get activeEpochRulers() { return new Set(this._state.activeEpochRulers); }

    // ─── Computed ────────────────────────────────────────

    /**
     * Pixels per Master Scale unit at the current zoom level.
     * Fixed base: 1 TU = 0.05px at zoom=1.
     * @returns {number}
     */
    get pixelsPerTU() {
        return 0.05 * this._state.zoomX;
    }

    /**
     * The visible time range in Master Scale units.
     * @returns {{ start: number, end: number }}
     */
    get visibleTimeRange() {
        const pptu = this.pixelsPerTU;
        if (pptu <= 0) return { start: 0, end: 50000 };
        const start = -this._state.panOffset.x / pptu;
        const end = start + (this._state.viewportWidth / pptu);
        return { start, end };
    }

    // ─── Mutators ────────────────────────────────────────

    /**
     * @param {number} newZoom
     */
    setZoomX(newZoom) {
        const clamped = Math.max(0.01, Math.min(newZoom, 50000));
        if (this._state.zoomX !== clamped) {
            this._state.zoomX = clamped;
            bus.emit(Events.ZOOM_CHANGED, { zoom: clamped, zoomX: clamped, zoomY: this._state.zoomY });
            bus.emit(Events.RENDER_DIRTY);
        }
    }

    /**
     * @param {number} newZoom
     */
    setZoomY(newZoom) {
        const clamped = Math.max(0.1, Math.min(newZoom, 10));
        if (this._state.zoomY !== clamped) {
            this._state.zoomY = clamped;
            bus.emit(Events.ZOOM_CHANGED, { zoom: this._state.zoomX, zoomX: this._state.zoomX, zoomY: clamped });
            bus.emit(Events.RENDER_DIRTY);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPan(x, y) {
        this._state.panOffset.x = x;
        this._state.panOffset.y = y;
        bus.emit(Events.PAN_CHANGED, { x, y });
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * @param {ViewMode} mode
     */
    setViewMode(mode) {
        if (this._state.viewMode !== mode) {
            this._state.viewMode = mode;
            bus.emit(Events.MODE_SWITCHED, { mode });
            bus.emit(Events.RENDER_DIRTY);
        }
    }

    /**
     * @param {string} laneId
     * @param {boolean} visible
     */
    setLaneVisibility(laneId, visible) {
        if (visible) {
            this._state.visibleLanes.add(laneId);
        } else {
            this._state.visibleLanes.delete(laneId);
        }
        bus.emit(Events.LANE_VISIBILITY_CHANGED, { laneId, visible });
        bus.emit(Events.FILTER_CHANGED);
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * @param {string} entityId
     * @param {boolean} visible
     */
    setEntityVisibility(entityId, visible) {
        if (visible) {
            this._state.visibleEntities.add(entityId);
        } else {
            this._state.visibleEntities.delete(entityId);
        }
        bus.emit(Events.ENTITY_VISIBILITY_CHANGED, { entityId, visible });
        bus.emit(Events.FILTER_CHANGED);
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * Bulk-set all lanes visible.
     * @param {string[]} laneIds
     */
    setAllLanesVisible(laneIds) {
        this._state.visibleLanes = new Set(laneIds);
        bus.emit(Events.FILTER_CHANGED);
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * Bulk-set all entities visible.
     * @param {string[]} entityIds
     */
    setAllEntitiesVisible(entityIds) {
        this._state.visibleEntities = new Set(entityIds);
        bus.emit(Events.FILTER_CHANGED);
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * @param {number} threshold - 1 to 10
     */
    setImportanceThreshold(threshold) {
        const clamped = Math.max(1, Math.min(10, threshold));
        if (this._state.importanceThreshold !== clamped) {
            this._state.importanceThreshold = clamped;
            bus.emit(Events.IMPORTANCE_THRESHOLD_CHANGED, { threshold: clamped });
            bus.emit(Events.FILTER_CHANGED);
            bus.emit(Events.RENDER_DIRTY);
        }
    }

    /**
     * @param {string[]} systemIds
     */
    setActiveTimeSystems(systemIds) {
        this._state.activeTimeSystems = [...systemIds];
        bus.emit(Events.RULER_SYSTEM_CHANGED, { systems: systemIds });
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * @param {string|null} eventId
     */
    selectEvent(eventId) {
        if (this._state.selectedEventId !== eventId) {
            const prev = this._state.selectedEventId;
            this._state.selectedEventId = eventId;
            if (prev) bus.emit(Events.EVENT_DESELECTED, { eventId: prev });
            if (eventId) bus.emit(Events.EVENT_SELECTED, { eventId });
        }
    }

    /**
     * @param {number} size
     */
    setBaseFontSize(size) {
        const clamped = Math.max(0.5, Math.min(2.0, size));
        if (this._state.baseFontSize !== clamped) {
            this._state.baseFontSize = clamped;
            document.documentElement.style.setProperty('--base-font-size', clamped);
            bus.emit(Events.RENDER_DIRTY);
        }
    }

    /**
     * Toggle an epoch ruler row on or off.
     * @param {string} epochId
     */
    toggleEpochRuler(epochId) {
        if (this._state.activeEpochRulers.has(epochId)) {
            this._state.activeEpochRulers.delete(epochId);
        } else {
            this._state.activeEpochRulers.add(epochId);
        }
        bus.emit(Events.EPOCH_RULER_CHANGED, { epochId, rulers: [...this._state.activeEpochRulers] });
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * @param {Object} config
     */
    setWorldConfig(config) {
        this._state.worldConfig = config;
        bus.emit(Events.WORLD_CONFIG_LOADED, config);
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    setViewportSize(width, height) {
        this._state.viewportWidth = width;
        this._state.viewportHeight = height;
        bus.emit(Events.VIEWPORT_RESIZED, { width, height });
    }
}

/** Singleton instance */
const state = new StateManager();
export default state;
