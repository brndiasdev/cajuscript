import { useTranslations } from 'next-intl';
import { ProcessedCompany } from '@/types/company';
import { LinkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ResultsTableProps {
  results: ProcessedCompany[];
}

export default function ResultsTable({ results }: ResultsTableProps ) {
  const t = useTranslations( 'results' );

  if ( results.length === 0 ) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">{t( 'noResults' )}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center mb-4">
        <LinkIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">{t( 'title' )}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t( 'company' )}
              </th>
              <th scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t( 'links' )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map(( company, index ) => (
              <tr key={index}
                className={company.status === 'error' ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {company.empresa}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {company.status === 'error' ? (
                    <div className="flex items-center text-error text-sm">
                      <ExclamationCircleIcon className="h-5 w-5 mr-1" />
                      <span>{company.message || 'Error processing company'}</span>
                    </div>
                  ) : company.links.length === 0 ? (
                    <p className="text-sm text-gray-500">No links found</p>
                  ) : (
                    <ul className="space-y-2">
                      {company.links.map(( link, linkIndex ) => (
                        <li key={linkIndex}
                          className="text-sm">
                          <a
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-700 hover:underline flex items-start"
                          >
                            <span className="inline-block w-5 flex-shrink-0">{linkIndex + 1}.</span>
                            <span>
                              <span className="font-medium">{link.domain}</span>
                              <span className="block text-xs text-gray-500 mt-1 line-clamp-2">{link.title}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
