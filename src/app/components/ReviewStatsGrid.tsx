import { cn } from './ui/utils';

interface ReviewStatsGridProps {
  backlogDays: number;
  capacityDays: number;
  overflowCount: number;
  teamSize: number;
  assignedCount: number;
  unassignedCount: number;
}

export function ReviewStatsGrid({
  backlogDays,
  capacityDays,
  overflowCount,
  teamSize,
  assignedCount,
  unassignedCount
}: ReviewStatsGridProps) {
  const stats = [
    {
      label: 'Backlog Days',
      value: backlogDays,
      sublabel: 'Total effort required'
    },
    {
      label: 'Capacity Days',
      value: capacityDays,
      sublabel: 'Available capacity'
    },
    {
      label: 'Overflow Tickets',
      value: overflowCount,
      sublabel: 'Out of scope'
    },
    {
      label: 'Team Size',
      value: teamSize,
      sublabel: `${assignedCount} assigned, ${unassignedCount} unassigned`
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, idx) => (
        <div 
          key={idx}
          className="p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200"
        >
          <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 font-semibold">
            {stat.label}
          </div>
          <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-2">
            {stat.value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stat.sublabel}
          </div>
        </div>
      ))}
    </div>
  );
}
