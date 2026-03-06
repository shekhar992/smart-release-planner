/**
 * 🤖 PRD Import Modal - AI-Powered Ticket Generation
 * 
 * This component handles the complete workflow:
 * 1. File Upload (drag & drop or click)
 * 2. AI Processing (with progress tracking)
 * 3. Ticket Preview (user reviews before importing)
 * 4. Import to Release (adds tickets to app)
 */

import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Sparkles, CheckCircle2, AlertTriangle, Loader2, User } from 'lucide-react';
import { Ticket, TeamMember } from '../data/mockData';
import { processPRDFile, checkAgentAvailability, ProcessingProgress } from '../lib/prdAgentBridge';
import { cn } from './ui/utils';

interface PRDImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tickets: Ticket[]) => void;
  teamMembers: TeamMember[];
}

type Step = 'upload' | 'processing' | 'preview' | 'error';

export function PRDImportModal({
  isOpen,
  onClose,
  onImport,
  teamMembers
}: PRDImportModalProps) {
  // State
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentAvailable, setAgentAvailable] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if AI agent is available on mount
  useEffect(() => {
    checkAgentAvailability().then(result => {
      setAgentAvailable(result.available);
      if (!result.available) {
        setError(result.message);
      }
    });
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'processing') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, step]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setFile(null);
      setTickets([]);
      setProgress(null);
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (step === 'processing') return; // Don't close while processing
    onClose();
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleGenerate = async () => {
    if (!file) return;

    setStep('processing');
    setError(null);

    const result = await processPRDFile(file, teamMembers, (prog) => {
      setProgress(prog);
    });

    if (result.success && result.tickets.length > 0) {
      setTickets(result.tickets);
      setStep('preview');
    } else {
      setError(result.error || 'Failed to generate tickets');
      setStep('error');
    }
  };

  const handleImport = () => {
    onImport(tickets);
    onClose();
  };

  if (!isOpen) return null;

  const totalStoryPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                PRD to Tickets
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-powered ticket generation
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'processing'}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Agent Status Warning */}
              {!agentAvailable && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        AI Agent Not Available
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {error || 'Please start Ollama to use this feature'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Upload PRD Document
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                    isDragging
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) handleFileSelect(selectedFile);
                    }}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        Drop your PRD here or click to browse
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Supports: .txt, .md, .pdf, .docx (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                  📋 How it works:
                </p>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <li>• Upload your Product Requirements Document</li>
                  <li>• AI extracts requirements and user stories</li>
                  <li>• Generates tickets with story points & descriptions</li>
                  <li>• Review and import to your release</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && progress && (
            <div className="space-y-6 py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {progress.message}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    This may take 30-60 seconds...
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                {progress.percent}% complete
              </p>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Success Summary */}
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                      Successfully Generated {tickets.length} Tickets
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Total: {totalStoryPoints} story points
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket List */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Preview Generated Tickets:
                </p>
                
                {tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {ticket.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            {ticket.storyPoints} SP
                          </span>
                          {ticket.requiredRole && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                              {ticket.requiredRole}
                            </span>
                          )}
                          {ticket.assignedTo && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Error */}
          {step === 'error' && (
            <div className="py-12">
              <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500 mx-auto mb-4" />
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                  Processing Failed
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {error || 'Unknown error occurred'}
                </p>
                <button
                  onClick={() => {
                    setStep('upload');
                    setError(null);
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          {step === 'upload' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!file || !agentAvailable}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
              >
                🚀 Generate Tickets
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Processing in progress... Please wait
              </p>
            </div>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-green-500/30"
              >
                ✓ Add {tickets.length} Tickets to Release
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
