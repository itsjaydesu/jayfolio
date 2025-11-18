'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { FIELD_DEFAULT_BASE, FIELD_DEFAULT_INFLUENCES } from '../lib/fieldDefaults';

const SEPARATION = 90;
const AMOUNTX = 70;
const AMOUNTY = 70;
const HALF_GRID_X = ((AMOUNTX - 1) * SEPARATION) / 2;
const HALF_GRID_Y = ((AMOUNTY - 1) * SEPARATION) / 2;

const DEFAULT_INFLUENCES = FIELD_DEFAULT_INFLUENCES;

const CLICK_DEBOUNCE_MS = 750;
const MAX_RIPPLES = 30; // GPU shader limit

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

const PERLIN_BASE_PERMUTATION = Uint8Array.from([
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
  140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
  247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
  57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
  65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
  200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
  52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
  207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
  119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
  129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
  218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
  81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
  184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
  222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
]);

const PERLIN_PERM = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  PERLIN_PERM[i] = PERLIN_BASE_PERMUTATION[i & 255];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function lerp(t, a, b) {
  return a + t * (b - a);
}

function perlin3(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  const A = PERLIN_PERM[X] + Y;
  const AA = PERLIN_PERM[A] + Z;
  const AB = PERLIN_PERM[A + 1] + Z;
  const B = PERLIN_PERM[X + 1] + Y;
  const BA = PERLIN_PERM[B] + Z;
  const BB = PERLIN_PERM[B + 1] + Z;

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(PERLIN_PERM[AA], x, y, z), grad(PERLIN_PERM[BA], x - 1, y, z)),
      lerp(u, grad(PERLIN_PERM[AB], x, y - 1, z), grad(PERLIN_PERM[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(PERLIN_PERM[AA + 1], x, y, z - 1), grad(PERLIN_PERM[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(PERLIN_PERM[AB + 1], x, y - 1, z - 1), grad(PERLIN_PERM[BB + 1], x - 1, y - 1, z - 1))
    )
  );
}

function fractalNoise(x, y, z, octaves = 3, persistence = 0.5) {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let max = 0;

  for (let i = 0; i < octaves; i++) {
    total += perlin3(x * frequency, y * frequency, z * frequency) * amplitude;
    max += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / max;
}

const SceneCanvas = forwardRef(function SceneCanvas(
  { activeSection, isPaused = false, onEffectChange, isHomeScene = false, showControls = false },
  ref
) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const effectChangeRef = useRef(onEffectChange);
  useEffect(() => {
    effectChangeRef.current = onEffectChange;
  }, [onEffectChange]);
  const initialSectionRef = useRef(null);
  const isHomeSceneRef = useRef(isHomeScene);
  const showControlsRef = useRef(showControls);

  useEffect(() => {
    isHomeSceneRef.current = isHomeScene;
  }, [isHomeScene]);

  useEffect(() => {
    showControlsRef.current = showControls;
    const state = stateRef.current;
    state?.setControlsVisible?.(showControls);
  }, [showControls]);

  if (initialSectionRef.current === null) {
    initialSectionRef.current = activeSection || 'about';
  }

  useEffect(() => {
    const initialSection = initialSectionRef.current || 'about';
    let cleanupFn = () => {};
    let isCancelled = false;

    async function bootstrap() {
      console.log('[SceneCanvas] 🚀 bootstrap() called at', performance.now().toFixed(2), 'ms');
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
      let readinessFrame = null;
      let paused = false;
      let gui = null;
      const guiControllers = new Map();
      let isGuiAdjusting = false;
      let guiBuildPromise = null;

      const DESKTOP_PROFILE = {
        orbitRadius: 1180,
        orbitZScale: 0.72,
        baseZ: 1350,
        baseY: 340,
        pointerX: 240,
        pointerY: 190,
        pointerZ: -90,
        initialY: 380,
        initialZ: 1500
      };

      const MOBILE_PROFILE = {
        orbitRadius: 1770,
        orbitZScale: 0.72,
        baseZ: 2040,
        baseY: 360,
        pointerX: 200,
        pointerY: 150,
        pointerZ: -140,
        initialY: 460,
        initialZ: 2250
      };

      const viewportQuery = window.matchMedia('(max-width: 640px)');
      let cameraProfile = viewportQuery.matches ? MOBILE_PROFILE : DESKTOP_PROFILE;

      const syncCameraProfile = (instant = false) => {
        cameraProfile = viewportQuery.matches ? MOBILE_PROFILE : DESKTOP_PROFILE;
        if (instant && camera) {
          camera.position.set(0, cameraProfile.initialY, cameraProfile.initialZ);
        }
      };

      const handleViewportChange = () => {
        syncCameraProfile(true);
      };

      const detachViewportListener = (() => {
        if (typeof viewportQuery.addEventListener === 'function') {
          viewportQuery.addEventListener('change', handleViewportChange);
          return () => viewportQuery.removeEventListener('change', handleViewportChange);
        }
        if (typeof viewportQuery.addListener === 'function') {
          viewportQuery.addListener(handleViewportChange);
          return () => viewportQuery.removeListener(handleViewportChange);
        }
        return () => {};
      })();

      const clock = new THREE.Clock();
      let elapsedTime = 0;
      let animationTime = 0;
      let autoAngle = 0;

      const pointer = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        smoothedX: 0,
        smoothedY: 0,
        worldX: 0,
        worldZ: 0,
        targetWorldX: 0,
        targetWorldZ: 0,
        smoothedWorldX: 0,
        smoothedWorldZ: 0,
        velocityX: 0,
        velocityY: 0,
        flowStrength: 0,
        flowAngle: 0,
        lastUpdate: 0,
        energy: 0,
        lastRippleTime: 0,
        // Enhanced smoothing parameters
        dampingFactor: 0.08,  // Reduced from implicit 0.2 for smoother movement
        velocityDamping: 0.85  // Slower velocity decay for fluid motion
      };
      const ripples = [];
      const clickBursts = [];  // Array to store click burst effects
      const shimmerWaves = [];  // Array for beautiful shimmer effects
      const effectRef = { type: null, startTime: 0, data: null, fadingOut: false, fadeStartTime: 0 };
      
      // Create an instant "burst" effect at click location with smooth animation
      const createClickBurst = (x, z) => {
        clickBursts.push({
          x,
          z,
          start: elapsedTime,
          intensity: 1.0,
          radius: 0,
          phase: Math.random() * Math.PI * 2  // Random phase for variation
        });
        
        // Clean up old bursts
        while (clickBursts.length > 5) {
          clickBursts.shift();
        }
      };
      
      // Create beautiful shimmer effects that follow ripples
      const createShimmerWave = (x, z, delay = 0) => {
        shimmerWaves.push({
          x,
          z,
          start: elapsedTime + delay,
          intensity: 1.0,
          radius: 0,
          frequency: 2 + Math.random() * 3,  // Varying frequencies for organic feel
          phase: Math.random() * Math.PI * 2
        });
        
        // Clean up old shimmer waves
        while (shimmerWaves.length > 15) {
          shimmerWaves.shift();
        }
      };

      // Beautiful easing function for ultra-smooth ripples
      const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
      const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
      const easeInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      
      // Create a 4x slower version of the ripple effect for right-clicks
      const enqueueRippleSlowMotion = (x, z, strength = 1) => {
        // Create more shimmer waves for luxurious effect - optimized for 32s lifetime (4x slower)
        for (let i = 0; i < 5; i++) {
          createShimmerWave(x, z, i * 0.8);  // Slower timing for 32s window
        }
        
        // Ultra-ultra-slow, beautiful multi-layer ripple system - 4x slower than normal click
        
        // 1. Initial glow - soft, expanding luminescence
        const glowRipple = { 
          x, 
          z, 
          start: elapsedTime, 
          strength: strength * 1.6,
          type: 'glow_initial',
          speedMultiplier: 0.01,  // 4x slower than 0.04
          widthMultiplier: 4.0,
          color: 1.8,
          decayMultiplier: 0.02,  // 4x slower decay
          easing: 'easeInOutSine',
          frequency: 0.02,  // 4x slower frequency
          isSlowMotion: true,  // Mark as slow-motion for special handling
          maxAge: 32  // 4x longer lifetime
        };
        ripples.push(glowRipple);
        
        // 2. Primary wave - the main beautiful ripple
        ripples.push({ 
          x, 
          z, 
          start: elapsedTime + 0.4,  // 4x slower succession
          strength: strength * 1.3,
          type: 'primary',
          speedMultiplier: 0.00875,  // 4x slower than 0.035
          widthMultiplier: 3.5,
          color: 1.5,
          decayMultiplier: 0.025,  // 4x slower decay
          easing: 'easeOutQuint',
          frequency: 0.025,  // 4x slower frequency
          isSlowMotion: true,
          maxAge: 32
        });
        
        // 3. Harmonic resonance - creates beautiful interference
        ripples.push({ 
          x, 
          z, 
          start: elapsedTime + 1.2,  // 4x slower timing
          strength: strength * 1.0,
          type: 'harmonic',
          speedMultiplier: 0.01,  // 4x slower
          widthMultiplier: 5.0,
          color: 1.2,
          frequency: 0.0175,  // 4x slower frequency
          decayMultiplier: 0.03,  // 4x slower decay
          easing: 'easeOutQuart',
          phase: Math.PI * 0.25,
          isSlowMotion: true,
          maxAge: 32
        });
        
        // 4. Secondary silk wave - smooth follow-up
        ripples.push({ 
          x, 
          z, 
          start: elapsedTime + 2.4,  // 4x slower timing
          strength: strength * 0.8,
          type: 'secondary',
          speedMultiplier: 0.0095,  // 4x slower
          widthMultiplier: 6.0,
          color: 1.0,
          decayMultiplier: 0.0375,  // 4x slower decay
          easing: 'easeInOutQuart',
          frequency: 0.0225,  // 4x slower frequency
          isSlowMotion: true,
          maxAge: 32
        });
        
        // 5. Ambient glow - wide, persistent outer beauty
        ripples.push({ 
          x, 
          z, 
          start: elapsedTime + 4.0,  // 4x slower timing
          strength: strength * 0.5,
          type: 'ambient',
          speedMultiplier: 0.00625,  // 4x slower
          widthMultiplier: 8.0,
          color: 0.7,
          decayMultiplier: 0.045,  // 4x slower decay
          easing: 'easeInOutSine',
          frequency: 0.015,  // 4x slower frequency
          isSlowMotion: true,
          maxAge: 32
        });
        
        // 6. Luxury echo waves - fewer, much slower echoes
        for (let i = 0; i < 3; i++) {
          const delay = 6.0 + (i * 3.2);  // 4x slower timing
          const echoStrength = strength * (0.3 - i * 0.08);
          
          ripples.push({ 
            x, 
            z, 
            start: elapsedTime + delay, 
            strength: echoStrength,
            type: 'echo',
            speedMultiplier: 0.0075 - (i * 0.00125),  // 4x slower
            widthMultiplier: 7.0 + (i * 1.5),
            color: 0.6 - (i * 0.1),
            decayMultiplier: 0.05,  // 4x slower decay
            easing: 'easeInOutSine',
            frequency: 0.0125 - (i * 0.002),  // 4x slower frequencies
            phase: Math.PI * i * 0.5,
            isSlowMotion: true,
            maxAge: 32
          });
        }
        
        // 7. Final resonance - subtle ending within 32 seconds
        ripples.push({ 
          x, 
          z, 
          start: elapsedTime + 14.0,  // 4x slower timing
          strength: strength * 0.25,
          type: 'deep_resonance',
          speedMultiplier: 0.00375,  // 4x slower
          widthMultiplier: 15.0,
          color: 0.4,
          decayMultiplier: 0.0625,  // 4x slower decay
          easing: 'easeInOutSine',
          frequency: 0.0075,  // 4x slower frequency
          isSlowMotion: true,
          maxAge: 32
        });
        
        // Keep ripple count reasonable but allow more for complex effects
        while (ripples.length > MAX_RIPPLES) {
          ripples.shift();
        }
      };
      
      const enqueueRipple = (x, z, strength = 1, isClick = false) => {
        // GPU-based ripple system
        // We push a single event, and the shader calculates the complex wave interactions
        ripples.push({
          x,
          z,
          start: elapsedTime,
          strength: strength * (isClick ? 2.0 : 1.0), // Boost click strength
          type: isClick ? 1 : 0, // 1 for sharp click, 0 for soft ambient
          maxAge: 8.0 // Longer lifetime for fluid ripples
        });

        // Keep ripple count within shader limits
        while (ripples.length > MAX_RIPPLES) {
          ripples.shift();
        }
      };

      const uniforms = {
        opacity: { value: 0.85 },
        pointMultiplier: { value: 28 },
        uTime: { value: 0 },
        uRipplePos: { value: new Float32Array(MAX_RIPPLES * 2) }, // x, z pair
        uRippleParams: { value: new Float32Array(MAX_RIPPLES * 3) } // startTime, strength, type
      };

      const settings = { ...FIELD_DEFAULT_BASE };
      const targetSettings = { ...FIELD_DEFAULT_BASE };
      const transitionSpeed = 0.05; // Smooth transition speed
      let influences = { ...DEFAULT_INFLUENCES };

      const effectDefinitions = createEffectDefinitions({
        applyMenuValue,
        settings,
        targetSettings
      });

      try {
        console.log('[SceneCanvas] 📡 Fetching field-settings at', performance.now().toFixed(2), 'ms');
        const response = await fetch('/api/field-settings', { cache: 'no-store' });
        console.log('[SceneCanvas] 📥 Field-settings response at', performance.now().toFixed(2), 'ms');
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

      function applyMenuValue(key, value, immediate = false) {
        if (immediate) {
          settings[key] = value;
          targetSettings[key] = value;
        } else {
          targetSettings[key] = value;
        }
        
        if (key === 'opacity') {
          uniforms.opacity.value = settings.opacity;
        }
        if (key === 'pointSize') {
          uniforms.pointMultiplier.value = settings.pointSize;
        }
        if (key === 'fogDensity' && scene?.fog) {
          scene.fog.density = settings.fogDensity;
        }
        if (key === 'showStats' && stats?.dom) {
          stats.dom.style.display = value ? 'block' : 'none';
        }
        if (!isGuiAdjusting) {
          const controller = guiControllers.get(key);
          controller?.updateDisplay?.();
        }
        return true;
      }

      function bindGuiControl(key, controller, immediate = false) {
        if (!controller) return;
        guiControllers.set(key, controller);
        if (typeof controller.listen === 'function') {
          controller.listen();
        }
        controller.onChange((nextValue) => {
          isGuiAdjusting = true;
          applyMenuValue(key, nextValue, immediate);
          isGuiAdjusting = false;
        });
      }

      const setGuiVisibility = (visible) => {
        if (!gui) return;
        gui.domElement.style.display = visible ? 'block' : 'none';
        gui.domElement.style.pointerEvents = visible ? 'auto' : 'none';
      };

      const destroyGui = () => {
        if (!gui) return;
        if (gui.domElement?.parentNode) {
          gui.domElement.parentNode.removeChild(gui.domElement);
        }
        gui.destroy();
        gui = null;
        guiControllers.clear();
        guiBuildPromise = null;
      };

      const buildGui = async () => {
        if (gui || guiBuildPromise) {
          if (gui) {
            setGuiVisibility(true);
            return gui;
          }
          await guiBuildPromise;
          return gui;
        }

        guiBuildPromise = import('lil-gui')
          .then(({ default: GUI }) => {
            const instance = new GUI({ title: 'Field Controls', autoPlace: false });
            instance.domElement.classList.add('field-controls');
            instance.domElement.style.pointerEvents = 'auto';
            document.body.appendChild(instance.domElement);

            const waveFolder = instance.addFolder('Waves');
            bindGuiControl('amplitude', waveFolder.add(settings, 'amplitude', 30, 140, 1), true);
            bindGuiControl(
              'waveXFrequency',
              waveFolder.add(settings, 'waveXFrequency', 0.05, 0.45, 0.005).name('Frequency X'),
              true
            );
            bindGuiControl(
              'waveYFrequency',
              waveFolder.add(settings, 'waveYFrequency', 0.05, 0.45, 0.005).name('Frequency Y'),
              true
            );
            bindGuiControl('swirlStrength', waveFolder.add(settings, 'swirlStrength', 0, 3, 0.01), true);
            bindGuiControl(
              'swirlFrequency',
              waveFolder.add(settings, 'swirlFrequency', 0.001, 0.02, 0.0005).name('Swirl Scale'),
              true
            );
            bindGuiControl(
              'animationSpeed',
              waveFolder.add(settings, 'animationSpeed', 0.05, 1.2, 0.01).name('Flow Speed'),
              true
            );
            waveFolder.open();

            const toneFolder = instance.addFolder('Tone & Glow');
            bindGuiControl(
              'opacity',
              toneFolder.add(settings, 'opacity', 0.3, 1, 0.01).name('Glow'),
              true
            );
            bindGuiControl(
              'pointSize',
              toneFolder.add(settings, 'pointSize', 6, 32, 0.5).name('Point Scale'),
              true
            );
            bindGuiControl('brightness', toneFolder.add(settings, 'brightness', 0.1, 0.6, 0.01), true);
            bindGuiControl('contrast', toneFolder.add(settings, 'contrast', 0.6, 2.5, 0.05), true);
            bindGuiControl(
              'fogDensity',
              toneFolder.add(settings, 'fogDensity', 0.0002, 0.003, 0.0001).name('Fog'),
              true
            );
            toneFolder.open();

            const interactionFolder = instance.addFolder('Interaction');
            bindGuiControl(
              'mouseInfluence',
              interactionFolder
                .add(settings, 'mouseInfluence', 0.001, 0.02, 0.0005)
                .name('Pointer Warp'),
              true
            );
            bindGuiControl(
              'rippleStrength',
              interactionFolder.add(settings, 'rippleStrength', 10, 120, 1).name('Ripple Strength'),
              true
            );
            bindGuiControl(
              'rippleSpeed',
              interactionFolder.add(settings, 'rippleSpeed', 120, 520, 5).name('Ripple Speed'),
              true
            );
            bindGuiControl(
              'rippleWidth',
              interactionFolder.add(settings, 'rippleWidth', 8, 40, 0.1).name('Ripple Width'),
              true
            );
            bindGuiControl(
              'rippleDecay',
              interactionFolder.add(settings, 'rippleDecay', 0.0005, 0.01, 0.0001).name('Ripple Fade'),
              true
            );
            bindGuiControl('autoRotate', interactionFolder.add(settings, 'autoRotate'), true);
            bindGuiControl('showStats', interactionFolder.add(settings, 'showStats').name('Show Stats'), true);
            interactionFolder.open();

            const ranges = {
              amplitude: { min: 30, max: 140 },
              waveXFrequency: { min: 0.05, max: 0.45 },
              waveYFrequency: { min: 0.05, max: 0.45 },
              swirlStrength: { min: 0, max: 3 },
              swirlFrequency: { min: 0.001, max: 0.02 },
              animationSpeed: { min: 0.05, max: 1.2 },
              opacity: { min: 0.3, max: 1 },
              pointSize: { min: 6, max: 32 },
              brightness: { min: 0.1, max: 0.6 },
              contrast: { min: 0.6, max: 2.5 },
              fogDensity: { min: 0.0002, max: 0.003 },
              mouseInfluence: { min: 0.001, max: 0.02 },
              rippleStrength: { min: 10, max: 120 },
              rippleSpeed: { min: 120, max: 520 },
              rippleWidth: { min: 8, max: 40 },
              rippleDecay: { min: 0.0005, max: 0.01 },
              autoRotate: { boolean: true },
              showStats: { boolean: true }
            };

            const actions = {
              randomize: () => {
                for (const [key, config] of Object.entries(ranges)) {
                  const controller = guiControllers.get(key);
                  if (!controller) continue;
                  let nextValue;
                  if (config.boolean) {
                    nextValue = Math.random() > 0.5;
                  } else {
                    nextValue = config.min + Math.random() * (config.max - config.min);
                  }
                  controller.setValue(nextValue);
                }
              },
              reset: () => {
                stateRef.current?.resetToDefaults?.();
              }
            };

            instance.add(actions, 'randomize').name('Randomize');
            instance.add(actions, 'reset').name('Reset Defaults');

            gui = instance;
            setGuiVisibility(true);
            return instance;
          })
          .finally(() => {
            guiBuildPromise = null;
          });

        await guiBuildPromise;
        return gui;
      };

      const updateGuiVisibility = (visible) => {
        if (visible) {
          void buildGui();
        } else {
          setGuiVisibility(false);
        }
      };

      function createEffectDefinitions({ applyMenuValue: setValue, settings: currentSettings, targetSettings: currentTarget }) {
        const totalPoints = AMOUNTX * AMOUNTY;

        const resetSettings = (immediate = false) => {
          for (const [param, defaultValue] of Object.entries(FIELD_DEFAULT_BASE)) {
            setValue(param, defaultValue, immediate);
            currentTarget[param] = defaultValue;
          }
        };

        const wrapIndex = (value, max) => {
          let v = value;
          if (v < 0) {
            v = max + (v % max);
          }
          if (v >= max) {
            v %= max;
          }
          return v;
        };

        const toIndex = (x, y) => x * AMOUNTY + y;

        const smoothStep = (t) => {
          const clamped = THREE.MathUtils.clamp(t, 0, 1);
          return clamped * clamped * (3 - 2 * clamped);
        };

        const computeEffectEase = (time, duration = null, easeIn = 2.5, easeOut = 2.5) => {
          const easedIn = easeIn > 0 ? smoothStep(THREE.MathUtils.clamp(time / easeIn, 0, 1)) : 1;
          if (!duration || easeOut <= 0) {
            return easedIn;
          }
          const timeRemaining = duration - time;
          const normalized = THREE.MathUtils.clamp(timeRemaining / easeOut, 0, 1);
          const easedOut = smoothStep(normalized);
          return easedIn * easedOut;
        };

        const createReactionDiffusion = () => {
          const u = new Float32Array(totalPoints);
          const v = new Float32Array(totalPoints);
          const uNext = new Float32Array(totalPoints);
          const vNext = new Float32Array(totalPoints);
          u.fill(1);
          v.fill(0);

          for (let i = 0; i < 24; i++) {
            const cx = Math.floor(Math.random() * AMOUNTX);
            const cy = Math.floor(Math.random() * AMOUNTY);
            const radius = 2 + Math.floor(Math.random() * 5);
            for (let dx = -radius; dx <= radius; dx++) {
              for (let dy = -radius; dy <= radius; dy++) {
                const x = wrapIndex(cx + dx, AMOUNTX);
                const y = wrapIndex(cy + dy, AMOUNTY);
                const di = toIndex(x, y);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                  const influence = 1 - dist / (radius + 1);
                  v[di] = Math.min(1, v[di] + influence * 0.8);
                  u[di] = Math.max(0, u[di] - influence * 0.6);
                }
              }
            }
          }

          return { u, v, uNext, vNext };
        };

        const createPendulums = () => {
          const systems = [];
          for (let i = 0; i < 3; i++) {
            systems.push({
              theta1: Math.random() * Math.PI - Math.PI / 2,
              theta2: Math.random() * Math.PI - Math.PI / 2,
              omega1: 0,
              omega2: 0,
              l1: 1,
              l2: 1 + Math.random() * 0.25,
              mass1: 1,
              mass2: 1
            });
          }
          return systems;
        };

        const createStarfieldData = () => {
          const depth = new Float32Array(totalPoints);
          const twinkle = new Float32Array(totalPoints);
          const intensity = new Float32Array(totalPoints);
          for (let i = 0; i < totalPoints; i++) {
            depth[i] = (Math.random() * 2 - 1) * 420;
            twinkle[i] = Math.random() * Math.PI * 2;
            intensity[i] = 0.35 + Math.random() * 0.65;
          }
          return {
            depth,
            twinkle,
            intensity,
            mode: 'in',
            exitStart: null,
            fadeOut: 1
          };
        };

        return {
          jitter: {
            duration: 3,  // Shorter duration for jitter effect
            init: () => ({ 
              time: 0,
              intensity: 0,  // For easing in/out
              rippleQueue: [],  // Queue of ripples to spawn
              lastRippleTime: 0,
              easeInDuration: 0.5,  // 0.5 seconds to ease in
              easeOutDuration: 0.5,  // 0.5 seconds to ease out
              easeOutStartTime: null
            }),
            start: ({ data }) => {
              // Configure settings for jittery behavior
              setValue('animationSpeed', 2.5);  // Fast animation
              setValue('amplitude', 120);  // Higher amplitude for jittery motion
              setValue('swirlStrength', 3.5);  // Strong swirl
              setValue('waveXFrequency', 0.015);  // Higher frequency waves
              setValue('waveYFrequency', 0.018);
              setValue('brightness', 0.75);  // Brighter dots
              setValue('contrast', 1.8);  // Higher contrast
              setValue('mouseInfluence', 0.003);  // More responsive
              setValue('rippleStrength', 25);  // Stronger ripples
              setValue('rippleSpeed', 180);  // Faster ripple propagation
              setValue('rippleDecay', 0.006);
              
              // Create initial ripple cascade plan
              // Main drop
              data.rippleQueue.push({ time: 0, x: 0, z: 0, strength: 3 });
              
              // First bounce - smaller ripples in a circle
              const angleStep = (Math.PI * 2) / 6;
              for (let i = 0; i < 6; i++) {
                const angle = i * angleStep;
                const x = Math.cos(angle) * 800;
                const z = Math.sin(angle) * 800;
                data.rippleQueue.push({ time: 0.3, x, z, strength: 1.5 });
              }
              
              // Second wave - more chaotic
              for (let i = 0; i < 12; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 400 + Math.random() * 800;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                data.rippleQueue.push({ time: 0.6, x, z, strength: 0.5 + Math.random() * 0.5 });
              }
            },
            update: ({ effectTime, data, addRipple }) => {
              data.time = effectTime;
              
              // Calculate easing intensity
              if (data.easeOutStartTime !== null) {
                // We're in the ease-out phase
                const easeOutProgress = (effectTime - data.easeOutStartTime) / data.easeOutDuration;
                data.intensity = Math.max(0, 1 - smoothStep(easeOutProgress));
              } else if (effectTime < data.easeInDuration) {
                // Ease in phase
                const easeInProgress = effectTime / data.easeInDuration;
                data.intensity = smoothStep(easeInProgress);
              } else if (effectTime > (3 - data.easeOutDuration)) {  // 3 seconds is jitter duration
                // Start ease out before effect ends
                if (data.easeOutStartTime === null) {
                  data.easeOutStartTime = effectTime;
                }
                const easeOutProgress = (effectTime - data.easeOutStartTime) / data.easeOutDuration;
                data.intensity = Math.max(0, 1 - smoothStep(easeOutProgress));
              } else {
                // Full intensity
                data.intensity = 1;
              }
              
              const envelope = computeEffectEase(effectTime, 3, data.easeInDuration, data.easeOutDuration);
              const effectiveIntensity = data.intensity * envelope;
              data.effectiveIntensity = effectiveIntensity;

              // Process ripple queue
              while (data.rippleQueue.length > 0 && data.rippleQueue[0].time <= effectTime) {
                const ripple = data.rippleQueue.shift();
                addRipple(ripple.x, ripple.z, ripple.strength * effectiveIntensity);
              }
              
              // Add random jitter ripples during main phase
              if (effectiveIntensity > 0.5 && Math.random() < 0.15) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 1200;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                addRipple(x, z, (0.3 + Math.random() * 0.7) * effectiveIntensity);
              }
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              const intensity = data.effectiveIntensity ?? 0;
              if (intensity <= 0) return { height: 0, scale: 0, light: 0 };
              
              // Jittery motion with easing
              const jitterX = Math.sin(px * 0.008 + effectTime * 8) * Math.cos(pz * 0.007 - effectTime * 6);
              const jitterZ = Math.cos(px * 0.009 - effectTime * 7) * Math.sin(pz * 0.006 + effectTime * 9);
              const jitter = (jitterX + jitterZ) * 0.5;
              
              // Random flickering
              const flicker = Math.sin(effectTime * 25 + px * 0.1 + pz * 0.1) > 0.7 ? 1 : 0.3;
              
              // Apply easing to all effects
              const height = jitter * currentSettings.amplitude * 0.3 * intensity;
              const scale = Math.abs(jitter) * 1.5 * flicker * intensity;
              const light = Math.max(0, jitter) * 0.5 * flicker * intensity;
              
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          zenMode: {
            duration: 15,  // Standardized to 15 seconds
            init: () => ({ 
              time: 0,
              breathPhase: 0
            }),
            start: () => {
              // Create a very calm, flat sea of dots
              setValue('animationSpeed', 0.15);  // Very slow animation
              setValue('amplitude', 8);  // Minimal wave height
              setValue('swirlStrength', 0.1);  // Barely any swirl
              setValue('waveXFrequency', 0.002);  // Very low frequency waves
              setValue('waveYFrequency', 0.002);
              setValue('brightness', 0.45);  // Subtle brightness
              setValue('contrast', 1.2);  // Low contrast for uniformity
              setValue('mouseInfluence', 0.0005);  // Minimal mouse response
              setValue('rippleStrength', 15);  // Gentle ripples
              setValue('rippleSpeed', 120);  // Slow ripple propagation
              setValue('rippleDecay', 0.004);  // Ripples fade quickly
            },
            update: ({ delta, data }) => {
              // Gentle breathing animation
              data.time += delta;
              data.breathPhase = Math.sin(data.time * 0.3) * 0.5 + 0.5;
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              // Very subtle, slow undulation like a calm sea
              const dist = Math.sqrt(px * px + pz * pz);
              const breathing = Math.sin(effectTime * 0.4 + dist * 0.0002) * data.breathPhase;
              const gentleWave = Math.sin(px * 0.001 + effectTime * 0.3) * 
                                Math.cos(pz * 0.001 - effectTime * 0.2) * 0.5;
              const envelope = computeEffectEase(effectTime, 15, 2.2, 3.5);
              
              const height = (breathing * 0.3 + gentleWave * 0.2) * currentSettings.amplitude * envelope;
              const scale = (0.8 + breathing * 0.1) * envelope;  // Subtle scale variation
              const light = (0.3 + breathing * 0.05) * envelope;  // Very subtle brightness variation
              
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          spiralFlow: {
            duration: 15,
            init: () => ({}),
            start: () => {
              setValue('animationSpeed', 1.1);
              setValue('swirlStrength', 2.2);
            },
            perPoint: ({ radial, theta, effectTime }) => {
              const decay = Math.exp(-radial / 1800);
              const spiral = Math.sin(theta * GOLDEN_RATIO * 1.85 + effectTime * 1.4 - Math.log(radial + 1) * 0.3);
              const radialPulse = Math.cos(effectTime * 0.8 + Math.sqrt(radial) * 0.015);
              const envelope = computeEffectEase(effectTime, 15, 2, 3.5);
              const height = (spiral * 0.55 + radialPulse * 0.2) * currentSettings.amplitude * decay * envelope;
              const scale = Math.abs(spiral) * 1.1 * decay * envelope;
              const light = (Math.max(0, spiral) * 0.4 * decay + radialPulse * 0.1 * decay) * envelope;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          riverFlow: {  // "Quake" effect - seismic waves through the field
            duration: 15,
            init: () => ({ 
              riverPhase: 0,
              waveOffset: Math.random() * Math.PI * 2 
            }),
            start: () => {
              setValue('animationSpeed', 1.2);  // Increased from 0.7 for more obvious flow
              setValue('swirlStrength', 0.8);   // Increased from 0.4 for more movement
              setValue('amplitude', 85);        // Higher amplitude for more dramatic waves
              setValue('brightness', 0.65);     // Slightly brighter
            },
            update: ({ delta, data }) => {
              // Add continuous phase for flowing animation
              data.riverPhase += delta * 0.8;
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              // Create seismic wave patterns that flow through the field
              const baseFreq = 0.001;  // Increased frequency for more detail
              
              // Main river channel - diagonal flow from top-left to bottom-right
              const riverX = (px + pz) * 0.7071;  // 45-degree rotation
              const riverZ = (-px + pz) * 0.7071;
              
              // Create flowing waves along the river direction
              const flowSpeed = 380;  // Speed of flow
              const primaryFlow = Math.sin(riverX * baseFreq * 2 - effectTime * 2.5 + data.riverPhase * 2) * 
                                 Math.cos(riverZ * baseFreq * 0.5) * 
                                 Math.exp(-Math.abs(riverZ) * 0.0008);  // Concentrate near center
              
              // Add secondary currents and eddies
              const noise = fractalNoise(
                px * baseFreq + effectTime * flowSpeed * 0.5, 
                pz * baseFreq - effectTime * flowSpeed * 0.3, 
                effectTime * 0.15 + data.waveOffset, 
                5,  // More octaves for detail
                0.65
              );
              
              // Flowing ripples that move downstream
              const ripples = Math.sin((riverX - effectTime * flowSpeed) * baseFreq * 3) * 0.3 +
                             Math.sin((riverX - effectTime * flowSpeed * 1.3) * baseFreq * 5) * 0.2;
              
              // Combine all elements with stronger emphasis on flow
              const combined = primaryFlow * 1.2 + noise * 0.5 + ripples * 0.4;
              
              const envelope = computeEffectEase(effectTime, 15, 1.5, 3);
              
              const height = combined * currentSettings.amplitude * envelope;
              const scale = Math.abs(combined) * 2.2 * envelope;  // Increased from 1.6
              const brightness = (0.5 + 0.4 * Math.abs(combined) + 0.2 * Math.abs(primaryFlow)) * envelope;
              
              return { height, scale, light: brightness };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          mandelbrotZoom: {
            duration: 15,
            init: () => ({ c: { x: -0.70176, y: -0.3842 } }),
            update: ({ effectTime, data }) => {
              data.c.x = -0.70176 + Math.cos(effectTime * 0.22) * 0.12;
              data.c.y = -0.3842 + Math.sin(effectTime * 0.19) * 0.09;
              const brightness = 0.5 + 0.2 * Math.sin(effectTime * 0.34);
              setValue('brightness', brightness);
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              const scale = 1.6 - 0.5 * Math.sin(effectTime * 0.12);
              let x = (px / HALF_GRID_X) * scale;
              let y = (pz / HALF_GRID_Y) * scale;
              const maxIter = 32;
              let iteration = 0;
              let magSq = 0;
              while (iteration < maxIter && magSq <= 4) {
                const xTemp = x * x - y * y + data.c.x;
                y = 2 * x * y + data.c.y;
                x = xTemp;
                magSq = x * x + y * y;
                iteration++;
              }
              let ratio = iteration / maxIter;
              if (iteration < maxIter && magSq > 0) {
                ratio = iteration + 1 - Math.log(Math.log(Math.sqrt(magSq))) / Math.log(2);
                ratio /= maxIter;
              }
              ratio = THREE.MathUtils.clamp(ratio, 0, 1);
              const fade = computeEffectEase(effectTime, 15, 2.4, 3);
              const height = (1 - ratio) * currentSettings.amplitude * 0.95 * fade;
              const scaleValue = Math.max(0, 0.6 - ratio) * 1.6 * fade;
              const light = Math.pow(1 - ratio, 2) * 0.85 * fade;
              return { height, scale: scaleValue, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          reactionDiffusionBloom: {
            duration: 15,
            init: () => createReactionDiffusion(),
            update: ({ delta, effectTime, data }) => {
              const Du = 0.16;
              const Dv = 0.08;
              const u = data.u;
              const v = data.v;
              const uNext = data.uNext;
              const vNext = data.vNext;
              const rate = 1 + delta * 32;  // Increased from 28 for faster reaction
              const feed = 0.038 + 0.008 * Math.sin(effectTime * 0.33);  // Increased variation
              const kill = 0.062 + 0.004 * Math.cos(effectTime * 0.27);  // More dynamic

              for (let x = 0; x < AMOUNTX; x++) {
                const xl = wrapIndex(x - 1, AMOUNTX);
                const xr = wrapIndex(x + 1, AMOUNTX);
                for (let y = 0; y < AMOUNTY; y++) {
                  const yu = wrapIndex(y + 1, AMOUNTY);
                  const yd = wrapIndex(y - 1, AMOUNTY);
                  const idx = toIndex(x, y);
                  const lapU =
                    u[toIndex(xl, y)] * 0.2 +
                    u[toIndex(xr, y)] * 0.2 +
                    u[toIndex(x, yu)] * 0.2 +
                    u[toIndex(x, yd)] * 0.2 +
                    u[toIndex(xl, yu)] * 0.05 +
                    u[toIndex(xr, yu)] * 0.05 +
                    u[toIndex(xl, yd)] * 0.05 +
                    u[toIndex(xr, yd)] * 0.05 -
                    u[idx];
                  const lapV =
                    v[toIndex(xl, y)] * 0.2 +
                    v[toIndex(xr, y)] * 0.2 +
                    v[toIndex(x, yu)] * 0.2 +
                    v[toIndex(x, yd)] * 0.2 +
                    v[toIndex(xl, yu)] * 0.05 +
                    v[toIndex(xr, yu)] * 0.05 +
                    v[toIndex(xl, yd)] * 0.05 +
                    v[toIndex(xr, yd)] * 0.05 -
                    v[idx];
                  const uvv = u[idx] * v[idx] * v[idx];
                  let nextU = u[idx] + (Du * lapU - uvv + feed * (1 - u[idx])) * rate;
                  let nextV = v[idx] + (Dv * lapV + uvv - (kill + feed) * v[idx]) * rate;
                  if (!Number.isFinite(nextU)) nextU = 0;
                  if (!Number.isFinite(nextV)) nextV = 0;
                  uNext[idx] = THREE.MathUtils.clamp(nextU, 0, 1);
                  vNext[idx] = THREE.MathUtils.clamp(nextV, 0, 1);
                }
              }

              data.u = uNext;
              data.uNext = u;
              data.v = vNext;
              data.vNext = v;

              setValue('contrast', 3.2);  // Increased for more dramatic effect
              setValue('brightness', 0.55);  // Slightly brighter for visibility
              setValue('amplitude', 95);  // Higher amplitude for more dramatic bloom
            },
            perPoint: ({ index, data, effectTime }) => {
              const u = data.u[index];
              const v = data.v[index];
              const pattern = (u - v) * 1.5;  // Amplify pattern difference
              const bloom = Math.pow(Math.max(0, v - u * 0.5), 1.2);  // Exaggerate bloom areas
              const fade = computeEffectEase(effectTime, 15, 2.6, 3.2);  // Smooth ease in/out
              
              // Much more exaggerated height variations
              const height = pattern * currentSettings.amplitude * 1.8 * fade;
              
              // Dramatically larger scale for bloom areas
              const scale = (Math.max(0, pattern) * 3.5 + bloom * 4.5) * fade;  // Much larger scales
              
              // Brighter, more vibrant bloom lighting
              const light = Math.min(1.2, bloom * 1.5 + Math.max(0, v - u * 0.4) * 0.9) * fade;
              
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          harmonicPendulum: {
            duration: 15,
            init: () => ({ systems: createPendulums() }),
            update: ({ delta, data }) => {
              const g = 9.81;
              for (const system of data.systems) {
                const { theta1, theta2, omega1, omega2, l1, l2, mass1: m1, mass2: m2 } = system;
                const sin12 = Math.sin(theta1 - theta2);
                const cos12 = Math.cos(theta1 - theta2);
                const denom = 2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2);
                const domega1 = (
                  -g * (2 * m1 + m2) * Math.sin(theta1) -
                  m2 * g * Math.sin(theta1 - 2 * theta2) -
                  2 * sin12 * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * cos12)
                ) / (l1 * denom);
                const domega2 = (
                  2 * sin12 * (
                    omega1 * omega1 * l1 * (m1 + m2) +
                    g * (m1 + m2) * Math.cos(theta1) +
                    omega2 * omega2 * l2 * m2 * cos12
                  )
                ) / (l2 * denom);
                system.omega1 += domega1 * delta * 0.9;
                system.omega2 += domega2 * delta * 0.9;
                system.theta1 += system.omega1 * delta * 0.9;
                system.theta2 += system.omega2 * delta * 0.9;
              }
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              let sum = 0;
              for (const system of data.systems) {
                const scale = 340;
                const x1 = Math.sin(system.theta1) * scale * 0.6;
                const y1 = -Math.cos(system.theta1) * scale * 0.6;
                const x2 = x1 + Math.sin(system.theta2) * scale;
                const y2 = y1 - Math.cos(system.theta2) * scale;
                const dx = px - x2;
                const dz = pz - y2;
                const dist = Math.sqrt(dx * dx + dz * dz) + 12;
                sum += Math.cos(dist * 0.016) / dist * 480;
              }
              const fade = computeEffectEase(effectTime, 15, 2.4, 3);
              const amplified = sum * 1.5;
              const height = amplified * fade;
              const scale = Math.min(2.5, Math.abs(amplified) * 2.2) * fade;
              const light = Math.min(0.95, Math.abs(amplified) * 0.42) * fade;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          starfield: {
            duration: 15,
            init: () => createStarfieldData(),
            start: ({ data }) => {
              if (data) {
                data.mode = 'in';
                data.exitStart = null;
                data.fadeOut = 1;
              }
              setValue('animationSpeed', 0.42);
              setValue('swirlStrength', 0.2);
              setValue('amplitude', 18);
              setValue('contrast', 2.9);
              setValue('brightness', 0.62);
              setValue('mouseInfluence', 0.0018);
            },
            update: ({ elapsedTime, data }) => {
              if (!data) return;
              if (data.mode === 'out') {
                if (data.exitStart === null) {
                  data.exitStart = elapsedTime;
                }
                const progress = Math.max(0, elapsedTime - (data.exitStart ?? elapsedTime));
                const normalized = progress / 3.5;
                const eased = 1 - smoothStep(normalized);
                data.fadeOut = THREE.MathUtils.clamp(eased, 0, 1);
                if (data.fadeOut <= 0.001) {
                  data.fadeOut = 0;
                  data.mode = 'done';
                }
              } else {
                data.fadeOut = 1;
              }
            },
            perPoint: ({ index, baseHeight, effectTime, data }) => {
              const fadeIn = smoothStep(effectTime / 3.5);
              const easedIn = 1 - Math.pow(1 - fadeIn, 3);
              const envelope = computeEffectEase(effectTime, 15, 3.5, 3.5);
              const stateFade = data?.mode === 'out' ? data.fadeOut ?? 0 : data?.mode === 'done' ? 0 : easedIn;
              const fade = envelope * stateFade;
              const starDepth = data.depth[index] ?? 0;
              const twinklePhase = data.twinkle[index] ?? 0;
              const intensity = data.intensity[index] ?? 0.5;
              const twinkle = Math.sin(effectTime * 1.6 + twinklePhase) * 0.35 * fade;
              const starLift = (starDepth + 60) * fade;
              const cancelWaves = -baseHeight * fade;
              const height = cancelWaves + starLift;
              const scale = THREE.MathUtils.clamp(fade * (1.15 + intensity * 1.5), 0.1, 3.2);
              const lightRaw = fade * (0.58 + intensity * 0.85) + twinkle;
              const light = THREE.MathUtils.clamp(lightRaw, -0.1, 1.2);
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          }
        };
      }

      function clearEffect(force = false, skipCallback = false) {
        if (!effectRef.type) {
          return true;
        }

        if (!force && effectRef.type === 'starfield') {
          const data = effectRef.data;
          if (data && data.mode !== 'out' && data.mode !== 'done') {
            data.mode = 'out';
            data.exitStart = elapsedTime;
            data.fadeOut = 1;
            return false;
          }
        }

        const current = effectDefinitions[effectRef.type];
        current?.cleanup?.();
        effectRef.type = null;
        effectRef.data = null;
        effectRef.startTime = elapsedTime;
        effectRef.fadingOut = false;
        
        // Notify that effect ended (unless callback already called)
        if (!skipCallback) {
          effectChangeRef.current?.(false, null);
        }
        
        return true;
      }

      function onWindowResize() {
        if (!renderer || !camera) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // Keep DPR in sync with device settings
        if (renderer?.setPixelRatio) {
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          renderer.setPixelRatio(pixelRatio);
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
        syncCameraProfile(false);
      }

      function onPointerMove(event) {
        if (!event.isPrimary) return;
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

        const prevTargetX = pointer.targetX;
        const prevTargetY = pointer.targetY;
        const deltaX = normalizedX - pointer.x;
        const deltaY = normalizedY - pointer.y;
        const now = event.timeStamp || performance.now();
        const dt = pointer.lastUpdate ? Math.min((now - pointer.lastUpdate) / 1000, 0.25) : 0.016;
        const invDt = dt > 0.0001 ? 1 / dt : 60;
        const velocityX = (normalizedX - prevTargetX) * invDt;
        const velocityY = (normalizedY - prevTargetY) * invDt;

        // Much smoother velocity interpolation
        pointer.velocityX = THREE.MathUtils.lerp(pointer.velocityX, velocityX, 0.1);
        pointer.velocityY = THREE.MathUtils.lerp(pointer.velocityY, velocityY, 0.1);
        pointer.targetX = normalizedX;
        pointer.targetY = normalizedY;
        pointer.targetWorldX = normalizedX * HALF_GRID_X;
        pointer.targetWorldZ = normalizedY * HALF_GRID_Y;
        pointer.lastUpdate = now;

        // Smoother energy accumulation
        const moveEnergy = Math.abs(deltaX) + Math.abs(deltaY);
        const velocityEnergy = Math.hypot(pointer.velocityX, pointer.velocityY) * 0.001;
        const targetEnergy = Math.min(pointer.energy + moveEnergy * 0.15 + velocityEnergy, 1.0);
        pointer.energy = THREE.MathUtils.lerp(pointer.energy, targetEnergy, 0.3);
      }

      function onContextMenu(event) {
        // Handle right-click with 4x slower ripple effect
        event.preventDefault(); // Prevent the context menu from appearing

        // Calculate normalized coordinates
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

        let rippleX, rippleZ;
        
        // Use raycasting for accurate world position calculation with perspective camera
        if (camera && renderer) {
          // Create a raycaster to project the click into 3D space
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2(normalizedX, -normalizedY); // Three.js uses inverted Y
          
          // Set up the ray from camera through mouse position
          raycaster.setFromCamera(mouse, camera);
          
          // The particle grid sits at Y = 0 (base plane)
          const planeY = 0;
          
          // Calculate intersection with Y=0 plane
          const rayDirection = raycaster.ray.direction;
          const rayOrigin = raycaster.ray.origin;
          
          // Solve for t where: rayOrigin.y + t * rayDirection.y = planeY
          const t = (planeY - rayOrigin.y) / rayDirection.y;
          
          // Calculate the actual intersection point
          if (t > 0) {  // Ensure we're looking forward, not backward
            rippleX = rayOrigin.x + t * rayDirection.x;
            rippleZ = rayOrigin.z + t * rayDirection.z;
          } else {
            // Fallback to orthographic if ray doesn't intersect properly
            rippleX = normalizedX * HALF_GRID_X;
            rippleZ = normalizedY * HALF_GRID_Y;
          }
        } else {
          // Fallback to orthographic calculation if camera not available
          rippleX = normalizedX * HALF_GRID_X;
          rippleZ = normalizedY * HALF_GRID_Y;
        }
        
        // Update pointer position immediately for accurate ripple placement
        pointer.targetX = normalizedX;
        pointer.targetY = normalizedY;
        pointer.targetWorldX = rippleX;
        pointer.targetWorldZ = rippleZ;

        const now = performance.now();
        if (now - pointer.lastRippleTime < CLICK_DEBOUNCE_MS) {
          return;
        }
        pointer.lastRippleTime = now;

        // Create beautiful click ripple with 4x slower speed
        enqueueRippleSlowMotion(rippleX, rippleZ, 1.0); // Custom function for ultra-slow ripples
        
        // Add instant "burst" effect at click point for immediate feedback
        createClickBurst(rippleX, rippleZ);

        // More noticeable energy boost on click
        const targetEnergy = Math.min(pointer.energy + 0.4, 1.2);
        pointer.energy = THREE.MathUtils.lerp(pointer.energy, targetEnergy, 0.7);
      }

      function onPointerDown(event) {
        if (!event.isPrimary) return;

        // Calculate normalized coordinates (same as onPointerMove)
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

        let rippleX, rippleZ;
        
        // Use raycasting for accurate world position calculation with perspective camera
        if (camera && renderer) {
          // Create a raycaster to project the click into 3D space
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2(normalizedX, -normalizedY); // Three.js uses inverted Y
          
          // Set up the ray from camera through mouse position
          raycaster.setFromCamera(mouse, camera);
          
          // The particle grid sits at Y = 0 (base plane)
          const planeY = 0;
          
          // Calculate intersection with Y=0 plane
          const rayDirection = raycaster.ray.direction;
          const rayOrigin = raycaster.ray.origin;
          
          // Solve for t where: rayOrigin.y + t * rayDirection.y = planeY
          const t = (planeY - rayOrigin.y) / rayDirection.y;
          
          // Calculate the actual intersection point
          if (t > 0) {  // Ensure we're looking forward, not backward
            rippleX = rayOrigin.x + t * rayDirection.x;
            rippleZ = rayOrigin.z + t * rayDirection.z;
          } else {
            // Fallback to orthographic if ray doesn't intersect properly
            rippleX = normalizedX * HALF_GRID_X;
            rippleZ = normalizedY * HALF_GRID_Y;
          }
        } else {
          // Fallback to orthographic calculation if camera not available
          rippleX = normalizedX * HALF_GRID_X;
          rippleZ = normalizedY * HALF_GRID_Y;
        }
        
        // Update pointer position immediately for accurate ripple placement
        pointer.targetX = normalizedX;
        pointer.targetY = normalizedY;
        pointer.targetWorldX = rippleX;
        pointer.targetWorldZ = rippleZ;

        const now = performance.now();
        if (now - pointer.lastRippleTime < CLICK_DEBOUNCE_MS) {
          return;
        }
        pointer.lastRippleTime = now;

        // Create beautiful click ripple with enhanced drama
        enqueueRipple(rippleX, rippleZ, 1.0, true);  // true = isClick for multi-layer ripple
        
        // Add instant "burst" effect at click point for immediate feedback
        createClickBurst(rippleX, rippleZ);

        // More noticeable energy boost on click
        const targetEnergy = Math.min(pointer.energy + 0.4, 1.2);
        pointer.energy = THREE.MathUtils.lerp(pointer.energy, targetEnergy, 0.7);
      }

      function onPointerLeave() {
        pointer.targetX = 0;
        pointer.targetY = 0;
        pointer.targetWorldX = 0;
        pointer.targetWorldZ = 0;
        // Smoother velocity decay on pointer leave
        pointer.velocityX *= 0.6;
        pointer.velocityY *= 0.6;
      }

      function activateEffect(type, combine = false) {
        const definition = effectDefinitions[type];
        if (!definition) {
          console.warn(`[SceneCanvas] Unknown effect "${type}" requested`);
          return false;
        }

        // Allow combining certain effects (don't clear existing ones)
        const combinableEffects = ['swirlPulse'];
        const shouldCombine = combine || combinableEffects.includes(type);
        
        // If not combining and another effect is running, clear it
        if (!shouldCombine && effectRef.type) {
          clearEffect(true);
        }

        // Sync target settings with current settings before starting new effect
        for (const key of Object.keys(targetSettings)) {
          targetSettings[key] = settings[key];
        }

        // Initialize new effect state
        effectRef.type = type;
        effectRef.data = null;
        effectRef.startTime = elapsedTime;
        effectRef.fadingOut = false;
        effectRef.fadeStartTime = 0;
        
        // Initialize effect-specific data
        const initContext = {
          pointer,
          settings,
          targetSettings,
          addRipple: enqueueRipple,
          random: Math.random
        };
        const initResult = definition.init?.(initContext);
        effectRef.data = initResult ?? {};
        
        // Call effect's start function to configure settings
        definition.start?.({
          data: effectRef.data,
          pointer,
          settings,
          targetSettings,
          addRipple: enqueueRipple
        });
        
        // Notify UI that effect started (menu becomes transparent)
        effectChangeRef.current?.(true, type);
        
        return true;
      }

      function render() {
        if (!renderer || !camera || !scene || !particles) return;

        const delta = clock.getDelta();
        elapsedTime += delta;
        
        // Smoothly interpolate settings towards target values
        for (const key in targetSettings) {
          if (settings[key] !== targetSettings[key]) {
            settings[key] += (targetSettings[key] - settings[key]) * transitionSpeed;
            
            // Update uniforms if needed
            if (key === 'opacity') {
              uniforms.opacity.value = settings.opacity;
            }
            if (key === 'pointSize') {
              uniforms.pointMultiplier.value = settings.pointSize;
            }
          }
        }
        
        animationTime += delta * settings.animationSpeed;
        
        // Update uniforms
        uniforms.uTime.value = elapsedTime;

        // Pack ripples into flat arrays for the shader
        // We use a fixed size array to avoid reallocation
        const ripplePos = uniforms.uRipplePos.value;
        const rippleParams = uniforms.uRippleParams.value;
        
        // Reset arrays (optional but safer)
        ripplePos.fill(0);
        rippleParams.fill(0);

        let activeCount = 0;
        for (let r = ripples.length - 1; r >= 0; r--) {
          const ripple = ripples[r];
          const age = elapsedTime - ripple.start;
          
          if (age > ripple.maxAge) {
            ripples.splice(r, 1);
            continue;
          }
          
          if (activeCount < MAX_RIPPLES) {
            ripplePos[activeCount * 2] = ripple.x;
            ripplePos[activeCount * 2 + 1] = ripple.z;
            
            rippleParams[activeCount * 3] = ripple.start;
            rippleParams[activeCount * 3 + 1] = ripple.strength;
            rippleParams[activeCount * 3 + 2] = ripple.type;
            
            activeCount++;
          }
        }

        if (settings.autoRotate) {
          autoAngle += delta * 0.1;
        }

        // Much smoother pointer interpolation for less jitter
        const smoothingFactor = pointer.dampingFactor;
        pointer.smoothedX += (pointer.targetX - pointer.smoothedX) * smoothingFactor;
        pointer.smoothedY += (pointer.targetY - pointer.smoothedY) * smoothingFactor;
        pointer.smoothedWorldX += (pointer.targetWorldX - pointer.smoothedWorldX) * smoothingFactor;
        pointer.smoothedWorldZ += (pointer.targetWorldZ - pointer.smoothedWorldZ) * smoothingFactor;

        pointer.x = pointer.smoothedX;
        pointer.y = pointer.smoothedY;
        pointer.worldX = pointer.smoothedWorldX;
        pointer.worldZ = pointer.smoothedWorldZ;

        // Smoother flow dynamics
        const velocityMagnitude = Math.min(Math.hypot(pointer.velocityX, pointer.velocityY), 40);  // Reduced max
        pointer.flowStrength = THREE.MathUtils.lerp(pointer.flowStrength, velocityMagnitude * 0.03, 0.08);  // Smoother lerp
        if (velocityMagnitude > 0.001) {
          const targetAngle = Math.atan2(pointer.velocityY, pointer.velocityX);
          // Smooth angle transition to prevent sudden direction changes
          const angleDiff = targetAngle - pointer.flowAngle;
          const smoothedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          pointer.flowAngle += smoothedAngleDiff * 0.15;
        } else {
          pointer.flowStrength *= 0.96;  // Slower decay
        }
        pointer.flowStrength = Math.max(pointer.flowStrength, 0);
        
        // Smoother velocity damping
        const velocityDecay = pointer.velocityDamping;
        pointer.velocityX *= velocityDecay;
        pointer.velocityY *= velocityDecay;

        // Gentler energy decay
        pointer.energy = Math.max(pointer.energy * 0.97 - 0.0008, 0);

        const scales = particles.geometry.attributes.scale.array;
        const colors = particles.geometry.attributes.color.array;

        let activeEffect = null;
        let effectTime = 0;

        if (effectRef.type) {
          const activeType = effectRef.type;
          const candidate = effectDefinitions[activeType];
          if (candidate) {
            effectTime = elapsedTime - effectRef.startTime;
            // Check if effect duration has been exceeded
            if (candidate.duration && effectTime > candidate.duration && !effectRef.fadingOut) {
              // Begin graceful fadeout process
              effectRef.fadingOut = true;
              effectRef.fadeStartTime = elapsedTime;
              
              // Notify UI immediately to start CSS transition (menu background fade)
              effectChangeRef.current?.(false, null);
              
              // Wait for fade duration (2.5s) before completely clearing the effect
              // This allows both CSS transitions and particle fade to complete smoothly
              setTimeout(() => {
                clearEffect(true, true); // skipCallback = true since callback already called
              }, 2500);
            }
            
            // Continue updating and rendering the effect (even during fadeout)
            // This ensures particles don't snap back to default state
            if (!effectRef.fadingOut || (effectRef.fadingOut && effectRef.type === activeType)) {
              // Call effect's update function to maintain state
              candidate.update?.({
                delta,
                effectTime,
                elapsedTime,
                data: effectRef.data,
                pointer,
                addRipple: (x, z, strength = 1) => enqueueRipple(x, z, strength)
              });
              
              // Handle starfield's special exit mode
              if (activeType === 'starfield' && effectRef.data?.mode === 'done') {
                clearEffect(true);
              }
              
              // Set activeEffect so perPoint function will be called
              if (effectRef.type === activeType || effectRef.fadingOut) {
                activeEffect = candidate;
              }
            }
          } else {
            clearEffect(true);
          }
        }

        const amplitude = settings.amplitude;
        
        // Optimize: Only run the heavy loop if we have active effects or need base motion
        // The shader handles the ripples now, so we just compute base wave + pointer + effects
        
        let i = 0;
        let j = 0;
        
        // If no special effects are active, we can simplify the loop heavily
        // We mostly just need to update colors/scales for the "breathing" or pointer effects
        // The position.y is reset to 0 unless effects modify it
        
        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            const px = ix * SEPARATION - HALF_GRID_X;
            const pz = iy * SEPARATION - HALF_GRID_Y;
            const index = ix * AMOUNTY + iy;
            
            let height = 0;
            
            // Only calculate complex base waves if amplitude is significant
            // Otherwise let the shader do the heavy lifting for ripples
            if (settings.amplitude > 1.0) {
              height += Math.sin(ix * settings.waveXFrequency + animationTime) * settings.amplitude;
              height += Math.cos(iy * settings.waveYFrequency - animationTime * 1.25) * settings.amplitude * 0.6;
              
              const radial = Math.sqrt(px * px + pz * pz);
              height += Math.sin(radial * settings.swirlFrequency - animationTime * 1.6) * settings.swirlStrength * settings.amplitude * 0.4;
              
              // Pointer interaction (CPU side - could also be moved to shader but kept here for flexibility)
              const dxMouse = px - pointer.worldX;
              const dzMouse = pz - pointer.worldZ;
              const mouseDist = Math.sqrt(dxMouse * dxMouse + dzMouse * dzMouse) + 0.0001;
              
              if (settings.mouseInfluence > 0.0001) {
                const mouseEnvelope = Math.exp(-mouseDist * settings.mouseInfluence * 0.4);
                const mouseWave = Math.cos(mouseDist * settings.mouseInfluence * 10 - animationTime * 1.8);
                height += mouseWave * pointer.energy * settings.amplitude * 0.2 * mouseEnvelope;
              }
              
              if (isHomeSceneRef.current) {
                const theta = Math.atan2(pz, px);
                const pointerReach = Math.exp(-mouseDist * 0.00055);
                const pointerEnergyLift = pointerReach * (0.18 + pointer.energy * 0.38);
                const glidePhase = mouseDist * 0.006 - elapsedTime * (1.6 + pointer.flowStrength * 0.22);
                const baseGlide = Math.sin(glidePhase);
                height += baseGlide * settings.amplitude * 0.2 * pointerEnergyLift;
                
                const flowStrength = pointer.flowStrength;
                if (flowStrength > 0.001) {
                  const directional = Math.cos(theta - pointer.flowAngle) * pointerReach;
                  const flowWave = Math.sin(glidePhase * 0.6 + radial * 0.0008);
                  const flowLift = (directional * 0.4 + flowWave * 0.25) * settings.amplitude * flowStrength * 0.28 * pointerReach;
                  height += flowLift;
                }
              }
            }

            // Handle Active Effects (Starfield, Mandelbrot, etc.)
            let scaleDelta = 0;
            let lightDelta = 0;

            if (activeEffect?.perPoint) {
              // Calculate fade factor if effect is fading out
              let fadeFactor = 1.0;
              if (effectRef.fadingOut && effectRef.fadeStartTime > 0) {
                const fadeProgress = (elapsedTime - effectRef.fadeStartTime) / 2.5;
                fadeFactor = Math.max(0, 1.0 - fadeProgress);
                fadeFactor = fadeFactor * fadeFactor;
              }
              
              const radial = Math.sqrt(px * px + pz * pz);
              const theta = Math.atan2(pz, px);
              
              const result = activeEffect.perPoint({
                ix,
                iy,
                index,
                px,
                pz,
                radial,
                theta,
                effectTime,
                elapsedTime,
                baseHeight: height,
                data: effectRef.data,
                settings,
                pointer
              });
              
              if (result) {
                if (typeof result.height === 'number') height += result.height * fadeFactor;
                if (typeof result.scale === 'number') scaleDelta += result.scale * fadeFactor;
                if (typeof result.light === 'number') lightDelta += result.light * fadeFactor;
              }
            }

            // NOTE: We do NOT calculate ripples here anymore!
            // Ripples are handled entirely in the Vertex Shader.

            // Update attributes
            // We still update position because base waves and effects run here
            // The shader will ADD the ripple displacement to this value
            particles.geometry.attributes.position.array[i + 1] = height;

            // Calculate color/scale based on height + effects
            const heightNormalized = THREE.MathUtils.clamp(0.5 + height * 0.0015, 0, 1);
            const baseScale = 0.6 + heightNormalized * 2.1;
            scales[j] = THREE.MathUtils.clamp(baseScale + scaleDelta, 0.08, 6);

            const baseGray = THREE.MathUtils.clamp(settings.brightness + heightNormalized * settings.contrast * 0.65, 0, 1);
            const grayscale = THREE.MathUtils.clamp(baseGray + lightDelta, 0, 1);
            
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

        const profile = cameraProfile;
        const orbitRadius = profile.orbitRadius;
        const baseX = Math.cos(autoAngle) * orbitRadius;
        const baseZ = Math.sin(autoAngle) * orbitRadius * profile.orbitZScale + profile.baseZ;
        const targetX = baseX + pointer.x * profile.pointerX;
        const targetY = profile.baseY + pointer.y * profile.pointerY;
        const targetZ = baseZ + pointer.y * profile.pointerZ;

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
        console.log('[SceneCanvas] 🎬 init() started at', performance.now().toFixed(2), 'ms');
        camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.set(0, cameraProfile.initialY, cameraProfile.initialZ);

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
            uniform float uTime;
            uniform vec2 uRipplePos[30];
            uniform vec3 uRippleParams[30]; // start, strength, type

            // Optimized Physics Constants - Tuned for organic fluidity
            const float WAVE_SPEED = 280.0; // Slower for more weight
            const float DECAY = 1.8;

            void main() {
              vec3 basePos = position;
              float heightOffset = 0.0;
              float lightOffset = 0.0;
              
              // Accumulate ripple effects
              for(int i = 0; i < 30; i++) {
                float startTime = uRippleParams[i].x;
                if(startTime == 0.0) continue;
                
                float age = uTime - startTime;
                if(age < 0.0 || age > 8.0) continue; // Longer lifetime for smooth fade
                
                float strength = uRippleParams[i].y;
                float type = uRippleParams[i].z;
                
                // Distance from ripple center
                float d = distance(basePos.xz, uRipplePos[i]);
                
                // 1. Main Wave Packet (Sinc-like function)
                float wavePos = age * WAVE_SPEED;
                float distDiff = d - wavePos;
                float width = 220.0 + age * 60.0; // Wider, spreading wave
                
                if(abs(distDiff) < width) {
                   // Normalized position (-1 to 1)
                   float t = distDiff / width;
                   
                   // Smooth, rolling sine wave instead of sharp packet
                   // The 'cos' creates the peaks/troughs, exp smooths the edges
                   float wave = cos(t * 3.14159 * 2.5) * exp(-t * t * 3.5);
                   
                   // Organic decay: starts strong, fades smoothly but lingers
                   float fade = exp(-age * 0.6) * exp(-d * 0.0003);
                   
                   // Apply height
                   heightOffset += wave * strength * 55.0 * fade;
                   
                   // Add "glint" only to the peaks
                   lightOffset += max(0.0, wave) * strength * 0.5 * fade;
                }
                
                // 2. Impact Crater (The "Splash")
                if(age < 2.0 && d < 400.0) {
                    float tRebound = age * 1.8; 
                    // Damped spring motion at the center
                    float centerMotion = -120.0 * exp(-tRebound * 1.5) * cos(tRebound * 4.0);
                    
                    // Soft falloff from center
                    float centerMask = exp(-d * d * 0.00004);
                    
                    heightOffset += centerMotion * strength * centerMask;
                }
              }
              
              basePos.y += heightOffset;
              vec4 mvPosition = modelViewMatrix * vec4(basePos, 1.0);
              
              // Modify size based on depth and activity
              float sizeMod = 1.0 + lightOffset * 0.8;
              gl_PointSize = scale * sizeMod * pointMultiplier * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              // Pass color to fragment
              // Brighten the peaks
              vec3 finalColor = color + vec3(lightOffset);
              vColor = finalColor;
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

        // Favor faster first paint: no AA, high-performance hint
        renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        // Boot at low DPR for instant first frame, bump after ready
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        console.log('[SceneCanvas] 🎨 Appending renderer.domElement at', performance.now().toFixed(2), 'ms');
        container.appendChild(renderer.domElement);
        console.log('[SceneCanvas] ✅ renderer.domElement appended at', performance.now().toFixed(2), 'ms');

        // Only load Stats lazily if explicitly enabled later
        // This avoids pulling the module and creating DOM on initial load

        container.style.touchAction = 'none';
        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointerleave', onPointerLeave);
        container.addEventListener('contextmenu', onContextMenu);

        window.addEventListener('resize', onWindowResize);
      }

      init();
      animate();

      console.log('[SceneCanvas] 🔄 Removing is-ready class at', performance.now().toFixed(2), 'ms');
      container.classList.remove('is-ready');

      const markReady = () => {
        console.log('[SceneCanvas] 🎯 Adding is-ready class at', performance.now().toFixed(2), 'ms');
        // Raise renderer pixel ratio once visible for crispness
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        if (renderer?.setPixelRatio) {
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
        container.classList.add('is-ready');
        console.log('[SceneCanvas] ✨ is-ready class added at', performance.now().toFixed(2), 'ms');
        readinessFrame = null;
      };

      const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (reduceMotionQuery.matches) {
        markReady();
      } else {
        readinessFrame = requestAnimationFrame(markReady);
      }

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
        },
        setControlsVisible: (visible) => {
          updateGuiVisibility(visible);
        },
        addRipple: (x, z, strength = 1) => {
          enqueueRipple(x, z, strength);
        },
        applySettings: (newSettings, immediate = false) => {
          Object.entries(newSettings).forEach(([key, value]) => {
            applyMenuValue(key, value, immediate);
          });
        },
        resetToDefaults: () => {
          clearEffect();
          Object.entries(FIELD_DEFAULT_BASE).forEach(([key, value]) => {
            applyMenuValue(key, value, false);
          });
        },
        triggerEffect: (type, combine = false) => {
          return activateEffect(type, combine);
        }
      };

      updateGuiVisibility(showControlsRef.current);
      stateRef.current.applyMenuInfluence(initialSection);

      return () => {
        cancelAnimationFrame(animationFrame);
        if (readinessFrame !== null) {
          cancelAnimationFrame(readinessFrame);
        }
        container.classList.remove('is-ready');
        window.removeEventListener('resize', onWindowResize);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointerleave', onPointerLeave);
        container.removeEventListener('contextmenu', onContextMenu);
        detachViewportListener();
        destroyGui();

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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addRipple: (x, z, strength = 1) => {
      const state = stateRef.current;
      if (!state?.addRipple) return;
      state.addRipple(x, z, strength);
    },
    applySettings: (settings, immediate = false) => {
      const state = stateRef.current;
      if (!state?.applySettings) return;
      state.applySettings(settings, immediate);
    },
    resetToDefaults: () => {
      const state = stateRef.current;
      if (!state?.resetToDefaults) return;
      state.resetToDefaults();
    },
    triggerEffect: (type, combine = false) => {
      const state = stateRef.current;
      if (!state?.triggerEffect) return false;
      return state.triggerEffect(type, combine);
    },
    setControlsVisible: (visible) => {
      const state = stateRef.current;
      state?.setControlsVisible?.(visible);
    }
  }));

  return <div ref={containerRef} className="scene-container" />;
});

export default SceneCanvas;
