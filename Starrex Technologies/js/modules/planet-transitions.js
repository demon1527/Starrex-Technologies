/*
 * Starrex planetary page handoff.
 * Keeps the site multi-page while carrying a short, direction-aware
 * transition across a normal document navigation.
 */
const HANDOFF_KEY = "starrex:planet-transition:v1";
const HANDOFF_MAX_AGE = 10000;
const PLANET_ORDER = Object.freeze({
  saturn: 0,
  moon: 1,
  earth: 2,
  mars: 3,
});

function getDestinationPlanet(pathname) {
  const file = pathname.split("/").filter(Boolean).pop()?.toLowerCase() || "index.html";

  if (file === "products.html") return "moon";
  if (file === "projects.html") return "earth";
  if (file === "services.html") return "mars";
  if (file === "contact.html" || file === "index.html") return "saturn";

  return null;
}

function readHandoff() {
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;

    window.sessionStorage.removeItem(HANDOFF_KEY);
    const handoff = JSON.parse(raw);

    if (
      !handoff ||
      typeof handoff.createdAt !== "number" ||
      Date.now() - handoff.createdAt > HANDOFF_MAX_AGE ||
      Date.now() < handoff.createdAt ||
      typeof handoff.targetPath !== "string"
    ) {
      return null;
    }

    if (handoff.targetPath !== window.location.pathname) return null;
    if (!["forward", "backward"].includes(handoff.direction)) return null;

    return handoff;
  } catch {
    return null;
  }
}

function createOverlay() {
  let overlay = document.querySelector(".planet-transition-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "planet-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.append(overlay);
  }

  return overlay;
}

function beginArrival(body, overlay, direction) {
  let isComplete = false;

  const cleanup = () => {
    if (isComplete) return;
    isComplete = true;
    body.classList.remove(`planet-transition-in-${direction}`);
    overlay.removeEventListener("animationend", finishArrival);
    overlay.remove();
  };

  const finishArrival = (event) => {
    if (
      event.target !== overlay ||
      event.pseudoElement ||
      event.animationName !== "planet-transition-reveal"
    ) return;

    cleanup();
  };

  body.classList.add(`planet-transition-in-${direction}`);
  overlay.addEventListener("animationend", finishArrival);
  window.setTimeout(cleanup, 1200);
}

function canIntercept(event, link) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  ) {
    return false;
  }

  return true;
}

export function initPlanetTransitions() {
  const body = document.body;
  if (!body) return;

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const incoming = readHandoff();

  if (incoming && !motionPreference.matches) {
    const overlay = createOverlay();
    beginArrival(body, overlay, incoming.direction);
  }

  document.addEventListener("click", (event) => {
    const clickTarget = event.target instanceof Element ? event.target : event.target?.parentElement;
    const link = clickTarget?.closest("a[href]");
    if (!link || !canIntercept(event, link) || motionPreference.matches) return;

    let destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (destination.origin !== window.location.origin) return;
    if (destination.pathname === window.location.pathname) return;

    const currentPlanet = body.dataset.planet;
    const destinationPlanet = getDestinationPlanet(destination.pathname);

    if (
      !currentPlanet ||
      !destinationPlanet ||
      currentPlanet === destinationPlanet ||
      !(currentPlanet in PLANET_ORDER) ||
      !(destinationPlanet in PLANET_ORDER)
    ) {
      return;
    }

    const direction =
      PLANET_ORDER[destinationPlanet] > PLANET_ORDER[currentPlanet]
        ? "forward"
        : "backward";

    const handoff = {
      direction,
      targetPath: destination.pathname,
      createdAt: Date.now(),
    };

    try {
      window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
    } catch {
      // If session storage is unavailable, keep native navigation reliable.
      return;
    }

    event.preventDefault();
    body.classList.add(`planet-transition-out-${direction}`);
    body.setAttribute("aria-busy", "true");

    const overlay = createOverlay();
    let navigated = false;

    const navigate = () => {
      if (navigated) return;
      navigated = true;
      window.location.assign(destination.href);
    };

    const handleCoverComplete = (animationEvent) => {
      if (
        animationEvent.target !== overlay ||
        animationEvent.pseudoElement ||
        animationEvent.animationName !== "planet-transition-cover"
      ) return;

      overlay.removeEventListener("animationend", handleCoverComplete);
      navigate();
    };

    overlay.addEventListener("animationend", handleCoverComplete);

    // Fallback for browsers that do not dispatch animationend.
    window.setTimeout(navigate, 900);
  });
}
