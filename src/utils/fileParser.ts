import * as XLSX from 'exceljs';
import Papa from 'papaparse';
import { DBMapping, ComputedField } from './types';

/**
 * Parse Excel file to extract DB mappings
 */
export async function parseExcelDBMapping(file: File): Promise<DBMapping[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new XLSX.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0];
        const mappings: DBMapping[] = [];
        
        // Assume first row is header, skip it
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          const fieldName = row.getCell(1).value?.toString().trim();
          const dbColumn = row.getCell(2).value?.toString().trim();
          
          if (fieldName && dbColumn) {
            mappings.push({ fieldName, dbColumn });
          }
        });
        
        resolve(mappings);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file to extract DB mappings
 */
export async function parseCSVDBMapping(file: File): Promise<DBMapping[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const mappings: DBMapping[] = results.data
            .filter((row: any) => row.field_name && row.db_column)
            .map((row: any) => ({
              fieldName: row.field_name?.trim() || row.fieldName?.trim() || row['Field Name']?.trim(),
              dbColumn: row.db_column?.trim() || row.dbColumn?.trim() || row['DB Column']?.trim(),
            }))
            .filter((m) => m.fieldName && m.dbColumn);
          
          resolve(mappings);
        } catch (error) {
          reject(error);
        }
      },
      error: reject,
    });
  });
}

/**
 * Parse PDF file - extracts text and attempts to parse as table
 * Note: PDF parsing is complex and may require manual review
 */
export async function parsePDFDBMapping(file: File): Promise<DBMapping[]> {
  // For browser environment, we'll extract text using a simple approach
  // In production, consider using pdf.js or similar library
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Simple text extraction - in production use proper PDF parsing library
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const mappings: DBMapping[] = [];
        
        // Try to parse lines as field_name -> db_column
        for (const line of lines) {
          const parts = line.split(/[\t,|]/).map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            mappings.push({
              fieldName: parts[0],
              dbColumn: parts[1],
            });
          }
        }
        
        resolve(mappings);
      } catch (error) {
        reject(new Error('PDF parsing not fully supported in browser. Please convert to Excel or CSV.'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Parse Word document - extracts text and attempts to parse as table
 */
export async function parseWordDBMapping(file: File): Promise<DBMapping[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Use mammoth.js for Word document parsing
        // Note: mammoth requires dynamic import or build config
        // For simplicity, we'll do basic parsing here
        
        // Convert to text (simplified)
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split(/[\r\n]+/);
        const mappings: DBMapping[] = [];
        
        for (const line of lines) {
          const parts = line.split(/[\t,|]/).map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            mappings.push({
              fieldName: parts[0],
              dbColumn: parts[1],
            });
          }
        }
        
        resolve(mappings);
      } catch (error) {
        reject(new Error('Word document parsing not fully supported. Please convert to Excel or CSV.'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse computed fields file
 */
export async function parseComputedFields(file: File): Promise<ComputedField[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return parseExcelComputedFields(file);
    case 'csv':
      return parseCSVComputedFields(file);
    case 'pdf':
      return parsePDFComputedFields(file);
    case 'doc':
    case 'docx':
      return parseWordComputedFields(file);
    default:
      throw new Error('Unsupported file format for computed fields');
  }
}

/**
 * Parse Excel file for computed fields
 */
export async function parseExcelComputedFields(file: File): Promise<ComputedField[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new XLSX.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0];
        const fields: ComputedField[] = [];
        
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          const fieldName = row.getCell(1).value?.toString().trim();
          const formula = row.getCell(2).value?.toString().trim();
          
          if (fieldName && formula) {
            fields.push({
              fieldName,
              formula,
              isComputed: true,
            });
          }
        });
        
        resolve(fields);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file for computed fields
 */
export async function parseCSVComputedFields(file: File): Promise<ComputedField[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const fields: ComputedField[] = results.data
            .filter((row: any) => row.field_name && row.formula)
            .map((row: any) => ({
              fieldName: row.field_name?.trim() || row.fieldName?.trim() || row['Field Name']?.trim(),
              formula: row.formula?.trim() || row.Formula?.trim(),
              isComputed: true,
            }))
            .filter((f) => f.fieldName && f.formula);
          
          resolve(fields);
        } catch (error) {
          reject(error);
        }
      },
      error: reject,
    });
  });
}

/**
 * Parse PDF file for computed fields
 */
export async function parsePDFComputedFields(file: File): Promise<ComputedField[]> {
  // Simplified PDF parsing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const fields: ComputedField[] = [];
        
        for (const line of lines) {
          const parts = line.split(/[\t,|]/).map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            fields.push({
              fieldName: parts[0],
              formula: parts[1],
              isComputed: true,
            });
          }
        }
        
        resolve(fields);
      } catch (error) {
        reject(new Error('PDF parsing not fully supported. Please convert to Excel or CSV.'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Parse Word document for computed fields
 */
export async function parseWordComputedFields(file: File): Promise<ComputedField[]> {
  // Simplified Word parsing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split(/[\r\n]+/);
        const fields: ComputedField[] = [];
        
        for (const line of lines) {
          const parts = line.split(/[\t,|]/).map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            fields.push({
              fieldName: parts[0],
              formula: parts[1],
              isComputed: true,
            });
          }
        }
        
        resolve(fields);
      } catch (error) {
        reject(new Error('Word document parsing not fully supported. Please convert to Excel or CSV.'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generic file parser dispatcher
 */
export async function parseDBMappingFile(file: File): Promise<DBMapping[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return parseExcelDBMapping(file);
    case 'csv':
      return parseCSVDBMapping(file);
    case 'pdf':
      return parsePDFDBMapping(file);
    case 'doc':
    case 'docx':
      return parseWordDBMapping(file);
    default:
      throw new Error('Unsupported file format for DB mapping');
  }
}