/* Shared frontend entry point. Page-specific behaviour stays in its own module. */
import "./modules/saturn.js";
import "./modules/audio.js";
import { initNavigation } from "./modules/navigation.js";
import { initContactForm } from "./pages/contact.js";

initNavigation();
initContactForm();
