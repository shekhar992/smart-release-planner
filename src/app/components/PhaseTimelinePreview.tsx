import { useMemo } from 'react';
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
    <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="font-semibold text-foreground">Phase Timeline Preview</span>
        <span>
          {totalPhaseDuration} days total
          {isOverflow && (
            <span className="text-red-600 dark:text-red-400 ml-1 font-semibold">
              (exceeds release by {totalPhaseDuration - releaseDuration} days)
            </span>
          )}
        </span>
      </div>

      <div className="relative h-16 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Release boundary indicator */}
        <div 
          className="absolute top-0 left-0 h-full w-full"
        >
          <div className="absolute left-2 top-1 text-[10px] text-muted-foreground font-medium">
            {new Date(releaseStart + 'T00:00:00').toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </div>
          <div className="absolute right-2 top-1 text-[10px] text-muted-foreground font-medium">
            {new Date(releaseEnd + 'T00:00:00').toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </div>
        </div>

        {/* Phase blocks */}
        <div className="flex h-full pt-5">
          {phases.map((phase) => {
            const phaseDuration = Math.ceil(
              (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const widthPercentage = (phaseDuration / releaseDuration) * 100;
            const color = getPhaseColor(phase.type);

            return (
              <div
                key={phase.id}
                className="relative flex items-center justify-center group transition-all hover:z-10"
                style={{
                  width: `${Math.min(widthPercentage, 100)}%`,
                  backgroundColor: `${color}20`,
                  borderRight: `2px solid ${color}`,
                }}
                title={`${phase.name}: ${phaseDuration} days`}
              >
                <span 
                  className="text-[10px] font-semibold px-1 truncate"
                  style={{ color }}
                >
                  {phase.name}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                  bg-popover text-popover-foreground text-xs px-3 py-2 rounded-lg 
                  shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity 
                  pointer-events-none whitespace-nowrap z-20">
                  <div className="font-semibold mb-1">{phase.name}</div>
                  <div className="text-muted-foreground">
                    {phaseDuration} days<br />
                    {phase.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {phase.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overflow indicator */}
        {isOverflow && (
          <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l 
            from-red-500/30 to-transparent flex items-center justify-end pr-2">
            <span className="text-red-600 dark:text-red-400 text-lg font-bold">→</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-gray-200 dark:border-gray-800">
        <span className="text-muted-foreground font-medium">Legend:</span>
        {Array.from(new Set(phases.map(p => p.type))).map(type => {
          const color = getPhaseColor(type);
          const count = phases.filter(p => p.type === type).length;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: `${color}40`, border: `1.5px solid ${color}` }}
              />
              <span className="text-foreground font-medium">{type}</span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
