/**
 * Release Health Header: Dashboard above Gantt timeline
 * 
 * Displays 4 key metrics + proactive insights for release health monitoring.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Clock, Zap, CheckCircle2, XCircle, Info, X, ChevronDown } from 'lucide-react';
import { CapacityUtilization, TimelineStatus, TeamVelocity, ConflictMetrics } from '../lib/capacityMetrics';
import { Insight } from '../lib/insightEngine';

interface ReleaseHealthHeaderProps {
  capacityUtil: CapacityUtilization;
  timelineStatus: TimelineStatus;
  teamVelocity: TeamVelocity;
  conflictMetrics: ConflictMetrics;
  insights: Insight[];
  onInsightAction?: (actionType: string) => void;
}

export function ReleaseHealthHeader({
  capacityUtil,
  timelineStatus,
  teamVelocity,
  conflictMetrics,
  insights,
  onInsightAction
}: ReleaseHealthHeaderProps) {

  // Collapsible state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('healthHeaderCollapsed');
    return stored === 'true';
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('healthHeaderCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Helper: Get color for capacity status
  const getCapacityColor = () => {
    if (capacityUtil.status === 'under') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500'
      };
    } else if (capacityUtil.status === 'optimal') {
      return {
        bg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-500'
      };
    } else {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500'
      };
    }
  };

  // Helper: Get color for timeline status
  const getTimelineColor = () => {
    switch (timelineStatus.status) {
      case 'upcoming':
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          icon: 'text-slate-500'
        };
      case 'active':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'text-blue-700 dark:text-blue-400',
          icon: 'text-blue-500'
        };
      case 'at-risk':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-700 dark:text-amber-400',
          icon: 'text-amber-500'
        };
      case 'overdue':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-700 dark:text-red-400',
          icon: 'text-red-500'
        };
      case 'completed':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          text: 'text-green-700 dark:text-green-400',
          icon: 'text-green-500'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          icon: 'text-slate-500'
        };
    }
  };

  // Helper: Get color for conflict severity
  const getConflictColor = () => {
    switch (conflictMetrics.overallSeverity) {
      case 'none':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-500'
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-500'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800',
          icon: 'text-amber-500'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/20',
          text: 'text-orange-700 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-800',
          icon: 'text-orange-500'
        };
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-500'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          icon: 'text-slate-500'
        };
    }
  };

  // Helper: Get color for team velocity
  const getVelocityColor = () => {
    if (teamVelocity.experience === 'junior') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'text-amber-500'
      };
    } else if (teamVelocity.experience === 'senior') {
      return {
        bg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-700 dark:text-green-400',
        icon: 'text-green-500'
      };
    } else {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'text-blue-500'
      };
    }
  };

  const capacityColors = getCapacityColor();
  const timelineColors = getTimelineColor();
  const conflictColors = getConflictColor();
  const velocityColors = getVelocityColor();

  // Helper: Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Helper: Get insight colors
  const getInsightColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
    }
  };

  // Show collapsed state
  if (isCollapsed) {
    const hasAlerts = insights.length > 0 || conflictMetrics.totalConflicts > 0 || capacityUtil.percentage > 100;
    return (
      <div className="sticky top-[57px] z-[70] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Release Health</span>
          {hasAlerts && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {insights.length} {insights.length === 1 ? 'alert' : 'alerts'}
            </span>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {capacityUtil.percentage}%
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {conflictMetrics.totalConflicts} conflicts
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Expand health dashboard"
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop - Click outside to close (when expanded) */}
      <div
        className="fixed inset-0 z-[75] bg-black/5 backdrop-blur-[1px]"
        onClick={() => setIsCollapsed(true)}
        style={{
          animation: 'fadeIn 0.2s ease-out'
        }}
      />
      
      <div className="sticky top-[57px] z-[78] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-5">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight">Release Health</h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 z-10 shadow-sm hover:shadow"
            title="Collapse health dashboard (or click outside)"
          >
            <X className="w-4 h-4 text-slate-500" strokeWidth={2} />
          </button>
        </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`flex items-center justify-between px-5 py-3 rounded-xl border-2 ${getInsightColors(insight.type)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <div className="font-semibold text-sm leading-snug">{insight.title}</div>
                  <div className="text-xs opacity-75 mt-1 leading-relaxed">{insight.message}</div>
                </div>
              </div>
              {insight.actionLabel && insight.actionType && (
                <button
                  onClick={() => onInsightAction?.(insight.actionType!)}
                  className="ml-4 px-4 py-2 text-xs font-semibold rounded-lg bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow"
                >
                  {insight.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-5">
        {/* Metric 1: Capacity Utilization */}
        <div className={`${capacityColors.bg} ${capacityColors.border} border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Capacity
              </div>
              <div className={`text-3xl font-bold ${capacityColors.text} mb-1 tabular-nums leading-tight`}>
                {capacityUtil.percentage}%
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {capacityUtil.allocatedDays} / {capacityUtil.availableCapacityDays} days
              </div>
            </div>
            <div className={capacityColors.icon}>
              <TrendingUp className="w-6 h-6" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-current transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(capacityUtil.percentage, 100)}%`,
                opacity: 0.7
              }}
            />
          </div>
        </div>

        {/* Metric 2: Conflicts */}
        <div className={`${conflictColors.bg} border-2 ${conflictColors.border} rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Conflicts
              </div>
              <div className={`text-3xl font-bold ${conflictColors.text} mb-1 tabular-nums leading-tight`}>
                {conflictMetrics.totalConflicts}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {conflictMetrics.criticalConflicts > 0 
                  ? `${conflictMetrics.criticalConflicts} critical`
                  : conflictMetrics.totalConflicts === 0 
                    ? 'All clear'
                    : `${conflictMetrics.warningConflicts} warnings`}
              </div>
            </div>
            <div className={conflictColors.icon}>
              <AlertTriangle className="w-6 h-6" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Metric 3: Timeline Status */}
        <div className={`${timelineColors.bg} border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Timeline
              </div>
              <div className={`text-3xl font-bold ${timelineColors.text} mb-1 capitalize tabular-nums leading-tight`}>
                {timelineStatus.status}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {timelineStatus.message}
              </div>
            </div>
            <div className={timelineColors.icon}>
              <Clock className="w-6 h-6" strokeWidth={2} />
            </div>
          </div>
          {timelineStatus.progressPercentage > 0 && (
            <div className="mt-4 h-2 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-current transition-all duration-500 ease-out"
                style={{ 
                  width: `${timelineStatus.progressPercentage}%`,
                  opacity: 0.7
                }}
              />
            </div>
          )}
        </div>

        {/* Metric 4: Team Velocity */}
        <div className={`${velocityColors.bg} border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Team Velocity
              </div>
              <div className={`text-3xl font-bold ${velocityColors.text} mb-1 tabular-nums leading-tight`}>
                {teamVelocity.averageVelocity}x
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {teamVelocity.developerCount} {teamVelocity.developerCount === 1 ? 'developer' : 'developers'} ({teamVelocity.experience})
              </div>
            </div>
            <div className={velocityColors.icon}>
              <Zap className="w-6 h-6" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Animation styles */}
    <style>{`
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `}</style>
    </>
  );
}
