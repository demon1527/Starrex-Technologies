# Phase 5.1A — Existing Saturn Implementation Inventory

## Purpose

This is a read-only inventory of the user-confirmed working Saturn implementation. It records the current responsibilities and migration constraints before any renderer code is moved.

**No production code was changed for this inventory.** The active baseline remains `Starrex Technologies/js/modules/saturn.js`.

## 1. Entry point and script loading

- Both `index.html` and `contact.html` include `<canvas id="planet">`.
- Both pages load Three.js `0.160.0` from jsDelivr with the existing deferred classic script:
  `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`.
- Both pages then load `js/main.js` as a module at the end of the body.
- `js/main.js` side-effect imports `./modules/saturn.js` before initializing navigation, contact-form behaviour and footer behaviour.
- `saturn.js` is an immediately invoked function expression (IIFE). It expects the global `window.THREE` to exist and exits safely with a warning if the canvas or Three.js is missing.

**Migration constraint:** preserve this exact working loading arrangement until a browser-observed error demonstrates that it must change. Do not switch CDN builds, script types or import strategy as part of an unrelated refactor.

## 2. Renderer and scene ownership

The Saturn IIFE currently owns all WebGL state privately:

- One `THREE.WebGLRenderer` bound to the existing canvas, with alpha and antialias enabled.
- Device pixel ratio capped at `2`.
- One `THREE.Scene`.
- One perspective camera (40-degree field of view) positioned at Z = 10.
- One main group containing the Saturn composition.
- No public engine API, planet factory or manager exists yet.

Renderer creation is protected by a try/catch. If WebGL initialization fails, the script logs a warning and returns without preventing the HTML page from loading.

## 3. Saturn-specific visual construction

The module builds the visual locally; it does not download planet textures.

- Procedural Saturn surface texture is generated with canvas-based drawing and converted to a `THREE.CanvasTexture`.
- Procedural ring texture is also generated locally and used by the ring shader.
- The ring system uses a `THREE.RingGeometry` with 256 segments and a custom shader material.
- The planet body uses a sphere with 128 × 128 segments and a custom shader material.
- The atmosphere uses a slightly larger sphere (1.07 × planet radius) with its own shader material.
- Far and near star fields are generated as `THREE.Points` objects.
- The Saturn composition, procedural textures, ring orientation, shaders and visual constants are all currently in this single module.

**Migration constraint:** these visual details are not generic engine responsibilities. Keep them Saturn-specific and preserve the current geometry, shaders, lighting, scale and composition during the first migration.

## 4. Layout, resize and interaction

- The renderer is sized to the viewport on initialization and window resize.
- Camera aspect and projection are updated after resize.
- Saturn's responsive placement is calculated from camera field of view and viewport aspect.
- Portrait mode uses a smaller group scale and a lower starting position.
- Pointer movement updates a private mouse target; the animation loop eases the planet toward the target.
- Pointer parallax is disabled when reduced motion is enabled.

## 5. Scroll behaviour

Scroll movement is calculated inside the Saturn animation loop:

- Page height is based on the larger of document-element and body scroll heights.
- Current scroll position is normalized against the available scroll range.
- A smoothstep easing curve controls the vertical lift.
- Landscape scroll travel is 6.0 units; portrait travel is 6.4 units.
- Scroll-driven movement remains active with reduced motion enabled; the preference reduces decorative rotation and pointer parallax instead.

**Migration constraint:** do not move or rewrite this calculation while introducing the first engine boundary. Its current visual behaviour is part of the confirmed baseline.

## 6. Animation and browser lifecycle

- The module schedules frames with `requestAnimationFrame`.
- A single frame ID is tracked to prevent duplicate animation loops.
- The loop checks disposal state, context-loss state and document visibility before rendering.
- The loop is stopped with `cancelAnimationFrame` when the document becomes hidden.
- It restarts when the document becomes visible.
- The `webglcontextlost` handler calls `preventDefault()`, records the lost state and stops animation.
- The `webglcontextrestored` handler clears the lost state, resizes and restarts animation.
- A `prefers-reduced-motion` media query controls rotation speed and pointer parallax.
- Compatibility fallback uses `MediaQueryList.addListener` when `addEventListener` is unavailable.

## 7. Current limitations relevant to the future engine

These are observations, not immediate defects in the current multi-page site:

1. **No reusable lifecycle API:** renderer, scene, camera, group and animation state are closure-private.
2. **No planet switching:** Saturn is constructed once; there is no manager or factory interface.
3. **No explicit disposal API:** the module does not expose a method to dispose its renderer, geometries, materials or textures.
4. **No listener teardown:** registered window, document, canvas and media-query listeners are not removed by a public cleanup method. A full document navigation currently tears down the page, but an in-document planet replacement will need explicit lifecycle ownership.
5. **Single-planet assumptions:** visual creation, scroll response, pointer response and renderer lifecycle are interleaved in one IIFE.

These limitations explain what a future engine boundary must solve. They do **not** justify replacing the current implementation in one large change.

