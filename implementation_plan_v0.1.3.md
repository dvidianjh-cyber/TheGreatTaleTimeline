# Implementation Plan - Coordinate & Zoom Stability Fix

I have identified a fundamental flaw in the coordinate system where the scale of the world (`pixelsPerTU`) is dependent on the dynamic `viewportWidth`. This causes drifting when resizing and scaling mismatches between the DOM-based Ruler and the PixiJS-based Canvas.

## Proposed Changes

### 1. [MODIFY] StateManager.js
- **Fixed Base Scale**: Change `pixelsPerTU` to use a constant base (e.g., `1 TU = 0.05px` at zoom=1) instead of `viewportWidth / 34000`. This ensures the world scale is consistent regardless of monitor size or window resizing.
- **Visible Range Fix**: Ensure `visibleTimeRange` correctly calculates the TU range based on the fixed scale.

### 2. [MODIFY] CanvasManager.js
- **Viewport Resize**: Update `_handleResize` to use the canvas container's actual dimensions.
- **Stable Zooming**: Refine the `_handleWheel` logic to ensure the "zoom-to-mouse" feature remains pixel-perfect with the new fixed-scale system.

### 3. [MODIFY] LaneRenderer.js
- **Sticky Labels**: Since labels are now inside the panned `worldContainer`, they will be updated to subtract the current `panX` so they stay "locked" to the left edge of the screen (e.g., `x = -panX + margin`).
- **Infinite Bands**: Ensure lane backgrounds extend far enough to cover the entire timeline world-space.

### 4. [MODIFY] RulerRenderer.js
- **Coordinate Sync**: Verify the tick positioning logic perfectly matches the Canvas world-to-screen projection (`tu * pptu + panX`).

## Verification Plan

### Automated Tests (Browser)
- Load the app and verify the start of "Years of the Trees" aligns with the `33,538 SY` tick.
- Zoom in and out; verify the background and ruler label stay locked together.
- Pan the timeline; verify the "Solar Year" labels move in sync with the lane backgrounds.
- Verify event nodes are visible even at high zoom levels.
