import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Rocket, Zap, Target } from 'lucide-react';

interface ReleaseCreationChoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onChooseDialog: () => void;
  onChooseFullPage: () => void;
  projectName?: string;
}

export function ReleaseCreationChoiceDialog({ 
  open, 
  onClose, 
  onChooseDialog, 
  onChooseFullPage,
  projectName 
}: ReleaseCreationChoiceDialogProps) {
  console.log('ReleaseCreationChoiceDialog rendered with:', { open, projectName });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Create New Release
          </DialogTitle>
          <DialogDescription>
            {projectName 
              ? `Choose how you'd like to create a release for ${projectName}`
              : 'Choose how you\'d like to create your release'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Quick Dialog Option */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/50"
            onClick={() => {
              console.log('Quick Create option clicked');
              onChooseDialog();
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Create</CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    Dialog
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>
                Fast and simple release creation with essential fields in a compact dialog.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                ✅ Quick setup<br />
                ✅ Essential fields only<br />
                ✅ Faster workflow
              </div>
            </CardContent>
          </Card>

          {/* Full Page Option */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/50"
            onClick={() => {
              console.log('Advanced Create option clicked');
              onChooseFullPage();
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advanced Create</CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    Full Page
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>
                Step-by-step wizard with templates, detailed configuration, and guided setup.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                ✅ Template selection<br />
                ✅ Step-by-step wizard<br />
                ✅ Advanced configuration
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
