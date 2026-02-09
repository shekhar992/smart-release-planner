import { useState } from 'react';
import { Plus, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { mockTeamMembers, TeamMember } from '../data/mockData';

export function TeamRoster() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState(mockTeamMembers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-blue-100 text-blue-700';
      case 'Designer': return 'bg-purple-100 text-purple-700';
      case 'QA': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-gray-900">Team Roster</h1>
              <p className="text-sm text-gray-500">{teamMembers.length} team members</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map(member => (
              <div
                key={member.id}
                onClick={() => navigate(`/team/${member.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      {member.pto.length > 0 && (
                        <span className="text-xs text-gray-500">
                          • {member.pto.length} PTO {member.pto.length === 1 ? 'entry' : 'entries'}
                        </span>
                      )}
                    </div>
                    {member.notes && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{member.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No team members yet</h3>
              <p className="text-sm text-gray-500 mb-4">Add your first team member to get started.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Team Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <AddTeamMemberModal
          onClose={() => setShowAddForm(false)}
          onAdd={(member) => {
            setTeamMembers(prev => [...prev, member]);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

interface AddTeamMemberModalProps {
  onClose: () => void;
  onAdd: (member: TeamMember) => void;
}

function AddTeamMemberModal({ onClose, onAdd }: AddTeamMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Developer' | 'Designer' | 'QA'>('Developer');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember: TeamMember = {
      id: `tm${Date.now()}`,
      name: name.trim(),
      role,
      notes: notes.trim() || undefined,
      pto: []
    };

    onAdd(newMember);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Add Team Member</h3>
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
                placeholder="e.g., Sarah Chen"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Developer' | 'Designer' | 'QA')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="QA">QA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Lead designer for customer portal"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                rows={3}
              />
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
              Add Team Member
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
