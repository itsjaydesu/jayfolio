/**
 * Footer Background Settings Guide for Administrators
 * 
 * When configuring footer backgrounds in channel-content.json, use these settings:
 * 
 * footerFadeSettings: {
 *   bgScale: "cover" | "contain" | "auto"
 *     - "cover": Fills entire footer width, may crop image (recommended for full-bleed designs)
 *     - "contain": Shows entire image, may have black bars
 *     - "auto": Uses image's natural size
 * 
 *   bgPosition: "bottom" | "center" | "top" | number (0-100)
 *     - "bottom": Aligns image to bottom edge (default, best for horizon/ground images)
 *     - "center": Centers image vertically
 *     - "top": Aligns image to top edge (good for sky/ceiling images)
 *     - 0-100: Fine control (0 = bottom, 50 = center, 100 = top)
 * 
 *   topFadeHeight: number (0-100)
 *     - Percentage of footer height to fade from top
 * 
 *   topFadeOpacity: number (0-1)
 *     - Starting opacity of top fade (1 = solid black, 0 = transparent)
 * 
 *   bottomFadeHeight: number (0-100)
 *     - Percentage of footer height to fade from bottom
 * 
 *   bottomFadeOpacity: number (0-1)
 *     - Starting opacity of bottom fade
 * 
 *   sideFadeWidth: number (0-100)
 *     - Percentage of footer width to fade from sides
 * 
 *   sideFadeOpacity: number (0-1)
 *     - Starting opacity of side fades
 * }
 * 
 * RECOMMENDED PRESETS:
 * 
 * Full-bleed hero image (like space shuttle):
 * {
 *   "bgScale": "cover",
 *   "bgPosition": "bottom",
 *   "topFadeHeight": "0",
 *   "topFadeOpacity": "0",
 *   "bottomFadeHeight": "0",
 *   "bottomFadeOpacity": "0",
 *   "sideFadeWidth": "0",
 *   "sideFadeOpacity": "0"
 * }
 * 
 * Cinematic fade effect:
 * {
 *   "bgScale": "cover",
 *   "bgPosition": "center",
 *   "topFadeHeight": "40",
 *   "topFadeOpacity": "0.8",
 *   "bottomFadeHeight": "30",
 *   "bottomFadeOpacity": "0.6",
 *   "sideFadeWidth": "20",
 *   "sideFadeOpacity": "0.5"
 * }
 * 
 * Show full artwork without cropping:
 * {
 *   "bgScale": "contain",
 *   "bgPosition": "center",
 *   "topFadeHeight": "0",
 *   "topFadeOpacity": "0",
 *   "bottomFadeHeight": "0",
 *   "bottomFadeOpacity": "0",
 *   "sideFadeWidth": "0",
 *   "sideFadeOpacity": "0"
 * }
 */

// Default footer settings for new pages
export const defaultFooterSettings = {
  bgScale: 'cover',
  bgPosition: 'bottom',
  topFadeHeight: 0,
  topFadeOpacity: 0,
  bottomFadeHeight: 0,
  bottomFadeOpacity: 0,
  sideFadeWidth: 0,
  sideFadeOpacity: 0
};

// Preset configurations
export const footerPresets = {
  fullBleed: {
    name: 'Full Bleed Hero',
    description: 'Image fills entire footer, aligned to bottom',
    settings: {
      bgScale: 'cover',
      bgPosition: 'bottom',
      topFadeHeight: 0,
      topFadeOpacity: 0,
      bottomFadeHeight: 0,
      bottomFadeOpacity: 0,
      sideFadeWidth: 0,
      sideFadeOpacity: 0
    }
  },
  cinematic: {
    name: 'Cinematic Fade',
    description: 'Dramatic fade effects on all edges',
    settings: {
      bgScale: 'cover',
      bgPosition: 'center',
      topFadeHeight: 40,
      topFadeOpacity: 0.8,
      bottomFadeHeight: 30,
      bottomFadeOpacity: 0.6,
      sideFadeWidth: 20,
      sideFadeOpacity: 0.5
    }
  },
  showcase: {
    name: 'Artwork Showcase',
    description: 'Shows entire image without cropping',
    settings: {
      bgScale: 'contain',
      bgPosition: 'center',
      topFadeHeight: 0,
      topFadeOpacity: 0,
      bottomFadeHeight: 0,
      bottomFadeOpacity: 0,
      sideFadeWidth: 0,
      sideFadeOpacity: 0
    }
  },
  horizon: {
    name: 'Horizon Effect',
    description: 'Soft fade from top, sharp at bottom horizon',
    settings: {
      bgScale: 'cover',
      bgPosition: 'bottom',
      topFadeHeight: 60,
      topFadeOpacity: 0.9,
      bottomFadeHeight: 10,
      bottomFadeOpacity: 0.2,
      sideFadeWidth: 15,
      sideFadeOpacity: 0.3
    }
  }
};
