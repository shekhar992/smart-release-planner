import { useState, useEffect, useMemo } from 'react';
import { Plus, User, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { mockTeamMembers, TeamMember, mockProducts } from '../data/mockData';
import { loadTeamMembers, loadProducts, saveTeamMembers } from '../lib/localStorage';

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-blue-100 text-blue-700';
      case 'Designer': return 'bg-purple-100 text-purple-700';
      case 'QA': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getExperienceLevelColor = (level?: string) => {
    switch (level) {
      case 'Senior': return 'bg-purple-100 text-purple-700';
      case 'Mid': return 'bg-blue-100 text-blue-700';
      case 'Junior': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(releaseId ? `/release/${releaseId}` : '/')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-gray-900">Team Roster</h1>
              <p className="text-sm text-gray-500">
                {productName ? (
                  <>{productName} &middot; {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</>
                ) : (
                  <>{teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</>
                )}
              </p>
            </div>
          </div>
          {resolvedProductId && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/product/${resolvedProductId}/team/pto`)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Manage PTO Calendar"
              >
                <Calendar className="w-4 h-4" />
                PTO Calendar
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
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
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{member.role}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {member.experienceLevel && (
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getExperienceLevelColor(member.experienceLevel)}`}>
                          {member.experienceLevel}
                        </span>
                      )}
                      {member.velocityMultiplier !== undefined && (
                        <span className="text-xs text-gray-600">
                          • {member.velocityMultiplier.toFixed(1)}x velocity
                        </span>
                      )}
                      {member.pto.length > 0 && (
                        <span className="text-xs text-gray-500">
                          • {member.pto.length} PTO {member.pto.length === 1 ? 'entry' : 'entries'}
                        </span>
                      )}
                    </div>
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
              <p className="text-sm text-gray-500 mb-4">
                {resolvedProductId 
                  ? 'Add your first team member to get started.'
                  : 'Select a product to manage its team roster.'}
              </p>
              {resolvedProductId && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
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
  const [role, setRole] = useState<'Developer' | 'Designer' | 'QA'>('Developer');
  const [experienceLevel, setExperienceLevel] = useState<'Junior' | 'Mid' | 'Senior'>('Mid');

  // Automatically calculate velocity multiplier based on experience level
  const velocityMultiplier = experienceLevel === 'Junior' ? 0.7 : experienceLevel === 'Senior' ? 1.3 : 1.0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember: TeamMember = {
      id: `tm${Date.now()}`,
      name: name.trim(),
      role,
      experienceLevel,
      velocityMultiplier,
      pto: [],
      productId
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
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as 'Junior' | 'Mid' | 'Senior')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                Velocity: <span className="font-medium text-gray-700">{velocityMultiplier.toFixed(1)}x</span>
                {experienceLevel === 'Junior' && ' (slower pace)'}
                {experienceLevel === 'Mid' && ' (standard pace)'}
                {experienceLevel === 'Senior' && ' (faster pace)'}
              </p>
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
