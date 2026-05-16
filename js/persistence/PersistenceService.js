/**
 * PersistenceService.js — Dexie.js IndexedDB Layer
 * Last Modified: 2026-05-15
 *
 * Wraps IndexedDB via Dexie for promise-based persistence.
 * Auto-saves on data changes (debounced).
 */

import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.mjs';
import bus, { Events } from '../core/EventBus.js';
import dataStore from '../data/DataStore.js';

class PersistenceService {
    constructor() {
        /** @type {Dexie|null} */
        this.db = null;

        /** @type {number|null} */
        this._saveTimer = null;

        this._handleDataLoaded = this._onDataLoaded.bind(this);
        this._handleFilterChanged = this._onFilterChanged.bind(this);
    }

    /**
     * Initialize the database.
     */
    async init() {
        this.db = new Dexie('GreatTaleTimeline');

        this.db.version(1).stores({
            worldConfig: '++id',
            events: 'id, lane_id, type, importance',
            entities: 'id, name',
            lanes: 'id, label',
            userPreferences: 'key',
        });

        bus.on(Events.DATA_LOADED, this._handleDataLoaded);
        bus.on(Events.DATA_IMPORTED, this._handleDataLoaded);
    }

    /**
     * Save current data to IndexedDB after data is loaded.
     * @private
     */
    async _onDataLoaded() {
        this._debounceSave();
    }

    /**
     * Debounced save (500ms delay).
     * @private
     */
    _debounceSave() {
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveWorld(), 500);
    }

    /**
     * Save the entire dataset to IndexedDB.
     */
    async saveWorld() {
        if (!this.db || !dataStore.hasData) return;

        try {
            await this.db.transaction('rw',
                this.db.worldConfig,
                this.db.events,
                this.db.entities,
                this.db.lanes,
                async () => {
                    // Clear existing
                    await this.db.worldConfig.clear();
                    await this.db.events.clear();
                    await this.db.entities.clear();
                    await this.db.lanes.clear();

                    // Write new data
                    if (dataStore.worldConfig) {
                        await this.db.worldConfig.add({ id: 1, ...dataStore.worldConfig });
                    }
                    if (dataStore.events.length > 0) {
                        await this.db.events.bulkAdd(dataStore.events);
                    }
                    if (dataStore.entities.length > 0) {
                        await this.db.entities.bulkAdd(dataStore.entities);
                    }
                    if (dataStore.lanes.length > 0) {
                        await this.db.lanes.bulkAdd(dataStore.lanes);
                    }
                }
            );

            console.log('[PersistenceService] Data saved to IndexedDB.');
            bus.emit(Events.DATA_SAVED);

        } catch (err) {
            console.error('[PersistenceService] Save failed:', err);
        }
    }

    /**
     * Load data from IndexedDB (if any exists).
     * @returns {Object|null} The loaded dataset, or null if empty.
     */
    async loadWorld() {
        if (!this.db) return null;

        try {
            const configs = await this.db.worldConfig.toArray();
            const events = await this.db.events.toArray();
            const entities = await this.db.entities.toArray();
            const lanes = await this.db.lanes.toArray();

            if (configs.length === 0 && events.length === 0) return null;

            // Clean up internal Dexie id field from config
            const config = configs[0] || {};
            delete config.id;

            return {
                world_config: config,
                events,
                entities,
                lanes,
            };

        } catch (err) {
            console.error('[PersistenceService] Load failed:', err);
            return null;
        }
    }

    /**
     * Save a user preference.
     * @param {string} key
     * @param {*} value
     */
    async savePreference(key, value) {
        if (!this.db) return;
        await this.db.userPreferences.put({ key, value });
    }

    /**
     * Load a user preference.
     * @param {string} key
     * @returns {*}
     */
    async loadPreference(key) {
        if (!this.db) return undefined;
        const pref = await this.db.userPreferences.get(key);
        return pref ? pref.value : undefined;
    }

    /**
     * Export all data as a JSON object.
     * @returns {Object}
     */
    async exportToJSON() {
        return dataStore.toJSON();
    }

    /**
     * Clear all stored data.
     */
    async clearAll() {
        if (!this.db) return;
        await this.db.worldConfig.clear();
        await this.db.events.clear();
        await this.db.entities.clear();
        await this.db.lanes.clear();
        console.log('[PersistenceService] Database cleared.');
    }

    /**
     * Handle filter changes — save preferences.
     * @private
     */
    _onFilterChanged() {
        // Could save filter state as user preferences
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.DATA_LOADED, this._handleDataLoaded);
        bus.off(Events.DATA_IMPORTED, this._handleDataLoaded);
        if (this.db) this.db.close();
    }
}

const persistenceService = new PersistenceService();
export default persistenceService;
