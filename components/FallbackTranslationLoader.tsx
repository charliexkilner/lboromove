import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Define hardcoded fallback translations for critical UI elements
const FALLBACK_TRANSLATIONS = {
  'navbar.houses': 'HOUSES',
  'navbar.discussion': 'DISCUSSION',
  'navbar.tools': 'TOOLS',
  'navbar.profile': 'PROFILE',
  'tabs.allHouses': 'ALL HOUSES',
  'tabs.goldenTriangle': 'GOLDEN TRIANGLE',
  'tabs.silverSquare': 'SILVER SQUARE',
  'tabs.greatValue': 'GREAT VALUE',
  'tabs.nearCampus': 'NEAR CAMPUS',
  'tabs.onCampus': 'ON CAMPUS',
  'tabs.soloLiving': 'SOLO LIVING',
  'tabs.largeHouses': 'LARGE HOUSES',
  'tabs.recentlyAdded': 'RECENTLY ADDED',
  'hero.title': 'FIND YOUR PERFECT STUDENT HOME',
  'hero.subtitle': 'discover the best student houses - all in one place.',
  'searchBar.price': 'PRICE',
  'searchBar.bedrooms': 'BEDROOMS',
  'searchBar.any': 'Any',
};

// Update the global interface to include the t function
declare global {
  interface Window {
    __translations: Record<string, any>;
    t: (key: string) => string;
  }
}

export default function FallbackTranslationLoader() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Initialize global translations object if it doesn't exist
    if (typeof window !== 'undefined' && !window.__translations) {
      window.__translations = { ...FALLBACK_TRANSLATIONS };
    }
    
    // Function to load translations directly from file
    const loadTranslations = async () => {
      try {
        const locale = router.locale || 'en';
        console.log('FallbackTranslationLoader: Loading translations for', locale);
        
        // Try to fetch translations directly
        const response = await fetch(`/locales/${locale}/common.json?t=${Date.now()}`);
        
        if (response.ok) {
          const translations = await response.json();
          console.log('FallbackTranslationLoader: Loaded translations successfully');
          
          // Store translations globally
          if (typeof window !== 'undefined') {
            window.__translations = { ...window.__translations, ...translations };
          }
          
          // Apply translations to elements with data-i18n attributes
          applyTranslations();
          
          setIsLoaded(true);
        } else {
          console.error('FallbackTranslationLoader: Failed to load translations, HTTP status:', response.status);
        }
      } catch (error) {
        console.error('FallbackTranslationLoader: Error loading translations:', error);
      }
    };
    
    // Apply translations to DOM elements with data-i18n attributes
    const applyTranslations = () => {
      if (typeof window === 'undefined' || !window.__translations) return;
      
      // Find all elements with data-i18n attribute
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key && window.__translations[key]) {
          element.textContent = window.__translations[key];
        }
      });
    };
    
    // Attempt to load translations if not already loaded
    if (!isLoaded) {
      loadTranslations();
    }
    
    // Set up a MutationObserver to apply translations to new elements
    if (typeof window !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        let needsTranslationUpdate = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                const element = node as Element;
                if (element.hasAttribute('data-i18n') || element.querySelector('[data-i18n]')) {
                  needsTranslationUpdate = true;
                }
              }
            });
          }
        });
        
        if (needsTranslationUpdate) {
          applyTranslations();
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      return () => observer.disconnect();
    }
  }, [router.locale, isLoaded]);
  
  // Add a custom hook to provide translations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Add a global translation function
      window.t = (key: string) => {
        return window.__translations?.[key] || key;
      };
    }
  }, []);
  
  return null;
} 