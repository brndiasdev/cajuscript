import axios from 'axios';
import { SearchResult, SearchConfig } from '@/types/company';
import { BLACKLISTED_DOMAINS } from '@/constants/blacklist';

class GoogleSearchService {
  private config: SearchConfig;

  constructor(config: SearchConfig) {
    this.config = config;
  }

  private generateQueries(companyName: string): string[] {
    return [
      `${companyName} site:.br -google.com -youtube.com -twitter.com`,
      `${companyName} "contato" OR "fale conosco" -google.com`,
      `${companyName} (site:gov.br OR "site oficial")`,
    ];
  }

  private async makeSearchRequest(query: string, retryCount = 0): Promise<any[]> {
    const apiKey = this.config.apiKey;
    const searchEngineId = this.config.searchEngineId;
    const maxLinksPerCompany = this.config.maxLinksPerCompany;

    console.log('apiKey', apiKey);
    console.log('searchEngineId', searchEngineId);
    console.log('maxLinksPerCompany', maxLinksPerCompany);
    console.log('query', query);

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
        },
        timeout: 10000,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No search results found');
      }

      return response.data.items;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429 && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.makeSearchRequest(query, retryCount + 1);
        }
      }
      throw error;
    }
  }

  private deduplicateItems(items: any[]): any[] {
    return Array.from(new Map(items.map((item) => [item.link, item])).values());
  }

  private filterResults(results: any[]): SearchResult[] {
    return results
      .filter((item) => {
        if (!item.link) return false;

        try {
          const url = new URL(item.link);
          const domain = url.hostname.replace(/^www\./, '');
          return !BLACKLISTED_DOMAINS.some(
            (blacklisted) =>
              domain === blacklisted || domain.endsWith(`.${blacklisted}`)
          );
        } catch {
          return false;
        }
      })
      .map((item) => {
        let domain = '';
        try {
          const url = new URL(item.link);
          domain = url.hostname.replace(/^www\./, '');
        } catch {
          domain = 'unknown';
        }

        return {
          title: item.title || 'Sem título',
          link: item.link,
          snippet: item.snippet || '',
          domain,
        };
      });
  }

  public async searchCompany(companyName: string): Promise<SearchResult[]> {
    const generatedQueries = this.generateQueries(companyName);
    const allItems: any[] = [];

    for (const query of generatedQueries) {
      try {
        const items = await this.makeSearchRequest(query);
        allItems.push(...items);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Erro na consulta "${query}":`, error);
      }
    }

    const uniqueItems = this.deduplicateItems(allItems);
    const filteredResults = this.filterResults(uniqueItems);

    return filteredResults.slice(0, this.config.maxLinksPerCompany);
  }
}

export default GoogleSearchService;