import React from 'react';
import { ValidationError } from '@/utils/types';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface ValidationMessagesProps {
  errors: ValidationError[];
}

export function ValidationMessages({ errors }: ValidationMessagesProps) {
  if (errors.length === 0) {
    return null;
  }

  const errorCount = errors.filter((e) => e.type === 'error').length;
  const warningCount = errors.filter((e) => e.type === 'warning').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Validation Results</h3>
        <div className="flex items-center space-x-4 text-sm">
          {errorCount > 0 && (
            <span className="text-red-600 font-medium">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-yellow-600 font-medium">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg border ${
              error.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            {error.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  error.type === 'error' ? 'text-red-900' : 'text-yellow-900'
                }`}
              >
                Row {error.row}: {error.field}
              </p>
              <p
                className={`text-sm mt-1 ${
                  error.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                {error.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}