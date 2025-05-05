import { useTranslation as useNextTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';

// Add a variable to store translation errors for debugging
let translationErrors: Record<string, any> = {};

export const useTranslation = () => {
  const { t, i18n, ready } = useNextTranslation('common');
  const [loadAttempted, setLoadAttempted] = useState(false);

  // Try to force-load translation if not ready after some time
  useEffect(() => {
    if (!ready && !loadAttempted) {
      const timer = setTimeout(() => {
        console.log('Attempting to reload translations');
        setLoadAttempted(true);
        
        try {
          i18n?.loadNamespaces('common').then(() => {
            console.log('Translation namespace reload attempted');
          });
        } catch (error) {
          console.error('Error reloading translations:', error);
        }
      }, 1000); // Wait 1 second before attempting reload
      
      return () => clearTimeout(timer);
    }
  }, [ready, i18n, loadAttempted]);

  // Improved translation function with error handling
  const translationWithFallback = (key: string, options?: any) => {
    try {
      // Try to get the translation
      if (!ready || !t) return key;
      
      const translation = t(key, options);
      
      // Check if the translation is returning the key (indicates failed translation)
      if (translation === key) {
        // Only log unique errors to prevent console spam
        if (!translationErrors[key]) {
          console.warn(`Translation missing for key: ${key}`);
          translationErrors[key] = true;
        }
        return key;
      }
      
      return translation;
    } catch (error) {
      // Log error and return the key as fallback
      console.error(`Translation error for key ${key}:`, error);
      return key;
    }
  };

  return { 
    t: translationWithFallback, 
    ready,
    i18n 
  };
};
