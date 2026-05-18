/**
 * PanelController.js — Panel Orchestration & Toolbar
 * Last Modified: 2026-05-15
 *
 * Controls the toolbar buttons, mode toggle, and panel open/close states.
 * Keyboard shortcuts for common actions.
 */

import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import flyoutPanel from './FlyoutPanel.js';
import dataStore from '../data/DataStore.js';

class PanelController {
    constructor() {
        /** @type {HTMLElement|null} */
        this._toolbar = null;

        this._handleKeyDown = this._onKeyDown.bind(this);
    }

    /**
     * Initialize the toolbar and bind controls.
     * @param {HTMLElement} toolbarElement
     */
    init(toolbarElement) {
        this._toolbar = toolbarElement;
        this._buildToolbar();
        this._attachHandlers();
        window.addEventListener('keydown', this._handleKeyDown);
    }

    /**
     * Build toolbar HTML.
     * @private
     */
    _buildToolbar() {
        this._toolbar.innerHTML = `
                <span class="toolbar-brand">The Great Tale Timeline</span>
                <span class="toolbar-world-name" id="header-world-name"></span>
            </div>
            <div class="toolbar-group toolbar-center">
                <button class="toolbar-btn toolbar-btn--active" id="btn-geographic" title="Geographic Flow Mode (G)">
                    <i data-lucide="map"></i>
                    <span class="toolbar-btn-label">Geographic</span>
                </button>
                <button class="toolbar-btn" id="btn-biographical" title="Biographical Stack Mode (B)">
                    <i data-lucide="users"></i>
                    <span class="toolbar-btn-label">Biographical</span>
                </button>
                <div class="toolbar-divider"></div>
                <div class="toolbar-control-group">
                    <div class="toolbar-slider-item">
                        <i data-lucide="move-horizontal" class="slider-icon"></i>
                        <input type="range" id="slider-zoom-x" min="-2" max="10" step="0.1" value="0" />
                    </div>
                    <div class="toolbar-slider-item">
                        <i data-lucide="move-vertical" class="slider-icon"></i>
                        <input type="range" id="slider-zoom-y" min="0.1" max="5" step="0.1" value="1" />
                    </div>
                </div>
                <div class="toolbar-divider"></div>
                <button class="toolbar-btn" id="btn-fit" title="Fit to View (F)">
                    <i data-lucide="maximize-2"></i>
                </button>
            </div>
            <div class="toolbar-group toolbar-right">
                <button class="toolbar-btn" id="btn-import" title="Import Data">
                    <i data-lucide="upload"></i>
                </button>
                <button class="toolbar-btn" id="btn-export" title="Export Data">
                    <i data-lucide="download"></i>
                </button>
                <button class="toolbar-btn" id="btn-edit-data" title="Edit Data">
                    <i data-lucide="edit"></i>
                </button>
                <button class="toolbar-btn" id="btn-flyout" title="Filters & Visibility (V)">
                    <i data-lucide="sliders-horizontal"></i>
                </button>
            </div>
        `;

        // Re-init Lucide icons
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Attach click handlers.
     * @private
     */
    _attachHandlers() {
        // Mode toggle
        const btnGeo = this._toolbar.querySelector('#btn-geographic');
        const btnBio = this._toolbar.querySelector('#btn-biographical');

        const setMode = (mode) => {
            state.setViewMode(mode);
            btnGeo.classList.toggle('toolbar-btn--active', mode === 'geographic');
            btnBio.classList.toggle('toolbar-btn--active', mode === 'biographical');
        };

        btnGeo.addEventListener('click', () => setMode('geographic'));
        btnBio.addEventListener('click', () => setMode('biographical'));

        // Zoom controls
        const sliderX = this._toolbar.querySelector('#slider-zoom-x');
        const sliderY = this._toolbar.querySelector('#slider-zoom-y');

        // Linear to Logarithmic mapping for X zoom (since X scale is massive)
        const tuToVal = (tu) => Math.log10(tu);
        const valToTu = (val) => Math.pow(10, val);

        sliderX.addEventListener('input', (e) => {
            state.setZoomX(valToTu(parseFloat(e.target.value)));
        });

        sliderY.addEventListener('input', (e) => {
            state.setZoomY(parseFloat(e.target.value));
        });

        const fitToData = () => {
            if (!dataStore.hasData) return;
            const { minTu, maxTu } = dataStore.getTimeExtents();
            const totalTu = maxTu - minTu;
            
            // Calculate necessary zoomX so that totalTu fits in viewportWidth
            // zoomX = (viewportWidth / totalTu) / 0.05
            // Provide a small margin (e.g., 5% on each side) -> multiply by 0.9
            const viewportWidth = state.viewportWidth || window.innerWidth;
            let targetZoomX = ((viewportWidth * 0.9) / (totalTu || 1000)) / 0.05;
            
            // Clamp to reasonable limits
            targetZoomX = Math.max(0.01, Math.min(targetZoomX, 10));

            // Set zoom and then pan to center
            state.setZoomX(targetZoomX);
            state.setZoomY(1);
            
            // Pan so that minTu starts at 5% of viewport width
            // panOffset.x is negative. -panX / pptu = startTu
            // We want startTu to map to a panX that leaves a margin.
            const pptu = state.pixelsPerTU;
            const marginX = viewportWidth * 0.05;
            const targetPanX = -(minTu * pptu) + marginX;
            
            state.setPan(targetPanX, 0);

            if (sliderX) sliderX.value = tuToVal(targetZoomX);
            if (sliderY) sliderY.value = 1;
        };

        this._toolbar.querySelector('#btn-fit').addEventListener('click', fitToData);

        // Listen for state changes to sync sliders (e.g. from mouse wheel)
        bus.on(Events.ZOOM_CHANGED, ({ zoomX, zoomY }) => {
            if (sliderX) sliderX.value = tuToVal(zoomX);
            if (sliderY) sliderY.value = zoomY;
        });

        // Flyout toggle
        this._toolbar.querySelector('#btn-flyout').addEventListener('click', () => {
            flyoutPanel.toggle();
        });

        // Import
        this._toolbar.querySelector('#btn-import').addEventListener('click', () => {
            bus.emit(Events.PANEL_TOGGLED, { panel: 'import', open: true });
        });

        // Export
        this._toolbar.querySelector('#btn-export').addEventListener('click', () => {
            bus.emit(Events.DATA_EXPORTED);
        });

        // Edit Data
        const btnEditData = this._toolbar.querySelector('#btn-edit-data');
        if (btnEditData) {
            btnEditData.addEventListener('click', () => {
                bus.emit(Events.PANEL_TOGGLED, { panel: 'edit', open: true });
            });
        }
        
        // Data Loaded listener to update world name and fit view
        bus.on(Events.DATA_LOADED, () => {
            const worldNameEl = this._toolbar.querySelector('#header-world-name');
            if (worldNameEl && state.worldConfig) {
                worldNameEl.textContent = state.worldConfig.world_name;
            }
            // Add a slight delay to ensure viewportWidth is set if this is on boot
            setTimeout(fitToData, 50);
        });
    }

    /**
     * Keyboard shortcut handler.
     * @private
     * @param {KeyboardEvent} e
     */
    _onKeyDown(e) {
        // Don't intercept when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            case 'g':
                state.setViewMode('geographic');
                this._updateModeButtons();
                break;
            case 'b':
                state.setViewMode('biographical');
                this._updateModeButtons();
                break;
            case 'v':
                flyoutPanel.toggle();
                break;
            case 'f':
                state.setZoomX(1);
                state.setZoomY(1);
                state.setPan(0, 0);
                break;
            case '+':
            case '=':
                state.setZoomX(state.zoomX * 1.5);
                break;
            case '-':
                state.setZoomX(state.zoomX / 1.5);
                break;
        }
    }

    /**
     * Update mode button active states.
     * @private
     */
    _updateModeButtons() {
        const btnGeo = this._toolbar.querySelector('#btn-geographic');
        const btnBio = this._toolbar.querySelector('#btn-biographical');
        if (btnGeo) btnGeo.classList.toggle('toolbar-btn--active', state.viewMode === 'geographic');
        if (btnBio) btnBio.classList.toggle('toolbar-btn--active', state.viewMode === 'biographical');
    }

    /**
     * Cleanup.
     */
    destroy() {
        window.removeEventListener('keydown', this._handleKeyDown);
    }
}

const panelController = new PanelController();
export default panelController;
