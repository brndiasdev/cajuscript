import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const t = useTranslations('app')

  return (
    <header className="bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="mr-2 h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <Link
                  href="/"
                  className="text-primary hover:text-primary-700"
                >
                  <span className="pr-2 text-primary">
                    Script
                  </span>
                  <span className="text-secondary">
                    Automação
                  </span>
                </Link>
              </h1>
              <p className="text-sm text-gray-600">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="mt-4 flex space-x-4 md:mt-0">
            <Link
              href="/br"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Português
            </Link>
            <Link
              href="/en"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              English
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
