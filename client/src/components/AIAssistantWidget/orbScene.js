// The AI Teacher orb's WebGL scene. three.js lives only in this file, which
// AIAssistantOrb.jsx fetches (a separate chunk) when an orb is first on screen.
import { Color, IcosahedronGeometry, Mesh, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from "three";

// Vertex positions wobble outward along their normal, like a slow plasma
// breathing: no texture lookups, just layered sines.
const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uLevel;
  varying vec3 vNormal;
  varying float vDisplacement;

  float wobble(vec3 p, float t) {
    return sin(p.x * 3.0 + t) * sin(p.y * 2.6 - t * 1.3) * sin(p.z * 3.4 + t * 0.7);
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    float d = wobble(normal * 2.0, uTime) * (0.05 + uLevel * 0.09);
    vDisplacement = d;
    vec3 displaced = position + normal * d;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.2);
    float band = sin(vDisplacement * 18.0 + uTime * 1.4) * 0.5 + 0.5;
    vec3 base = mix(uColorA, uColorB, band * 0.6 + fresnel * 0.4);
    vec3 glow = uColorB * fresnel * 1.6;
    gl_FragColor = vec4(base + glow, 1.0);
  }
`;

const FRAME_MS = 1000 / 30; // a slow, small orb: 30 pictures a second look the same as 60

/**
 * Builds the orb on a canvas. Throws when WebGL is unavailable (the caller keeps
 * its CSS orb). `start()` runs the frame loop, `stop()` pauses it (off screen,
 * tab hidden), `dispose()` frees the GPU objects.
 */
export function createOrb(canvas, size) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // At two device pixels per CSS pixel the edge is already smooth: no multisampling.
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: dpr < 2, powerPreference: "low-power" });
  renderer.setPixelRatio(dpr);
  renderer.setSize(size, size, false);

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 10);
  camera.position.set(0, 0, 3.1);

  const geometry = new IcosahedronGeometry(1, 4);
  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uColorA: { value: new Color("#6c63ff") },
      uColorB: { value: new Color("#43c0a0") },
    },
  });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  let raf = 0;
  let last = 0; // time of the last picture drawn (ms)
  let t = 0; // the orb's own clock (s): it stands still while the loop is paused
  let disposed = false;

  const draw = () => {
    material.uniforms.uTime.value = t;
    const idleTarget = 0.22 + Math.sin(t * 1.6) * 0.12;
    material.uniforms.uLevel.value += (idleTarget - material.uniforms.uLevel.value) * 0.16;
    mesh.rotation.y = t * 0.35;
    mesh.rotation.x = Math.sin(t * 0.5) * 0.18;
    renderer.render(scene, camera);
  };
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = now - last;
    if (dt < FRAME_MS - 2) return;
    last = now;
    t += Math.min(dt, 100) / 1000;
    draw();
  };

  return {
    /** One picture, without starting the loop. */
    draw,
    start() {
      if (raf || disposed) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    stop() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
