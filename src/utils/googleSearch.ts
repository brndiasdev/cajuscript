import axios from 'axios';
import { SearchResult, SearchConfig } from '@/types/company';
import { BLACKLISTED_DOMAINS } from '@/constants/blacklist';

/**
 * Performs a Google search for a company name and returns relevant results
 * @param companyName The name of the company to search for
 * @param config Search configuration parameters
 * @returns An array of search results
 */
export async function searchCompany(
  companyName: string,
  config: SearchConfig
): Promise<SearchResult[]> {
  try {
    const { apiKey, searchEngineId, maxLinksPerCompany } =
      config;

    // Perform the search using Google Custom Search API
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: companyName,
          num: 10, // Request more results than needed to account for filtered items
        },
      }
    );

    // Extract and filter search results
    const results = response.data.items || [];
    if (!results.length) {
      console.warn(`No results found for "${companyName}"`);
      return [];
    }

    const filteredResults = filterResults( results );
    if (!filteredResults.length) {
      console.warn(`All results for "${companyName}" were filtered out`);
      return [];
    }

    // Return only the specified maximum number of links
    return filteredResults.slice( 0, maxLinksPerCompany );
  } catch ( error ) {
    console.error( 'Google search error:', error );
    // Return empty array instead of throwing error
    return [];
  }
}

/**
 * Filters search results to remove blacklisted domains
 * @param results Array of search results from Google API
 * @returns Filtered array of search results
 */
function filterResults( results: any[]): SearchResult[] {
  return results
    .filter(( item ) => {
      // Extract domain from URL
      try {
        const url = new URL( item.link );
        const domain = url.hostname.replace( /^www\./, '' );

        // Check if domain is in the blacklist
        return !BLACKLISTED_DOMAINS.some(
          ( blacklisted ) =>
            domain === blacklisted ||
            domain.endsWith( `.${blacklisted}` )
        );
      } catch {
        // If URL parsing fails, exclude the result
        return false;
      }
    })
    .map(( item ) => {
      // Extract domain for display
      let domain = '';
      try {
        const url = new URL( item.link );
        domain = url.hostname.replace( /^www\./, '' );
      } catch {
        domain = 'unknown';
      }

      return {
        title: item.title,
        link: item.link,
        snippet: item.snippet || '',
        domain,
      };
    });
}
