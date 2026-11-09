/* Starrex frontend entry point — feature logic stays in modules. */
import "./modules/saturn.js";
import "./modules/audio.js";
import { initNavigation } from "./modules/navigation.js";

initNavigation();
