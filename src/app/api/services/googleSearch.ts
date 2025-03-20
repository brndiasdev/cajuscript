import axios from 'axios';
import { SearchResult, SearchConfig } from '@/types/company';
import { BLACKLISTED_DOMAINS } from '@/constants/blacklist';

const API_ENDPOINT =
  'https://www.googleapis.com/customsearch/v1';
const MAX_API_RESULTS = 10;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RESULTS_PER_COMPANY = 4; // New constant for limiting results

interface GoogleSearchResult {
  readonly title: string
  readonly link: string
  readonly snippet: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[]
  error?: {
    code: number
    message: string
  }
  searchInformation?: {
    totalResults: string
  }
}

export class GoogleSearchService {
  private readonly config: SearchConfig;

  constructor( config: SearchConfig ) {
    this.config = config;
  }

  private generateDomainGuesses(
    companyName: string
  ): string[] {
    // Clean company name for domain usage
    const normalizedName = companyName
      .toLowerCase()
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' ) // Remove accents
      .replace( /\s+/g, '' )
      .replace( /[&-]/g, '' );

    // Generate common domain patterns
    return [
      `${normalizedName}.com.br`,
      `${normalizedName}.com`,
      `${normalizedName}.net.br`,
      `${normalizedName}.net`,
      `${normalizedName}.br`,
      `${normalizedName}.org.br`,
      `${normalizedName}.org`,
      // Add variants with hyphen if original has multiple words
      ...( companyName.includes( ' ' )
        ? [
          `${companyName.toLowerCase().replace( /\s+/g, '-' )}.com.br`,
          `${companyName.toLowerCase().replace( /\s+/g, '-' )}.com`,
          `${companyName.toLowerCase().replace( /\s+/g, '-' )}.br`,
        ]
        : []),
    ];
  }

  private generateSearchQueries(
    companyName: string
  ): string[] {
    // Create a version without accents for more accurate matching
    const normalizedName = companyName
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' );

    // Create exact match for company name
    const exactName = `"${companyName}"`;
    const baseFilters = [
      '-site:google.*',
      '-site:youtube.*',
      '-site:facebook.*',
      '-site:instagram.*',
      '-site:linkedin.*',
      '-site:twitter.*',
      '-filetype:pdf',
      '-ext:pdf',
    ].join( ' ' );

    // Generate domain guesses for direct site searches
    const domainGuesses =
      this.generateDomainGuesses( companyName );
    const domainQueries = domainGuesses.map(
      ( domain ) => `site:${domain} ${exactName}`
    );

    // Add general queries
    return [
      // Start with direct domain queries (highest priority)
      ...domainQueries,

      // Then try more general searches
      `${exactName} site oficial site:.br ${baseFilters}`,
      `${exactName} homepage site:.br ${baseFilters}`,
      `${exactName} website oficial ${baseFilters}`,
      `${exactName} "contato" site:.br ${baseFilters}`,
      `${normalizedName} engenharia site oficial site:.br ${baseFilters}`, // Specific for engineering companies
    ];
  }

