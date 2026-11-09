import { createAnimationLoop } from "./animation-loop.js";
import { createViewportController } from "./viewport.js";
import { createVisibilityController } from "./visibility.js";

/*
 * Starrex — Products page Moon background.
 * This page-local scene follows the same lifecycle helpers as Saturn.
 * The future shared planet engine will consolidate renderer ownership;
 * for now each HTML document creates only its own single renderer.
 */
(() => {
  "use strict";

  if (document.body.dataset.planet !== "moon") return;

  const canvas = document.getElementById("planet");
  const THREE = window.THREE;

  if (!canvas || !THREE) {
    console.warn("Starrex Moon: canvas or Three.js is unavailable.");
    return;
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.warn("Starrex Moon: WebGL could not be initialized.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;

  const moonGroup = new THREE.Group();
  scene.add(moonGroup);

  let seed = 41827;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  function createLunarTexture() {
    const width = window.innerWidth < 768 ? 1024 : 1536;
    const height = width / 2;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;

    const context = textureCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not create the lunar texture canvas.");

    const image = context.createImageData(width, height);
    const pixels = image.data;

    // Low-frequency maria and high-frequency regolith variation.
    for (let y = 0; y < height; y += 1) {
      const latitude = y / height;
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        const broad =
          Math.sin(u * 17 + Math.sin(latitude * 11) * 2.2) * 7 +
          Math.sin(u * 39 + latitude * 21) * 3.8 +
          Math.cos(u * 8 - latitude * 15) * 4.5;
        const fine = (random() - 0.5) * 25;
        const maria = Math.sin(u * 10 + latitude * 5) > 0.72 ? -13 : 0;
        const value = Math.max(62, Math.min(190, 139 + broad + fine + maria));
        const index = (y * width + x) * 4;
        pixels[index] = value * 1.015;
        pixels[index + 1] = value;
        pixels[index + 2] = value * 0.965;
        pixels[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);

    // Overlapping impact basins and smaller craters create a varied lunar surface.
    const craterCount = Math.round((width * height) / 675);
    for (let i = 0; i < craterCount; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 1.8 + Math.pow(random(), 2.1) * 27;
      const depth = 0.12 + random() * 0.3;

      const gradient = context.createRadialGradient(
        x - radius * 0.2,
        y - radius * 0.24,
        radius * 0.08,
        x,
        y,
        radius,
      );
      gradient.addColorStop(0, `rgba(35, 35, 36, ${depth})`);
      gradient.addColorStop(0.56, `rgba(66, 66, 67, ${depth * 0.72})`);
      gradient.addColorStop(0.78, `rgba(225, 225, 222, ${depth * 0.7})`);
      gradient.addColorStop(1, "rgba(40, 40, 40, 0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      if (radius > 11) {
        context.strokeStyle = `rgba(225, 225, 222, ${depth * 0.24})`;
        context.lineWidth = Math.max(0.7, radius * 0.045);
        context.beginPath();
        context.arc(x, y, radius * 0.84, 0, Math.PI * 2);
        context.stroke();
      }
    }

    // A restrained final grain pass prevents the surface from looking smooth or synthetic.
    const finalImage = context.getImageData(0, 0, width, height);
    for (let i = 0; i < finalImage.data.length; i += 4) {
      const grain = (random() - 0.5) * 8;
      finalImage.data[i] += grain;
      finalImage.data[i + 1] += grain;
      finalImage.data[i + 2] += grain;
    }
    context.putImageData(finalImage, 0, 0);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  }

  const lunarTexture = createLunarTexture();

  // A slightly smaller, unadorned rocky body: no rings and no atmosphere.
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: lunarTexture,
    color: 0xe4e2dc,
    roughness: 1,
    metalness: 0,
  });

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.78, 128, 128),
    moonMaterial,
  );
  moon.rotation.set(0.12, -0.34, 0.08);
  moonGroup.add(moon);
  document.body.classList.add("moon-scene-ready");

  const keyLight = new THREE.DirectionalLight(0xfff7e8, 3.1);
  keyLight.position.set(-5.5, 3.2, 5.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9b9bb5, 0.16);
  fillLight.position.set(4, -2, 3);
  scene.add(fillLight);

  scene.add(new THREE.AmbientLight(0x687080, 0.12));

  // Sparse, subdued stars; the lunar surface remains the visual focus.
  const starPositions = [];
  for (let i = 0; i < 520; i += 1) {
    starPositions.push(
      (random() - 0.5) * 46,
      (random() - 0.5) * 28,
      -7 - random() * 22,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3),
  );
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xded8ec,
      size: 0.035,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  scene.add(stars);

  const base = new THREE.Vector2(4.6, -0.35);
  let scrollTravel = 5.2;
  let isContextLost = false;
  let isDisposed = false;
  let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateComposition({ portrait, halfViewWidth }) {
    base.set(
      halfViewWidth * (portrait ? 0.52 : 0.76),
      portrait ? -1.55 : -0.35,
    );
    moonGroup.scale.setScalar(portrait ? 0.54 : 1);
    scrollTravel = portrait ? 5.6 : 5.2;
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handleMotionChange = (event) => {
    reduceMotion = event.matches;
  };

  function shouldRun() {
    if (isDisposed || isContextLost || document.hidden) return false;
    const context = renderer.getContext();
    return Boolean(context && !context.isContextLost());
  }

  function renderFrame() {
    if (!shouldRun()) return false;

    if (!reduceMotion) {
      moon.rotation.y += 0.00012;
      stars.rotation.z += 0.000012;
    }

    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    const maxScroll = Math.max(pageHeight - window.innerHeight, 1);
    const scrollTop = Math.max(
      window.scrollY,
      document.documentElement.scrollTop,
      document.body.scrollTop,
    );
    const progress = THREE.MathUtils.clamp(scrollTop / maxScroll, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);

    const targetX = base.x;
    const targetY = base.y + eased * scrollTravel;
    moonGroup.position.x += (targetX - moonGroup.position.x) * 0.045;
    moonGroup.position.y += (targetY - moonGroup.position.y) * 0.065;

    renderer.render(scene, camera);
    return true;
  }

  const animationLoop = createAnimationLoop({
    onFrame: renderFrame,
    shouldRun,
  });

  let viewportController;
  let visibilityController;

  function handleContextLost(event) {
    event.preventDefault();
    isContextLost = true;
    document.body.classList.remove("moon-scene-ready");
    animationLoop.stop();
    console.warn("Starrex Moon: WebGL context was lost.");
  }

  function handleContextRestored() {
    isContextLost = false;
    document.body.classList.add("moon-scene-ready");
    viewportController?.resize();
    animationLoop.start();
  }

  try {
    viewportController = createViewportController({
      renderer,
      camera,
      onResize: updateComposition,
    });
    viewportController.resize();

    visibilityController = createVisibilityController({
      onVisibilityChange(hidden) {
        if (hidden) animationLoop.stop();
        else animationLoop.start();
      },
    });

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
    motionQuery.addEventListener?.("change", handleMotionChange);
    animationLoop.start();

    window.addEventListener("pagehide", () => {
      if (isDisposed) return;
      isDisposed = true;
      animationLoop.dispose();
      viewportController?.dispose();
      visibilityController?.dispose();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      motionQuery.removeEventListener?.("change", handleMotionChange);
      moon.geometry.dispose();
      moonMaterial.dispose();
      lunarTexture.dispose();
      starGeometry.dispose();
      stars.material.dispose();
      renderer.dispose();
    }, { once: true });
  } catch (error) {
    document.body.classList.remove("moon-scene-ready");
    isDisposed = true;
    animationLoop.dispose();
    viewportController?.dispose();
    visibilityController?.dispose();
    moon.geometry.dispose();
    moonMaterial.dispose();
    lunarTexture.dispose();
    starGeometry.dispose();
    stars.material.dispose();
    renderer.dispose();
    console.error("Starrex Moon: Initialization failed.", error);
  }
})();
