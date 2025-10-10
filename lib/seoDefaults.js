export const SEO_DEFAULTS = {
  global: {
    siteName: 'Jay Winder',
    titleTemplate: '%s | Jay Winder',
    defaultTitle: 'Jay Winder - Audiovisual Experiments',
    defaultDescription: 'A retro-futuristic interface exploring Jay Winder\'s audiovisual experiments, kinetic WebGL fields, and ambient soundscapes.',
    keywords: ['audiovisual', 'creative technology', 'WebGL', 'experimental music', 'interactive design', 'ambient', 'installation art'],
    author: 'Jay Winder',
    locale: 'en_US',
    siteUrl: 'https://jaywinder.com', // Update with actual domain
    twitterHandle: '@jaywinder',
    defaultImage: '/og-default.jpg',
    favicon: '/favicon.ico',
    themeColor: '#000000',
    backgroundColor: '#000000'
  },
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Jay Winder'
  },
  
  twitter: {
    cardType: 'summary_large_image',
    handle: '@jaywinder',
    site: '@jaywinder',
    creator: '@jaywinder'
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  
  verification: {
    google: '', // Google Search Console verification
    bing: '', // Bing Webmaster Tools verification
    yandex: '', // Yandex verification
    pinterest: '' // Pinterest verification
  },
  
  // Page-specific SEO settings
  pages: {
    home: {
      title: 'Hypnotic Monochrome Field',
      description: 'A retro-futuristic interface exploring Jay Winder\'s audiovisual experiments.',
      keywords: ['portfolio', 'creative technology', 'audiovisual art'],
      image: '/og-home.jpg'
    },
    about: {
      title: 'About',
      description: 'Jay Winder curates lucid audiovisual experiments, shaping hypnotic interfaces that oscillate between nostalgia and the hyperreal.',
      keywords: ['about', 'biography', 'creative practice'],
      image: '/og-about.jpg'
    },
    projects: {
      title: 'Projects',
      description: 'Kinetic WebGL fields, performance-driven installations, and tactile controls for curious collaborators.',
      keywords: ['projects', 'portfolio', 'WebGL', 'installations'],
      image: '/og-projects.jpg'
    },
    words: {
      title: 'Words',
      description: 'Process notes, essays on spatial computing, and glossaries for future signal-bearers.',
      keywords: ['writing', 'essays', 'process', 'spatial computing'],
      image: '/og-words.jpg'
    },
    sounds: {
      title: 'Sounds',
      description: 'A rotating archive of ambient loops, chromatic drones, and responsive audio sketches.',
      keywords: ['music', 'ambient', 'sound design', 'audio'],
      image: '/og-sounds.jpg'
    }
  },
  
  structuredData: {
    organization: {
      '@type': 'Person',
      name: 'Jay Winder',
      url: 'https://jaywinder.com',
      description: 'Creative technologist and audiovisual artist',
      sameAs: [
        // Add social media URLs
      ]
    },
    
    website: {
      '@type': 'WebSite',
      name: 'Jay Winder',
      url: 'https://jaywinder.com',
      description: 'A retro-futuristic interface exploring audiovisual experiments'
    }
  },
  
  // Content-specific metadata templates
  contentTemplates: {
    projects: {
      titleTemplate: '%s - Project | Jay Winder',
      descriptionTemplate: 'Project: %s',
      type: 'article'
    },
    words: {
      titleTemplate: '%s - Writing | Jay Winder',
      descriptionTemplate: '%s',
      type: 'article'
    },
    sounds: {
      titleTemplate: '%s - Sound | Jay Winder',
      descriptionTemplate: 'Sound piece: %s',
      type: 'music'
    }
  }
};
