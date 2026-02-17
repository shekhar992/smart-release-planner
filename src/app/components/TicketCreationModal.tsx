import { useState, useEffect, useRef } from 'react';
import { X, Plus, ChevronDown, Check, User, Sparkles } from 'lucide-react';
import { Release, Ticket, TeamMember } from '../data/mockData';
import { suggestEffortDays } from '../lib/effortSuggestion';
import { calculateEndDateFromEffort, calculateEffortFromDates } from '../lib/dateUtils';

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
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
      assignedTo
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
      assignedTo
    });
    // Reset ticket fields for next one
    setTitle('');
    setDescription('');
    setEffortDays(3);
    setStartDate(endDate); // Next ticket starts where this one ends
    const nextEnd = new Date(new Date(endDate).getTime() + 5 * 24 * 60 * 60 * 1000);
    setEndDate(nextEnd.toISOString().split('T')[0]);
    titleInputRef.current?.focus();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-900">
              {step === 'feature' ? 'Select Feature' : 'Create Ticket'}
            </h3>
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${step === 'feature' ? 'bg-blue-600' : 'bg-blue-200'}`} />
              <div className="w-4 h-px bg-gray-300" />
              <div className={`w-2 h-2 rounded-full ${step === 'ticket' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'feature' && (
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Choose an existing feature or create a new one. Tickets are organized under features, similar to how Jira organizes stories under epics.
              </p>

              {/* Existing Features */}
              {release.features.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Existing Features</label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                    {release.features.map(feature => (
                      <button
                        key={feature.id}
                        className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                          selectedFeatureId === feature.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectFeature(feature.id)}
                      >
                        <div>
                          <div className="text-xs font-medium text-gray-800">{feature.name}</div>
                          <div className="text-[10px] text-gray-500">
                            {feature.tickets.length} ticket{feature.tickets.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {selectedFeatureId === feature.id && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Feature */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
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
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm"
                    />
                    <button
                      onClick={handleCreateFeature}
                      disabled={!newFeatureName.trim()}
                      className="px-4 py-2.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setIsCreatingFeature(false); setNewFeatureName(''); }}
                      className="px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingFeature(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-3 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Feature
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'ticket' && (
            <div className="px-6 py-5 space-y-5">
              {/* Feature indicator with back button */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Feature</span>
                <span className="text-xs font-medium text-blue-800">{selectedFeature?.name}</span>
                {!preselectedFeatureId && (
                  <button
                    onClick={() => setStep('feature')}
                    className="ml-auto text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Ticket Title *</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Implement OAuth 2.0 login flow"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50 resize-none"
                />
              </div>

              {/* Effort Days + Status Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Effort Days */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Effort (Days)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={effortDays}
                    onChange={(e) => {
                      const newEffort = parseFloat(e.target.value) || 1;
                      setEffortDays(newEffort);
                      // Recalculate endDate from effortDays (single source of truth)
                      const newEndDate = calculateEndDateFromEffort(new Date(startDate), newEffort);
                      setEndDate(newEndDate.toISOString().split('T')[0]);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                    placeholder="e.g., 3"
                  />
                  {/* Effort Suggestion Engine */}
                  {title.trim() && (() => {
                    const assigneeRole = teamMembers.find(m => m.name === assignedTo)?.role;
                    const suggestion = suggestEffortDays(title, assigneeRole);
                    return (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-violet-500" />
                            <span className="text-[10px] text-gray-600">Engine Suggestion: </span>
                            <span className="text-[10px] font-semibold text-gray-900">{suggestion.suggestedDays}d</span>
                            <span className={
                              `text-[9px] px-1.5 py-0.5 rounded ${
                                suggestion.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-600'
                              }`
                            }>{suggestion.confidence}</span>
                          </div>
                          <button
                            onClick={() => {
                              setEffortDays(suggestion.suggestedDays);
                              // Recalculate endDate from suggested effort
                              const newEndDate = calculateEndDateFromEffort(new Date(startDate), suggestion.suggestedDays);
                              setEndDate(newEndDate.toISOString().split('T')[0]);
                            }}
                            className="text-[10px] text-violet-600 hover:text-violet-700 font-medium hover:bg-violet-50 px-2 py-0.5 rounded transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        {suggestion.factors.length > 0 && (
                          <p className="text-[9px] text-gray-500">
                            {suggestion.factors.join(' • ')}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Ticket['status'])}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assigned Developer */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Assigned Developer</label>
                <div ref={assigneeRef} className="relative">
                  <div
                    className="flex items-center w-full px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 bg-gray-50/50 transition-all"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className={`flex-1 text-sm ${assignedTo === 'Unassigned' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {assignedTo}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {showAssigneeDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[200px] flex flex-col">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          type="text"
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search team members..."
                          autoFocus
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 flex items-center justify-between"
                          onClick={() => { setAssignedTo('Unassigned'); setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                        >
                          Unassigned
                          {assignedTo === 'Unassigned' && <Check className="w-3 h-3 text-blue-600" />}
                        </button>
                        {filteredNames.map(name => (
                          <button
                            key={name}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                            onClick={() => { setAssignedTo(name); setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                          >
                            <span className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-medium">
                                {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              {name}
                            </span>
                            {assignedTo === name && <Check className="w-3 h-3 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      // Recalculate endDate to maintain effort duration
                      const newEndDate = calculateEndDateFromEffort(new Date(e.target.value), effortDays);
                      setEndDate(newEndDate.toISOString().split('T')[0]);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      // Recalculate effortDays from new duration
                      const newEffort = calculateEffortFromDates(new Date(startDate), new Date(e.target.value));
                      setEffortDays(newEffort);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200 rounded-b-xl">
          <span className="text-[10px] text-gray-400">Press Esc to close</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {step === 'ticket' && (
              <>
                <button
                  onClick={handleCreateAndAddAnother}
                  disabled={!title.trim() || !!datesInvalid}
                  className="px-4 py-2.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create & Add Another
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={!title.trim() || !!datesInvalid}
                  className="px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
