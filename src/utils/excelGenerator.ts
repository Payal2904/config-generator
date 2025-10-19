import * as XLSX from 'exceljs';
import { saveAs } from 'file-saver';
import { ConsolidatedRow } from './types';

/**
 * Generate consolidated Excel file from rows
 */
export async function generateConsolidatedExcel(
  rows: ConsolidatedRow[],
  filename: string = 'consolidated_fields.xlsx'
): Promise<void> {
  const workbook = new XLSX.Workbook();
  const worksheet = workbook.addWorksheet('Consolidated Fields');

  // Define columns
  worksheet.columns = [
    { header: 'Section', key: 'section', width: 20 },
    { header: 'Subsection', key: 'subsection', width: 20 },
    { header: 'Field Name', key: 'field_name', width: 30 },
    { header: 'Order', key: 'order', width: 10 },
    { header: 'Screen Name', key: 'screen_name', width: 15 },
    { header: 'DB Mapping', key: 'DB_mapping', width: 30 },
    { header: 'Is Computed', key: 'is_computed', width: 12 },
    { header: 'Formula', key: 'formula', width: 40 },
    { header: 'Plan Type', key: 'plan_type', width: 20 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data rows
  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  // Apply conditional formatting for validation
  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and we have header
    const excelRow = worksheet.getRow(rowNumber);

    // Highlight missing DB mapping
    if (!row.DB_mapping || row.DB_mapping === '') {
      excelRow.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' },
      };
      excelRow.getCell(6).note = 'Missing DB Mapping';
    }

    // Highlight computed fields without formula
    if (row.is_computed === 'YES' && (!row.formula || row.formula === '')) {
      excelRow.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' },
      };
      excelRow.getCell(8).note = 'Missing Formula for Computed Field';
    }

    // Color computed fields
    if (row.is_computed === 'YES') {
      excelRow.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' },
      };
    }
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}

/**
 * Parse consolidated Excel file back to rows (for UI 2)
 */
export async function parseConsolidatedExcel(file: File): Promise<ConsolidatedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new XLSX.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        const rows: ConsolidatedRow[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header

          const consolidatedRow: ConsolidatedRow = {
            section: row.getCell(1).value?.toString().trim() || '',
            subsection: row.getCell(2).value?.toString().trim() || '',
            field_name: row.getCell(3).value?.toString().trim() || '',
            order: parseInt(row.getCell(4).value?.toString() || '0'),
            screen_name: row.getCell(5).value?.toString().trim() || 'create',
            DB_mapping: row.getCell(6).value?.toString().trim() || '',
            is_computed: row.getCell(7).value?.toString().trim() || 'NO',
            formula: row.getCell(8).value?.toString().trim() || '',
            plan_type: row.getCell(9).value?.toString().trim() || 'MEDICAL',
          };

          if (consolidatedRow.field_name) {
            rows.push(consolidatedRow);
          }
        });

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}