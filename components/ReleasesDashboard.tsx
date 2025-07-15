import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CreateReleaseDialog } from './CreateReleaseDialog';
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
  Flag
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
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div 
              className="w-1.5 h-16 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: release.color }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold truncate group-hover:text-blue-700 transition-colors">
                {release.name}
              </CardTitle>
              <CardDescription className="text-sm mt-2 line-clamp-2 text-gray-600">
                {release.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shadow-sm ${getPriorityColor(release.priority)}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 hover:bg-blue-100">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-lg border-0">
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

        <div className="flex items-center gap-3 mt-4">
          <Badge variant="secondary" className={getStatusColor(release.status)}>
            {release.status.replace('-', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className="border-blue-200 text-blue-700">v{release.version}</Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs shadow-sm">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5" onClick={() => onSelect(release)}>
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">Progress</span>
            <span className="text-blue-700 font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium">{metrics.completedTasks}/{metrics.totalTasks} Tasks</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{metrics.teamSize} Team</span>
          </div>
          {metrics.overdueTasks > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium">{metrics.overdueTasks} Overdue</span>
            </div>
          )}
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="font-medium">{metrics.daysRemaining} Days</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-500">{format(release.startDate, 'MMM d')}</span>
            <span className="text-gray-700">{format(release.targetDate, 'MMM d, yyyy')}</span>
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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Release Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and track all your product releases in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onBackToPriority && (
              <Button variant="outline" onClick={onBackToPriority} className="border-orange-200 text-orange-700 hover:bg-orange-50">
                <Flag className="w-4 h-4 mr-2" />
                Priority Dashboard
              </Button>
            )}
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Release
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Releases</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalReleases}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Rocket className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Active Releases</p>
                <p className="text-3xl font-bold text-amber-900">{stats.activeReleases}</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-900">{stats.completedReleases}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-900">{stats.overdueReleases}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <AlertTriangle className="w-6 h-6 text-white" />
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-16">
            <div className="text-center space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-fit mx-auto">
                <Rocket className="w-16 h-16 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready to Launch?</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  Create your first release and start managing your project timeline with ease
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Release
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