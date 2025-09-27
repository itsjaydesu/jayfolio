'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const SEPARATION = 90;
const AMOUNTX = 70;
const AMOUNTY = 70;
const HALF_GRID_X = ((AMOUNTX - 1) * SEPARATION) / 2;
const HALF_GRID_Y = ((AMOUNTY - 1) * SEPARATION) / 2;

const RETRO_INFLUENCE = {
  about: (apply) => {
    apply('mouseInfluence', 0.0035);
    apply('animationSpeed', 0.36);
    apply('brightness', 0.5);
  },
  projects: (apply) => {
    apply('animationSpeed', 0.48);
    apply('swirlStrength', 1.6);
    apply('pointSize', 26);
  },
  words: (apply) => {
    apply('animationSpeed', 0.24);
    apply('rippleWidth', 28);
    apply('contrast', 2.1);
  },
  sounds: (apply) => {
    apply('rippleStrength', 58);
    apply('rippleDecay', 0.0012);
    apply('mouseInfluence', 0.0045);
  }
};

export default function SceneCanvas({ activeSection }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    let camera;
    let scene;
    let stats;
    let gui;
    let particles;
    let animationFrame;

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

    const settings = {
      amplitude: 70,
      waveXFrequency: 0.18,
      waveYFrequency: 0.24,
      swirlStrength: 1.1,
      swirlFrequency: 0.0055,
      animationSpeed: 0.36,
      pointSize: 28,
      mouseInfluence: 0.0035,
      rippleStrength: 45,
      rippleSpeed: 300,
      rippleWidth: 22,
      rippleDecay: 0.0018,
      opacity: 0.85,
      autoRotate: true,
      showStats: false,
      brightness: 0.5,
      contrast: 2.5,
      fogDensity: 0.0015
    };

    const controllers = {};
    const fixedStates = {};
    const defaultLockedKeys = new Set(['opacity', 'pointSize', 'brightness', 'contrast', 'fogDensity']);

    function registerController(key, controller) {
      if (!controller) return controller;
      controllers[key] = controller;
      if (!(key in fixedStates)) {
        fixedStates[key] = defaultLockedKeys.has(key);
      }
      Promise.resolve().then(() => attachFixedToggle(controller, key));
      return controller;
    }

    function attachFixedToggle(controller, key) {
      const row = controller?.domElement;
      if (!row || row.querySelector('.fixed-toggle')) return;
      row.classList.add('controller-with-fixed');

      const toggle = document.createElement('label');
      toggle.className = 'fixed-toggle';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = fixedStates[key];
      checkbox.addEventListener('change', () => {
        fixedStates[key] = checkbox.checked;
        row.classList.toggle('is-locked', checkbox.checked);
      });

      const text = document.createElement('span');
      text.textContent = 'Fixed';

      toggle.appendChild(checkbox);
      toggle.appendChild(text);
      row.appendChild(toggle);

      if (checkbox.checked) {
        row.classList.add('is-locked');
      }
    }

    function applyMenuValue(key, value) {
      const controller = controllers[key];
      if (fixedStates[key]) {
        controller?.updateDisplay?.();
        return false;
      }
      if (controller) {
        controller.setValue(value);
      } else {
        settings[key] = value;
      }
      return true;
    }

    function buildGui() {
      gui = new GUI({ title: 'Field Controls' });

      const waveFolder = gui.addFolder('Waves');
      registerController('amplitude', waveFolder.add(settings, 'amplitude', 30, 140, 1));
      registerController(
        'waveXFrequency',
        waveFolder.add(settings, 'waveXFrequency', 0.05, 0.45, 0.005).name('Frequency X')
      );
      registerController(
        'waveYFrequency',
        waveFolder.add(settings, 'waveYFrequency', 0.05, 0.45, 0.005).name('Frequency Y')
      );
      registerController('swirlStrength', waveFolder.add(settings, 'swirlStrength', 0, 3, 0.01));
      registerController(
        'swirlFrequency',
        waveFolder.add(settings, 'swirlFrequency', 0.001, 0.02, 0.0005).name('Swirl Scale')
      );
      registerController(
        'animationSpeed',
        waveFolder.add(settings, 'animationSpeed', 0.05, 1.2, 0.01).name('Flow Speed')
      );

      const toneFolder = gui.addFolder('Tone & Glow');
      registerController(
        'opacity',
        toneFolder.add(settings, 'opacity', 0.3, 1, 0.01).name('Glow').onChange((value) => {
          uniforms.opacity.value = value;
        })
      );
      registerController(
        'pointSize',
        toneFolder.add(settings, 'pointSize', 6, 32, 0.5).name('Point Scale').onChange((value) => {
          uniforms.pointMultiplier.value = value;
        })
      );
      registerController('brightness', toneFolder.add(settings, 'brightness', 0.1, 0.6, 0.01));
      registerController('contrast', toneFolder.add(settings, 'contrast', 0.6, 2.5, 0.05));
      registerController(
        'fogDensity',
        toneFolder.add(settings, 'fogDensity', 0.0002, 0.003, 0.0001).name('Fog').onChange((value) => {
          if (scene?.fog) {
            scene.fog.density = value;
          }
        })
      );

      const interactionFolder = gui.addFolder('Interaction');
      registerController(
        'mouseInfluence',
        interactionFolder.add(settings, 'mouseInfluence', 0.001, 0.02, 0.0005).name('Pointer Warp')
      );
      registerController(
        'rippleStrength',
        interactionFolder.add(settings, 'rippleStrength', 10, 120, 1).name('Ripple Strength')
      );
      registerController(
        'rippleSpeed',
        interactionFolder.add(settings, 'rippleSpeed', 120, 520, 5).name('Ripple Speed')
      );
      registerController(
        'rippleWidth',
        interactionFolder.add(settings, 'rippleWidth', 8, 40, 0.1).name('Ripple Width')
      );
      registerController(
        'rippleDecay',
        interactionFolder.add(settings, 'rippleDecay', 0.0005, 0.01, 0.0001).name('Ripple Fade')
      );
      registerController('autoRotate', interactionFolder.add(settings, 'autoRotate'));
      registerController(
        'showStats',
        interactionFolder.add(settings, 'showStats').name('Show Stats').onChange((value) => {
          if (stats?.dom) {
            stats.dom.style.display = value ? 'block' : 'none';
          }
        })
      );

      const actions = {
        randomize: () => {
          const ranges = {
            amplitude: [30, 140],
            waveXFrequency: [0.05, 0.45],
            waveYFrequency: [0.05, 0.45],
            swirlStrength: [0, 3],
            swirlFrequency: [0.001, 0.02],
            animationSpeed: [0.05, 1.2],
            opacity: [0.35, 0.95],
            pointSize: [8, 30],
            brightness: [0.15, 0.55],
            contrast: [0.8, 2.5],
            fogDensity: [0.00025, 0.0022],
            mouseInfluence: [0.0015, 0.015],
            rippleStrength: [15, 110],
            rippleSpeed: [140, 480],
            rippleWidth: [10, 32],
            rippleDecay: [0.0009, 0.006],
            autoRotate: [0, 1],
            showStats: [0, 1]
          };

          Object.entries(ranges).forEach(([key, [min, max]]) => {
            if (fixedStates[key]) return;
            const value = key === 'autoRotate' || key === 'showStats'
              ? Math.random() > 0.5
              : min + Math.random() * (max - min);
            controllers[key]?.setValue(value);
          });
        },
        copySettings: async () => {
          const payload = getExportPayload();
          const serialized = JSON.stringify(payload, null, 2);
          try {
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(serialized);
              flashMessage('Settings copied to clipboard');
              return;
            }
          } catch (error) {
            console.warn('Clipboard copy failed', error);
          }
          downloadText(serialized, 'field-settings.json');
        },
        downloadSettings: () => {
          const payload = getExportPayload();
          const serialized = JSON.stringify(payload, null, 2);
          downloadText(serialized, 'field-settings.json');
        }
      };

      gui.add(actions, 'randomize').name('Randomize');
      gui.add(actions, 'copySettings').name('Copy Settings');
      gui.add(actions, 'downloadSettings').name('Download Settings');
    }

    function getSettingsSnapshot() {
      const {
        amplitude,
        waveXFrequency,
        waveYFrequency,
        swirlStrength,
        swirlFrequency,
        animationSpeed,
        pointSize,
        mouseInfluence,
        rippleStrength,
        rippleSpeed,
        rippleWidth,
        rippleDecay,
        opacity,
        autoRotate,
        showStats,
        brightness,
        contrast,
        fogDensity
      } = settings;
      return {
        amplitude,
        waveXFrequency,
        waveYFrequency,
        swirlStrength,
        swirlFrequency,
        animationSpeed,
        pointSize,
        mouseInfluence,
        rippleStrength,
        rippleSpeed,
        rippleWidth,
        rippleDecay,
        opacity,
        autoRotate,
        showStats,
        brightness,
        contrast,
        fogDensity
      };
    }

    function getFixedSnapshot() {
      return Object.keys(controllers).reduce((acc, key) => {
        acc[key] = !!fixedStates[key];
        return acc;
      }, {});
    }

    function getExportPayload() {
      return {
        settings: getSettingsSnapshot(),
        fixed: getFixedSnapshot()
      };
    }

    let messageTimeout;
    function flashMessage(text) {
      clearTimeout(messageTimeout);
      let bubble = document.querySelector('.clipboard-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.className = 'clipboard-bubble';
        bubble.style.position = 'fixed';
        bubble.style.left = '50%';
        bubble.style.bottom = '60px';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.padding = '10px 16px';
        bubble.style.borderRadius = '999px';
        bubble.style.background = 'rgba(20, 20, 20, 0.82)';
        bubble.style.color = '#f5f5f5';
        bubble.style.fontSize = '0.75rem';
        bubble.style.letterSpacing = '0.08em';
        bubble.style.textTransform = 'uppercase';
        bubble.style.pointerEvents = 'none';
        bubble.style.transition = 'opacity 0.25s ease';
        document.body.appendChild(bubble);
      }
      bubble.textContent = text;
      bubble.style.opacity = '1';
      messageTimeout = setTimeout(() => {
        bubble.style.opacity = '0';
      }, 1600);
    }

    function downloadText(text, filename) {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
      stats.dom.style.display = 'none';
      container.appendChild(stats.dom);

      container.style.touchAction = 'none';
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerdown', onPointerDown);
      container.addEventListener('pointerleave', onPointerLeave);

      window.addEventListener('resize', onWindowResize);

      buildGui();
    }

    init();
    animate();

    stateRef.current = {
      applyMenuInfluence: (key) => {
        const handler = RETRO_INFLUENCE[key];
        if (handler) {
          handler(applyMenuValue);
        }
      }
    };

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', onWindowResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerleave', onPointerLeave);

      if (gui) {
        gui.destroy();
      }

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

      clearTimeout(messageTimeout);
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    const target = activeSection || 'about';
    state?.applyMenuInfluence?.(target);
  }, [activeSection]);

  return <div ref={containerRef} className="scene-container" />;
}
