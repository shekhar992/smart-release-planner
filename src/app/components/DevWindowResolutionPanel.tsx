import { useState, useEffect } from 'react';
import { X, CalendarX, CheckCircle2, Sparkles, ChevronRight, ChevronLeft, TrendingUp, AlertOctagon } from 'lucide-react';
import { cn } from './ui/utils';
import { getBestDevWindowFix } from '../lib/conflictDetection';
import { Ticket, TeamMember, Phase } from '../data/mockData';

interface DevWindowResolutionPanelProps {
  spilloverTickets: Ticket[];
  devPhases: Phase[];
  allTickets: Ticket[];
  teamMembers: TeamMember[];
  onClose: () => void;
  onReassignTicket?: (ticketId: string, newAssignee: string, newStartDate: Date, newEndDate: Date) => void;
  onRescheduleTicket?: (ticketId: string, newStartDate: Date, newEndDate: Date) => void;
  onExtendDevWindow?: (daysToExtend: number) => void;
  onMoveToBacklog?: (ticketId: string) => void;
}

export function DevWindowResolutionPanel({
  spilloverTickets,
  devPhases,
  allTickets,
  teamMembers,
  onClose,
  onReassignTicket,
  onRescheduleTicket,
  onExtendDevWindow,
  onMoveToBacklog
}: DevWindowResolutionPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedTickets, setResolvedTickets] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const currentTicket = spilloverTickets[currentIndex];
  const totalTickets = spilloverTickets.length;
  const resolvedCount = resolvedTickets.size;

  // Get the best fix for current spillover ticket
  // Defensive check: Ensure devPhases has work phases before calling getBestDevWindowFix
  const bestFix = currentTicket && devPhases.length > 0
    ? getBestDevWindowFix(currentTicket, devPhases, allTickets, teamMembers)
    : null;

  // Auto-advance when ticket is resolved
  useEffect(() => {
    if (currentTicket && resolvedTickets.has(currentTicket.id)) {
      const timer = setTimeout(() => {
        if (currentIndex < totalTickets - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          onClose();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [resolvedTickets, currentTicket?.id, currentIndex, totalTickets, onClose]);

  const handleApplyBestFix = async () => {
    if (!bestFix || !currentTicket || bestFix.type === 'capacity-exhausted') {
      console.warn('Cannot apply fix: invalid state', { bestFix, currentTicket });
      return;
    }

    setIsApplying(true);

    try {
      if (bestFix.type === 'reassign' && bestFix.developer && bestFix.newStartDate && bestFix.newEndDate) {
        if (!onReassignTicket) {
          console.error('onReassignTicket handler not provided');
          return;
        }
        onReassignTicket(currentTicket.id, bestFix.developer, bestFix.newStartDate, bestFix.newEndDate);
      } else if (bestFix.type === 'reschedule' && bestFix.newStartDate && bestFix.newEndDate) {
        if (!onRescheduleTicket) {
          console.error('onRescheduleTicket handler not provided');
          return;
        }
        onRescheduleTicket(currentTicket.id, bestFix.newStartDate, bestFix.newEndDate);
      } else {
        console.warn('Unknown fix type or missing required data', bestFix);
        return;
      }

      setResolvedTickets(prev => new Set(prev).add(currentTicket.id));
    } catch (error) {
      console.error('Error applying dev window fix:', error);
    } finally {
      setTimeout(() => setIsApplying(false), 500);
    }
  };

  const handleAlternativeAction = (type: 'extend-dev-window' | 'move-to-backlog' | 'reduce-scope', daysNeeded?: number) => {
    if (!currentTicket) return;

    if (type === 'extend-dev-window' && daysNeeded) {
      onExtendDevWindow?.(daysNeeded);
      setResolvedTickets(prev => new Set(prev).add(currentTicket.id));
    } else if (type === 'move-to-backlog') {
      onMoveToBacklog?.(currentTicket.id);
      setResolvedTickets(prev => new Set(prev).add(currentTicket.id));
    } else if (type === 'reduce-scope') {
      // This would open a ticket edit modal - for now just skip
      handleSkip();
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalTickets - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isResolved = currentTicket && resolvedTickets.has(currentTicket.id);

  if (spilloverTickets.length === 0) {
    return (
      <div className="w-[480px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">All Clear</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">All tickets are in Dev Window phases</p>
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[480px] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <CalendarX className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Dev Window Resolution</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {resolvedCount} of {totalTickets} resolved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            title="Close panel"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span>Ticket {currentIndex + 1} of {totalTickets}</span>
            <span>{Math.round((resolvedCount / totalTickets) * 100)}% complete</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out"
              style={{ width: `${(resolvedCount / totalTickets) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Current Ticket */}
        {currentTicket && (
          <div className={cn(
            "p-4 rounded-xl border transition-all duration-300",
            isResolved 
              ? "bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-700"
              : "bg-gradient-to-br from-amber-50/30 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200 dark:border-amber-800"
          )}>
            <div className="flex items-start gap-3">
              {isResolved ? (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-600/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {currentTicket.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{currentTicket.assignedTo || 'Unassigned'}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span>{currentTicket.effortDays || currentTicket.storyPoints || 1} days</span>
                </div>
                <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Scheduled outside Dev Window phases
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Status */}
        {isResolved ? (
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-300 dark:border-emerald-700">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Resolved Successfully</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
              Moving to next ticket...
            </p>
          </div>
        ) : (
          <>
            {/* Best Fix Recommendation */}
            {bestFix && bestFix.type !== 'capacity-exhausted' ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300 dark:border-amber-700">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                        Recommended Fix
                      </span>
                      <span className="px-2 py-0.5 bg-amber-600 dark:bg-amber-700 text-white text-[10px] font-bold rounded-full">
                        {bestFix.confidence}% match
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                      {bestFix.description}
                    </p>
                    
                    {/* Impact Preview */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fits in Dev Window</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>No new conflicts created</span>
                      </div>
                      {bestFix.impact.utilizationChange !== undefined && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Developer utilization: {Math.round(bestFix.impact.utilizationChange)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Apply Button */}
                <button
                  onClick={handleApplyBestFix}
                  disabled={isApplying}
                  className={cn(
                    "mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2",
                    isApplying
                      ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-600/30 hover:shadow-xl"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {isApplying ? 'Applying...' : 'Apply & Continue'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : bestFix?.type === 'capacity-exhausted' ? (
              <>
                {/* Capacity Exhausted Message */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-300 dark:border-red-700">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <AlertOctagon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wide">
                        Cannot Accommodate
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight mt-1">
                        {bestFix.description}
                      </p>
                      
                      {/* Capacity Breakdown */}
                      {bestFix.capacityBreakdown && (
                        <div className="mt-3 p-2.5 rounded-lg bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-2">Capacity Breakdown:</p>
                          <div className="space-y-1">
                            {bestFix.capacityBreakdown.map(dev => (
                              <div key={dev.developer} className="flex items-center justify-between text-xs text-red-800 dark:text-red-300">
                                <span>{dev.developer}</span>
                                <span className="font-semibold">{dev.utilization}% used</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alternative Actions */}
                {bestFix.alternatives && bestFix.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                      Choose an alternative:
                    </p>
                    {bestFix.alternatives.map((alt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAlternativeAction(alt.type, alt.daysNeeded)}
                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-all text-left group"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                          {alt.label}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {alt.impact}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
        
        {/* Error state - No valid fix computed */}
        {!isResolved && !bestFix && currentTicket && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-300 dark:border-red-700">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md flex-shrink-0">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wide">
                  Configuration Error
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight mt-1">
                  Unable to compute resolution strategy
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                  Check console for details. Ensure Dev Window phases are properly configured.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              currentIndex === 0
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white transition-all"
          >
            Skip
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
