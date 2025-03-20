import { useTranslations } from 'next-intl';
import {
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  status: 'waiting' | 'processing' | 'complete' | 'error' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  isEnabled: boolean;
}

interface StatusConfig {
  text: string;
  color: string;
  icon: React.ReactNode;
  message?: string;
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

  const progressPercentage = total > 0 ? Math.round(( current / total ) * 100 ) : 0;
  const isProcessing = status === 'processing';
  const isWaiting = status === 'waiting';
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isPaused = status === 'paused';

  const statusConfig: Record<string, StatusConfig> = {
    waiting: {
      text: t( 'waiting' ),
      color: 'bg-gray-400',
      icon: <ChartBarIcon className="h-6 w-6 text-gray-400 mr-2" />
    },
    processing: {
      text: t( 'processing', { current, total }),
      color: 'bg-primary',
      icon: <ArrowPathIcon className="h-6 w-6 text-primary mr-2 animate-spin" />
    },
    complete: {
      text: t( 'complete' ),
      color: 'bg-success',
      icon: <ChartBarIcon className="h-6 w-6 text-success mr-2" />
    },
    error: {
      text: t( 'error' ),
      color: 'bg-error animate-pulse',
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-error mr-2 animate-bounce" />,
      message: t( 'errorHelp' )
    },
    paused: {
      text: t( 'paused' ),
      color: 'bg-warning bg-stripes bg-stripes-yellow-100',
      icon: <PauseIcon className="h-6 w-6 text-warning mr-2 animate-pulse" />,
      message: t( 'pausedHelp' )
    }
  };

  const { text: statusText, color: statusColor, icon: statusIcon, message } = statusConfig[status];

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${isError ? 'border-2 border-error animate-shake-x' : ''}`}>
      <div className="flex items-center mb-4">
        {statusIcon}
        <h2 className="text-xl font-semibold text-gray-800">{t( 'progress' )}</h2>
      </div>

      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-2">
            {isProcessing && (
              <ArrowPathIcon className="h-4 w-4 text-primary animate-spin" />
            )}
            <p className={`font-medium ${isError ? 'text-error' : ''} ${isPaused ? 'text-warning' : ''}`}>
              {statusText}
            </p>
            {isError && (
              <ExclamationTriangleIcon className="h-4 w-4 text-error animate-pulse" />
            )}
          </div>

          {message && (
            <p className={`text-xs mt-1 ${isError ? 'text-error' : 'text-warning'} animate-fade-in-up`}>
              {message}
            </p>
          )}

          {status !== 'waiting' && (
            <p className="text-xs mt-1">
              {current} of {total} ({progressPercentage}%)
            </p>
          )}
        </div>

        {isError && (
          <div className="flex justify-center items-center space-x-2 my-2">
            <div className="flex space-x-1 animate-pulse">
              <ExclamationTriangleIcon className="w-4 h-4 text-error" />
              <ExclamationTriangleIcon className="w-4 h-4 text-error delay-75" />
              <ExclamationTriangleIcon className="w-4 h-4 text-error delay-150" />
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={onStart}
            disabled={!isEnabled || isProcessing || isComplete}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${!isEnabled || isProcessing || isComplete
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-success hover:bg-green-700 text-white'
            }`}
            aria-label={t( 'start' )}
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            {t( 'start' )}
          </button>

          <button
            onClick={onPause}
            disabled={!isEnabled || !isProcessing}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${!isEnabled || !isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-warning hover:bg-yellow-600 text-white'
            }`}
            aria-label={t( 'pause' )}
          >
            <PauseIcon className="h-4 w-4 mr-1" />
            {t( 'pause' )}
          </button>

          <button
            onClick={onStop}
            disabled={!isEnabled || isWaiting || isComplete}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${!isEnabled || isWaiting || isComplete
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-error hover:bg-red-700 text-white'
            }`}
            aria-label={t( 'stop' )}
          >
            <StopIcon className="h-4 w-4 mr-1" />
            {t( 'stop' )}
          </button>
        </div>
      </div>
    </div>
  );
}
