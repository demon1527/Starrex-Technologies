## About

Starrex Technologies is an independent software studio focused on practical digital solutions: web development, Python automation, custom software and digital product experiences. This repository contains the studio website, built with semantic HTML, modular CSS and vanilla JavaScript ES modules.

The visual identity includes the established procedural Saturn scene on Home and Contact, a dedicated Products page with a procedural lunar scene and graphite-and-silver theme, a dedicated Projects page with an Earth scene and ocean-blue theme, and a dedicated Services page with a Mars scene and a warm rust/charcoal theme. Direction-aware transitions connect the planetary pages. The site intentionally keeps the existing lightweight, no-build-step frontend architecture.

## Current website

### Pages and sections

| Page / section | URL | Description |
| --- | --- | --- |
| Home | `Starrex Technologies/index.html#home` | Studio introduction and overview |
| Products | `Starrex Technologies/products.html` | Product directions and principles, presented with the Moon planetary visual |
| Projects | `Starrex Technologies/projects.html` | Project capabilities and delivery approach, presented with the Earth planetary visual |
| Services | `Starrex Technologies/services.html` | Service areas, working approach and enquiry path, presented with the Mars planetary visual |
| About | `Starrex Technologies/index.html#about` | Studio introduction and values |
| Contact | `Starrex Technologies/contact.html` | Contact details and project enquiry form |

The Services page is the Mars destination: a rust-red planet with darker terrain, dusty polar regions and a very subtle warm haze. Its content outlines service areas such as web development, custom software, automation, UI/UX and technical prototyping. Exact deliverables and terms are scoped for each enquiry; the page does not promise unverified timelines or outcomes.

The Projects page is the Earth destination: a blue planet with a restrained atmospheric rim, cloud detail and no rings. Its content explains project capabilities and the delivery approach; it does not invent client case studies or claim unverified outcomes.

The Products page is the first Moon destination prototype: a grey, cratered lunar surface with hard lighting and no atmosphere. Its content presents four product directions—digital platforms, workflow tools, automation utilities and digital resources. These are areas of focus, not a live catalogue. No individual product names, release dates, prices or availability are claimed.

## Features

- **Planetary backgrounds:** Home and Contact retain the proven Saturn implementation. Products has a separate Moon scene prototype using the shared animation-loop, viewport and visibility helpers. The Moon has a procedurally generated crater texture, restrained star field and no atmosphere or rings. Projects has an Earth scene with a detailed hosted surface texture, local fallback map, thin atmospheric rim and restrained cloud layer. Services has a Mars scene with a procedural iron-oxide surface, darker terrain regions, crater detail, dusty polar areas and a faint warm haze. A static CSS planet fallback remains available when WebGL or external textures are unavailable.
- **Planetary page transitions:** normal multi-page navigation is preserved. A short outgoing/incoming handoff carries the direction across the document load: forward navigation travels left and backward navigation travels right. Reduced-motion preferences bypass the cinematic effect.
- **Ambient sound:** generated with the Web Audio API and off by default; its scheduler stops when sound is disabled or the tab is hidden.
- **Responsive navigation:** desktop links and an accessible mobile menu with keyboard focus handling.
- **Dedicated Products page:** responsive lunar-themed product-direction overview with a distinct graphite, mineral-silver and restrained lavender palette, separate from the Saturn/Home atmosphere.
- **Dedicated Projects page:** responsive project-capability overview with a distinct deep-ocean navy, atmospheric blue and restrained cyan palette. Capability categories are clearly distinguished from completed client case studies.
- **Dedicated Services page:** responsive service overview with a distinct rust-red, warm charcoal and muted copper palette. Service areas are presented as enquiry-based capabilities, with scope and terms confirmed per project.
- **Dedicated contact page:** enquiry form with client-side validation, a honeypot field and delivery through FormSubmit.
- **Accessibility basics:** semantic landmarks, skip links, visible keyboard focus and live form feedback.
- **Page metadata:** descriptive titles/descriptions, Open Graph basics and Twitter summary metadata.

## Tech stack

