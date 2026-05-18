/**
 * RulerRenderer.js — Elastic Ruler Sticky Headers
 * Last Modified: 2026-05-15
 *
 * Renders adaptive time rulers as DOM elements (not on canvas)
 * for crisp text at all zoom levels.
 * - Solar Year row: always visible (baseline)
 * - Epoch ruler rows: togglable per-epoch, show dates relative to each epoch
 */

import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';

class RulerRenderer {
    constructor() {
        /** @type {HTMLElement|null} */
        this._container = null;

        /** @type {HTMLElement|null} Solar Year row (always visible) */
        this._solarRow = null;

        /** @type {Map<string, HTMLElement>} Epoch ID → ruler row element */
        this._epochRows = new Map();

        // ── Bound handlers ──
        this._handleRender = this._render.bind(this);
        this._handleEpochRulerChange = this._rebuildRows.bind(this);
    }

    /**
     * Initialize and mount into a container element.
     * @param {HTMLElement} container
     */
    init(container) {
        this._container = container;
        this._container.classList.add('ruler-strip');

        bus.on(Events.RENDER_DIRTY, this._handleRender);
        bus.on(Events.ZOOM_CHANGED, this._handleRender);
        bus.on(Events.PAN_CHANGED, this._handleRender);
        bus.on(Events.EPOCH_RULER_CHANGED, this._handleEpochRulerChange);
        bus.on(Events.RULER_SYSTEM_CHANGED, this._handleRender);
        bus.on(Events.DATA_LOADED, this._rebuildRows.bind(this));
    }

    /**
     * Rebuild ruler rows: Solar Year + active epoch rulers.
     * @private
     */
    _rebuildRows() {
        this._container.innerHTML = '';
        this._epochRows.clear();

        // ── Solar Year row (always present) ──
        this._solarRow = this._createRulerRow('Solar Year', 'solar');
        this._container.appendChild(this._solarRow);

        // ── Epoch ruler rows ──
        const activeRulers = state.activeEpochRulers;
        const epochs = temporalEngine.getEpochs();

        for (const epoch of epochs) {
            if (!activeRulers.has(epoch.id)) continue;

            const label = epoch.label || epoch.name || epoch.id;
            const row = this._createRulerRow(label, epoch.id);
            row.dataset.epochId = epoch.id;
            row.classList.add('ruler-row--epoch');
            this._container.appendChild(row);
            this._epochRows.set(epoch.id, row);
        }

        this._render();
    }

    /**
     * Create a ruler row DOM element.
     * @private
     * @param {string} label
     * @param {string} id
     * @returns {HTMLElement}
     */
    _createRulerRow(label, id) {
        const row = document.createElement('div');
        row.className = 'ruler-row';
        row.dataset.system = id;

        const labelEl = document.createElement('span');
        labelEl.className = 'ruler-label';
        labelEl.textContent = label;
        row.appendChild(labelEl);

        const tickArea = document.createElement('div');
        tickArea.className = 'ruler-tick-area';
        row.appendChild(tickArea);

        return row;
    }

    /**
     * Render tick marks for all ruler rows.
     * @private
     */
    _render() {
        if (!this._container) return;

        // ── Render Solar Year row ──
        if (this._solarRow) {
            this._renderSolarTicks(this._solarRow);
        }

        // ── Render epoch ruler rows ──
        const epochs = temporalEngine.getEpochs();
        for (const [epochId, row] of this._epochRows) {
            const epoch = epochs.find(e => e.id === epochId);
            if (epoch) {
                this._renderEpochTicks(row, epoch);
            }
        }
    }

