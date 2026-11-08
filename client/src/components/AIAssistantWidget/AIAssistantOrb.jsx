import { useEffect, useRef } from "react";
import * as THREE from "three";

// Vertex positions wobble outward along their normal, like a slow plasma
// breathing — no texture lookups, just layered sines, so it stays cheap
// enough to run as a tiny always-on widget.
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

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The AI voice assistant's "face" on the Home page: a small rotating,
// pulsing icosphere shaded like plasma. One unlit mesh, so the WebGL cost
// is tiny even mounted as an always-visible floating widget.
const AIAssistantOrb = ({ size = 64 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return undefined; // No WebGL — the CSS glow behind the canvas carries the look.
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    camera.position.set(0, 0, 3.1);

    const geometry = new THREE.IcosahedronGeometry(1, 4);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uLevel: { value: 0 },
        uColorA: { value: new THREE.Color("#6c63ff") },
        uColorB: { value: new THREE.Color("#43c0a0") },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const motionOff = reducedMotion();
    let raf = 0;
    const clock = new THREE.Clock();
    const renderFrame = () => {
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;
      const idleTarget = 0.22 + Math.sin(t * 1.6) * 0.12;
      material.uniforms.uLevel.value += (idleTarget - material.uniforms.uLevel.value) * 0.08;
      mesh.rotation.y = t * 0.35;
      mesh.rotation.x = Math.sin(t * 0.5) * 0.18;
      renderer.render(scene, camera);
      if (!motionOff) raf = requestAnimationFrame(renderFrame);
    };
    renderFrame();

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!motionOff) renderFrame();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [size]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
};

export default AIAssistantOrb;
