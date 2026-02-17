import { useState } from 'react';
import { X } from 'lucide-react';
import { Release } from '../data/mockData';
import { resolveEffortDays } from '../lib/effortResolver';

interface WorkloadModalProps {
  release: Release;
  onClose: () => void;
}

interface DeveloperWorkload {
  name: string;
  tickets: Array<{ 
    id: string; 
    title: string; 
    effortDays: number; // Changed from storyPoints to effortDays
    featureName: string;
    sprintId?: string;
  }>;
  totalEffortDays: number; // Changed from totalStoryPoints
}

export function WorkloadModal({ release, onClose }: WorkloadModalProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>('all');

  // Calculate workload per developer
  const calculateWorkload = () => {
    const workloadMap = new Map<string, DeveloperWorkload>();

    release.features.forEach(feature => {
      feature.tickets.forEach(ticket => {
        // Determine which sprint this ticket belongs to
        const sprintId = (release.sprints || []).find(sprint => 
          ticket.startDate >= sprint.startDate && ticket.startDate <= sprint.endDate
        )?.id;

        // Filter by sprint if selected
        if (selectedSprintId !== 'all' && sprintId !== selectedSprintId) {
          return;
        }

        const devName = ticket.assignedTo;
        
        if (!workloadMap.has(devName)) {
          workloadMap.set(devName, {
            name: devName,
            tickets: [],
            totalEffortDays: 0
          });
        }

        const workload = workloadMap.get(devName)!;
        const ticketEffort = resolveEffortDays(ticket);
        
        workload.tickets.push({
          id: ticket.id,
          title: ticket.title,
          effortDays: ticketEffort,
          featureName: feature.name,
          sprintId
        });
        workload.totalEffortDays += ticketEffort;
      });
    });

    return Array.from(workloadMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  };

  const developers = calculateWorkload();
  const totalEffortDays = developers.reduce((sum, dev) => sum + dev.totalEffortDays, 0);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-base font-medium text-gray-900">Workload Summary</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{release.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sprint:</span>
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-400/50 bg-white transition-all"
            >
              <option value="all">All Sprints</option>
              {(release.sprints || []).map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex-1" />

          <div className="text-sm text-gray-600 leading-relaxed">
            Total: <span className="font-normal text-gray-900">{totalEffortDays.toFixed(1)} days</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {developers.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400">
              No tickets assigned for selected filters
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {developers.map((developer) => (
                <div key={developer.name} className="px-6 py-5">
                  {/* Developer Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-medium text-sm text-gray-900">
                      {developer.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 leading-relaxed">
                        {developer.tickets.length} {developer.tickets.length === 1 ? 'ticket' : 'tickets'}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm font-normal text-gray-900">
                        {developer.totalEffortDays.toFixed(1)} days
                      </span>
                    </div>
                  </div>

                  {/* Tickets Table */}
                  <div className="bg-gray-50/50 rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">Ticket</th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-600">Feature</th>
                          <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-600">Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {developer.tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-gray-100/50 transition-colors">
                            <td className="px-3 py-2.5 text-gray-900 leading-relaxed">{ticket.title}</td>
                            <td className="px-3 py-2.5 text-gray-600 leading-relaxed">{ticket.featureName}</td>
                            <td className="px-3 py-2.5 text-right text-gray-900 font-normal">{ticket.effortDays.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}