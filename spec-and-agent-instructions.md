# Coding Agent Instructions

## 1. Professional Persona
* **Role:** Senior Frontend Architect. You favor robust, modular, and DRY (Don't Repeat Yourself) code.
* **Focus:** Performant, client-side web architecture with high-fidelity visual rendering.

## 2. Versioning & Change Management
* **Changelog:** After every feature completion, update CHANGELOG.md with version (v0.x.x), date, and changes.
* **Headers:** Every modified file must have a "Last Modified" comment at the top.

## 3. Implementation Workflow (Plan-First)
* **The 'Think' Phase:** Before writing code, provide a "Plan of Action" for user approval.
* **Verification:** Explain how you verified the code against the Technical Guardrails in Doc 1.

## 4. Quality Guardrails
* **No Shortcuts:** Never use hard-coded pixel offsets for centering. Use Flex/Grid.
* **Modularity:** Separate DOM manipulation from business logic.
* **Cleanup:** Ensure all event listeners are named functions for proper cleanup.

## 5. Definition of Done (DoD)
*Before declaring a task finished, verify:*
1. [ ] No placeholder comments remain.
2. [ ] All new functions are documented with JSDoc.
3. [ ] CHANGELOG.md is updated.
4. [ ] The UI remains responsive and functional down to 320px width.

# Environment & Tech Stack

## 1. Network & Asset Mandate
* **Constraint:** The application is a client-side web app. 
* **External Access:** Allowed. You are encouraged to use reliable CDNs (e.g., cdnjs, unpkg) for external libraries, web fonts (e.g., Google Fonts), and graphical assets to ensure high-quality rendering.

## 2. The Tech Stack
* **HTML/CSS/JS:** HTML5, CSS3 (Modern features), ES6+ Modules.
* **Build Tools:** Direct Browser execution (Vanilla JS Modules) utilizing CDN imports.

## 3. Persistence Layer
* **Primary Storage:** IndexedDB (for high-volume event data).
* **Data Format:** Strict JSON. 
* **Backup:** Must include a 'Download/Export JSON' feature for data portability.

## 4. Data Communication Contract
* **Protocol:** Global State Object with a Custom Event Bus for UI updates.

## 5. Library White-list
* Core: Vanilla JS (No heavy framework overhead like React/Vue).
* High-Performance Rendering: PixiJS, Three.js, or D3.js (via CDN) for complex timeline canvas and spline rendering.
* Animation: GSAP or Anime.js (via CDN) for smooth zooming and transition effects.
* Assets: Web-hosted icon libraries (e.g., FontAwesome, Lucide via CDN) and web fonts.

# The Great Tale Timeline - Project Instance

## 1. Project Summary
* **Name:** The Great Tale Timeline
* **Description:** A high-performance, data-driven chronological engine for visualizing complex historical narratives across vast scales. While initialized with Tolkien’s Arda, the system is designed as a world-agnostic "Historical GIS" that maps the intersection of time, geography, and biography.
* **Key Features:** * **Elastic Master Scale ($T_u$):** A unified coordinate system starting from the Years of the Lamps ($≈ 34,000$ solar years) that handles "Epoch-specific" dating overlays (Valian, Solar, Age-relative).
    * **Dual-Axis Rendering Engine:** Supports a "Geographic Flow" mode (migration splines across regional lanes) and a "Biographical Stack" mode (comparative lifespan Gantt charts).
    * **Temporal Fuzziness Logic:** Visual rendering of chronological uncertainty using gradient "mist" effects for events with approximate date ranges.
    * **Sub-Event Nesting:** Hierarchical event management where "Parent" events (e.g., War of the Jewels) contain "Child" events (e.g., Nirnaeth Arnoediad) without visual clutter.
    * **High-Density Fly-out Matrix:** A comprehensive visibility controller for filtering by Entity Race, Affiliation, Importance, and Geographic Lane.

## 2. Feature Modules
* **Temporal Mapping Engine (The "Core"):** Translates diverse dating systems into a single `BigInt` or high-precision float Master Scale. Handles the 1:9.582 Valian-to-Solar conversion and manages the "Year 0/1" transition logic between Ages.
* **Spatial Lane Controller:** Manages the vertical Y-axis. In Geographic mode, it maps events to `lane_ids`; in Biographical mode, it maps to `entity_ids`. Calculates Bézier spline paths between lanes based on the chronological sequence of a character's presence.
* **Canvas Lifecycle Manager:** A performance-first rendering loop using `requestAnimationFrame` and your chosen graphics library (e.g., PixiJS). Manages "Level of Detail" (LoD)—as the user zooms out, smaller events cluster into "Summary Nodes" to maintain 60fps performance.
* **Schema Validation Service:** Ensures any uploaded JSON follows the world-agnostic contract. Sanitizes inputs and prevents XSS.

## 3. User Stories
* **Story 1:** As a researcher, I want to see Galadriel's lifespan as a continuous line that "flows" from Valinor to Beleriand, so I can see exactly when she crossed the Helcaraxë.
* **Story 2:** As a writer, I want to compare the lifespans of the Kings of Númenor against the Kings of Gondor side-by-side to visualize the "Waning of the Dúnedain".
* **Story 3:** As a user, I want to zoom from a 10,000-year overview down to a single month in the year 3019 T.A. to see the precise day-by-day movements of the Fellowship.
* **Story 4:** As a world-builder, I want to toggle a "Solar Scale" overlay on top of the "Valian Age" so I can translate ancient history into modern temporal context.
* **Story 5:** As a user, I want to see a "blurred" event card for the birth of an ancient character, signifying that the date is a historical approximation rather than a hard fact.

## 4. UI/UX Design
* **The "Scholar’s Palette":** Deep slate backgrounds (`#1a1b26`) with parchment-colored text for high legibility. Entity lines color-coded by "Race" metadata (e.g., Silver for Teleri, Gold for Vanyar, Copper for Dwarves).
* **Interactive Elements:** * **Elastic Rulers:** Sticky headers at the top of the viewport that expand/contract as the user zooms. Multiple rulers (Solar/Valian) can be stacked.
    * **Glassmorphism Tooltips:** Hovering over an event triggers a semi-transparent card showing description, participants, and "Causal Links" to other events.
    * **Spline Dynamics:** Migration lines should have a "flow" animation or directionality arrows when zoomed in.
* **Fly-out Panel:** A "Busy" sidebar with nested checkboxes for "Lanes" (Geography), "Entities" (Characters/Races), and "Event Importance" (1-10).

## 5. Technical Specifics & Guardrails
* **World-Agnostic Directive:** The engine must not contain "Middle-earth" specific strings. All labels, conversion ratios, and lane names must be ingested via the JSON `config` and `data` files.
* **Coordinate System:** Use a "Master Scale" anchored at $T_0$ (First Year of the Lamps). Maximum zoom resolution must support 1 Solar Year = Viewport Width.
* **Data Integrity:** Once loaded, event positions are fixed. The user cannot drag events; they can only toggle visibility or add new data via the persistence layer. All event descriptions must be sanitized to prevent HTML injection.

## 6. Boundary Conditions
* **The "Great Void":** Handling time before the Years of the Lamps (The Music of the Ainur) as a non-linear "Prologue" section.
* **Geographic Erasure:** Handling the removal of a "Lane" from the UI (e.g., Beleriand sinking) without breaking the character splines that pass through that time-gate.
* **Immortal Persistence:** Entities with no death date default to "Active" until the end of the Master Scale or a specific "Departure" event.

## 7. Project-Specific Logic (Data Schema)

### A. The World Config
    {
      "world_name": "Arda",
      "time_systems": [
        { "id": "solar", "name": "Solar Year", "base_unit": 1 },
        { "id": "valian", "name": "Valian Year", "conversion_factor": 9.582 }
      ],
      "epochs": [
        { "id": "lamps", "start_tu": 0, "end_tu": 33537, "primary_system": "valian" }
      ]
    }

### B. The Event Schema
    {
      "events": [
        {
          "id": "event_001",
          "title": "The Darkening of Valinor",
          "time_extent": {
            "start": 1495.0,
            "end": 1495.0,
            "is_approximate": false
          },
          "lane_id": "lane_valinor",
          "participants": ["char_melkor", "char_ungoliant"],
          "type": "catastrophe",
          "importance": 10
        }
      ]
    }

### C. The Entity Schema
    {
      "entities": [
        {
          "id": "char_galadriel",
          "name": "Galadriel",
          "metadata": { 
            "race": "Elf", 
            "subrace": "Noldor/Teleri", 
            "color": "#EEDD82" 
          }
        }
      ]
    }

### D. The Lane Schema
    {
      "lanes": [
        { "id": "lane_valinor", "label": "Valinor", "color_hint": "#f1f1f1" },
        { "id": "lane_beleriand", "label": "Beleriand", "color_hint": "#2e4a31" }
      ]
    }