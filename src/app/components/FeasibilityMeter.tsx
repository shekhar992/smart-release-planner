import { motion } from 'motion/react';

interface FeasibilityMeterProps {
  percentage: number;
}

export function FeasibilityMeter({ percentage }: FeasibilityMeterProps) {
  // Color logic based on percentage
  const getGradient = () => {
    if (percentage >= 90) return 'from-green-500 to-green-600';
    if (percentage >= 70) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (percentage >= 90) return 'Healthy';
    if (percentage >= 70) return 'Risk';
    return 'Over Capacity';
  };

  const getBgColor = () => {
    if (percentage >= 90) return 'bg-green-50/50';
    if (percentage >= 70) return 'bg-amber-50/50';
    return 'bg-red-50/50';
  };

  return (
    <div className={`p-6 rounded-xl ${getBgColor()} shadow-sm`}>
      {/* Percentage Display */}
      <div className="flex items-center justify-center mb-2">
        <div className={`text-5xl font-bold ${getTextColor()}`}>
          {percentage}%
        </div>
      </div>

      {/* Status Text */}
      <div className={`text-center text-sm font-medium mb-4 ${getTextColor()}`}>
        {getStatusText()}
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getGradient()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      </div>
    </div>
  );
}
