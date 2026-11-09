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
  renderer.toneMappingExposure = 1.06;

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
    const width = 1536;
    const height = 768;
    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = width;
    mapCanvas.height = height;
    const context = mapCanvas.getContext("2d");
    if (!context) throw new Error("Could not create Mars surface texture.");

    const base = context.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#9c5238");
    base.addColorStop(.32, "#bd704b");
    base.addColorStop(.62, "#873e2e");
    base.addColorStop(1, "#b66b49");
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);

    // Broad, irregular albedo regions give the surface its varied iron-oxide tone.
    for (let i = 0; i < 170; i += 1) {
      const x = random() * width;
      const y = 70 + random() * (height - 140);
      const rx = 18 + random() * 145;
      const ry = 8 + random() * 65;
      context.save();
      context.translate(x, y);
      context.rotate((random() - .5) * .9);
      context.beginPath();
      const points = 9 + Math.floor(random() * 8);
      for (let j = 0; j <= points; j += 1) {
        const angle = (j / points) * Math.PI * 2;
        const wobble = .72 + random() * .52;
        const px = Math.cos(angle) * rx * wobble;
        const py = Math.sin(angle) * ry * wobble;
        if (j === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.fillStyle = random() > .5
        ? `rgba(66,31,27,${.12 + random() * .22})`
        : `rgba(229,153,105,${.07 + random() * .16})`;
      context.fill();
      context.restore();
    }

    // Fine crater basins and their softly lit rims.
    for (let i = 0; i < 520; i += 1) {
      const x = random() * width;
      const y = 25 + random() * (height - 50);
      const radius = 1.5 + random() * 13;
      const crater = context.createRadialGradient(
        x - radius * .22, y - radius * .28, radius * .12,
        x, y, radius,
      );
      crater.addColorStop(0, "rgba(47,25,23,.3)");
      crater.addColorStop(.72, "rgba(73,36,29,.12)");
      crater.addColorStop(1, "rgba(235,165,119,.19)");
      context.fillStyle = crater;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    // Dusty polar regions, broken into uneven layers rather than bright white caps.
    for (const pole of [0, height]) {
      for (let layer = 0; layer < 9; layer += 1) {
        const y = pole === 0 ? layer * 4 : height - layer * 4;
        context.beginPath();
        context.moveTo(0, y);
        for (let x = 0; x <= width; x += 24) {
          const edge = 8 + layer * 3 + Math.sin(x * .018 + layer) * 5 + random() * 5;
          context.lineTo(x, pole === 0 ? y + edge : y - edge);
        }
        context.lineTo(width, pole === 0 ? 0 : height);
        context.lineTo(0, pole === 0 ? 0 : height);
        context.closePath();
        context.fillStyle = `rgba(222,190,164,${.025 + (8 - layer) * .009})`;
        context.fill();
      }
    }

    // Fine mineral grain prevents the map from reading as a flat graphic.
    const pixels = context.getImageData(0, 0, width, height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const grain = (random() - .5) * 10;
      pixels.data[i] += grain;
      pixels.data[i + 1] += grain * .72;
      pixels.data[i + 2] += grain * .52;
    }
    context.putImageData(pixels, 0, 0);

    const texture = new THREE.CanvasTexture(mapCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
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
    roughness: 0.98,
    metalness: 0,
  });
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(1.94, 128, 128),
    marsMaterial,
  );
  mars.rotation.set(.13, -.68, -.1);
  marsGroup.add(mars);

  // A faint, dusty haze: intentionally much subtler than Earth's blue atmosphere.
  const hazeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      hazeColor: { value: new THREE.Color(0xd98762) },
      hazeStrength: { value: .19 },
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

  document.body.classList.add("mars-scene-ready");

  const keyLight = new THREE.DirectionalLight(0xffdfc8, 2.75);
  keyLight.position.set(-5.2, 3.4, 5.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9a5946, .2);
  fillLight.position.set(4, -2, 3);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0x704b40, .18));

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
  let isDisposed = false;
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
    window.addEventListener("pagehide", disposeScene, { once: true });
  } catch (error) {
    document.body.classList.remove("mars-scene-ready");
    disposeScene();
    console.error("Starrex Mars: Initialization failed.", error);
  }
})();
