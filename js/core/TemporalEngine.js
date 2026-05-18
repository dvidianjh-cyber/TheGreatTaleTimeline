/**
 * TemporalEngine.js — Date System Math & Coordinate Mapping
 * Last Modified: 2026-05-15
 *
 * Translates between diverse dating systems and pixel coordinates.
 * The Master Scale (TU) starts at T₀ = 0 (First Year of the Lamps).
 */

import state from './StateManager.js';

class TemporalEngine {
    constructor() {
        /** @type {Object|null} */
        this._config = null;

        /** @type {Array} */
        this._timeSystems = [];

        /** @type {Array} */
        this._epochs = [];
    }

    /**
     * Initialize with a world config object.
     * @param {Object} config - The world_config JSON.
     */
    loadConfig(config) {
        this._config = config;
        this._timeSystems = config.time_systems || [];
        this._epochs = (config.epochs || []).sort((a, b) => a.start_tu - b.start_tu);
    }

    // ─── Coordinate Mapping ─────────────────────────────

    /**
     * Convert a Master Scale value to an x-pixel coordinate.
     * @param {number} tu - Master Scale time unit.
     * @returns {number} Pixel x-coordinate.
     */
    tuToPixel(tu) {
        return tu * state.pixelsPerTU;
    }

    /**
     * Convert a pixel x-coordinate to a Master Scale value.
     * @param {number} px - Pixel x-coordinate.
     * @returns {number} Master Scale time unit.
     */
    pixelToTU(px) {
        const pptu = state.pixelsPerTU;
        if (pptu === 0) return 0;
        return px / pptu;
    }

    // ─── Date System Conversions ────────────────────────

    /**
     * Get a time system definition by ID.
     * @param {string} systemId
     * @returns {Object|undefined}
     */
    getTimeSystem(systemId) {
        return this._timeSystems.find(s => s.id === systemId);
    }

    /**
     * Convert a TU value to a display value in a specific time system.
     * @param {number} tu - Master Scale value.
     * @param {string} systemId - Time system ID (e.g., 'solar', 'valian').
     * @returns {number} The value in the target system.
     */
    convertToSystem(tu, systemId) {
        const system = this.getTimeSystem(systemId);
        if (!system) return tu;
        const factor = system.conversion_factor || system.base_unit || 1;
        return tu / factor;
    }

    /**
     * Convert a value from a specific time system back to TU.
     * @param {number} value - Value in the source system.
     * @param {string} systemId - Time system ID.
     * @returns {number} Master Scale TU value.
     */
    convertFromSystem(value, systemId) {
        const system = this.getTimeSystem(systemId);
        if (!system) return value;
        const factor = system.conversion_factor || system.base_unit || 1;
        return value * factor;
    }

    /**
     * Get the conversion factor for an epoch.
     * @param {Object} epoch
     * @returns {number}
     */
    getEpochConversionFactor(epoch) {
        if (!epoch) return 1;
        const systemId = epoch.time_system || epoch.primary_system;
        const system = this.getTimeSystem(systemId);
        if (!system) return 1;
        return system.conversion_factor || system.base_unit || 1;
    }

    /**
     * Convert a relative coordinate (in an epoch abbreviation or system) to absolute TU.
     * @param {number} val
     * @param {string} dateUnit
     * @returns {number}
     */
    relativeToAbsoluteTU(val, dateUnit) {
        if (val === undefined || val === null) return 0;
        if (!dateUnit || dateUnit === 'TU') return val;

        const epoch = this._epochs.find(e => e.abbreviation === dateUnit || e.id === dateUnit);
        if (epoch) {
            const factor = this.getEpochConversionFactor(epoch);
            // Formula: tu = D * conversion_factor + E.start_tu - 1
            return val * factor + epoch.start_tu - 1;
        }

        const system = this.getTimeSystem(dateUnit);
        if (system) {
            const factor = system.conversion_factor || system.base_unit || 1;
            return val * factor;
        }

        return val;
    }

    /**
     * Convert an absolute TU back to relative units.
     * @param {number} tu
     * @param {string} dateUnit
     * @returns {number}
     */
    absoluteToRelativeDate(tu, dateUnit) {
        if (tu === undefined || tu === null) return 0;
        if (!dateUnit || dateUnit === 'TU') return tu;

        const epoch = this._epochs.find(e => e.abbreviation === dateUnit || e.id === dateUnit);
        if (epoch) {
            const factor = this.getEpochConversionFactor(epoch);
            // Formula: D = (tu - E.start_tu + 1) / conversion_factor
            return (tu - epoch.start_tu + 1) / factor;
        }

        const system = this.getTimeSystem(dateUnit);
        if (system) {
            const factor = system.conversion_factor || system.base_unit || 1;
            return tu / factor;
        }

        return tu;
    }

