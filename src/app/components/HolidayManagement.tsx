import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { mockHolidays, Holiday } from '../data/mockData';
import { loadHolidays, saveHolidays } from '../lib/localStorage';

export function HolidayManagement() {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  // Load holidays from localStorage on mount
  useEffect(() => {
    const storedHolidays = loadHolidays();
    setHolidays(storedHolidays || mockHolidays);
  }, []);
  const [showAddForm, setShowAddForm] = useState(false);

  const deleteHoliday = (holidayId: string) => {
    setHolidays(prev => {
      const updated = prev.filter(h => h.id !== holidayId);
      saveHolidays(updated);
      return updated;
    });
  };

  const addHoliday = (holiday: Holiday) => {
    setHolidays(prev => {
      const updated = [...prev, holiday].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      saveHolidays(updated);
      return updated;
    });
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    if (isSameDay) {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
              <h1 className="text-lg font-medium text-gray-900">Holidays & Blackout Dates</h1>
              <p className="text-sm text-gray-500">{holidays.length} holidays configured</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* Holidays List */}
          {holidays.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {holidays.map(holiday => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{holiday.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateRange(holiday.startDate, holiday.endDate)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHoliday(holiday.id)}
                      className="p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete holiday"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No holidays configured</h3>
              <p className="text-sm text-gray-500 mb-4">Add holidays and company blackout dates.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Holiday
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddForm && (
        <AddHolidayModal
          onClose={() => setShowAddForm(false)}
          onAdd={(holiday) => {
            addHoliday(holiday);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

interface AddHolidayModalProps {
  onClose: () => void;
  onAdd: (holiday: Holiday) => void;
}

function AddHolidayModal({ onClose, onAdd }: AddHolidayModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const datesInvalid = startDate && endDate && endDate < startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || datesInvalid) return;

    const newHoliday: Holiday = {
      id: `h${Date.now()}`,
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    onAdd(newHoliday);
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
            <h3 className="text-sm font-medium text-gray-900">Add Holiday</h3>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Holiday Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Memorial Day, Company Shutdown"
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

            {datesInvalid && (
              <p className="text-xs text-red-500">End date must be on or after start date</p>
            )}

            <p className="text-xs text-gray-500">
              For single-day holidays, set the same start and end date.
            </p>
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
              disabled={!name.trim() || !!datesInvalid}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Add Holiday
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
