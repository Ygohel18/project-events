import { useEffect } from 'react';
// 1. Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// 2. Import FontAwesome config & core CSS to prevent icon jumping
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

// 3. Import custom global styles
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';

export default function MyApp({ Component, pageProps }) {
  // Load Bootstrap JavaScript (for tooltips, collapse, modals, etc.)
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <SettingsProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SettingsProvider>
  );
}
