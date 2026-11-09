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

  function createMarsSurfaceTextures() {
    // Generate a high-contrast, locally stored equirectangular Mars albedo
    // and a matching relief map. No remote image request is required.
    const width = 2048;
    const height = 1024;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const context = textureCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not create the Mars albedo canvas.");

    const image = context.createImageData(width, height);
    const pixels = image.data;

    for (let y = 0; y < height; y += 1) {
      const v = y / height;
      const latitude = Math.abs(v - 0.5) * 2;
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        // Broad warped fields create continental-scale regions rather than
        // evenly distributed noise or a uniform orange base.
        const warpX = u + Math.sin(v * 13.0 + u * 5.0) * 0.018;
        const warpY = v + Math.sin(u * 11.0 - v * 7.0) * 0.014;
        const continental =
          Math.sin(warpX * 18.0 + Math.sin(warpY * 13.0) * 2.8) * 0.58 +
          Math.cos(warpY * 21.0 - warpX * 8.0) * 0.43 +
          Math.sin(warpX * 39.0 + warpY * 17.0) * 0.22 +
          Math.cos(warpX * 73.0 - warpY * 51.0) * 0.11;
        const fine =
          Math.sin(u * 311.0 + Math.sin(v * 97.0) * 2.0) * 3.8 +
          Math.cos(v * 263.0 - u * 41.0) * 3.1 +
          (random() - 0.5) * 9.0;
        const highland = continental > 0.24;
        const darkProvince = continental < -0.30;
        const polarDust = latitude > 0.79 ? (latitude - 0.79) * 54 : 0;

        let red = 166 + continental * 46 + fine + polarDust;
        let green = 77 + continental * 27 + fine * 0.58 + polarDust * 0.82;
        let blue = 48 + continental * 19 + fine * 0.38 + polarDust * 0.62;
        if (darkProvince) {
          red -= 35;
          green -= 25;
          blue -= 17;
        } else if (highland) {
          red += 19;
          green += 14;
          blue += 10;
        }

        const index = (y * width + x) * 4;
        pixels[index] = Math.max(48, Math.min(232, red));
        pixels[index + 1] = Math.max(22, Math.min(190, green));
        pixels[index + 2] = Math.max(14, Math.min(150, blue));
        pixels[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);

    const reliefCanvas = document.createElement("canvas");
    reliefCanvas.width = width;
    reliefCanvas.height = height;
    const reliefContext = reliefCanvas.getContext("2d");
    if (!reliefContext) throw new Error("Could not create the Mars relief canvas.");
    const reliefImage = reliefContext.createImageData(width, height);
    for (let i = 0; i < reliefImage.data.length; i += 4) {
      const variation = 118 + (pixels[i] - 145) * 1.05 + (random() - 0.5) * 18;
      reliefImage.data[i] = variation;
      reliefImage.data[i + 1] = variation;
      reliefImage.data[i + 2] = variation;
      reliefImage.data[i + 3] = 255;
    }
    reliefContext.putImageData(reliefImage, 0, 0);

    // Large visible impact craters: dark floors, bright raised rims and
    // matching relief so the details survive when the sphere is scaled down.
    for (let i = 0; i < 210; i += 1) {
      const x = random() * width;
      const y = 24 + random() * (height - 48);
      const radius = 10 + Math.pow(random(), 1.45) * 46;
      const crater = context.createRadialGradient(
        x - radius * 0.2, y - radius * 0.22, radius * 0.12,
        x, y, radius,
      );
      crater.addColorStop(0, "rgba(48,20,17,.72)");
      crater.addColorStop(0.54, "rgba(77,31,24,.62)");
      crater.addColorStop(0.72, "rgba(241,166,119,.78)");
      crater.addColorStop(0.86, "rgba(103,39,27,.48)");
      crater.addColorStop(1, "rgba(0,0,0,0)");
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = crater;
      context.fill();

      const relief = reliefContext.createRadialGradient(
        x - radius * 0.2, y - radius * 0.22, radius * 0.12,
        x, y, radius,
      );
      relief.addColorStop(0, "rgb(48,48,48)");
      relief.addColorStop(0.58, "rgb(82,82,82)");
      relief.addColorStop(0.76, "rgb(224,224,224)");
      relief.addColorStop(1, "rgb(120,120,120)");
      reliefContext.beginPath();
      reliefContext.arc(x, y, radius, 0, Math.PI * 2);
      reliefContext.fillStyle = relief;
      reliefContext.fill();
    }

    // Smaller crater field, intentionally larger and higher contrast than
    // the previous version so it remains legible on a desktop-sized planet.
    for (let i = 0; i < 1450; i += 1) {
      const x = random() * width;
      const y = 10 + random() * (height - 20);
      const radius = 2.2 + Math.pow(random(), 2.0) * 12;
      const crater = context.createRadialGradient(
        x - radius * 0.22, y - radius * 0.2, radius * 0.08,
        x, y, radius,
      );
      crater.addColorStop(0, "rgba(45,19,16,.62)");
      crater.addColorStop(0.58, "rgba(72,29,22,.46)");
      crater.addColorStop(0.78, "rgba(246,177,130,.68)");
      crater.addColorStop(1, "rgba(0,0,0,0)");
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = crater;
      context.fill();

      const relief = reliefContext.createRadialGradient(
        x - radius * 0.2, y - radius * 0.2, radius * 0.08,
        x, y, radius,
      );
      relief.addColorStop(0, "rgb(58,58,58)");
      relief.addColorStop(0.72, "rgb(205,205,205)");
      relief.addColorStop(1, "rgb(118,118,118)");
      reliefContext.beginPath();
      reliefContext.arc(x, y, radius, 0, Math.PI * 2);
      reliefContext.fillStyle = relief;
      reliefContext.fill();
    }

    // Irregular dusty polar deposits, never bright white blobs.
    for (const north of [true, false]) {
      for (let layer = 0; layer < 18; layer += 1) {
        const edge = 15 + layer * 3.7;
        context.beginPath();
        context.moveTo(0, north ? 0 : height);
        for (let x = 0; x <= width; x += 16) {
          const wobble = Math.sin(x * 0.009 + layer * 0.73) * 11 +
            Math.sin(x * 0.027 - layer * 0.8) * 6 + random() * 5;
          const y = edge + wobble;
          context.lineTo(x, north ? y : height - y);
        }
        context.lineTo(width, north ? 0 : height);
        context.closePath();
        context.fillStyle = `rgba(242,202,170,${0.025 + (17 - layer) * 0.004})`;
        context.fill();
      }
    }

    const albedo = new THREE.CanvasTexture(textureCanvas);
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    albedo.needsUpdate = true;

    const relief = new THREE.CanvasTexture(reliefCanvas);
    relief.colorSpace = THREE.NoColorSpace;
    relief.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    relief.needsUpdate = true;

    return { albedo, relief };
  }
  let surfaceTexture;
  let reliefTexture;
  try {
    const textures = createMarsSurfaceTextures();
    surfaceTexture = textures.albedo;
    reliefTexture = textures.relief;
  } catch (error) {
    renderer.dispose();
    console.warn("Starrex Mars: Surface texture generation failed.", error);
    return;
  }

  const marsMaterial = new THREE.MeshStandardMaterial({
    map: surfaceTexture,
    bumpMap: reliefTexture,
    bumpScale: 0.075,
    color: 0xffffff,
    roughness: 1,
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
    reliefTexture?.dispose();
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
