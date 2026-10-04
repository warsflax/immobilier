import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AppSettings } from './types';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
}

const defaultSettings: AppSettings = {
  appName: 'Chahin Immobilier',
  primaryColor: '#ea580c', // orange-600
  heroImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80',
  currency: '€',
  heroTitle: 'Trouvez le logement qui vous ressemble',
  heroSubtitle: "Des milliers d'annonces exclusives pour la vente et la location.",
  listingsTitle: 'Annonces récentes',
  contactEmail: 'contact@chahin-immobilier.com',
  contactPhone: '+33 1 23 45 67 89',
  address: '75008 Paris, France',
  appLogo: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        let appName = data.appName;
        let contactEmail = data.contactEmail;
        let needsUpdate = false;

        // Auto-replace any legacy "Manda" or "ImmoManda" naming with "Chahin Immobilier"
        if (!appName || appName.toLowerCase().includes('manda')) {
          appName = 'Chahin Immobilier';
          needsUpdate = true;
        }

        if (contactEmail && contactEmail.toLowerCase().includes('manda')) {
          contactEmail = contactEmail.replace(/immomanda\.com|manda\.com/gi, 'chahin-immobilier.com');
          needsUpdate = true;
        }

        const resolvedSettings: AppSettings = {
          ...defaultSettings,
          ...data,
          appName,
          contactEmail: contactEmail || defaultSettings.contactEmail,
        };

        if (needsUpdate) {
          setDoc(doc(db, 'settings', 'global'), resolvedSettings, { merge: true }).catch(console.error);
        }

        setSettings(resolvedSettings);
      } else {
        // Document does not exist yet, persist defaults
        setDoc(doc(db, 'settings', 'global'), defaultSettings).catch(console.error);
        setSettings(defaultSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching settings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
