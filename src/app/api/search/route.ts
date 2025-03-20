import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import GoogleSearchService from '../services/googleSearch';

const searchRequestSchema = z.object({
  companies: z.array(z.string()).min(1),
  config: z.object({
    apiKey: z.string().min(1),
    searchEngineId: z.string().min(1),
    maxLinksPerCompany: z.number().int().positive(),
    searchDelay: z.number().int().nonnegative(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const companyData = formData.get('file');
    const apiKey = formData.get('apiKey') as string;
    const searchEngineId = formData.get('searchEngineId') as string;
    const maxLinksPerCompany = parseInt(formData.get('maxLinksPerCompany') as string);
    const searchDelay = parseInt(formData.get('searchDelay') as string);

    if (!companyData || !apiKey || !searchEngineId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes' },
        { status: 400 }
      );
    }

    let companyText = '';
    if (companyData instanceof Blob) {
      companyText = await companyData.text();
    } else {
      companyText = companyData.toString();
    }

    const config = {
      apiKey,
      searchEngineId,
      maxLinksPerCompany: maxLinksPerCompany || 4,
      searchDelay: searchDelay || 500,
    };

    const searchService = new GoogleSearchService(config);
    
    try {
      const companies = companyText.split('\n').filter(company => company.trim());
      const results = await Promise.all(
        companies.map(async (company) => {
          try {
            const searchResults = await searchService.searchCompany(company.trim());
            return {
              empresa: company.trim(),
              links: searchResults,
              status: 'complete'
            };
          } catch (error) {
            return {
              empresa: company.trim(),
              links: [],
              status: 'error',
              message: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );

      return NextResponse.json({ results });

    } catch (error) {
      return NextResponse.json(
        { error: 'Erro ao processar empresas', details: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    );
  }
}