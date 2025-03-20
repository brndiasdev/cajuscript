import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const t = useTranslations( 'app' );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <ExclamationTriangleIcon className="h-16 w-16 text-warning mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">404 - Página não encontrada</h1>
      <p className="text-gray-600 mb-8">A página que você está procurando não existe.</p>
      <Link
        href="/"
        className="flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-md font-medium text-sm transition-colors duration-200"
      >
        <HomeIcon className="h-4 w-4 mr-1" />
        Voltar ao início
      </Link>
    </div>
  );
}
