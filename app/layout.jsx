import './globals.css';
import SiteShell from '../components/SiteShell';

export const metadata = {
  title: 'Hypnotic Monochrome Field',
  description: 'A retro-futuristic interface exploring Jay Winder’s audiovisual experiments.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
