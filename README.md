<div align="center">

<img src="Starrex%20Technologies/assets/images/starrex-logo-stacked.png" alt="Starrex Technologies" width="320" />

# Starrex Technologies

**Innovate · Automate · Grow**

The official website of Starrex Technologies, an independent software studio building modern websites, Python automation and custom software.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-A855F7)

</div>

---

## About

Starrex Technologies is a software studio focused on practical digital solutions: web development, Python automation, custom software and digital products. This repository contains the company's landing page, a static site with no build step and no framework.

The page opens on a slowly rotating, procedurally generated Saturn with ambient sound, set behind a glass-style navigation bar and a dark violet theme.

## Features

- **Procedural 3D Saturn background.** Built with Three.js. The banded planet surface and the ring system (C ring, B ring, Cassini Division, A ring and Encke gap) are generated in code at load time, so no texture files are downloaded.
- **Realistic lighting.** The rings cast a shadow on the planet and the planet casts a shadow on the rings. The planet also has limb darkening and a soft atmospheric glow.
- **Parallax and scroll motion.** The planet follows the mouse slightly and drifts upward as you scroll, over a field of slowly rotating stars.
- **Ambient sound.** A "liminal space" soundscape (drone, pad, hum, room air and distant chimes) is synthesized live with the Web Audio API. It is off by default and starts with the speaker button. A soft whoosh plays on navigation clicks while sound is on.
- **Accessibility and comfort.** The planet rotates slower when the user prefers reduced motion, the sound toggle has ARIA labels, and the audio pauses when the tab is hidden.
- **Responsive layout.** The planet repositions and scales for portrait screens.
- **Liquid-glass navbar.** A sticky, translucent navigation bar with a "Get in Touch" call to action.

## Page sections

| Section | Anchor | Description |
| --- | --- | --- |
| Hero | `#home` | Headline, tagline and primary call-to-action buttons |
| Services | `#services` | The three divisions: Digital Products, Web Development and Software Studio |
| About | `#about` | Who we are, with the Innovation, Technology and Possibilities highlights |

> **Status:** the navigation and buttons also link to `#products`, `#projects` and `#contact`. Those sections are not built yet, so the links currently have no target.

## Tech stack

- HTML5, CSS3 and vanilla JavaScript
- [Three.js](https://threejs.org/) `0.160.0`, loaded from the jsDelivr CDN
- Web Audio API (no audio files)
- [Inter](https://fonts.google.com/specimen/Inter) font, loaded from Google Fonts

## Project structure

```text
.
├── README.md
└── Starrex Technologies/
    ├── index.html        # Page markup
    ├── style.css         # Styles and theme variables
    ├── script.js         # Three.js Saturn scene
    ├── sound.js          # Ambient sound engine and toggle button
    └── assets/
        ├── images/       # Logos (starrex-logo.png, starrex-logo-stacked.png)
        └── Icons/        # Favicon (starrex-icon.png)
```

## Getting started

Because the site is fully static, there is nothing to install.

### Option 1: open the file

Open `Starrex Technologies/index.html` in a modern browser.

### Option 2: run a local server (recommended)

```bash
git clone https://github.com/demon1527/Starrex-Technologies.git
cd Starrex-Technologies/"Starrex Technologies"

# pick one
python -m http.server 8000
# or
npx serve .
```

Then visit <http://localhost:8000>.

> An internet connection is required on first load, because Three.js and the Inter font are fetched from CDNs.

## Customization

| What | Where | Setting |
| --- | --- | --- |
| Ambient sound volume | `sound.js` | `MASTER_LEVEL` (0 to 1) |
| Navigation whoosh volume | `sound.js` | `WHOOSH_LEVEL` (0 turns it off) |
| Planet rotation speed | `script.js` | `speed` |
| Ring tilt and roll | `script.js` | `ring.rotation.x` and `ring.rotation.z` |
| Light direction | `script.js` | `SUN` |
| Colour theme | `style.css` | CSS variables in `:root` |

## Browser support

Any modern browser with WebGL and Web Audio support, such as current versions of Chrome, Edge, Firefox and Safari. If WebGL is unavailable, the 3D background will not render.

## Deployment

The site can be hosted on any static host (GitHub Pages, Netlify, Vercel or Cloudflare Pages). Point the host at the `Starrex Technologies` folder as the site root.

GitHub Pages only serves from the repository root or a `/docs` folder, so to use it either move the site files to the repository root or deploy that folder with a GitHub Actions workflow.

## License

No license has been specified yet. Until one is added, all rights are reserved by the repository owner.

---

<div align="center">

**Starrex Technologies** · Innovate. Automate. Evolve.

</div>
