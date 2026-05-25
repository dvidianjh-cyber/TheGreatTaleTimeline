import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import dataStore from '../data/DataStore.js';
import temporalEngine from '../core/TemporalEngine.js';

export class DataEditorModal {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'edit-modal';
        this.container.style.display = 'none';

        // Current active domain (lanes, entities, events)
        this.activeDomain = 'lanes';
        
        // Data copy for editing
        this.editData = {
            lanes: [],
            entities: [],
            events: []
        };
        
        // Currently selected item index in the active domain
        this.selectedIndex = null;

        document.body.appendChild(this.container);

        this.initDOM();
        this.attachEvents();

        // Listen for panel toggle
        bus.on(Events.PANEL_TOGGLED, ({ panel, open }) => {
            if (panel === 'edit') {
                if (open && this.container.style.display === 'none') {
                    this.open();
                } else if (!open && this.container.style.display !== 'none') {
                    this.close();
                }
            }
        });
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="import-modal-backdrop" id="edit-modal-backdrop"></div>
            <div class="edit-modal-content">
                <div class="edit-modal-header" style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <h2>Edit World Data</h2>
                        <input type="text" id="edit-world-name" class="edit-form-control" placeholder="World Name" style="width: 200px;" />
                        <div class="edit-tabs-header" style="display: flex; gap: 8px;">
                            <button class="edit-tab-btn edit-tab-btn--active" data-domain="lanes">Lanes</button>
                            <button class="edit-tab-btn" data-domain="entities">Entities</button>
                            <button class="edit-tab-btn" data-domain="events">Events</button>
                            <button class="edit-tab-btn" data-domain="time_epochs">Time/Epochs</button>
                            <button class="edit-tab-btn" data-domain="rulers">Rulers</button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="toolbar-btn" id="edit-btn-import" title="Import Data">
                            <i data-lucide="upload"></i> Import
                        </button>
                        <button class="toolbar-btn" id="edit-btn-export" title="Export Data">
                            <i data-lucide="download"></i> Export
                        </button>
                        <button class="import-modal-close" id="edit-btn-close">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </div>
                <div class="edit-modal-body">
                    <div class="edit-main">
                        <div class="edit-grid-container" id="edit-grid-container">
                            <!-- Table will be injected here -->
                        </div>
                        <div class="edit-form-container" id="edit-form-container">
                            <div class="edit-actions" style="margin-bottom: 16px;">
                                <button class="btn-secondary" id="edit-btn-add">Add New Record</button>
                            </div>
                            <!-- Form will be injected here -->
                            <div style="text-align: center; color: var(--text-muted); margin-top: 40px;" id="edit-form-placeholder">Select a record to edit</div>
                        </div>
                    </div>
                </div>
                <div class="edit-modal-footer">
                    <button class="btn-secondary" id="edit-btn-cancel">Cancel</button>
                    <button class="btn-primary" id="edit-btn-save">Save Changes</button>
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Close buttons
        this.container.querySelector('#edit-btn-close').addEventListener('click', () => this.close());
        this.container.querySelector('#edit-btn-cancel').addEventListener('click', () => this.close());
        this.container.querySelector('#edit-modal-backdrop').addEventListener('click', () => this.close());

        // Save
        this.container.querySelector('#edit-btn-save').addEventListener('click', () => this.save());

        // Add
        this.container.querySelector('#edit-btn-add').addEventListener('click', () => this.addNewRecord());

