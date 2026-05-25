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
import SAMPLE_DATASET from './data/SampleData.js';

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
 * DEV_MODE: When true, auto-loads sample data on startup.
 * Set to false for production (app loads blank, user imports data).
 */
const DEV_MODE = false;

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
    if (DEV_MODE) {
        console.log('[App] DEV_MODE active: Forcing reload of latest sample data...');
        loadSampleData();
    } else {
        // Try loading from IndexedDB in production/non-dev mode
        const savedData = await persistenceService.loadWorld();
        if (savedData && savedData.events && savedData.events.length > 0) {
            console.log('[App] Loading data from IndexedDB...');
            const result = validator.validateFullDataset(savedData);
            if (result.valid) {
                const repaired = validator.deepUnescape(result.sanitized);
                temporalEngine.loadConfig(repaired.world_config);
                dataStore.loadDataset(repaired);
            } else {
                console.warn('[App] Saved data validation failed:', result.errors);
            }
        } else {
            console.log('[App] No data loaded. Use Import to load a dataset.');
        }
    }

    // ── 6. Initial Render ──
    bus.emit(Events.RENDER_DIRTY);

    // Initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();

    console.log('[App] Initialization complete.');
}

/**
 * Load the embedded sample dataset.
 */
function loadSampleData() {
    console.log('[App] Loading sample Arda dataset...');
    const result = validator.validateFullDataset(SAMPLE_DATASET);
    if (result.valid) {
        temporalEngine.loadConfig(result.sanitized.world_config);
        dataStore.loadDataset(result.sanitized);
    } else {
        console.error('[App] Sample data validation failed:', result.errors);
    }
}

// Boot
document.addEventListener('DOMContentLoaded', main);
