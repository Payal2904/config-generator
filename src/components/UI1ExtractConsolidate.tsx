import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { PreviewTable } from './PreviewTable';
import { ValidationMessages } from './ValidationMessages';
import { fetchFigmaData, parseFigmaUrl } from '@/utils/figmaApi';
import { parseDBMappingFile, parseComputedFields } from '@/utils/fileParser';
import { generateConsolidatedExcel } from '@/utils/excelGenerator';
import { ConsolidatedRow, ValidationError, DBMapping, ComputedField, FigmaField } from '@/utils/types';
import { Download, Play, Loader2 } from 'lucide-react';

export function UI1ExtractConsolidate() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [dbMappingFile, setDbMappingFile] = useState<File | null>(null);
  const [computedFieldsFile, setComputedFieldsFile] = useState<File | null>(null);
  const [planType, setPlanType] = useState('MEDICAL');
  
  const [consolidatedRows, setConsolidatedRows] = useState<ConsolidatedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const handleProcess = async () => {
    try {
      setIsProcessing(true);
      setValidationErrors([]);
      setProgress('Validating inputs...');

      // Validate inputs
      if (!figmaUrl || !figmaToken) {
        alert('Please provide Figma URL and API token');
        return;
      }

      if (!dbMappingFile) {
        alert('Please upload DB mapping file');
        return;
      }

      // Parse Figma URL
      setProgress('Parsing Figma URL...');
      const figmaParams = parseFigmaUrl(figmaUrl);
      if (!figmaParams) {
        alert('Invalid Figma URL. Please use format: https://www.figma.com/file/{fileKey}?node-id={nodeId}');
        return;
      }

      // Fetch Figma data
      setProgress('Fetching data from Figma...');
      const figmaFields: FigmaField[] = await fetchFigmaData(
        figmaParams.fileKey,
        figmaParams.nodeId,
        figmaToken
      );

      if (figmaFields.length === 0) {
        alert('No fields found in Figma node. Please check the node ID.');
        return;
      }

      // Parse DB mapping file
      setProgress('Parsing DB mapping file...');
      const dbMappings: DBMapping[] = await parseDBMappingFile(dbMappingFile);
      const dbMappingMap = new Map(dbMappings.map(m => [m.fieldName.toLowerCase(), m.dbColumn]));

      // Parse computed fields file (optional)
      let computedFieldsMap = new Map<string, ComputedField>();
      if (computedFieldsFile) {
        setProgress('Parsing computed fields file...');
        const computedFields: ComputedField[] = await parseComputedFields(computedFieldsFile);
        computedFieldsMap = new Map(computedFields.map(f => [f.fieldName.toLowerCase(), f]));
      }

      // Consolidate data
      setProgress('Consolidating data...');
      const rows: ConsolidatedRow[] = figmaFields.map((field, index) => {
        const fieldNameLower = field.fieldName.toLowerCase();
        const dbMapping = dbMappingMap.get(fieldNameLower) || '';
        const computedField = computedFieldsMap.get(fieldNameLower);

        return {
          section: field.section,
          subsection: field.subsection,
          field_name: field.fieldName,
          order: field.order,
          screen_name: field.screenName,
          DB_mapping: dbMapping,
          is_computed: computedField ? 'YES' : 'NO',
          formula: computedField?.formula || '',
          plan_type: planType,
        };
      });

      // Validate consolidated data
      setProgress('Validating consolidated data...');
      const errors: ValidationError[] = [];
      rows.forEach((row, index) => {
        if (!row.DB_mapping) {
          errors.push({
            row: index + 1,
            field: row.field_name,
            message: 'Missing DB mapping',
            type: 'error',
          });
        }

        if (row.is_computed === 'YES' && !row.formula) {
          errors.push({
            row: index + 1,
            field: row.field_name,
            message: 'Computed field is missing formula',
            type: 'error',
          });
        }
      });

      setConsolidatedRows(rows);
      setValidationErrors(errors);
      setProgress('Processing complete!');
    } catch (error: any) {
      console.error('Error processing:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (consolidatedRows.length === 0) {
      alert('No data to export. Please process files first.');
      return;
    }

    try {
      await generateConsolidatedExcel(consolidatedRows);
      alert('Excel file downloaded successfully!');
    } catch (error: any) {
      console.error('Error exporting:', error);
      alert(`Error exporting: ${error.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">UI 1: Extract & Consolidate Fields</h2>
          <p className="text-sm text-gray-600 mt-2">
            Extract fields from Figma, map to database columns, and generate consolidated Excel
          </p>
        </div>

        {/* Figma Inputs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">1. Figma Configuration</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Figma URL (with node-id parameter)
              </label>
              <input
                type="text"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/abc123?node-id=1:2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Figma API Token
              </label>
              <input
                type="password"
                value={figmaToken}
                onChange={(e) => setFigmaToken(e.target.value)}
                placeholder="Enter your Figma API token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your token from Figma Settings → Account → Personal Access Tokens
              </p>
            </div>
          </div>
        </div>

        {/* File Uploads */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">2. Upload Mapping Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="DB Mapping File"
              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
              file={dbMappingFile}
              onChange={setDbMappingFile}
              description="Excel, CSV, PDF, or Word document with field → DB column mapping"
            />
            <FileUpload
              label="Computed Fields File (Optional)"
              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
              file={computedFieldsFile}
              onChange={setComputedFieldsFile}
              description="File containing computed field formulas"
            />
          </div>
        </div>

        {/* Plan Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Plan Type</label>
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="MEDICAL">Medical</option>
            <option value="DENTAL">Dental</option>
            <option value="VISION">Vision</option>
            <option value="LIFE">Life</option>
            <option value="DISABILITY">Disability</option>
          </select>
        </div>

        {/* Process Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Process & Consolidate
              </>
            )}
          </button>
          {progress && (
            <span className="text-sm text-gray-600">{progress}</span>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {validationErrors.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ValidationMessages errors={validationErrors} />
        </div>
      )}

      {/* Preview Table */}
      {consolidatedRows.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <PreviewTable rows={consolidatedRows} />
          
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}