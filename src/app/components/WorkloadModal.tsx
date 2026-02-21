import { useState } from 'react';
import { X, Users, TrendingUp } from 'lucide-react';
import { cn } from './ui/utils';
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
    <>
      <style>{`
        .modal-appear {
          animation: modalAppear 0.2s ease-out;
        }
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div 
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700 modal-appear"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Workload Summary</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{release.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Sprint:</span>
              <select
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
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

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Total: <span className="font-semibold">{totalEffortDays.toFixed(1)} days</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {developers.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-400 dark:text-slate-500">
                No tickets assigned for selected filters
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {developers.map((developer) => (
                  <div key={developer.name} className="px-6 py-5">
                    {/* Developer Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {developer.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {developer.tickets.length} {developer.tickets.length === 1 ? 'ticket' : 'tickets'}
                        </span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {developer.totalEffortDays.toFixed(1)} days
                        </span>
                      </div>
                    </div>

                    {/* Tickets Table */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-700/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Ticket</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Feature</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Days</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {developer.tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                              <td className="px-4 py-3 text-slate-900 dark:text-white">{ticket.title}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{ticket.featureName}</td>
                              <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">{ticket.effortDays.toFixed(1)}</td>
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
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}