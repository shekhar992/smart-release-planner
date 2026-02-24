import { useState, useRef, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Plus, Trash2, Users, Package, UserPlus, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { TeamMember } from '../data/mockData';
import { parseCSV } from '../lib/csvParser';
import { deriveVelocityMultiplier } from '../lib/importMappings';
import { cn } from './ui/utils';
import { type TeamRole, getRoleColor, loadRoleColors } from '../lib/roleColors';

interface TeamMemberDraft {
  name: string;
  role: TeamRole;
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
    { name: '', role: 'Backend', experienceLevel: 'Mid', notes: '' }
  ]);
  const roleColors = loadRoleColors();
  const [inputMode, setInputMode] = useState<TeamInputMode>('csv');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMember = () => {
    setMembers(prev => [...prev, { name: '', role: 'Backend', experienceLevel: 'Mid', notes: '' }]);
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

  const getRoleBadgeColor = (role: TeamRole) => {
    const color = getRoleColor(role, roleColors);
    // Convert hex to CSS classes (simplified - using inline styles would be better but keeping structure)
    const roleColorMap: Record<string, string> = {
      'Frontend': 'bg-blue-50 text-blue-700 border-blue-200',
      'Backend': 'bg-purple-50 text-purple-700 border-purple-200',
      'Fullstack': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'QA': 'bg-orange-50 text-orange-700 border-orange-200',
      'Designer': 'bg-pink-50 text-pink-700 border-pink-200',
      'DataEngineer': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'iOS': 'bg-gray-50 text-gray-700 border-gray-200',
      'Android': 'bg-lime-50 text-lime-700 border-lime-200',
      'Developer': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return roleColorMap[role] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const normalizeRole = (role: string): TeamRole => {
    const lower = role.toLowerCase().trim();
    if (['frontend', 'front-end', 'fe', 'ui'].includes(lower)) return 'Frontend';
    if (['backend', 'back-end', 'be', 'api', 'server'].includes(lower)) return 'Backend';
    if (['fullstack', 'full-stack', 'full stack', 'fs', 'developer', 'dev', 'engineer'].includes(lower)) return 'Fullstack';
    if (['qa', 'quality', 'tester', 'test', 'quality assurance', 'sdet'].includes(lower)) return 'QA';
    if (['designer', 'design', 'ux', 'ui/ux', 'ux/ui', 'product designer'].includes(lower)) return 'Designer';
    if (['dataengineer', 'data engineer', 'data', 'de', 'data eng'].includes(lower)) return 'DataEngineer';
    if (['ios', 'swift', 'apple', 'iphone'].includes(lower)) return 'iOS';
    if (['android', 'kotlin', 'droid'].includes(lower)) return 'Android';
    return 'Backend'; // default
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
        const role = roleIdx >= 0 ? normalizeRole(row[roleIdx] || '') : 'Backend';
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
    const csv = `name,role,experienceLevel,velocityMultiplier,notes
Alice Chen,Backend,Senior,1.3,API design specialist
Bob Smith,Backend,Mid,1.0,Database expert
Carol White,Frontend,Mid,1.0,React & UI/UX
David Lee,Fullstack,Senior,1.3,Full-stack architect
Emma Wilson,QA,Mid,1.0,Test automation
Frank Zhang,Designer,Senior,1.3,Product design lead
Grace Kim,DataEngineer,Mid,1.0,Data pipelines
Henry Park,iOS,Senior,1.3,Swift specialist
Ivy Rodriguez,Android,Mid,1.0,Kotlin expert`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'team-members-template.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200',
              step === 'product-info'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
                : 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30'
            )}>
              {step === 'product-info' ? (
                <Package className="w-5 h-5 text-white" />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {step === 'product-info' ? 'Create Product' : 'Add Team Members'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'product-info'
                  ? 'Step 1 of 2 — Name your product'
                  : 'Step 2 of 2 — Build your team roster'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
              step === 'product-info'
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            )}>
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                step === 'product-info'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              )}>
                {step === 'product-info' ? '1' : '\u2713'}
              </span>
              Product Info
            </div>
            <div className="w-8 h-px bg-slate-300 dark:bg-slate-700" />
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
              step === 'team-setup'
                ? 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            )}>
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                step === 'team-setup'
                  ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              )}>
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Customer Portal, Admin Dashboard, Mobile App"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && productName.trim()) {
                    e.preventDefault();
                    setStep('team-setup');
                  }
                }}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                A product groups related releases together. Each product has its own team roster.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Add team members who will work on <span className="font-semibold text-slate-900 dark:text-white">{productName}</span>.
                You can always add or edit members later from the team roster.
              </p>

              {/* Input Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                <button
                  onClick={() => { setInputMode('csv'); setCsvSuccess(null); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                    inputMode === 'csv'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                </button>
                <button
                  onClick={() => { setInputMode('manual'); setCsvError(null); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                    inputMode === 'manual'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Manual Add
                </button>
              </div>

              {/* Success Banner */}
              {csvSuccess && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
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
                    className="group flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
                  >
                    {/* Row Number */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0 mt-5 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{index + 1}</span>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-[1.5fr_110px_110px_1fr] gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          placeholder="Team member name"
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 transition-all duration-200"
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
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Role</label>
                        <select
                          value={member.role}
                          onChange={(e) => updateMember(index, 'role', e.target.value)}
                          className={cn(
                            'w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold transition-all duration-200',
                            getRoleBadgeColor(member.role)
                          )}
                        >
                          <option value="Backend">Backend</option>
                          <option value="Frontend">Frontend</option>
                          <option value="Fullstack">Fullstack</option>
                          <option value="QA">QA</option>
                          <option value="Designer">Designer</option>
                          <option value="DataEngineer">Data Engineer</option>
                          <option value="iOS">iOS</option>
                          <option value="Android">Android</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Level</label>
                        <select
                          value={member.experienceLevel}
                          onChange={(e) => updateMember(index, 'experienceLevel', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white transition-all duration-200"
                        >
                          <option value="Junior">Junior</option>
                          <option value="Mid">Mid</option>
                          <option value="Senior">Senior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Notes</label>
                        <input
                          type="text"
                          value={member.notes}
                          onChange={(e) => updateMember(index, 'notes', e.target.value)}
                          placeholder="Optional"
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-500 dark:text-slate-400 placeholder-slate-400 bg-white/90 dark:bg-slate-900/90 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeMember(index)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 mt-5"
                      title="Remove member"
                      disabled={members.length === 1}
                    >
                      <Trash2 className={cn(
                        'w-3.5 h-3.5',
                        members.length === 1 ? 'text-slate-300 dark:text-slate-700' : 'text-red-500 dark:text-red-400'
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Row Button */}
              <button
                onClick={addMember}
                className="mt-3 flex items-center gap-2 px-3 py-2.5 w-full justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add another team member
              </button>

              {/* Summary */}
              {validMembers.length > 0 && (
                <div className="mt-4 flex items-center gap-4 px-3.5 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 shadow-sm">\n                  <span className="font-semibold text-slate-900 dark:text-white">{validMembers.length} member{validMembers.length !== 1 ? 's' : ''}</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
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
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold mb-1">
                        Need a template? Download a pre-filled CSV with sample data.
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Includes 9 sample AI Tech team members with roles, experience levels, and notes. Edit and upload to bulk-import your team.
                      </p>
                    </div>
                    <button
                      onClick={downloadTeamTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Template
                    </button>
                  </div>

                  {/* Error Banner */}
                  {csvError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{csvError}</span>
                    </div>
                  )}

                  {/* Drop Zone */}
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleFileDrop}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
                      isDragging
                        ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={cn(
                      'w-8 h-8 transition-colors',
                      isDragging ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    )} />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {isDragging ? 'Drop CSV file here' : 'Drag & drop a CSV file'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
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
                  <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Expected CSV format</p>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                      <div className="text-slate-900 dark:text-white font-semibold">name,role,experienceLevel,velocityMultiplier,notes</div>
                      <div>Alice Chen,Backend,Senior,1.3,API specialist</div>
                      <div>Bob Smith,Frontend,Mid,1.0,React expert</div>
                      <div>Carol White,QA,Mid,1.0,Test automation</div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                      Only <span className="font-semibold">name</span> is required. Supported roles: Backend, Frontend, Fullstack, QA, Designer, DataEngineer, iOS, Android. Experience defaults to Mid. Velocity auto-calculated if not provided.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
          <div>
            {step === 'team-setup' && (
              <button
                onClick={() => setStep('product-info')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200"
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
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200"
            >
              Cancel
            </button>
            {step === 'product-info' ? (
              <button
                onClick={() => setStep('team-setup')}
                disabled={!productName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Add Team
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-all duration-200"
                >
                  Skip, create without team
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={validMembers.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
