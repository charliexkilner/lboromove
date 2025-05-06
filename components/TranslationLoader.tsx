import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function TranslationLoader() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  useEffect(() => {
    // Force reload translations - more aggressive approach
    const loadTranslations = async () => {
      if (!hasAttemptedLoad) {
        setHasAttemptedLoad(true);
        
        try {
          console.log('TranslationLoader: Attempting to load translations');
          
          // First try to use i18n methods
          if (i18n) {
            await i18n.reloadResources();
            console.log('TranslationLoader: Reloaded resources through i18n');
            
            // Force language change to trigger rerendering with translations
            if (router.locale) {
              await i18n.changeLanguage(router.locale);
              console.log(`TranslationLoader: Changed language to ${router.locale}`);
            }
          }
          
          // Then try direct fetch as backup
          try {
            // Directly fetch the translation file to ensure it's cached
            const locale = router.locale || 'en';
            const response = await fetch(`/locales/${locale}/common.json?t=${Date.now()}`);
            
            if (response.ok) {
              const translations = await response.json();
              console.log('TranslationLoader: Successfully fetched translation file directly', 
                Object.keys(translations).length, 'keys found');
                
              // If document language doesn't match locale, force navigation
              if (document.documentElement.lang !== locale) {
                console.log('TranslationLoader: Document lang mismatch, forcing reload');
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }
            } else {
              console.error('TranslationLoader: Failed to fetch translation file', response.status);
              
              // If in production and translations failed to load, try one reload
              if (process.env.NODE_ENV === 'production' && localStorage.getItem('translation-reload-attempted') !== 'true') {
                localStorage.setItem('translation-reload-attempted', 'true');
                console.log('TranslationLoader: First load in production, attempting reload');
                window.location.reload();
              }
            }
          } catch (fetchError) {
            console.error('TranslationLoader: Error fetching translation file', fetchError);
          }
        } catch (error) {
          console.error('TranslationLoader: Failed to reload translations:', error);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      // Only run on client side
      loadTranslations();
    }
  }, [i18n, router, hasAttemptedLoad]);
  
  return null;
} 