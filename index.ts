import * as fs from 'fs'
import axios from 'axios'
import * as xlsx from 'xlsx'
import { config } from 'dotenv'

// Load environment variables
config()

// Constants for configuration
const API_KEY = process.env.GOOGLE_API_KEY
const CX = process.env.GOOGLE_CSE_ID
const INPUT_FILE_PATH = 'prospeccao.xlsx'
const OUTPUT_FILE_PATH = 'prospeccao_com_links.xlsx'
const LOG_FILE_PATH = 'search_log.json'
const SEARCH_DELAY_MS = 500
const MAX_LINKS_PER_COMPANY = 4

// Blacklist of domains to filter out from search results
const BLACKLISTED_DOMAINS = [
  'tiktok.com',
  'youtube.com',
  'indeed.com',
  'glassdoor.com',
  'twitter.com',
  'serasaexperian.com.br',
  'cnpj.biz',
  'econodata.com.br',
]

// Interfaces for type safety
interface Company {
  empresa: string
  [key: string]: any // Allow additional properties from Excel
}

interface ProcessedCompany extends Company {
  link_site: string
}

interface LogEntry {
  query: string
  response: any
  reason: string
  timestamp: string
}

// Utility Functions

/** Reads an Excel file and returns its data as an array of objects */
function readExcelFile(filePath: string): Company[] {
  if (!fs.existsSync(filePath)) {
    return []
  }
  const workbook = xlsx.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
  
  // Map raw data to expected format, handling column name variations
  const data = (rawData as any[]).map(row => ({
    empresa: row.Empresa || row.empresa || row.EMPRESA || '',
    ...row
  }))

  // Debug: Log the first row to see column names
  if (data.length > 0) {
    console.log('📋 Available columns:', Object.keys(data[0]))
    console.log('📊 Sample row:', data[0])
  } else {
    console.log('❌ No data found in spreadsheet')
  }

  return data
}

/** Writes data to an Excel file */
function writeExcelFile(
  filePath: string,
  data: ProcessedCompany[]
): void {
  const worksheet = xlsx.utils.json_to_sheet(data)
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(
    workbook,
    worksheet,
    'Results'
  )
  xlsx.writeFile(workbook, filePath)
  console.log(`✅ Progress saved to ${filePath}`)
}

/** Logs search activity to a JSON file */
function logSearch(
  query: string,
  response: any,
  reason: string
): void {
  let logData: LogEntry[] = []
  if (fs.existsSync(LOG_FILE_PATH)) {
    try {
      logData = JSON.parse(
        fs.readFileSync(LOG_FILE_PATH, 'utf8')
      ) as LogEntry[]
    } catch (error) {
      console.error('Error parsing log file:', error)
    }
  }

  logData.push({
    query,
    response,
    reason,
    timestamp: new Date().toISOString(),
  })

  fs.writeFileSync(
    LOG_FILE_PATH,
    JSON.stringify(logData, null, 2)
  )
}

/** Delays execution by a specified number of milliseconds */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Performs a Google Custom Search API query */
async function searchGoogle(query: string): Promise<any[]> {
  if (!API_KEY || !CX) {
    throw new Error(
      'API_KEY or CX is missing in environment variables.'
    )
  }

  try {
    await delay(SEARCH_DELAY_MS)
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: { key: API_KEY, cx: CX, q: query, num: 10 },
      }
    )
    const items = response.data.items || []
    if (items.length === 0) {
      logSearch(
        query,
        response.data,
        'No search results found'
      )
    }
    return items
  } catch (error: any) {
    logSearch(query, { error: error.message }, 'API Error')
    console.error(
      `❌ API Error for query "${query}": ${error.message}`
    )
    return []
  }
}

/** Filters search results, excluding blacklisted domains */
function filterResults(results: any[]): any[] {
  return results.filter(
    (item) =>
      !BLACKLISTED_DOMAINS.some((domain) =>
        item.link.toLowerCase().includes(domain)
      )
  )
}

