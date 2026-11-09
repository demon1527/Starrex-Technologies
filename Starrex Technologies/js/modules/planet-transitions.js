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

function beginArrival(body, overlay, direction, onComplete) {
  let isComplete = false;

  const cleanup = () => {
    if (isComplete) return;
    isComplete = true;
    body.classList.remove(`planet-transition-in-${direction}`);
    body.removeAttribute("aria-busy");
    onComplete?.();
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
  body.setAttribute("aria-busy", "true");
  overlay.addEventListener("animationend", finishArrival);
  window.setTimeout(cleanup, 1200);
}

const PREFETCHED_RESOURCES = new Set();

function addPrefetchHint(url, as = "") {
  if (PREFETCHED_RESOURCES.has(url)) return;
  PREFETCHED_RESOURCES.add(url);

  const hint = document.createElement("link");
  hint.rel = "prefetch";
  hint.href = url;
  if (as) hint.as = as;
  if (as === "image") hint.crossOrigin = "anonymous";
  document.head.append(hint);
}

function prefetchDestination(destination) {
  const connection = navigator.connection;
  if (connection?.saveData) return;
  if (["slow-2g", "2g"].includes(connection?.effectiveType)) return;

  addPrefetchHint(destination.href);

  // Earth uses hosted Blue Marble maps. Fetch them while the visitor is
  // considering the Projects page, rather than after its arrival animation.
  if (getDestinationPlanet(destination.pathname) === "earth") {
    addPrefetchHint(
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      "image",
    );
    addPrefetchHint(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
      "image",
    );
  }
}

function getPlanetLinkFromEvent(event) {
  const target = event.target instanceof Element
    ? event.target
    : event.target?.parentElement;
  const link = target?.closest("a[href]");
  if (!link) return null;

  let destination;
  try {
    destination = new URL(link.href, window.location.href);
  } catch {
    return null;
  }

  if (
    destination.origin !== window.location.origin ||
    destination.pathname === window.location.pathname ||
    !getDestinationPlanet(destination.pathname)
  ) {
    return null;
  }

  return destination;
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
  let transitionActive = Boolean(incoming && !motionPreference.matches);

  if (transitionActive) {
    const overlay = createOverlay();
    beginArrival(body, overlay, incoming.direction, () => {
      transitionActive = false;
    });
  }

  // Warm the next document (and Earth's large maps) on genuine navigation
  // intent, without downloading every page or delaying the current one.
  const handlePrefetchIntent = (event) => {
    const destination = getPlanetLinkFromEvent(event);
    if (destination) prefetchDestination(destination);
  };

  document.addEventListener("pointerover", handlePrefetchIntent, { passive: true });
  document.addEventListener("focusin", handlePrefetchIntent);
  document.addEventListener("touchstart", handlePrefetchIntent, { passive: true });

  document.addEventListener("click", (event) => {
    if (transitionActive) {
      event.preventDefault();
      return;
    }
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
    transitionActive = true;
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
