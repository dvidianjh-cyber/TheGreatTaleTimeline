/**
 * PrologueRenderer.js — Toggleable "Great Void" Mist Region
 * Last Modified: 2026-05-15
 *
 * Renders the pre-Lamps decorative region as an animated mist effect.
 * Toggled via the display settings flyout.
 */

import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';

/** Width of the prologue region in TU (before T₀) */
const PROLOGUE_WIDTH_TU = 2000;

class PrologueRenderer {
    constructor() {
        /** @type {Container|null} */
        this._container = null;

        /** @type {Container} */
        this._prologueContainer = new Container();

        /** @type {number} Animation frame counter */
        this._frame = 0;

        this._handleRender = this._render.bind(this);
        this._handleToggle = this._onToggle.bind(this);
    }

    /**
     * Initialize with the epoch layer container.
     * @param {Container} container
     */
    init(container) {
        this._container = container;
        bus.on(Events.RENDER_DIRTY, this._handleRender);
        bus.on(Events.PROLOGUE_TOGGLED, this._handleToggle);
    }

    /**
     * @private
     */
    _onToggle({ show }) {
        this._prologueContainer.visible = show;
        bus.emit(Events.RENDER_DIRTY);
    }

    /**
     * Render the prologue mist region.
     * @private
     */
    _render() {
        // Remove previous prologue content
        this._prologueContainer.removeChildren();

        if (!state.showPrologue) {
            this._prologueContainer.visible = false;
            return;
        }

        this._prologueContainer.visible = true;
        this._frame++;

        const panX = state.panOffset.x;
        const panY = state.panOffset.y;
        const screenHeight = state.viewportHeight;

        // Prologue region extends from -PROLOGUE_WIDTH_TU to 0
        const x1 = temporalEngine.tuToPixel(-PROLOGUE_WIDTH_TU);
        const x2 = temporalEngine.tuToPixel(0);
        const width = x2 - x1;

        if (width < 1 || x2 < -50) return;

        // Base dark void
        const voidGfx = new Graphics();
        voidGfx.rect(x1, -panY, width, screenHeight);
        voidGfx.fill({ color: 0xe8dcc8, alpha: 0.85 });
        this._prologueContainer.addChild(voidGfx);

        // Animated mist particles
        const numParticles = Math.min(30, Math.max(5, Math.floor(width / 20)));
        for (let i = 0; i < numParticles; i++) {
            const seed = i * 137.508; // Golden angle
            const px = x1 + (width * ((seed + this._frame * 0.3) % width)) / width;
            const py = -panY + (screenHeight * ((seed * 2.1 + this._frame * 0.15) % screenHeight)) / screenHeight;
            const radius = 15 + Math.sin(seed + this._frame * 0.02) * 10;
            const alpha = 0.04 + Math.sin(seed * 0.7 + this._frame * 0.01) * 0.03;

            const particle = new Graphics();
            particle.circle(px, py, radius);
            particle.fill({ color: 0x2a5a8a, alpha });
            this._prologueContainer.addChild(particle);
        }

        // Gradient fade from void → first epoch
        const fadeWidth = Math.min(80, width * 0.3);
        const fadeGfx = new Graphics();
        fadeGfx.rect(x2 - fadeWidth, -panY, fadeWidth, screenHeight);
        fadeGfx.fill({ color: 0xf4ecdf, alpha: 0.5 });
        this._prologueContainer.addChild(fadeGfx);

        // Label
        if (width > 120) {
            const label = new Text({
                text: 'The Great Void',
                style: new TextStyle({
                    fontFamily: '"Cinzel Decorative", serif',
                    fontSize: Math.min(20, width * 0.08),
                    fill: '#2a5a8a',
                    fontStyle: 'italic',
                }),
            });
            label.anchor.set(0.5);
            label.x = x1 + width / 2;
            label.y = -panY + screenHeight / 2;
            label.alpha = 0.4;
            this._prologueContainer.addChild(label);
        }

        // Add to parent if not already
        if (!this._prologueContainer.parent) {
            this._container.addChildAt(this._prologueContainer, 0);
        }
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.RENDER_DIRTY, this._handleRender);
        bus.off(Events.PROLOGUE_TOGGLED, this._handleToggle);
    }
}

const prologueRenderer = new PrologueRenderer();
export default prologueRenderer;
