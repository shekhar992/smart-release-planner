/**
 * Sprint Capacity Bar Component (Phase 2)
 * 
 * Displays capacity utilization for a sprint with visual progress bar
 * - Green: 0-80% (healthy)
 * - Yellow: 80-100% (approaching limit)
 * - Red: >100% (overallocated)
 */

import designTokens from '../lib/designTokens';

interface SprintCapacityBarProps {
  capacityUsed: number;
  totalCapacity: number;
  className?: string;
}

export function SprintCapacityBar({
  capacityUsed,
  totalCapacity,
  className = ''
}: SprintCapacityBarProps) {
  const percentage = totalCapacity > 0 ? Math.round((capacityUsed / totalCapacity) * 100) : 0;
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage > 100) return designTokens.colors.semantic.error;
    if (percentage >= 80) return designTokens.colors.semantic.warning;
    return designTokens.colors.semantic.success;
  };
  
  const color = getColor();
  const fillPercentage = Math.min(percentage, 100);
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Progress Bar */}
      <div 
        className="relative h-2 rounded-full bg-gray-200 overflow-hidden"
        style={{ width: '80px' }}
        title={`${capacityUsed} of ${totalCapacity} days used (${percentage}%)`}
      >
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{
            width: `${fillPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      
      {/* Percentage Text */}
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color, minWidth: '38px' }}
      >
        {percentage}%
      </span>
    </div>
  );
}
