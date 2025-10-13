import fs from 'fs/promises';
import path from 'path';
import { SEO_DEFAULTS } from './seoDefaults';

const SEO_CONFIG_FILE = path.join(process.cwd(), 'content', 'seo-config.json');

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function resolveContentTags(value) {
  if (!value) return [];

  const normalizeString = (input) =>
    String(input)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === 'string' ? normalizeString(item) : []))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return normalizeString(value);
  }

  if (typeof value === 'object') {
    const collected = [];
    for (const entry of Object.values(value)) {
      if (Array.isArray(entry)) {
        collected.push(...entry.flatMap((item) => (typeof item === 'string' ? normalizeString(item) : [])));
      } else if (typeof entry === 'string') {
        collected.push(...normalizeString(entry));
      }
    }
    return collected.filter(Boolean);
  }

  return [];
}

function sanitizeSeoConfig(config) {
  if (!config || typeof config !== 'object') {
    return {};
  }

  const result = { ...config };

  if (result.global && typeof result.global === 'object') {
    result.global = { ...result.global };
    if (Array.isArray(result.global.keywords)) {
      result.global.keywords = sanitizeStringArray(result.global.keywords);
    }
  }

  if (result.pages && typeof result.pages === 'object') {
    const pages = {};
    for (const [page, pageConfig] of Object.entries(result.pages)) {
      if (!pageConfig || typeof pageConfig !== 'object') continue;
      const nextPage = { ...pageConfig };
      if (Array.isArray(nextPage.keywords)) {
        nextPage.keywords = sanitizeStringArray(nextPage.keywords);
      }
      pages[page] = nextPage;
    }
    result.pages = pages;
  }

  return result;
}

/**
 * Load SEO configuration from file or return defaults
 */
export async function loadSeoConfig() {
  try {
    const data = await fs.readFile(SEO_CONFIG_FILE, 'utf-8');
    const config = sanitizeSeoConfig(JSON.parse(data));
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
    const sanitizedConfig = sanitizeSeoConfig(config);
    const fullConfig = mergeDeepWithDefaults(SEO_DEFAULTS, sanitizedConfig);
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
  const resolvedTags = resolveContentTags(content.tags);
  
  const title = template.titleTemplate ? 
    template.titleTemplate.replace('%s', content.title) :
    `${content.title} | ${global.siteName}`;
    
  const description = template.descriptionTemplate ?
    template.descriptionTemplate.replace('%s', content.summary || content.description || '') :
    content.summary || content.description || global.defaultDescription;
    
  return {
    title,
    description,
    keywords: [...resolvedTags, ...(global.keywords || [])],
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
        tags: resolvedTags
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