/** Generates an array of search queries for a company */
function generateQueries(companyName: string): string[] {
  return [
    `"${companyName}" site:.br`,
    `"${companyName}" "site oficial"`,
    `"${companyName}" site:gov.br`,
    `"${companyName}" "contato"`,
    `"${companyName}" -google.com -youtube.com -twitter.com`,
  ]
}

/** Processes a single company and adds its result to processedData */
async function processCompany(
  company: Company,
  processedData: ProcessedCompany[]
): Promise<void> {
  const companyName = company.empresa?.toString().trim()
  if (!companyName) {
    processedData.push({ ...company, link_site: 'Sem Nome' })
    return
  }

  console.log(`🔎 Searching for: ${companyName}`)

  let allLinks: string[] = []

  // Try different search queries until we get enough links
  for (const query of generateQueries(companyName)) {
    if (allLinks.length >= MAX_LINKS_PER_COMPANY) {
      break
    }

    const searchResults = await searchGoogle(query)
    if (searchResults.length === 0) {
      continue
    }

    const filteredResults = filterResults(searchResults)
    if (filteredResults.length === 0) {
      logSearch(
        companyName,
        searchResults,
        'All results were blacklisted'
      )
      continue
    }

    // Add new unique links up to the maximum
    for (const result of filteredResults) {
      if (
        !allLinks.includes(result.link) &&
        allLinks.length < MAX_LINKS_PER_COMPANY
      ) {
        allLinks.push(result.link)
      }
    }
  }

  if (allLinks.length === 0) {
    logSearch(companyName, [], 'No results found')
    allLinks.push('Resultado não encontrado')
  }

  // Join all links with comma separator
  const linkString = allLinks.join(', ')
  processedData.push({ ...company, link_site: linkString })
}

// Main Processing Function

/** Processes companies from an input Excel file and writes results to an output file */
async function processSearch(): Promise<void> {
  // Validate environment variables
  if (!API_KEY || !CX) {
    console.error(
      'API_KEY or CX is missing. Please set them in the environment variables.'
    )
    return
  }

  // Read input and existing processed data
  const inputCompanies: Company[] =
    readExcelFile(INPUT_FILE_PATH)
  if (inputCompanies.length === 0) {
    console.error(
      `File ${INPUT_FILE_PATH} not found or empty!`
    )
    return
  }

  // Debug: Log sample of data
  console.log('📊 First row sample:', inputCompanies[0])

  let processedCompanies: ProcessedCompany[] = []

  // Check if output file exists and read it
  if (fs.existsSync(OUTPUT_FILE_PATH)) {
    processedCompanies = readExcelFile(
      OUTPUT_FILE_PATH
    ) as ProcessedCompany[]
  }

  // Create a set of already processed companies (using empresa field)
  const processedCompanyNames = new Set(
    processedCompanies.map((company) =>
      company.empresa?.trim()
    )
  )

  console.log(
    `🔍 Found ${inputCompanies.length} companies. Already processed: ${processedCompanies.length}`
  )

  // Process each company
  for (const company of inputCompanies) {
    // Debug: Log the company object
    console.log('🏢 Processing company:', company)

    const companyName = company.empresa?.trim()

    if (!companyName) {
      console.log(
        '⚠️ Company without name in field "empresa", raw data:',
        company
      )
      continue
    }

    if (processedCompanyNames.has(companyName)) {
      console.log(`✅ ${companyName} already processed...`)
      continue
    }

    await processCompany(company, processedCompanies)

    // Save progress every 5 companies
    if (processedCompanies.length % 5 === 0) {
      writeExcelFile(OUTPUT_FILE_PATH, processedCompanies)
    }
  }

  // Final save
  writeExcelFile(OUTPUT_FILE_PATH, processedCompanies)
  console.log('✨ Processing complete!')
}

// Execute the script
processSearch().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
