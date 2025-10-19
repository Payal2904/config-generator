import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { parseConsolidatedExcel } from '@/utils/excelGenerator';
import { generateAllConfigs, exportConfigsAsJSON } from '@/utils/jsonGenerator';
import { ConsolidatedRow, ConfigJSON } from '@/utils/types';
import { Download, Play, Loader2, Code2, Eye } from 'lucide-react';

export function UI2GenerateConfig() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [consolidatedRows, setConsolidatedRows] = useState<ConsolidatedRow[]>([]);
  const [configs, setConfigs] = useState<ConfigJSON[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigJSON | null>(null);

  const handleProcess = async () => {
    if (!excelFile) {
      alert('Please upload a consolidated Excel file');
      return;
    }

    try {
      setIsProcessing(true);

      // Parse Excel file
      const rows = await parseConsolidatedExcel(excelFile);
      setConsolidatedRows(rows);

      // Generate config JSONs
      const generatedConfigs = generateAllConfigs(rows);
      setConfigs(generatedConfigs);

      alert(`Successfully generated ${generatedConfigs.length} config JSONs!`);
    } catch (error: any) {
      console.error('Error processing:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (configs.length === 0) {
      alert('No configs to export. Please process an Excel file first.');
      return;
    }

    try {
      exportConfigsAsJSON(configs);
      alert('Config JSON file downloaded successfully!');
    } catch (error: any) {
      console.error('Error exporting:', error);
      alert(`Error exporting: ${error.message}`);
    }
  };

  const handlePreviewConfig = (config: ConfigJSON) => {
    setSelectedConfig(config);
    setShowPreview(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">UI 2: Generate Config JSON</h2>
          <p className="text-sm text-gray-600 mt-2">
            Upload consolidated Excel from UI 1 and generate form config JSON
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">1. Upload Consolidated Excel</h3>
          <FileUpload
            label="Consolidated Excel File"
            accept=".xlsx,.xls"
            file={excelFile}
            onChange={setExcelFile}
            description="The consolidated Excel file generated from UI 1"
          />
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
                Generate Config JSON
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Configs Summary */}
      {configs.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generated Configs</h3>
              <p className="text-sm text-gray-600 mt-1">
                {configs.length} configuration{configs.length !== 1 ? 's' : ''} generated from{' '}
                {consolidatedRows.length} row{consolidatedRows.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export All as JSON
            </button>
          </div>

          {/* Config List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {configs.map((config, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Code2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{config.field.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                            {config.type}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {config.field.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {config.screen_contexts.length} screen{config.screen_contexts.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePreviewConfig(config)}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config Preview Modal */}
      {showPreview && selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Config Preview: {selectedConfig.field.name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(selectedConfig, null, 2)}
              </pre>
            </div>
            <div className="border-t p-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  const jsonString = JSON.stringify(selectedConfig, null, 2);
                  navigator.clipboard.writeText(jsonString);
                  alert('Config copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}