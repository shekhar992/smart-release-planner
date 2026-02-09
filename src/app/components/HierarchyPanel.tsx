import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Layers } from 'lucide-react';
import { Release, Feature, Ticket } from '../data/mockData';
import { BulkTicketCreationModal } from './BulkTicketCreationModal';

interface HierarchyPanelProps {
  release: Release;
  onUpdateReleaseName: (name: string) => void;
  onUpdateFeatureName: (featureId: string, name: string) => void;
  onUpdateTicket: (featureId: string, ticketId: string, updates: Partial<Ticket>) => void;
  onAddFeature: () => void;
  onAddTicket: (featureId: string) => void;
  onBulkAddTickets: (featureId: string, ticketNames: string[], storyPoints: number, assignedTo: string) => void;
  selectedTicket?: { featureId: string; ticketId: string } | null;
  onSelectTicket?: (featureId: string, ticketId: string) => void;
  hoveredTicket?: { featureId: string; ticketId: string } | null;
  onHoverTicket?: (featureId: string | null, ticketId: string | null) => void;
}

export function HierarchyPanel({
  release,
  onUpdateReleaseName,
  onUpdateFeatureName,
  onUpdateTicket,
  onAddFeature,
  onAddTicket,
  onBulkAddTickets,
  selectedTicket,
  onSelectTicket,
  hoveredTicket,
  onHoverTicket
}: HierarchyPanelProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set(release.features.map(f => f.id))
  );
  const [bulkCreateFeatureId, setBulkCreateFeatureId] = useState<string | null>(null);

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Release Name */}
      <div className="pb-3 border-b border-gray-300">
        <InlineEdit
          value={release.name}
          onChange={onUpdateReleaseName}
          className="text-sm font-medium text-gray-900"
        />
        <div className="text-[10px] text-gray-500 mt-1.5">
          {release.startDate.toLocaleDateString()} - {release.endDate.toLocaleDateString()}
        </div>
      </div>

      {/* Inline Guidance */}
      {release.features.length === 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-[10px] text-blue-700 leading-relaxed">
            <span className="font-medium">Get started:</span> Add a feature to begin planning
          </p>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-4">
        {release.features.map((feature, index) => (
          <div 
            key={feature.id} 
            className={`${index > 0 ? 'pt-4 border-t border-gray-200/50' : ''}`}
          >
            {/* Feature Header */}
            <div className="flex items-center justify-between mb-1.5 group/feature hover:bg-gray-50 -mx-1.5 px-1.5 py-1 rounded transition-colors">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <button
                  onClick={() => toggleFeature(feature.id)}
                  className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0"
                >
                  {expandedFeatures.has(feature.id) ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
                <InlineEdit
                  value={feature.name}
                  onChange={(name) => onUpdateFeatureName(feature.id, name)}
                  className="text-xs font-medium text-gray-900 truncate"
                />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/feature:opacity-100 flex-shrink-0">
                <button
                  onClick={() => onAddTicket(feature.id)}
                  className="p-1 hover:bg-white border border-transparent hover:border-gray-200 rounded transition-all"
                  title="Add ticket"
                >
                  <Plus className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={() => setBulkCreateFeatureId(feature.id)}
                  className="p-1 hover:bg-white border border-transparent hover:border-gray-200 rounded transition-all"
                  title="Bulk add tickets"
                >
                  <Layers className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Tickets List - flat rows */}
            {expandedFeatures.has(feature.id) && (
              <div className="ml-2 space-y-0.5">
                {feature.tickets.map((ticket) => {
                  const isSelected = selectedTicket?.featureId === feature.id && selectedTicket?.ticketId === ticket.id;
                  const isHovered = hoveredTicket?.featureId === feature.id && hoveredTicket?.ticketId === ticket.id;
                  
                  return (
                    <div
                      key={ticket.id}
                      className={`px-2 py-1 hover:bg-blue-50/40 rounded transition-colors cursor-pointer
                        ${isSelected ? 'bg-blue-100/60 ring-1 ring-blue-200' : ''}
                        ${!isSelected && isHovered ? 'bg-blue-50/40' : ''}
                      `}
                      onMouseEnter={() => onHoverTicket?.(feature.id, ticket.id)}
                      onMouseLeave={() => onHoverTicket?.(null, null)}
                      onClick={() => onSelectTicket?.(feature.id, ticket.id)}
                    >
                      {/* Line 1: Ticket Title */}
                      <InlineEdit 
                        value={ticket.title}
                        onChange={(title) => onUpdateTicket(feature.id, ticket.id, { title })}
                        className="text-xs text-gray-900 leading-snug font-normal"
                      />
                      
                      {/* Line 2: All metadata in single row with bullet separators */}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                        {/* Date Range */}
                        <span className="shrink-0">
                          {formatDate(ticket.startDate)} - {formatDate(ticket.endDate)}
                        </span>
                        
                        <span className="text-gray-300">•</span>
                        
                        {/* Story Points */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className="text-gray-400">SP</span>
                          <InlineNumberEdit 
                            value={ticket.storyPoints}
                            onChange={(storyPoints) => onUpdateTicket(feature.id, ticket.id, { storyPoints })}
                            className="text-[10px] text-gray-600 font-medium"
                          />
                        </div>
                        
                        <span className="text-gray-300">•</span>
                        
                        {/* Assigned Developer */}
                        <div className="flex items-center gap-0.5 min-w-0">
                          <InlineEdit 
                            value={ticket.assignedTo}
                            onChange={(assignedTo) => onUpdateTicket(feature.id, ticket.id, { assignedTo })}
                            className="text-[10px] text-gray-600 truncate"
                          />
                        </div>
                        
                        <span className="text-gray-300">•</span>
                        
                        {/* Status Badge */}
                        <StatusBadge status={ticket.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Feature Button */}
      <button
        onClick={onAddFeature}
        className="w-full px-2 py-2 mt-4 flex items-center justify-center gap-1.5 hover:bg-gray-50/80 border border-gray-200/60 border-dashed hover:border-gray-300/60 text-gray-500 hover:text-gray-700 rounded-lg transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="text-xs font-normal">Add Feature</span>
      </button>

      {/* Bulk Ticket Creation Modal */}
      {bulkCreateFeatureId && (() => {
        const feature = release.features.find(f => f.id === bulkCreateFeatureId);
        return feature ? (
          <BulkTicketCreationModal
            featureId={bulkCreateFeatureId}
            featureName={feature.name}
            onAddTickets={onBulkAddTickets}
            onClose={() => setBulkCreateFeatureId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const styles = {
    planned: 'bg-gray-100/60 text-gray-500',
    'in-progress': 'bg-blue-50/60 text-blue-500',
    completed: 'bg-green-50/60 text-green-500'
  };

  const labels = {
    planned: 'Planned',
    'in-progress': 'In Progress',
    completed: 'Completed'
  };

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function InlineEdit({ 
  value, 
  onChange, 
  className 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim()) {
      onChange(editValue.trim());
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white border border-blue-400 rounded px-1 py-0.5 outline-none w-full`}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-text hover:bg-gray-100 rounded px-1 py-0.5 -mx-1`}
    >
      {value}
    </div>
  );
}

function InlineNumberEdit({ 
  value, 
  onChange, 
  className 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseInt(editValue, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    } else {
      setEditValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="1"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white border border-blue-400 rounded px-1 py-0.5 outline-none w-12`}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-text hover:bg-gray-100 rounded px-1 py-0.5`}
    >
      {value}
    </div>
  );
}