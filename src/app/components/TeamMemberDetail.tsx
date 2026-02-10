import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Trash2, Edit2, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { mockTeamMembers, TeamMember, PTOEntry } from '../data/mockData';
import { loadTeamMembers } from '../lib/localStorage';

export function TeamMemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  
  // Load team member from localStorage on mount
  useEffect(() => {
    const storedTeamMembers = loadTeamMembers() || mockTeamMembers;
    const memberData = storedTeamMembers.find(m => m.id === memberId);
    setMember(memberData || null);
  }, [memberId]);
  
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
            onClick={() => navigate('/team')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Back to Team Roster
          </button>
        </div>
      </div>
    );
  }
  const [showAddPTO, setShowAddPTO] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-blue-100 text-blue-700';
      case 'Designer': return 'bg-purple-100 text-purple-700';
      case 'QA': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const addPTO = (pto: PTOEntry) => {
    setMember(prev => ({
      ...prev,
      pto: [...prev.pto, pto].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  };

  const deletePTO = (ptoId: string) => {
    setMember(prev => ({
      ...prev,
      pto: prev.pto.filter(p => p.id !== ptoId)
    }));
  };

  const updateMemberInfo = (updates: Partial<TeamMember>) => {
    setMember(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/team')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Back to Team Roster"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-medium text-gray-900">{member.name}</h1>
            <p className="text-sm text-gray-500">Team Member Details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Member Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Information</h2>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              >
                {isEditingInfo ? (
                  <X className="w-4 h-4 text-gray-600" />
                ) : (
                  <Edit2 className="w-4 h-4 text-gray-600" />
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
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{member.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
                {member.notes && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <p className="text-sm text-gray-900">{member.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PTO Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Time Off (PTO)</h2>
              <button
                onClick={() => setShowAddPTO(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add PTO
              </button>
            </div>

            {member.pto.length > 0 ? (
              <div className="space-y-2">
                {member.pto.map(pto => (
                  <div
                    key={pto.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pto.name}</p>
                        <p className="text-xs text-gray-500">
                          {pto.startDate.toLocaleDateString()} - {pto.endDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePTO(pto.id)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Delete PTO"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No PTO entries yet</p>
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
  const [notes, setNotes] = useState(member.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, role, notes: notes.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'Developer' | 'Designer' | 'QA')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="Developer">Developer</option>
          <option value="Designer">Designer</option>
          <option value="QA">QA</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
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
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Add Time Off</h3>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Vacation, Sick Leave, Conference"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Add PTO
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
