/**
 * LaneRenderer.js — Geographic Lane Bands
 * Last Modified: 2026-05-15
 *
 * Renders horizontal Y-axis lane bands for Geographic mode.
 * Handles lane labels, color coding, and "Geographic Erasure".
 */

import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';
import dataStore from '../data/DataStore.js';

/** Height of each lane band in pixels */
const LANE_HEIGHT = 80;

/** Left margin for lane labels */
const LABEL_MARGIN = 12;

class LaneRenderer {
    constructor() {
        /** @type {Container|null} */
        this._container = null;

        /** @type {Map<string, number>} Lane ID → Y position */
        this._lanePositions = new Map();

        this._handleRender = this._render.bind(this);
        this._handleDataLoaded = this._onDataLoaded.bind(this);
    }

    /**
     * Initialize with a PixiJS container (the laneLayer from CanvasManager).
     * @param {Container} container
     */
    init(container) {
        this._container = container;
        bus.on(Events.RENDER_DIRTY, this._handleRender);
        bus.on(Events.DATA_LOADED, this._handleDataLoaded);
    }

    /**
     * @private
     */
    _onDataLoaded() {
        this._calculateLanePositions();
        this._render();
    }

    /**
     * Calculate Y positions for each lane.
     * @private
     */
    _calculateLanePositions() {
        this._lanePositions.clear();
        const lanes = dataStore.lanes
            .filter(l => state.visibleLanes.has(l.id))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const rulerHeight = 60; // Space reserved for the ruler strip
        let y = rulerHeight;
        const currentLaneHeight = 80 * state.zoomY;

        for (const lane of lanes) {
            this._lanePositions.set(lane.id, y);
            y += currentLaneHeight;
        }
    }

    /**
     * Get the Y center position for a given lane.
     * @param {string} laneId
     * @returns {number}
     */
    getLaneY(laneId) {
        const y = this._lanePositions.get(laneId);
        const currentLaneHeight = 80 * state.zoomY;
        return y !== undefined ? y + currentLaneHeight / 2 : 100;
    }

    /**
     * Get the Y top position for a given lane.
     * @param {string} laneId
     * @returns {number}
     */
    getLaneTopY(laneId) {
        return this._lanePositions.get(laneId) || 0;
    }

    /**
     * Get the lane height constant.
     * @returns {number}
     */
    getLaneHeight() {
        return LANE_HEIGHT;
    }

    /**
     * Get all lane positions.
     * @returns {Map<string, number>}
     */
    getPositions() {
        return new Map(this._lanePositions);
    }

    /**
     * Render all visible lanes.
     * @private
     */
    _render() {
        if (!this._container) return;
        if (state.viewMode !== 'geographic') {
            this._container.removeChildren();
            return;
        }

        this._container.removeChildren();
        this._calculateLanePositions();

        const screenWidth = state.viewportWidth;
        const panX = state.panOffset.x;
        const panY = state.panOffset.y;

        const LABEL_MARGIN = 16;

        for (const [laneId, y] of this._lanePositions) {
            const lane = dataStore.getLane(laneId);
            if (!lane) continue;

            const gfx = new Graphics();
            const color = lane.color_hint ? parseInt(lane.color_hint.replace('#', ''), 16) : 0xeaddcb;

            // Lane band — cover the whole range if possible
            const extent = temporalEngine.getTimelineExtent();
            const bandWidth = temporalEngine.tuToPixel(extent.end);
            const currentLaneHeight = 80 * state.zoomY;

            // Main band
            gfx.rect(0, y, bandWidth, currentLaneHeight);
            gfx.fill({ color, alpha: 0.08 });

            // Bottom border line
            gfx.moveTo(0, y + currentLaneHeight);
            gfx.lineTo(bandWidth, y + currentLaneHeight);
            gfx.stroke({ width: 1, color: 0x2c251c, alpha: 0.15 });

            this._container.addChild(gfx);

            // Lane label (sticky to left edge)
            const label = new Text({
                text: lane.label || laneId,
                style: new TextStyle({
                    fontFamily: '"Cinzel Decorative", serif',
                    fontSize: 16 * state.baseFontSize,
                    fill: '#2c251c', // Dark ink
                    fontWeight: '700',
                    letterSpacing: 1,
                }),
            });
            // Counter-pan the label so it stays at screen X = LABEL_MARGIN
            label.x = -panX + LABEL_MARGIN;
            label.y = y + 6;
            label.alpha = 0.7;
            this._container.addChild(label);
        }
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.RENDER_DIRTY, this._handleRender);
        bus.off(Events.DATA_LOADED, this._handleDataLoaded);
    }
}

const laneRenderer = new LaneRenderer();
export default laneRenderer;
