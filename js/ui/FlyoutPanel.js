/**
 * FlyoutPanel.js — High-Density Filter Matrix
 * Last Modified: 2026-05-15
 *
 * Right-side flyout panel with nested filter controls:
 * - Lanes (Geography)
 * - Entities (Characters/Races)
 * - Event Importance (threshold slider)
 * - Display settings (prologue toggle, time systems)
 */

import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import dataStore from '../data/DataStore.js';
import temporalEngine from '../core/TemporalEngine.js';

class FlyoutPanel {
    constructor() {
        /** @type {HTMLElement|null} */
        this._panel = null;

        /** @type {boolean} */
        this._isOpen = false;

        /** @type {HTMLElement|null} */
        this._searchInput = null;

        this._handleDataLoaded = this._buildContent.bind(this);
    }

    /**
     * Initialize with the flyout panel container element.
     * @param {HTMLElement} panelElement
     */
    init(panelElement) {
        this._panel = panelElement;
        this._panel.classList.add('flyout-panel');

        // Stop pointer events from propagating to the canvas below
        this._panel.addEventListener('pointerdown', (e) => e.stopPropagation());
        this._panel.addEventListener('pointermove', (e) => e.stopPropagation());
        this._panel.addEventListener('pointerup', (e) => e.stopPropagation());
        this._panel.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });

        bus.on(Events.DATA_LOADED, this._handleDataLoaded);
    }

    /**
     * Toggle the panel open/closed.
     */
    toggle() {
        this._isOpen = !this._isOpen;
        if (this._isOpen) {
            this._panel.classList.add('flyout-panel--open');
        } else {
            this._panel.classList.remove('flyout-panel--open');
        }
        bus.emit(Events.PANEL_TOGGLED, { panel: 'flyout', open: this._isOpen });
    }

    /**
     * Build the panel content from loaded data.
     * @private
     */
    _buildContent() {
        if (!this._panel) return;

        this._panel.innerHTML = `
            <div class="flyout-header">
                <h2 class="flyout-title">Visibility</h2>
                <button class="flyout-close-btn" id="flyout-close-btn">
                    <i data-lucide="x"></i>
                </button>
            </div>

            <div class="flyout-search">
                <input type="text" id="flyout-search-input" placeholder="Search entities..." class="flyout-search-input" />
            </div>

            <!-- Display Settings Section -->
            <div class="flyout-section">
                <h3 class="flyout-section-title">Display Settings</h3>
                <div class="flyout-section-content">
                    <div class="flyout-slider-group">
                        <div class="flyout-slider-header">
                            <label for="font-size-slider">Master Font Size</label>
                            <span id="font-size-value">${state.baseFontSize.toFixed(1)}x</span>
                        </div>
                        <input type="range" id="font-size-slider" class="flyout-slider" min="0.5" max="2.0" step="0.1" value="${state.baseFontSize}" />
                    </div>
                </div>
            </div>

            <!-- Era Ruler Toggles -->
            <div class="flyout-section">
                <h3 class="flyout-section-title">Era Ruler Rows</h3>
                <div class="flyout-section-content" id="flyout-era-rulers"></div>
            </div>

            <!-- Importance Threshold -->
            <div class="flyout-section">
                <h3 class="flyout-section-title">Importance Threshold</h3>
                <div class="flyout-section-content">
                    <div class="flyout-slider-row">
                        <input type="range" id="importance-slider" min="1" max="10" value="${state.importanceThreshold}" class="flyout-slider" />
                        <span id="importance-value" class="flyout-slider-value">${state.importanceThreshold}</span>
                    </div>
                </div>
            </div>

            <!-- Lanes Section -->
            <div class="flyout-section">
                <h3 class="flyout-section-title">
                    Lanes (Geography)
                    <button class="flyout-select-all" data-target="lanes">All</button>
                    <button class="flyout-select-none" data-target="lanes">None</button>
                </h3>
                <div class="flyout-section-content" id="flyout-lanes"></div>
            </div>

            <!-- Entities Section -->
            <div class="flyout-section">
                <h3 class="flyout-section-title">
                    Entities
                    <button class="flyout-select-all" data-target="entities">All</button>
                    <button class="flyout-select-none" data-target="entities">None</button>
                </h3>
                <div class="flyout-section-content" id="flyout-entities"></div>
            </div>
        `;

        this._populateLanes();
        this._populateEntities();
        this._populateEraRulers();
        this._attachEventHandlers();

        // Re-initialize Lucide icons in the panel
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Populate lane checkboxes.
     * @private
     */
    _populateLanes() {
        const container = this._panel.querySelector('#flyout-lanes');
        if (!container) return;

        for (const lane of dataStore.lanes) {
            const checked = state.visibleLanes.has(lane.id) ? 'checked' : '';
            container.innerHTML += `
                <label class="flyout-checkbox">
                    <input type="checkbox" data-lane-id="${lane.id}" ${checked} />
                    <span class="flyout-color-dot" style="background: ${lane.color_hint || '#666'}"></span>
                    <span>${lane.label}</span>
                </label>
            `;
        }
    }

    /**
     * Populate entity checkboxes, grouped by race.
     * @private
     */
    _populateEntities() {
        const container = this._panel.querySelector('#flyout-entities');
        if (!container) return;

        const races = dataStore.getAllRaces();

        for (const race of races) {
            const entities = dataStore.getEntitiesByRace(race);

            container.innerHTML += `<div class="flyout-race-group" data-race="${race}">
                <h4 class="flyout-race-title">${race}</h4>
                ${entities.map(ent => {
                    const checked = state.visibleEntities.has(ent.id) ? 'checked' : '';
                    const color = ent.metadata?.color || '#888';
                    return `
                        <label class="flyout-checkbox flyout-entity-item" data-entity-name="${ent.name.toLowerCase()}">
                            <input type="checkbox" data-entity-id="${ent.id}" ${checked} />
                            <span class="flyout-color-dot" style="background: ${color}"></span>
                            <span>${ent.name}</span>
                        </label>
                    `;
                }).join('')}
            </div>`;
        }
    }

    /**
     * Populate toggles for era-specific ruler rows.
     * @private
     */
    _populateEraRulers() {
        const container = this._panel.querySelector('#flyout-era-rulers');
        if (!container) return;

        const epochs = temporalEngine.getEpochs();
        const activeRulers = state.activeEpochRulers;

        let html = '';
        for (const epoch of epochs) {
            const checked = activeRulers.has(epoch.id) ? 'checked' : '';
            const label = epoch.label || epoch.name || epoch.id;
            html += `
                <label class="flyout-toggle">
                    <input type="checkbox" data-epoch-ruler-id="${epoch.id}" ${checked} />
                    <span>${label}</span>
                </label>
            `;
        }

        if (!html) {
            html = '<div class="flyout-empty-hint">No era rulers available for this dataset.</div>';
        }

        container.innerHTML = html;
    }

    /**
     * Attach event handlers to panel controls.
     * @private
     */
    _attachEventHandlers() {
        // Close button
        const closeBtn = this._panel.querySelector('#flyout-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.toggle());

        // Font size slider
        const fontSlider = this._panel.querySelector('#font-size-slider');
        const fontValue = this._panel.querySelector('#font-size-value');
        if (fontSlider) {
            fontSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (fontValue) fontValue.textContent = val.toFixed(1) + 'x';
            });
            fontSlider.addEventListener('change', (e) => {
                state.setBaseFontSize(parseFloat(e.target.value));
            });
        }

        // Epoch ruler toggles
        this._panel.querySelectorAll('[data-epoch-ruler-id]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                state.toggleEpochRuler(e.target.dataset.epochRulerId);
            });
        });

        // Importance slider
        const importanceSlider = this._panel.querySelector('#importance-slider');
        const importanceValue = this._panel.querySelector('#importance-value');
        if (importanceSlider) {
            importanceSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (importanceValue) importanceValue.textContent = val;
                state.setImportanceThreshold(val);
            });
        }

        // Lane checkboxes
        this._panel.querySelectorAll('[data-lane-id]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                state.setLaneVisibility(e.target.dataset.laneId, e.target.checked);
            });
        });

        // Entity checkboxes
        this._panel.querySelectorAll('[data-entity-id]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                state.setEntityVisibility(e.target.dataset.entityId, e.target.checked);
            });
        });

        // Select All / None buttons
        this._panel.querySelectorAll('.flyout-select-all').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                if (target === 'lanes') {
                    state.setAllLanesVisible(dataStore.lanes.map(l => l.id));
                    this._panel.querySelectorAll('[data-lane-id]').forEach(cb => cb.checked = true);
                } else if (target === 'entities') {
                    state.setAllEntitiesVisible(dataStore.entities.map(e => e.id));
                    this._panel.querySelectorAll('[data-entity-id]').forEach(cb => cb.checked = true);
                }
            });
        });

        this._panel.querySelectorAll('.flyout-select-none').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                if (target === 'lanes') {
                    state.setAllLanesVisible([]);
                    this._panel.querySelectorAll('[data-lane-id]').forEach(cb => cb.checked = false);
                } else if (target === 'entities') {
                    state.setAllEntitiesVisible([]);
                    this._panel.querySelectorAll('[data-entity-id]').forEach(cb => cb.checked = false);
                }
            });
        });

        // Search input
        const searchInput = this._panel.querySelector('#flyout-search-input');
        if (searchInput) {
            this._searchInput = searchInput;
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this._panel.querySelectorAll('.flyout-entity-item').forEach(item => {
                    const name = item.dataset.entityName || '';
                    item.style.display = name.includes(query) ? '' : 'none';
                });
            });
        }
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.DATA_LOADED, this._handleDataLoaded);
    }
}

const flyoutPanel = new FlyoutPanel();
export default flyoutPanel;
