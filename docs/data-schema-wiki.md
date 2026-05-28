# World Data Schema Wiki

This document outlines the JSON schema for "World Data" used by the application, specifically structured to assist AI Agents in comprehending the data model and generating new datasets.

## Core Concepts: Time Systems, Epochs, and Rulers

The schema utilizes a dual approach to time, bridging the gap between human-readable historical dates and a universal mathematical timeline.

1. **Absolute Time (TU - Time Units):** An underlying, universal timeline running continuously from `1` to `N`. This is the fundamental coordinate system used by the rendering engine.
2. **Relative Epoch Time:** A human-readable dating system bound to specific historical eras (Epochs) and formatted according to specific Time Systems.

### 1. `world_config.time_systems`
Defines the conversion rates between human-readable years and absolute Time Units (TUs).
- `id` (string): Unique identifier (e.g., `"solar"`, `"valian"`).
- `name` (string): Full display name.
- `abbreviation` (string): Short code (e.g., `"SY"`, `"VY"`).
- `isPrimary` (boolean, optional): If `true`, 1 year in this system equals exactly 1 TU.
- `conversion_factor` (number, optional): If `isPrimary` is false or absent, this dictates how many TUs constitute 1 year in this system (e.g., `9.582` means 1 Valian Year = 9.582 absolute TUs).

### 2. `world_config.epochs`
Defines distinct historical eras. Every epoch maps relative dates back to absolute TUs.
- `id` (string): Unique identifier.
- `label` (string): Display name.
- `abbreviation` (string): Short code used in temporal referencing (e.g., `"FA"`, `"SA"`, `"TA"`).
- `time_system` (string): Reference to a `time_systems` ID. This dictates how years within this epoch scale against absolute TUs.
- `start_tu` (number): The absolute TU coordinate when this epoch begins.
- `end_tu` (number): The absolute TU coordinate when this epoch ends.
- `color` (string): Hex color code for rendering the background era band.

**Inter-relation:** If an event is recorded at "Year 10" of an epoch, the engine calculates its absolute TU coordinate on the timeline as: `epoch.start_tu + (10 * time_system.conversion_factor)`.

### 3. `world_config.rulers`
Defines the visible timescale bands (axes) rendered on the timeline. They provide the visual tick marks and labels to contextualize the timeline.
- `label` (string): Display text for the ruler band.
- `epoch` (string): Reference to an `epochs` ID. The ruler will span the `start_tu` and `end_tu` of this epoch.
- `visible` (boolean): Whether this ruler track is rendered by default.

---

## Data Structure Overview

A World Data JSON file contains the following root keys:

```json
{
  "world_config": { ... },
  "lanes": [ ... ],
  "entities": [ ... ],
  "events": [ ... ]
}
```

### World Config

The `world_config` object contains general settings for the timeline alongside the time systems, epochs, and rulers detailed above.
- `world_name` (string): **REQUIRED.** The name of the world. The engine will fail to load if this is missing.
- `default_mode` (string, optional): The initial view mode, e.g., `"geographic"` or `"biographical"`.
- `default_visible_timespan` (array of numbers, optional): A two-element array representing the default zoom limits in absolute TUs, e.g., `[33000, 52000]`.
- `time_systems`, `epochs`, `rulers` (arrays): As described in the Core Concepts section above.

### Lanes

Lanes represent geographic regions or narrative threads. They act as horizontal tracks for events and entities.
- `id` (string): Unique identifier (e.g., `"lane_valinor"`).
- `label` (string): Display name.
- `color_hint` (string): Base hex color for styling.
- `order` (number): Vertical rendering order (0 is top).
- `end_tu` (number, optional): If the lane ceases to exist (e.g., a destroyed landmass), specify the absolute TU here.

### Entities

Characters, artifacts, or organizations that persist over time.

```json
{
  "id": "char_unique_id",
  "name": "Entity Name",
  "metadata": {
    "race": "Elf",
    "subrace": "Noldor",
    "color": "#ffd700",
    "sub_area": "Rivendell" // Fallback sub-area for the entity's path and auto-generated birth/death events
  },
  "lifespan": { ... } // See "Temporal Representation" below
}
```

### Events

Singular or ranged occurrences in the timeline.

```json
{
  "id": "evt_unique_id",
  "title": "Event Title",
  "description": "Short summary of the event.",
  "time_extent": { ... }, // See "Temporal Representation" below
  "lane_id": "lane_valinor", // Reference to a lane id
  "sub_area": "Specific Location", // Textual sub-region
  "participants": ["char_unique_id"], // Array of entity IDs involved
  "type": "battle", // E.g., creation, catastrophe, birth, political, migration, founding, battle, war, death, quest
  "importance": 9 // Scale 1-10 dictating visual prominence
}
```

---

## Temporal Representation (Lifespans & Time Extents)

Both entities (`lifespan`) and events (`time_extent`) can define their temporal presence using either **Absolute** or **Relative** formats. AI Agents generating datasets should prefer **Relative Epoch Formats** whenever human-readable dates are provided by the lore.

### Absolute Format (TU based)
Uses explicit, pre-calculated global Time Units.
- **For Entities:**
  - `start_tu`: Absolute start time.
  - `death_tu` OR `departure_tu`: Absolute end time.
  - `birth_lane_id`, `death_lane_id`, `departure_lane_id`: Lane context at start/end.
  - `birth_sub_area`, `death_sub_area`, `departure_sub_area`: Textual sub-region to visually stagger the start/end point within the lane.

### Relative Epoch Format (Preferred)
References a specific Epoch abbreviation to compute dates dynamically.

**For Entities (`lifespan`):**
```json
"lifespan": {
  "date_unit": "TA", // Matches an epoch's 'abbreviation'
  "birth": 2932, // Year within that epoch
  "birth_lane_id": "lane_eriador",
  "birth_sub_area": "Rivendell", // Staggers the auto-generated birth event vertically in the lane
  "death": 3022, // Year within that epoch (or use 'departure' instead of 'death')
  "death_lane_id": "lane_gondor",
  "death_sub_area": "Minas Tirith", // auto-generated death event vertically in the lane
  "is_approximate": false // (optional) Renders with visual fuzziness if true
}
```

**For Events (`time_extent`):**
```json
"time_extent": {
  "date_unit": "YL", // Matches an epoch's 'abbreviation'
  "start": 3500, // Year within that epoch
  "end": 3500, // Year within that epoch (same as start for point events)
  "is_approximate": false // (optional) Renders with visual fuzziness if true
}
```

---

## AI Agent Guidelines for Dataset Generation

1. **Relational Integrity:** Ensure `participants` in events only reference valid entity `id`s. Ensure `lane_id` references valid lane `id`s.
2. **Temporal Consistency:** Ensure all `date_unit` references exactly match the `abbreviation` field of an epoch defined in `world_config.epochs`.
3. **Calculations & Math:** When setting up a new `world_config`, ensure that the math aligns. `start_tu` and `end_tu` of epochs must accommodate the years multiplied by their respective `conversion_factor`.
4. **Idempotency & Conventions:** IDs should be unique, slugified, and prefixed by type (e.g., `char_`, `evt_`, `lane_`).
