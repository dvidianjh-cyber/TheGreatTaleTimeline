/**
 * EventBus.js — Pub/Sub Event System
 * Last Modified: 2026-05-15
 *
 * Decouples all modules via named event channels.
 * All handlers must be named functions for proper cleanup.
 */

/** @readonly @enum {string} */
export const Events = Object.freeze({
    // Canvas / Viewport
    ZOOM_CHANGED: 'zoom:changed',
    PAN_CHANGED: 'pan:changed',
    VIEWPORT_RESIZED: 'viewport:resized',
    MEASURE_TOGGLED: 'measure:toggled',

    // Data lifecycle
    DATA_LOADED: 'data:loaded',
    DATA_CLEARED: 'data:cleared',
    WORLD_CONFIG_LOADED: 'world:config:loaded',

    // Filtering
    FILTER_CHANGED: 'filter:changed',
    LANE_VISIBILITY_CHANGED: 'lane:visibility:changed',
    ENTITY_VISIBILITY_CHANGED: 'entity:visibility:changed',
    IMPORTANCE_THRESHOLD_CHANGED: 'importance:threshold:changed',

    // Selection & Interaction
    EVENT_SELECTED: 'event:selected',
    EVENT_DESELECTED: 'event:deselected',
    ENTITY_SELECTED: 'entity:selected',
    EPOCH_SELECTED: 'epoch:selected',

    // Tooltips
    TOOLTIP_SHOW: 'tooltip:show',
    TOOLTIP_HIDE: 'tooltip:hide',

    // Mode switching
    MODE_SWITCHED: 'mode:switched',

    // UI panels
    PANEL_TOGGLED: 'panel:toggled',

    // Rulers
    RULER_SYSTEM_CHANGED: 'ruler:system:changed',
    EPOCH_RULER_CHANGED: 'epoch:ruler:changed',

    // Prologue
    PROLOGUE_TOGGLED: 'prologue:toggled',

    // Persistence
    DATA_SAVED: 'data:saved',
    DATA_EXPORTED: 'data:exported',
    DATA_IMPORTED: 'data:imported',

    // Rendering
    RENDER_DIRTY: 'render:dirty',
    LOD_LEVEL_CHANGED: 'lod:level:changed',
});

/**
 * @class EventBus
 * @description Lightweight pub/sub event bus. Singleton pattern.
 */
class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} eventName - One of the Events enum values.
     * @param {Function} handler - A **named** function reference.
     * @returns {Function} Unsubscribe function for convenience.
     */
    on(eventName, handler) {
        if (typeof handler !== 'function') {
            throw new TypeError(`EventBus.on: handler must be a function, got ${typeof handler}`);
        }
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, new Set());
        }
        this._listeners.get(eventName).add(handler);

        // Return unsubscribe function
        return () => this.off(eventName, handler);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} eventName
     * @param {Function} handler - The exact function reference passed to `on()`.
     */
    off(eventName, handler) {
        const handlers = this._listeners.get(eventName);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this._listeners.delete(eventName);
            }
        }
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} eventName
     * @param {*} [payload] - Data to pass to handlers.
     */
    emit(eventName, payload) {
        const handlers = this._listeners.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(payload);
                } catch (err) {
                    console.error(`[EventBus] Error in handler for "${eventName}":`, err);
                }
            }
        }
    }

    /**
     * Subscribe to an event, but only fire once then auto-unsubscribe.
     * @param {string} eventName
     * @param {Function} handler
     * @returns {Function} Unsubscribe function.
     */
    once(eventName, handler) {
        const wrappedHandler = (payload) => {
            this.off(eventName, wrappedHandler);
            handler(payload);
        };
        return this.on(eventName, wrappedHandler);
    }

    /**
     * Remove all listeners. Useful for teardown/testing.
     */
    clear() {
        this._listeners.clear();
    }
}

/** Singleton instance */
const bus = new EventBus();
export default bus;
