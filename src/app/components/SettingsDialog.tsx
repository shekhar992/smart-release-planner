import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AppData } from '../lib/types';
import { updateSettings } from '../lib/storage';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppData;
  onDataChange: (data: AppData) => void;
}

export function SettingsDialog({ open, onOpenChange, data, onDataChange }: SettingsDialogProps) {
  const [storyPointToDays, setStoryPointToDays] = useState(data.settings.storyPointToDays);

  const handleSave = () => {
    const newData = updateSettings(data, { storyPointToDays });
    onDataChange(newData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="sp-to-days">Story Points to Days Conversion</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">1 story point =</span>
              <Input
                id="sp-to-days"
                type="number"
                min="0.1"
                step="0.5"
                value={storyPointToDays}
                onChange={(e) => setStoryPointToDays(parseFloat(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm">days</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              This conversion rate is used to calculate ticket duration from story points
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
