/**
 * LoDClusterEngine.js — Level-of-Detail Clustering
 * Last Modified: 2026-05-15
 *
 * At low zoom levels, nearby events collapse into "Summary Nodes"
 * to maintain 60fps performance. Uses spatial grid bucketing.
 */

import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';

/** Minimum pixels-per-TU before clustering kicks in */
const CLUSTER_THRESHOLD = 0.08;

/** Grid bucket size in pixels */
const BUCKET_SIZE = 40;

class LoDClusterEngine {
    constructor() {
        /** @type {boolean} Whether clustering is currently active */
        this._active = false;
    }

    /**
     * Check if clustering should be active at the current zoom level.
     * @returns {boolean}
     */
    get isActive() {
        return state.pixelsPerTU < CLUSTER_THRESHOLD;
    }

    /**
     * Cluster a set of positioned event nodes into summary groups.
     * @param {Array<{ x: number, y: number, event: Object }>} nodes
     * @returns {Array<{ x: number, y: number, events: Array<Object>, count: number }>}
     */
    clusterNodes(nodes) {
        if (!this.isActive) return null; // No clustering needed

        /** @type {Map<string, { sumX: number, sumY: number, events: Array, count: number }>} */
        const buckets = new Map();

        for (const node of nodes) {
            const bucketKey = `${Math.floor(node.x / BUCKET_SIZE)}_${Math.floor(node.y / BUCKET_SIZE)}`;

            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, { sumX: 0, sumY: 0, events: [], count: 0 });
            }

            const bucket = buckets.get(bucketKey);
            bucket.sumX += node.x;
            bucket.sumY += node.y;
            bucket.events.push(node.event);
            bucket.count++;
        }

        const clusters = [];
        for (const [, bucket] of buckets) {
            clusters.push({
                x: bucket.sumX / bucket.count,
                y: bucket.sumY / bucket.count,
                events: bucket.events,
                count: bucket.count,
            });
        }

        return clusters;
    }

    /**
     * Render a cluster summary node.
     * @param {Container} container - PixiJS container to add to
     * @param {{ x: number, y: number, count: number, events: Array }} cluster
     * @returns {Container}
     */
    renderClusterNode(container, cluster) {
        const group = new Container();
        const radius = Math.min(20, 8 + cluster.count * 0.8);

        // Cluster circle
        const gfx = new Graphics();
        gfx.circle(cluster.x, cluster.y, radius);
        gfx.fill({ color: 0x2a5a8a, alpha: 0.6 });
        gfx.stroke({ width: 2, color: 0x6a7482, alpha: 0.8 });
        group.addChild(gfx);

        // Count badge
        const badge = new Text({
            text: `${cluster.count}`,
            style: new TextStyle({
                fontFamily: '"Kalam", cursive, sans-serif',
                fontSize: Math.max(10, Math.min(14, radius * 0.9)) * state.baseFontSize,
                fill: '#f4ecdf',
                fontWeight: '700',
            }),
        });
        badge.anchor.set(0.5);
        badge.x = cluster.x;
        badge.y = cluster.y;
        group.addChild(badge);

        // Interaction
        group.eventMode = 'static';
        group.cursor = 'pointer';
        group.on('pointertap', () => {
            // Zoom in to expand the cluster
            const avgTU = cluster.events.reduce((sum, e) =>
                sum + e.time_extent.start, 0) / cluster.count;
            // Emit a zoom request centered on this cluster
            bus.emit(Events.ZOOM_CHANGED, {
                zoom: state.zoom * 3,
                centerTU: avgTU,
            });
        });

        container.addChild(group);
        return group;
    }
}

const lodClusterEngine = new LoDClusterEngine();
export default lodClusterEngine;
