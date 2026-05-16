# Changelog

All notable changes to The Great Tale Timeline are documented here.

## [v0.1.0] — 2026-05-15

### Added
- **Core Architecture**: EventBus pub/sub system, StateManager with reactive state, TemporalEngine for date system math
- **Canvas Engine**: PixiJS 8 integration with layered rendering (epochs, lanes, splines, events, UI overlay)
- **Zoom & Pan**: Mouse wheel zoom with cursor-anchoring via GSAP smooth interpolation, click-drag panning
- **Epoch Backgrounds**: Colored epoch regions rendered on the canvas with labels
- **Elastic Ruler**: DOM-based adaptive time ruler with epoch color bands, supporting stacked time systems (Solar + Valian)
- **Geographic Lanes**: Horizontal lane bands with labels, color coding, and Geographic Erasure (fading end effect)
- **Event Nodes**: Point events (circles) and range events (bars), importance-based sizing, type-based color coding
- **Temporal Fuzziness**: Blur "mist" effect on approximate events
- **Entity Splines**: Catmull-Rom → Bézier migration paths across geographic lanes with entity color coding
- **Biographical Mode**: Gantt-chart lifespan view with sortable entity rows (birth, race, duration, alphabetical)
- **Immortal Persistence**: Entities without death dates extend to timeline end
- **Flyout Panel**: High-density filter matrix with lane checkboxes, entity checkboxes (grouped by race), importance slider, search, and display settings
- **Great Void Prologue**: Toggleable animated mist region for pre-Lamps era
- **Glassmorphism Tooltips**: Event detail cards with type badges, importance stars, participant chips, GSAP animations
- **Import/Export**: JSON file upload with drag-and-drop, schema validation, progress indicator, and JSON download export
- **IndexedDB Persistence**: Dexie.js-backed auto-save with debounced writes and data recovery on page refresh
- **LoD Clustering**: Spatial grid bucketing for event clustering at extreme zoom-out
- **Schema Validation**: Full validation of World Config, Events, Entities, and Lanes schemas with XSS sanitization
- **Keyboard Shortcuts**: G (Geographic), B (Biographical), V (Visibility), F (Fit), +/- (Zoom)
- **Sample Dataset**: Tolkien/Arda dataset with 30 events, 12 entities, 8 lanes spanning 50,941 solar years
- **Scholar's Palette**: Dark UI theme with Cinzel Decorative headings, Inter body text, custom checkboxes/toggles/sliders
- **Responsive Design**: Functional down to 320px width with progressive toolbar collapse
