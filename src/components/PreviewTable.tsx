import React from 'react';
import { ConsolidatedRow } from '@/utils/types';
import { AlertCircle } from 'lucide-react';

interface PreviewTableProps {
  rows: ConsolidatedRow[];
  maxRows?: number;
}

export function PreviewTable({ rows, maxRows = 100 }: PreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);
  const hasMore = rows.length > maxRows;

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No data to preview. Please process files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
        <p className="text-sm text-gray-600">
          Showing {displayRows.length} of {rows.length} rows
        </p>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subsection
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Screen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DB Mapping
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Computed
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Formula
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 text-sm text-gray-900">{row.section}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.subsection}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {row.field_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.order}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.screen_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.DB_mapping ? (
                    <span className="text-gray-900">{row.DB_mapping}</span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.is_computed === 'YES'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {row.is_computed}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {row.is_computed === 'YES' && !row.formula ? (
                    <span className="inline-flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Missing
                    </span>
                  ) : (
                    <span title={row.formula}>{row.formula || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {row.plan_type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            ... and {rows.length - maxRows} more rows
          </p>
        </div>
      )}
    </div>
  );
}