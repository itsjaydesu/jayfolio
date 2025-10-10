import { loadChannelContent } from '../lib/channelContent';
import { loadSeoConfig } from '../lib/seoConfig';

export default async function sitemap() {
  const config = await loadSeoConfig();
  const baseUrl = config.global?.siteUrl || 'https://jaywinder.com';
  
  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/words`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sounds`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
  
  // Dynamic routes from content
  const dynamicRoutes = [];
  
  try {
    // Load all content types
    const contentTypes = ['projects', 'words', 'sounds'];
    
    for (const type of contentTypes) {
      const content = await loadChannelContent(type);
      const entries = content.entries || [];
      
      for (const entry of entries) {
        // Only include published content in sitemap
        if (entry.status === 'published') {
          dynamicRoutes.push({
            url: `${baseUrl}/${type}/${entry.slug}`,
            lastModified: new Date(entry.updatedAt || entry.createdAt),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error loading content for sitemap:', error);
  }
  
  return [...staticRoutes, ...dynamicRoutes];
}
