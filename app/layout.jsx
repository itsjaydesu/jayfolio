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
      </body>
    </html>
  );
}
