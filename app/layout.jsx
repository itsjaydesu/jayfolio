import './globals.css';
import SiteShell from '../components/SiteShell';
import { generateMetadata as getMetadata, generateStructuredData, generateViewportData } from '../lib/metadata';

export async function generateMetadata() {
  return await getMetadata('home');
}

export async function generateViewport() {
  return await generateViewportData('home');
}

export default async function RootLayout({ children }) {
  const structuredData = await generateStructuredData('home');
  
  return (
    <html lang="en">
      <head>
        {structuredData.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
        <noscript>
          <style>{`
            :root {
              --nav-initial-opacity: 1 !important;
              --nav-initial-offset: 0 !important;
              --nav-item-initial-opacity: 1 !important;
              --nav-item-initial-offset: 0 !important;
            }

            .site-shell__header {
              pointer-events: auto !important;
              opacity: 1 !important;
              transform: translate(-50%, 0) !important;
            }

            .site-shell__brand,
            .site-shell__nav-link,
            .site-shell__social {
              opacity: 1 !important;
              transform: none !important;
            }
          `}</style>
        </noscript>
      </body>
    </html>
  );
}
