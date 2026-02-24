import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Trash2, Edit2, X, User } from 'lucide-react';
import { cn } from './ui/utils';
import { useParams, useNavigate } from 'react-router';
import { mockTeamMembers, TeamMember, PTOEntry } from '../data/mockData';
import { loadTeamMembers, saveTeamMembers } from '../lib/localStorage';

export function TeamMemberDetail() {
  const { memberId, productId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [showAddPTO, setShowAddPTO] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  
  // Load team member from localStorage on mount
  useEffect(() => {
    const storedTeamMembers = loadTeamMembers() || mockTeamMembers;
    setAllMembers(storedTeamMembers);
    const memberData = storedTeamMembers.find(m => m.id === memberId);
    setMember(memberData || null);
  }, [memberId]);

  // Persist changes to localStorage whenever member is updated
  const persistMember = (updatedMember: TeamMember) => {
    const updatedAll = allMembers.map(m => m.id === updatedMember.id ? updatedMember : m);
    setAllMembers(updatedAll);
    saveTeamMembers(updatedAll);
  };

  const backPath = productId ? `/product/${productId}/team` : '/team';
  
  if (member === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!member) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Team member not found</h2>
          <button
            onClick={() => navigate(backPath)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Back to Team Roster
          </button>
        </div>
      </div>
    );
  }
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Designer': return 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'QA': return 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300';
    }
  };

  const getExperienceLevelColor = (level?: string) => {
    switch (level) {
      case 'Senior': return 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Mid': return 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Junior': return 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-400';
    }
  };

  const addPTO = (pto: PTOEntry) => {
    const updated = {
      ...member,
      pto: [...member.pto, pto].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    } as TeamMember;
    setMember(updated);
    persistMember(updated);
  };

  const deletePTO = (ptoId: string) => {
    const updated = {
      ...member,
      pto: member.pto.filter(p => p.id !== ptoId)
    } as TeamMember;
    setMember(updated);
    persistMember(updated);
  };

  const updateMemberInfo = (updates: Partial<TeamMember>) => {
    const updated = { ...member, ...updates } as TeamMember;
    setMember(updated);
    persistMember(updated);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/30 dark:bg-slate-800/30">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            title="Back to Team Roster"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{member.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Team Member Details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Member Info Card */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Information</h2>
              </div>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                {isEditingInfo ? (
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Edit2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>

            {isEditingInfo ? (
              <EditMemberInfoForm
                member={member}
                onSave={(updates) => {
                  updateMemberInfo(updates);
                  setIsEditingInfo(false);
                }}
                onCancel={() => setIsEditingInfo(false)}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Name</label>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{member.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Role</label>
                  <span className={cn("inline-block px-3 py-1.5 text-xs font-semibold rounded-xl", getRoleColor(member.role))}>
                    {member.role}
                  </span>
                </div>
                {member.experienceLevel && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Experience Level</label>
                    <div className="flex items-center gap-3">
                      <span className={cn("inline-block px-3 py-1.5 text-xs font-semibold rounded-xl", getExperienceLevelColor(member.experienceLevel))}>
                        {member.experienceLevel}
                      </span>
                      {member.velocityMultiplier !== undefined && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          • {member.velocityMultiplier.toFixed(1)}x velocity
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {member.notes && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Notes</label>
                    <p className="text-sm text-slate-900 dark:text-white">{member.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PTO Section */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Time Off (PTO)</h2>
              </div>
              <button
                onClick={() => setShowAddPTO(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
              >
                <Plus className="w-4 h-4" />
                Add PTO
              </button>
            </div>

            {member.pto.length > 0 ? (
              <div className="space-y-3">
                {member.pto.map(pto => (
                  <div
                    key={pto.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{pto.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {pto.startDate.toLocaleDateString()} - {pto.endDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePTO(pto.id)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200"
                      title="Delete PTO"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No PTO entries yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add PTO Modal */}
      {showAddPTO && (
        <AddPTOModal
          onClose={() => setShowAddPTO(false)}
          onAdd={(pto) => {
            addPTO(pto);
            setShowAddPTO(false);
          }}
        />
      )}
    </div>
  );
}

interface EditMemberInfoFormProps {
  member: TeamMember;
  onSave: (updates: Partial<TeamMember>) => void;
  onCancel: () => void;
}

function EditMemberInfoForm({ member, onSave, onCancel }: EditMemberInfoFormProps) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [experienceLevel, setExperienceLevel] = useState<'Junior' | 'Mid' | 'Senior' | 'Lead'>(member.experienceLevel || 'Mid');
  const [velocityMultiplier, setVelocityMultiplier] = useState(member.velocityMultiplier || 1.0);
  const [notes, setNotes] = useState(member.notes || '');

  // Update velocity multiplier when experience level changes
  const handleExperienceLevelChange = (level: 'Junior' | 'Mid' | 'Senior' | 'Lead') => {
    setExperienceLevel(level);
    const defaultVelocity = 
      level === 'Junior' ? 0.7 : 
      level === 'Senior' ? 1.3 : 
      level === 'Lead' ? 1.5 : 
      1.0;
    setVelocityMultiplier(defaultVelocity);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      name, 
      role, 
      experienceLevel,
      velocityMultiplier,
      notes: notes.trim() || undefined 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as TeamMember['role'])}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
        >
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
            <option value="Developer">Developer (Legacy)</option>
          </optgroup>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Experience Level</label>
        <select
          value={experienceLevel}
          onChange={(e) => handleExperienceLevelChange(e.target.value as 'Junior' | 'Mid' | 'Senior' | 'Lead')}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
        >
          <option value="Junior">Junior</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Velocity Multiplier</label>
        <input
          type="number"
          value={velocityMultiplier}
          onChange={(e) => setVelocityMultiplier(parseFloat(e.target.value) || 1.0)}
          min="0.1"
          max="3.0"
          step="0.1"
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {velocityMultiplier < 0.8 && 'Slower pace - suitable for juniors or complex work'}
          {velocityMultiplier >= 0.8 && velocityMultiplier < 1.2 && 'Standard pace - typical developer velocity'}
          {velocityMultiplier >= 1.2 && velocityMultiplier < 1.5 && 'Faster pace - senior developer velocity'}
          {velocityMultiplier >= 1.5 && 'Expert pace - lead developer velocity'}
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Specializes in React, Available part-time, etc."
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm resize-none transition-all duration-200"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface AddPTOModalProps {
  onClose: () => void;
  onAdd: (pto: PTOEntry) => void;
}

function AddPTOModal({ onClose, onAdd }: AddPTOModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPTO: PTOEntry = {
      id: `pto${Date.now()}`,
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    onAdd(newPTO);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Time Off</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5 bg-slate-50/30 dark:bg-slate-800/30">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Vacation, Sick Leave, Conference"
                autoFocus
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
            >
              Add PTO
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
