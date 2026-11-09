# Phase 5 — Planetary System Architecture

## Purpose

Introduce a reusable planetary background and cinematic page-transition system without replacing the existing vanilla HTML, CSS, and JavaScript architecture or disrupting the current site.

This document defines the implementation boundary for Phase 5. It is a design contract, not a claim that the future planet modules or transitions are already implemented.

## Current baseline (restored and user-confirmed working)

- The site is a multi-page vanilla frontend: `Starrex Technologies/index.html` and `Starrex Technologies/contact.html`.
- Three.js 0.160.0 is loaded from jsDelivr on both pages using the existing deferred classic script.
- Both pages contain a fixed `canvas#planet` behind the page content.
- `Starrex Technologies/js/main.js` is the shared ES-module entry point.
- `Starrex Technologies/js/modules/saturn.js` is the known-working Saturn implementation. It currently owns its renderer, scene, camera, animation loop, responsive behaviour, scroll response, hidden-tab pause and WebGL safety handling.
- The experimental `planet-engine.js` and `js/planets/saturn.js` extraction were removed after causing Saturn to disappear. They are not part of the current codebase.
- Navigation is shared through `js/modules/navigation.js`; homepage navigation currently uses section anchors.
- The user has pulled the rollback and confirmed Saturn is visible and working again on the current branch.
- This working Saturn module is the regression baseline. Do not modify or replace it until a specific, independently verifiable migration step is ready.

## Planet and page mapping

| Navigation item | Destination | Planet |
| --- | --- | --- |
| Home | `index.html` / home page | Saturn |
| Products | Products page (future) | Moon |
| Projects | Projects page (future) | Earth |
| Services | Services page (future) | Mars |
| About | About section on Home | Saturn |

The navigation order remains Home, Products, Projects, Services, About. About is not a separate planet or a separate planetary page.

## Target module boundaries

The target structure should remain small and purpose-driven:

```text
js/
├── main.js
├── modules/
│   ├── planet-engine.js       # One renderer, scene, camera, render loop and lifecycle
│   ├── planet-manager.js      # Active planet selection and safe planet replacement
│   ├── planet-transitions.js  # Direction-aware outgoing/incoming transition choreography
│   ├── planet-navigation.js  # Navigation intent and transition-to-destination handoff
│   ├── navigation.js          # Existing accessible menu and section navigation
│   ├── audio.js
│   └── footer.js
└── planets/
    ├── saturn.js
    ├── earth.js
    ├── moon.js
    └── mars.js
```

This is the intended destination, not a request to create empty placeholder modules. Each module should be introduced only when it has a working responsibility.

### Engine responsibilities

- Own exactly one WebGL renderer, scene, camera, canvas and animation loop.
- Expose a small lifecycle API for loading, activating, transitioning and disposing planet instances.
- Keep the renderer canvas behind all accessible HTML content and non-interactive.
- Handle resize, hidden-tab pause/resume, WebGL context loss/restoration and graceful no-WebGL fallback centrally.
- Respect reduced-motion preferences by replacing elaborate travel with a short, low-motion or immediate transition.
- Avoid creating a second renderer or animation loop when changing planets.

### Planet responsibilities

Each planet module should describe/create only that planet's visual resources and page-specific composition. It must not create its own renderer or permanent animation loop.

- Saturn: preserve the existing procedural banding, ring system, lighting balance, right-side placement and scroll-away behaviour on Home and About.
- Earth: realistic blue planet with a restrained thin atmosphere; no rings.
- Moon: realistic grey cratered surface; no atmosphere; slightly smaller visual scale.
- Mars: realistic rust-red surface with darker terrain, polar caps and very subtle haze.

Planet-specific textures and geometry must be disposed when no longer needed. Texture loading should be lazy so the initial Home page does not download every planet's assets.

## Transition behaviour

