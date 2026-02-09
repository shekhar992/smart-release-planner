import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { CreateReleaseDialog } from '../components/CreateReleaseDialog';
import { loadData, createRelease } from '../lib/storage';
import { AppData, Release } from '../lib/types';
import { format } from 'date-fns';

export default function ReleasesPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setData(loadData());
  }, []);

  const handleCreateRelease = (releaseData: { name: string; startDate: Date; targetEndDate: Date }) => {
    if (!data) return;

    const newRelease: Release = {
      id: crypto.randomUUID(),
      ...releaseData,
    };

    const newData = createRelease(data, newRelease);
    setData(newData);
  };

  if (!data) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Release Planning</h1>
            <p className="text-sm text-neutral-500 mt-1">Plan releases, sprints, and team workload</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/team">
              <Button variant="outline">Team</Button>
            </Link>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create Release
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {data.releases.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-neutral-100 mb-4">
              <Calendar className="size-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-medium mb-2">No releases yet</h2>
            <p className="text-neutral-500 mb-6">Get started by creating your first release</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create Release
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.releases.map((release) => {
              const features = data.features.filter((f) => f.releaseId === release.id);
              const tickets = data.tickets.filter((t) =>
                features.some((f) => f.id === t.featureId)
              );
              const totalStoryPoints = tickets.reduce((sum, t) => sum + t.storyPoints, 0);

              return (
                <Link key={release.id} to={`/releases/${release.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{release.name}</span>
                      </CardTitle>
                      <CardDescription className="space-y-2 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="size-4" />
                          <span>
                            {format(release.startDate, 'MMM d')} - {format(release.targetEndDate, 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="size-4" />
                          <span>
                            {features.length} features, {tickets.length} tickets, {totalStoryPoints} story points
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <CreateReleaseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateRelease={handleCreateRelease}
      />
    </div>
  );
}
