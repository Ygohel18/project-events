import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const defaultSettings = {
  brand_name: 'CampusEvents',
  tagline: 'Discover, Join & Experience College Events',
  description: 'The all-in-one platform for college workshops, hackathons, and cultural fests.',
  logo: '',
  favicon: '',
  address: 'Campus Center, Academic Block 4, Tech City',
  email: 'info@campusevents.edu',
  phone: '+1 (555) 234-5678',
  website: 'https://campusevents.edu',
  footer_description: 'Discover events, secure tickets, and network with passionate students across campus.',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  linkedin: 'https://linkedin.com',
  youtube: '',
  twitter: 'https://twitter.com'
};

const SettingsContext = createContext({
  settings: defaultSettings,
  loading: false,
  reloadSettings: async () => {}
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getPublicSettings();
      if (res.data?.success && res.data.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.warn('Failed to load public brand settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, reloadSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return { settings: defaultSettings, loading: false, reloadSettings: async () => {} };
  }
  return context;
}
