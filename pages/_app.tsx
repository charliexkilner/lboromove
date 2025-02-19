import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

function App({ Component, pageProps }: AppProps) {
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

  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
          <Toaster
            position="bottom-center"
            toastOptions={{
              // Ensure consistent styling between server and client
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          <AuthModal />
        </QueryClientProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(App);
