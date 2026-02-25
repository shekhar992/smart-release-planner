import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, ChevronDown, Check, User, Sparkles, Layers, Link2 } from 'lucide-react';
import { cn } from './ui/utils';
import { Release, Ticket, TeamMember, mockHolidays } from '../data/mockData';
import { suggestEffortDays } from '../lib/effortSuggestion';
import { calculateEndDateFromEffort, calculateEffortFromDates, toLocalDateString } from '../lib/dateUtils';
import { loadHolidays } from '../lib/localStorage';
import { type TeamRole } from '../lib/roleColors';
import { DatePicker } from './DatePicker';

interface TicketCreationModalProps {
  release: Release;
  teamMembers: TeamMember[];
  preselectedFeatureId?: string;
  onClose: () => void;
  onAddFeature: (name: string) => string; // returns new feature id
  onAddTicket: (featureId: string, ticket: Omit<Ticket, 'id'>) => void;
}

type Step = 'feature' | 'ticket';

export function TicketCreationModal({
  release,
  teamMembers,
  preselectedFeatureId,
  onClose,
  onAddFeature,
  onAddTicket
}: TicketCreationModalProps) {
  const [step, setStep] = useState<Step>(preselectedFeatureId ? 'ticket' : 'feature');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(preselectedFeatureId || '');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [isCreatingFeature, setIsCreatingFeature] = useState(false);
  const featureInputRef = useRef<HTMLInputElement>(null);

  // Ticket form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effortDays, setEffortDays] = useState(3);
  const [assignedTo, setAssignedTo] = useState('Unassigned');
  const [status, setStatus] = useState<Ticket['status']>('planned');
  const [startDate, setStartDate] = useState(toLocalDateString(new Date()));
  const [endDate, setEndDate] = useState(
    toLocalDateString(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))
  );
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [requiredRole, setRequiredRole] = useState<TeamRole | ''>('');
  const [blockedBy, setBlockedBy] = useState<string[]>([]);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Load holidays for date calculations
  const holidays = useMemo(() => loadHolidays() || mockHolidays, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAssigneeDropdown) {
          setShowAssigneeDropdown(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showAssigneeDropdown]);

  // Close assignee dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus on title when entering ticket step
  useEffect(() => {
    if (step === 'ticket' && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Focus feature input when creating
  useEffect(() => {
    if (isCreatingFeature && featureInputRef.current) {
      featureInputRef.current.focus();
    }
  }, [isCreatingFeature]);

  const allTeamNames = teamMembers.map(m => m.name);
  const ticketAssignees = release.features
    .flatMap(f => f.tickets)
    .map(t => t.assignedTo)
    .filter(name => name && name !== 'Unassigned');
  const uniqueNames = [...new Set([...allTeamNames, ...ticketAssignees])].sort();
  const filteredNames = assigneeSearch
    ? uniqueNames.filter(name => name.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : uniqueNames;

  const selectedFeature = release.features.find(f => f.id === selectedFeatureId);

  const handleCreateFeature = () => {
    if (!newFeatureName.trim()) return;
    const newId = onAddFeature(newFeatureName.trim());
    setSelectedFeatureId(newId);
    setIsCreatingFeature(false);
    setNewFeatureName('');
    setStep('ticket');
  };

  const handleSelectFeature = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setStep('ticket');
  };

  const datesInvalid = startDate && endDate && endDate < startDate;

  const handleCreateTicket = () => {
    if (!title.trim() || !selectedFeatureId || datesInvalid) return;
    onAddTicket(selectedFeatureId, {
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      effortDays,
      storyPoints: effortDays, // Backward compatibility
      assignedTo,
      requiredRole: requiredRole || undefined,
      dependencies: blockedBy.length > 0 ? { blockedBy } : undefined
    });
    onClose();
  };

  const handleCreateAndAddAnother = () => {
    if (!title.trim() || !selectedFeatureId || datesInvalid) return;
    onAddTicket(selectedFeatureId, {
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      effortDays,
      storyPoints: effortDays, // Backward compatibility
      assignedTo,
      requiredRole: requiredRole || undefined,
      dependencies: blockedBy.length > 0 ? { blockedBy } : undefined
    });
    // Reset ticket fields for next one
    setTitle('');
    setDescription('');
    setEffortDays(3);
    setRequiredRole('');
    setBlockedBy([]);
    setStartDate(endDate); // Next ticket starts where this one ends
    const nextEnd = new Date(new Date(endDate).getTime() + 5 * 24 * 60 * 60 * 1000);
    setEndDate(toLocalDateString(nextEnd));
    titleInputRef.current?.focus();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {step === 'feature' ? 'Select Feature' : 'Create Ticket'}
              </h3>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  step === 'feature' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-blue-200 dark:bg-blue-800'
                )} />
                <div className="w-6 h-px bg-slate-300 dark:bg-slate-600" />
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  step === 'ticket' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'
                )} />
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-800/30">
          {step === 'feature' && (
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose an existing feature or create a new one. Tickets are organized under features, similar to how Jira organizes stories under epics.
              </p>

              {/* Existing Features */}
              {release.features.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Existing Features</label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-[200px] overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                    {release.features.map(feature => (
                      <button
                        key={feature.id}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 flex items-center justify-between",
                          selectedFeatureId === feature.id && 'bg-blue-50 dark:bg-blue-950/30'
                        )}
                        onClick={() => handleSelectFeature(feature.id)}
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-white">{feature.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {feature.tickets.length} ticket{feature.tickets.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {selectedFeatureId === feature.id && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Feature */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {release.features.length > 0 ? 'Or Create New Feature' : 'Create a Feature'}
                </label>
                {isCreatingFeature ? (
                  <div className="flex gap-2">
                    <input
                      ref={featureInputRef}
                      type="text"
                      value={newFeatureName}
                      onChange={(e) => setNewFeatureName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFeature();
                        if (e.key === 'Escape') setIsCreatingFeature(false);
                      }}
                      placeholder="Feature name (e.g., User Authentication)"
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                    />
                    <button
                      onClick={handleCreateFeature}
                      disabled={!newFeatureName.trim()}
                      className="px-4 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setIsCreatingFeature(false); setNewFeatureName(''); }}
                      className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingFeature(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    New Feature
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'ticket' && (
            <div className="px-6 py-5 space-y-5">
              {/* Feature indicator with back button */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Feature</span>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{selectedFeature?.name}</span>
                {!preselectedFeatureId && (
                  <button
                    onClick={() => setStep('feature')}
                    className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Ticket Title *</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Implement OAuth 2.0 login flow"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm resize-none transition-all duration-200"
                />
              </div>

              {/* Effort Days + Status Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Effort Days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Effort (Days)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={effortDays}
                    onChange={(e) => {
                      const newEffort = parseFloat(e.target.value) || 1;
                      setEffortDays(newEffort);
                      // Get velocity and calculate adjusted duration
                      const assignedDev = teamMembers.find(m => m.name === assignedTo);
                      const velocity = assignedDev?.velocityMultiplier ?? 1;
                      const adjustedDuration = Math.max(1, Math.round(newEffort / velocity));
                      // Recalculate endDate from velocity-adjusted duration (working days)
                      const newEndDate = calculateEndDateFromEffort(new Date(startDate), adjustedDuration, holidays);
                      setEndDate(toLocalDateString(newEndDate));
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                    placeholder="e.g., 3"
                  />
                  {/* Effort Suggestion Engine */}
                  {title.trim() && (() => {
                    const assigneeRole = teamMembers.find(m => m.name === assignedTo)?.role;
                    const suggestion = suggestEffortDays(title, assigneeRole);
                    return (
                      <div className="mt-2.5 space-y-2">
                        <div className="flex items-center justify-between px-3 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-violet-200 dark:border-violet-800 rounded-xl shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-violet-500" />
                            <span className="text-[10px] text-slate-600 dark:text-slate-400">AI Suggestion: </span>
                            <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">{suggestion.suggestedDays}d</span>
                            <span className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded-md font-semibold',
                              suggestion.confidence === 'high'
                                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : suggestion.confidence === 'medium'
                                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                            )}>{suggestion.confidence}</span>
                          </div>
                          <button
                            onClick={() => {
                              setEffortDays(suggestion.suggestedDays);
                              // Get velocity and calculate adjusted duration
                              const assignedDev = teamMembers.find(m => m.name === assignedTo);
                              const velocity = assignedDev?.velocityMultiplier ?? 1;
                              const adjustedDuration = Math.max(1, Math.round(suggestion.suggestedDays / velocity));
                              // Recalculate endDate from velocity-adjusted duration (working days)
                              const newEndDate = calculateEndDateFromEffort(new Date(startDate), adjustedDuration, holidays);
                              setEndDate(toLocalDateString(newEndDate));
                            }}
                            className="text-[10px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/30 px-2 py-0.5 rounded-md transition-all duration-200"
                          >
                            Apply
                          </button>
                        </div>
                        {suggestion.factors.length > 0 && (
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 px-1">
                            {suggestion.factors.join(' • ')}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Ticket['status'])}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assigned Developer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Assigned Developer</label>
                <div ref={assigneeRef} className="relative">
                  <div
                    className="flex items-center w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                    <span className={cn(
                      'flex-1 text-sm',
                      assignedTo === 'Unassigned' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                    )}>
                      {assignedTo}
                    </span>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200',
                      showAssigneeDropdown && 'rotate-180'
                    )} />
                  </div>

                  {showAssigneeDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-[220px] flex flex-col">
                      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search team members..."
                          autoFocus
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <button
                          className="w-full text-left px-3 py-2.5 text-xs text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-colors duration-200"
                          onClick={() => {
                            setAssignedTo('Unassigned');
                            setShowAssigneeDropdown(false);
                            setAssigneeSearch('');
                            // Recalculate end date with default velocity (1.0)
                            const adjustedDuration = Math.max(1, Math.round(effortDays / 1));
                            const newEndDate = calculateEndDateFromEffort(new Date(startDate), adjustedDuration, holidays);
                            setEndDate(toLocalDateString(newEndDate));
                          }}
                        >
                          Unassigned
                          {assignedTo === 'Unassigned' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        {filteredNames.map(name => (
                          <button
                            key={name}
                            className="w-full text-left px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-between transition-colors duration-200"
                            onClick={() => {
                              setAssignedTo(name);
                              setShowAssigneeDropdown(false);
                              setAssigneeSearch('');
                              // Recalculate end date with new developer's velocity
                              const newDev = teamMembers.find(m => m.name === name);
                              const velocity = newDev?.velocityMultiplier ?? 1;
                              const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
                              const newEndDate = calculateEndDateFromEffort(new Date(startDate), adjustedDuration, holidays);
                            setEndDate(toLocalDateString(newEndDate));
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-semibold shadow-sm">
                                {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              {name}
                            </span>
                            {assignedTo === name && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Role & Dependencies Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Required Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Required Role (Optional)</label>
                  <select
                    value={requiredRole}
                    onChange={(e) => setRequiredRole(e.target.value as TeamRole | '')}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Any Role</option>
                    <optgroup label="Web Development">
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Fullstack">Fullstack</option>
                      <option value="DataEngineer">Data Engineer</option>
                    </optgroup>
                    <optgroup label="Mobile Development">
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Designer">Designer</option>
                      <option value="QA">QA</option>
                    </optgroup>
                  </select>
                </div>

                {/* Blocked By (Dependencies) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3" />
                    Blocked By (Optional)
                  </label>
                  <select
                    multiple
                    value={blockedBy}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setBlockedBy(selected);
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200 min-h-[44px]"
                  >
                    {release.features.flatMap(f => f.tickets).map(ticket => (
                      <option key={ticket.id} value={ticket.id} className="py-1">
                        {ticket.title.substring(0, 40)}{ticket.title.length > 40 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                  {blockedBy.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {blockedBy.length} ticket{blockedBy.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(isoDate) => {
                    setStartDate(isoDate);
                    // Get velocity and calculate adjusted duration
                    const assignedDev = teamMembers.find(m => m.name === assignedTo);
                    const velocity = assignedDev?.velocityMultiplier ?? 1;
                    const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
                    // Recalculate endDate to maintain velocity-adjusted duration (working days)
                    const newEndDate = calculateEndDateFromEffort(new Date(isoDate), adjustedDuration, holidays);
                    setEndDate(toLocalDateString(newEndDate));
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(isoDate) => {
                    setEndDate(isoDate);
                    // Calculate working days and reverse to effort with velocity
                    const workingDays = calculateEffortFromDates(new Date(startDate), new Date(isoDate), holidays);
                    const assignedDev = teamMembers.find(m => m.name === assignedTo);
                    const velocity = assignedDev?.velocityMultiplier ?? 1;
                    const newEffort = Math.max(0.5, Math.round(workingDays * velocity * 2) / 2); // Round to nearest 0.5
                    setEffortDays(newEffort);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Press Esc to close</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200"
            >
              Cancel
            </button>
            {step === 'ticket' && (
              <>
                <button
                  onClick={handleCreateAndAddAnother}
                  disabled={!title.trim() || !!datesInvalid}
                  className="px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/40 dark:hover:to-blue-800/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create & Add Another
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={!title.trim() || !!datesInvalid}
                  className="px-4 py-2.5 text-sm text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                >
                  Create Ticket
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