- HTML5
- CSS3 (shared foundation/navigation plus page-specific stylesheets)
- Vanilla JavaScript using ES modules
- [Three.js](https://threejs.org/) `0.160.0`, loaded from jsDelivr
- Web Audio API
- [Inter](https://fonts.google.com/specimen/Inter), loaded from Google Fonts
- [FormSubmit](https://formsubmit.co/) for contact-form delivery

There is no npm install or compilation/build step in the current website.

## Project structure

```text
.
├── README.md
├── docs/
│   ├── PHASE-5-PLANETARY-SYSTEM.md
│   └── PHASE-5-SATURN-INVENTORY.md
└── Starrex Technologies/
    ├── index.html
    ├── products.html
    ├── projects.html
    ├── services.html
    ├── contact.html
    ├── robots.txt
    ├── css/
    │   ├── base.css
    │   ├── navigation.css
    │   ├── sections.css
    │   ├── responsive.css
    │   ├── planet-transitions.css
    │   ├── themes/
    │   │   ├── moon.css
    │   │   ├── earth.css
    │   │   └── mars.css
    │   └── pages/
    │       ├── home.css
    │       ├── products.css
    │       └── contact.css
    ├── js/
    │   ├── main.js
    │   ├── modules/
    │   │   ├── saturn.js
    │   │   ├── moon.js
    │   │   ├── earth.js
    │   │   ├── mars.js
    │   │   ├── animation-loop.js
    │   │   ├── viewport.js
    │   │   ├── visibility.js
    │   │   ├── planet-transitions.js
    │   │   ├── navigation.js
    │   │   ├── audio.js
    │   │   └── footer.js
    │   └── pages/
    │       └── contact.js
    └── assets/
        ├── images/
        │   ├── starrex-logo.png
        │   └── starrex-logo-stacked.png
        └── Icons/
            └── starrex-icon.png
```

## Run locally

Open a terminal in the `Starrex Technologies` directory and run:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

Use a local web server rather than opening the HTML files directly with `file://`. The JavaScript modules and hosted contact form should be tested through HTTP.

An internet connection is needed for the externally hosted Three.js library, Google Fonts and FormSubmit service.

## Contact form setup

The form sends enquiries to **ehtishamofficial28@gmail.com** through [FormSubmit](https://formsubmit.co/). FormSubmit is a third-party service that processes form submissions.

**One-time activation is required:** submit a genuine test enquiry, then open the activation email sent by FormSubmit to the destination inbox and confirm it. Until activation is confirmed, normal delivery is not active. Check spam/junk if the email is not visible.

The form uses FormSubmit's AJAX endpoint so visitors receive success/error feedback without being redirected away. Review the provider's [documentation](https://formsubmit.co/documentation) and privacy terms before using the form publicly. Actual delivery must be verified with a real submission; source-code checks do not prove inbox delivery.

## Styling and behaviour map

| Concern | File |
| --- | --- |
| Shared theme, body foundation, Saturn canvas layer and accessibility helpers | `css/base.css` |
| Shared desktop navigation and sound control | `css/navigation.css` |
| Shared styles still used by the About section | `css/sections.css` |
| Shared mobile navigation breakpoints | `css/responsive.css` |
| Homepage layout and responsive styles | `css/pages/home.css` |
| Products page layout and responsive styles | `css/pages/products.css` |
| Projects page layout and responsive styles | `css/pages/projects.css` |
| Services page layout and responsive styles | `css/pages/services.css` |
| Lunar palette and Moon-specific shared-navigation overrides | `css/themes/moon.css` |
| Earth/ocean palette and Earth-specific shared-navigation overrides | `css/themes/earth.css` |
| Mars/rust palette and Mars-specific shared-navigation overrides | `css/themes/mars.css` |
| Direction-aware multi-page planetary transition choreography | `css/planet-transitions.css` and `js/modules/planet-transitions.js` |
| Contact page layout and responsive styles | `css/pages/contact.css` |
| Shared JavaScript entry point | `js/main.js` |
| Saturn background, scene construction and visual updates | `js/modules/saturn.js` |
| Products Moon scene and procedural lunar surface | `js/modules/moon.js` |
| Projects Earth scene, atmosphere and cloud layer | `js/modules/earth.js` |
| Services Mars scene, procedural terrain and polar haze | `js/modules/mars.js` |
| Shared single-frame scheduling helper | `js/modules/animation-loop.js` |
| Shared renderer/camera viewport sizing | `js/modules/viewport.js` |
| Shared document visibility lifecycle | `js/modules/visibility.js` |
| Ambient sound | `js/modules/audio.js` |
| Navigation and active-section behaviour | `js/modules/navigation.js` |
| Shared footer utilities | `js/modules/footer.js` |
| Contact form validation and delivery | `js/pages/contact.js` |

## SEO and deployment notes

- All five HTML pages include unique titles, descriptions, Open Graph title/description/site metadata and Twitter summary metadata.
- The favicon and logo paths are present in the repository.
- A basic `robots.txt` is included in the website root folder.
- A canonical URL and XML sitemap have intentionally **not** been hard-coded yet: the repository does not identify a confirmed public production domain. Add both after the final deployment URL is known; do not use a guessed GitHub Pages or hosting URL.
- The deploy/publish directory must be `Starrex Technologies`, not the repository root, because the website files are nested in that folder.
- This is a static site and can be hosted on GitHub Pages, Netlify, Vercel or another static host. Configure the selected host to publish the nested website directory.

## License

No license has been specified. Unless the repository owner adds one, all rights are reserved.

---

<div align="center">

**Starrex Technologies** · Innovate. Automate. Evolve.

</div>
