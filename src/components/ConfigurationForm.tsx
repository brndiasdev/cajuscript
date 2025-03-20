import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CogIcon } from '@heroicons/react/24/outline';

interface ConfigurationFormProps {
  apiKey: string;
  searchEngineId: string;
  maxLinksPerCompany: number;
  searchDelay: number;
  onConfigChange: ( config: {
    apiKey: string;
    searchEngineId: string;
    maxLinksPerCompany: number;
    searchDelay: number;
  }) => void;
}

export default function ConfigurationForm({
  apiKey,
  searchEngineId,
  maxLinksPerCompany,
  searchDelay,
  onConfigChange,
}: ConfigurationFormProps ) {
  const t = useTranslations( 'config' );

  const [localApiKey, setLocalApiKey] = useState( apiKey );
  const [localSearchEngineId, setLocalSearchEngineId] = useState( searchEngineId );
  const [localMaxLinks, setLocalMaxLinks] = useState( maxLinksPerCompany );
  const [localSearchDelay, setLocalSearchDelay] = useState( searchDelay );

  useEffect(() => {
    const storedApiKey = localStorage.getItem( 'google_api_key' );
    const storedSearchEngineId = localStorage.getItem( 'google_search_engine_id' );
    const storedMaxLinks = localStorage.getItem( 'max_links_per_company' );
    const storedSearchDelay = localStorage.getItem( 'search_delay' );

    if ( storedApiKey ) {setLocalApiKey( storedApiKey );}
    if ( storedSearchEngineId ) {setLocalSearchEngineId( storedSearchEngineId );}
    if ( storedMaxLinks ) {setLocalMaxLinks( parseInt( storedMaxLinks ));}
    if ( storedSearchDelay ) {setLocalSearchDelay( parseInt( storedSearchDelay ));}
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem( 'google_api_key', localApiKey );
    localStorage.setItem( 'google_search_engine_id', localSearchEngineId );
    localStorage.setItem( 'max_links_per_company', localMaxLinks.toString());
    localStorage.setItem( 'search_delay', localSearchDelay.toString());

    onConfigChange({
      apiKey: localApiKey,
      searchEngineId: localSearchEngineId,
      maxLinksPerCompany: localMaxLinks,
      searchDelay: localSearchDelay,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <CogIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">{t( 'title' )}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="apiKey"
            className="block text-sm font-medium text-gray-700 mb-1">
            {t( 'apiKey' )}
          </label>
          <input
            type="password"
            id="apiKey"
            value={localApiKey}
            onChange={( e ) => setLocalApiKey( e.target.value )}
            placeholder={t( 'enterApiKey' )}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="searchEngineId"
            className="block text-sm font-medium text-gray-700 mb-1">
            {t( 'searchEngineId' )}
          </label>
          <input
            type="text"
            id="searchEngineId"
            value={localSearchEngineId}
            onChange={( e ) => setLocalSearchEngineId( e.target.value )}
            placeholder={t( 'enterSearchEngine' )}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxLinks"
              className="block text-sm font-medium text-gray-700 mb-1">
              Max Links Per Company
            </label>
            <input
              type="number"
              id="maxLinks"
              value={localMaxLinks}
              onChange={( e ) => setLocalMaxLinks( parseInt( e.target.value ) || 4 )}
              min={1}
              max={10}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="searchDelay"
              className="block text-sm font-medium text-gray-700 mb-1">
              Search Delay (ms)
            </label>
            <input
              type="number"
              id="searchDelay"
              value={localSearchDelay}
              onChange={( e ) => setLocalSearchDelay( parseInt( e.target.value ) || 500 )}
              min={100}
              step={100}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          {t( 'save' )}
        </button>
      </div>
    </div>
  );
}
