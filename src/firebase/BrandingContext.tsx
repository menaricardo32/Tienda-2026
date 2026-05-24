import React, { createContext, useContext, useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './config';
import { BrandingSettings } from '../types';

interface BrandingContextType {
  branding: BrandingSettings | null;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  loading: true,
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings | null>(() => {
    // Try to load from localStorage for instant initial render
    const saved = localStorage.getItem('ph_branding_cache');
    if (saved) {
      const data = JSON.parse(saved) as BrandingSettings;
      // Apply colors immediately if available in cache
      if (data.colors) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', data.colors.primary);
        root.style.setProperty('--secondary-color', data.colors.secondary);
        root.style.setProperty('--bg-color', data.colors.background);
        root.style.setProperty('--text-color', data.colors.text);
      }
      return data;
    }
    return null;
  });
  const [loading, setLoading] = useState(!branding); // Only "loading" if we don't have a cache

  useEffect(() => {
    const docRef = doc(db, 'settings', 'branding');
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as BrandingSettings;
        setBranding(data);
        localStorage.setItem('ph_branding_cache', JSON.stringify(data));
        
        // Apply colors to CSS variables
        if (data.colors) {
          const root = document.documentElement;
          root.style.setProperty('--primary-color', data.colors.primary);
          root.style.setProperty('--secondary-color', data.colors.secondary);
          root.style.setProperty('--bg-color', data.colors.background);
          root.style.setProperty('--text-color', data.colors.text);
        } else {
          // Reset to defaults if no colors defined
          const root = document.documentElement;
          root.style.removeProperty('--primary-color');
          root.style.removeProperty('--secondary-color');
          root.style.removeProperty('--bg-color');
          root.style.removeProperty('--text-color');
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to branding settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};
