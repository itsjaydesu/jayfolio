import { loadSeoConfig } from '../lib/seoConfig';

export default async function robots() {
  const config = await loadSeoConfig();
  const baseUrl = config.global?.siteUrl || 'https://jaywinder.com';
  const robots = config.robots || {};
  
  // Build rules based on configuration
  const rules = [];
  
  // Default rule for all bots
  if (robots.index !== false && robots.follow !== false) {
    rules.push({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/administratorrrr/'],
      crawlDelay: 1,
    });
  } else {
    // If site should not be indexed
    rules.push({
      userAgent: '*',
      disallow: '/',
    });
  }
  
  // Add Googlebot specific rules if configured
  if (robots.googleBot) {
    const googlebotRules = {
      userAgent: 'Googlebot',
      allow: '/',
      disallow: ['/api/', '/administratorrrr/'],
    };
    
    if (robots.googleBot.index === false) {
      googlebotRules.disallow = ['/'];
    }
    
    rules.push(googlebotRules);
  }
  
  return {
    rules,
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
