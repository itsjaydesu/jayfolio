export const FIELD_DEFAULT_BASE = {
  amplitude: 50,  // Reduced for gentler waves
  waveXFrequency: 0.12,  // Lower frequency for smoother waves
  waveYFrequency: 0.16,  // Lower frequency for smoother waves  
  swirlStrength: 0.8,  // Reduced swirl for less chaos
  swirlFrequency: 0.004,  // Smoother swirl transitions
  animationSpeed: 0.28,  // Slower for more serene movement
  pointSize: 26,  // Slightly smaller for subtlety
  mouseInfluence: 0.0025,  // Gentler mouse response
  rippleStrength: 35,  // Softer ripples
  rippleSpeed: 250,  // Slower ripple propagation
  rippleWidth: 28,  // Wider for smoother falloff
  rippleDecay: 0.0015,  // Slower decay for gentler fade
  opacity: 0.75,  // Slightly less intense glow
  autoRotate: true,
  showStats: false,
  brightness: 0.45,  // Slightly dimmer for elegance
  contrast: 2.2,  // Less harsh contrast
  fogDensity: 0.0012  // Slightly less fog
};

export const FIELD_DEFAULT_INFLUENCES = {
  about: {
    mouseInfluence: 0.0025,  // Gentler
    animationSpeed: 0.28,  // Smoother
    brightness: 0.45
  },
  projects: {
    animationSpeed: 0.35,  // Less frantic
    swirlStrength: 1.2,  // Less aggressive
    pointSize: 24
  },
  content: {
    animationSpeed: 0.22,  // Calm
    rippleWidth: 32,  // Wider, smoother
    contrast: 1.9
  },
  sounds: {
    rippleStrength: 45,  // Gentler ripples
    rippleDecay: 0.001,  // Smoother decay
    mouseInfluence: 0.003  // Less reactive
  },
  art: {
    rippleStrength: 45,  // Matching sounds
    rippleDecay: 0.001,
    mouseInfluence: 0.003
  }
};
