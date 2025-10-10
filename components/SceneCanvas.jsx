'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { FIELD_DEFAULT_BASE, FIELD_DEFAULT_INFLUENCES } from '../lib/fieldDefaults';

const SEPARATION = 90;
const AMOUNTX = 70;
const AMOUNTY = 70;
const HALF_GRID_X = ((AMOUNTX - 1) * SEPARATION) / 2;
const HALF_GRID_Y = ((AMOUNTY - 1) * SEPARATION) / 2;

const DEFAULT_INFLUENCES = FIELD_DEFAULT_INFLUENCES;

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

const SceneCanvas = forwardRef(function SceneCanvas({ activeSection, isPaused = false }, ref) {
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

      const clock = new THREE.Clock();
      let elapsedTime = 0;
      let animationTime = 0;
      let autoAngle = 0;

      const pointer = { x: 0, y: 0, worldX: 0, worldZ: 0, energy: 0 };
      const ripples = [];
      const effectRef = { type: null, startTime: 0, data: null };

      const enqueueRipple = (x, z, strength = 1) => {
        ripples.push({ x, z, start: elapsedTime, strength });
        if (ripples.length > 20) {
          ripples.shift();
        }
      };

      const uniforms = {
        opacity: { value: 0.85 },
        pointMultiplier: { value: 28 }
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
        return true;
      }

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

        const makeVoronoiSeeds = (count) => {
          const seeds = [];
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.7;
            seeds.push({
              x: Math.cos(angle) * HALF_GRID_X * radius,
              z: Math.sin(angle) * HALF_GRID_Y * radius,
              vx: (Math.random() * 2 - 1) * 120,
              vz: (Math.random() * 2 - 1) * 120,
              phase: Math.random() * Math.PI * 2
            });
          }
          return seeds;
        };

        const createLorenzPoints = (count) => {
          const points = [];
          for (let i = 0; i < count; i++) {
            points.push({
              x: 1 + Math.random(),
              y: Math.random() * 2 - 1,
              z: 20 + Math.random() * 5
            });
          }
          return points;
        };

        const createWaveSources = (count) => {
          const sources = [];
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const distance = 600 + Math.random() * 700;
            sources.push({
              x: Math.cos(angle) * distance,
              z: Math.sin(angle) * distance,
              amplitude: 0.8 + Math.random() * 0.4,
              k: 0.004 + Math.random() * 0.0015,
              omega: 1.4 + Math.random() * 0.6,
              phase: Math.random() * Math.PI * 2
            });
          }
          return sources;
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

        const createApollonianCircles = () => {
          const circles = [];

          const pushCircle = (x, z, r, curvature) => {
            circles.push({ x, z, r, curvature });
          };

          pushCircle(0, 0, Math.min(HALF_GRID_X, HALF_GRID_Y) * 0.92, -1 / (Math.min(HALF_GRID_X, HALF_GRID_Y) * 0.92));
          const innerRadius = Math.min(HALF_GRID_X, HALF_GRID_Y) * 0.42;
          for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3;
            const dist = Math.min(HALF_GRID_X, HALF_GRID_Y) * 0.46;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            pushCircle(x, z, innerRadius, 1 / innerRadius);
          }

          const descartesRadius = (k1, k2, k3) => {
            const sum = k1 + k2 + k3;
            const prod = Math.sqrt(Math.abs(k1 * k2 + k2 * k3 + k3 * k1));
            const k4 = sum + 2 * prod;
            return k4 === 0 ? 0 : 1 / k4;
          };

          const spawnDescartes = (c1, c2, c3, depth) => {
            if (depth <= 0) return;
            const r4 = descartesRadius(c1.curvature, c2.curvature, c3.curvature);
            if (!Number.isFinite(r4) || r4 <= 6) return;
            const weight = Math.abs(c1.curvature) + Math.abs(c2.curvature) + Math.abs(c3.curvature);
            const x = (c1.x * Math.abs(c1.curvature) + c2.x * Math.abs(c2.curvature) + c3.x * Math.abs(c3.curvature)) / weight;
            const z = (c1.z * Math.abs(c1.curvature) + c2.z * Math.abs(c2.curvature) + c3.z * Math.abs(c3.curvature)) / weight;
            const jitter = r4 * 0.15;
            const cx = x + (Math.random() * 2 - 1) * jitter;
            const cz = z + (Math.random() * 2 - 1) * jitter;
            const curvature = 1 / r4;
            pushCircle(cx, cz, r4, curvature);
            spawnDescartes({ x: cx, z: cz, r: r4, curvature }, c1, c2, depth - 1);
            spawnDescartes({ x: cx, z: cz, r: r4, curvature }, c2, c3, depth - 1);
            spawnDescartes({ x: cx, z: cz, r: r4, curvature }, c1, c3, depth - 1);
          };

          for (let i = 1; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
              for (let k = j + 1; k < circles.length; k++) {
                spawnDescartes(circles[i], circles[j], circles[k], 2);
              }
            }
          }

          return circles;
        };

        return {
          goldenSpiralFlow: {
            duration: 18,
            init: () => ({}),
            start: () => {
              setValue('animationSpeed', 1.1);
              setValue('swirlStrength', 2.2);
            },
            perPoint: ({ radial, theta, effectTime }) => {
              const decay = Math.exp(-radial / 1800);
              const spiral = Math.sin(theta * GOLDEN_RATIO * 1.85 + effectTime * 1.4 - Math.log(radial + 1) * 0.3);
              const radialPulse = Math.cos(effectTime * 0.8 + Math.sqrt(radial) * 0.015);
              const height = (spiral * 0.55 + radialPulse * 0.2) * currentSettings.amplitude * decay;
              const scale = Math.abs(spiral) * 1.1 * decay;
              const light = Math.max(0, spiral) * 0.4 * decay + radialPulse * 0.1 * decay;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          lissajousDance: {
            duration: 20,
            init: () => ({}),
            start: () => {
              setValue('animationSpeed', 0.9);
              setValue('swirlStrength', 0.6);
            },
            perPoint: ({ ix, iy, effectTime }) => {
              const a = 3;
              const b = 4;
              const delta = effectTime * 1.6;
              const phase = ix * 0.07 + iy * 0.09;
              const value = Math.sin(a * delta + phase) * Math.cos(b * delta + phase * 0.75 + Math.PI / 4);
              const height = value * currentSettings.amplitude * 0.52;
              const scale = Math.abs(value) * 0.9;
              const light = value * 0.28;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          voronoiCrystallize: {
            duration: 22,
            init: () => ({ seeds: makeVoronoiSeeds(16) }),
            update: ({ delta, data, effectTime }) => {
              for (const seed of data.seeds) {
                seed.x += seed.vx * delta * 0.85;
                seed.z += seed.vz * delta * 0.85;
                if (seed.x < -HALF_GRID_X || seed.x > HALF_GRID_X) {
                  seed.vx *= -1;
                  seed.x = THREE.MathUtils.clamp(seed.x, -HALF_GRID_X, HALF_GRID_X);
                }
                if (seed.z < -HALF_GRID_Y || seed.z > HALF_GRID_Y) {
                  seed.vz *= -1;
                  seed.z = THREE.MathUtils.clamp(seed.z, -HALF_GRID_Y, HALF_GRID_Y);
                }
                seed.phase += delta * 1.3;
              }
              const drift = Math.sin(effectTime * 0.35) * 0.4 + 0.6;
              setValue('contrast', 2 + drift);
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              let nearest = Infinity;
              let second = Infinity;
              let cellPhase = 0;
              for (const seed of data.seeds) {
                const dx = px - seed.x;
                const dz = pz - seed.z;
                const distSq = dx * dx + dz * dz;
                if (distSq < nearest) {
                  second = nearest;
                  nearest = distSq;
                  cellPhase = seed.phase;
                } else if (distSq < second) {
                  second = distSq;
                }
              }
              const primary = Math.sqrt(nearest);
              const secondary = Math.sqrt(second);
              const border = secondary - primary;
              const envelope = Math.exp(-primary / 1400);
              const shimmer = 0.5 + 0.5 * Math.sin(effectTime * 2.1 + cellPhase * 3.7);
              const height = (1 - Math.min(primary / 1800, 1)) * currentSettings.amplitude * 0.9 * envelope * shimmer;
              const scale = Math.max(0, 1 - border / 900) * 1.4 * envelope;
              const light = Math.max(0, border / 240) * 0.6 + shimmer * 0.15;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          perlinRiver: {
            duration: 24,
            init: () => ({}),
            start: () => {
              setValue('animationSpeed', 0.7);
              setValue('swirlStrength', 0.4);
            },
            perPoint: ({ px, pz, effectTime }) => {
              const baseFreq = 0.00075;
              const noise = fractalNoise(px * baseFreq, pz * baseFreq, effectTime * 0.18, 4, 0.55);
              const flow = fractalNoise((px + effectTime * 260) * baseFreq * 0.7, (pz - effectTime * 210) * baseFreq * 0.7, effectTime * 0.1, 3, 0.6);
              const combined = noise * 0.65 + flow * 0.35;
              const height = combined * currentSettings.amplitude * 0.82;
              const scale = Math.abs(combined) * 1.6;
              const brightness = 0.35 * combined + 0.18 * Math.abs(noise);
              return { height, scale, light: brightness };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          waveInterferenceSymphony: {
            duration: 20,
            init: () => ({ sources: createWaveSources(5) }),
            update: ({ delta, data }) => {
              for (const source of data.sources) {
                const angle = Math.atan2(source.z, source.x) + delta * 0.18;
                const radius = Math.sqrt(source.x * source.x + source.z * source.z);
                source.x = Math.cos(angle) * radius;
                source.z = Math.sin(angle) * radius;
                source.phase += delta * 1.4;
              }
            },
            perPoint: ({ px, pz, effectTime, data }) => {
              let sum = 0;
              for (const source of data.sources) {
                const dx = px - source.x;
                const dz = pz - source.z;
                const dist = Math.sqrt(dx * dx + dz * dz) + 1;
                const contribution = source.amplitude * Math.sin(dist * source.k - effectTime * source.omega + source.phase) / (1 + dist * 0.0018);
                sum += contribution;
              }
              const height = sum * currentSettings.amplitude * 0.95;
              const scale = Math.abs(sum) * 1.5;
              const light = Math.abs(sum) * 0.45;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          lorenzButterfly: {
            duration: 26,
            init: () => ({ points: createLorenzPoints(24) }),
            update: ({ delta, data }) => {
              const sigma = 10;
              const rho = 28;
              const beta = 8 / 3;
              const dt = delta * 6;
              for (const point of data.points) {
                const dx = sigma * (point.y - point.x);
                const dy = point.x * (rho - point.z) - point.y;
                const dz = point.x * point.y - beta * point.z;
                point.x += dx * dt;
                point.y += dy * dt;
                point.z += dz * dt;
                if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
                  point.x = 1 + Math.random();
                  point.y = Math.random() * 2 - 1;
                  point.z = 20 + Math.random() * 5;
                }
              }
            },
            perPoint: ({ px, pz, data }) => {
              let sum = 0;
              for (const point of data.points) {
                const scale = 34;
                const dx = px - point.x * scale;
                const dz = pz - point.y * scale;
                const dist = Math.sqrt(dx * dx + dz * dz) + 8;
                sum += Math.sin(dist * 0.015 + point.z * 0.08) / dist;
              }
              const height = sum * currentSettings.amplitude * 24;
              const scale = Math.min(1.8, Math.abs(sum) * 2.2);
              const light = Math.tanh(Math.abs(sum) * 8) * 0.55;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          mandelbrotZoom: {
            duration: 24,
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
              const height = (1 - ratio) * currentSettings.amplitude * 0.95;
              const scaleValue = Math.max(0, 0.6 - ratio) * 1.6;
              const light = Math.pow(1 - ratio, 2) * 0.85;
              return { height, scale: scaleValue, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          reactionDiffusionBloom: {
            duration: 28,
            init: () => createReactionDiffusion(),
            update: ({ delta, effectTime, data }) => {
              const Du = 0.16;
              const Dv = 0.08;
              const u = data.u;
              const v = data.v;
              const uNext = data.uNext;
              const vNext = data.vNext;
              const rate = 1 + delta * 28;
              const feed = 0.036 + 0.004 * Math.sin(effectTime * 0.33);
              const kill = 0.064 + 0.002 * Math.cos(effectTime * 0.27);

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

              setValue('contrast', 2.6);
              setValue('brightness', 0.48);
            },
            perPoint: ({ index, data }) => {
              const u = data.u[index];
              const v = data.v[index];
              const pattern = u - v;
              const height = pattern * currentSettings.amplitude * 1.1;
              const scale = Math.max(0, pattern) * 1.8 + Math.max(0, v - u) * 1.1;
              const light = Math.max(0, v - u * 0.6) * 0.8;
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          harmonicPendulum: {
            duration: 25,
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
                system.omega1 += domega1 * delta * 1.8;
                system.omega2 += domega2 * delta * 1.8;
                system.theta1 += system.omega1 * delta * 1.8;
                system.theta2 += system.omega2 * delta * 1.8;
              }
            },
            perPoint: ({ px, pz, data }) => {
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
              const height = sum;
              const scale = Math.min(2.2, Math.abs(sum) * 1.9);
              const light = Math.min(0.85, Math.abs(sum) * 0.35);
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          },
          apollonianFractalPack: {
            duration: 24,
            init: () => ({ circles: createApollonianCircles() }),
            start: () => {
              setValue('contrast', 2.9);
              setValue('brightness', 0.52);
            },
            perPoint: ({ px, pz, data }) => {
              let accum = 0;
              for (const circle of data.circles) {
                const dx = px - circle.x;
                const dz = pz - circle.z;
                const radiusDist = Math.abs(Math.sqrt(dx * dx + dz * dz) - circle.r);
                const contribution = Math.exp(-radiusDist / (circle.r * 0.22 + 18));
                accum += contribution * Math.sign(circle.curvature);
              }
              const height = accum * currentSettings.amplitude * 0.75;
              const scale = Math.min(2, Math.abs(accum) * 1.8);
              const light = THREE.MathUtils.clamp(accum * 0.4, -0.3, 0.6);
              return { height, scale, light };
            },
            cleanup: () => {
              resetSettings();
            }
          }
        };
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

        enqueueRipple(rippleX, rippleZ, 1);

        pointer.energy = Math.min(pointer.energy + 0.5, 1.4);
      }

      function onPointerLeave() {
        pointer.x = 0;
        pointer.y = 0;
        pointer.worldX = 0;
        pointer.worldZ = 0;
      }

      function activateEffect(type) {
        const definition = effectDefinitions[type];
        if (!definition) {
          return false;
        }

        if (effectRef.type) {
          const current = effectDefinitions[effectRef.type];
          current?.cleanup?.();
        }

        for (const key of Object.keys(targetSettings)) {
          targetSettings[key] = settings[key];
        }

        effectRef.type = type;
        effectRef.data = null;
        effectRef.startTime = elapsedTime;
        const initContext = {
          pointer,
          settings,
          targetSettings,
          addRipple: enqueueRipple,
          random: Math.random
        };
        const initResult = definition.init?.(initContext);
        effectRef.data = initResult ?? {};
        definition.start?.({
          data: effectRef.data,
          pointer,
          settings,
          targetSettings,
          addRipple: enqueueRipple
        });
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

        if (settings.autoRotate) {
          autoAngle += delta * 0.1;
        }

        pointer.energy = Math.max(pointer.energy * 0.92 - 0.002, 0);

        const positions = particles.geometry.attributes.position.array;
        const scales = particles.geometry.attributes.scale.array;
        const colors = particles.geometry.attributes.color.array;

        let activeEffect = null;
        let effectTime = 0;

        if (effectRef.type) {
          const candidate = effectDefinitions[effectRef.type];
          if (candidate) {
            effectTime = elapsedTime - effectRef.startTime;
            if (candidate.duration && effectTime > candidate.duration) {
              candidate.cleanup?.();
              effectRef.type = null;
              effectRef.data = null;
            } else {
              candidate.update?.({
                delta,
                effectTime,
                elapsedTime,
                data: effectRef.data,
                pointer,
                addRipple: (x, z, strength = 1) => enqueueRipple(x, z, strength)
              });
              activeEffect = candidate;
            }
          } else {
            effectRef.type = null;
            effectRef.data = null;
          }
        }

        let i = 0;
        let j = 0;

        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            const px = ix * SEPARATION - HALF_GRID_X;
            const pz = iy * SEPARATION - HALF_GRID_Y;
            const radial = Math.sqrt(px * px + pz * pz);
            const theta = Math.atan2(pz, px);
            const index = ix * AMOUNTY + iy;

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
              if (age > 8) {
                ripples.splice(r, 1);
                continue;
              }
              const dist = Math.sqrt((px - ripple.x) * (px - ripple.x) + (pz - ripple.z) * (pz - ripple.z)) + 0.0001;
              const wavefront = age * settings.rippleSpeed;
              const envelope = Math.exp(-dist * settings.rippleDecay) * Math.exp(-age * 0.45);
              const rippleStrength = ripple.strength || 1;
              const wavePattern = Math.sin((dist - wavefront) / settings.rippleWidth) * 0.7 +
                Math.sin((dist - wavefront * 1.3) / (settings.rippleWidth * 0.7)) * 0.3;
              height += wavePattern * settings.rippleStrength * 0.65 * envelope * rippleStrength;
            }

            let scaleDelta = 0;
            let lightDelta = 0;

            if (activeEffect?.perPoint) {
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
                if (typeof result.height === 'number') {
                  height += result.height;
                }
                if (typeof result.scale === 'number') {
                  scaleDelta += result.scale;
                }
                if (typeof result.light === 'number') {
                  lightDelta += result.light;
                }
              }
            }

            positions[i + 1] = height;

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
        console.log('[SceneCanvas] 🎬 init() started at', performance.now().toFixed(2), 'ms');
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
        console.log('[SceneCanvas] 🎨 Appending renderer.domElement at', performance.now().toFixed(2), 'ms');
        container.appendChild(renderer.domElement);
        console.log('[SceneCanvas] ✅ renderer.domElement appended at', performance.now().toFixed(2), 'ms');

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

      console.log('[SceneCanvas] 🔄 Removing is-ready class at', performance.now().toFixed(2), 'ms');
      container.classList.remove('is-ready');

      const markReady = () => {
        console.log('[SceneCanvas] 🎯 Adding is-ready class at', performance.now().toFixed(2), 'ms');
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
        addRipple: (x, z, strength = 1) => {
          enqueueRipple(x, z, strength);
        },
        applySettings: (newSettings, immediate = false) => {
          Object.entries(newSettings).forEach(([key, value]) => {
            applyMenuValue(key, value, immediate);
          });
        },
        resetToDefaults: () => {
          Object.entries(FIELD_DEFAULT_BASE).forEach(([key, value]) => {
            applyMenuValue(key, value, false);
          });
        },
        triggerEffect: (type) => {
          activateEffect(type);
        }
      };

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
    triggerEffect: (type) => {
      const state = stateRef.current;
      if (!state?.triggerEffect) return;
      state.triggerEffect(type);
    }
  }));

  return <div ref={containerRef} className="scene-container" />;
});

export default SceneCanvas;
