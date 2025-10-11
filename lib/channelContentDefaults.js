export const CHANNEL_CONTENT_DEFAULTS = {
  about: {
    // New glassmorphic about page fields
    aboutTitle: 'About',
    aboutSubtitle: 'Creative Technologist',
    aboutContent: 'Creative technologist guiding teams through ambient operating systems, tactile exhibition tooling, and cinematic web soundscapes. This dossier carries the studio ethos, collaborators, and signals shaping each commission.',
    aboutDetailCards: [
      {
        title: 'Practice Vectors',
        text: 'Cinematic UI systems, immersive spatial audio, sensor-driven choreography, and collaborative design research.'
      },
      {
        title: 'Operating Principles',
        text: 'Lead with listening, prototype in the open, and let every surface emit warmth. Projects calibrate atmosphere as carefully as code.'
      },
      {
        title: 'Current Focus',
        text: 'Building responsive worlds where light, audio, and interface gestures share the same pulse through WebGL and realtime systems.'
      }
    ],
    aboutTags: ['Designer', 'Composer', 'Systems Artist'],
    
    // Legacy fields
    title: '',
    lead:
      'Creative technologist guiding teams through ambient operating systems, tactile exhibition tooling, and cinematic web soundscapes. This dossier carries the studio ethos, collaborators, and signals shaping each commission. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    statusDate: '2024-11-01',
    statusLabel: 'CURRENT STATUS • AERIAL RESONANCE',
    tags: 'Designer • Composer • Systems Artist',
    headline: 'Sculpting Interfaces That Listen Back',
    summary:
      'Jay prototypes responsive worlds where light, audio, and interface gestures share the same pulse. The practice involves building sensing rigs, translating data to lush WebGL canvases, and composing sound to steer spatial storytelling. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    practiceVectors:
      'Cinematic UI systems, immersive spatial audio, sensor-driven choreography, and collaborative design research. Each commission blends physical staging with realtime web tooling for performers and exhibition teams.',
    currentCollaborators: [
      'Signal Grid Lab — adaptive lighting for touring stages.',
      'Archive Atlas — sonic archives with tactile playback consoles.',
      'Field Lexicon Collective — language prototypes for future venues.'
    ],
    operatingPrinciples:
      'Lead with listening, prototype in the open, and let every surface emit warmth. Projects hinge on calibrating atmosphere as carefully as code so collaborators feel invited into the signal.',
    overview: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Jay Winder weaves tactile computing, kinetic lighting, and sonic cartography into experiential systems that feel warmly sentient. Suspendisse potenti. Vestibulum vitae arcu eget sapien scelerisque aliquet quis sed justo. Maecenas egestas lacus eu vulputate bibendum, gravida risus euismod.',
      'Phasellus euismod mi a nibh hendrerit, sit amet dapibus ipsum faucibus. Pellentesque in tempor nibh. Integer malesuada lorem ipsum dolor sit amet technologist auctor, malesuada augue quis, fermentum magna. Curabitur blandit, metus ac iaculis vulputate, est magna luctus risus, vitae posuere elit lectus quis augue.'
    ],
    history: [
      {
        year: '2024',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Jay Winder launched a resonant lab for touring installations, experimenting with ambient operating systems that listen as performers move.'
      },
      {
        year: '2021',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Crafted WebGL observatories for civic archives, translating sensor data into luminous sonic gradients for public play.'
      },
      {
        year: '2017',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Embedded with research theaters to build responsive stage controls that blend composer gestures with adaptive lighting.'
      },
      {
        year: '2012',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Began as a systems artist translating modular synthesis workflows into interactive exhibition tooling and haptic audio consoles.'
      }
    ],
    signals: [
      {
        term: 'Primary Mediums',
        description: 'Lorem ipsum interfaces, ambient OS prototypes, spatial sound choreography.'
      },
      {
        term: 'Operating Doctrine',
        description:
          'Lorem ipsum dolor sit amet technologist dictum—craft the atmosphere, prototype with hospitality, and release tools that invite co-authorship.'
      },
      {
        term: 'Open Invitations',
        description:
          'Lorem ipsum residencies, collaborative field recordings, and sensor-driven storytelling research.'
      }
    ]
  },
  projects: {
    title: 'Selected Builds',
    lead:
      'Explore interactive commissions, touring installations, and responsive tooling. Choose any dossier to open a full breakdown with media, credits, and embedded documentation.'
  },
  words: {
    title: 'Words & Essays',
    lead:
      'Essays, dispatches, and glossaries documenting the studio process. Open any log to read the full rich-text entry with embedded media and references.'
  },
  sounds: {
    title: 'Sound Experiments',
    lead:
      'Loops, drone suites, and live performance sketches. Dive into each archive entry to access liner notes and embedded media players.'
  },
  art: {
    title: 'Art Experiments',
    lead:
      'Generative canvases, shader sketches, and motion field studies charting how the dot array mutates across performances.'
  }
};

export function createChannelContentDefaults() {
  return JSON.parse(JSON.stringify(CHANNEL_CONTENT_DEFAULTS));
}
