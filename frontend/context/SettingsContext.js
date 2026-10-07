import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const defaultSettings = {
  brand_name: 'Campus Events',
  tagline: 'Connecting people through campus and community events',
  description: 'A modern platform designed to make event management simple, efficient, and accessible.',
  logo: '',
  favicon: '',
  address: '',
  email: '',
  phone: '',
  website: '',
  footer_description: 'A modern platform designed to make event management simple, efficient, and accessible.',
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  twitter: ''
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
        const liveSettings = res.data.data;
        setSettings(prev => {
          const merged = { ...prev, ...liveSettings };
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('app_brand_settings', JSON.stringify(merged));
            }
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('Failed to load public brand settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Hydrate immediately from localStorage if available
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('app_brand_settings');
        if (cached) {
          setSettings(prev => ({ ...prev, ...JSON.parse(cached) }));
        }
      }
    } catch (e) {}

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
