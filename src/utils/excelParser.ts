import * as XLSX from 'xlsx';
import { Company } from '@/types/company';

/**
 * Parses an Excel file and extracts company data
 * @param file The Excel file to parse
 * @returns An array of company objects
 */
export async function parseExcelFile(
  file: File
): Promise<Company[]> {
  try {
    // Convert the File object to an ArrayBuffer
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array( buffer );

    // Read the workbook directly using xlsx
    const workbook = XLSX.read( data, { type: 'array' });

    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];

    // Get the header row to check for required columns
    const range = XLSX.utils.decode_range(
      worksheet['!ref'] || 'A1'
    );
    const headers: string[] = [];
    for ( let C = range.s.c; C <= range.e.c; ++C ) {
      const cell =
        worksheet[
          XLSX.utils.encode_cell({ r: range.s.r, c: C })
        ];
      const headerValue = cell
        ? String( cell.v ).trim().toLowerCase()
        : '';
      if ( headerValue ) {
        headers.push( headerValue );
      }
    }

    // Check if 'empresa' column exists (case-insensitive)
    if ( !headers.includes( 'empresa' )) {
      throw new Error(
        "The Excel file must contain a column named 'empresa' (case-insensitive)"
      );
    }

    // Convert to JSON with header mapping
    const jsonData = XLSX.utils.sheet_to_json<Company>(
      worksheet,
      {
        raw: true,
        defval: null,
        header: headers,
      }
    );

    // Validate and transform the data
    const validatedData = jsonData
      .filter(
        ( row ) =>
          row &&
          typeof row.empresa === 'string' &&
          row.empresa.trim() !== ''
      )
      .map(( row ) => ({
        ...row,
        empresa: row.empresa.trim(),
      }));

    if ( validatedData.length === 0 ) {
      throw new Error(
        'No valid company names found in the Excel file'
      );
    }

    return validatedData;
  } catch ( error ) {
    throw error;
  }
}

/**
 * Creates an Excel file from processed company data
 * @param companies Array of processed companies with links
 * @returns A Blob containing the Excel file
 */
export function createExcelFile( companies: any[]): Blob {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create a worksheet from the data
  const worksheet = XLSX.utils.json_to_sheet( companies );

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Results'
  );

  // Generate the Excel file as an array buffer
  const excelBuffer = XLSX.write( workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  // Convert the array buffer to a Blob
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
