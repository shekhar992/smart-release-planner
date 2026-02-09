import { useState } from 'react';
import { X, Info } from 'lucide-react';

interface BulkTicketCreationModalProps {
  featureId: string;
  featureName: string;
  onClose: () => void;
  onAddTickets: (featureId: string, ticketNames: string[], storyPoints: number, assignedTo: string) => void;
}

export function BulkTicketCreationModal({ 
  featureId,
  featureName, 
  onClose, 
  onAddTickets 
}: BulkTicketCreationModalProps) {
  const [ticketText, setTicketText] = useState('');
  const [storyPoints, setStoryPoints] = useState(3);
  const [assignedTo, setAssignedTo] = useState('Unassigned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lines = ticketText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) return;
    
    onAddTickets(featureId, lines, storyPoints, assignedTo);
    onClose();
  };

  const ticketCount = ticketText
    .split('\n')
    .filter(line => line.trim().length > 0).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] bg-white rounded-xl shadow-2xl z-50 border border-gray-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Bulk Create Tickets</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">for {featureName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                Ticket Names (one per line)
              </label>
              <textarea
                value={ticketText}
                onChange={(e) => setTicketText(e.target.value)}
                placeholder="User authentication&#10;Password reset flow&#10;Email verification&#10;Social login integration"
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm resize-none font-mono bg-gray-50/50 transition-all leading-relaxed"
                rows={8}
              />
              {ticketCount > 0 && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} will be created
                </p>
              )}
            </div>

            <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed">
                All tickets will be created with the same story points and developer assignment. 
                They'll appear sequentially on the timeline.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                  Default Story Points
                </label>
                <input
                  type="number"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                  Assigned Developer
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Unassigned"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50/50 border-t border-gray-200 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ticketCount === 0}
              className="px-4 py-2.5 text-sm font-normal text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Create {ticketCount > 0 ? ticketCount : ''} Ticket{ticketCount !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}