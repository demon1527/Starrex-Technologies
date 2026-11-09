import { createAnimationLoop } from "./animation-loop.js";
import { createViewportController } from "./viewport.js";
import { createVisibilityController } from "./visibility.js";

/* =========================================================
   STARREX – Rotating Saturn background (Three.js)
   Procedural banded gas giant + realistic ring system.
   No texture downloads needed.
   
   Stability improvements:
   - WebGL availability protection
   - Single animation loop
   - Pause when tab is hidden
   - WebGL context-loss handling
   - Resize handling
   - Reduced-motion support
========================================================= */

(() => {
  "use strict";

  /* ---------- INITIAL SAFETY CHECKS ---------- */
  if (document.body.dataset.planet === "moon") return;

  const canvas = document.getElementById("planet");

  if (!canvas) {
    console.warn("Starrex Saturn: Canvas #planet was not found.");
    return;
  }

  if (!window.THREE) {
    console.warn("Starrex Saturn: Three.js is not available.");
    return;
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
  } catch (error) {
    console.warn("Starrex Saturn: WebGL could not be initialized.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;

  const group = new THREE.Group();
  scene.add(group);

  const PLANET_R = 2.0;
  const FLATTEN = 0.93;
  const SUN = new THREE.Vector3(-0.9, 0.3, 0.5).normalize();

  /* ---------- HELPERS ---------- */
  let seed = 11;

  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  function smoothArr(arr, k) {
    return arr.map((_, i) => {
      let s = 0;
      let n = 0;

      for (let j = -k; j <= k; j++) {
        const idx = i + j;

        if (idx >= 0 && idx < arr.length) {
          s += arr[idx];
          n++;
        }
      }

      return s / n;
    });
  }

  function normArr(arr) {
    let lo = Infinity;
    let hi = -Infinity;

    for (const v of arr) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }

    return arr.map((v) => (v - lo) / (hi - lo || 1));
  }

  function ramp(t, stops) {
    t = Math.min(Math.max(t, 0), 1);

    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i];
      const [t1, c1] = stops[i + 1];

      if (t <= t1) {
        const f = (t - t0) / (t1 - t0);

        return [
          c0[0] + (c1[0] - c0[0]) * f,
          c0[1] + (c1[1] - c0[1]) * f,
          c0[2] + (c1[2] - c0[2]) * f,
        ];
      }
    }

    return stops[stops.length - 1][1];
  }

  /* ---------- SATURN SURFACE TEXTURE ---------- */
  function makeSaturnTexture() {
    const w = 2048;
    const h = 1024;

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;

    const g = c.getContext("2d");
    const img = g.createImageData(w, h);

    function makeNoise(nx, ny) {
      const L = new Float32Array(nx * (ny + 1));

      for (let i = 0; i < L.length; i++) {
        L[i] = rnd();
      }

      return (u, v) => {
        const x = u * nx;
        const y = v * ny;

        const ix = Math.floor(x);
        const iy = Math.floor(y);

        let fx = x - ix;
        let fy = y - iy;

        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);

        const x0 = ix % nx;
        const x1 = (ix + 1) % nx;

        const a = L[iy * nx + x0];
        const b = L[iy * nx + x1];
        const c2 = L[(iy + 1) * nx + x0];
        const d = L[(iy + 1) * nx + x1];

        return (a + (b - a) * fx) * (1 - fy) + (c2 + (d - c2) * fx) * fy;
      };
    }

    const waves = makeNoise(10, 6);
    const swirls = makeNoise(40, 20);
    const streaks = makeNoise(5, 220);

    const raw = Array.from({ length: h }, rnd);

    const a1 = normArr(smoothArr(raw, 30));
    const a2 = normArr(smoothArr(raw, 10));
    const a3 = normArr(smoothArr(raw, 3));

    const prof = normArr(
      a1.map((_, i) => 0.5 * a1[i] + 0.33 * a2[i] + 0.17 * a3[i]),
    );

    const stops = [
      [0.0, [118, 92, 62]],
      [0.3, [170, 140, 94]],
      [0.58, [212, 185, 133]],
      [0.82, [235, 215, 166]],
      [1.0, [247, 236, 204]],
    ];

    for (let y = 0; y < h; y++) {
      const v = y / h;

      const polar = Math.abs(v - 0.5) * 2;
      const polarMix = Math.min(Math.max((polar - 0.72) / 0.28, 0), 1) * 0.45;

      for (let x = 0; x < w; x++) {
        const u = x / w;

        const warp = (waves(u, v) - 0.5) * 0.032 + (swirls(u, v) - 0.5) * 0.01;

        const vy = Math.min(Math.max(v + warp, 0), 0.999);

        let t = prof[Math.floor(vy * (h - 1))];

        t += (streaks(u, v) - 0.5) * 0.14 + (swirls(u, v) - 0.5) * 0.1;

        t = 0.12 + 0.8 * t;

        const col = ramp(t, stops);
        const k = (y * w + x) * 4;

        img.data[k] = col[0] * (1 - polarMix) + 138 * polarMix;
        img.data[k + 1] = col[1] * (1 - polarMix) + 140 * polarMix;
        img.data[k + 2] = col[2] * (1 - polarMix) + 132 * polarMix;
        img.data[k + 3] = 255;
      }
    }

    g.putImageData(img, 0, 0);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    return tex;
  }

  /* ---------- RING TEXTURE ---------- */
  function makeRingTexture() {
    const w = 2048;
    const h = 4;

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;

    const g = c.getContext("2d");
    const img = g.createImageData(w, h);

    const noise = Array.from({ length: w }, rnd);

    const fine = normArr(smoothArr(noise, 1));
    const mid = normArr(smoothArr(noise, 6));
    const broad = normArr(smoothArr(noise, 28));

    const alpha = new Array(w);
    const cols = new Array(w);

    for (let i = 0; i < w; i++) {
      const r = i / (w - 1);

      const rl =
        (fine[i] - 0.5) * 0.45 +
        (mid[i] - 0.5) * 0.55 +
        (broad[i] - 0.5) * 0.35;

      let a;
      let col;

      if (r < 0.28) {
        const q = r / 0.28;

        a = 0.14 + 0.26 * q + rl * 0.22;
        col = [128 + 36 * q, 113 + 32 * q, 92 + 24 * q];
      } else if (r < 0.69) {
        const q = (r - 0.28) / 0.41;

        a = 0.8 + 0.16 * q + rl * 0.4;
        col = [205 + 33 * q, 180 + 42 * q, 140 + 50 * q];
      } else if (r < 0.765) {
        a = 0.06 + rl * 0.08;
        col = [170, 150, 120];
      } else {
        const q = (r - 0.765) / 0.235;

        a = 0.66 - 0.12 * q + rl * 0.38;
        col = [214, 196, 162];

        if (r > 0.943 && r < 0.957) {
          a *= 0.12;
        }

        a *= Math.min(Math.max((1.0 - r) / 0.03, 0), 1);
      }

      alpha[i] = Math.min(Math.max(a, 0), 1);
      cols[i] = col;
    }

    const alphaS = smoothArr(alpha, 2);

    for (let i = 0; i < w; i++) {
      for (let y = 0; y < h; y++) {
        const k = (y * w + i) * 4;

        img.data[k] = cols[i][0];
        img.data[k + 1] = cols[i][1];
        img.data[k + 2] = cols[i][2];
        img.data[k + 3] = alphaS[i] * 255;
      }
    }

    g.putImageData(img, 0, 0);

    return new THREE.CanvasTexture(c);
  }

  const saturnTex = makeSaturnTexture();
  const ringTex = makeRingTexture();

  const R_IN = PLANET_R * 1.24;
  const R_OUT = PLANET_R * 2.27;

  /* ---------- SATURN RINGS ---------- */
  const ringGeo = new THREE.RingGeometry(R_IN, R_OUT, 256, 1);

  {
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      uv.setXY(i, (v.length() - R_IN) / (R_OUT - R_IN), 0.5);
    }
  }

  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: ringTex },
        uSun: { value: SUN },
        uR: { value: PLANET_R },
        uTilt: { value: new THREE.Matrix4() },
      },

      vertexShader: `
        uniform mat4 uTilt;
        varying vec2 vUv;
        varying vec3 vGP;

        void main() {
          vUv = uv;
          vGP = (uTilt * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform sampler2D uMap;
        uniform vec3 uSun;
        uniform float uR;

        varying vec2 vUv;
        varying vec3 vGP;

        void main() {
          vec4 tex = texture2D(uMap, vUv);

          vec3 l = normalize(uSun);
          float b = dot(vGP, l);

          float disc = b * b - (dot(vGP, vGP) - uR * uR);
          float shadow = smoothstep(-0.8, 1.2, disc) * step(b, 0.0);

          float grey = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
          vec3 rc = mix(vec3(grey), tex.rgb, 0.6);

          float ringOpacity = clamp(tex.a * 1.22 + 0.055, 0.0, 0.98);
          // Lower ring luminance so the background stays behind the content.
          gl_FragColor = vec4(rc * (1.0 - 0.78 * shadow) * 0.62, ringOpacity);
        }
      `,

      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );

  ring.rotation.order = "ZXY";
  ring.rotation.x = THREE.MathUtils.degToRad(-70);
  ring.rotation.z = THREE.MathUtils.degToRad(16);

  ring.updateMatrix();
  ring.material.uniforms.uTilt.value = ring.matrix;

  ring.renderOrder = 3;
  group.add(ring);

  const ringNormal = new THREE.Vector3(0, 0, 1).transformDirection(ring.matrix);

  /* ---------- PLANET BODY ---------- */
  const globe = new THREE.Group();

  globe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ringNormal);

  globe.scale.set(1, FLATTEN, 1);
  group.add(globe);

  const planetMat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: saturnTex },
      uRing: { value: ringTex },
      uRot: { value: 0 },
      uSun: { value: SUN },
      uN: { value: ringNormal },
      uR: { value: PLANET_R },
      uRin: { value: R_IN },
      uRout: { value: R_OUT },
    },

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);

        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);

        gl_Position = projectionMatrix * mv;
      }
    `,

    fragmentShader: `
      uniform sampler2D uTex;
      uniform sampler2D uRing;

      uniform float uRot, uR, uRin, uRout;
      uniform vec3 uSun, uN;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vView);
        vec3 l = normalize(uSun);

        vec3 tex = texture2D(uTex, vec2(vUv.x + uRot, vUv.y)).rgb;

        float grey = dot(tex, vec3(0.299, 0.587, 0.114));
        tex = mix(vec3(grey), tex, 0.5);

        float d = dot(n, l);
        float soft = smoothstep(-0.12, 0.75, d);

        // Shadow of the rings on the planet.
        vec3 p = n * uR;
        float ndl = dot(l, uN);
        float shadow = 0.0;

        if (abs(ndl) > 0.02) {
          float t = -dot(p, uN) / ndl;

          if (t > 0.0) {
            vec3 hp = p + l * t;
            float k = (length(hp) - uRin) / (uRout - uRin);

            if (k > 0.0 && k < 1.0) {
              shadow = texture2D(uRing, vec2(k, 0.5)).a;
            }
          }
        }

        float mu = max(dot(n, v), 0.0);

        vec3 col = tex * (0.075 + 1.32 * soft * (1.0 - 0.72 * shadow));
        col *= 0.6 + 0.4 * pow(mu, 0.6);

        float fres = pow(1.0 - mu, 3.0);
        col += vec3(0.85, 0.82, 0.75) * fres * 0.22 * soft;

        // Apply the final brightness reduction to both the surface and rim light.
        col *= 0.62;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_R, 128, 128),
    planetMat,
  );

  globe.add(planet);

  /* ---------- GOLDEN ATMOSPHERE ---------- */
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_R * 1.07, 96, 96),

    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        varying vec3 vNormal;

        void main() {
          float i = pow(
            max(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0),
            3.0
          );

          gl_FragColor = vec4(0.85, 0.80, 0.70, 1.0) * i * 0.5;
        }
      `,

      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );

  atmosphere.renderOrder = 2;
  globe.add(atmosphere);

  /* ---------- STARS ---------- */
  function makeStars(count, size, spread) {
    const pos = [];

    for (let i = 0; i < count; i++) {
      pos.push(
        (Math.random() - 0.5) * spread * 1.8,
        (Math.random() - 0.5) * spread,
        -Math.random() * 25 - 2,
      );
    }

    const geo = new THREE.BufferGeometry();

    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));

    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xfff4e0,
        size,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    );
  }

  const starsFar = makeStars(700, 0.04, 40);
  const starsNear = makeStars(120, 0.09, 30);

  scene.add(starsFar, starsNear);

  /* ---------- SIZE AND POSITION ---------- */
  const base = new THREE.Vector2(4.6, -0.3);
  let scrollTravel = 9.4;

  let viewportController = null;
  let visibilityController = null;

  function updateSaturnComposition({ portrait, halfViewWidth }) {
    // Preserve the established Saturn position and responsive scale.
    base.set(
      halfViewWidth * (portrait ? 0.4 : 0.76),
      portrait ? -1.6 : -0.3,
    );
    group.scale.setScalar(portrait ? 0.55 : 1);

    // Keep Saturn visible through most of the page and move it fully
    // beyond the top edge only as the visitor approaches the page bottom.
    // Portrait positioning starts lower, so it needs slightly more travel.
    scrollTravel = portrait ? 6.4 : 6.0;
  }

  /* ---------- MOUSE PARALLAX ---------- */
  const mouse = { x: 0, y: 0 };

  function handlePointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  /* ---------- MOTION PREFERENCES ---------- */
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let reduceMotion = motionQuery.matches;

  // Original rotation speeds.
  const normalSpeed = 0.0005;
  const reducedSpeed = 0.0001;

  /* ---------- ANIMATION CONTROL ---------- */
  let isContextLost = false;
  let isDisposed = false;

  function shouldAnimate() {
    if (isDisposed || isContextLost || document.hidden) return false;

    const context = renderer.getContext();
    return Boolean(context && !context.isContextLost());
  }

  function animate() {
    if (!shouldAnimate()) return false;

    const speed = reduceMotion ? reducedSpeed : normalSpeed;

    planetMat.uniforms.uRot.value += speed;

    if (!reduceMotion) {
      starsFar.rotation.z += 0.00005;
      starsNear.rotation.z += 0.0001;
    }

    // Normalize against the full document so the same behaviour works on
    // pages of different lengths, including future pages using this canvas.
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

    // Scroll-driven movement remains active even when reduced-motion is
    // enabled; that preference only reduces decorative rotation/parallax.
    const rawProgress = THREE.MathUtils.clamp(
      currentScroll / maxScroll,
      0,
      1,
    );

    // Smoothstep keeps the upward movement gradual at both ends of the page.
    const easedProgress =
      rawProgress * rawProgress * (3 - 2 * rawProgress);

    const scrollLift = easedProgress * scrollTravel;

    const targetX = base.x + (reduceMotion ? 0 : mouse.x * 0.2);
    group.position.x += (targetX - group.position.x) * 0.05;

    const targetY = base.y + scrollLift - (reduceMotion ? 0 : mouse.y * 0.15);

    group.position.y += (targetY - group.position.y) * 0.075;

    renderer.render(scene, camera);
    return true;
  }

  const animationLoop = createAnimationLoop({
    onFrame: animate,
    shouldRun: shouldAnimate,
  });

  function startAnimation() {
    animationLoop.start();
  }

  function stopAnimation() {
    animationLoop.stop();
  }

  /* ---------- BROWSER EVENT HANDLERS ---------- */
  function handleContextLost(event) {
    // Allow the browser to attempt restoring the WebGL context.
    event.preventDefault();

    isContextLost = true;
    stopAnimation();

    console.warn("Starrex Saturn: WebGL context was lost.");
  }

  function handleContextRestored() {
    isContextLost = false;

    console.info("Starrex Saturn: WebGL context restored.");

    viewportController?.resize();
    startAnimation();
  }

  function handleMotionPreferenceChange(event) {
    reduceMotion = event.matches;
  }

  /* ---------- INITIALIZE ---------- */
  try {
    viewportController = createViewportController({
      renderer,
      camera,
      onResize: updateSaturnComposition,
    });
    viewportController.resize();

    visibilityController = createVisibilityController({
      onVisibilityChange: (hidden) => {
        if (hidden) {
          stopAnimation();
        } else {
          startAnimation();
        }
      },
    });

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    canvas.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionPreferenceChange);
    } else {
      // Compatibility with older browsers.
      motionQuery.addListener(handleMotionPreferenceChange);
    }

    startAnimation();
  } catch (error) {
    isDisposed = true;
    visibilityController?.dispose();
    viewportController?.dispose();
    animationLoop.dispose();

    console.error("Starrex Saturn: Initialization failed.", error);
  }
})();
