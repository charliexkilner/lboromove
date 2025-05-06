import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import path from 'path';
import fs from 'fs';

/**
 * Helper function to use in getServerSideProps or getStaticProps
 * to ensure translations are loaded
 */
export async function getTranslationsProps(locale?: string) {
  const currentLocale = locale || 'en';
  
  try {
    // Check if the locale directory exists in public/locales
    const localeDir = path.join(process.cwd(), 'public', 'locales', currentLocale);
    const commonPath = path.join(localeDir, 'common.json');
    
    const hasLocaleDir = fs.existsSync(localeDir);
    const hasCommonFile = fs.existsSync(commonPath);
    
    if (!hasLocaleDir || !hasCommonFile) {
      console.warn(`Warning: Missing translation directory or file for locale "${currentLocale}"`);
      // Fall back to English if the current locale doesn't exist
      return serverSideTranslations('en', ['common']);
    }
    
    // Load translations with the current locale
    return serverSideTranslations(currentLocale, ['common']);
  } catch (error) {
    console.error('Error loading translations:', error);
    // Fall back to English if there's an error
    return serverSideTranslations('en', ['common']);
  }
}

/**
 * Verify a translation file has the required keys
 */
export function verifyTranslations(locale: string): { valid: boolean; missing: string[] } {
  try {
    // Required translation keys
    const requiredKeys = [
      'navbar.houses',
      'navbar.discussion',
      'navbar.tools',
      'tabs.allHouses',
      'hero.title'
    ];
    
    // Path to the translations file
    const translationsPath = path.join(process.cwd(), 'public', 'locales', locale, 'common.json');
    
    // Check if the file exists
    if (!fs.existsSync(translationsPath)) {
      return { 
        valid: false, 
        missing: requiredKeys 
      };
    }
    
    // Read and parse the translations
    const translationsContent = fs.readFileSync(translationsPath, 'utf8');
    const translations = JSON.parse(translationsContent);
    
    // Function to check if a nested key exists
    const hasNestedKey = (obj: any, key: string): boolean => {
      const parts = key.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (!current || typeof current !== 'object' || !(part in current)) {
          return false;
        }
        current = current[part];
      }
      
      return true;
    };
    
    // Check for missing keys
    const missingKeys = requiredKeys.filter(key => !hasNestedKey(translations, key));
    
    return {
      valid: missingKeys.length === 0,
      missing: missingKeys
    };
  } catch (error) {
    console.error(`Error verifying translations for locale "${locale}":`, error);
    return { 
      valid: false, 
      missing: []
    };
  }
} 