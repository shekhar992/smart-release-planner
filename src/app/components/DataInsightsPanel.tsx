import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Layers, Users, Target } from 'lucide-react';
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
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span>View Detailed Analysis</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-6 bg-card">
          {/* Backlog Insights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Backlog Insights</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">Total Tickets</div>
                <div className="text-lg font-semibold">{totalTickets}</div>
              </div>
              <div className="p-3 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">Total Effort</div>
                <div className="text-lg font-semibold">{totalEffort}d</div>
              </div>
              <div className="p-3 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">Avg Effort</div>
                <div className="text-lg font-semibold">{avgEffort}d</div>
              </div>
              <div className="p-3 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">Largest Ticket</div>
                <div className="text-lg font-semibold">{largestTicket}d</div>
              </div>
              <div className="p-3 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">Smallest Ticket</div>
                <div className="text-lg font-semibold">{smallestTicket}d</div>
              </div>
              <div className="p-3 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground mb-1">Overflow</div>
                <div className="text-lg font-semibold">{overflowTickets.length}</div>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Priority Distribution</h4>
            </div>
            <div className="space-y-2">
              {priorities.map(([priority, count]) => {
                const getPriorityLabel = (p: number) => {
                  if (p === 1) return 'High';
                  if (p <= 3) return 'Medium';
                  return 'Low';
                };
                const percentage = Math.round((count / totalTickets) * 100);
                
                return (
                  <div key={priority} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-muted-foreground">
                      P{priority} ({getPriorityLabel(priority)})
                    </div>
                    <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/70"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs font-medium text-right">
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
              <Users className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Assignment Distribution</h4>
            </div>
            <div className="space-y-2">
              {assignments.slice(0, 5).map(([name, count]) => {
                const percentage = Math.round((count / totalTickets) * 100);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-32 text-xs text-muted-foreground truncate">
                      {name}
                    </div>
                    <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600/70"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs font-medium text-right">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
              {unassignedCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground">
                    Unassigned
                  </div>
                  <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-600/70"
                      style={{ width: `${Math.round((unassignedCount / totalTickets) * 100)}%` }}
                    />
                  </div>
                  <div className="w-16 text-xs font-medium text-right">
                    {unassignedCount} ({Math.round((unassignedCount / totalTickets) * 100)}%)
                  </div>
                </div>
              )}
              {assignments.length > 5 && (
                <div className="text-xs text-muted-foreground italic">
                  +{assignments.length - 5} more developers
                </div>
              )}
            </div>
          </div>

          {/* Sprint Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Sprint Distribution</h4>
            </div>
            <div className="space-y-2">
              {sprintStats.map((sprint) => (
                <div key={sprint.name} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-muted-foreground truncate">
                    {sprint.name}
                  </div>
                  <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        sprint.utilization >= 90 ? 'bg-green-600/70' :
                        sprint.utilization >= 70 ? 'bg-amber-600/70' :
                        'bg-blue-600/70'
                      }`}
                      style={{ width: `${sprint.utilization}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs font-medium text-right">
                    {sprint.ticketCount} tickets
                  </div>
                  <div className="w-12 text-xs text-muted-foreground text-right">
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
