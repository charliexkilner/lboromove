import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function TranslationLoader() {
  const router = useRouter();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Force reload translations
    const loadTranslations = async () => {
      if (i18n) {
        try {
          // Try to reload the translation namespace
          await i18n.reloadResources();
          console.log('Translations reloaded');
          
          // If that doesn't work, force a client-side navigation
          if (document.documentElement.lang !== router.locale) {
            console.log('Forcing locale reload');
            router.replace(router.asPath);
          }
        } catch (error) {
          console.error('Failed to reload translations:', error);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      // Only run on client side
      loadTranslations();
    }
  }, [i18n, router]);
  
  return null;
} 