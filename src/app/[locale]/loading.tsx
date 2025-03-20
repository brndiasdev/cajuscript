import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="text-center">
        <ArrowPathIcon className="w-16 h-16 text-primary mx-auto animate-spin" />
        <p className="mt-4 text-lg font-medium text-gray-700">Carregando...</p>
      </div>
    </div>
  );
}
