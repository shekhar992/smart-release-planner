import { useMemo } from 'react';
import { Release, Ticket, Phase } from '../data/mockData';
import { resolveEffortDaysWithMapping } from '../lib/effortResolver';

export interface ReleaseAnalyticsProps {
  release: Release;
  tickets: Ticket[];
  phases: Phase[];
}

// Helper: Check if a ticket falls within Dev Window phases
function isTicketInDevWindow(ticket: Ticket, phases: Phase[]): boolean {
  const devPhases = phases.filter(p => p.allowsWork);
  
  if (devPhases.length === 0) return true; // No phases = all tickets valid
  
  const ticketStart = new Date(ticket.startDate);
  ticketStart.setHours(0, 0, 0, 0);
  const ticketEnd = new Date(ticket.endDate);
  ticketEnd.setHours(0, 0, 0, 0);
  
  // Check if ticket falls entirely within any Dev Window
  return devPhases.some(phase => {
    const phaseStart = new Date(phase.startDate);
    phaseStart.setHours(0, 0, 0, 0);
    const phaseEnd = new Date(phase.endDate);
    phaseEnd.setHours(0, 0, 0, 0);
    
    return ticketStart >= phaseStart && ticketEnd <= phaseEnd;
  });
}

export function ReleaseAnalytics({ release, tickets, phases }: ReleaseAnalyticsProps) {
  const devWindowPhases = phases.filter(p => p.allowsWork);
  
  const analytics = useMemo(() => {
    const ticketsInDevWindow = tickets.filter(t => isTicketInDevWindow(t, phases));
    const spilloverTickets = tickets.filter(t => !isTicketInDevWindow(t, phases));
    
    // Calculate total effort using effort resolver (handles both effortDays and storyPoints)
    const totalEffort = tickets.reduce((sum, t) => sum + resolveEffortDaysWithMapping(t, release.storyPointMapping), 0);
    const devWindowEffort = ticketsInDevWindow.reduce((sum, t) => sum + resolveEffortDaysWithMapping(t, release.storyPointMapping), 0);
    const spilloverEffort = totalEffort - devWindowEffort;
    
    // Calculate Dev Window capacity (days * team size)
    const devWindowCapacity = devWindowPhases.reduce((sum, phase) => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      const days = Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      // Assuming team size of 5 (can be made dynamic if Release interface has teamSize)
      const teamSize = 5;
      return sum + (days * teamSize);
    }, 0);
    
    // Calculate health status
    const spilloverPercentage = tickets.length > 0 ? (spilloverTickets.length / tickets.length) * 100 : 0;
    const capacityUtilization = devWindowCapacity > 0 ? (devWindowEffort / devWindowCapacity) * 100 : 0;
    
    const health: 'healthy' | 'warning' | 'critical' = 
      spilloverTickets.length === 0 ? 'healthy' : 
      spilloverTickets.length < 5 ? 'warning' : 'critical';
    
    return {
      totalTickets: tickets.length,
      ticketsInDevWindow: ticketsInDevWindow.length,
      spilloverTickets: spilloverTickets.length,
      spilloverPercentage,
      
      totalEffort,
      devWindowEffort,
      spilloverEffort,
      
      devWindowCapacity,
      capacityUtilization,
      
      health,
      teamSize: 5, // Default team size
    };
  }, [tickets, phases, release.storyPointMapping, devWindowPhases]);

  if (tickets.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Release Health</h3>
        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <p className="text-sm text-muted-foreground">No tickets to analyze. Add tickets to see release health metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Release Health</h3>

      {/* Health indicator */}
      <div className={`p-4 rounded-lg border-2 ${
        analytics.health === 'healthy' 
          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
          : analytics.health === 'warning'
          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">
            {analytics.health === 'healthy' ? '✅' : analytics.health === 'warning' ? '⚠️' : '🚨'}
          </span>
          <span className={`font-semibold capitalize text-lg ${
            analytics.health === 'healthy' 
              ? 'text-green-700 dark:text-green-300' 
              : analytics.health === 'warning'
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {analytics.health}
          </span>
        </div>
        <p className="text-sm">
          {analytics.health === 'healthy' 
            ? 'All tickets are scheduled within Dev Window phases. Release is on track!'
            : analytics.health === 'warning'
            ? `${analytics.spilloverTickets} ticket${analytics.spilloverTickets !== 1 ? 's' : ''} scheduled outside Dev Window. Consider adjustments.`
            : `${analytics.spilloverTickets} tickets outside Dev Window. Immediate action required.`
          }
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalTickets}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Tickets</div>
        </div>

        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.ticketsInDevWindow}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">In Dev Window</div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {analytics.spilloverTickets}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Spillover</div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
          <div className={`text-2xl font-bold ${
            analytics.capacityUtilization > 100 
              ? 'text-red-600 dark:text-red-400' 
              : analytics.capacityUtilization > 80
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {analytics.capacityUtilization.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Capacity Used</div>
        </div>
      </div>

      {/* Effort breakdown */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-3">Effort Distribution</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Effort:</span>
            <span className="text-sm font-semibold">{analytics.totalEffort.toFixed(1)} person-days</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Dev Window Capacity:</span>
            <span className="text-sm font-semibold">{analytics.devWindowCapacity} person-days</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all ${
                analytics.capacityUtilization > 100 
                  ? 'bg-red-500' 
                  : analytics.capacityUtilization > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(analytics.capacityUtilization, 100)}%` }}
            />
          </div>
          
          {analytics.capacityUtilization > 100 && (
            <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
              <span className="text-xs">⚠️</span>
              <p className="text-xs text-red-700 dark:text-red-300">
                Over capacity by {(analytics.devWindowEffort - analytics.devWindowCapacity).toFixed(1)} person-days
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spillover details (conditional) */}
      {analytics.spilloverTickets > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 text-orange-900 dark:text-orange-100">
            Spillover Analysis
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Spillover Effort:</span>
              <span className="font-semibold text-orange-900 dark:text-orange-100">
                {analytics.spilloverEffort.toFixed(1)} person-days
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">% of Total Tickets:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {analytics.spilloverPercentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">% of Total Effort:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {((analytics.spilloverEffort / analytics.totalEffort) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-semibold mb-2 text-orange-900 dark:text-orange-100">
              💡 Recommendations:
            </p>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-gray-700 dark:text-gray-300">
              {devWindowPhases.length > 0 && (
                <>
                  <li>
                    Extend Dev Window by {Math.ceil(analytics.spilloverEffort / analytics.teamSize)} days 
                    to accommodate spillover tickets
                  </li>
                  <li>
                    Add {Math.ceil(analytics.spilloverEffort / ((devWindowPhases[0].endDate.getTime() - devWindowPhases[0].startDate.getTime()) / (1000 * 60 * 60 * 24)))} more team members 
                    to complete work within current Dev Window
                  </li>
                </>
              )}
              <li>
                Descope {analytics.spilloverTickets} low-priority ticket{analytics.spilloverTickets !== 1 ? 's' : ''} 
                to reduce workload
              </li>
              <li>
                Review ticket scheduling to move work into available Dev Window capacity
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Dev Window phases summary */}
      {devWindowPhases.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">
            Dev Window Phases ({devWindowPhases.length})
          </h4>
          <div className="space-y-2">
            {devWindowPhases.map((phase) => {
              const phaseStart = new Date(phase.startDate);
              const phaseEnd = new Date(phase.endDate);
              const days = Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const capacity = days * analytics.teamSize;
              
              return (
                <div key={phase.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{phase.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {days} days × {analytics.teamSize} team
                    </span>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      = {capacity} person-days
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
