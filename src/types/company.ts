export interface Company {
  empresa: string
  [key: string]: any // Allow additional properties from Excel
}

export interface SearchResult {
  title: string
  link: string
  snippet: string
  domain: string
}

export interface ProcessedCompany extends Company {
  links: SearchResult[]
  status: 'pending' | 'processing' | 'complete' | 'error'
  message?: string
}

export interface SearchConfig {
  apiKey: string
  searchEngineId: string
  maxLinksPerCompany: number
  searchDelay: number
}

export interface BlacklistConfig {
  domains: string[]
}
