import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CreateReleaseDialog } from './CreateReleaseDialog';
import { ThemeToggle } from './ThemeToggle';
import { 
  Plus, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Rocket,
  TrendingUp,
  Target,
  ArrowLeft
} from 'lucide-react';
import { format, isPast } from 'date-fns';

interface ReleaseCardProps {
  release: any;
  onSelect: (release: any) => void;
  onEdit: (release: any) => void;
  onDuplicate: (release: any) => void;
  onDelete: (release: any) => void;
}

function ReleaseCard({ release, onSelect, onEdit, onDuplicate, onDelete }: ReleaseCardProps) {
  const { calculateReleaseProgress, getReleaseMetrics } = useReleases();
  
  const progress = calculateReleaseProgress(release.id);
  const metrics = getReleaseMetrics(release.id);
  const isOverdue = isPast(release.targetDate) && release.status !== 'completed';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'in-progress': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'delayed': return 'bg-red-50 text-red-700 border border-red-200';
      case 'completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'cancelled': return 'bg-gray-50 text-gray-700 border border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-all duration-200 cursor-pointer group border-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div 
              className="w-1 h-16 rounded-full flex-shrink-0"
              style={{ backgroundColor: release.color }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{release.name}</CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {release.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(release.priority)}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelect(release)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Timeline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(release)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Release
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(release)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(release)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className={getStatusColor(release.status)}>
            {release.status.replace('-', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline">v{release.version}</Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4" onClick={() => onSelect(release)}>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{metrics.completedTasks}/{metrics.totalTasks} Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{metrics.teamSize} Team</span>
          </div>
          {metrics.overdueTasks > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{metrics.overdueTasks} Overdue</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span>{metrics.daysRemaining} Days</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{format(release.startDate, 'MMM d')}</span>
            <span>{format(release.targetDate, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReleasesDashboard({ onBackToPriority }: { onBackToPriority?: () => void }) {
  const { releases, setCurrentRelease } = useReleases();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);

  const handleSelectRelease = (release: any) => {
    setCurrentRelease(release);
  };

  const handleEditRelease = (release: any) => {
    setEditingRelease(release);
    setShowCreateDialog(true);
  };

  const handleDuplicateRelease = async (release: any) => {
    console.log('Duplicate release:', release);
  };

  const handleDeleteRelease = async (release: any) => {
    if (confirm(`Are you sure you want to delete "${release.name}"?`)) {
      console.log('Delete release:', release);
    }
  };

  const getQuickStats = () => {
    const totalReleases = releases.length;
    const activeReleases = releases.filter(r => r.status === 'in-progress').length;
    const completedReleases = releases.filter(r => r.status === 'completed').length;
    const overdueReleases = releases.filter(r => 
      isPast(r.targetDate) && r.status !== 'completed'
    ).length;

    return { totalReleases, activeReleases, completedReleases, overdueReleases };
  };

  const stats = getQuickStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="mb-2">Release Management</h1>
          <p className="text-muted-foreground">
            Manage product releases with interactive timelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBackToPriority && (
            <Button variant="outline" onClick={onBackToPriority}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Priority Dashboard
            </Button>
          )}
          <ThemeToggle />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Release
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Rocket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Releases</p>
                <p className="text-2xl font-semibold">{stats.totalReleases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-semibold">{stats.activeReleases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold">{stats.completedReleases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-semibold">{stats.overdueReleases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Releases Grid */}
      {releases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((release) => (
            <ReleaseCard
              key={release.id}
              release={release}
              onSelect={handleSelectRelease}
              onEdit={handleEditRelease}
              onDuplicate={handleDuplicateRelease}
              onDelete={handleDeleteRelease}
            />
          ))}
        </div>
      ) : (
        <Card className="card-shadow border-0">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                <Rocket className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg mb-2">No releases yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first release to get started
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Release
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateReleaseDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingRelease(null);
        }}
        editingRelease={editingRelease}
      />
    </div>
  );
}