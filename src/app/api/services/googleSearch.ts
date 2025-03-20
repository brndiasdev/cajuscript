import axios from 'axios';
import { SearchResult, SearchConfig } from '@/types/company';
import { BLACKLISTED_DOMAINS } from '@/constants/blacklist';

const API_ENDPOINT =
  'https://www.googleapis.com/customsearch/v1';
const MAX_API_RESULTS = 10;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RESULTS_PER_COMPANY = 4;

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
    const normalizedName = companyName
      .toLowerCase()
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' )
      .replace( /\s+/g, '' )
      .replace( /[&-]/g, '' );

    return [
      `${normalizedName}.com.br`,
      `${normalizedName}.com`,
      `${normalizedName}.net.br`,
      `${normalizedName}.net`,
      `${normalizedName}.br`,
      `${normalizedName}.org.br`,
      `${normalizedName}.org`,
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
    const normalizedName = companyName
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' );

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

    const domainGuesses =
      this.generateDomainGuesses( companyName );
    const domainQueries = domainGuesses.map(
      ( domain ) => `site:${domain} ${exactName}`
    );

    return [
      ...domainQueries,
      `${exactName} site oficial site:.br ${baseFilters}`,
      `${exactName} homepage site:.br ${baseFilters}`,
      `${exactName} website oficial ${baseFilters}`,
      `${exactName} "contato" site:.br ${baseFilters}`,
      `${normalizedName} engenharia site oficial site:.br ${baseFilters}`,
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
      gl: 'br',
      lr: 'lang_pt',
      fields: 'items(title,link,snippet),searchInformation',
      start: 1,
    };

    try {
      const response =
        await axios.get<GoogleSearchResponse>(
          API_ENDPOINT,
          { params, timeout: 15000 }
        );

      if ( response.data.error ) {
        return [];
      }

      if (
        !response.data.items ||
        response.data.items.length === 0
      ) {
        return [];
      }

      return (
        response.data.items.filter(
          ( item ) => item.link && item.title
        ) || []
      );
    } catch ( error ) {
      if ( axios.isAxiosError( error )) {
        if (
          this.isRateLimitError( error ) &&
          retryCount < MAX_RETRIES
        ) {
          await this.delayWithJitter( retryCount );
          return this.executeSearchQuery(
            query,
            retryCount + 1
          );
        }
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
      return true;
    }
  }

  private normalizeAndRankResults(
    results: SearchResult[],
    companyName: string
  ): SearchResult[] {
    if ( results.length === 0 ) {
      return [];
    }

    const normalizedCompanyName = companyName
      .toLowerCase()
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' )
      .replace( /\s+/g, '' );

    const scoredResults = results
      .map(( result ) => {
        const domain = result.domain.toLowerCase();
        const normalizedDomain = domain.replace(
          /^www\./,
          ''
        );

        let score = 0;

        if (
          normalizedDomain.includes( normalizedCompanyName )
        ) {
          score += 200;
        }

        if ( domain.endsWith( '.com.br' )) {
          score += 80;
        } else if ( domain.endsWith( '.br' )) {
          score += 60;
        } else if ( domain.endsWith( '.com' )) {
          score += 40;
        }

        if (
          result.title
            .toLowerCase()
            .includes( companyName.toLowerCase())
        ) {
          score += 50;
        }

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
          score += 50;
        }
        if (
          officialTerms.some(( term ) =>
            result.snippet?.toLowerCase().includes( term )
          )
        ) {
          score += 30;
        }

        if (
          domain.includes( 'facebook' ) ||
          domain.includes( 'instagram' ) ||
          domain.includes( 'linkedin' ) ||
          domain.includes( 'twitter' )
        ) {
          score -= 100;
        }

        const domainGuesses =
          this.generateDomainGuesses( companyName );
        if (
          domainGuesses.some(
            ( guess ) => normalizedDomain === guess
          )
        ) {
          score += 500;
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

  private generateFallbackURL( companyName: string ): string {
    const normalizedName = companyName
      .toLowerCase()
      .normalize( 'NFD' )
      .replace( /[\u0300-\u036f]/g, '' )
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
        const response = await axios.head( url, {
          timeout: 5000,
          validateStatus: ( status ) => status < 500,
        });

        if ( response.status < 400 ) {
          results.push({
            title: `${companyName} - Site Oficial`,
            link: url,
            snippet: `Site oficial da empresa ${companyName}.`,
            domain: domain,
          });
          break;
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
    if (
      !this.config.apiKey ||
      !this.config.searchEngineId
    ) {
      return [];
    }

    const queries = this.generateSearchQueries( companyName );
    const allResults: SearchResult[] = [];
    let validResultCount = 0;

    for ( const query of queries ) {
      if ( validResultCount >= MAX_RESULTS_PER_COMPANY ) {
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
          allResults.push( ...filteredItems );

          const uniqueDomains = new Set(
            allResults.map(( item ) => item.domain )
          );
          validResultCount = uniqueDomains.size;
        }
      } catch ( error ) {
        console.error(
          `Error executing search query ${query}:`,
          error
        );
        continue;
      }
    }

    if ( allResults.length === 0 ) {
      const directResults =
        await this.fallbackDirectDomainCheck( companyName );
      if ( directResults.length > 0 ) {
        allResults.push( ...directResults );
      }
    }

    if ( allResults.length === 0 ) {
      const fallbackURL =
        this.generateFallbackURL( companyName );
      allResults.push({
        title: `${companyName} - Site Sugerido`,
        link: fallbackURL,
        snippet: `Endereço sugerido para a empresa ${companyName}.`,
        domain: new URL( fallbackURL ).hostname,
      });
    }

    const uniqueResultsMap = new Map<string, SearchResult>();
    allResults.forEach(( item ) => {
      if ( !uniqueResultsMap.has( item.link )) {
        uniqueResultsMap.set( item.link, item );
      }
    });

    const uniqueResults = Array.from(
      uniqueResultsMap.values()
    );

    const rankedResults = this.normalizeAndRankResults(
      uniqueResults,
      companyName
    );

    const finalResults = rankedResults.slice(
      0,
      this.config.maxLinksPerCompany
    );

    return finalResults;
  }
}