    /**
     * Render ticks for the Solar Year row.
     * @private
     * @param {HTMLElement} row
     */
    _renderSolarTicks(row) {
        const tickArea = row.querySelector('.ruler-tick-area');
        if (!tickArea) return;

        tickArea.innerHTML = '';

        const { ticks } = temporalEngine.calculateRulerTicks(state.viewportWidth, 'solar');

        for (const tick of ticks) {
            // Subtract 80 to account for the .ruler-tick-area margin-left: 80px
            const x = (temporalEngine.tuToPixel(tick.tu) + state.panOffset.x) - 80;
            
            // Ticks are already buffered by TemporalEngine
            const tickEl = document.createElement('div');
            tickEl.className = tick.isMajor ? 'ruler-tick ruler-tick--major' : 'ruler-tick ruler-tick--minor';
            tickEl.style.left = `${x}px`;

            if (tick.isMajor && tick.label) {
                const labelEl = document.createElement('span');
                labelEl.className = 'ruler-tick-label';
                labelEl.textContent = tick.label;
                tickEl.appendChild(labelEl);
            }

            tickArea.appendChild(tickEl);
        }

        // Epoch color bands on the solar row
        this._renderEpochBands(tickArea);
    }

    /**
     * Render ticks for an epoch-specific ruler row.
     * Only shows ticks within the epoch's time range.
     * @private
     * @param {HTMLElement} row
     * @param {Object} epoch
     */
    _renderEpochTicks(row, epoch) {
        const tickArea = row.querySelector('.ruler-tick-area');
        if (!tickArea) return;

        tickArea.innerHTML = '';

        const { ticks } = temporalEngine.calculateEpochRulerTicks(state.viewportWidth, epoch);

        for (const tick of ticks) {
            // Subtract 80 to account for the .ruler-tick-area margin-left: 80px
            const x = (temporalEngine.tuToPixel(tick.tu) + state.panOffset.x) - 80;
            
            // Render all ticks provided by the engine (which already has buffers)
            const tickEl = document.createElement('div');
            tickEl.className = tick.isMajor ? 'ruler-tick ruler-tick--major' : 'ruler-tick ruler-tick--minor';
            tickEl.style.left = `${x}px`;

            if (tick.isMajor && tick.label) {
                const labelEl = document.createElement('span');
                labelEl.className = 'ruler-tick-label';
                labelEl.textContent = tick.label;
                tickEl.appendChild(labelEl);
            }

            tickArea.appendChild(tickEl);
        }

        // Tint the background of this epoch row with the epoch color
        const epochColor = epoch.color || '#333';
        row.style.borderLeft = `3px solid ${epochColor}`;
    }

    /**
     * Render colored epoch indicator bands in the ruler.
     * @private
     * @param {HTMLElement} tickArea
     */
    _renderEpochBands(tickArea) {
        const epochs = temporalEngine.getEpochs();
        const panX = state.panOffset.x;
        for (const epoch of epochs) {
            // Subtract 80 to account for the .ruler-tick-area margin-left: 80px
            const x1 = (temporalEngine.tuToPixel(epoch.start_tu) + panX) - 80;
            const endTu = epoch.end_tu !== undefined ? epoch.end_tu : epoch.start_tu + 1000;
            const x2 = (temporalEngine.tuToPixel(endTu) + panX) - 80;
            const width = x2 - x1;

            // Large buffer to ensure bands stay visible while panning
            if (x2 < -5000 || x1 > state.viewportWidth + 5000) continue;
            if (width < 1) continue;

            const band = document.createElement('div');
            band.className = 'ruler-epoch-band';
            band.style.left = `${x1}px`;
            band.style.width = `${width}px`;
            band.style.backgroundColor = epoch.color || '#333';
            tickArea.appendChild(band);
        }
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.RENDER_DIRTY, this._handleRender);
        bus.off(Events.ZOOM_CHANGED, this._handleRender);
        bus.off(Events.PAN_CHANGED, this._handleRender);
        bus.off(Events.EPOCH_RULER_CHANGED, this._handleEpochRulerChange);
        bus.off(Events.RULER_SYSTEM_CHANGED, this._handleRender);
        bus.off(Events.DATA_LOADED, this._rebuildRows.bind(this));
    }
}

const rulerRenderer = new RulerRenderer();
export default rulerRenderer;
