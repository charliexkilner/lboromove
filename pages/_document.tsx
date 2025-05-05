import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentProps,
} from 'next/document';
import React from 'react';
import { i18n } from 'next-i18next.config';

class MyDocument extends Document<DocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    
    // Log i18n debugging for production
    if (process.env.DEBUG_I18N === 'true') {
      console.log('[Document] Initializing with locale:', ctx.locale || 'undefined');
    }
    
    return { ...initialProps };
  }

  render() {
    const currentLocale = this.props.__NEXT_DATA__.locale || i18n?.defaultLocale || 'en';
    
    return (
      <Html lang={currentLocale}>
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#6366f1" />
          <link rel="icon" href="/favicon.ico" />
          
          {/* Preconnect to current origin for faster resource loading */}
          <link 
            rel="preconnect" 
            href={typeof window !== 'undefined' ? window.location.origin : '/'}
          />
          
          {/* Preload locale files with higher priority */}
          <link 
            rel="preload" 
            href={`/locales/${currentLocale}/common.json`} 
            as="fetch" 
            crossOrigin="anonymous" 
            type="application/json"
            key="locale-preload"
          />
          
          {/* Provide fallback locale preload */}
          {currentLocale !== 'en' && (
            <link 
              rel="preload" 
              href="/locales/en/common.json" 
              as="fetch" 
              crossOrigin="anonymous" 
              type="application/json"
              key="fallback-locale-preload"
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
          
          {/* Script to validate translations loaded */}
          <script 
            dangerouslySetInnerHTML={{ 
              __html: `
                // Check if translations loaded correctly
                if (window.location.pathname === '/' && !window.__NEXT_DATA__.props?.initialI18nStore) {
                  console.warn('Translations not loaded in initial props, attempting reload');
                  setTimeout(() => {
                    window.location.reload();
                  }, 3000);
                }
              `
            }} 
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
