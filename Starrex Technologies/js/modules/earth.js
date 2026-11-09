import { createAnimationLoop } from "./animation-loop.js";
import { createViewportController } from "./viewport.js";
import { createVisibilityController } from "./visibility.js";

/*
 * Starrex — Projects page Earth background.
 * The scene is page-local for now and follows the same lifecycle helpers
 * as the existing Moon prototype. Renderer consolidation remains a
 * separate, later migration step.
 */
(() => {
  "use strict";

  if (document.body.dataset.planet !== "earth") return;

  const canvas = document.getElementById("planet");
  const THREE = window.THREE;

  if (!canvas || !THREE) {
    console.warn("Starrex Earth: canvas or Three.js is unavailable.");
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
    console.warn("Starrex Earth: WebGL could not be initialized.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  let seed = 73621;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  function createFallbackEarthTexture() {
    const width = 1024;
    const height = 512;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const context = textureCanvas.getContext("2d");
    if (!context) throw new Error("Could not create the Earth fallback texture.");

    const ocean = context.createLinearGradient(0, 0, 0, height);
    ocean.addColorStop(0, "#164a70");
    ocean.addColorStop(0.48, "#17618d");
    ocean.addColorStop(1, "#0a355d");
    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);

    // Simplified land silhouettes are only a local fallback; the detailed
    // Blue Marble texture replaces this map when the hosted texture loads.
    const continents = [
      [[90,105],[125,73],[178,64],[215,84],[245,118],[225,151],[202,165],[190,204],[166,225],[150,270],[127,245],[120,210],[98,185],[82,148]],
      [[205,260],[242,273],[262,315],[251,355],[236,405],[215,444],[198,412],[193,365],[179,322]],
      [[420,92],[454,76],[492,89],[512,111],[548,115],[568,145],[549,170],[517,173],[497,197],[468,184],[444,160],[414,145]],
      [[475,190],[507,201],[527,231],[520,268],[502,305],[487,351],[466,381],[449,354],[442,312],[450,274],[438,235]],
      [[545,98],[591,71],[654,76],[701,97],[749,89],[791,115],[812,145],[790,165],[755,169],[729,196],[688,186],[656,207],[624,188],[601,161],[568,155]],
      [[676,220],[715,208],[753,226],[777,259],[765,291],[739,312],[712,292],[689,267]],
      [[805,305],[839,292],[867,310],[876,337],[858,359],[827,352]]
    ];
    for (const points of continents) {
      context.beginPath();
      points.forEach(([x,y], index) => {
        const px = x / 900 * width;
        const py = y / 512 * height;
        if (index === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.closePath();
      const land = context.createLinearGradient(0, 55, 0, 440);
      land.addColorStop(0, "#8c9b6d");
      land.addColorStop(.48, "#638b62");
      land.addColorStop(1, "#a59a71");
      context.fillStyle = land;
      context.fill();
      context.strokeStyle = "rgba(190,205,157,.28)";
      context.lineWidth = 2;
      context.stroke();
    }

    // Subtle polar ice caps.
    context.fillStyle = "rgba(211,232,237,.82)";
    context.fillRect(0, 0, width, 13);
    context.fillRect(0, height - 13, width, 13);

    const image = context.getImageData(0, 0, width, height);
    for (let i = 0; i < image.data.length; i += 4) {
      const grain = (random() - .5) * 7;
      image.data[i] += grain;
      image.data[i + 1] += grain;
      image.data[i + 2] += grain;
    }
    context.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  }

  function createCloudFallbackTexture() {
    const width = 1024;
    const height = 512;
    const cloudCanvas = document.createElement("canvas");
    cloudCanvas.width = width;
    cloudCanvas.height = height;
    const context = cloudCanvas.getContext("2d");
    if (!context) throw new Error("Could not create the cloud fallback texture.");

    for (let i = 0; i < 460; i += 1) {
      const x = random() * width;
      const y = 22 + random() * (height - 44);
      const radiusX = 5 + random() * 27;
      const radiusY = 1.5 + random() * 6;
      context.save();
      context.translate(x, y);
      context.rotate((random() - .5) * .5);
      context.fillStyle = `rgba(230,242,248,${.025 + random() * .075})`;
      context.beginPath();
      context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    const texture = new THREE.CanvasTexture(cloudCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  }

  let earthTexture;
  let cloudTexture;
  try {
    earthTexture = createFallbackEarthTexture();
    cloudTexture = createCloudFallbackTexture();
  } catch (error) {
    renderer.dispose();
    console.warn("Starrex Earth: Fallback texture generation failed.", error);
    return;
  }

  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.94,
    metalness: 0,
  });

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.98, 128, 128),
    earthMaterial,
  );
  earth.rotation.set(0.08, -0.55, -0.12);
  earthGroup.add(earth);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    alphaMap: cloudTexture,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    roughness: 1,
  });
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(2.012, 96, 96),
    cloudMaterial,
  );
  clouds.rotation.copy(earth.rotation);
  earthGroup.add(clouds);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x55b9e8) },
      glowStrength: { value: 0.48 },
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
      uniform vec3 glowColor;
      uniform float glowStrength;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float intensity = pow(0.72 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 3.0);
        gl_FragColor = vec4(glowColor, intensity * glowStrength);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.09, 96, 96),
    atmosphereMaterial,
  );
  earthGroup.add(atmosphere);

  document.body.classList.add("earth-scene-ready");

  const keyLight = new THREE.DirectionalLight(0xfff4df, 3.0);
  keyLight.position.set(-5.5, 3.2, 5.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x6eadd5, 0.22);
  fillLight.position.set(4, -2, 3);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0x52758d, 0.16));

  const starPositions = [];
  for (let i = 0; i < 600; i += 1) {
    starPositions.push(
      (random() - .5) * 48,
      (random() - .5) * 30,
      -7 - random() * 24,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xc7e5f3,
    size: 0.032,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeometry, starsMaterial);
  scene.add(stars);

  // Load a detailed Earth surface texture lazily on this page only.
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin("anonymous");
  textureLoader.load(
    "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
    (loadedTexture) => {
      if (isDisposed) {
        loadedTexture.dispose();
        return;
      }
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      const previousTexture = earthMaterial.map;
      earthMaterial.map = loadedTexture;
      earthMaterial.needsUpdate = true;
      if (previousTexture && previousTexture !== loadedTexture) previousTexture.dispose();
      earthTexture = loadedTexture;
    },
    undefined,
    (error) => console.warn("Starrex Earth: Detailed surface texture unavailable; using the local fallback.", error),
  );

  textureLoader.load(
    "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
    (loadedTexture) => {
      if (isDisposed) {
        loadedTexture.dispose();
        return;
      }
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      const previousTexture = cloudMaterial.alphaMap;
      cloudMaterial.alphaMap = loadedTexture;
      cloudMaterial.needsUpdate = true;
      if (previousTexture && previousTexture !== loadedTexture) previousTexture.dispose();
      cloudTexture = loadedTexture;
    },
    undefined,
    (error) => console.warn("Starrex Earth: Cloud texture unavailable; using subtle procedural cloud detail.", error),
  );

  const base = new THREE.Vector2(4.7, -0.35);
  let scrollTravel = 5.8;
  let isContextLost = false;
  let isDisposed = false;
  let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateComposition({ portrait, halfViewWidth }) {
    base.set(halfViewWidth * (portrait ? 0.53 : 0.76), portrait ? -1.55 : -0.35);
    earthGroup.scale.setScalar(portrait ? 0.53 : 1);
    scrollTravel = portrait ? 5.8 : 5.8;
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
      earth.rotation.y += 0.00022;
      clouds.rotation.y += 0.00028;
      stars.rotation.z += 0.00001;
    }

    const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const maxScroll = Math.max(pageHeight - window.innerHeight, 1);
    const scrollTop = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
    const progress = THREE.MathUtils.clamp(scrollTop / maxScroll, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);

    earthGroup.position.x += (base.x - earthGroup.position.x) * 0.045;
    earthGroup.position.y += (base.y + eased * scrollTravel - earthGroup.position.y) * 0.065;

    renderer.render(scene, camera);
    return true;
  }

  const animationLoop = createAnimationLoop({ onFrame: renderFrame, shouldRun });
  let viewportController;
  let visibilityController;

  function handleContextLost(event) {
    event.preventDefault();
    isContextLost = true;
    document.body.classList.remove("earth-scene-ready");
    animationLoop.stop();
    console.warn("Starrex Earth: WebGL context was lost.");
  }

  function handleContextRestored() {
    isContextLost = false;
    document.body.classList.add("earth-scene-ready");
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
    earth.geometry.dispose();
    clouds.geometry.dispose();
    earthMaterial.dispose();
    cloudMaterial.dispose();
    atmosphere.geometry.dispose();
    atmosphereMaterial.dispose();
    earthTexture?.dispose();
    cloudTexture?.dispose();
    starGeometry.dispose();
    starsMaterial.dispose();
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
    document.body.classList.remove("earth-scene-ready");
    disposeScene();
    console.error("Starrex Earth: Initialization failed.", error);
  }
})();
