export const CHANNEL_CONTENT_DEFAULTS = {
  about: {
    // Background image for the about page
    aboutBackgroundImage: '',
    
    // New glassmorphic about page fields
    aboutTitle: {
      en: 'About',
      ja: 'プロフィール'
    },
    aboutSubtitle: {
      en: 'Creative Technologist',
      ja: 'クリエイティブ・テクノロジスト'
    },
    aboutContent: {
      en: 'Creative technologist guiding teams through ambient operating systems, tactile exhibition tooling, and cinematic web soundscapes. This dossier carries the studio ethos, collaborators, and signals shaping each commission.',
      ja: 'クリエイティブ・テクノロジストとして、アンビエントOSや展示向けツール、シネマティックなサウンドスケープを設計しています。このドシエではスタジオの思想、コラボレーター、そして各プロジェクトを導くシグナルを紹介します。'
    },
    aboutDetailCards: [
      {
        title: {
          en: 'Practice Vectors',
          ja: '実践ベクトル'
        },
        text: {
          en: 'Cinematic UI systems, immersive spatial audio, sensor-driven choreography, and collaborative design research.',
          ja: 'シネマティックなUIシステム、没入型の空間オーディオ、センサー連動の振付、そして協働型リサーチを行っています。'
        }
      },
      {
        title: {
          en: 'Operating Principles',
          ja: '運営ポリシー'
        },
        text: {
          en: 'Lead with listening, prototype in the open, and let every surface emit warmth. Projects calibrate atmosphere as carefully as code.',
          ja: 'まず耳を傾け、オープンに試作し、どのサーフェスにも温度を宿す。プロジェクトはコードと同じ精度で空気感を整えます。'
        }
      },
      {
        title: {
          en: 'Current Focus',
          ja: '現在のフォーカス'
        },
        text: {
          en: 'Building responsive worlds where light, audio, and interface gestures share the same pulse through WebGL and realtime systems.',
          ja: 'WebGLとリアルタイムシステムを通じて、光・音・インターフェイスが同じ鼓動で呼吸する空間を構築しています。'
        }
      }
    ],
    aboutTags: {
      en: ['Designer', 'Composer', 'Systems Artist'],
      ja: ['デザイナー', 'コンポーザー', 'システムアーティスト']
    },
    
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
    backgroundImage: '',
    title: 'Selected Builds',
    lead:
      'Explore interactive commissions, touring installations, and responsive tooling. Choose any dossier to open a full breakdown with media, credits, and embedded documentation.'
  },
  content: {
    backgroundImage: '',
    title: 'Content',
    lead:
      'Essays, dispatches, and glossaries documenting the studio process. Open any log to read the full rich-text entry with embedded media and references.'
  },
  sounds: {
    backgroundImage: '',
    title: 'Sound Experiments',
    lead:
      'Loops, drone suites, and live performance sketches. Dive into each archive entry to access liner notes and embedded media players.'
  },
  art: {
    backgroundImage: '',
    title: 'Art Experiments',
    lead:
      'Generative canvases, shader sketches, and motion field studies charting how the dot array mutates across performances.'
  }
};

export function createChannelContentDefaults() {
  return JSON.parse(JSON.stringify(CHANNEL_CONTENT_DEFAULTS));
}
