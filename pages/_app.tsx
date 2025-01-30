import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function App({ Component, pageProps }: AppProps) {
  // Move queryClient creation inside component to avoid hydration mismatch
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
            cacheTime: 1000 * 60 * 30, // Cache persists for 30 minutes
          },
        },
      })
  );

  return (
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
    </QueryClientProvider>
  );
}

export default appWithTranslation(App);
