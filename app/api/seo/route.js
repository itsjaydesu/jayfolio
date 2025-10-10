import { loadSeoConfig, saveSeoConfig } from '../../../lib/seoConfig';

/**
 * GET /api/seo - Load current SEO configuration
 */
export async function GET() {
  try {
    const config = await loadSeoConfig();
    return Response.json({ config }, { status: 200 });
  } catch (error) {
    console.error('Error loading SEO config:', error);
    return Response.json(
      { error: 'Failed to load SEO configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seo - Save SEO configuration
 */
export async function PUT(request) {
  try {
    const config = await request.json();
    const result = await saveSeoConfig(config);
    
    if (result.success) {
      return Response.json({ config: result.config }, { status: 200 });
    } else {
      return Response.json(
        { error: result.error || 'Failed to save SEO configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving SEO config:', error);
    return Response.json(
      { error: 'Failed to save SEO configuration' },
      { status: 500 }
    );
  }
}
