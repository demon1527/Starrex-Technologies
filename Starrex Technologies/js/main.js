/* Shared frontend entry point. Page-specific behaviour stays in its own module. */
import { initPlanetEngine } from "./modules/planet-engine.js";
import { createSaturn } from "./planets/saturn.js";
import "./modules/audio.js";
import { initNavigation } from "./modules/navigation.js";
import { initContactForm } from "./pages/contact.js";
import { initFooter } from "./modules/footer.js";

initPlanetEngine({ planetFactory: createSaturn });
initNavigation();
initContactForm();
initFooter();
