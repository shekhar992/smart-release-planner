import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface SprintCreationPopoverProps {
  onClose: () => void;
  onCreateSprint: (name: string, startDate: Date, endDate: Date) => void;
  defaultStartDate?: Date;
}

export function SprintCreationPopover({ onClose, onCreateSprint, defaultStartDate }: SprintCreationPopoverProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(
    defaultStartDate ? defaultStartDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onCreateSprint(
      name.trim(),
      new Date(startDate),
      new Date(endDate)
    );
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-xl shadow-2xl z-50 border border-gray-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Create Sprint</h3>
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
                Sprint Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sprint 1"
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50 transition-all leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 leading-relaxed">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
              disabled={!name.trim()}
              className="px-4 py-2.5 text-sm font-normal text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Create Sprint
            </button>
          </div>
        </form>
      </div>
    </>
  );
}