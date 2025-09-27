'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { FIELD_DEFAULT_BASE, FIELD_DEFAULT_INFLUENCES } from '../lib/fieldDefaults';

const SEPARATION = 90;
const AMOUNTX = 70;
const AMOUNTY = 70;
const HALF_GRID_X = ((AMOUNTX - 1) * SEPARATION) / 2;
const HALF_GRID_Y = ((AMOUNTY - 1) * SEPARATION) / 2;

const DEFAULT_INFLUENCES = FIELD_DEFAULT_INFLUENCES;

export default function SceneCanvas({ activeSection, isPaused = false }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const initialSectionRef = useRef(null);

  if (initialSectionRef.current === null) {
    initialSectionRef.current = activeSection || 'about';
  }

  useEffect(() => {
    const initialSection = initialSectionRef.current || 'about';
    let cleanupFn = () => {};
    let isCancelled = false;

    async function bootstrap() {
      const container = containerRef.current;
      if (!container) {
        return () => {};
      }

      let renderer;
      let camera;
      let scene;
      let stats;
      let particles;
      let animationFrame;
      let paused = false;

      const clock = new THREE.Clock();
      let elapsedTime = 0;
      let animationTime = 0;
      let autoAngle = 0;

      const pointer = { x: 0, y: 0, worldX: 0, worldZ: 0, energy: 0 };
      const ripples = [];

      const uniforms = {
        opacity: { value: 0.85 },
        pointMultiplier: { value: 28 }
      };

      const settings = { ...FIELD_DEFAULT_BASE };
      let influences = { ...DEFAULT_INFLUENCES };

      try {
        const response = await fetch('/api/field-settings', { cache: 'no-store' });
        if (response.ok) {
          const payload = await response.json();
          if (payload?.base) {
            Object.assign(settings, payload.base);
          }
          if (payload?.influences) {
            influences = Object.keys(DEFAULT_INFLUENCES).reduce((acc, key) => {
              acc[key] = {
                ...DEFAULT_INFLUENCES[key],
                ...(payload.influences?.[key] ?? {})
              };
              return acc;
            }, {});
          }
        }
      } catch (error) {
        console.warn('Failed to load field settings', error);
      }

      if (isCancelled) {
        return () => {};
      }

      function applyMenuValue(key, value) {
        settings[key] = value;
        if (key === 'opacity') {
          uniforms.opacity.value = value;
        }
        if (key === 'pointSize') {
          uniforms.pointMultiplier.value = value;
        }
        if (key === 'fogDensity' && scene?.fog) {
          scene.fog.density = value;
        }
        if (key === 'showStats' && stats?.dom) {
          stats.dom.style.display = value ? 'block' : 'none';
        }
        return true;
      }

      function onWindowResize() {
        if (!renderer || !camera) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      function onPointerMove(event) {
        if (!event.isPrimary) return;
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

        const deltaX = normalizedX - pointer.x;
        const deltaY = normalizedY - pointer.y;

        pointer.x = normalizedX;
        pointer.y = normalizedY;
        pointer.worldX = pointer.x * HALF_GRID_X;
        pointer.worldZ = pointer.y * HALF_GRID_Y;
        pointer.energy = Math.min(pointer.energy + (Math.abs(deltaX) + Math.abs(deltaY)) * 0.35, 1.2);
      }

      function onPointerDown(event) {
        if (!event.isPrimary || !renderer) return;

        const rect = renderer.domElement.getBoundingClientRect();
        const normX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        const rippleX = normX * HALF_GRID_X;
        const rippleZ = normY * HALF_GRID_Y;

        ripples.push({ x: rippleX, z: rippleZ, start: elapsedTime });
        if (ripples.length > 8) {
          ripples.shift();
        }

        pointer.energy = Math.min(pointer.energy + 0.5, 1.4);
      }

      function onPointerLeave() {
        pointer.x = 0;
        pointer.y = 0;
        pointer.worldX = 0;
        pointer.worldZ = 0;
      }

      function render() {
        if (!renderer || !camera || !scene || !particles) return;

        const delta = clock.getDelta();
        elapsedTime += delta;
        animationTime += delta * settings.animationSpeed;

        if (settings.autoRotate) {
          autoAngle += delta * 0.1;
        }

        pointer.energy = Math.max(pointer.energy * 0.92 - 0.002, 0);

        const positions = particles.geometry.attributes.position.array;
        const scales = particles.geometry.attributes.scale.array;
        const colors = particles.geometry.attributes.color.array;

      let i = 0;
      let j = 0;

      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const px = ix * SEPARATION - HALF_GRID_X;
          const pz = iy * SEPARATION - HALF_GRID_Y;
          const radial = Math.sqrt(px * px + pz * pz);

          let height = 0;
          height += Math.sin(ix * settings.waveXFrequency + animationTime) * settings.amplitude;
          height += Math.cos(iy * settings.waveYFrequency - animationTime * 1.25) * settings.amplitude * 0.6;
          height += Math.sin(radial * settings.swirlFrequency - animationTime * 1.6) * settings.swirlStrength * settings.amplitude * 0.4;

          const dxMouse = px - pointer.worldX;
          const dzMouse = pz - pointer.worldZ;
          const mouseDist = Math.sqrt(dxMouse * dxMouse + dzMouse * dzMouse) + 0.0001;
          const mouseEnvelope = Math.exp(-mouseDist * settings.mouseInfluence * 0.55);
          height += Math.cos(mouseDist * settings.mouseInfluence * 14 - animationTime * 2.4) * pointer.energy * settings.amplitude * 0.28 * mouseEnvelope;

          for (let r = ripples.length - 1; r >= 0; r--) {
            const ripple = ripples[r];
            const age = elapsedTime - ripple.start;
            if (age > 6) {
              ripples.splice(r, 1);
              continue;
            }
            const dist = Math.sqrt((px - ripple.x) * (px - ripple.x) + (pz - ripple.z) * (pz - ripple.z)) + 0.0001;
            const wavefront = age * settings.rippleSpeed;
            const envelope = Math.exp(-dist * settings.rippleDecay) * Math.exp(-age * 0.55);
            height += Math.sin((dist - wavefront) / settings.rippleWidth) * settings.rippleStrength * 0.65 * envelope;
          }

          positions[i + 1] = height;

          const heightNormalized = THREE.MathUtils.clamp(0.5 + height * 0.0015, 0, 1);
          scales[j] = 0.6 + heightNormalized * 2.1;

          const grayscale = THREE.MathUtils.clamp(settings.brightness + heightNormalized * settings.contrast * 0.65, 0, 1);
          const ci = j * 3;
          colors[ci] = grayscale;
          colors[ci + 1] = grayscale;
          colors[ci + 2] = grayscale;

          i += 3;
          j++;
        }
      }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.scale.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;

        uniforms.pointMultiplier.value = settings.pointSize;
        uniforms.opacity.value = settings.opacity;

        const orbitRadius = 1180;
        const baseX = Math.cos(autoAngle) * orbitRadius;
        const baseZ = Math.sin(autoAngle) * orbitRadius * 0.72 + 1350;
        const targetX = baseX + pointer.x * 240;
        const targetY = 340 + pointer.y * 190;
        const targetZ = baseZ + pointer.y * -90;

        camera.position.x += (targetX - camera.position.x) * 0.04;
        camera.position.y += (targetY - camera.position.y) * 0.045;
        camera.position.z += (targetZ - camera.position.z) * 0.035;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);

        if (settings.showStats && stats) {
          stats.update();
        }
      }

      function animate() {
        animationFrame = requestAnimationFrame(animate);
        if (paused) {
          clock.getDelta();
          return;
        }
        render();
      }

      function init() {
        camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.set(0, 380, 1500);

        scene = new THREE.Scene();
        const backgroundColor = new THREE.Color(0x050505);
        scene.background = backgroundColor;
        scene.fog = new THREE.FogExp2(backgroundColor, settings.fogDensity);

        const numParticles = AMOUNTX * AMOUNTY;
        const positions = new Float32Array(numParticles * 3);
        const scales = new Float32Array(numParticles);
        const colors = new Float32Array(numParticles * 3);

        let i = 0;
        let j = 0;

        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            positions[i] = ix * SEPARATION - HALF_GRID_X;
            positions[i + 1] = 0;
            positions[i + 2] = iy * SEPARATION - HALF_GRID_Y;

            scales[j] = 1;

            colors[j * 3] = 1;
            colors[j * 3 + 1] = 1;
            colors[j * 3 + 2] = 1;

            i += 3;
            j++;
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: /* glsl */ `
            attribute float scale;
            attribute vec3 color;
            varying vec3 vColor;

            uniform float pointMultiplier;

            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = scale * pointMultiplier * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vColor;
            uniform float opacity;

            void main() {
              vec2 delta = gl_PointCoord - vec2(0.5);
              float dist = dot(delta, delta);
              if (dist > 0.25) discard;
              float falloff = smoothstep(0.25, 0.0, dist);
              gl_FragColor = vec4(vColor, falloff * opacity);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        particles = new THREE.Points(geometry, material);
        particles.frustumCulled = false;
        scene.add(particles);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        container.appendChild(renderer.domElement);

        stats = new Stats();
        stats.dom.style.display = settings.showStats ? 'block' : 'none';
        container.appendChild(stats.dom);

        container.style.touchAction = 'none';
        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointerleave', onPointerLeave);

        window.addEventListener('resize', onWindowResize);
      }

      init();
      animate();

      stateRef.current = {
        applyMenuInfluence: (key) => {
          const influence = influences[key];
          if (!influence) return;
          Object.entries(influence).forEach(([param, value]) => {
            applyMenuValue(param, value);
          });
        },
        setPaused: (value) => {
          paused = value;
        }
      };

      stateRef.current.applyMenuInfluence(initialSection);

      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', onWindowResize);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointerleave', onPointerLeave);

        if (stats?.dom?.parentNode) {
          stats.dom.parentNode.removeChild(stats.dom);
        }

        if (particles) {
          particles.geometry.dispose();
          particles.material.dispose();
          scene?.remove(particles);
        }

        if (renderer) {
          renderer.dispose();
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }

        stateRef.current = null;
      };
    }

    bootstrap().then((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanupFn = cleanup;
        if (isCancelled) {
          cleanupFn();
        }
      }
    });

    return () => {
      isCancelled = true;
      cleanupFn();
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    const target = activeSection || 'about';
    state?.applyMenuInfluence?.(target);
  }, [activeSection]);

  useEffect(() => {
    stateRef.current?.setPaused?.(isPaused);
  }, [isPaused]);

  return <div ref={containerRef} className="scene-container" />;
}
