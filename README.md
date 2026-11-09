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

Starrex Technologies is a software studio focused on practical digital solutions: web development, Python automation, custom software and digital products. This repository contains the company's static website, built with HTML, CSS and vanilla JavaScript.

The site features a procedural Saturn scene, ambient sound controls, responsive navigation, service information and a dedicated contact page.

## Features

- **Procedural 3D Saturn background.** Built with Three.js; the planet and rings are generated in code.
- **Parallax and scroll motion.** The planet responds subtly to pointer movement and page scrolling.
- **Ambient sound.** A soundscape is synthesized with the Web Audio API and remains off until a visitor enables it.
- **Responsive navigation.** Desktop links and an accessible mobile menu.
- **Contact page.** A dedicated enquiry page with client-side validation and email delivery through FormSubmit.
- **Accessibility and comfort.** Semantic page structure, labelled fields, live form feedback and reduced-motion-aware page styling.

## Pages and sections

| Page / section | URL | Description |
| --- | --- | --- |
| Home | `index.html#home` | Hero, introduction and primary calls to action |
| Services | `index.html#services` | Digital Products, Web Development and Software Studio |
| About | `index.html#about` | Studio introduction and values |
| Contact | `contact.html` | Contact details and project enquiry form |

The Products and Projects navigation destinations are retained for future pages; those sections are not implemented yet.

## Contact form setup

The contact form sends submissions to **ehtishamofficial28@gmail.com** through [FormSubmit](https://formsubmit.co/). It uses a hosted form endpoint, so this static website does not need a custom server or Firebase Functions.

**One-time activation is required:** after the first real form submission, FormSubmit sends an activation email to the destination inbox. Open that email and confirm the form. Until the address is confirmed, submissions may be held by the service and normal delivery is not active. Check spam/junk if the activation email is not visible.

The form uses the FormSubmit AJAX endpoint so the visitor receives success or error feedback on the contact page without being redirected away. Review FormSubmit's [documentation](https://formsubmit.co/documentation) for its current processing and privacy terms.

## Tech stack

- HTML5, CSS3 and vanilla JavaScript (ES modules)
- [Three.js](https://threejs.org/) `0.160.0`, loaded from jsDelivr
- Web Audio API
- [Inter](https://fonts.google.com/specimen/Inter), loaded from Google Fonts
- [FormSubmit](https://formsubmit.co/) for static form delivery

## Project structure

```text
.
├── README.md
└── Starrex Technologies/
    ├── index.html
    ├── contact.html
    ├── css/
    │   ├── base.css
    │   ├── navigation.css
    │   ├── sections.css
    │   ├── responsive.css
    │   └── pages/
    │       └── contact.css
    ├── js/
    │   ├── main.js
    │   ├── modules/
    │   │   ├── navigation.js
    │   │   ├── saturn.js
    │   │   └── audio.js
    │   └── pages/
    │       └── contact.js
    └── assets/
        ├── images/
        └── Icons/
```

## Getting started

The website has no build step or package installation requirement.

Run a local server from the `Starrex Technologies` directory:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. A local server is recommended because ES modules and the contact service should not be tested by opening the HTML file directly from disk.

An internet connection is required for the Three.js library, Inter font and hosted form service.

## Customization

| What | Where |
| --- | --- |
| Theme variables and page foundation | `css/base.css` |
| Shared navigation and sound control | `css/navigation.css` |
| Home page sections | `css/sections.css` |
| Responsive breakpoints | `css/responsive.css` |
| Contact page design | `css/pages/contact.css` |
| Contact form validation and delivery | `js/pages/contact.js` |
| Saturn scene | `js/modules/saturn.js` |
| Ambient sound | `js/modules/audio.js` |
| Shared navigation behaviour | `js/modules/navigation.js` |

## Deployment

This is a static website and can be deployed to GitHub Pages, Netlify, Vercel or another static host. Configure the `Starrex Technologies` folder as the site root. If using GitHub Pages, configure the deployment workflow to publish this nested directory.

## License

No license has been specified yet. Until one is added, all rights are reserved by the repository owner.

---

<div align="center">

**Starrex Technologies** · Innovate. Automate. Evolve.

</div>
