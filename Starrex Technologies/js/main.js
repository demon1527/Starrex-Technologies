/* Shared frontend entry point. Page-specific behaviour stays in its own module. */
import "./modules/scroll-restoration.js";
import "./modules/saturn.js";
import "./modules/moon.js";
import "./modules/earth.js";
import "./modules/mars.js";
import { initPlanetTransitions } from "./modules/planet-transitions.js";
import "./modules/audio.js";
import { initNavigation } from "./modules/navigation.js";
import { initContactForm } from "./pages/contact.js";
import { initFooter } from "./modules/footer.js";

initNavigation();
initContactForm();
initFooter();
initPlanetTransitions();