## 8. Safe migration boundary

The future separation should be introduced in this order:

1. Define a minimal lifecycle contract without changing the active Saturn implementation.
2. Separate renderer lifecycle from planet-specific scene construction only when the exact ownership boundary is clear.
3. Preserve the same canvas, Three.js loading order, renderer settings, camera, geometry, shaders, position and scroll calculations.
4. Add explicit disposal only as part of the controlled migration, with each resource disposed by the module that owns it.
5. Keep the old working implementation available on the feature branch until the replacement passes the same Home and Contact checks.

Do not add empty planet modules, a second renderer, a second animation loop or a framework/router rewrite.

## 9. Regression gate before any new planet

After a migration step, manually verify:

- Home: Saturn is visible, on the right, with its rings and subdued lighting.
- Home: Saturn moves upward with scroll, disappears near the bottom and returns when scrolling upward.
- Contact: Saturn is visible and behaves consistently on the shorter page.
- Desktop and mobile viewport sizes.
- Reduced-motion preference.
- Switching tabs away and back.
- WebGL unavailable/context-loss fallback.
- Navigation, sound control, footer and contact form remain unaffected.

The user should test the browser result after each meaningful migration commit. Source inspection alone is not proof of visual correctness.

## 10. Proposed first migration contract

The first migration increment has extracted only the requestAnimationFrame scheduler. The Saturn module still owns the renderer, scene, camera and browser lifecycle. The remaining target boundary is documented below.

### Engine owns

- The existing canvas reference.
- The one `WebGLRenderer`, scene and perspective camera.
- The only animation-frame scheduler.
- Resize, visibility, WebGL context-loss/restoration and reduced-motion listeners.
- Pointer and scroll measurements, exposed to the active planet as read-only frame context.
- Mounting and unmounting the active planet object.
- Final teardown of its listeners, animation frame and renderer.

### Saturn module owns

- Saturn's procedural surface and ring texture generation.
- Saturn's planet, ring, atmosphere and star geometry/materials.
- Saturn-specific visual constants and composition.
- Saturn-specific per-frame rotation and transforms, driven by values supplied by the engine.
- Disposal of every geometry, material and texture it creates.

### Minimal planet factory shape

The eventual Saturn factory should be a pure creator from the engine's perspective: it receives the Three.js namespace and returns a visual object plus lifecycle methods. It must not create a renderer, camera, animation loop or browser event listeners.

Conceptual interface (not implemented yet):

```js
createSaturnPlanet(THREE) => ({
  object3D,                 // root group added to the engine scene
  update(frameContext),     // called by the engine's single animation loop
  dispose(),                // releases Saturn-owned GPU resources
});
```

The engine's `frameContext` should provide measured values such as elapsed time, viewport dimensions, normalized scroll progress, pointer position and reduced-motion state. Saturn should not independently read global scroll or pointer state once those responsibilities are moved.

### Migration order

1. Extract the renderer setup and scene/camera creation into the engine while keeping the existing visual construction unchanged.
2. Make the engine call the Saturn factory and attach its returned root object to the scene.
3. Move the existing resize, visibility, context and motion listeners into the engine without changing their behaviour.
4. Move scroll and pointer measurements into engine frame context; preserve the existing easing, travel values and interpolation.
5. Add explicit Saturn resource disposal and engine teardown.
6. Remove the legacy Saturn IIFE only after Home and Contact pass the full regression gate.

### Important guardrails

- Keep the existing deferred global Three.js script and module entry arrangement unchanged during the first migration.
- Do not import a second Three.js build from a CDN.
- Do not run the legacy Saturn IIFE and new engine simultaneously; that would create competing renderers.
- Do not add transition choreography or another planet during this migration.
- Keep the current Saturn source recoverable through Git history and the known-good baseline commit.
- If a migration step makes Saturn disappear, revert that step and inspect the actual browser Console before changing script loading or rendering strategy.

This contract is a design target only. No engine or factory code is claimed to exist yet.

## 11. Migration progress — frame scheduler extracted

The first controlled migration increment is now present on `feature/phase-5-planetary-system`:

- Added `js/modules/animation-loop.js`, a small reusable scheduler with guarded `start`, `stop` and `dispose` methods.
- `js/modules/saturn.js` imports the helper and delegates all requestAnimationFrame scheduling to it.
- The Saturn frame callback still performs the same rotation, star motion, scroll easing, pointer interpolation and render operations.
- The scheduler checks the caller's `shouldRun` predicate before and after each frame and avoids duplicate pending frame requests.
- The Saturn initialization error path disposes the scheduler.
- Direct requestAnimationFrame/cancelAnimationFrame references have been removed from `saturn.js`.

**Not yet extracted:** renderer, scene, camera, resize handling, visibility handling, WebGL context lifecycle, reduced-motion listeners, pointer/scroll measurement, Saturn resources and explicit resource teardown.

This increment must pass the user's Home and Contact browser checks before any further lifecycle responsibility is moved.
