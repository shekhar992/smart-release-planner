import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Release, AppData, Ticket } from '../lib/types';
import { HierarchyPanel } from './HierarchyPanel';
import { TimelinePanel } from './TimelinePanel';
import { WorkloadPanel } from './WorkloadPanel';
import { TicketDetailsPanel } from './TicketDetailsPanel';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { format } from 'date-fns';
import { createSprint } from '../lib/storage';

interface ReleaseCanvasProps {
  release: Release;
  data: AppData;
  onDataChange: (data: AppData) => void;
  showWorkload: boolean;
}

export function ReleaseCanvas({ release, data, onDataChange, showWorkload }: ReleaseCanvasProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintStart, setSprintStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sprintEnd, setSprintEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const selectedTicket = selectedTicketId
    ? data.tickets.find((t) => t.id === selectedTicketId)
    : null;

  const handleCreateSprint = () => {
    if (!sprintName.trim()) return;

    const newData = createSprint(data, {
      id: crypto.randomUUID(),
      name: sprintName.trim(),
      startDate: new Date(sprintStart),
      endDate: new Date(sprintEnd),
      releaseId: release.id,
    });

    onDataChange(newData);
    setCreateSprintOpen(false);
    setSprintName('');
  };

  return (
    <div className="h-full flex">
      {/* Left: Hierarchy */}
      <div className="w-80 flex-shrink-0">
        <HierarchyPanel
          release={release}
          data={data}
          onDataChange={onDataChange}
          selectedTicketId={selectedTicketId}
          onTicketSelect={setSelectedTicketId}
        />
      </div>

      {/* Center: Timeline */}
      <div className="flex-1 relative">
        <TimelinePanel
          release={release}
          data={data}
          onDataChange={onDataChange}
          selectedTicketId={selectedTicketId}
          onTicketSelect={setSelectedTicketId}
        />

        {/* Sprint Button */}
        <div className="absolute bottom-4 right-4">
          <Button onClick={() => setCreateSprintOpen(true)} size="sm">
            <Plus className="size-4 mr-2" />
            Add Sprint
          </Button>
        </div>
      </div>

      {/* Right: Ticket Details or Workload */}
      {showWorkload ? (
        <div className="w-80 flex-shrink-0">
          <WorkloadPanel release={release} data={data} />
        </div>
      ) : selectedTicket ? (
        <div className="w-80 flex-shrink-0">
          <TicketDetailsPanel
            ticket={selectedTicket}
            data={data}
            onDataChange={onDataChange}
            onClose={() => setSelectedTicketId(null)}
          />
        </div>
      ) : null}

      {/* Create Sprint Dialog */}
      <Dialog open={createSprintOpen} onOpenChange={setCreateSprintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
            <DialogDescription>Define a sprint for this release</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder="e.g., Sprint 1"
              />
            </div>
            <div>
              <Label htmlFor="sprint-start">Start Date</Label>
              <Input
                id="sprint-start"
                type="date"
                value={sprintStart}
                onChange={(e) => setSprintStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sprint-end">End Date</Label>
              <Input
                id="sprint-end"
                type="date"
                value={sprintEnd}
                onChange={(e) => setSprintEnd(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setCreateSprintOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint} disabled={!sprintName.trim()}>
                Create Sprint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
