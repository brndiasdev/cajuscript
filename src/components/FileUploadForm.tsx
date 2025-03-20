import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FileUploadFormProps {
  onFileSelect: ( file: File ) => void;
  isProcessing: boolean;
}

export default function FileUploadForm({
  onFileSelect,
  isProcessing
}: FileUploadFormProps ) {
  const t = useTranslations( 'upload' );
  const [selectedFile, setSelectedFile] = useState<File | null>( null );
  const [error, setError] = useState<string | null>( null );
  const fileInputRef = useRef<HTMLInputElement>( null );

  const handleFileChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    setError( null );
    const files = e.target.files;

    if ( !files || files.length === 0 ) {
      setSelectedFile( null );
      return;
    }

    const file = files[0];

    // Check if it's an Excel file
    if ( !file.name.endsWith( '.xlsx' ) && !file.name.endsWith( '.xls' )) {
      setError( 'Please upload an Excel file (.xlsx or .xls)' );
      setSelectedFile( null );
      return;
    }

    setSelectedFile( file );
    onFileSelect( file );
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <DocumentArrowUpIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">{t( 'title' )}</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors duration-200">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx,.xls"
            disabled={isProcessing}
          />

          <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mb-2" />

          {selectedFile ? (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {( selectedFile.size / 1024 ).toFixed( 2 )} KB
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t( 'noFileSelected' )}</p>
          )}

          <button
            onClick={handleButtonClick}
            className="mt-4 px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
            disabled={isProcessing}
          >
            {t( 'select' )}
          </button>
        </div>

        {error && (
          <div className="flex items-center text-error text-sm mt-1">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-gray-500 italic">
          {t( 'fileFormat' )}
        </p>
      </div>
    </div>
  );
}
