import { useState } from 'react';
import { X, Calendar, User } from 'lucide-react';
import { Ticket, Release } from '../data/mockData';

interface TicketDetailsPanelProps {
  ticket: Ticket;
  featureId: string;
  release: Release;
  onClose: () => void;
  onUpdate: (featureId: string, ticketId: string, updates: Partial<Ticket>) => void;
}

export function TicketDetailsPanel({ 
  ticket, 
  featureId, 
  release, 
  onClose, 
  onUpdate 
}: TicketDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (field: keyof Ticket, value: any) => {
    onUpdate(featureId, ticket.id, { [field]: value });
  };

  // Derive sprint association from ticket dates
  const getAssociatedSprint = () => {
    return release.sprints.find(sprint => {
      const sprintStart = sprint.startDate.getTime();
      const sprintEnd = sprint.endDate.getTime();
      const ticketStart = ticket.startDate.getTime();
      
      return ticketStart >= sprintStart && ticketStart <= sprintEnd;
    });
  };

  const associatedSprint = getAssociatedSprint();
  const featureName = release.features.find(f => f.id === featureId)?.name || '';

  const getDuration = () => {
    const diffTime = Math.abs(ticket.endDate.getTime() - ticket.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
            <div className="text-xs text-gray-500 mb-2 leading-relaxed">{featureName}</div>
            <input
              type="text"
              value={ticket.title}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="w-full text-base font-normal text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 leading-relaxed"
            />
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 hover:bg-gray-200/60 rounded-lg transition-all flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

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

          {/* Story Points */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Story Points
            </label>
            <input
              type="number"
              value={ticket.storyPoints}
              onChange={(e) => handleUpdate('storyPoints', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all duration-200 leading-relaxed"
            />
          </div>

          {/* Assigned Developer */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Assigned Developer
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={ticket.assignedTo}
                onChange={(e) => handleUpdate('assignedTo', e.target.value)}
                placeholder="Unassigned"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all duration-200 leading-relaxed"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
              Status
            </label>
            <select
              value={ticket.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all duration-200 leading-relaxed"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-normal rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}