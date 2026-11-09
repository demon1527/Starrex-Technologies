/**
 * Shared Three.js planet engine.
 *
 * The engine is the single owner of the renderer, scene, camera, browser
 * lifecycle and animation loop. Planet modules provide scene objects and
 * planet-specific resize/update/dispose hooks.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const enginesByCanvas = new WeakMap();

function showStaticFallback(canvas, reason, error) {
  canvas.hidden = true;
  canvas.dataset.planetEngine = "fallback";
  if (error) console.warn(`Starrex planet engine: ${reason}`, error);
  else console.warn(`Starrex planet engine: ${reason}`);
}

export function initPlanetEngine({ planetFactory } = {}) {
  const canvas = document.getElementById("planet");
  if (!canvas) return null;

  const existingEngine = enginesByCanvas.get(canvas);
  if (existingEngine) return existingEngine;

  if (typeof planetFactory !== "function") {
    showStaticFallback(canvas, "No planet factory was supplied.");
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  } catch (error) {
    showStaticFallback(canvas, "WebGL could not be initialized; using the static background.", error);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;

  let activePlanet = null;
  let animationFrameId = null;
  let isContextLost = false;
  let isDisposed = false;
  const pointer = { x: 0, y: 0 };
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;

  function resize() {
    if (isDisposed || isContextLost) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    activePlanet?.resize?.({ width, height, camera, renderer, THREE });
  }

  function removePlanet(planet) {
    if (!planet) return;
    const objects = Array.isArray(planet.objects)
      ? planet.objects
      : planet.object
        ? [planet.object]
        : [];
    objects.forEach((object) => scene.remove(object));
    try {
      planet.dispose?.();
    } catch (error) {
      console.warn("Starrex planet engine: Planet resource cleanup failed.", error);
    }
  }

  function setPlanet(factory) {
    if (isDisposed || typeof factory !== "function") return null;
    let nextPlanet = null;
    const previousPlanet = activePlanet;

    try {
      nextPlanet = factory({ THREE, renderer, camera });
      if (!nextPlanet || !Array.isArray(nextPlanet.objects)) {
        throw new TypeError("A planet factory must return an objects array.");
      }
      nextPlanet.objects.forEach((object) => scene.add(object));
      activePlanet = nextPlanet;

      try {
        resize();
      } catch (error) {
        activePlanet = previousPlanet;
        nextPlanet.objects.forEach((object) => scene.remove(object));
        throw error;
      }

      removePlanet(previousPlanet);
      return activePlanet;
    } catch (error) {
      if (nextPlanet && nextPlanet !== activePlanet) removePlanet(nextPlanet);
      console.error("Starrex planet engine: Planet activation failed.", error);
      return null;
    }
  }

  function getScrollProgress() {
    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
    );
    const maxScroll = Math.max(pageHeight - window.innerHeight, 1);
    const currentScroll = Math.max(
      window.scrollY,
      document.documentElement.scrollTop,
      document.body ? document.body.scrollTop : 0,
    );
    return THREE.MathUtils.clamp(currentScroll / maxScroll, 0, 1);
  }

  function shouldAnimate() {
    return !isDisposed && !isContextLost && !document.hidden;
  }

  function animate() {
    animationFrameId = null;
    if (!shouldAnimate()) return;

    const context = renderer.getContext();
    if (!context || context.isContextLost()) return;

    try {
      activePlanet?.update?.({
        reducedMotion: reduceMotion,
        pointer,
        scrollProgress: getScrollProgress(),
      });
      renderer.render(scene, camera);
    } catch (error) {
      console.error("Starrex planet engine: Frame update failed.", error);
      stopAnimation();
      return;
    }

    scheduleAnimation();
  }

  function scheduleAnimation() {
    if (!shouldAnimate() || animationFrameId !== null) return;
    animationFrameId = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    scheduleAnimation();
  }

  function stopAnimation() {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function handlePointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }

  function handleVisibilityChange() {
    if (document.hidden) stopAnimation();
    else startAnimation();
  }

  function handleContextLost(event) {
    event.preventDefault();
    isContextLost = true;
    stopAnimation();
    console.warn("Starrex planet engine: WebGL context was lost.");
  }

  function handleContextRestored() {
    isContextLost = false;
    resize();
    startAnimation();
    console.info("Starrex planet engine: WebGL context restored.");
  }

  function handleMotionPreferenceChange(event) {
    reduceMotion = event.matches;
  }

  function dispose() {
    if (isDisposed) return;
    isDisposed = true;
    stopAnimation();

    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener("webglcontextrestored", handleContextRestored);

    if (motionQuery.removeEventListener) {
      motionQuery.removeEventListener("change", handleMotionPreferenceChange);
    } else {
      motionQuery.removeListener(handleMotionPreferenceChange);
    }

    removePlanet(activePlanet);
    activePlanet = null;
    renderer.dispose();
    enginesByCanvas.delete(canvas);
  }

  try {
    if (!setPlanet(planetFactory)) {
      throw new Error("The initial planet could not be created.");
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionPreferenceChange);
    } else {
      motionQuery.addListener(handleMotionPreferenceChange);
    }

    canvas.hidden = false;
    delete canvas.dataset.planetEngine;
    const engineApi = { setPlanet, dispose, renderer, scene, camera };
    enginesByCanvas.set(canvas, engineApi);
    startAnimation();
    return engineApi;
  } catch (error) {
    stopAnimation();
    removePlanet(activePlanet);
    activePlanet = null;
    renderer.dispose();
    showStaticFallback(canvas, "Planet initialization failed; using the static background.", error);
    return null;
  }
}
