/**
 * EventNodeRenderer.js — Event Nodes with Temporal Fuzziness
 * Last Modified: 2026-05-15
 *
 * Renders events as visual nodes on the canvas.
 * Point events = circles, range events = bars.
 * Approximate events get a gradient "mist" blur effect.
 */

import { Container, Graphics, Text, TextStyle, BlurFilter, Rectangle, Circle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';
import dataStore from '../data/DataStore.js';
import laneRenderer from './LaneRenderer.js';

/** Event type → color mapping */
const TYPE_COLORS = {
    battle: 0xcc4444,
    war: 0x991111,
    catastrophe: 0xff6633,
    creation: 0x44cc88,
    birth: 0x66aaff,
    death: 0x8855aa,
    migration: 0x44aacc,
    political: 0xccaa44,
    founding: 0x55bb77,
    quest: 0xddaa33,
    default: 0x6a7482,
};

class EventNodeRenderer {
    constructor() {
        /** @type {Container|null} */
        this._container = null;

        /** @type {Map<string, Container>} Event ID → node container */
        this._nodeMap = new Map();

        this._handleRender = this._render.bind(this);
    }

    /**
     * Initialize with the eventLayer container.
     * @param {Container} container
     */
    init(container) {
        this._container = container;
        bus.on(Events.RENDER_DIRTY, this._handleRender);
        bus.on(Events.DATA_LOADED, this._handleRender);
    }

    /**
     * Render all visible events.
     * @private
     */
    _render() {
        if (!this._container) return;
        this._container.removeChildren();
        this._nodeMap.clear();

        if (!dataStore.hasData) return;

        const { start: rangeStart, end: rangeEnd } = state.visibleTimeRange;
        const events = dataStore.getEventsInRange(rangeStart, rangeEnd);
        const panX = state.panOffset.x;
        const panY = state.panOffset.y;
        const threshold = state.importanceThreshold;

        for (const evt of events) {
            // Filter by importance
            if ((evt.importance || 5) < threshold) continue;

            // Filter by lane visibility
            if (evt.lane_id && !state.visibleLanes.has(evt.lane_id)) continue;

            const node = this._createEventNode(evt);
            if (node) {
                this._container.addChild(node);
                this._nodeMap.set(evt.id, node);
            }
        }
    }

    /**
     * Create a visual node for an event.
     * @private
     * @param {Object} evt
     * @param {number} panX
     * @param {number} panY
     * @returns {Container}
     */
    _createEventNode(evt) {
        const startX = temporalEngine.tuToPixel(evt.time_extent.start);
        const endX = temporalEngine.tuToPixel(evt.time_extent.end);
        
        // Staggered vertical positioning based on sub_area
        const laneTopY = laneRenderer.getLaneTopY(evt.lane_id);
        const laneHeight = 80 * state.zoomY;
        
        // Defensive check: ensure we pick up the sub_area from all possible schema locations
        const subArea = evt.sub_area || (evt.metadata && evt.metadata.sub_area) || 'default';
        const subIndex = dataStore.getSubAreaIndex(evt.lane_id, subArea);
        const subCount = Math.max(1, dataStore.getSubAreaCount(evt.lane_id));
        
        // Slot distribution: (index + 1) / (count + 1) to avoid top/bottom edges
        // Or (index + 0.5) / count for centered slots
        const verticalRatio = (subIndex + 0.5) / subCount;
        const laneY = laneTopY + (verticalRatio * laneHeight);

        const container = new Container();
        container.eventMode = 'static';
        container.cursor = 'pointer';
        container.position.set(startX, laneY);

        const isRange = (endX - startX) > 3;
        const color = TYPE_COLORS[evt.type] || TYPE_COLORS.default;
        const importance = evt.importance === 0 ? 10 : (evt.importance || 5); // Treat 0 as "Special/Always Visible"
        const radius = (3 + importance * 1.2) * 0.4;

        const gfx = new Graphics();

        if (isRange) {
            // Range event → horizontal bar
            const width = endX - startX;
            const barHeight = radius * 1.5;
            gfx.roundRect(0, -barHeight / 2, width, barHeight, 3);
            gfx.fill({ color, alpha: 0.7 });
            gfx.stroke({ width: 1, color, alpha: 0.9 });
        } else {
            // Point event → circle
            gfx.circle(0, 0, radius);
            gfx.fill({ color, alpha: 0.8 });
            gfx.stroke({ width: 1.5, color: 0x2c251c, alpha: 0.3 });
        }

        container.addChild(gfx);

        // Temporal fuzziness
        if (evt.time_extent.is_approximate) {
            const mistGfx = new Graphics();
            const mistRadius = radius * 2.5;
            mistGfx.circle(0, 0, mistRadius);
            mistGfx.fill({ color, alpha: 0.15 });
            mistGfx.filters = [new BlurFilter({ strength: 8 })];
            container.addChildAt(mistGfx, 0);
        }

        // Event label
        const pptu = state.pixelsPerTU;
        // Logic: Importance 0 (mapped to 10) is always visible. 
        // High importance (8+) visible at low zoom. 
        // Normal visible only when zoomed in.
        const shouldShowLabel = (evt.importance === 0) || (pptu > 0.3) || (importance >= 8 && pptu > 0.05);

        if (shouldShowLabel) {
            const label = new Text({
                text: evt.title || '',
                style: new TextStyle({
                    fontFamily: '"Kalam", cursive, sans-serif',
                    fontSize: 13 * state.baseFontSize,
                    fill: '#2c251c',
                    fontWeight: (evt.importance === 0 || importance >= 9) ? '700' : '400',
                    wordWrap: true,
                    wordWrapWidth: 150,
                }),
            });
            label.x = isRange ? 4 : radius + 4;
            label.y = -6;
            
            // Fixed: Opacity should NOT be 0 when zoomed out if it should be shown
            // coupling with importance to boost visibility
            const baseAlpha = (evt.importance === 0) ? 1.0 : Math.min(1, pptu * 3);
            label.alpha = Math.max(baseAlpha, (importance - 5) / 5); 
            
            container.addChild(label);
        }

        // ── Hit Area & Interaction ──
        // Define a fixed hitArea relative to the container origin (0,0)
        const hitPadding = 4;
        if (isRange) {
            const width = endX - startX;
            const barHeight = radius * 1.5;
            container.hitArea = new Rectangle(
                -hitPadding,
                -barHeight / 2 - hitPadding,
                width + hitPadding * 2,
                barHeight + hitPadding * 2
            );
        } else {
            const hitR = radius + hitPadding;
            container.hitArea = new Circle(0, 0, hitR);
        }

        container.on('pointerover', () => {
            gsap.to(gfx.scale, { x: 1.2, y: 1.2, duration: 0.15, ease: 'power2.out' });
            gsap.to(gfx, { alpha: 1, duration: 0.15 });
            // Emit screen coordinates for the DOM tooltip
            bus.emit(Events.TOOLTIP_SHOW, {
                event: evt,
                x: startX + state.panOffset.x,
                y: laneY + state.panOffset.y
            });
        });

        container.on('pointerout', () => {
            gsap.to(gfx.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.out' });
            gsap.to(gfx, { alpha: 0.8, duration: 0.15 });
            bus.emit(Events.TOOLTIP_HIDE);
        });

        container.on('pointertap', () => {
            state.selectEvent(evt.id);
        });

        return container;
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.RENDER_DIRTY, this._handleRender);
        bus.off(Events.DATA_LOADED, this._handleRender);
    }
}

const eventNodeRenderer = new EventNodeRenderer();
export default eventNodeRenderer;
