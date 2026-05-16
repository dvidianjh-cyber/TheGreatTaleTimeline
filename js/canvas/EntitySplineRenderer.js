/**
 * EntitySplineRenderer.js — Bézier Spline Migration Paths
 * Last Modified: 2026-05-15
 *
 * Renders entity lifespans as flowing spline paths across geographic lanes.
 * Uses Catmull-Rom → Cubic Bézier conversion for smooth curves.
 */

import { Container, Graphics } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';
import dataStore from '../data/DataStore.js';
import laneRenderer from './LaneRenderer.js';

class EntitySplineRenderer {
    constructor() {
        /** @type {Container|null} */
        this._container = null;

        this._handleRender = this._render.bind(this);
    }

    /**
     * Initialize with the splineLayer container.
     * @param {Container} container
     */
    init(container) {
        this._container = container;
        bus.on(Events.RENDER_DIRTY, this._handleRender);
        bus.on(Events.DATA_LOADED, this._handleRender);
    }

    /**
     * Render splines for all visible entities.
     * @private
     */
    _render() {
        if (!this._container) return;
        this._container.removeChildren();

        if (!dataStore.hasData || state.viewMode !== 'geographic') return;

        for (const entity of dataStore.entities) {
            if (!state.visibleEntities.has(entity.id)) continue;

            const events = dataStore.getEventsByEntity(entity.id);
            if (events.length < 2) continue;

            this._renderEntitySpline(entity, events);
        }
    }

    /**
     * Render a single entity's migration spline.
     * @private
     * @param {Object} entity
     * @param {Array<Object>} events - Sorted by start time
     */
    _renderEntitySpline(entity, events) {
        const color = entity.metadata && entity.metadata.color
            ? parseInt(entity.metadata.color.replace('#', ''), 16)
            : 0x73675a;

        // Build waypoints: (x, y) from each event's time and lane
        const rawPoints = [];

        // Start of lifespan
        if (entity.lifespan && entity.lifespan.start_tu !== undefined) {
            const firstEvent = events[0];
            const startX = temporalEngine.tuToPixel(entity.lifespan.start_tu);
            const startY = laneRenderer.getLaneY(firstEvent.lane_id);
            rawPoints.push({ x: startX, y: startY });
        }

        for (const evt of events) {
            if (!evt.lane_id) continue;
            const x = temporalEngine.tuToPixel(evt.time_extent.start);
            const y = laneRenderer.getLaneY(evt.lane_id);
            rawPoints.push({ x, y });
        }

        // End of lifespan (death or departure or active)
        if (entity.lifespan) {
            const endTU = entity.lifespan.death_tu || entity.lifespan.departure_tu;
            const lastEvent = events[events.length - 1];
            if (endTU !== undefined) {
                const endX = temporalEngine.tuToPixel(endTU);
                const endY = laneRenderer.getLaneY(lastEvent.lane_id);
                rawPoints.push({ x: endX, y: endY });
            } else {
                // Immortal persistence — extend to right edge
                const extent = temporalEngine.getTimelineExtent();
                const endX = temporalEngine.tuToPixel(extent.end);
                const endY = laneRenderer.getLaneY(lastEvent.lane_id);
                rawPoints.push({ x: endX, y: endY });
            }
        }

        // Sort by X to ensure monotonic spline (no backward loops)
        rawPoints.sort((a, b) => a.x - b.x);

        // Deduplicate very close X positions (within 2px) — keep last (most recent lane position)
        const waypoints = [];
        for (let i = 0; i < rawPoints.length; i++) {
            if (waypoints.length > 0 && Math.abs(rawPoints[i].x - waypoints[waypoints.length - 1].x) < 2) {
                waypoints[waypoints.length - 1] = rawPoints[i]; // Replace with newer position
            } else {
                waypoints.push(rawPoints[i]);
            }
        }

        if (waypoints.length < 2) return;

        // Draw the spline
        const gfx = new Graphics();
        gfx.moveTo(waypoints[0].x, waypoints[0].y);

        if (waypoints.length === 2) {
            // Simple line
            gfx.lineTo(waypoints[1].x, waypoints[1].y);
        } else {
            // Monotonic piecewise cubic Hermite interpolation
            // This prevents the overshoot and loops of standard Catmull-Rom
            for (let i = 0; i < waypoints.length - 1; i++) {
                const p1 = waypoints[i];
                const p2 = waypoints[i + 1];
                const segLen = p2.x - p1.x;

                // Tangent at p1 (finite-difference, clamped to prevent overshoot)
                let tx1 = 0, ty1 = 0;
                if (i > 0) {
                    const p0 = waypoints[i - 1];
                    tx1 = (p2.x - p0.x) * 0.5;
                    ty1 = (p2.y - p0.y) * 0.5;
                } else {
                    tx1 = segLen;
                    ty1 = p2.y - p1.y;
                }

                // Tangent at p2
                let tx2 = 0, ty2 = 0;
                if (i < waypoints.length - 2) {
                    const p3 = waypoints[i + 2];
                    tx2 = (p3.x - p1.x) * 0.5;
                    ty2 = (p3.y - p1.y) * 0.5;
                } else {
                    tx2 = segLen;
                    ty2 = p2.y - p1.y;
                }

                // Scale tangents to segment length to avoid loops
                const scale1 = Math.min(1, segLen / (Math.abs(tx1) + 0.001));
                const scale2 = Math.min(1, segLen / (Math.abs(tx2) + 0.001));

                const cp1x = p1.x + tx1 * scale1 / 3;
                const cp1y = p1.y + ty1 * scale1 / 3;
                const cp2x = p2.x - tx2 * scale2 / 3;
                const cp2y = p2.y - ty2 * scale2 / 3;

                gfx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
        }

        gfx.stroke({ width: 2, color, alpha: 0.6 });
        this._container.addChild(gfx);
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.RENDER_DIRTY, this._handleRender);
        bus.off(Events.DATA_LOADED, this._handleRender);
    }
}

const entitySplineRenderer = new EntitySplineRenderer();
export default entitySplineRenderer;