  private async executeSearchQuery(
    query: string,
    retryCount = 0
  ): Promise<GoogleSearchResult[]> {
    const params = {
      key: this.config.apiKey,
      cx: this.config.searchEngineId,
      q: query,
      num: Math.min(
        this.config.maxLinksPerCompany,
        MAX_API_RESULTS
      ),
      gl: 'br', // Geolocation set to Brazil
      lr: 'lang_pt', // Language restriction to Portuguese
      fields: 'items(title,link,snippet),searchInformation', // Explicitly request fields
      start: 1, // Start from the first result
    };

    try {
      console.log( `Executing search query: ${query}` );

      const response =
        await axios.get<GoogleSearchResponse>(
          API_ENDPOINT,
          { params, timeout: 15000 }
        );

      if ( response.data.error ) {
        console.error(
          `API Error: ${response.data.error.code} - ${response.data.error.message}`
        );
        return [];
      }

      if (
        !response.data.items ||
        response.data.items.length === 0
      ) {
        console.log(
          `No results found for query: "${query}"`
        );
        return [];
      }

      console.log(
        `Found ${response.data.items.length} results for query: "${query}"`
      );
      return (
        response.data.items.filter(
          ( item ) => item.link && item.title
        ) || []
      );
    } catch ( error ) {
      if ( axios.isAxiosError( error )) {
        console.error( `Axios error for query "${query}":`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        });

        if (
          this.isRateLimitError( error ) &&
          retryCount < MAX_RETRIES
        ) {
          console.log(
            `Rate limit hit, retrying (${retryCount + 1}/${MAX_RETRIES})...`
          );
          await this.delayWithJitter( retryCount );
          return this.executeSearchQuery(
            query,
            retryCount + 1
          );
        }
      } else {
        console.error(
          `Non-Axios error for query "${query}":`,
          error
        );
      }

      return [];
    }
  }

  private isRateLimitError( error: unknown ): boolean {
    return (
      axios.isAxiosError( error ) &&
      ( error.response?.status === 429 ||
        error.response?.status === 403 )
    );
  }

  private async delayWithJitter(
    retryCount: number
  ): Promise<void> {
    const delay =
      INITIAL_RETRY_DELAY_MS * 2 ** retryCount +
      Math.random() * 500;
    return new Promise(( resolve ) =>
      setTimeout( resolve, delay )
    );
  }

  private isBlacklistedDomain( link: string ): boolean {
    try {
      const url = new URL( link );
      const domain = url.hostname
        .replace( /^www\./, '' )
        .toLowerCase();

      // Enhanced blacklist check to eliminate common non-company websites
      const commonPlatforms = [
        'google.com',
        'facebook.com',
        'instagram.com',
        'linkedin.com',
        'twitter.com',
        'youtube.com',
        'support.google',
        'maps.google',
      ];

      if (
        commonPlatforms.some(( platform ) =>
          domain.includes( platform )
        )
      ) {
        return true;
      }

      return BLACKLISTED_DOMAINS.some(( d ) =>
        domain.includes( d.toLowerCase())
      );
    } catch {
      console.warn( `Invalid URL: ${link}` );
      return true;
    }
  }

  private normalizeAndRankResults(
    results: SearchResult[],
    companyName: string
  ): SearchResult[] {
    if ( results.length === 0 ) {
      console.warn(
        `No results to rank for company: ${companyName}`
      );
      return [];
    }

    // Process company name for matching
    const normalizedCompanyName = companyName
      .toLowerCase()
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' ) // Remove accents
      .replace( /\s+/g, '' );

    // Score and rank results
    const scoredResults = results
      .map(( result ) => {
        const domain = result.domain.toLowerCase();
        const normalizedDomain = domain.replace(
          /^www\./,
          ''
        );

        // Calculate a relevance score
        let score = 0;

        // Highest priority: direct domain match
        if (
          normalizedDomain.includes( normalizedCompanyName )
        ) {
          score += 200; // Increased weight for direct domain match
        }

        // Domain TLD priorities
        if ( domain.endsWith( '.com.br' )) {
          score += 80; // Higher weight for Brazilian commercial domains
        } else if ( domain.endsWith( '.br' )) {
          score += 60;
        } else if ( domain.endsWith( '.com' )) {
          score += 40;
        }

        // Title contains company name exactly
        if (
          result.title
            .toLowerCase()
            .includes( companyName.toLowerCase())
        ) {
          score += 50; // Increased weight for title match
        }

        // Official site indicators in title or snippet
        const officialTerms = [
          'oficial',
          'official',
          'homepage',
          'home',
          'site oficial',
        ];
        if (
          officialTerms.some(( term ) =>
            result.title.toLowerCase().includes( term )
          )
        ) {
          score += 50; // Higher weight for official indicators
        }
        if (
          officialTerms.some(( term ) =>
            result.snippet?.toLowerCase().includes( term )
          )
        ) {
          score += 30;
        }

        // Penalize for common non-company domains that might slip through
        if (
          domain.includes( 'facebook' ) ||
          domain.includes( 'instagram' ) ||
          domain.includes( 'linkedin' ) ||
          domain.includes( 'twitter' )
        ) {
          score -= 100;
        }

        // Direct domain exact match (before www or subdomain)
        const domainGuesses =
          this.generateDomainGuesses( companyName );
        if (
          domainGuesses.some(
            ( guess ) => normalizedDomain === guess
          )
        ) {
          score += 500; // Very high priority for exact domain match
        }

        return {
          ...result,
          score,
        };
      })
      .sort(
        ( a, b ) => ( b.score as number ) - ( a.score as number )
      );

    return scoredResults.map(
      ({ score: _score, ...rest }) => ( void _score, rest )
    );
  }

  // Simple function to generate a fallback URL for a company
  private generateFallbackURL( companyName: string ): string {
    const normalizedName = companyName
      .toLowerCase()
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' ) // Remove accents
      .replace( /\s+/g, '' )
      .replace( /[^a-z0-9]/g, '' );

    return `https://${normalizedName}.com.br`;
  }

  private async fallbackDirectDomainCheck(
    companyName: string
  ): Promise<SearchResult[]> {
    const domainGuesses =
      this.generateDomainGuesses( companyName );
    const results: SearchResult[] = [];

    for ( const domain of domainGuesses ) {
      const url = `https://${domain}`;
      try {
        // Just check if the domain exists with a HEAD request
        const response = await axios.head( url, {
          timeout: 5000,
          validateStatus: ( status ) => status < 500, // Accept any non-server error
        });

        if ( response.status < 400 ) {
          // Domain exists and responds
          results.push({
            title: `${companyName} - Site Oficial`,
            link: url,
            snippet: `Site oficial da empresa ${companyName}.`,
            domain: domain,
          });
          console.log(
            `Found valid domain through direct check: ${url}`
          );
          break; // Stop after finding the first valid domain
        }
      } catch ( error ) {
        console.error(
          `Error checking domain ${domain}:`,
          error
        );
        continue;
      }
    }

    return results;
  }

  public async searchCompany(
    companyName: string
  ): Promise<SearchResult[]> {
    console.log(
      `Starting search for company: ${companyName}`
    );

    // Validate API configuration
    if (
      !this.config.apiKey ||
      !this.config.searchEngineId
    ) {
      console.error( 'Missing API Key or Search Engine ID' );
      return [];
    }

    const queries = this.generateSearchQueries( companyName );
    console.log(
      `Generated ${queries.length} search queries`
    );

    // Execute queries one at a time to avoid rate limiting
    const allResults: SearchResult[] = [];
    let validResultCount = 0; // To track how many valid results we've found

    // Only process queries until we reach our target number of results
    for ( const query of queries ) {
      // Check if we already have enough results
      if ( validResultCount >= MAX_RESULTS_PER_COMPANY ) {
        console.log(
          `Already found ${validResultCount} valid results, stopping search`
        );
        break;
      }

      try {
        const items = await this.executeSearchQuery( query );

        const filteredItems = items
          .filter(
            ( item ) => !this.isBlacklistedDomain( item.link )
          )
          .map(( item ) => ({
            title: item.title || 'Sem título',
            link: item.link,
            snippet: item.snippet || '',
            domain: new URL( item.link ).hostname,
          }));

        if ( filteredItems.length > 0 ) {
          console.log(
            `Found ${filteredItems.length} valid results for query: "${query}"`
          );
          allResults.push( ...filteredItems );

          // Count unique domains to determine when to stop
          const uniqueDomains = new Set(
            allResults.map(( item ) => item.domain )
          );
          validResultCount = uniqueDomains.size;

          console.log(
            `Current unique domain count: ${validResultCount}`
          );
        }
      } catch ( error ) {
        console.error(
          `Search error for ${companyName} with query "${query}":`,
          error
        );
      }
    }

    // If no results from Google, try direct domain checks
    if ( allResults.length === 0 ) {
      console.log(
        `No results from Google search, trying direct domain checks`
      );
      const directResults =
        await this.fallbackDirectDomainCheck( companyName );
      if ( directResults.length > 0 ) {
        allResults.push( ...directResults );
      }
    }

    console.log(
      `Total results before deduplication: ${allResults.length}`
    );

    // If still no results, provide a fallback suggestion
    if ( allResults.length === 0 ) {
      const fallbackURL =
        this.generateFallbackURL( companyName );
      console.log(
        `No results found, providing fallback URL: ${fallbackURL}`
      );
      allResults.push({
        title: `${companyName} - Site Sugerido`,
        link: fallbackURL,
        snippet: `Endereço sugerido para a empresa ${companyName}.`,
        domain: new URL( fallbackURL ).hostname,
      });
    }

    // Deduplicate results
    const uniqueResultsMap = new Map<string, SearchResult>();
    allResults.forEach(( item ) => {
      if ( !uniqueResultsMap.has( item.link )) {
        uniqueResultsMap.set( item.link, item );
      }
    });

    const uniqueResults = Array.from(
      uniqueResultsMap.values()
    );
    console.log(
      `Unique results after deduplication: ${uniqueResults.length}`
    );

    // Rank results by relevance to company name
    const rankedResults = this.normalizeAndRankResults(
      uniqueResults,
      companyName
    );

    // Return top results based on config
    const finalResults = rankedResults.slice(
      0,
      this.config.maxLinksPerCompany
    );
    console.log( `Final results: ${finalResults.length}` );

    return finalResults;
  }
}
