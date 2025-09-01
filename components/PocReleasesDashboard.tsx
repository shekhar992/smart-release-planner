import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Release } from '../contexts/ReleaseContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { 
  Plus,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Beaker,
  Lightbulb,
  Rocket,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  ArrowLeft
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface PocReleasesDashboardProps {
  onNavigateToRelease: (release: Release) => void;
  onCreatePocRelease: () => void;
  onNavigateBack?: () => void;
}

export function PocReleasesDashboard({ onNavigateToRelease, onCreatePocRelease, onNavigateBack }: PocReleasesDashboardProps) {
  const { getPocReleases, calculateReleaseProgress, deleteRelease } = useReleases();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'poc' | 'research'>('all');
  
  const pocReleases = getPocReleases();
  
  // Filter releases by category
  const filteredReleases = pocReleases.filter(release => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'poc') return release.name.toLowerCase().includes('poc') || release.name.toLowerCase().includes('demo');
    if (selectedCategory === 'research') return release.name.toLowerCase().includes('research') || release.name.toLowerCase().includes('spike');
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDeleteRelease = async (releaseId: string) => {
    if (window.confirm('Are you sure you want to delete this POC release?')) {
      await deleteRelease(releaseId);
    }
  };

  // Calculate POC metrics
  const totalPocs = pocReleases.length;
  const activePocs = pocReleases.filter(r => r.status === 'in-progress').length;
  const completedPocs = pocReleases.filter(r => r.status === 'completed').length;
  const averageProgress = pocReleases.length > 0 
    ? pocReleases.reduce((acc, release) => acc + calculateReleaseProgress(release.id), 0) / pocReleases.length 
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {onNavigateBack && (
            <Button variant="ghost" onClick={onNavigateBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Beaker className="w-8 h-8 text-purple-600" />
              POC Releases
            </h1>
            <p className="text-muted-foreground">
              Manage your proof-of-concepts, demos, and research experiments
            </p>
          </div>
        </div>
        <Button onClick={onCreatePocRelease} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          New POC Release
        </Button>
      </div>

      {/* POC Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POCs</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPocs}</div>
            <p className="text-xs text-muted-foreground">
              Proof of concepts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active POCs</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePocs}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPocs}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
            <Progress value={averageProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          All POCs
        </Button>
        <Button
          variant={selectedCategory === 'poc' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('poc')}
          size="sm"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Demos & POCs
        </Button>
        <Button
          variant={selectedCategory === 'research' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('research')}
          size="sm"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Research Spikes
        </Button>
      </div>

      {/* POC Releases Grid */}
      {filteredReleases.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Beaker className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No POC Releases Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start experimenting! Create your first proof-of-concept or research project to validate ideas and explore new technologies.
          </p>
          <Button 
            onClick={onCreatePocRelease}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First POC
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReleases.map((release) => {
            const progress = calculateReleaseProgress(release.id);
            const daysRemaining = Math.max(0, differenceInDays(release.targetDate, new Date()));
            const isOverdue = new Date() > release.targetDate && release.status !== 'completed';

            return (
              <Card key={release.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: release.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold truncate">
                          {release.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          v{release.version}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      POC
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {release.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(release.priority)}>
                        {release.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(release.status)}>
                        {release.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(release.targetDate, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOverdue ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-red-500">Overdue</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{daysRemaining} days left</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToRelease(release)}
                      className="flex-1 mr-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigateToRelease(release)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRelease(release.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
