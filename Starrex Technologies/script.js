const canvas = document.getElementById("planet");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.z = 10;

const group = new THREE.Group();
scene.add(group);

/* ---------- PLANET (lit, with glowing city lights + rim light) ---------- */
const texture = new THREE.TextureLoader().load("assets/images/earth-night.jpg");
texture.wrapS = THREE.RepeatWrapping;

const planetMat = new THREE.ShaderMaterial({
  uniforms: {
    uMap: { value: texture },
    uRot: { value: 0 },
    uSun: { value: new THREE.Vector3(-0.9, 0.7, 0.4) }
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
    uniform sampler2D uMap;
    uniform float uRot;
    uniform vec3 uSun;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 tex = texture2D(uMap, vec2(vUv.x + uRot, vUv.y)).rgb;
      float lum = dot(tex, vec3(0.299, 0.587, 0.114));

      float d = dot(n, normalize(uSun));
      float day = smoothstep(-0.15, 0.4, d);

      vec3 base = vec3(0.02, 0.01, 0.07);
      vec3 lights = (tex * vec3(0.9, 0.6, 1.5) + lum * vec3(0.6, 0.4, 1.0)) * 2.0;
      lights *= mix(1.0, 0.35, day);

      float fres = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 3.0);
      vec3 rim = vec3(0.55, 0.3, 1.0) * fres * (0.35 + 1.1 * day);

      gl_FragColor = vec4(base + lights + rim, 1.0);
    }
  `
});
const planet = new THREE.Mesh(new THREE.SphereGeometry(2.4, 96, 96), planetMat);
group.add(planet);

/* ---------- ATMOSPHERE GLOW ---------- */
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.62, 96, 96),
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
        float i = pow(max(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
        gl_FragColor = vec4(0.6, 0.35, 1.0, 1.0) * i * 1.8;
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  })
);
group.add(atmosphere);

/* ---------- ORBIT RING + GLOWING STAR ---------- */
const ringGroup = new THREE.Group();
ringGroup.rotation.set(1.25, 0.25, 0.15);
group.add(ringGroup);

ringGroup.add(new THREE.Mesh(
  new THREE.TorusGeometry(3.5, 0.012, 16, 300),
  new THREE.MeshBasicMaterial({ color: 0xc4a0ff })
));
ringGroup.add(new THREE.Mesh(
  new THREE.TorusGeometry(3.5, 0.06, 16, 300),
  new THREE.MeshBasicMaterial({
    color: 0x8b4dff, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false
  })
));

function makeFlare() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.15, "rgba(210,170,255,0.9)");
  grad.addColorStop(0.4, "rgba(140,80,255,0.25)");
  grad.addColorStop(1, "rgba(140,80,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(225,205,255,0.8)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(64, 6); g.lineTo(64, 122);
  g.moveTo(6, 64); g.lineTo(122, 64);
  g.stroke();
  return new THREE.CanvasTexture(c);
}
const flare = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeFlare(), blending: THREE.AdditiveBlending,
  transparent: true, depthWrite: false
}));
flare.scale.set(0.8, 0.8, 1);
ringGroup.add(flare);

/* ---------- STARS (two layers, drifting) ---------- */
function makeStars(count, size, spread) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    pos.push(
      (Math.random() - 0.5) * spread * 1.8,
      (Math.random() - 0.5) * spread,
      -Math.random() * 25 - 2
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xd9c8ff, size, transparent: true, opacity: 0.85, depthWrite: false
  }));
}
const starsFar = makeStars(700, 0.04, 40);
const starsNear = makeStars(120, 0.09, 30);
scene.add(starsFar, starsNear);

/* ---------- SIZE + POSITION ---------- */
const base = new THREE.Vector2(2.8, -0.6);
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const halfW = Math.tan(THREE.MathUtils.degToRad(20)) * 10 * camera.aspect;
const portrait = camera.aspect < 1;
base.set(halfW * (portrait ? 0.45 : 0.73), portrait ? -1.6 : -0.5);
group.scale.setScalar(portrait ? 0.6 : 1);
}
window.addEventListener("resize", resize);
resize();

/* ---------- MOUSE PARALLAX ---------- */
const mouse = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ---------- ANIMATE ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const speed = reduce ? 0.00005 : 0.00025;
let flareAngle = 0;

function animate() {
  planetMat.uniforms.uRot.value += speed;

  ringGroup.rotation.z += reduce ? 0 : 0.0006;
  flareAngle += reduce ? 0 : 0.006;
  flare.position.set(Math.cos(flareAngle) * 3.5, Math.sin(flareAngle) * 3.5, 0);

  starsFar.rotation.z += 0.00005;
  starsNear.rotation.z += 0.0001;

  const scrollLift = Math.min(window.scrollY * 0.003, 3);
  group.position.x += (base.x + mouse.x * 0.2 - group.position.x) * 0.05;
  group.position.y += (base.y + scrollLift - mouse.y * 0.15 - group.position.y) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();