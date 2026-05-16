/**
 * ImportExportUI.js — JSON Import/Export Interface
 * Last Modified: 2026-05-15
 *
 * Modal dialog for importing JSON data files and exporting
 * the current dataset. Includes drag-and-drop and file picker.
 */

import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';
import bus, { Events } from '../core/EventBus.js';
import validator from '../core/SchemaValidator.js';
import dataStore from '../data/DataStore.js';
import temporalEngine from '../core/TemporalEngine.js';

class ImportExportUI {
    constructor() {
        /** @type {HTMLElement|null} */
        this._container = null;

        /** @type {HTMLElement|null} */
        this._modal = null;

        this._handleOpenImport = this._openImportModal.bind(this);
        this._handleExport = this._exportData.bind(this);
    }

    /**
     * Initialize with the app root element.
     * @param {HTMLElement} container
     */
    init(container) {
        this._container = container;
        this._createModal();

        bus.on(Events.PANEL_TOGGLED, (payload) => {
            if (payload.panel === 'import' && payload.open) {
                this._openImportModal();
            }
        });
        bus.on(Events.DATA_EXPORTED, this._handleExport);
    }

    /**
     * Create the import modal DOM.
     * @private
     */
    _createModal() {
        this._modal = document.createElement('div');
        this._modal.className = 'import-modal';
        this._modal.style.display = 'none';
        this._modal.innerHTML = `
            <div class="import-modal-backdrop"></div>
            <div class="import-modal-content">
                <div class="import-modal-header">
                    <h2>Import Timeline Data</h2>
                    <button class="import-modal-close" id="import-close-btn">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="import-dropzone" id="import-dropzone">
                    <i data-lucide="upload-cloud" class="import-dropzone-icon"></i>
                    <p>Drag & drop your JSON file here</p>
                    <p class="import-dropzone-hint">or click to browse</p>
                    <input type="file" id="import-file-input" accept=".json" style="display:none" />
                </div>
                <div class="import-progress" id="import-progress" style="display:none">
                    <div class="import-progress-bar">
                        <div class="import-progress-fill" id="import-progress-fill"></div>
                    </div>
                    <p class="import-status" id="import-status">Processing...</p>
                </div>
                <div class="import-errors" id="import-errors" style="display:none">
                    <h3>Validation Errors</h3>
                    <ul id="import-error-list"></ul>
                </div>
            </div>
        `;

        this._container.appendChild(this._modal);

        // Attach handlers
        const backdrop = this._modal.querySelector('.import-modal-backdrop');
        const closeBtn = this._modal.querySelector('#import-close-btn');
        const dropzone = this._modal.querySelector('#import-dropzone');
        const fileInput = this._modal.querySelector('#import-file-input');

        backdrop.addEventListener('click', () => this._closeModal());
        closeBtn.addEventListener('click', () => this._closeModal());

        // Click to browse
        dropzone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this._handleFile(e.target.files[0]);
            }
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('import-dropzone--active');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('import-dropzone--active');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('import-dropzone--active');
            if (e.dataTransfer.files.length > 0) {
                this._handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    /**
     * Open the import modal.
     * @private
     */
    _openImportModal() {
        this._modal.style.display = 'flex';
        this._modal.querySelector('#import-progress').style.display = 'none';
        this._modal.querySelector('#import-errors').style.display = 'none';

        gsap.fromTo(this._modal.querySelector('.import-modal-content'),
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
        );

        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Close the import modal.
     * @private
     */
    _closeModal() {
        gsap.to(this._modal.querySelector('.import-modal-content'), {
            opacity: 0, scale: 0.95, duration: 0.15,
            onComplete: () => { this._modal.style.display = 'none'; },
        });
    }

    /**
     * Handle an uploaded file.
     * @private
     * @param {File} file
     */
    async _handleFile(file) {
        const progressEl = this._modal.querySelector('#import-progress');
        const progressFill = this._modal.querySelector('#import-progress-fill');
        const statusEl = this._modal.querySelector('#import-status');
        const errorsEl = this._modal.querySelector('#import-errors');
        const errorList = this._modal.querySelector('#import-error-list');

        progressEl.style.display = 'block';
        errorsEl.style.display = 'none';
        statusEl.textContent = 'Reading file...';
        progressFill.style.width = '30%';

        try {
            const text = await file.text();
            progressFill.style.width = '50%';
            statusEl.textContent = 'Parsing JSON...';

            const data = JSON.parse(text);
            progressFill.style.width = '70%';
            statusEl.textContent = 'Validating schema...';

            const result = validator.validateFullDataset(data);
            progressFill.style.width = '90%';

            if (!result.valid) {
                errorsEl.style.display = 'block';
                errorList.innerHTML = result.errors.map(e => `<li>${e}</li>`).join('');
                statusEl.textContent = 'Validation failed.';
                progressFill.style.width = '100%';
                progressFill.classList.add('import-progress-fill--error');
                return;
            }

            // Load validated data
            statusEl.textContent = 'Loading data...';
            temporalEngine.loadConfig(result.sanitized.world_config);
            dataStore.loadDataset(result.sanitized);

            progressFill.style.width = '100%';
            statusEl.textContent = `Loaded ${dataStore.events.length} events, ${dataStore.entities.length} entities.`;

            // Auto-close after success
            setTimeout(() => this._closeModal(), 1200);

            bus.emit(Events.DATA_IMPORTED);

        } catch (err) {
            errorsEl.style.display = 'block';
            errorList.innerHTML = `<li>Error: ${err.message}</li>`;
            statusEl.textContent = 'Import failed.';
            progressFill.style.width = '100%';
            progressFill.classList.add('import-progress-fill--error');
        }
    }

    /**
     * Export current data as a JSON download.
     * @private
     */
    _exportData() {
        if (!dataStore.hasData) {
            console.warn('[ImportExportUI] No data to export.');
            return;
        }

        const data = dataStore.toJSON();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `timeline-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.DATA_EXPORTED, this._handleExport);
    }
}

const importExportUI = new ImportExportUI();
export default importExportUI;
