import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../contexts/AuthContext';
import dynamic from 'next/dynamic';

// Import debug component dynamically to avoid SSR issues
const DebugInfo = dynamic(() => import('../components/DebugInfo'), { ssr: false });
// Import TranslationLoader dynamically to avoid SSR issues
const TranslationLoader = dynamic(() => import('../components/TranslationLoader'), { ssr: false });

function App({ Component, pageProps }: AppProps) {
  const [showDebug, setShowDebug] = useState(false);
  // Move queryClient creation inside component to avoid hydration mismatch
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
            gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes (use gcTime instead of cacheTime)
          },
        },
      })
  );

  // Enable debug panel with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Force i18n initialization on client side
  useEffect(() => {
    // This is a no-op effect that ensures i18n is properly initialized
    console.log('Ensuring i18n initialization');
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TranslationLoader />
          <Component {...pageProps} />
          <Toaster />
          {showDebug && <DebugInfo />}
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(App);
