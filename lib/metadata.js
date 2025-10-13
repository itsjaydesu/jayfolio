import { getPageSeoData, getContentSeoData } from './seoConfig';

async function resolveSeoData(pageName, content, contentType) {
  if (content && contentType) {
    return getContentSeoData(contentType, content);
  }
  return getPageSeoData(pageName);
}

/**
 * Generate complete metadata object for Next.js
 * @param {string} pageName - The page identifier (home, about, projects, etc.)
 * @param {object} content - Optional content data for dynamic pages
 * @param {string} contentType - Type of content (projects, words, sounds, art)
 */
export async function generateMetadata(pageName, content = null, contentType = null) {
  const seoData = await resolveSeoData(pageName, content, contentType);
  
  const fullUrl = seoData.siteUrl ? `${seoData.siteUrl}${getPathForPage(pageName, content)}` : '';
  const imageUrl = seoData.image?.startsWith('http') ? 
    seoData.image : 
    seoData.siteUrl ? `${seoData.siteUrl}${seoData.image}` : seoData.image;
  
  return {
    // Basic metadata
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords?.join(', '),
    authors: [{ name: seoData.author }],
    creator: seoData.author,
    publisher: seoData.author,
    
    // Open Graph
    openGraph: {
      title: seoData.title,
      description: seoData.description,
      url: fullUrl,
      siteName: seoData.siteName,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: seoData.title,
        }
      ] : undefined,
      locale: seoData.locale,
      type: seoData.openGraph?.type || 'website',
      ...(seoData.openGraph?.article && {
        article: seoData.openGraph.article
      })
    },
    
    // Twitter Card
    twitter: {
      card: seoData.twitter?.cardType || 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
      site: seoData.twitter?.site,
      creator: seoData.twitter?.creator,
      images: imageUrl ? [imageUrl] : undefined
    },
    
    // Robots
    robots: {
      index: seoData.robots?.index ?? true,
      follow: seoData.robots?.follow ?? true,
      nocache: seoData.robots?.nocache ?? false,
      googleBot: seoData.robots?.googleBot || {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    },
    
    // Icons
    icons: {
      icon: seoData.favicon || '/favicon.ico',
      shortcut: seoData.favicon || '/favicon.ico',
      apple: '/apple-touch-icon.png'
    },
    
    // Manifest
    manifest: '/site.webmanifest',
    
    // Verification
    verification: {
      google: seoData.verification?.google,
      yandex: seoData.verification?.yandex,
      yahoo: seoData.verification?.yahoo,
      other: {
        ...(seoData.verification?.bing && { 'msvalidate.01': seoData.verification.bing }),
        ...(seoData.verification?.pinterest && { 'p:domain_verify': seoData.verification.pinterest })
      }
    },
    // Canonical URL
    alternates: {
      canonical: fullUrl
    },
    
    // Additional metadata
    formatDetection: {
      telephone: false,
      date: false,
      email: false,
      address: false
    }
  };
}

export async function generateViewportData(pageName, content = null, contentType = null) {
  const seoData = await resolveSeoData(pageName, content, contentType);
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: seoData.themeColor || '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: seoData.themeColor || '#000000' }
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
  };
}

/**
 * Generate JSON-LD structured data
 */
export async function generateStructuredData(pageName, content = null, contentType = null) {
  let seoData;
  
  if (content && contentType) {
    seoData = await getContentSeoData(contentType, content);
  } else {
    seoData = await getPageSeoData(pageName);
  }
  
  const structuredData = [];
  
  // Add organization/person data
  if (seoData.structuredData?.organization) {
    structuredData.push({
      '@context': 'https://schema.org',
      ...seoData.structuredData.organization
    });
  }
  
  // Add website data
  if (seoData.structuredData?.website) {
    structuredData.push({
      '@context': 'https://schema.org',
      ...seoData.structuredData.website
    });
  }
  
  // Add breadcrumb navigation
  const breadcrumb = generateBreadcrumb(pageName, content, seoData.siteUrl);
  if (breadcrumb) {
    structuredData.push(breadcrumb);
  }
  
  // Add content-specific structured data
  if (content && contentType) {
    const contentStructuredData = generateContentStructuredData(content, contentType, seoData);
    if (contentStructuredData) {
      structuredData.push(contentStructuredData);
    }
  }
  
  return structuredData;
}

/**
 * Generate breadcrumb structured data
 */
function generateBreadcrumb(pageName, content, siteUrl) {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl
    }
  ];
  
  if (pageName && pageName !== 'home') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: pageName.charAt(0).toUpperCase() + pageName.slice(1),
      item: `${siteUrl}/${pageName}`
    });
  }
  
  if (content?.title) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: content.title,
      item: `${siteUrl}/${pageName}/${content.slug}`
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

/**
 * Generate content-specific structured data
 */
function generateContentStructuredData(content, contentType, seoData) {
  const baseData = {
    '@context': 'https://schema.org',
    name: content.title,
    description: content.summary || content.description,
    url: `${seoData.siteUrl}/${contentType}/${content.slug}`,
    author: {
      '@type': 'Person',
      name: content.author || seoData.author
    },
    datePublished: content.createdAt,
    dateModified: content.updatedAt || content.createdAt
  };
  
  if (content.coverImage?.url) {
    baseData.image = content.coverImage.url.startsWith('http') ?
      content.coverImage.url :
      `${seoData.siteUrl}${content.coverImage.url}`;
  }
  
  switch (contentType) {
    case 'projects':
      return {
        ...baseData,
        '@type': 'CreativeWork',
        keywords: content.tags?.join(', ')
      };
    
    case 'content':
    case 'words': // Backward compatibility
      return {
        ...baseData,
        '@type': 'BlogPosting',
        articleBody: content.content,
        keywords: content.tags?.join(', ')
      };
    
    case 'sounds':
      return {
        ...baseData,
        '@type': 'MusicRecording',
        keywords: content.tags?.join(', ')
      };
    case 'art':
      return {
        ...baseData,
        '@type': 'VisualArtwork',
        artform: 'Generative art',
        keywords: content.tags?.join(', ')
      };
    
    default:
      return {
        ...baseData,
        '@type': 'CreativeWork'
      };
  }
}

/**
 * Get the path for a specific page
 */
function getPathForPage(pageName, content = null) {
  if (pageName === 'home') return '/';
  // Map 'words' to 'content' for URLs
  const routeName = pageName === 'words' ? 'content' : pageName;
  if (content?.slug) return `/${routeName}/${content.slug}`;
  return `/${routeName}`;
}