- Moving forward in the navigation order (Home → Products → Projects → Services) travels left.
- Moving backward travels right.
- The outgoing planet and incoming planet may overlap only during the transition; do not keep all four full planet scenes active.
- Use a restrained cinematic full-screen travel moment, then settle the destination planet into its established right-side composition.
- About scrolls to the Home About section and keeps Saturn; it must not trigger a planet change.
- Contact remains a separate utility page and keeps the Saturn background unless a later design decision explicitly changes it.
- Navigation must remain usable by mouse, keyboard, touch and assistive technology. A transition must not trap focus or make the page inaccessible.

Because the current site uses separate HTML pages, the transition handoff must account for document navigation. The implementation should use a short outgoing transition followed by normal navigation, with the destination page initializing its own incoming composition. Do not introduce a fragile SPA/router rewrite solely to achieve the effect.

## Performance and accessibility guardrails

- Keep one renderer and one controlled animation loop.
- Load only the active planet and, during a transition, the outgoing/incoming pair.
- Cap device pixel ratio and avoid unnecessarily high-resolution textures on mobile.
- Dispose geometries, materials and textures when an instance is retired.
- Pause rendering when the tab is hidden; recover safely from WebGL context loss.
- Provide a clean static background fallback if WebGL or Three.js is unavailable.
- Keep all navigation labels, page content, forms and controls as ordinary HTML, not embedded in the canvas.
- Ensure reduced-motion users can navigate without cinematic travel.
- Do not add paid APIs, backend services, or new frameworks.

## Incremental implementation sequence

The first extraction attempt was rolled back. Phase 5.1 is therefore **not complete**. The next attempt must be smaller and evidence-led; do not repeat the previous bulk extraction.

1. **5.1A — Baseline inventory (complete):** the current Saturn implementation has been inspected without changing production code. See [PHASE-5-SATURN-INVENTORY.md](PHASE-5-SATURN-INVENTORY.md) for renderer ownership, script loading, scene construction, scroll behaviour, lifecycle handling and migration constraints.
2. **5.1B — Migration seam design (complete):** the proposed engine/planet boundary and factory lifecycle are documented in [PHASE-5-SATURN-INVENTORY.md](PHASE-5-SATURN-INVENTORY.md). The engine will own renderer, scene, camera, frame scheduling and browser lifecycle; Saturn will own only its visual resources and per-frame visual update. This is a design contract, not implemented code.
3. **5.1C — Controlled migration (first responsibility extracted):** the requestAnimationFrame scheduling mechanism now lives in `js/modules/animation-loop.js`. The existing Saturn module delegates start/stop/dispose to this helper, while retaining its renderer, scene, camera, geometry, shaders, resize handling, scroll calculations, pointer handling and browser event listeners. The Three.js script loading order and HTML entry points were not changed. This is a deliberately partial extraction; browser regression testing is required before moving another responsibility.
4. **5.2 — Regression verification:** verify Home and Contact, desktop/mobile sizes, scroll up/down, hidden-tab behaviour, reduced motion and WebGL fallback. Do not proceed until Saturn matches the current baseline.
5. **5.3 — Transition controller:** add direction-aware transition choreography with Saturn-to-Saturn test transitions first; verify page navigation and accessibility.
6. **5.4 — Earth prototype:** add Earth as the first new planet and test Home ↔ Projects transitions before adding other planets.
7. **5.5 — Moon and Mars:** add Products/Moon and Services/Mars only after the Earth path is stable.
8. **5.6 — Polish:** tune timing, atmosphere accents, responsive composition, texture budgets and documentation.

## Out of scope for the first implementation

- Rewriting the site as a single-page application.
- Replacing the existing homepage/contact layouts, menu, audio or contact form.
- Inventing real product, project or service catalogue content.
- Adding all four planets in one large change.
- Changing the current Saturn artwork or scroll behaviour during the extraction step.

## Acceptance criteria for 5.1

- Home and Contact still render Saturn with the same recognizable procedural surface, rings, subdued brightness, scale and right-side placement.
- Saturn still moves upward with page scroll and returns when scrolling upward.
- After migration is complete, the shared engine owns the only renderer and animation loop; until then, the existing Saturn module remains the sole owner.
- No duplicate canvas, renderer or event-listener initialization.
- Missing WebGL/Three.js does not break the page content or navigation.
- No other page, navigation, audio or contact-form behaviour is changed.
