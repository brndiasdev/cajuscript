'use server';

import {
  Company,
  ProcessedCompany,
  SearchConfig,
} from '@/types/company';
import { parseExcelFile } from '@/utils/excelParser';

export async function processCompanies(
  companies: Company[],
  config: SearchConfig
): Promise<ProcessedCompany[]> {
  const results: ProcessedCompany[] = [];
  const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  console.log( 'apiBaseUrl', apiBaseUrl );
  for ( const company of companies ) {
    try {
      if ( results.length > 0 ) {
        await new Promise(( resolve ) =>
          setTimeout( resolve, config.searchDelay )
        );
      }

      const formData = new FormData();
      formData.append(
        'file',
        new Blob([company.empresa], { type: 'text/plain' })
      );
      formData.append( 'apiKey', config.apiKey );
      formData.append(
        'searchEngineId',
        config.searchEngineId
      );
      formData.append(
        'maxLinksPerCompany',
        config.maxLinksPerCompany.toString()
      );
      formData.append(
        'searchDelay',
        config.searchDelay.toString()
      );

      const apiUrl = `${apiBaseUrl}/api/search`;
      const searchResults = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      });

      if ( !searchResults.ok ) {
        throw new Error(
          `Failed to fetch search results: ${searchResults.statusText}`
        );
      }

      const {
        results: [searchResult],
      } = await searchResults.json();

      results.push({
        ...company,
        links: searchResult.links,
        status: searchResult.status,
        message: searchResult.message,
      });
    } catch ( error ) {
      results.push({
        ...company,
        links: [],
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : String( error ),
      });
    }
  }

  return results;
}

export async function processExcelFile(
  formData: FormData
): Promise<ProcessedCompany[]> {
  try {
    const file = formData.get( 'file' ) as File;
    const apiKey = formData.get( 'apiKey' ) as string;
    const searchEngineId = formData.get(
      'searchEngineId'
    ) as string;
    const maxLinksPerCompanyStr = formData.get(
      'maxLinksPerCompany'
    ) as string;
    const searchDelayStr = formData.get(
      'searchDelay'
    ) as string;

    if ( !file || !apiKey || !searchEngineId ) {
      throw new Error( 'Missing required parameters' );
    }

    const maxLinksPerCompany =
      parseInt( maxLinksPerCompanyStr ) || 4;
    const searchDelay = parseInt( searchDelayStr ) || 500;

    const companies = await parseExcelFile( file );

    if ( companies.length === 0 ) {
      throw new Error(
        'No companies found in the Excel file'
      );
    }

    return await processCompanies( companies, {
      apiKey,
      searchEngineId,
      maxLinksPerCompany,
      searchDelay,
    });
  } catch ( error ) {
    console.error( 'Error processing Excel file:', error );
    throw error;
  }
}
