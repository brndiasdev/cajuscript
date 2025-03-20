import { useTranslations } from 'next-intl';
import { DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface LogDisplayProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export default function LogDisplay({ logs, onClearLogs }: LogDisplayProps ) {
  const t = useTranslations( 'log' );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">{t( 'title' )}</h2>
        </div>

        <button
          onClick={onClearLogs}
          className="flex items-center text-sm text-gray-500 hover:text-error"
          disabled={logs.length === 0}
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          {t( 'clear' )}
        </button>
      </div>

      <div className="bg-gray-800 text-gray-200 font-mono text-sm p-4 rounded-md h-60 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet</p>
        ) : (
          logs.map(( log, index ) => (
            <div key={index}
              className="mb-1">
              <span className={`
                ${log.type === 'info' ? 'text-blue-400' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'warning' ? 'text-yellow-400' : ''}
              `}>
                [{log.timestamp}]
              </span>
              <span className="ml-2">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
