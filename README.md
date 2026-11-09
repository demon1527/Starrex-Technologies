<div align="center">

<img src="Starrex%20Technologies/assets/images/starrex-logo-stacked.png" alt="Starrex Technologies" width="320" />

# Starrex Technologies

**Innovate · Automate · Evolve**

The official website of Starrex Technologies, an independent software studio focused on modern digital experiences, custom software and practical automation.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-A855F7)

</div>

---

## About

Starrex Technologies is an independent software studio focused on practical digital solutions: web development, Python automation, custom software and digital product experiences. This repository contains the studio website, built with semantic HTML, modular CSS and vanilla JavaScript ES modules.

The visual identity includes a procedural Saturn scene, ambient sound controls, responsive navigation and a dedicated contact page. The site intentionally keeps the existing lightweight, no-build-step frontend architecture.

## Current website

### Pages and sections

| Page / section | URL | Description |
| --- | --- | --- |
| Home | `Starrex Technologies/index.html#home` | Hero and studio introduction |
| Products | `Starrex Technologies/index.html#products` | Digital product direction and concepts |
| Projects | `Starrex Technologies/index.html#projects` | Project capabilities: web experiences, custom software and automation |
| Services | `Starrex Technologies/index.html#services` | Ways the studio can help |
| Our approach | `Starrex Technologies/index.html` | Understand, plan, build and refine |
| About | `Starrex Technologies/index.html#about` | Studio introduction and values |
| Contact | `Starrex Technologies/contact.html` | Contact details and project enquiry form |

The Products and Projects sections describe the studio's direction and capabilities; they are not presented as a live product catalogue or fabricated client case studies.

## Features

- **Saturn background:** the proven Saturn implementation remains active. Its frame scheduler, renderer/camera viewport sizing and document visibility observation are now shared helpers; Saturn still owns its scene, renderer, camera and visual updates. The full multi-planet engine is planned, not yet implemented.
- **Motion and lifecycle handling:** pointer/scroll response, responsive composition, reduced-motion awareness, hidden-tab pause, WebGL context recovery and a static fallback when WebGL is unavailable.
- **Ambient sound:** generated with the Web Audio API and off by default; its scheduler stops when sound is disabled or the tab is hidden.
- **Responsive navigation:** desktop links and an accessible mobile menu with keyboard focus handling.
- **Active section indication:** homepage navigation tracks the visible section.
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
└── Starrex Technologies/
    ├── index.html
    ├── contact.html
    ├── robots.txt
    ├── css/
    │   ├── base.css
    │   ├── navigation.css
    │   ├── sections.css
    │   ├── responsive.css
    │   └── pages/
    │       ├── home.css
    │       └── contact.css
    ├── js/
    │   ├── main.js
    │   ├── modules/
    │   │   ├── saturn.js
    │   │   ├── animation-loop.js
    │   │   ├── viewport.js
    │   │   ├── visibility.js
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
| Contact page layout and responsive styles | `css/pages/contact.css` |
| Shared JavaScript entry point | `js/main.js` |
| Saturn background, scene construction and visual updates | `js/modules/saturn.js` |
| Shared single-frame scheduling helper | `js/modules/animation-loop.js` |
| Shared renderer/camera viewport sizing | `js/modules/viewport.js` |
| Shared document visibility lifecycle | `js/modules/visibility.js` |
| Ambient sound | `js/modules/audio.js` |
| Navigation and active-section behaviour | `js/modules/navigation.js` |
| Shared footer utilities | `js/modules/footer.js` |
| Contact form validation and delivery | `js/pages/contact.js` |

## SEO and deployment notes

- Both HTML pages include unique titles, descriptions, Open Graph title/description/site metadata and Twitter summary metadata.
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