        // Tabs
        const tabs = this.container.querySelectorAll('.edit-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('edit-tab-btn--active'));
                e.target.classList.add('edit-tab-btn--active');
                
                // Save current form state before switching
                this.saveCurrentForm();
                
                this.activeDomain = e.target.dataset.domain;
                this.selectedIndex = null; // reset selection
                this.renderGrid();
                this.renderForm();
            });
        });

        // Delegate grid row clicks
        const gridContainer = this.container.querySelector('#edit-grid-container');
        gridContainer.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            if (tr && tr.dataset.index !== undefined) {
                this.saveCurrentForm();
                this.selectedIndex = parseInt(tr.dataset.index, 10);
                this.renderGrid(); // update selection highlight
                this.renderForm();
            }
        });

        // Import / Export
        this.container.querySelector('#edit-btn-import').addEventListener('click', () => {
            bus.emit(Events.PANEL_TOGGLED, { panel: 'import', open: true });
            this.close();
        });
        this.container.querySelector('#edit-btn-export').addEventListener('click', () => {
            bus.emit(Events.DATA_EXPORTED);
        });
        
        // World Name binding
        const worldNameInput = this.container.querySelector('#edit-world-name');
        worldNameInput.addEventListener('change', (e) => {
            if (this.editData.world_config) {
                this.editData.world_config.world_name = e.target.value;
            }
        });

        // Delegate form changes to auto-update grid if needed
        const formContainer = this.container.querySelector('#edit-form-container');
        formContainer.addEventListener('change', (e) => {
            if (e.target.name === 'id' || e.target.name === 'name' || e.target.name === 'title' || e.target.name === 'label') {
                this.saveCurrentForm();
                this.renderGrid(); // update grid text
            }
        });

        // Handle color picker clicks
        formContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-picker-swatch')) {
                const hiddenInputId = e.target.dataset.targetId;
                const hiddenInput = this.container.querySelector(`#${hiddenInputId}`);
                if (hiddenInput) {
                    hiddenInput.value = e.target.dataset.color;
                    // Update visual selection
                    const siblings = e.target.parentElement.querySelectorAll('.color-picker-swatch');
                    siblings.forEach(s => s.classList.remove('selected'));
                    e.target.classList.add('selected');
                    // Trigger save
                    this.saveCurrentForm();
                    this.renderGrid();
                }
            }
        });
    }

    open() {
        if (!dataStore.hasData) {
            alert('Please load data first.');
            return;
        }

        // Deep copy the current data for editing
        this.editData = {
            world_config: JSON.parse(JSON.stringify(state.worldConfig || { world_name: 'Unknown World' })),
            lanes: JSON.parse(JSON.stringify(dataStore.lanes || [])),
            entities: JSON.parse(JSON.stringify(dataStore.entities || [])),
            events: JSON.parse(JSON.stringify(dataStore.events || [])),
            time_epochs: JSON.parse(JSON.stringify(state.worldConfig?.epochs || [])),
            rulers: JSON.parse(JSON.stringify(state.worldConfig?.rulers || []))
        };

        const worldNameInput = this.container.querySelector('#edit-world-name');
        if (worldNameInput) worldNameInput.value = this.editData.world_config.world_name || '';

        this.selectedIndex = null;
        this.renderGrid();
        this.renderForm();

        this.container.style.display = 'flex';
        // Re-initialize lucide icons inside modal
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    close() {
        this.container.style.display = 'none';
        bus.emit(Events.PANEL_TOGGLED, { panel: 'edit', open: false });
    }

    save() {
        this.saveCurrentForm();

        try {
            // Apply changes back to state/dataStore
            
            const newDataset = {
                world_config: this.editData.world_config,
                epochs: this.editData.time_epochs,
                lanes: this.editData.lanes,
                entities: this.editData.entities,
                events: this.editData.events
            };
            newDataset.world_config.epochs = this.editData.time_epochs;
            newDataset.world_config.rulers = this.editData.rulers;

            // loadDataset is synchronous, rebuild indices and notify systems
            dataStore.loadDataset(newDataset);
            this.close();
            console.log("Data saved and applied.");
        } catch (error) {
            alert('Failed to save data: ' + error.message);
        }
    }

    addNewRecord() {
        this.saveCurrentForm();
        
        const list = this.editData[this.activeDomain];
        let newItem = {};

        switch (this.activeDomain) {
            case 'lanes':
                newItem = { id: `lane_${Date.now()}`, label: 'New Lane', order: list.length + 1, color_hint: '#f4eedb' };
                break;
            case 'entities':
                newItem = { 
                    id: `entity_${Date.now()}`, 
                    name: 'New Entity',
                    metadata: { race: 'Man', subrace: '', color: '#E8E8E8' },
                    lifespan: { birth: 1, death: 100, date_unit: 'TU', is_approximate: false }
                };
                break;
            case 'events':
                newItem = { 
                    id: `event_${Date.now()}`, 
                    title: 'New Event', 
                    type: 'political',
                    time_extent: { start: 1, end: 1, date_unit: 'YL', is_approximate: false },
                    lane_id: this.editData.lanes.length > 0 ? this.editData.lanes[0].id : '',
                    participants: [],
                    description: '',
                    importance: 5
                };
                break;
            case 'time_epochs':
                newItem = {
                    id: `epoch_${Date.now()}`,
                    label: 'New Epoch',
                    abbreviation: 'NE',
                    start_tu: 0,
                    end_tu: 100
                };
                break;
            case 'rulers':
                newItem = { label: 'New Ruler', epoch: '', visible: true };
                break;
        }

        list.push(newItem);
        this.selectedIndex = list.length - 1;
        this.renderGrid();
        this.renderForm();
        
        // Scroll grid to bottom
        const gridContainer = this.container.querySelector('#edit-grid-container');
        gridContainer.scrollTop = gridContainer.scrollHeight;
    }

    saveCurrentForm() {
        if (this.selectedIndex === null) return;
        
        const form = this.container.querySelector('#edit-form');
        if (!form) return;

        const formData = new FormData(form);
        const item = this.editData[this.activeDomain][this.selectedIndex];

        // Update item fields based on form data
        for (let [key, value] of formData.entries()) {
            if (key.includes('.')) {
                // Handle nested objects like time_extent.start
                const parts = key.split('.');
                let current = item;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = this.parseValue(value);
            } else if (key === 'participants') {
                // Multi-select for participants is handled manually below
            } else {
                item[key] = this.parseValue(value);
            }
        }

        // Special handling for participants checkboxes
        if (this.activeDomain === 'events') {
            const participantCheckboxes = form.querySelectorAll('input[name="participants"]:checked');
            item.participants = Array.from(participantCheckboxes).map(cb => cb.value);
        }
        
        // Special handling for boolean checkboxes (not in FormData if unchecked)
        const allCheckboxes = form.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(cb => {
            if (cb.name && cb.name !== 'participants') {
                if (cb.name.includes('.')) {
                    const parts = cb.name.split('.');
                    if (!item[parts[0]]) item[parts[0]] = {};
                    item[parts[0]][parts[1]] = cb.checked;
                } else {
                    item[cb.name] = cb.checked;
                }
            }
        });
    }

    parseValue(val) {
        if (val === '') return val;
        // Try to parse numbers
        const num = Number(val);
        if (!isNaN(num) && val.trim() !== '') {
            return num;
        }
        return val;
    }

    renderGrid() {
        const list = this.editData[this.activeDomain];
        const container = this.container.querySelector('#edit-grid-container');

        if (!list || list.length === 0) {
            container.innerHTML = '<div style="padding: 16px; color: var(--text-muted);">No records found.</div>';
            return;
        }

        let html = '<table class="edit-table"><thead><tr>';
        
        // Define columns based on domain
        let cols = [];
        if (this.activeDomain === 'lanes') {
            cols = ['Color', 'Label', 'Order'];
            html += '<th>Color</th><th>Label</th><th>Order</th>';
        } else if (this.activeDomain === 'entities') {
            cols = ['Color', 'Name', 'Race'];
            html += '<th>Color</th><th>Name</th><th>Race</th>';
        } else if (this.activeDomain === 'events') {
            cols = ['Type', 'Title', 'Lane'];
            html += '<th>Type</th><th>Title</th><th>Lane</th>';
        } else if (this.activeDomain === 'time_epochs') {
            cols = ['ID', 'Title', 'Abbreviation'];
            html += '<th>ID</th><th>Title</th><th>Abbrev</th>';
        } else if (this.activeDomain === 'rulers') {
            cols = ['Label', 'Epoch', 'Visible'];
            html += '<th>Label</th><th>Epoch</th><th>Visible</th>';
        }
        html += '</tr></thead><tbody>';

        list.forEach((item, index) => {
            const isSelected = index === this.selectedIndex ? 'class="selected"' : '';
            html += `<tr data-index="${index}" ${isSelected}>`;
            
            if (this.activeDomain === 'lanes') {
                const color = item.color_hint || '#f4eedb';
                html += `<td><div class="color-picker-swatch" style="background: ${color}; width: 16px; height: 16px; border-radius: 4px; display: inline-block;"></div></td><td>${item.label || ''}</td><td>${item.order || ''}</td>`;
            } else if (this.activeDomain === 'entities') {
                const race = item.metadata ? item.metadata.race : '';
                const color = item.metadata && item.metadata.color ? item.metadata.color : '#E8E8E8';
                html += `<td><div class="color-picker-swatch" style="background: ${color}; width: 16px; height: 16px; border-radius: 4px; display: inline-block;"></div></td><td>${item.name || ''}</td><td>${race || ''}</td>`;
            } else if (this.activeDomain === 'events') {
                const lane = this.editData.lanes.find(l => l.id === item.lane_id);
                const laneLabel = lane ? (lane.label || lane.name || lane.id) : (item.lane_id || '');
                html += `<td><span class="tooltip-type-badge tooltip-type-${item.type || 'default'}">${item.type || ''}</span></td><td>${item.title || ''}</td><td>${laneLabel}</td>`;
            } else if (this.activeDomain === 'time_epochs') {
                html += `<td>${item.id || ''}</td><td>${item.label || item.name || ''}</td><td>${item.abbreviation || ''}</td>`;
            } else if (this.activeDomain === 'rulers') {
                html += `<td>${item.label || ''}</td><td>${item.epoch || ''}</td><td>${item.visible !== false ? 'Yes' : 'No'}</td>`;
            }
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    renderForm() {
        const container = this.container.querySelector('#edit-form-container');

        // Remove placeholder and old form if exists
        const oldForm = container.querySelector('#edit-form');
        const placeholder = container.querySelector('#edit-form-placeholder');
        if (oldForm) oldForm.remove();
        if (placeholder) placeholder.style.display = 'none';

        if (this.selectedIndex === null) {
            if (placeholder) placeholder.style.display = 'block';
            return;
        }

        const item = this.editData[this.activeDomain][this.selectedIndex];
        let html = '<form id="edit-form" onsubmit="return false;">';

        if (this.activeDomain === 'lanes') {
            html += this.buildField('text', 'id', 'Lane ID', item.id, true);
            html += this.buildField('text', 'label', 'Lane Label', item.label);
            html += this.buildField('number', 'order', 'Sort Order', item.order);
            html += this.buildField('color', 'color_hint', 'Color Hint', item.color_hint);
        } else if (this.activeDomain === 'entities') {
            html += this.buildField('text', 'id', 'Entity ID', item.id, true);
            html += this.buildField('text', 'name', 'Entity Name', item.name);
            
            // Metadata fields
            html += '<h4 style="margin: 16px 0 8px 0; color: var(--text-accent);">Metadata</h4>';
            const race = item.metadata ? item.metadata.race : '';
            const subrace = item.metadata ? item.metadata.subrace : '';
            const color = item.metadata ? item.metadata.color : '';
            html += this.buildField('text', 'metadata.race', 'Race (e.g. Elf, Man)', race);
            html += this.buildField('text', 'metadata.subrace', 'Subrace / Faction', subrace);
            html += this.buildField('color', 'metadata.color', 'Color Code', color);
            
            // Lifespan fields
            html += '<h4 style="margin: 16px 0 8px 0; color: var(--text-accent);">Lifespan</h4>';
            const birthVal = item.lifespan ? (item.lifespan.birth !== undefined ? item.lifespan.birth : item.lifespan.start_tu || 0) : 0;
            const deathVal = item.lifespan ? (item.lifespan.death !== undefined ? item.lifespan.death : item.lifespan.death_tu || '') : '';
            const departureVal = item.lifespan ? (item.lifespan.departure !== undefined ? item.lifespan.departure : item.lifespan.departure_tu || '') : '';
            const dateUnit = item.lifespan ? (item.lifespan.date_unit || 'TU') : 'TU';
            const isApprox = item.lifespan ? item.lifespan.is_approximate : false;

            const epochOptions = [
                { value: 'TU', label: 'TU (Absolute Time Units)' },
                ...temporalEngine.getEpochs().map(e => ({
                    value: e.abbreviation,
                    label: `${e.abbreviation} (${e.label || e.name || e.id})`
                }))
            ];
            
            const laneOptions = [{ value: '', label: '-- None --' }, ...this.editData.lanes.map(l => ({ value: l.id, label: l.label || l.name || l.id }))];
            const birthLane = item.lifespan ? (item.lifespan.birth_lane_id || '') : '';
            const deathLane = item.lifespan ? (item.lifespan.death_lane_id || '') : '';
            const departureLane = item.lifespan ? (item.lifespan.departure_lane_id || '') : '';

            html += this.buildField('number', 'lifespan.birth', 'Birth Date / Start', birthVal);
            html += this.buildField('selectOptions', 'lifespan.birth_lane_id', 'Birth Lane', birthLane, laneOptions);
            html += this.buildField('number', 'lifespan.death', 'Death Date (optional)', deathVal);
            html += this.buildField('selectOptions', 'lifespan.death_lane_id', 'Death Lane (optional)', deathLane, laneOptions);
            html += this.buildField('number', 'lifespan.departure', 'Departure Date (optional)', departureVal);
            html += this.buildField('selectOptions', 'lifespan.departure_lane_id', 'Departure Lane (optional)', departureLane, laneOptions);
            html += this.buildField('selectOptions', 'lifespan.date_unit', 'Date Unit', dateUnit, epochOptions);
            html += this.buildField('checkbox', 'lifespan.is_approximate', 'Is Approximate', isApprox);
        } else if (this.activeDomain === 'events') {
            html += this.buildField('text', 'id', 'Event ID', item.id, true);
            html += this.buildField('text', 'title', 'Title', item.title);
            html += this.buildField('select', 'type', 'Type', item.type, ['battle', 'war', 'catastrophe', 'creation', 'birth', 'death', 'migration', 'political', 'founding', 'quest']);
            
            // Lane dropdown
            const laneOptions = this.editData.lanes.map(l => ({ value: l.id, label: l.label || l.name || l.id }));
            html += this.buildField('selectOptions', 'lane_id', 'Lane', item.lane_id, laneOptions);
            
            // Timeframe object
            html += '<h4 style="margin: 16px 0 8px 0; color: var(--text-accent);">Timeframe</h4>';
            const start = item.time_extent ? item.time_extent.start : 0;
            const end = item.time_extent ? item.time_extent.end : 0;
            const dateUnit = item.time_extent ? item.time_extent.date_unit : 'YL';
            const isApprox = item.time_extent ? item.time_extent.is_approximate : false;
            
            const epochOptions = temporalEngine.getEpochs().map(e => ({
                value: e.abbreviation,
                label: `${e.abbreviation} (${e.label || e.name || e.id})`
            }));
            
            html += this.buildField('number', 'time_extent.start', 'Start Date', start);
            html += this.buildField('number', 'time_extent.end', 'End Date', end);
            html += this.buildField('selectOptions', 'time_extent.date_unit', 'Date Unit', dateUnit, epochOptions);
            html += this.buildField('checkbox', 'time_extent.is_approximate', 'Is Approximate', isApprox);

            // Importance
            html += this.buildField('number', 'importance', 'Importance (0-10)', item.importance || 5);

            // Participants multi-select
            html += '<h4 style="margin: 16px 0 8px 0; color: var(--text-accent);">Participants</h4>';
            html += '<div class="edit-form-group"><div class="edit-form-checkbox-list">';
            this.editData.entities.forEach(entity => {
                const checked = item.participants && item.participants.includes(entity.id) ? 'checked' : '';
                html += `
                    <label class="edit-checkbox-item">
                        <input type="checkbox" name="participants" value="${entity.id}" ${checked}>
                        ${entity.name} (${entity.id})
                    </label>
                `;
            });
            html += '</div></div>';

            html += this.buildField('textarea', 'description', 'Description', item.description);
        } else if (this.activeDomain === 'time_epochs') {
            html += this.buildField('text', 'id', 'Epoch ID', item.id, true);
            html += this.buildField('text', 'label', 'Epoch Title', item.label || item.name);
            html += this.buildField('text', 'abbreviation', 'Abbreviation', item.abbreviation);
            html += '<h4 style="margin: 16px 0 8px 0; color: var(--text-accent);">Time Range (Absolute TUs)</h4>';
            html += this.buildField('number', 'start_tu', 'Start TU', item.start_tu || 0);
            html += this.buildField('number', 'end_tu', 'End TU', item.end_tu || 0);
        } else if (this.activeDomain === 'rulers') {
            html += this.buildField('text', 'label', 'Ruler Label', item.label);
            const epochOptions = this.editData.time_epochs.map(e => ({ value: e.id, label: e.label || e.name || e.id }));
            html += this.buildField('selectOptions', 'epoch', 'Epoch', item.epoch, epochOptions);
            html += this.buildField('checkbox', 'visible', 'Visible by Default', item.visible !== false);
        }

        html += '</form>';
        container.insertAdjacentHTML('beforeend', html);
    }

    buildField(type, name, label, value, readonly = false) {
        const valStr = value !== undefined && value !== null ? value : '';
        const readOnlyAttr = readonly ? 'readonly style="background: rgba(0,0,0,0.1);"' : '';
        
        let inputHtml = '';
        if (type === 'textarea') {
            inputHtml = `<textarea name="${name}" class="edit-form-control" rows="4" ${readOnlyAttr}>${valStr}</textarea>`;
        } else if (type === 'select') {
            // value is an array of strings in this context
            const optionsHtml = readonly.map(opt => 
                `<option value="${opt}" ${opt === valStr ? 'selected' : ''}>${opt}</option>`
            ).join('');
            inputHtml = `<select name="${name}" class="edit-form-control">${optionsHtml}</select>`;
        } else if (type === 'selectOptions') {
            // readonly is an array of {value, label} objects
            const optionsHtml = readonly.map(opt => 
                `<option value="${opt.value}" ${opt.value === valStr ? 'selected' : ''}>${opt.label}</option>`
            ).join('');
            inputHtml = `<select name="${name}" class="edit-form-control">${optionsHtml}</select>`;
        } else if (type === 'checkbox') {
            const checkedAttr = value ? 'checked' : '';
            return `
                <div class="edit-form-group" style="flex-direction: row; align-items: center; gap: 8px;">
                    <input type="checkbox" name="${name}" id="input_${name}" ${checkedAttr}>
                    <label for="input_${name}" style="margin:0;">${label}</label>
                </div>
            `;
            inputHtml = `<input type="${type}" name="${name}" class="edit-form-control" value="${valStr}" ${readOnlyAttr}>`;
        } else if (type === 'color') {
            const presets = [
                '#E8E8E8', '#6a7482', '#2a5a8a', '#248888',
                '#248846', '#ffd700', '#c26330', '#a02030',
                '#8b2222', '#4a4034', '#73675a', '#b38822',
                '#cc4444', '#ff6633', '#44cc88', '#66aaff'
            ];
            const hiddenId = `color_${name.replace('.', '_')}`;
            const swatches = presets.map(c => `
                <div class="color-picker-swatch ${c === valStr ? 'selected' : ''}" 
                     style="background: ${c};" 
                     data-color="${c}" 
                     data-target-id="${hiddenId}"></div>
            `).join('');
            
            inputHtml = `
                <input type="hidden" name="${name}" id="${hiddenId}" value="${valStr}">
                <div class="color-picker-palette">
                    ${swatches}
                </div>
            `;
        } else {
            inputHtml = `<input type="${type}" name="${name}" class="edit-form-control" value="${valStr}" ${readOnlyAttr}>`;
        }

        return `
            <div class="edit-form-group">
                <label>${label}</label>
                ${inputHtml}
            </div>
        `;
    }
}

// Instantiate and export as singleton
const dataEditorModal = new DataEditorModal();
export default dataEditorModal;
