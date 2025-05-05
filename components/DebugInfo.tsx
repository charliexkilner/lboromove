import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';

export default function DebugInfo() {
  const { t, ready } = useTranslation('common');
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [translationSample, setTranslationSample] = useState<any>(null);

  useEffect(() => {
    // Check database connection
    fetch('/api/debug/database')
      .then(res => res.json())
      .then(data => {
        setDbStatus(data.connected ? 'connected' : 'error');
        if (data.error) setErrorMessage(data.error);
      })
      .catch(err => {
        setDbStatus('error');
        setErrorMessage(err.message);
      });
    
    // Collect translation samples
    if (ready) {
      setTranslationSample({
        'navbar.houses': t('navbar.houses'),
        'tabs.allHouses': t('tabs.allHouses'),
        'hero.title': t('hero.title'),
        'searchBar.bedrooms': t('searchBar.bedrooms'),
      });
    }
  }, [ready, t]);

  return (
    <div className="fixed bottom-0 right-0 bg-white p-4 border shadow-lg max-w-md z-50 text-xs overflow-auto max-h-96">
      <h3 className="font-bold mb-2">Debug Info</h3>
      
      <div className="mb-2">
        <p><strong>i18n Status:</strong> {ready ? 'Ready' : 'Not Ready'}</p>
        {translationSample && (
          <div>
            <p className="mt-1"><strong>Translation Samples:</strong></p>
            <pre className="bg-gray-100 p-1 mt-1">
              {JSON.stringify(translationSample, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p>
          <strong>Database:</strong> 
          {dbStatus === 'loading' && 'Checking...'}
          {dbStatus === 'connected' && '✅ Connected'}
          {dbStatus === 'error' && '❌ Error'}
        </p>
        {errorMessage && (
          <p className="text-red-500 mt-1">{errorMessage}</p>
        )}
      </div>
      
      <button 
        onClick={() => window.location.reload()}
        className="bg-gray-200 px-2 py-1 rounded text-xs mt-2"
      >
        Reload
      </button>
    </div>
  );
} 