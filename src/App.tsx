import { useState } from 'react';
import { UI1ExtractConsolidate } from './components/UI1ExtractConsolidate';
import { UI2GenerateConfig } from './components/UI2GenerateConfig';
import { Workflow, Settings } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'ui1' | 'ui2'>('ui1');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <Workflow className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Form Config Automation</h1>
                <p className="text-sm text-gray-600">End-to-end pipeline for dynamic form configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex space-x-2 border-b">
          <button
            onClick={() => setActiveTab('ui1')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'ui1'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Extract & Consolidate</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ui2')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'ui2'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Generate Config JSON</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="py-6">
        {activeTab === 'ui1' ? <UI1ExtractConsolidate /> : <UI2GenerateConfig />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Form Config Automation Pipeline - Built with React, TypeScript, and TailwindCSS</p>
            <p className="mt-1 text-xs text-gray-500">
              Supports Figma API integration, multiple file formats (Excel, CSV, PDF, Word), and intelligent config generation
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;