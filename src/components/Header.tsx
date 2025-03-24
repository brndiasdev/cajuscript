import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const t = useTranslations( 'app' );

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="h-8 w-8 text-primary mr-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <Link href="/"
                  className="text-primary hover:text-primary-700">
                  <span className="text-primary">Caju</span>
                  <span className="text-secondary">Script</span>
                </Link>
              </h1>
              <p className="text-sm text-gray-600">{t( 'subtitle' )}</p>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link
              href="/br"
              className="text-gray-600 hover:text-primary text-sm font-medium"
            >
              Português
            </Link>
            <Link
              href="/en"
              className="text-gray-600 hover:text-primary text-sm font-medium"
            >
              English
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
