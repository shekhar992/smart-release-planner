import { useState, useRef, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Plus, Trash2, Users, Package, UserPlus, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { TeamMember } from '../data/mockData';
import { parseCSV } from '../lib/csvParser';
import { deriveVelocityMultiplier } from '../lib/importMappings';

interface TeamMemberDraft {
  name: string;
  role: 'Developer' | 'Designer' | 'QA';
  experienceLevel: 'Junior' | 'Mid' | 'Senior';
  notes: string;
}

type TeamInputMode = 'manual' | 'csv';

interface CreateProductModalProps {
  onClose: () => void;
  onCreate: (name: string, teamMembers: Omit<TeamMember, 'id' | 'productId'>[]) => void;
}

type Step = 'product-info' | 'team-setup';

export function CreateProductModal({ onClose, onCreate }: CreateProductModalProps) {
  const [step, setStep] = useState<Step>('product-info');
  const [productName, setProductName] = useState('');
  const [members, setMembers] = useState<TeamMemberDraft[]>([
    { name: '', role: 'Developer', experienceLevel: 'Mid', notes: '' }
  ]);
  const [inputMode, setInputMode] = useState<TeamInputMode>('csv');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMember = () => {
    setMembers(prev => [...prev, { name: '', role: 'Developer', experienceLevel: 'Mid', notes: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMemberDraft, value: string) => {
    setMembers(prev => prev.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const validMembers = members.filter(m => m.name.trim());

  const handleSubmit = () => {
    if (!productName.trim()) return;
    const teamData = validMembers.map(m => ({
      name: m.name.trim(),
      role: m.role,
      experienceLevel: m.experienceLevel,
      velocityMultiplier: deriveVelocityMultiplier(m.experienceLevel),
      notes: m.notes.trim() || undefined,
      pto: [],
    }));
    onCreate(productName.trim(), teamData);
    onClose();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Designer': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QA': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const normalizeRole = (role: string): 'Developer' | 'Designer' | 'QA' => {
    const lower = role.toLowerCase().trim();
    if (['developer', 'dev', 'engineer', 'frontend', 'backend', 'fullstack', 'full-stack'].includes(lower)) return 'Developer';
    if (['designer', 'design', 'ux', 'ui', 'ux/ui', 'ui/ux', 'product designer'].includes(lower)) return 'Designer';
    if (['qa', 'quality', 'tester', 'test', 'quality assurance', 'sdet'].includes(lower)) return 'QA';
    return 'Developer'; // default
  };

  const processCSVContent = useCallback((content: string) => {
    setCsvError(null);
    setCsvSuccess(null);

    try {
      const { headers, rows } = parseCSV(content);

      if (headers.length === 0 || rows.length === 0) {
        setCsvError('CSV file is empty or has no data rows.');
        return;
      }

      // Flexible column matching (case-insensitive)
      const headerLower = headers.map(h => h.toLowerCase().trim());
      const nameIdx = headerLower.findIndex(h => ['name', 'member', 'team member', 'team_member', 'full name', 'fullname'].includes(h));
      const roleIdx = headerLower.findIndex(h => ['role', 'position', 'title', 'job title', 'job_title'].includes(h));
      const experienceIdx = headerLower.findIndex(h => ['experiencelevel', 'experience level', 'experience', 'level', 'seniority'].includes(h));
      const notesIdx = headerLower.findIndex(h => ['notes', 'note', 'description', 'bio', 'details'].includes(h));

      if (nameIdx === -1) {
        setCsvError('Could not find a "name" column in the CSV. Expected columns: name, role, experienceLevel');
        return;
      }

      const parsed: TeamMemberDraft[] = [];
      const errors: string[] = [];

      const normalizeExperienceLevel = (exp: string): 'Junior' | 'Mid' | 'Senior' => {
        const lower = exp.toLowerCase().trim();
        if (['junior', 'jr', 'entry', 'entry level', 'entry-level'].includes(lower)) return 'Junior';
        if (['senior', 'sr', 'lead', 'principal'].includes(lower)) return 'Senior';
        // Default to Mid for any other value or empty
        return 'Mid';
      };

      rows.forEach((row, i) => {
        const name = row[nameIdx]?.trim();
        if (!name) {
          errors.push(`Row ${i + 2}: Empty name, skipped`);
          return;
        }
        const role = roleIdx >= 0 ? normalizeRole(row[roleIdx] || '') : 'Developer';
        const experienceLevel = experienceIdx >= 0 ? normalizeExperienceLevel(row[experienceIdx] || 'Mid') : 'Mid';
        const notes = notesIdx >= 0 ? (row[notesIdx]?.trim() || '') : '';
        parsed.push({ name, role, experienceLevel, notes });
      });

      if (parsed.length === 0) {
        setCsvError('No valid team members found in CSV.' + (errors.length > 0 ? ' ' + errors.join('; ') : ''));
        return;
      }

      // Merge into members, replacing the default empty row if it's still blank
      setMembers(prev => {
        const hasOnlyBlank = prev.length === 1 && !prev[0].name.trim();
        return hasOnlyBlank ? parsed : [...prev, ...parsed];
      });

      setCsvSuccess(`Imported ${parsed.length} team member${parsed.length !== 1 ? 's' : ''} from CSV.${errors.length > 0 ? ` (${errors.length} rows skipped)` : ''}`);
      // Switch to manual mode so user can review
      setInputMode('manual');
    } catch (err) {
      setCsvError(`Failed to parse CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setCsvError('Please drop a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => processCSVContent(ev.target?.result as string);
    reader.readAsText(file);
  }, [processCSVContent]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processCSVContent(ev.target?.result as string);
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [processCSVContent]);

  const downloadTeamTemplate = () => {
    const csv = `name,role,notes,experienceLevel
AI Tech Lead 1,Developer,Full-stack engineer,Senior
AI Tech Backend 1,Developer,Full-stack engineer,Senior
AI Tech Backend 2,Developer,Full-stack engineer,Mid
AI Tech Backend 3,Developer,Full-stack engineer,Mid
AI Tech Backend 4,Developer,Full-stack engineer,Junior
AI Tech Frontend 1,Developer,Full-stack engineer,Junior
AI Tech Frontend 2,Developer,Full-stack engineer,Senior
AI Tech Frontend 3,Developer,Full-stack engineer,Mid
AI Tech Frontend 4,Developer,Full-stack engineer,Junior`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'team-members-template.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              {step === 'product-info' ? (
                <Package className="w-4 h-4 text-blue-600" />
              ) : (
                <Users className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {step === 'product-info' ? 'Create Product' : 'Add Team Members'}
              </h2>
              <p className="text-xs text-gray-500">
                {step === 'product-info'
                  ? 'Step 1 of 2 — Name your product'
                  : 'Step 2 of 2 — Build your team roster'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              step === 'product-info'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'product-info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-600 text-white'
              }`}>
                {step === 'product-info' ? '1' : '\u2713'}
              </span>
              Product Info
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              step === 'team-setup'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'team-setup'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}>
                2
              </span>
              Team Members
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {step === 'product-info' ? (
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Customer Portal, Admin Dashboard, Mobile App"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && productName.trim()) {
                    e.preventDefault();
                    setStep('team-setup');
                  }
                }}
              />
              <p className="mt-2 text-xs text-gray-500">
                A product groups related releases together. Each product has its own team roster.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Add team members who will work on <span className="font-semibold text-gray-900">{productName}</span>.
                You can always add or edit members later from the team roster.
              </p>

              {/* Input Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                <button
                  onClick={() => { setInputMode('csv'); setCsvSuccess(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'csv'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                </button>
                <button
                  onClick={() => { setInputMode('manual'); setCsvError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Manual Add
                </button>
              </div>

              {/* Success Banner */}
              {csvSuccess && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {csvSuccess}
                </div>
              )}

              {inputMode === 'manual' ? (
                <>
                  {/* Team Members List */}
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="group flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors"
                  >
                    {/* Row Number */}
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-5">
                      <span className="text-[10px] font-bold text-gray-500">{index + 1}</span>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-[1.5fr_110px_110px_1fr] gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Name</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          placeholder="Team member name"
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          autoFocus={index === members.length - 1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addMember();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Role</label>
                        <select
                          value={member.role}
                          onChange={(e) => updateMember(index, 'role', e.target.value)}
                          className={`w-full px-2.5 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium ${getRoleBadgeColor(member.role)}`}
                        >
                          <option value="Developer">Developer</option>
                          <option value="Designer">Designer</option>
                          <option value="QA">QA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Level</label>
                        <select
                          value={member.experienceLevel}
                          onChange={(e) => updateMember(index, 'experienceLevel', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="Junior">Junior</option>
                          <option value="Mid">Mid</option>
                          <option value="Senior">Senior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</label>
                        <input
                          type="text"
                          value={member.notes}
                          onChange={(e) => updateMember(index, 'notes', e.target.value)}
                          placeholder="Optional"
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeMember(index)}
                      className="p-1.5 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 mt-5"
                      title="Remove member"
                      disabled={members.length === 1}
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${members.length === 1 ? 'text-gray-300' : 'text-red-500'}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Row Button */}
              <button
                onClick={addMember}
                className="mt-3 flex items-center gap-2 px-3 py-2 w-full justify-center border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add another team member
              </button>

              {/* Summary */}
              {validMembers.length > 0 && (
                <div className="mt-4 flex items-center gap-4 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                  <span className="font-medium">{validMembers.length} member{validMembers.length !== 1 ? 's' : ''}</span>
                  <span className="text-gray-300">|</span>
                  <span>{validMembers.filter(m => m.role === 'Developer').length} Dev</span>
                  <span>{validMembers.filter(m => m.role === 'Designer').length} Design</span>
                  <span>{validMembers.filter(m => m.role === 'QA').length} QA</span>
                </div>
              )}
                </>
              ) : (
                /* CSV Import Mode */
                <div className="space-y-4">
                  {/* Download Template */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-800 font-medium mb-1">
                        Need a template? Download a pre-filled CSV with sample data.
                      </p>
                      <p className="text-xs text-blue-700">
                        Includes 9 sample AI Tech team members with roles, experience levels, and notes. Edit and upload to bulk-import your team.
                      </p>
                    </div>
                    <button
                      onClick={downloadTeamTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Template
                    </button>
                  </div>

                  {/* Error Banner */}
                  {csvError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>{csvError}</span>
                    </div>
                  )}

                  {/* Drop Zone */}
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleFileDrop}
                    className={`flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {isDragging ? 'Drop CSV file here' : 'Drag & drop a CSV file'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or <span className="text-blue-600 underline">browse files</span>
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Expected Format */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Expected CSV format</p>
                    <div className="text-xs font-mono text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                      <div className="text-gray-900 font-semibold">name,role,experienceLevel</div>
                      <div>Jane Doe,Developer,Senior</div>
                      <div>John Smith,Designer,Mid</div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Only <span className="font-medium">name</span> is required. Role defaults to Developer, experience level defaults to Mid.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {step === 'team-setup' && (
              <button
                onClick={() => setStep('product-info')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {step === 'product-info' ? (
              <button
                onClick={() => setStep('team-setup')}
                disabled={!productName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Add Team
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                >
                  Skip, create without team
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={validMembers.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Product & Team
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
