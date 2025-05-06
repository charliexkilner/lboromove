import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the locale from query or default to English
  const locale = (req.query.locale as string) || 'en';
  
  try {
    // Path to the locale's common.json file
    const localePath = path.join(process.cwd(), 'public', 'locales', locale, 'common.json');
    
    // Check if the file exists
    const fileExists = fs.existsSync(localePath);
    
    if (!fileExists) {
      return res.status(404).json({
        error: `Translation file for locale '${locale}' not found`,
        checkPath: localePath,
        exists: false
      });
    }
    
    // Read the file to verify it has content
    const fileContent = fs.readFileSync(localePath, 'utf8');
    let translations;
    
    try {
      translations = JSON.parse(fileContent);
    } catch (e) {
      return res.status(500).json({
        error: `Invalid JSON in translation file for locale '${locale}'`,
        path: localePath,
        exists: true,
        valid: false,
        rawContent: fileContent.substring(0, 100) + (fileContent.length > 100 ? '...' : '')
      });
    }
    
    // Return file info and a sample of translations
    return res.status(200).json({
      success: true,
      locale,
      path: localePath,
      exists: true,
      valid: true,
      size: fileContent.length,
      sampleKeys: Object.keys(translations).slice(0, 10),
      navbarHouses: translations.navbar?.houses || null,
      tabsAllHouses: translations.tabs?.allHouses || null,
      heroTitle: translations.hero?.title || null
    });
  } catch (error) {
    console.error('Error checking translation file:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
} 