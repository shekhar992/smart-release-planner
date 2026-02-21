import { useMemo } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { Phase } from '../data/mockData';

interface PhaseTimelinePreviewProps {
  phases: Phase[];
  releaseStart: string;
  releaseEnd: string;
}

export function PhaseTimelinePreview({ 
  phases, 
  releaseStart, 
  releaseEnd 
}: PhaseTimelinePreviewProps) {
  const releaseDuration = useMemo(() => {
    const start = new Date(releaseStart + 'T00:00:00');
    const end = new Date(releaseEnd + 'T00:00:00');
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [releaseStart, releaseEnd]);

  const getPhaseColor = (type: string): string => {
    const colors: Record<string, string> = {
      DevWindow: '#3b82f6',
      Testing: '#eab308',
      Deployment: '#a855f7',
      Approval: '#06b6d4',
      Launch: '#22c55e',
      Custom: '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  const totalPhaseDuration = phases.reduce((sum, phase) => {
    const duration = Math.ceil(
      (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + duration;
  }, 0);

  const isOverflow = totalPhaseDuration > releaseDuration;

  if (phases.length === 0) return null;

  return (
    <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Phase Timeline Preview</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {totalPhaseDuration} days total
              {isOverflow && (
                <span className="text-red-600 dark:text-red-400 ml-1 font-semibold">
                  (exceeds release by {totalPhaseDuration - releaseDuration} days)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative h-20 bg-white dark:bg-slate-950 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
        {/* Release boundary indicator */}
        <div className="absolute top-0 left-0 h-full w-full">
          <div className="absolute left-3 top-2 text-[10px] text-slate-600 dark:text-slate-400 font-semibold bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
            {new Date(releaseStart + 'T00:00:00').toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </div>
          <div className="absolute right-3 top-2 text-[10px] text-slate-600 dark:text-slate-400 font-semibold bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
            {new Date(releaseEnd + 'T00:00:00').toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </div>
        </div>

        {/* Phase blocks */}
        <div className="flex h-full pt-8">
          {phases.map((phase) => {
            const phaseDuration = Math.ceil(
              (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const widthPercentage = (phaseDuration / releaseDuration) * 100;
            const color = getPhaseColor(phase.type);

            return (
              <div
                key={phase.id}
                className="relative flex items-center justify-center group transition-all duration-200 hover:z-10 hover:brightness-110 cursor-pointer"
                style={{
                  width: `${Math.min(widthPercentage, 100)}%`,
                  backgroundColor: `${color}30`,
                  borderRight: `3px solid ${color}`,
                }}
                title={`${phase.name}: ${phaseDuration} days`}
              >
                <span 
                  className="text-[11px] font-bold px-2 truncate"
                  style={{ color }}
                >
                  {phase.name}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 
                  bg-slate-900 dark:bg-slate-800 text-white text-xs px-4 py-3 rounded-lg 
                  shadow-2xl border-2 border-slate-700 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200 
                  pointer-events-none whitespace-nowrap z-20 backdrop-blur-sm">
                  <div className="font-semibold mb-1.5 text-white">{phase.name}</div>
                  <div className="text-slate-300 text-[11px] space-y-0.5">
                    <div className="font-medium">{phaseDuration} days</div>
                    <div>
                      {phase.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {phase.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                    <div className="border-8 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overflow indicator */}
        {isOverflow && (
          <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l 
            from-red-500/40 to-transparent flex items-center justify-end pr-3 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400 text-lg font-bold">→</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-200 dark:border-slate-700">
        <span className="text-slate-600 dark:text-slate-400 font-semibold">Legend:</span>
        {Array.from(new Set(phases.map(p => p.type))).map(type => {
          const color = getPhaseColor(type);
          const count = phases.filter(p => p.type === type).length;
          return (
            <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div 
                className="w-3 h-3 rounded-sm shadow-sm" 
                style={{ backgroundColor: `${color}50`, border: `2px solid ${color}` }}
              />
              <span className="text-slate-900 dark:text-white font-semibold">{type}</span>
              <span className="text-slate-500 dark:text-slate-400">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
