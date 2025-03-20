import { useTranslations } from 'next-intl';
import {
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon
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

export default function ProgressIndicator({
  current,
  total,
  status,
  onStart,
  onPause,
  onStop,
  isEnabled
}: ProgressIndicatorProps) {
  const t = useTranslations('search');

  // Calculate progress percentage
  const progressPercentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isProcessing = status === 'processing';
  const isWaiting = status === 'waiting';
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isPaused = status === 'paused';

  // Determine status text and color
  const statusConfig = {
    waiting: { text: t('waiting'), color: 'bg-gray-400' },
    processing: { text: t('processing', { current, total }), color: 'bg-primary' },
    complete: { text: t('complete'), color: 'bg-success' },
    error: { text: t('error'), color: 'bg-error' },
    paused: { text: t('paused'), color: 'bg-warning' }
  };

  const { text: statusText, color: statusColor } = statusConfig[status];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">{t('progress')}</h2>
      </div>

      <div className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status text and loading indicator */}
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center">
            {isProcessing && (
              <ArrowPathIcon className="h-4 w-4 mr-2 text-primary animate-spin" />
            )}
            <p>{statusText}</p>
          </div>
          
          {status !== 'waiting' && (
            <p className="text-xs mt-1">
              {current} of {total} ({progressPercentage}%)
            </p>
          )}
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-center items-center space-x-2 my-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-500">{t('serverProcessing')}</span>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={onStart}
            disabled={!isEnabled || isProcessing || isComplete}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${
              !isEnabled || isProcessing || isComplete
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-success hover:bg-green-700 text-white'
            }`}
            aria-label={t('start')}
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            {t('start')}
          </button>

          <button
            onClick={onPause}
            disabled={!isEnabled || !isProcessing}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${
              !isEnabled || !isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-warning hover:bg-yellow-600 text-white'
            }`}
            aria-label={t('pause')}
          >
            <PauseIcon className="h-4 w-4 mr-1" />
            {t('pause')}
          </button>

          <button
            onClick={onStop}
            disabled={!isEnabled || isWaiting || isComplete}
            className={`flex items-center px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${
              !isEnabled || isWaiting || isComplete
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-error hover:bg-red-700 text-white'
            }`}
            aria-label={t('stop')}
          >
            <StopIcon className="h-4 w-4 mr-1" />
            {t('stop')}
          </button>
        </div>
      </div>
    </div>
  );
}
