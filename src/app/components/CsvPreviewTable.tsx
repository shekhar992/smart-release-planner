import type { TicketInput } from '../../domain/types';

interface CsvPreviewTableProps {
  tickets: TicketInput[];
}

export function CsvPreviewTable({ tickets }: CsvPreviewTableProps) {
  const getPriorityLabel = (priority: number): string => {
    if (priority === 1) return 'High';
    if (priority === 2) return 'High-Med';
    if (priority === 3) return 'Medium';
    if (priority === 4) return 'Med-Low';
    if (priority === 5) return 'Low';
    return `P${priority}`;
  };

  const getPriorityColor = (priority: number): string => {
    if (priority <= 2) return 'text-red-600 bg-red-50 dark:bg-red-950/20';
    if (priority === 3) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                Title
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                Epic
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                Effort
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                Priority
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                Assigned To
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 text-foreground">
                  <div className="max-w-md truncate" title={ticket.title}>
                    {ticket.title}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-foreground">
                  <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
                    {ticket.epic}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="font-medium text-foreground">
                    {ticket.effortDays}d
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-foreground">
                  {ticket.assignedToRaw || (
                    <span className="text-muted-foreground italic text-xs">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary footer */}
      <div className="px-3 py-2 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{tickets.length}</span> ticket{tickets.length !== 1 ? 's' : ''} parsed · 
          <span className="ml-2 font-medium text-foreground">
            {tickets.reduce((sum, t) => sum + t.effortDays, 0)} days
          </span> total effort
        </p>
      </div>
    </div>
  );
}
