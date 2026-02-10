/**
 * Bulk Import Wizard
 * Complete end-to-end import flow for all entity types
 */

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Download, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { parseCSV, validateAndTransformCSV, CSVParseResult } from '../lib/csvParser';
import {
  ImportEntityType,
  entityTypeConfig,
  validateRelationships
} from '../lib/importMappings';

interface BulkImportWizardProps {
  onClose: () => void;
  onImportComplete: (entityType: ImportEntityType, data: any[]) => void;
  existingData?: {
    tickets?: any[];
    teamMembers?: any[];
    features?: any[];
    sprints?: any[];
    releases?: any[];
  };
}

type WizardStep = 'select-type' | 'upload-file' | 'validate' | 'confirm' | 'complete';

export const BulkImportWizard: React.FC<BulkImportWizardProps> = ({
  onClose,
  onImportComplete,
  existingData = {}
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select-type');
  const [selectedType, setSelectedType] = useState<ImportEntityType | null>(null);
  const [_file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult<any> | null>(null);
  const [relationshipWarnings, setRelationshipWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Select Entity Type
  const handleSelectType = (type: ImportEntityType) => {
    setSelectedType(type);
    setCurrentStep('upload-file');
  };

  // Step 2: Upload and Parse File
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        // Parse CSV
        const { headers, rows } = parseCSV(content);
        
        // Validate and transform based on entity type
        if (selectedType) {
          const config = entityTypeConfig[selectedType];
          const result = validateAndTransformCSV(headers, rows, config.mapping);
          
          // Validate relationships
          const warnings = validateRelationships(selectedType, result.data, existingData);
          setRelationshipWarnings(warnings);
          
          setParseResult(result);
          setCurrentStep('validate');
        }
      } catch (error) {
        alert(`Error parsing file: ${error}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(uploadedFile);
  };

  // Step 3: Review validation results
  const handleProceedToConfirm = () => {
    if (parseResult && parseResult.data.length > 0) {
      setCurrentStep('confirm');
    }
  };

  // Step 4: Confirm and import
  const handleConfirmImport = () => {
    if (selectedType && parseResult) {
      onImportComplete(selectedType, parseResult.data);
      setCurrentStep('complete');
    }
  };

  // Download template file
  const handleDownloadTemplate = () => {
    if (!selectedType) return;
    
    const config = entityTypeConfig[selectedType];
    const headers = config.mapping.map(m => m.csvColumn);
    
    // Create sample row based on entity type
    const sampleRow = getSampleRow(selectedType);
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = config.exampleFilename;
    link.click();
  };

  // Reset wizard
  const handleStartOver = () => {
    setCurrentStep('select-type');
    setSelectedType(null);
    setFile(null);
    setParseResult(null);
    setRelationshipWarnings([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Import Wizard</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 'select-type' && 'Select what you want to import'}
              {currentStep === 'upload-file' && 'Upload your CSV file'}
              {currentStep === 'validate' && 'Review validation results'}
              {currentStep === 'confirm' && 'Confirm import'}
              {currentStep === 'complete' && 'Import complete!'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { step: 'select-type', label: 'Select Type', number: 1 },
              { step: 'upload-file', label: 'Upload', number: 2 },
              { step: 'validate', label: 'Validate', number: 3 },
              { step: 'confirm', label: 'Confirm', number: 4 }
            ].map((item, index) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep === item.step
                        ? 'bg-blue-600 text-white'
                        : index < ['select-type', 'upload-file', 'validate', 'confirm'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index < ['select-type', 'upload-file', 'validate', 'confirm'].indexOf(currentStep) ? (
                      <CheckCircle size={20} />
                    ) : (
                      item.number
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </div>
                {index < 3 && (
                  <div className="flex-1 h-0.5 bg-gray-300 mx-2 mb-6" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'select-type' && (
            <SelectTypeStep onSelect={handleSelectType} />
          )}

          {currentStep === 'upload-file' && selectedType && (
            <UploadFileStep
              entityType={selectedType}
              onFileUpload={handleFileUpload}
              onDownloadTemplate={handleDownloadTemplate}
              isProcessing={isProcessing}
            />
          )}

          {currentStep === 'validate' && parseResult && selectedType && (
            <ValidateStep
              parseResult={parseResult}
              relationshipWarnings={relationshipWarnings}
              entityType={selectedType}
            />
          )}

          {currentStep === 'confirm' && parseResult && selectedType && (
            <ConfirmStep
              parseResult={parseResult}
              entityType={selectedType}
            />
          )}

          {currentStep === 'complete' && parseResult && selectedType && (
            <CompleteStep
              count={parseResult.data.length}
              entityType={selectedType}
              onClose={onClose}
              onStartOver={handleStartOver}
            />
          )}
        </div>

        {/* Footer Actions */}
        {currentStep !== 'complete' && currentStep !== 'select-type' && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                if (currentStep === 'upload-file') setCurrentStep('select-type');
                if (currentStep === 'validate') setCurrentStep('upload-file');
                if (currentStep === 'confirm') setCurrentStep('validate');
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {currentStep === 'validate' && parseResult && (
                <button
                  onClick={handleProceedToConfirm}
                  disabled={parseResult.errors.length > 0 || parseResult.data.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              )}

              {currentStep === 'confirm' && (
                <button
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={16} />
                  Import Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// STEP COMPONENTS
// ============================================

const SelectTypeStep: React.FC<{ onSelect: (type: ImportEntityType) => void }> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(entityTypeConfig).map(([key, config]) => (
        <button
          key={key}
          onClick={() => onSelect(key as ImportEntityType)}
          className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <span className="text-4xl">{config.icon}</span>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              {config.label}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{config.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

const UploadFileStep: React.FC<{
  entityType: ImportEntityType;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  isProcessing: boolean;
}> = ({ entityType, onFileUpload, onDownloadTemplate, isProcessing }) => {
  const config = entityTypeConfig[entityType];
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Download Template */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📥 Need a template?</h3>
        <p className="text-sm text-blue-800 mb-3">
          Download our CSV template with the correct column format for {config.label.toLowerCase()}.
        </p>
        <button
          onClick={onDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload your CSV file
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop or click to browse
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          disabled={isProcessing}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Choose File'}
        </label>
      </div>

      {/* Required Columns */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Required Columns:</h3>
        <div className="flex flex-wrap gap-2">
          {config.mapping.filter(m => m.required).map(mapping => (
            <span
              key={mapping.csvColumn}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono"
            >
              {mapping.csvColumn}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ValidateStep: React.FC<{
  parseResult: CSVParseResult<any>;
  relationshipWarnings: string[];
  entityType: ImportEntityType;
}> = ({ parseResult, relationshipWarnings, entityType }) => {
  const config = entityTypeConfig[entityType];
  const hasErrors = parseResult.errors.length > 0;
  const hasWarnings = relationshipWarnings.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-semibold text-green-900">
              {parseResult.data.length} valid {config.label.toLowerCase()}
            </span>
          </div>
        </div>

        {hasErrors && (
          <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <span className="font-semibold text-red-900">
                {parseResult.errors.length} errors found
              </span>
            </div>
          </div>
        )}

        {hasWarnings && (
          <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-600" />
              <span className="font-semibold text-yellow-900">
                {relationshipWarnings.length} warnings
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Errors List */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-red-900 mb-3">❌ Errors (must be fixed):</h3>
          <div className="space-y-2">
            {parseResult.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-800 bg-white p-2 rounded">
                <span className="font-medium">Row {error.row}:</span> {error.message}
                {error.value && <span className="text-red-600"> (value: "{error.value}")</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings List */}
      {hasWarnings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Warnings (review recommended):</h3>
          <div className="space-y-2">
            {relationshipWarnings.map((warning, index) => (
              <div key={index} className="text-sm text-yellow-800 bg-white p-2 rounded">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Data */}
      {!hasErrors && parseResult.data.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Preview (first 5 rows):</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200">
                  {Object.keys(parseResult.data[0]).map(key => (
                    <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parseResult.data.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2">
                        {value instanceof Date
                          ? value.toISOString().split('T')[0]
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parseResult.data.length > 5 && (
            <p className="text-xs text-gray-600 mt-2">
              ...and {parseResult.data.length - 5} more rows
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ConfirmStep: React.FC<{
  parseResult: CSVParseResult<any>;
  entityType: ImportEntityType;
}> = ({ parseResult, entityType }) => {
  const config = entityTypeConfig[entityType];
  
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="text-6xl">{config.icon}</div>
      <h3 className="text-2xl font-bold text-gray-900">Ready to Import</h3>
      <p className="text-gray-600">
        You're about to import <span className="font-semibold text-blue-600">{parseResult.data.length}</span>{' '}
        {config.label.toLowerCase()} into your project.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-blue-900 mb-2">What will happen:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✅ {parseResult.data.length} {config.label.toLowerCase()} will be added</li>
          <li>✅ Data will be available immediately</li>
          <li>✅ You can edit or delete imported items later</li>
        </ul>
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{
  count: number;
  entityType: ImportEntityType;
  onClose: () => void;
  onStartOver: () => void;
}> = ({ count, entityType, onClose, onStartOver }) => {
  const config = entityTypeConfig[entityType];
  
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <h3 className="text-2xl font-bold text-green-600">Import Successful!</h3>
      <p className="text-gray-600">
        Successfully imported <span className="font-semibold">{count}</span> {config.label.toLowerCase()}.
      </p>

      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Close
        </button>
        <button
          onClick={onStartOver}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Import More Data
        </button>
      </div>
    </div>
  );
};

// ============================================
// SAMPLE DATA GENERATORS
// ============================================

function getSampleRow(entityType: ImportEntityType): string[] {
  switch (entityType) {
    case 'tickets':
      return [
        't1',
        'Implement user authentication',
        '2026-02-15',
        '2026-02-22',
        'planned',
        '5',
        'John Doe'
      ];
    case 'team-members':
      return ['tm1', 'John Doe', 'Developer', 'Senior full-stack engineer'];
    case 'features':
      return ['f1', 'Authentication System'];
    case 'sprints':
      return ['s1', 'Sprint 1', '2026-02-10', '2026-02-21'];
    case 'releases':
      return ['r1', 'Q1 2026 Release', '2026-02-01', '2026-03-31'];
    case 'pto':
      return ['pto1', 'John Doe', '2026-03-15', '2026-03-19'];
    case 'holidays':
      return ['h1', 'Presidents Day', '2026-02-16', '2026-02-16'];
    default:
      return [];
  }
}
