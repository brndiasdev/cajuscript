import { useTranslations } from 'next-intl';
import { ChartBarIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  status: 'waiting' | 'processing' | 'complete' | 'error' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  isEnabled: boolean;
}

export default function ProgressIndicator({
  current,
  total,
  status,
  onStart,
  onPause,
  onStop,
  isEnabled
}: ProgressIndicatorProps ) {
  const t = useTranslations( 'search' );

  // Calculate progress percentage
  const progressPercentage = total > 0 ? Math.round(( current / total ) * 100 ) : 0;

  // Determine status text
  let statusText = '';
  if ( status === 'waiting' ) {
    statusText = t( 'waiting' );
  } else if ( status === 'processing' ) {
    statusText = t( 'processing', { current, total });
  } else if ( status === 'complete' ) {
    statusText = t( 'complete' );
  } else if ( status === 'error' ) {
    statusText = t( 'error' );
  } else if ( status === 'paused' ) {
    statusText = 'Paused';
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">{t( 'progress' )}</h2>
      </div>

      <div className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'error' ? 'bg-error' :
                status === 'complete' ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status text */}
        <div className="text-center text-sm text-gray-600">
          <p>{statusText}</p>
          {status !== 'waiting' && (
            <p className="text-xs mt-1">
              {current} of {total} ({progressPercentage}%)
            </p>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={onStart}
            disabled={!isEnabled || status === 'processing' || status === 'complete'}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${
              !isEnabled || status === 'processing' || status === 'complete'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-success hover:bg-green-700 text-white'
            }`}
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            {t( 'start' )}
          </button>

          <button
            onClick={onPause}
            disabled={!isEnabled || status !== 'processing'}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${
              !isEnabled || status !== 'processing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-warning hover:bg-yellow-600 text-white'
            }`}
          >
            <PauseIcon className="h-4 w-4 mr-1" />
            {t( 'pause' )}
          </button>

          <button
            onClick={onStop}
            disabled={!isEnabled || status === 'waiting' || status === 'complete'}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${
              !isEnabled || status === 'waiting' || status === 'complete'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-error hover:bg-red-700 text-white'
            }`}
          >
            <StopIcon className="h-4 w-4 mr-1" />
            {t( 'stop' )}
          </button>
        </div>
      </div>
    </div>
  );
}
