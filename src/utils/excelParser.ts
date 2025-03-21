import * as XLSX from 'xlsx';
import { Company } from '@/types/company';

export async function parseExcelFile(
  file: File
): Promise<Company[]> {
  try {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array( buffer );

    const workbook = XLSX.read( data, { type: 'array' });

    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];

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

    if ( !headers.includes( 'empresa' )) {
      throw new Error(
        "The Excel file must contain a column named 'empresa' (case-insensitive)"
      );
    }

    const jsonData = XLSX.utils.sheet_to_json<Company>(
      worksheet,
      {
        raw: true,
        defval: null,
        header: headers,
      }
    );

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

export function createExcelFile( companies: any[]): Blob {
  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet( companies );

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Results'
  );

  const excelBuffer = XLSX.write( workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
