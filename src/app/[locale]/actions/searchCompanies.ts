'use server';

import { searchCompany } from '@/utils/googleSearch';
import {
  Company,
  ProcessedCompany,
  SearchConfig,
} from '@/types/company';
import { parseExcelFile } from '@/utils/excelParser';

/**
 * Server action to process a list of companies and search for relevant links
 * @param companies Array of companies to search for
 * @param config Search configuration
 * @returns Array of processed companies with search results
 */
export async function processCompanies(
  companies: Company[],
  config: SearchConfig
): Promise<ProcessedCompany[]> {
  const results: ProcessedCompany[] = [];

  for ( const company of companies ) {
    try {
      // Add a delay between requests to avoid rate limiting
      if ( results.length > 0 ) {
        await new Promise(( resolve ) =>
          setTimeout( resolve, config.searchDelay )
        );
      }

      // Perform the search for this company
      const searchResults = await searchCompany(
        company.empresa,
        config
      );

      // Add the processed company to results
      results.push({
        ...company,
        links: searchResults,
        status: 'complete',
      });
    } catch ( error ) {
      // Handle errors for individual companies
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

/**
 * Server action to process an uploaded Excel file
 * @param formData Form data containing the Excel file and configuration
 * @returns Array of processed companies with search results
 */
export async function processExcelFile(
  formData: FormData
): Promise<ProcessedCompany[]> {
  try {
    // Extract file and configuration from form data
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

    // Validate inputs
    if ( !file || !apiKey || !searchEngineId ) {
      throw new Error( 'Missing required parameters' );
    }

    // Parse numeric values with defaults
    const maxLinksPerCompany =
      parseInt( maxLinksPerCompanyStr ) || 4;
    const searchDelay = parseInt( searchDelayStr ) || 500;

    // Parse the Excel file
    const companies = await parseExcelFile( file );

    if ( companies.length === 0 ) {
      throw new Error(
        'No companies found in the Excel file'
      );
    }

    // Process companies with the provided configuration
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
