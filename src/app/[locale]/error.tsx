'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error( error );
  }, [error]);

  const t = useTranslations( 'app' );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <ExclamationCircleIcon className="h-16 w-16 text-error mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ocorreu um erro</h1>
      <p className="text-gray-600 mb-2">Desculpe, algo deu errado ao processar sua solicitação.</p>
      <p className="text-gray-500 text-sm mb-8">{error.message}</p>
      <button
        onClick={reset}
        className="flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-md font-medium text-sm transition-colors duration-200"
      >
        <ArrowPathIcon className="h-4 w-4 mr-1" />
        Tentar novamente
      </button>
    </div>
  );
}
