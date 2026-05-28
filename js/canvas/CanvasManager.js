/**
 * CanvasManager.js — PixiJS Lifecycle Controller
 * Last Modified: 2026-05-15
 *
 * Owns the PixiJS Application, manages render layers,
 * handles zoom/pan input, and drives the render loop.
 */

import { Application, Container, Graphics, Text, TextStyle, BlurFilter, FillGradient } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';
import measureTool from './MeasureTool.js';

/**
 * @class CanvasManager
 * @description Manages the PixiJS application lifecycle, layer ordering,
 *              zoom/pan interactions, and the render loop.
 */
class CanvasManager {
    constructor() {
        /** @type {Application|null} */
        this.app = null;

        // ── Render Layers (back-to-front) ──
        /** @type {Container} */
        this.epochLayer = new Container();
        /** @type {Container} */
        this.laneLayer = new Container();
        /** @type {Container} */
        this.splineLayer = new Container();
        /** @type {Container} */
        this.eventLayer = new Container();
        /** @type {Container} */
        this.uiOverlayLayer = new Container();

        /** @type {Container} World container that gets zoomed/panned */
        this.worldContainer = new Container();

        // ── Pan state ──
        this._isPanning = false;
        this._panStartX = 0;
        this._panStartY = 0;
        this._panStartOffsetX = 0;
        this._panStartOffsetY = 0;

        // ── Measure state ──
        this._isMeasuring = false;

        // ── Dirty flag ──
        this._dirty = true;

        // ── Bound handlers (named for cleanup) ──
        this._handleWheel = this._onWheel.bind(this);
        this._handlePointerDown = this._onPointerDown.bind(this);
        this._handlePointerMove = this._onPointerMove.bind(this);
        this._handlePointerUp = this._onPointerUp.bind(this);
        this._handleResize = this._onResize.bind(this);
        this._markDirty = () => { this._dirty = true; };
    }

