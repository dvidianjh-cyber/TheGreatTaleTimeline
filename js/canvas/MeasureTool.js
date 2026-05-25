import { Graphics, Text, TextStyle, Container } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.18.1/dist/pixi.min.mjs';
import temporalEngine from '../core/TemporalEngine.js';
import state from '../core/StateManager.js';
import bus, { Events } from '../core/EventBus.js';

class MeasureTool {
    constructor() {
        this.layer = null;
        this.graphic = new Graphics();
        this.label = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'sans-serif',
                fontSize: 14,
                fill: '#2c251c',
                align: 'center',
                fontWeight: 'bold',
                dropShadow: {
                    alpha: 0.8,
                    blur: 2,
                    color: 0xffffff,
                    distance: 0,
                }
            })
        });
        
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
    }

    init(layer) {
        this.layer = layer;
        this.graphic.eventMode = 'none';
        this.label.eventMode = 'none';
    }

    clear() {
        this.isDragging = false;
        if (this.graphic.parent) {
            this.graphic.parent.removeChild(this.graphic);
        }
        if (this.label.parent) {
            this.label.parent.removeChild(this.label);
        }
        bus.emit(Events.RENDER_DIRTY);
    }

    onPointerDown(e, canvasManager) {
        this.isDragging = true;
        
        // Coordinates in screen space
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.endX = e.clientX;
        this.endY = e.clientY;
        
        if (!this.graphic.parent) {
            this.layer.addChild(this.graphic);
            this.layer.addChild(this.label);
        }
        
        this._updateVisuals();
    }

    onPointerMove(e, canvasManager) {
        if (!this.isDragging) return;
        
        this.endX = e.clientX;
        this.endY = e.clientY;
        
        this._updateVisuals();
    }

    onPointerUp(e, canvasManager) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        // Keep it visible until cleared or started again
    }

    _updateVisuals() {
        this.graphic.clear();
        
        const width = this.endX - this.startX;
        if (Math.abs(width) < 2) {
            this.label.text = '';
            bus.emit(Events.RENDER_DIRTY);
            return;
        }

        // Draw measurement line
        this.graphic.moveTo(this.startX, this.startY);
        this.graphic.lineTo(this.endX, this.startY);
        this.graphic.stroke({ width: 2, color: 0x4a90e2, alpha: 0.8 });
        
        // Draw end ticks
        this.graphic.moveTo(this.startX, this.startY - 10);
        this.graphic.lineTo(this.startX, this.startY + 10);
        this.graphic.stroke({ width: 2, color: 0x4a90e2, alpha: 0.8 });
        
        this.graphic.moveTo(this.endX, this.startY - 10);
        this.graphic.lineTo(this.endX, this.startY + 10);
        this.graphic.stroke({ width: 2, color: 0x4a90e2, alpha: 0.8 });

        // Calculate time difference
        // Convert screen coordinates to world X, then to TU
        const panX = state.panOffset.x;
        const pptu = state.pixelsPerTU;
        
        const worldStartX = (this.startX - panX) / pptu;
        const worldEndX = (this.endX - panX) / pptu;
        
        const tuDiff = Math.abs(worldEndX - worldStartX);
        
        // Format to primary time system
        const primarySystem = temporalEngine.getPrimarySystem();
        let formattedText = Math.round(tuDiff) + " TU";
        
        if (primarySystem) {
            const val = tuDiff / (primarySystem.conversion_factor || 1);
            formattedText = val.toLocaleString(undefined, { maximumFractionDigits: 1 }) + " " + (primarySystem.abbreviation || primarySystem.id);
        }

        this.label.text = formattedText;
        this.label.x = this.startX + width / 2;
        this.label.y = this.startY - 25;
        this.label.anchor.set(0.5, 0.5);
        
        bus.emit(Events.RENDER_DIRTY);
    }
}

const measureTool = new MeasureTool();
export default measureTool;
