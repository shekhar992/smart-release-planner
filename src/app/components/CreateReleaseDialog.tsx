import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { format } from 'date-fns';

interface CreateReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRelease: (data: { name: string; startDate: Date; targetEndDate: Date }) => void;
}

export function CreateReleaseDialog({ open, onOpenChange, onCreateRelease }: CreateReleaseDialogProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetEndDate, setTargetEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateRelease({
      name: name.trim(),
      startDate: new Date(startDate),
      targetEndDate: new Date(targetEndDate),
    });

    // Reset form
    setName('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setTargetEndDate(format(new Date(), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Release</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="release-name">Release Name</Label>
            <Input
              id="release-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2026 Release"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="target-end-date">Target End Date</Label>
            <Input
              id="target-end-date"
              type="date"
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Release
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