    /**
     * Initialize PixiJS and mount to the DOM.
     * @param {HTMLElement} container - The DOM element to mount the canvas in.
     */
    async init(container) {
        this.app = new Application();

        await this.app.init({
            backgroundAlpha: 0,
            resizeTo: container,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        container.appendChild(this.app.canvas);

        // Layer ordering
        this.worldContainer.addChild(this.epochLayer);
        this.worldContainer.addChild(this.laneLayer);
        this.worldContainer.addChild(this.splineLayer);
        this.worldContainer.addChild(this.eventLayer);
        this.app.stage.addChild(this.worldContainer);
        this.app.stage.addChild(this.uiOverlayLayer);

        // Ensure background layers don't intercept events
        this.epochLayer.eventMode = 'none';
        this.laneLayer.eventMode = 'none';
        this.splineLayer.eventMode = 'none';
        this.eventLayer.eventMode = 'passive'; // Pass through to children

        // Store initial viewport size
        state.setViewportSize(container.clientWidth, container.clientHeight);

        // Set up input handlers
        this.app.canvas.addEventListener('wheel', this._handleWheel, { passive: false });
        this.app.canvas.addEventListener('pointerdown', this._handlePointerDown);
        window.addEventListener('pointermove', this._handlePointerMove);
        window.addEventListener('pointerup', this._handlePointerUp);
        window.addEventListener('resize', this._handleResize);

        // Use Pixi's interaction manager for the cursor to avoid DOM style conflicts
        this.app.renderer.events.cursorStyles.default = 'grab';

        // Listen for dirty flag
        bus.on(Events.RENDER_DIRTY, this._markDirty);

        // Listen for measure tool toggle
        bus.on(Events.MEASURE_TOGGLED, ({ active }) => {
            this._isMeasuring = active;
            if (active) {
                this.app.renderer.events.cursorStyles.default = 'crosshair';
                this.app.canvas.style.cursor = 'crosshair';
            } else {
                this.app.renderer.events.cursorStyles.default = 'grab';
                this.app.canvas.style.cursor = 'grab';
            }
        });

        // Initialize measure tool
        measureTool.init(this.uiOverlayLayer);

        // Start render loop
        this.app.ticker.add(this._renderLoop, this);
    }

    // ─── Render Loop ────────────────────────────────────

    /**
     * Main render loop. Only re-renders when dirty.
     * @private
     */
    _renderLoop() {
        if (!this._dirty) return;
        this._dirty = false;

        const panOffset = state.panOffset;
        this.worldContainer.x = panOffset.x;
        this.worldContainer.y = panOffset.y;

        // Notify renderers to update
        this._renderEpochBackgrounds();
    }

    // ─── Epoch Background Rendering ─────────────────────

    /**
     * Render colored epoch background regions.
     * @private
     */
    _renderEpochBackgrounds() {
        this.epochLayer.removeChildren();

        const epochs = temporalEngine.getEpochs();
        if (epochs.length === 0) return;

        const screenHeight = this.app.screen.height;

        // 1. Draw backgrounds first
        for (const epoch of epochs) {
            const x1 = temporalEngine.tuToPixel(epoch.start_tu);
            const x2 = temporalEngine.tuToPixel(epoch.end_tu !== undefined ? epoch.end_tu : epoch.start_tu + 1000);
            const width = x2 - x1;

            if (width < 0.5) continue;

            const gfx = new Graphics();
            const color = epoch.color ? parseInt(epoch.color.replace('#', ''), 16) : 0xdfd0bb;

            gfx.rect(x1, 0, width, screenHeight);
            gfx.fill({ color, alpha: 0.15 });
            gfx.eventMode = 'none';
            this.epochLayer.addChild(gfx);

            // 2. Draw division line at the start of epoch
            const line = new Graphics();
            line.moveTo(x1, 0);
            line.lineTo(x1, screenHeight);
            line.stroke({ width: 1, color: 0x2c251c, alpha: 0.15 });
            line.eventMode = 'none';
            this.epochLayer.addChild(line);
        }

        // 3. Draw labels on top of everything
        for (const epoch of epochs) {
            const x1 = temporalEngine.tuToPixel(epoch.start_tu);
            const x2 = temporalEngine.tuToPixel(epoch.end_tu !== undefined ? epoch.end_tu : epoch.start_tu + 1000);
            const width = x2 - x1;

            if (width > 120) {
                const label = new Text({
                    text: epoch.label || epoch.id,
                    style: new TextStyle({
                        fontFamily: '"Cinzel Decorative", serif',
                        fontSize: Math.min(18, width * 0.08),
                        fill: '#2c251c', // Dark ink color for better readability on parchment
                        align: 'center',
                        fontWeight: '700'
                    }),
                });
                label.x = x1 + width / 2;
                label.y = 5; // Pinned directly under rulers
                label.anchor.set(0.5, 0);
                label.alpha = 0.25;
                label.eventMode = 'none';
                this.epochLayer.addChild(label);
            }
        }
    }

    // ─── Zoom Handling ──────────────────────────────────

    /**
     * Handle mouse wheel for zooming.
     * @private
     * @param {WheelEvent} e
     */
    _onWheel(e) {
        e.preventDefault();
        const delta = -e.deltaY;
        const currentZoom = state.zoom;
        const panX = state.panOffset.x;
        const pptu = state.pixelsPerTU;

        // Target zoom factor
        const zoomFactor = 1 + delta * 0.001;
        const newZoom = currentZoom * zoomFactor;

        // Calculate mouse world position before zoom
        // This is the "target" TU that should stay under the mouse
        const mouseWorldX = (e.clientX - panX) / pptu;
        
        // Apply zoom change
        state.setZoomX(newZoom);
        
        // Recalculate pan to keep world position under mouse stable
        const newPPTU = state.pixelsPerTU;
        const newPanX = e.clientX - (mouseWorldX * newPPTU);

        state.setPan(newPanX, state.panOffset.y);
    }

    // ─── Pan Handling ───────────────────────────────────

    /**
     * @private
     * @param {PointerEvent} e
     */
    _onPointerDown(e) {
        if (e.button !== 0) return; // Left click only
        
        if (this._isMeasuring) {
            measureTool.onPointerDown(e, this);
            return;
        }

        this._isPanning = true;
        this._panStartX = e.clientX;
        this._panStartY = e.clientY;
        this._panStartOffsetX = state.panOffset.x;
        this._panStartOffsetY = state.panOffset.y;
        this.app.renderer.events.cursorStyles.default = 'grabbing';
    }

    /**
     * @private
     * @param {PointerEvent} e
     */
    _onPointerMove(e) {
        if (this._isMeasuring && measureTool.isDragging) {
            measureTool.onPointerMove(e, this);
            return;
        }
        
        if (!this._isPanning) return;
        const dx = e.clientX - this._panStartX;
        const dy = e.clientY - this._panStartY;
        state.setPan(
            this._panStartOffsetX + dx,
            this._panStartOffsetY + dy
        );
    }

    /**
     * @private
     */
    _onPointerUp(e) {
        if (this._isMeasuring && measureTool.isDragging) {
            measureTool.onPointerUp(e, this);
            return;
        }

        if (this._isPanning) {
            this._isPanning = false;
            if (this.app) {
                this.app.renderer.events.cursorStyles.default = 'grab';
            }
        }
    }

    // ─── Resize Handling ────────────────────────────────

    /**
     * @private
     */
    _onResize() {
        if (!this.app) return;
        
        const container = document.getElementById('canvas-container');
        if (!container) return;

        const w = container.clientWidth;
        const h = container.clientHeight;

        state.setViewportSize(w, h);
        this.app.renderer.resize(w, h);
        this._markDirty();
    }

    // ─── Cleanup ────────────────────────────────────────

    /**
     * Destroy the PixiJS app and remove all listeners.
     */
    destroy() {
        if (this.app) {
            this.app.canvas.removeEventListener('wheel', this._handleWheel);
            this.app.canvas.removeEventListener('pointerdown', this._handlePointerDown);
            window.removeEventListener('pointermove', this._handlePointerMove);
            window.removeEventListener('pointerup', this._handlePointerUp);
            window.removeEventListener('resize', this._handleResize);
            bus.off(Events.RENDER_DIRTY, this._markDirty);
            this.app.destroy(true);
            this.app = null;
        }
    }
}

/** Singleton instance */
const canvasManager = new CanvasManager();
export default canvasManager;
