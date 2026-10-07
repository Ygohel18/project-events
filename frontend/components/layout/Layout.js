import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSettings } from '../../context/SettingsContext';

export default function Layout({ children, title }) {
  const { settings } = useSettings();
  const brandName = settings.brand_name || 'CampusEvents';
  const pageTitle = title ? `${title} | ${brandName}` : `${brandName} - ${settings.tagline || 'Event Management'}`;

  const faviconUrl = settings.favicon
    ? (settings.favicon.startsWith('http') ? settings.favicon : `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001'}${settings.favicon}`)
    : '/favicon.ico';

  return (
    <div className="d-flex flex-column min-vh-100">
      <Head>
        <title>{pageTitle}</title>
        <link rel="icon" href={faviconUrl} />
        <meta name="description" content={settings.description || 'College event management system'} />
      </Head>
      <Navbar />
      <main className="flex-grow-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
