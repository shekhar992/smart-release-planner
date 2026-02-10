import { useState, useEffect, useRef } from 'react';
import { X, User, Trash2, ArrowRightLeft, ChevronDown, Check } from 'lucide-react';
import { Ticket, Release, TeamMember } from '../data/mockData';

interface TicketDetailsPanelProps {
  ticket: Ticket;
  featureId: string;
  release: Release;
  teamMembers: TeamMember[];
  onClose: () => void;
  onUpdate: (featureId: string, ticketId: string, updates: Partial<Ticket>) => void;
  onDelete: (featureId: string, ticketId: string) => void;
  onMoveToFeature: (fromFeatureId: string, ticketId: string, toFeatureId: string) => void;
}

export function TicketDetailsPanel({ 
  ticket, 
  featureId, 
  release, 
  teamMembers,
  onClose, 
  onUpdate,
  onDelete,
  onMoveToFeature
}: TicketDetailsPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (showMoveMenu) {
          setShowMoveMenu(false);
        } else if (showAssigneeDropdown) {
          setShowAssigneeDropdown(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteConfirm, showMoveMenu, showAssigneeDropdown]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = (field: keyof Ticket, value: any) => {
    onUpdate(featureId, ticket.id, { [field]: value });
  };

  const handleDelete = () => {
    onDelete(featureId, ticket.id);
    onClose();
  };

  // Derive sprint association from ticket dates
  const getAssociatedSprint = () => {
    if (!release.sprints || release.sprints.length === 0) return null;
    return release.sprints.find(sprint => {
      const sprintStart = sprint.startDate.getTime();
      const sprintEnd = sprint.endDate.getTime();
      const ticketStart = ticket.startDate.getTime();
      return ticketStart >= sprintStart && ticketStart <= sprintEnd;
    });
  };

  const associatedSprint = getAssociatedSprint();
  const currentFeature = release.features.find(f => f.id === featureId);
  const featureName = currentFeature?.name || '';
  const otherFeatures = release.features.filter(f => f.id !== featureId);

  const getDuration = () => {
    const diffTime = Math.abs(ticket.endDate.getTime() - ticket.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get unique team member names for dropdown
  const allTeamNames = teamMembers.map(m => m.name);
  const ticketAssignees = release.features
    .flatMap(f => f.tickets)
    .map(t => t.assignedTo)
    .filter(name => name && name !== 'Unassigned');
  const uniqueNames = [...new Set([...allTeamNames, ...ticketAssignees])].sort();
  const filteredNames = assigneeSearch
    ? uniqueNames.filter(name => name.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : uniqueNames;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in border-l border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <div className="flex-1 min-w-0">
            {/* Feature breadcrumb with move */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 leading-relaxed">{featureName}</span>
              {otherFeatures.length > 0 && (
                <div ref={moveMenuRef} className="relative">
                  <button
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Move to another feature"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Move
                  </button>
                  {showMoveMenu && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px] py-1">
                      <div className="px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Move to feature
                      </div>
                      {otherFeatures.map(f => (
                        <button
                          key={f.id}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          onClick={() => {
                            onMoveToFeature(featureId, ticket.id, f.id);
                            setShowMoveMenu(false);
                          }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              value={ticket.title}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="w-full text-base font-normal text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-gray-400 hover:text-red-500"
              title="Delete ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200/60 rounded-lg transition-all"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-xs text-red-700">Delete this ticket permanently?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs text-gray-600 hover:bg-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Description
            </label>
            <textarea
              value={ticket.description || ''}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="Add a description..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm resize-none bg-gray-50/50 transition-all duration-200 leading-relaxed"
              rows={4}
            />
          </div>

          {/* Story Points - Quick Select + Custom */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Story Points
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5, 8, 13].map(sp => (
                <button
                  key={sp}
                  onClick={() => handleUpdate('storyPoints', sp)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    ticket.storyPoints === sp 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sp}
                </button>
              ))}
              <input
                type="number"
                value={ticket.storyPoints}
                onChange={(e) => handleUpdate('storyPoints', parseInt(e.target.value) || 0)}
                min="0"
                max="100"
                className="w-16 px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm text-center bg-gray-50/50"
              />
            </div>
          </div>

          {/* Assigned Developer - Searchable Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Assigned Developer
            </label>
            <div ref={assigneeRef} className="relative">
              <div
                className="flex items-center w-full px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 bg-gray-50/50 transition-all"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              >
                <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className={`flex-1 text-sm ${ticket.assignedTo === 'Unassigned' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {ticket.assignedTo}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
              </div>
              
              {showAssigneeDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[240px] flex flex-col">
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
                      className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      onClick={() => {
                        handleUpdate('assignedTo', 'Unassigned');
                        setShowAssigneeDropdown(false);
                        setAssigneeSearch('');
                      }}
                    >
                      Unassigned
                      {ticket.assignedTo === 'Unassigned' && <Check className="w-3 h-3 text-blue-600" />}
                    </button>
                    {filteredNames.map(name => (
                      <button
                        key={name}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between"
                        onClick={() => {
                          handleUpdate('assignedTo', name);
                          setShowAssigneeDropdown(false);
                          setAssigneeSearch('');
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-medium">
                            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          {name}
                        </span>
                        {ticket.assignedTo === name && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    ))}
                    {filteredNames.length === 0 && assigneeSearch && (
                      <div className="px-3 py-4 text-xs text-gray-400 text-center">
                        No team members found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status - Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Status
            </label>
            <div className="flex gap-2">
              {[
                { value: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                { value: 'in-progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { value: 'completed', label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' }
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => handleUpdate('status', s.value)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    ticket.status === s.value 
                      ? `${s.color} ring-2 ring-offset-1 ${s.value === 'planned' ? 'ring-gray-300' : s.value === 'in-progress' ? 'ring-blue-300' : 'ring-green-300'}`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                Start Date
              </label>
              <input
                type="date"
                value={ticket.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleUpdate('startDate', new Date(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all duration-200 leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                End Date
              </label>
              <input
                type="date"
                value={ticket.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleUpdate('endDate', new Date(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all duration-200 leading-relaxed"
              />
            </div>
          </div>

          {/* Derived Information */}
          <div className="pt-4 border-t border-gray-200/50 space-y-3">
            <div className="flex items-center justify-between text-sm leading-relaxed">
              <span className="text-gray-500">Duration</span>
              <span className="font-normal text-gray-900">{getDuration()} days</span>
            </div>
            
            <div className="flex items-center justify-between text-sm leading-relaxed">
              <span className="text-gray-500">Sprint</span>
              <span className={`font-normal ${associatedSprint ? 'text-blue-700 bg-blue-50 px-2 py-1 rounded-lg' : 'text-gray-400'}`}>
                {associatedSprint ? associatedSprint.name : 'Not in sprint'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm leading-relaxed">
              <span className="text-gray-500">Feature</span>
              <span className="font-normal text-gray-900">{featureName}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Press Esc to close</span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-normal rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}