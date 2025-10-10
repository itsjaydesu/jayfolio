import fs from 'fs/promises';
import path from 'path';
import { SEO_DEFAULTS } from './seoDefaults';

const SEO_CONFIG_FILE = path.join(process.cwd(), 'content', 'seo-config.json');

/**
 * Load SEO configuration from file or return defaults
 */
export async function loadSeoConfig() {
  try {
    const data = await fs.readFile(SEO_CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    // Merge with defaults to ensure all fields exist
    return mergeDeepWithDefaults(SEO_DEFAULTS, config);
  } catch {
    console.log('Using default SEO config');
    return SEO_DEFAULTS;
  }
}

/**
 * Save SEO configuration to file
 */
export async function saveSeoConfig(config) {
  try {
    const contentDir = path.join(process.cwd(), 'content');
    await fs.mkdir(contentDir, { recursive: true });
    
    // Merge with defaults before saving
    const fullConfig = mergeDeepWithDefaults(SEO_DEFAULTS, config);
    await fs.writeFile(SEO_CONFIG_FILE, JSON.stringify(fullConfig, null, 2));
    
    return { success: true, config: fullConfig };
  } catch (error) {
    console.error('Error saving SEO config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get SEO metadata for a specific page
 */
export async function getPageSeoData(pageName) {
  const config = await loadSeoConfig();
  const pageConfig = config.pages?.[pageName] || {};
  const global = config.global;
  
  return {
    title: pageConfig.title ? 
      global.titleTemplate.replace('%s', pageConfig.title) : 
      global.defaultTitle,
    description: pageConfig.description || global.defaultDescription,
    keywords: [...(pageConfig.keywords || []), ...(global.keywords || [])],
    image: pageConfig.image || global.defaultImage,
    author: global.author,
    locale: global.locale,
    siteUrl: global.siteUrl,
    siteName: global.siteName,
    twitterHandle: global.twitterHandle,
    openGraph: config.openGraph,
    twitter: config.twitter,
    robots: config.robots,
    verification: config.verification,
    themeColor: global.themeColor,
    backgroundColor: global.backgroundColor,
    favicon: global.favicon
  };
}

/**
 * Get SEO metadata for dynamic content (projects, words, sounds)
 */
export async function getContentSeoData(type, content) {
  const config = await loadSeoConfig();
  const template = config.contentTemplates?.[type] || {};
  const global = config.global;
  
  const title = template.titleTemplate ? 
    template.titleTemplate.replace('%s', content.title) :
    `${content.title} | ${global.siteName}`;
    
  const description = template.descriptionTemplate ?
    template.descriptionTemplate.replace('%s', content.summary || content.description || '') :
    content.summary || content.description || global.defaultDescription;
    
  return {
    title,
    description,
    keywords: [...(content.tags || []), ...(global.keywords || [])],
    image: content.coverImage?.url || global.defaultImage,
    author: content.author || global.author,
    locale: global.locale,
    siteUrl: global.siteUrl,
    siteName: global.siteName,
    twitterHandle: global.twitterHandle,
    openGraph: {
      ...config.openGraph,
      type: template.type || 'article',
      article: {
        publishedTime: content.createdAt,
        modifiedTime: content.updatedAt,
        author: content.author || global.author,
        tags: content.tags || []
      }
    },
    twitter: config.twitter,
    robots: config.robots,
    verification: config.verification,
    themeColor: global.themeColor,
    backgroundColor: global.backgroundColor,
    favicon: global.favicon
  };
}

/**
 * Deep merge helper function
 */
function mergeDeepWithDefaults(defaults, overrides) {
  const result = { ...defaults };
  
  for (const key in overrides) {
    if (overrides[key] !== undefined && overrides[key] !== null) {
      if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key]) && overrides[key] !== null) {
        result[key] = mergeDeepWithDefaults(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  
  return result;
}
