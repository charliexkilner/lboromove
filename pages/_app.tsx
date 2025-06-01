import { appWithTranslation, useTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../contexts/AuthContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Import debug component dynamically to avoid SSR issues
const DebugInfo = dynamic(() => import('../components/DebugInfo'), { ssr: false });
// COMMENTED OUT: const TranslationLoader = dynamic(() => import('../components/TranslationLoader'), { ssr: false });
// COMMENTED OUT: const FallbackTranslationLoader = dynamic(() => import('../components/FallbackTranslationLoader'), { ssr: false });

function App({ Component, pageProps }: AppProps) {
  console.log('_app.tsx: Initial pageProps._nextI18Next:', JSON.stringify(pageProps._nextI18Next));
  const [showDebug, setShowDebug] = useState(false);
  const { i18n } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && i18n && i18n.changeLanguage) {
      const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
      i18n.changeLanguage = (lng: any, callback: any) => {
        console.warn(`MonkeyPatch: i18n.changeLanguage CALLED WITH '${lng}'`);
        console.trace();
        return originalChangeLanguage(lng, callback);
      };
      return () => {
        i18n.changeLanguage = originalChangeLanguage;
      };
    }
  }, [i18n]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
          },
        },
      })
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Component {...pageProps} key={router.locale} />
          <Toaster />
          {showDebug && <DebugInfo />}
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(App);
