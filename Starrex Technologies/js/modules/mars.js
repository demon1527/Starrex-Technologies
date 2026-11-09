import { createAnimationLoop } from "./animation-loop.js";
import { createViewportController } from "./viewport.js";
import { createVisibilityController } from "./visibility.js";

/*
 * Starrex — Services page Mars background.
 * This page-local prototype uses the same frame, viewport and visibility
 * helpers as Moon and Earth. Shared renderer consolidation remains planned.
 */
(() => {
  "use strict";

  if (document.body.dataset.planet !== "mars") return;

  const canvas = document.getElementById("planet");
  const THREE = window.THREE;
  if (!canvas || !THREE) {
    console.warn("Starrex Mars: canvas or Three.js is unavailable.");
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
    console.warn("Starrex Mars: WebGL could not be initialized.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;

  const marsGroup = new THREE.Group();
  scene.add(marsGroup);

  let seed = 19371;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  function createMarsSurfaceTexture() {
    // Build a self-contained equirectangular albedo map. This is generated
    // locally, so the planet never depends on a third-party image request.
    const width = 1536;
    const height = 768;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;

    const context = textureCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not create the Mars texture canvas.");

    const image = context.createImageData(width, height);
    const pixels = image.data;

    for (let y = 0; y < height; y += 1) {
      const v = y / height;
      const latitude = Math.cos((v - 0.5) * Math.PI);
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        const broad =
          Math.sin(u * 8.2 + Math.sin(v * 8.5) * 1.7) * 13 +
          Math.sin(u * 17.5 - v * 11.2) * 8 +
          Math.cos(u * 29 + Math.sin(v * 19) * 2) * 4.5 +
          Math.sin(v * 31 + u * 5.5) * 3.5;
        const fine = (random() - 0.5) * 23;

        // Dark basaltic provinces and lighter dusty highlands.
        const province =
          Math.sin(u * 5.8 + Math.sin(v * 6.1) * 1.4) +
          Math.cos(v * 9.4 - u * 3.7) * 0.72 +
          Math.sin(u * 13.3 + v * 7.2) * 0.34;
        const darkTerrain = province < -0.48 ? -25 : province > 0.9 ? 13 : 0;
        const polarDust = Math.max(0, (Math.abs(v - 0.5) - 0.39) / 0.11) * 16;
        const value = 151 + broad + fine + darkTerrain + polarDust;

        const index = (y * width + x) * 4;
        pixels[index] = Math.max(65, Math.min(218, value * 1.12));
        pixels[index + 1] = Math.max(35, Math.min(174, value * 0.73));
        pixels[index + 2] = Math.max(25, Math.min(137, value * 0.56));
        pixels[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);

    // Large impact basins and volcanic features establish recognizable
    // planetary-scale surface variation before the fine crater field.
    for (let i = 0; i < 95; i += 1) {
      const x = random() * width;
      const y = 35 + random() * (height - 70);
      const radiusX = 9 + Math.pow(random(), 1.8) * 62;
      const radiusY = radiusX * (0.48 + random() * 0.42);
      const shade = random() > 0.46;
      const basin = context.createRadialGradient(
        x - radiusX * 0.18, y - radiusY * 0.2, radiusX * 0.08,
        x, y, radiusX,
      );
      basin.addColorStop(0, shade ? "rgba(43,20,17,.48)" : "rgba(238,151,102,.25)");
      basin.addColorStop(0.62, shade ? "rgba(73,31,24,.32)" : "rgba(203,105,69,.13)");
      basin.addColorStop(0.86, "rgba(44,22,19,.12)");
      basin.addColorStop(1, "rgba(0,0,0,0)");
      context.save();
      context.translate(x, y);
      context.scale(1, radiusY / radiusX);
      context.fillStyle = basin;
      context.beginPath();
      context.arc(0, 0, radiusX, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // Thousands of smaller craters add the granular relief visible at
    // planetary scale, with a dark inner basin and a sun-facing rim.
    for (let i = 0; i < 1850; i += 1) {
      const x = random() * width;
      const y = 14 + random() * (height - 28);
      const radius = 1.2 + Math.pow(random(), 2.25) * 17;
      const depth = 0.12 + random() * 0.24;
      const crater = context.createRadialGradient(
        x - radius * 0.2, y - radius * 0.24, radius * 0.08,
        x, y, radius,
      );
      crater.addColorStop(0, `rgba(42,21,18,${depth})`);
      crater.addColorStop(0.58, `rgba(73,34,27,${depth * 0.72})`);
      crater.addColorStop(0.78, `rgba(239,167,125,${depth * 0.62})`);
      crater.addColorStop(1, "rgba(35,18,15,0)");
      context.fillStyle = crater;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    // Broken, dusty polar deposits rather than bright white caps.
    for (const north of [true, false]) {
      for (let layer = 0; layer < 13; layer += 1) {
        const edgeBase = 9 + layer * 3.4;
        context.beginPath();
        context.moveTo(0, north ? 0 : height);
        for (let x = 0; x <= width; x += 18) {
          const irregular = Math.sin(x * 0.014 + layer * 0.8) * 8 +
            Math.sin(x * 0.037 - layer) * 4 + random() * 5;
          const y = edgeBase + irregular;
          context.lineTo(x, north ? y : height - y);
        }
        context.lineTo(width, north ? 0 : height);
        context.closePath();
        context.fillStyle = `rgba(225,190,164,${0.018 + (12 - layer) * 0.004})`;
        context.fill();
      }
    }

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    texture.needsUpdate = true;
    return texture;
  }

  let surfaceTexture;
  try {
    surfaceTexture = createMarsSurfaceTexture();
  } catch (error) {
    renderer.dispose();
    console.warn("Starrex Mars: Surface texture generation failed.", error);
    return;
  }

  const marsMaterial = new THREE.MeshStandardMaterial({
    map: surfaceTexture,
    color: 0xffffff,
    roughness: 0.98,
    metalness: 0,
  });
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(1.94, 128, 128),
    marsMaterial,
  );
  mars.rotation.set(.13, -.68, -.1);
  marsGroup.add(mars);

  let isDisposed = false;

  // A faint, dusty haze: intentionally much subtler than Earth's blue atmosphere.
  const hazeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      hazeColor: { value: new THREE.Color(0xd98762) },
      hazeStrength: { value: .075 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 hazeColor;
      uniform float hazeStrength;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float rim = pow(0.72 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 3.2);
        gl_FragColor = vec4(hazeColor, rim * hazeStrength);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(2.035, 96, 96),
    hazeMaterial,
  );
  marsGroup.add(haze);

  const keyLight = new THREE.DirectionalLight(0xffd2b5, 2.45);
  keyLight.position.set(-5.2, 3.4, 5.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9a5946, .12);
  fillLight.position.set(4, -2, 3);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0x704b40, .17));

  const starPositions = [];
  for (let i = 0; i < 560; i += 1) {
    starPositions.push(
      (random() - .5) * 48,
      (random() - .5) * 30,
      -7 - random() * 24,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xf0d6c5,
    size: .03,
    transparent: true,
    opacity: .34,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const base = new THREE.Vector2(4.7, -.35);
  let scrollTravel = 5.8;
  let isContextLost = false;
  let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateComposition({ portrait, halfViewWidth }) {
    base.set(halfViewWidth * (portrait ? .53 : .76), portrait ? -1.55 : -.35);
    marsGroup.scale.setScalar(portrait ? .53 : 1);
    scrollTravel = portrait ? 5.8 : 5.8;
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handleMotionChange = (event) => { reduceMotion = event.matches; };

  function shouldRun() {
    if (isDisposed || isContextLost || document.hidden) return false;
    const context = renderer.getContext();
    return Boolean(context && !context.isContextLost());
  }

  function renderFrame() {
    if (!shouldRun()) return false;

    if (!reduceMotion) {
      mars.rotation.y += .0002;
      stars.rotation.z += .000008;
    }

    const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const maxScroll = Math.max(pageHeight - window.innerHeight, 1);
    const scrollTop = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
    const progress = THREE.MathUtils.clamp(scrollTop / maxScroll, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);

    marsGroup.position.x += (base.x - marsGroup.position.x) * .045;
    marsGroup.position.y += (base.y + eased * scrollTravel - marsGroup.position.y) * .065;

    renderer.render(scene, camera);
    return true;
  }

  const animationLoop = createAnimationLoop({ onFrame: renderFrame, shouldRun });
  let viewportController;
  let visibilityController;

  function handleContextLost(event) {
    event.preventDefault();
    isContextLost = true;
    document.body.classList.remove("mars-scene-ready");
    animationLoop.stop();
    console.warn("Starrex Mars: WebGL context was lost.");
  }

  function handleContextRestored() {
    isContextLost = false;
    document.body.classList.add("mars-scene-ready");
    viewportController?.resize();
    animationLoop.start();
  }

  function disposeScene() {
    if (isDisposed) return;
    isDisposed = true;
    animationLoop.dispose();
    viewportController?.dispose();
    visibilityController?.dispose();
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    motionQuery.removeEventListener?.("change", handleMotionChange);
    mars.geometry.dispose();
    marsMaterial.dispose();
    surfaceTexture?.dispose();
    haze.geometry.dispose();
    hazeMaterial.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    renderer.dispose();
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
    document.body.classList.add("mars-scene-ready");
    window.addEventListener("pagehide", disposeScene, { once: true });
  } catch (error) {
    document.body.classList.remove("mars-scene-ready");
    disposeScene();
    console.error("Starrex Mars: Initialization failed.", error);
  }
})();
