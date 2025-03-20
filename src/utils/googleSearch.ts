// googleSearch.ts
import axios from 'axios';
import { SearchResult, SearchConfig } from '@/types/company';
import { BLACKLISTED_DOMAINS } from '@/constants/blacklist';

// Gerador de consultas otimizado
function generateQueries( companyName: string ): string[] {
  return [
    `${companyName} site:.br -google.com -youtube.com -twitter.com`,
    `${companyName} "contato" OR "fale conosco" -google.com`,
    `${companyName} (site:gov.br OR "site oficial")`,
  ];
}

// Função de requisição com retentativas e backoff exponencial
async function makeSearchRequest(
  query: string,
  config: SearchConfig,
  retryCount = 0
): Promise<any[]> {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: config.apiKey,
          cx: config.searchEngineId,
          q: query,
          num: 10,
        },
        timeout: 500,
      }
    );
    return response.data.items || [];
  } catch ( error ) {
    if ( axios.isAxiosError( error )) {
      if (
        error.response?.status === 429 &&
        retryCount < 3
      ) {
        const delay =
          Math.pow( 2, retryCount ) * 1000 +
          Math.random() * 1000;
        console.log(
          `Esperando ${Math.round( delay )}ms para tentar novamente...`
        );
        await new Promise(( resolve ) =>
          setTimeout( resolve, delay )
        );
        return makeSearchRequest(
          query,
          config,
          retryCount + 1
        );
      }
    }
    console.error(
      `Falha na requisição para "${query}":`,
      error instanceof Error
        ? error.message
        : 'Erro desconhecido'
    );
    return [];
  }
}

// Função principal de busca
export async function searchCompany(
  companyName: string,
  config: SearchConfig
): Promise<SearchResult[]> {
  const generatedQueries = generateQueries( companyName );
  const { maxLinksPerCompany } = config;

  const allItems: any[] = [];

  for ( const query of generatedQueries ) {
    try {
      const items = await makeSearchRequest( query, config );
      allItems.push( ...items );

      // Delay padrão entre consultas diferentes
      await new Promise(( resolve ) =>
        setTimeout( resolve, 1500 )
      );
    } catch ( error ) {
      console.error( `Erro na consulta "${query}":`, error );
    }
  }

  // Processamento dos resultados
  const uniqueItems = deduplicateItems( allItems );
  const filteredResults = filterResults( uniqueItems );

  return filteredResults.slice( 0, maxLinksPerCompany );
}

// Remove resultados duplicados
function deduplicateItems( items: any[]): any[] {
  return Array.from(
    new Map( items.map(( item ) => [item.link, item])).values()
  );
}

// Filtra e formata os resultados
function filterResults( results: any[]): SearchResult[] {
  return results
    .filter(( item ) => {
      if ( !item.link ) {
        return false;
      }

      try {
        const url = new URL( item.link );
        const domain = url.hostname.replace( /^www\./, '' );

        return !BLACKLISTED_DOMAINS.some(
          ( blacklisted ) =>
            domain === blacklisted ||
            domain.endsWith( `.${blacklisted}` )
        );
      } catch {
        return false;
      }
    })
    .map(( item ) => {
      let domain = '';
      try {
        const url = new URL( item.link );
        domain = url.hostname.replace( /^www\./, '' );
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
