/**
 * app.js — Application Bootstrap
 * Last Modified: 2026-05-15
 *
 * Orchestrates module initialization in the correct order.
 * During development, auto-loads sample data.
 */

import bus, { Events } from './core/EventBus.js';
import state from './core/StateManager.js';
import temporalEngine from './core/TemporalEngine.js';
import validator from './core/SchemaValidator.js';
import dataStore from './data/DataStore.js';

import canvasManager from './canvas/CanvasManager.js';
import rulerRenderer from './canvas/RulerRenderer.js';
import laneRenderer from './canvas/LaneRenderer.js';
import eventNodeRenderer from './canvas/EventNodeRenderer.js';
import entitySplineRenderer from './canvas/EntitySplineRenderer.js';
import biographicalRenderer from './canvas/BiographicalRenderer.js';
import prologueRenderer from './canvas/PrologueRenderer.js';

import panelController from './ui/PanelController.js';
import flyoutPanel from './ui/FlyoutPanel.js';
import tooltipManager from './ui/TooltipManager.js';
import importExportUI from './ui/ImportExportUI.js';
import dataEditorModal from './ui/DataEditorModal.js';

import persistenceService from './persistence/PersistenceService.js';



/**
 * Main application bootstrap.
 */
async function main() {
    console.log('[App] Initializing The Great Tale Timeline...');

    // ── 1. Persistence ──
    await persistenceService.init();

    // ── 2. Canvas ──
    const canvasContainer = document.getElementById('canvas-container');
    await canvasManager.init(canvasContainer);

    // ── 3. Renderers ──
    rulerRenderer.init(document.getElementById('ruler-strip'));
    laneRenderer.init(canvasManager.laneLayer);
    eventNodeRenderer.init(canvasManager.eventLayer);
    entitySplineRenderer.init(canvasManager.splineLayer);
    biographicalRenderer.init(canvasManager.laneLayer, canvasManager.eventLayer);
    prologueRenderer.init(canvasManager.epochLayer);

    // ── 4. UI ──
    panelController.init(document.getElementById('toolbar'));
    flyoutPanel.init(document.getElementById('flyout-panel'));
    tooltipManager.init(document.getElementById('tooltip-container'));
    importExportUI.init(document.getElementById('app-root'));

    // ── 5. Load Data ──
    console.log('[App] No data loaded. Initializing blank world schema.');
    const blankWorld = {
        world_config: {
            world_name: 'New World',
            time_systems: [{ id: 'solar', name: 'Solar Years', isPrimary: true, base_unit: 1 }],
            epochs: [],
            rulers: [],
            default_mode: 'geographic',
            default_visible_timespan: [0, 100]
        },
        events: [],
        entities: [],
        lanes: []
    };
    temporalEngine.loadConfig(blankWorld.world_config);
    dataStore.loadDataset(blankWorld);

    // ── 6. Initial Render ──
    bus.emit(Events.RENDER_DIRTY);

    // Initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();

    console.log('[App] Initialization complete.');
}


// Boot
document.addEventListener('DOMContentLoaded', main);
