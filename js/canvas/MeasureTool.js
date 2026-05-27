import { Graphics } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import temporalEngine from '../core/TemporalEngine.js';
import state from '../core/StateManager.js';
import bus, { Events } from '../core/EventBus.js';

class MeasureTool {
    constructor() {
        this.layer = null;
        this.measurements = [];
        this.status = 'idle'; 
        
        bus.on(Events.RENDER_DIRTY, () => this.renderAll());
    }

    init(layer) {
        this.layer = layer;
    }

    clear() {
        this.status = 'idle';
        
        this.measurements.forEach(m => {
            if (m.graphic.parent) m.graphic.parent.removeChild(m.graphic);
            m.graphic.destroy();
            if (m.tooltip.parentNode) m.tooltip.parentNode.removeChild(m.tooltip);
        });
        
        this.measurements = [];
        bus.emit(Events.RENDER_DIRTY);
    }

    onPointerDown(e, canvasManager) {
        this.app = canvasManager.app;
        
        const clientX = e.clientX ?? e.global?.x ?? 0;
        const clientY = e.clientY ?? e.global?.y ?? 0;
        
        const canvas = document.querySelector('#canvas-container canvas');
        const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        
        const scaleX = (canvas && this.app) ? (this.app.renderer.screen.width / canvas.clientWidth) : 1;
        const scaleY = (canvas && this.app) ? (this.app.renderer.screen.height / canvas.clientHeight) : 1;
        
        let localX = (clientX - rect.left) * scaleX;
        let localY = (clientY - rect.top) * scaleY;
        
        if (e.offsetX !== undefined && e.offsetY !== undefined) {
            localX = e.offsetX * scaleX;
            localY = e.offsetY * scaleY;
        }
        
        const panX = state.panOffset.x;
        const pptu = state.pixelsPerTU;
        
        if (this.status === 'idle') {
            this.status = 'drawing';
            
            const startTu = (localX - panX) / pptu;
            const worldY = localY - state.panOffset.y;
            
            const graphic = new Graphics();
            graphic.eventMode = 'none';
            this.layer.addChild(graphic);
            
            const tooltip = document.createElement('div');
            tooltip.className = 'measure-tooltip-card';
            tooltip.style.display = 'none'; // start hidden
            
            const tooltipContainer = document.getElementById('tooltip-container');
            if (tooltipContainer) {
                tooltipContainer.appendChild(tooltip);
            }
            
            this.measurements.push({ graphic, tooltip, startTu, endTu: startTu, worldY });
            this.renderAll();
            
        } else if (this.status === 'drawing') {
            this.status = 'idle';
            
            const currentM = this.measurements[this.measurements.length - 1];
            if (!currentM) return;
            
            currentM.endTu = (localX - state.panOffset.x) / state.pixelsPerTU;
            const width = Math.abs((currentM.endTu - currentM.startTu) * state.pixelsPerTU);
            
            if (Number.isNaN(width) || width < 2) {
                if (currentM.graphic.parent) currentM.graphic.parent.removeChild(currentM.graphic);
                currentM.graphic.destroy();
                if (currentM.tooltip.parentNode) currentM.tooltip.parentNode.removeChild(currentM.tooltip);
                this.measurements.pop();
            }
            
            this.renderAll();
        }
    }

    onPointerMove(e, canvasManager) {
        if (!this.isDragging) return;
        
        const clientX = e.clientX ?? e.global?.x ?? 0;
        const canvas = document.querySelector('#canvas-container canvas');
        const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        
        const scaleX = (canvas && this.app) ? (this.app.renderer.screen.width / canvas.clientWidth) : 1;
        const localX = (clientX - rect.left) * scaleX;
        const currentM = this.measurements[this.measurements.length - 1];
        
        if (currentM) {
            currentM.endTu = (localX - state.panOffset.x) / state.pixelsPerTU;
            this.renderAll();
        }
    }

    onPointerUp(e, canvasManager) {
    }

    renderAll() {
        const canvas = document.querySelector('#canvas-container canvas');
        const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const scaleX = (canvas && this.app) ? (this.app.renderer.screen.width / canvas.clientWidth) : 1;
        const scaleY = (canvas && this.app) ? (this.app.renderer.screen.height / canvas.clientHeight) : 1;
        
        const panX = state.panOffset.x;
        const pptu = state.pixelsPerTU;
        
        this.measurements.forEach(m => {
            try {
                m.graphic.clear();
                
                const currentScreenY = m.worldY + state.panOffset.y;
                
                const startX = (m.startTu * pptu) + panX;
                const endX = (m.endTu * pptu) + panX;
                const width = Math.abs(endX - startX);
                
                if (Number.isNaN(width) || width < 2) {
                    m.tooltip.innerHTML = '';
                    m.tooltip.style.display = 'none';
                    return;
                }

                const leftX = Math.min(startX, endX);
                
                m.graphic.moveTo(leftX, currentScreenY);
                m.graphic.lineTo(leftX + width, currentScreenY);
                m.graphic.stroke({ width: 2, color: 0x4a90e2, alpha: 0.8 });
                
                m.graphic.moveTo(startX, currentScreenY - 10);
                m.graphic.lineTo(startX, currentScreenY + 10);
                m.graphic.stroke({ width: 2, color: 0x4a90e2, alpha: 0.8 });
                
                m.graphic.moveTo(endX, currentScreenY - 10);
                m.graphic.lineTo(endX, currentScreenY + 10);
                m.graphic.stroke({ width: 2, color: 0x4a90e2, alpha: 0.8 });
                
                const tuDiff = Math.abs(m.endTu - m.startTu);
                
                const baselineSystem = temporalEngine.getTimeSystem('solar');
                let html = '';
                
                if (baselineSystem) {
                    const val = tuDiff / (baselineSystem.conversion_factor || 1);
                    html += `<div class="tooltip-date-primary" style="font-weight:bold; color:var(--text-primary); margin-bottom:4px;">${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${baselineSystem.abbreviation || baselineSystem.id}</div>`;
                }

                const otherSystems = new Set();
                state.activeEpochRulers.forEach(epochId => {
                    const epoch = temporalEngine.getEpochs().find(e => e.id === epochId);
                    if (epoch && epoch.time_system && epoch.time_system !== 'solar') {
                        otherSystems.add(epoch.time_system);
                    }
                });

                otherSystems.forEach(sysId => {
                    const sys = temporalEngine.getTimeSystem(sysId);
                    if (sys) {
                        const val = tuDiff / (sys.conversion_factor || 1);
                        html += `<div class="tooltip-date-secondary" style="font-size:0.9em; color:var(--text-secondary);">${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${sys.abbreviation || sys.id}</div>`;
                    }
                });
                
                m.tooltip.innerHTML = `<div class="tooltip-date-container" style="margin-bottom:0;">${html}</div>`;
                m.tooltip.style.display = 'block';
                
                const padding = 15;
                const cssEndX = endX / scaleX;
                const cssScreenY = currentScreenY / scaleY;
                
                m.tooltip.style.left = `${cssEndX + rect.left + padding}px`;
                m.tooltip.style.top = `${cssScreenY + rect.top - 25}px`;
                
            } catch (err) {
                console.error("MeasureTool render error for measurement:", err);
            }
        });
    }
    
    get isDragging() {
        return this.status === 'drawing';
    }
}

const measureTool = new MeasureTool();
export default measureTool;
