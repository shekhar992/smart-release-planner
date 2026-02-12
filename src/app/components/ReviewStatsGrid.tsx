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
          className="p-4 bg-card rounded-lg shadow-sm border border-border/50"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {stat.label}
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground">
            {stat.sublabel}
          </div>
        </div>
      ))}
    </div>
  );
}
