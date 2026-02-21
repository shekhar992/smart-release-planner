import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from './ui/utils';

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
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusText = () => {
    if (percentage >= 90) return 'Healthy';
    if (percentage >= 70) return 'Risk';
    return 'Over Capacity';
  };

  const getStatusIcon = () => {
    if (percentage >= 90) return <CheckCircle2 className="w-5 h-5" />;
    if (percentage >= 70) return <TrendingUp className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getBgColor = () => {
    if (percentage >= 90) return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800';
    if (percentage >= 70) return 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800';
  };

  const getIconBg = () => {
    if (percentage >= 90) return 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30';
    if (percentage >= 70) return 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30';
    return 'bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/30';
  };

  return (
    <div className={cn('p-6 rounded-xl border shadow-sm', getBgColor())}>
      {/* Icon & Percentage Display */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg text-white', getIconBg())}>
          {getStatusIcon()}
        </div>
        <div className={cn('text-5xl font-bold tabular-nums', getTextColor())}>
          {percentage}%
        </div>
      </div>

      {/* Status Text */}
      <div className={cn('text-center text-sm font-semibold mb-4', getTextColor())}>
        {getStatusText()}
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-white/60 dark:bg-slate-900/60 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
        <motion.div
          className={cn('absolute inset-y-0 left-0 bg-gradient-to-r rounded-full shadow-md', getGradient())}
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
