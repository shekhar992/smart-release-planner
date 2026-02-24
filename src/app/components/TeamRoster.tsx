import { useState, useEffect, useMemo } from 'react';
import { Plus, User, ArrowLeft, Calendar, X, Users } from 'lucide-react';
import { cn } from './ui/utils';
import { useNavigate, useParams } from 'react-router';
import { mockTeamMembers, TeamMember, mockProducts } from '../data/mockData';
import { loadTeamMembers, loadProducts, saveTeamMembers } from '../lib/localStorage';
import { loadRoleColors, getRoleColor as getRoleColorUtil, type TeamRole } from '../lib/roleColors';

export function TeamRoster() {
  const navigate = useNavigate();
  const { productId, releaseId } = useParams();
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  
  // Resolve productId from releaseId if needed (when navigating from release canvas)
  const resolvedProductId = useMemo(() => {
    if (productId) return productId;
    if (releaseId) {
      const products = loadProducts() || mockProducts;
      const product = products.find(p => p.releases.some(r => r.id === releaseId));
      return product?.id || null;
    }
    return null;
  }, [productId, releaseId]);

  // Get the product name for the header
  const productName = useMemo(() => {
    if (!resolvedProductId) return null;
    const products = loadProducts() || mockProducts;
    return products.find(p => p.id === resolvedProductId)?.name || null;
  }, [resolvedProductId]);

  // Load team members from localStorage on mount
  useEffect(() => {
    const storedTeamMembers = loadTeamMembers() || mockTeamMembers;
    setAllTeamMembers(storedTeamMembers);
  }, []);

  // Filter team members by product
  const teamMembers = useMemo(() => {
    if (!resolvedProductId) return allTeamMembers;
    return allTeamMembers.filter(m => m.productId === resolvedProductId);
  }, [allTeamMembers, resolvedProductId]);

  const [showAddForm, setShowAddForm] = useState(false);
  const roleColors = useMemo(() => loadRoleColors(), []);

  const getRoleBadgeColor = (role: string) => {
    // Get hex color and convert to Tailwind-friendly classes (fallback to solid color via style)
    const hexColor = getRoleColorUtil(role as TeamRole, roleColors);
    return hexColor;
  };

  const getExperienceLevelColor = (level?: string) => {
    switch (level) {
      case 'Lead': return 'bg-purple-100 text-purple-700';
      case 'Senior': return 'bg-blue-100 text-blue-700';
      case 'Mid': return 'bg-slate-100 text-slate-700';
      case 'Junior': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(releaseId ? `/release/${releaseId}` : '/')}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 dark:text-white">Team Roster</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {productName ? (
                    <>{productName} &middot; {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</>
                  ) : (
                    <>{teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</>
                  )}
                </p>
              </div>
            </div>
          </div>
          {resolvedProductId && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/product/${resolvedProductId}/team/pto`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                title="Manage PTO Calendar"
              >
                <Calendar className="w-4 h-4" />
                PTO Calendar
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-4 h-4" />
                Add Team Member
              </button>
            </div>
          )}
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
                onClick={() => {
                  const basePath = resolvedProductId
                    ? `/product/${resolvedProductId}/team/${member.id}`
                    : `/team/${member.id}`;
                  navigate(basePath);
                }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{member.role}</p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {member.experienceLevel && (
                        <span className={cn(
                          "inline-block px-2.5 py-1 text-xs font-semibold rounded-lg",
                          getExperienceLevelColor(member.experienceLevel)
                        )}>
                          {member.experienceLevel}
                        </span>
                      )}
                      {member.velocityMultiplier !== undefined && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          • {member.velocityMultiplier.toFixed(1)}x velocity
                        </span>
                      )}
                      {member.pto.length > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          • {member.pto.length} PTO {member.pto.length === 1 ? 'entry' : 'entries'}
                        </span>
                      )}
                    </div>
                    {member.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {member.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {teamMembers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-lg mb-4">
                <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">No team members yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                {resolvedProductId 
                  ? 'Add your first team member to get started.'
                  : 'Select a product to manage its team roster.'}
              </p>
              {resolvedProductId && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
                >
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && resolvedProductId && (
        <AddTeamMemberModal
          productId={resolvedProductId}
          onClose={() => setShowAddForm(false)}
          onAdd={(member) => {
            const updatedAll = [...allTeamMembers, member];
            setAllTeamMembers(updatedAll);
            saveTeamMembers(updatedAll);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

interface AddTeamMemberModalProps {
  productId: string;
  onClose: () => void;
  onAdd: (member: TeamMember) => void;
}

function AddTeamMemberModal({ productId, onClose, onAdd }: AddTeamMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeamRole>('Frontend');
  const [experienceLevel, setExperienceLevel] = useState<'Junior' | 'Mid' | 'Senior' | 'Lead'>('Mid');
  const [velocityMultiplier, setVelocityMultiplier] = useState(1.0);
  const [notes, setNotes] = useState('');

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
    if (!name.trim()) return;

    const newMember: TeamMember = {
      id: `tm${Date.now()}`,
      name: name.trim(),
      role,
      experienceLevel,
      velocityMultiplier,
      notes: notes.trim() || undefined,
      pto: [],
      productId
    };

    onAdd(newMember);
  };

  return (
    <>
      <style>{`
        .modal-appear {
          animation: modalAppear 0.2s ease-out;
        }
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 modal-appear">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Team Member</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sarah Chen"
                autoFocus
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
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
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => handleExperienceLevelChange(e.target.value as 'Junior' | 'Mid' | 'Senior' | 'Lead')}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Velocity Multiplier
              </label>
              <input
                type="number"
                value={velocityMultiplier}
                onChange={(e) => setVelocityMultiplier(parseFloat(e.target.value) || 1.0)}
                min="0.1"
                max="3.0"
                step="0.1"
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {velocityMultiplier < 0.8 && 'Slower pace - suitable for juniors or complex work'}
                {velocityMultiplier >= 0.8 && velocityMultiplier < 1.2 && 'Standard pace - typical developer velocity'}
                {velocityMultiplier >= 1.2 && velocityMultiplier < 1.5 && 'Faster pace - senior developer velocity'}
                {velocityMultiplier >= 1.5 && 'Expert pace - lead developer velocity'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Specializes in React, Available part-time, etc."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Add Team Member
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
