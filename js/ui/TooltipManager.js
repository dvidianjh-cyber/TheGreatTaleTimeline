/**
 * TooltipManager.js — Glassmorphism Event Tooltips
 * Last Modified: 2026-05-15
 *
 * Renders glassmorphism-styled tooltip cards as DOM overlays
 * on event hover/click. Shows event details, participants, dates.
 */

import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';
import bus, { Events } from '../core/EventBus.js';
import state from '../core/StateManager.js';
import temporalEngine from '../core/TemporalEngine.js';
import dataStore from '../data/DataStore.js';

class TooltipManager {
    constructor() {
        /** @type {HTMLElement|null} */
        this._container = null;

        /** @type {HTMLElement|null} */
        this._tooltip = null;

        /** @type {boolean} */
        this._visible = false;

        this._handleShow = this._show.bind(this);
        this._handleHide = this._hide.bind(this);
    }

    /**
     * Initialize with the tooltip container element.
     * @param {HTMLElement} container
     */
    init(container) {
        this._container = container;
        this._createTooltipElement();

        bus.on(Events.TOOLTIP_SHOW, this._handleShow);
        bus.on(Events.TOOLTIP_HIDE, this._handleHide);
    }

    /**
     * Create the tooltip DOM element.
     * @private
     */
    _createTooltipElement() {
        this._tooltip = document.createElement('div');
        this._tooltip.className = 'tooltip-card';
        this._tooltip.style.display = 'none';
        this._container.appendChild(this._tooltip);
    }

