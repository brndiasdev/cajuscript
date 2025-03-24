import { SearchResult, SearchConfig } from '@/types/company';
import { BLACKLISTED_DOMAINS } from '@/constants/blacklist';

const API_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';
const MAX_API_RESULTS = 10;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RESULTS_PER_COMPANY = 4;

interface GoogleSearchResult {
  readonly title: string;
  readonly link: string;
  readonly snippet: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  error?: { code: number; message: string };
  searchInformation?: { totalResults: string };
}

export class GoogleSearchService {
  private readonly config: SearchConfig;

  constructor(config: SearchConfig) {
    this.config = config;
  }

  /** Gera uma lista de domínios prováveis para a empresa */
  private generateDomainGuesses(companyName: string): string[] {
    const normalizedName = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[&-]/g, '');

    return [
      `${normalizedName}.com.br`,
      `${normalizedName}.com`,
      `${normalizedName}.net.br`,
      `${normalizedName}.net`,
      `${normalizedName}.br`,
      `${normalizedName}.org.br`,
      `${normalizedName}.org`,
      ...(companyName.includes(' ')
        ? [
            `${companyName.toLowerCase().replace(/\s+/g, '-')}.com.br`,
            `${companyName.toLowerCase().replace(/\s+/g, '-')}.com`,
            `${companyName.toLowerCase().replace(/\s+/g, '-')}.br`,
          ]
        : []),
    ];
  }

  /** Gera consultas de busca otimizadas para encontrar o site da empresa */
  private generateSearchQueries(companyName: string): string[] {
    const exactName = `"${companyName}"`;
    return [
      exactName,
      `${exactName} site oficial`,
      `${exactName} homepage`,
      `${exactName} website`,
      ...this.generateDomainGuesses(companyName).map((domain) => `site:${domain} ${exactName}`),
    ];
  }

  /** Constrói uma URL com parâmetros de forma segura */
  private buildUrlWithParams(baseUrl: string, params: Record<string, string | number>): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
    return url.toString();
  }

  /** Executa uma consulta na API do Google usando fetch */
  private async executeSearchQuery(query: string, retryCount = 0): Promise<GoogleSearchResult[]> {
    const params = {
      key: this.config.apiKey,
      cx: this.config.searchEngineId,
      q: query,
      num: Math.min(this.config.maxLinksPerCompany, MAX_API_RESULTS),
      gl: 'br',
      lr: 'lang_pt',
      fields: 'items(title,link,snippet),searchInformation',
      start: 1,
    };

    try {
      console.log('Executando consulta:', { query, params: { ...params, key: params.key.slice(0, 5) + '...' } });

      const url = this.buildUrlWithParams(API_ENDPOINT, params);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na API:', errorData.error);
        return [];
      }

      const data: GoogleSearchResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log('Nenhum resultado retornado para a consulta:', query);
        return [];
      }

      return data.items.filter((item) => item.link && item.title) || [];
    } catch (error) {
      console.error('Erro na requisição:', error);
      if (this.isRateLimitError(error) && retryCount < MAX_RETRIES) {
        await this.delayWithJitter(retryCount);
        return this.executeSearchQuery(query, retryCount + 1);
      }
      return [];
    }
  }

  /** Verifica se o erro é relacionado a limite de taxa */
  private isRateLimitError(error: unknown): boolean {
    // Para fetch, não temos um status direto no erro capturado, então assumimos que erros de rede podem ser retentados
    return true; // Ajuste conforme necessário para identificar 429 ou 403
  }

  /** Aplica um atraso exponencial com jitter para retentativas */
  private async delayWithJitter(retryCount: number): Promise<void> {
    const delay = INITIAL_RETRY_DELAY_MS * 2 ** retryCount + Math.random() * 500;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /** Verifica se o domínio está na lista de bloqueio */
  private isBlacklistedDomain(link: string): boolean {
    try {
      const url = new URL(link);
      const domain = url.hostname.replace(/^www\./, '').toLowerCase();
      const blockedDomains = ['google.com', 'youtube.com', 'linkedin.com', 'twitter.com'];
      if (blockedDomains.some((d) => domain.includes(d))) return true;
      return BLACKLISTED_DOMAINS.some((d) => domain.includes(d.toLowerCase()));
    } catch {
      return true;
    }
  }

  /** Normaliza e classifica os resultados com base em relevância */
  private normalizeAndRankResults(results: SearchResult[], companyName: string): SearchResult[] {
    if (results.length === 0) return [];

    const normalizedCompanyName = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

    const scoredResults = results
      .map((result) => {
        const domain = result.domain.toLowerCase();
        const normalizedDomain = domain.replace(/^www\./, '');
        let score = 0;

        if (normalizedDomain.includes(normalizedCompanyName)) score += 200;
        if (domain.endsWith('.com.br')) score += 80;
        else if (domain.endsWith('.br')) score += 60;
        else if (domain.endsWith('.com')) score += 40;
        if (result.title.toLowerCase().includes(companyName.toLowerCase())) score += 50;

        const officialTerms = ['oficial', 'official', 'homepage', 'home', 'site oficial'];
        if (officialTerms.some((term) => result.title.toLowerCase().includes(term))) score += 50;
        if (officialTerms.some((term) => result.snippet?.toLowerCase().includes(term))) score += 30;

        return { ...result, score };
      })
      .sort((a, b) => (b.score as number) - (a.score as number));

    return scoredResults.map(({ score: _score, ...rest }) => rest);
  }

  /** Gera uma URL de fallback para a empresa */
  private generateFallbackURL(companyName: string): string {
    const normalizedName = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    return `https://${normalizedName}.com.br`;
  }

  /** Verifica diretamente os domínios gerados como fallback */
  private async fallbackDirectDomainCheck(companyName: string): Promise<SearchResult[]> {
    const domainGuesses = this.generateDomainGuesses(companyName);
    const results: SearchResult[] = [];

    for (const domain of domainGuesses) {
      const url = `https://${domain}`;
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          results.push({
            title: `${companyName} - Site Oficial`,
            link: url,
            snippet: `Site oficial da empresa ${companyName}.`,
            domain,
          });
          break;
        }
      } catch (error) {
        console.error(`Erro ao verificar domínio ${domain}:`, error);
        continue;
      }
    }
    return results;
  }

  /** Busca resultados para uma empresa */
  public async searchCompany(companyName: string): Promise<SearchResult[]> {
    if (!this.config.apiKey || !this.config.searchEngineId) {
      console.error('Chave da API ou ID do mecanismo de pesquisa ausentes.');
      return [];
    }

    const queries = this.generateSearchQueries(companyName);
    const allResults: SearchResult[] = [];
    let validResultCount = 0;

    for (const query of queries) {
      if (validResultCount >= MAX_RESULTS_PER_COMPANY) break;

      const items = await this.executeSearchQuery(query);
      const filteredItems = items
        .filter((item) => !this.isBlacklistedDomain(item.link))
        .map((item) => ({
          title: item.title || 'Sem título',
          link: item.link,
          snippet: item.snippet || '',
          domain: new URL(item.link).hostname,
        }));

      if (filteredItems.length > 0) {
        allResults.push(...filteredItems);
        const uniqueDomains = new Set(allResults.map((item) => item.domain));
        validResultCount = uniqueDomains.size;
      }
    }

    if (allResults.length === 0) {
      const directResults = await this.fallbackDirectDomainCheck(companyName);
      if (directResults.length > 0) allResults.push(...directResults);
    }

    if (allResults.length === 0) {
      const fallbackURL = this.generateFallbackURL(companyName);
      allResults.push({
        title: `${companyName} - Site Sugerido (Ainda não tem um site oficial.)`,
        link: fallbackURL,
        snippet: `Endereço sugerido para a empresa ${companyName}.`,
        domain: new URL(fallbackURL).hostname,
      });
    }

    const uniqueResultsMap = new Map<string, SearchResult>();
    allResults.forEach((item) => {
      if (!uniqueResultsMap.has(item.link)) uniqueResultsMap.set(item.link, item);
    });

    const uniqueResults = Array.from(uniqueResultsMap.values());
    const rankedResults = this.normalizeAndRankResults(uniqueResults, companyName);
    return rankedResults.slice(0, this.config.maxLinksPerCompany);
  }

  /** Método público para busca genérica */
  public async search(query: string): Promise<GoogleSearchResult[]> {
    const results = await this.searchCompany(query);
    return results.map((result) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
    }));
  }
}
