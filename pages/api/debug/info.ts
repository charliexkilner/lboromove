import { NextApiRequest, NextApiResponse } from 'next';
import { testDatabaseConnection } from '../../../lib/db-helper';
import path from 'path';
import fs from 'fs';

// Define interface for locale info
interface LocaleInfo {
  locale: string;
  files: string[];
  hasCommonJson: boolean;
}

// This endpoint provides debug information about the environment
// It's useful for troubleshooting deployment issues
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow in development or when authorized
    if (process.env.NODE_ENV !== 'development' && 
        req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Test database connection
    const dbTest = await testDatabaseConnection();
    
    // Check for i18n files
    const localesPath = path.join(process.cwd(), 'public', 'locales');
    let i18nStatus = 'unknown';
    let files: LocaleInfo[] = [];
    
    try {
      // Check if the locales directory exists and is readable
      const hasLocalesDir = fs.existsSync(localesPath);
      if (hasLocalesDir) {
        i18nStatus = 'directory exists';
        
        // Try to list all locales
        const locales = fs.readdirSync(localesPath);
        
        // Get details about each locale
        files = locales.map(locale => {
          const localePath = path.join(localesPath, locale);
          const localeFiles = fs.existsSync(localePath) ? 
            fs.readdirSync(localePath) : [];
          
          return {
            locale,
            files: localeFiles,
            hasCommonJson: localeFiles.includes('common.json')
          };
        });
      } else {
        i18nStatus = 'directory missing';
      }
    } catch (error) {
      i18nStatus = `error: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    // Get environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_REGION: process.env.VERCEL_REGION,
      DATABASE_URL: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.split('@')[0].split('://')[0]}://*****@${process.env.DATABASE_URL.split('@')[1]}` : 
        'not set',
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      DEBUG_I18N: process.env.DEBUG_I18N,
      DEBUG_PRISMA: process.env.DEBUG_PRISMA,
    };
    
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      database: {
        connectionTest: dbTest,
      },
      i18n: {
        status: i18nStatus,
        localesDir: localesPath,
        locales: files,
      }
    });
  } catch (error) {
    console.error('Error in debug info:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
} 