    /**
     * Sanitize a string for HTML injection.
     * @private
     */
    _sanitize(str) {
        if (!str) return '';
        if (typeof str !== 'string') return String(str);
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Show the tooltip for an event.
     * @private
     * @param {{ event: Object, x: number, y: number }} payload
     */
    _show({ event: evt, x, y }) {
        if (!this._tooltip || !evt) return;

        // Build multi-system date display
        // Priority: 1. Current Epoch, 2. Baseline (Solar), 3. Other active rulers
        const currentEpoch = temporalEngine.getEpochAt(evt.start_tu);
        const baselineId = 'solar';
        const otherActiveRulers = Array.from(state.activeEpochRulers).filter(id => id !== baselineId && (!currentEpoch || id !== currentEpoch.id));

        const systemsToDisplay = [];
        if (currentEpoch) systemsToDisplay.push(currentEpoch.id);
        systemsToDisplay.push(baselineId);
        systemsToDisplay.push(...otherActiveRulers);

        const dateRows = systemsToDisplay.map(systemId => {
            const startLabel = temporalEngine.formatUnifiedDate(evt.start_tu, systemId, true);
            const endLabel = evt.start_tu !== evt.end_tu
                ? ` — ${temporalEngine.formatUnifiedDate(evt.end_tu, systemId, true)}`
                : '';
            
            const isPrimaryDate = currentEpoch ? (systemId === currentEpoch.id) : (systemId === baselineId);
            const labelClass = isPrimaryDate ? 'tooltip-date-primary' : 'tooltip-date-secondary';
            
            return `<div class="${labelClass}">${startLabel}${endLabel}</div>`;
        }).join('');
        
        const approxTag = evt.time_extent.is_approximate ? '<span class="tooltip-approx">≈ Approximate</span>' : '';

        // Locations
        let locationHTML = '';
        if (evt.lane_id) {
            const lane = dataStore.lanes.find(l => l.id === evt.lane_id);
            const laneLabel = lane ? (lane.label || lane.name || lane.id) : evt.lane_id;
            const laneColor = lane && lane.color_hint ? lane.color_hint : 'var(--border-medium)';
            
            const subArea = evt.sub_area || (evt.metadata && evt.metadata.sub_area);
            let subAreaHTML = '';
            if (subArea) {
                subAreaHTML = `<span class="tooltip-chip" style="background: rgba(255,255,255,0.05); border-color: ${laneColor}">${this._sanitize(subArea)}</span>`;
            }
            
            locationHTML = `
                <div class="tooltip-locations" style="margin-top: 8px;">
                    <div class="tooltip-section-label" style="margin-bottom: 4px;">Location</div>
                    <div class="tooltip-location-pills" style="display:flex; flex-direction:row; flex-wrap:wrap; gap:4px;">
                        <span class="tooltip-chip" style="border-left: 3px solid ${laneColor}">${this._sanitize(laneLabel)}</span>
                        ${subAreaHTML}
                    </div>
                </div>
            `;
        }

        // Participants
        let participantHTML = '';
        if (evt.participants && evt.participants.length > 0) {
            const names = evt.participants.map(id => {
                const entity = dataStore.getEntity(id);
                return entity ? this._sanitize(entity.name) : id;
            });
            participantHTML = `
                <div class="tooltip-participants" style="margin-top: 8px;">
                    <div class="tooltip-section-label" style="margin-bottom: 4px;">Participants</div>
                    <div class="tooltip-participant-list">${names.map(n => `<span class="tooltip-chip">${n}</span>`).join('')}</div>
                </div>
            `;
        }

        // Type badge
        const typeBadge = evt.type
            ? `<span class="tooltip-type-badge tooltip-type-${evt.type}">${this._sanitize(evt.type)}</span>`
            : '';

        // Importance
        const importanceStars = '★'.repeat(evt.importance || 5) + '☆'.repeat(10 - (evt.importance || 5));

        const isRange = evt.start_tu !== evt.end_tu;
        const rangeClass = isRange ? ' tooltip-has-range' : '';

        this._tooltip.innerHTML = `
            <div class="tooltip-grid${rangeClass}">
                <div class="tooltip-col-left">
                    <h3 class="tooltip-title">${this._sanitize(evt.title || 'Unknown Event')}</h3>
                    ${evt.description ? `<p class="tooltip-description">${this._sanitize(evt.description)}</p>` : ''}
                    ${locationHTML}
                    ${participantHTML}
                </div>
                <div class="tooltip-col-right">
                    ${typeBadge}
                    <div class="tooltip-importance" style="margin: 4px 0; font-size: 0.9em; color: var(--accent-gold);">${importanceStars}</div>
                    <div class="tooltip-date-container" style="display:flex; flex-direction:column; gap:2px;">
                        ${dateRows}
                        ${approxTag}
                    </div>
                </div>
            </div>
        `;

        // Position tooltip
        const padding = 16;
        const tooltipWidth = 300;
        let left = x + padding;
        let top = y - 20;

        // Keep within viewport
        if (left + tooltipWidth > state.viewportWidth) {
            left = x - tooltipWidth - padding;
        }
        if (top < padding) top = padding;
        if (top + 200 > state.viewportHeight) {
            top = state.viewportHeight - 220;
        }

        this._tooltip.style.left = `${left}px`;
        this._tooltip.style.top = `${top}px`;
        this._tooltip.style.display = 'block';

        // Kill any existing animation to prevent stale transforms
        gsap.killTweensOf(this._tooltip);

        // Entrance animation — only animate opacity and scale, NOT position
        gsap.fromTo(this._tooltip,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out', clearProps: 'transform' }
        );

        this._visible = true;
    }

    /**
     * Hide the tooltip.
     * @private
     */
    _hide() {
        if (!this._tooltip || !this._visible) return;

        gsap.killTweensOf(this._tooltip);
        gsap.to(this._tooltip, {
            opacity: 0,
            scale: 0.95,
            duration: 0.15,
            ease: 'power2.in',
            onComplete: () => {
                if (this._tooltip) {
                    this._tooltip.style.display = 'none';
                    gsap.set(this._tooltip, { clearProps: 'all' });
                    this._tooltip.style.display = 'none';
                }
            },
        });

        this._visible = false;
    }

    /**
     * Cleanup.
     */
    destroy() {
        bus.off(Events.TOOLTIP_SHOW, this._handleShow);
        bus.off(Events.TOOLTIP_HIDE, this._handleHide);
    }
}

const tooltipManager = new TooltipManager();
export default tooltipManager;
