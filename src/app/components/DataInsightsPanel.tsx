import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Layers, Users, Target, TrendingUp } from 'lucide-react';
import { cn } from './ui/utils';
import type { TicketInput } from '../../domain/types';

interface Sprint {
  id: string;
  name: string;
  tickets: TicketInput[];
  capacityDays: number;
  allocatedDays: number;
}

interface DataInsightsPanelProps {
  tickets: TicketInput[];
  sprints: Sprint[];
  overflowTickets: TicketInput[];
}

export function DataInsightsPanel({ tickets, sprints, overflowTickets }: DataInsightsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Backlog Insights
  const totalTickets = tickets.length;
  const totalEffort = tickets.reduce((sum, t) => sum + t.effortDays, 0);
  const avgEffort = totalTickets > 0 ? (totalEffort / totalTickets).toFixed(1) : '0';
  const largestTicket = tickets.length > 0 ? Math.max(...tickets.map(t => t.effortDays)) : 0;
  const smallestTicket = tickets.length > 0 ? Math.min(...tickets.map(t => t.effortDays)) : 0;

  // Priority Distribution
  const priorityMap = new Map<number, number>();
  tickets.forEach(t => {
    priorityMap.set(t.priority, (priorityMap.get(t.priority) || 0) + 1);
  });
  const priorities = Array.from(priorityMap.entries()).sort((a, b) => a[0] - b[0]);

  // Assignment Distribution
  const assignmentMap = new Map<string, number>();
  let unassignedCount = 0;
  
  tickets.forEach(t => {
    if (t.assignedToRaw && t.assignedToRaw.trim()) {
      assignmentMap.set(t.assignedToRaw, (assignmentMap.get(t.assignedToRaw) || 0) + 1);
    } else {
      unassignedCount++;
    }
  });
  const assignments = Array.from(assignmentMap.entries()).sort((a, b) => b[1] - a[1]);

  // Sprint Distribution
  const sprintStats = sprints.map(sprint => ({
    name: sprint.name,
    ticketCount: sprint.tickets.length,
    utilization: sprint.capacityDays > 0 
      ? Math.round((sprint.allocatedDays / sprint.capacityDays) * 100)
      : 0
  }));

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-base font-semibold text-slate-900 dark:text-white">Backlog Insights</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{totalTickets} tickets across {sprints.length} sprints</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {isExpanded ? 'Hide' : 'Show'} Details
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-5 space-y-6 bg-slate-50/30 dark:bg-slate-800/30">
          {/* Backlog Insights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Summary Statistics</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Total Tickets</div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{totalTickets}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-2">Total Effort</div>
                <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{totalEffort}d</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-2">Avg Effort</div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{avgEffort}d</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-2">Largest</div>
                <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{largestTicket}d</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-2">Smallest</div>
                <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{smallestTicket}d</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="text-xs text-red-700 dark:text-red-300 font-medium mb-2">Overflow</div>
                <div className="text-xl font-bold text-red-900 dark:text-red-100">{overflowTickets.length}</div>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Priority Distribution</h4>
            </div>
            <div className="space-y-3">
              {priorities.map(([priority, count]) => {
                const getPriorityLabel = (p: number) => {
                  if (p === 1) return 'High';
                  if (p <= 3) return 'Medium';
                  return 'Low';
                };
                const percentage = Math.round((count / totalTickets) * 100);
                
                return (
                  <div key={priority} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-slate-700 dark:text-slate-300">
                      P{priority} ({getPriorityLabel(priority)})
                    </div>
                    <div className="flex-1 h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-xs font-semibold text-slate-900 dark:text-white text-right">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assignment Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Assignment Distribution</h4>
            </div>
            <div className="space-y-3">
              {assignments.slice(0, 5).map(([name, count]) => {
                const percentage = Math.round((count / totalTickets) * 100);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-36 text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {name}
                    </div>
                    <div className="flex-1 h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-200"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-xs font-semibold text-slate-900 dark:text-white text-right">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
              {unassignedCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-36 text-xs font-medium text-slate-700 dark:text-slate-300">
                    Unassigned
                  </div>
                  <div className="flex-1 h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
                      style={{ width: `${Math.round((unassignedCount / totalTickets) * 100)}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs font-semibold text-slate-900 dark:text-white text-right">
                    {unassignedCount} ({Math.round((unassignedCount / totalTickets) * 100)}%)
                  </div>
                </div>
              )}
              {assignments.length > 5 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic ml-36">
                  +{assignments.length - 5} more developers
                </div>
              )}
            </div>
          </div>

          {/* Sprint Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Sprint Distribution</h4>
            </div>
            <div className="space-y-3">
              {sprintStats.map((sprint) => (
                <div key={sprint.name} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {sprint.name}
                  </div>
                  <div className="flex-1 h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-200",
                        sprint.utilization >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                        sprint.utilization >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                        'bg-gradient-to-r from-blue-500 to-blue-600'
                      )}
                      style={{ width: `${sprint.utilization}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs font-medium text-slate-900 dark:text-white text-right">
                    {sprint.ticketCount} tickets
                  </div>
                  <div className="w-12 text-xs font-semibold text-slate-900 dark:text-white text-right">
                    {sprint.utilization}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