    // ─── Epoch Queries ──────────────────────────────────

    /**
     * Find the epoch that contains a given TU value.
     * @param {number} tu
     * @returns {Object|null}
     */
    getEpochAt(tu) {
        for (const epoch of this._epochs) {
            if (tu >= epoch.start_tu && (epoch.end_tu === undefined || tu <= epoch.end_tu)) {
                return epoch;
            }
        }
        return null;
    }

    /**
     * Get all epochs.
     * @returns {Array}
     */
    getEpochs() {
        return [...this._epochs];
    }

    /**
     * Get the total extent of the timeline in TU.
     * @returns {{ start: number, end: number }}
     */
    getTimelineExtent() {
        if (this._epochs.length === 0) return { start: 0, end: 1000 };
        const start = this._epochs[0].start_tu;
        const lastEpoch = this._epochs[this._epochs.length - 1];
        const end = lastEpoch.end_tu !== undefined ? lastEpoch.end_tu : lastEpoch.start_tu + 1000;
        return { start, end };
    }

    // ─── Label Formatting ───────────────────────────────

    /**
     * Format a TU value as a human-readable date label.
     */
    formatDateLabel(tu, systemId, exact = false) {
        const system = this.getTimeSystem(systemId);
        if (!system) return `${Math.round(tu)} TU`;

        const value = this.convertToSystem(tu, systemId);

        // Determine display precision based on zoom
        const pptu = state.pixelsPerTU;
        let displayValue;

        if (exact) {
            // Show up to 2 decimals for exact values if they are not integers
            displayValue = (value % 1 !== 0) 
                ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : Math.round(value).toLocaleString();
        } else if (pptu > 50) {
            // High zoom: show 1 decimal place
            displayValue = value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        } else if (pptu > 5) {
            // Standard zoom: round to nearest integer
            displayValue = Math.round(value).toLocaleString();
        } else {
            const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(value) || 1)) - 1));
            displayValue = (Math.round(value / magnitude) * magnitude).toLocaleString();
        }

        const abbrev = system.abbreviation || system.name || systemId;
        return `${displayValue} ${abbrev}`;
    }

    /**
     * Get a formatted label for a TU value, automatically choosing between epoch and solar systems.
     * @param {number} tu 
     * @param {string} id - Either a systemId or an epochId.
     * @param {boolean} exact 
     * @returns {string}
     */
    formatUnifiedDate(tu, id, exact = false) {
        // Try system first
        if (this.getTimeSystem(id)) {
            return this.formatDateLabel(tu, id, exact);
        }
        // Try epoch
        const epoch = this._epochs.find(e => e.id === id);
        if (epoch) {
            return this.formatEpochLabel(tu, epoch, exact);
        }
        return `${Math.round(tu)} TU`;
    }

    /**
     * Format a TU value as an epoch-relative label.
     * @param {number} tu - Master Scale value.
     * @param {Object} epoch - Epoch object with ruler config.
     * @param {boolean} [exact=false] 
     * @returns {string} Formatted epoch-relative label.
     */
    formatEpochLabel(tu, epoch, exact = false) {
        if (!epoch) return '';

        const factor = this.getEpochConversionFactor(epoch);
        const localTU = tu - epoch.start_tu;
        const localValue = localTU / factor + 1; // Year 1 is the first year

        const pptu = state.pixelsPerTU;
        let displayValue;

        if (exact) {
             displayValue = (localValue % 1 !== 0) 
                ? localValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : Math.round(localValue).toLocaleString();
        } else if (pptu > 50) {
            displayValue = localValue.toFixed(1);
        } else if (pptu > 5) {
            displayValue = Math.round(localValue).toLocaleString();
        } else {
            const absVal = Math.abs(localValue) || 1;
            const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(absVal)) - 1));
            displayValue = (Math.round(localValue / magnitude) * magnitude).toLocaleString();
        }

        const abbrev = epoch.abbreviation || epoch.id || '';
        return `${displayValue} ${abbrev}`;
    }

    /**
     * Calculate tick positions for the master ruler (Solar).
     */
    calculateRulerTicks(viewportWidth, systemId) {
        const pptu = state.pixelsPerTU;
        const { start, end } = state.visibleTimeRange;
        
        // Generous buffer so ticks extend well past the viewport edges
        const bufferTU = 2000 / pptu;
        const bufferStart = start - bufferTU;
        const bufferEnd = end + bufferTU;
        
        const range = bufferEnd - bufferStart;
        if (range <= 0) return { majorInterval: 1, minorInterval: 0.1, ticks: [] };

        // Target ~200 pixels between major ticks
        const targetPixels = 200;
        const rawInterval = targetPixels / pptu;

        const majorInterval = this._snapToNiceNumber(rawInterval);
        const minorInterval = majorInterval / 5;

        const ticks = [];
        const firstMajor = Math.ceil(bufferStart / majorInterval) * majorInterval;
        const firstMinor = Math.ceil(bufferStart / minorInterval) * minorInterval;

        for (let tu = firstMinor; tu <= bufferEnd; tu += minorInterval) {
            const isMajor = Math.abs(tu % majorInterval) < (minorInterval * 0.1);
            if (!isMajor) {
                ticks.push({ tu, label: '', isMajor: false });
            }
        }

        for (let tu = firstMajor; tu <= bufferEnd; tu += majorInterval) {
            ticks.push({
                tu,
                label: this.formatDateLabel(tu, systemId),
                isMajor: true,
            });
        }

        return { 
            majorInterval, 
            minorInterval, 
            ticks: ticks.sort((a, b) => a.tu - b.tu) 
        };
    }

    /**
     * Calculate ticks for an epoch-specific ruler.
     * Adapts density to the visible portion of the epoch.
     */
    calculateEpochRulerTicks(viewportWidth, epoch) {
        if (!epoch) return { ticks: [] };

        const pptu = state.pixelsPerTU;
        const visRange = state.visibleTimeRange;
        
        const epochStart = epoch.start_tu;
        const timelineEnd = this.getTimelineExtent().end;
        
        // If this is the latest epoch, extend it well past the viewport
        const sortedEpochs = [...this._epochs].sort((a, b) => a.start_tu - b.start_tu);
        const isLatest = sortedEpochs[sortedEpochs.length - 1].id === epoch.id;
        const epochEnd = (epoch.end_tu !== undefined) ? epoch.end_tu : timelineEnd;
        const effectiveEnd = isLatest ? Math.max(epochEnd, visRange.end + (2000 / pptu)) : epochEnd;

        // Clip to visible range with buffer
        const bufferTU = 1000 / pptu;
        const start = Math.max(visRange.start - bufferTU, epochStart);
        const end = Math.min(visRange.end + bufferTU, effectiveEnd);

        if (start >= end) return { ticks: [] };

        // Calculate the visible portion of this epoch in TU
        const visibleRange = end - start;
        
        // Target ~8-12 major ticks across the visible portion of this epoch
        // This ensures epochs of any width get a readable number of ticks
        const factor = this.getEpochConversionFactor(epoch);
        const rawLocalInterval = (visibleRange / 10) / factor;
        const majorIntervalLocal = this._snapToNiceNumber(rawLocalInterval);

        const majorIntervalTU = majorIntervalLocal * factor;
        const minorIntervalTU = majorIntervalTU / 5;

        // Ensure we don't generate too many ticks (performance guard)
        if (visibleRange / minorIntervalTU > 500) return { ticks: [] };

        const ticks = [];
        const firstMajorTU = Math.ceil((start - epochStart) / majorIntervalTU) * majorIntervalTU + epochStart;
        const firstMinorTU = Math.ceil((start - epochStart) / minorIntervalTU) * minorIntervalTU + epochStart;

        for (let tu = firstMinorTU; tu <= end; tu += minorIntervalTU) {
            const relTU = tu - epochStart;
            const isMajor = Math.abs(relTU % majorIntervalTU) < (minorIntervalTU * 0.1);
            if (!isMajor) {
                ticks.push({ tu, label: '', isMajor: false });
            }
        }

        for (let tu = firstMajorTU; tu <= end; tu += majorIntervalTU) {
            ticks.push({
                tu,
                label: this.formatEpochLabel(tu, epoch),
                isMajor: true,
            });
        }

        return { ticks: ticks.sort((a, b) => a.tu - b.tu) };
    }

    /**
     * Snap a raw interval to a "nice" number (1, 2, 5, 10, 20, 50, ...).
     * @private
     * @param {number} rawInterval
     * @returns {number}
     */
    _snapToNiceNumber(rawInterval) {
        if (rawInterval <= 0) return 1;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
        const normalized = rawInterval / magnitude;
        if (normalized <= 1.5) return 1 * magnitude;
        if (normalized <= 3.5) return 2 * magnitude;
        if (normalized <= 7.5) return 5 * magnitude;
        return 10 * magnitude;
    }
}

/** Singleton instance */
const temporalEngine = new TemporalEngine();
export default temporalEngine;
