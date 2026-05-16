/**
 * BiographicalRenderer.js — Gantt-Chart Lifespan Mode
 * Last Modified: 2026-05-15
 *
 * Alternative Y-axis mode: each entity gets a horizontal row.
 * Lifespan rendered as a colored bar with event markers.
 */

import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';
import dataStore from '../data/DataStore.js';

const ROW_HEIGHT = 36;
const ROW_GAP = 4;
const BAR_HEIGHT = 20;
const MARKER_RADIUS = 4;
const LABEL_WIDTH = 140;

class BiographicalRenderer {
    constructor() {
        /** @type {Container|null} */
        this._container = null;

        /** @type {string} Sort mode: 'birth' | 'race' | 'duration' | 'alpha' */
        this._sortMode = 'birth';

        this._handleRender = this._render.bind(this);
    }

    /**
     * Initialize with a container (uses the laneLayer + eventLayer from CanvasManager).
     * @param {Container} laneContainer
     * @param {Container} eventContainer
     */
    init(laneContainer, eventContainer) {
        this._laneContainer = laneContainer;
        this._eventContainer = eventContainer;
        bus.on(Events.RENDER_DIRTY, this._handleRender);
        bus.on(Events.DATA_LOADED, this._handleRender);
    }

    /**
     * Set the sort mode for entity rows.
     * @param {'birth' | 'race' | 'duration' | 'alpha'} mode
     */
    setSortMode(mode) {
        this._sortMode = mode;
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * Get sorted entities based on current sort mode.
     * @private
     * @returns {Array<Object>}
     */
    _getSortedEntities() {
        const entities = dataStore.entities.filter(e => state.visibleEntities.has(e.id));

        switch (this._sortMode) {
            case 'birth':
                return entities.sort((a, b) =>
                    (a.lifespan?.start_tu || 0) - (b.lifespan?.start_tu || 0));
            case 'race':
                return entities.sort((a, b) =>
                    (a.metadata?.race || '').localeCompare(b.metadata?.race || ''));
            case 'duration': {
                const getDuration = (e) => {
                    const start = e.lifespan?.start_tu || 0;
                    const end = e.lifespan?.death_tu || e.lifespan?.departure_tu || temporalEngine.getTimelineExtent().end;
                    return end - start;
                };
                return entities.sort((a, b) => getDuration(b) - getDuration(a));
            }
            case 'alpha':
                return entities.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return entities;
        }
    }

    /**
     * Render the biographical Gantt view.
     * @private
     */
    _render() {
        if (state.viewMode !== 'biographical') return;

        // Only render when in biographical mode — the lane/event containers
        // are shared, so we clear and re-render from this renderer.
        if (this._laneContainer) this._laneContainer.removeChildren();
        if (this._eventContainer) this._eventContainer.removeChildren();
        if (!dataStore.hasData) return;

        const panX = state.panOffset.x;
        const panY = state.panOffset.y;
        const entities = this._getSortedEntities();

        const rulerHeight = 60;
        const currentRowHeight = ROW_HEIGHT * state.zoomY;
        const currentRowGap = ROW_GAP * state.zoomY;
        let currentY = rulerHeight;

        for (const entity of entities) {
            this._renderEntityRow(entity, currentY, panX, panY, currentRowHeight);
            currentY += currentRowHeight + currentRowGap;
        }
    }

    /**
     * Render a single entity row (lifespan bar + event markers).
     * @private
     * @param {Object} entity
     * @param {number} rowY
     * @param {number} panX
     * @param {number} panY
     * @param {number} currentRowHeight
     */
    _renderEntityRow(entity, rowY, panX, panY, currentRowHeight) {
        const y = rowY;
        const color = entity.metadata && entity.metadata.color
            ? parseInt(entity.metadata.color.replace('#', ''), 16)
            : 0x73675a;

        // ── Row background ──
        const bgGfx = new Graphics();
        bgGfx.rect(-panX, y, state.viewportWidth, currentRowHeight);
        bgGfx.fill({ color: 0xeaddcb, alpha: 0.3 });
        bgGfx.moveTo(-panX, y + currentRowHeight);
        bgGfx.lineTo(-panX + state.viewportWidth, y + currentRowHeight);
        bgGfx.stroke({ width: 1, color: 0x2c251c, alpha: 0.3 });
        this._laneContainer.addChild(bgGfx);

        // ── Entity name label ──
        const label = new Text({
            text: entity.name || entity.id,
            style: new TextStyle({
                fontFamily: '"Kalam", cursive, sans-serif',
                fontSize: 13 * state.baseFontSize,
                fill: '#2c251c',
                fontWeight: '500',
            }),
        });
        label.x = -panX + 10;
        label.y = y + currentRowHeight / 2;
        label.anchor.set(0, 0.5);
        this._laneContainer.addChild(label);

            // ── Lifespan bar (moved to lane container to avoid any z-order issues with events) ──
            if (entity.lifespan) {
                const startTU = entity.lifespan.start_tu || 0;
                const endTU = entity.lifespan.death_tu || entity.lifespan.departure_tu || temporalEngine.getTimelineExtent().end;

                const barX = temporalEngine.tuToPixel(startTU);
                const barEndX = temporalEngine.tuToPixel(endTU);
                const barWidth = Math.max(2, barEndX - barX);
                const currentBarHeight = BAR_HEIGHT * state.zoomY;

                const barGfx = new Graphics();
                barGfx.roundRect(barX, y + (currentRowHeight - currentBarHeight) / 2, barWidth, currentBarHeight, 4);
                barGfx.fill({ color, alpha: 0.4 });
                barGfx.stroke({ width: 1, color, alpha: 0.7 });
                barGfx.eventMode = 'none';
                this._laneContainer.addChild(barGfx);
            }

            // ── Event markers along the bar ──
            const events = dataStore.getEventsByEntity(entity.id);
            const sortedEvents = [...events].sort((a, b) => {
                const durA = (a.time_extent.end || a.time_extent.start) - a.time_extent.start;
                const durB = (b.time_extent.end || b.time_extent.start) - b.time_extent.start;
                return durB - durA;
            });

            for (const evt of sortedEvents) {
                const startTU = evt.time_extent.start;
                const endTU = evt.time_extent.end || startTU;
                const isRange = endTU > startTU;
                
                const evtX = temporalEngine.tuToPixel(startTU);
                const evtEndX = temporalEngine.tuToPixel(endTU);
                const width = Math.max(10, evtEndX - evtX);
                
                // Create a container for the event marker (identical to Geographic mode)
                const container = new Container();
                container.position.set(evtX, y + currentRowHeight / 2);
                container.eventMode = 'static';
                container.cursor = 'pointer';

                const markerGfx = new Graphics();
                
                if (isRange) {
                    const barH = Math.max(10, MARKER_RADIUS * 2 * state.zoomY);
                    
                    // Visible bar
                    markerGfx.roundRect(0, -barH / 2, width, barH, 4);
                    markerGfx.fill({ color: 0x1a1610, alpha: 0.9 });
                    markerGfx.stroke({ width: 2, color: 0x000000, alpha: 1.0 });
                    
                    // Invisible hit area (slightly larger than the bar)
                    const hitBox = new Graphics();
                    hitBox.rect(0, -currentRowHeight / 2, width, currentRowHeight);
                    hitBox.fill({ color: 0xffffff, alpha: 0.01 });
                    container.addChild(hitBox);
                } else {
                    // Point marker
                    markerGfx.circle(0, 0, MARKER_RADIUS * state.zoomY);
                    markerGfx.fill({ color: 0x1a1610, alpha: 0.95 });
                    markerGfx.stroke({ width: 1.5, color: 0x000000, alpha: 1.0 });
                    
                    // Invisible hit circle
                    const hitCircle = new Graphics();
                    hitCircle.circle(0, 0, MARKER_RADIUS * 2 * state.zoomY);
                    hitCircle.fill({ color: 0xffffff, alpha: 0.01 });
                    container.addChild(hitCircle);
                }

                container.addChild(markerGfx);

                container.on('pointerover', (e) => {
                    bus.emit(Events.TOOLTIP_SHOW, { event: evt, x: e.global.x, y: e.global.y });
                });
                container.on('pointerout', () => {
                    bus.emit(Events.TOOLTIP_HIDE);
                });

                this._eventContainer.addChild(container);
            }
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.RENDER_DIRTY, this._handleRender);
        bus.off(Events.DATA_LOADED, this._handleRender);
    }
}

const biographicalRenderer = new BiographicalRenderer();
export default biographicalRenderer;
