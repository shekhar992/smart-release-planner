import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, Settings, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { loadData } from '../lib/storage';
import { AppData } from '../lib/types';
import { ReleaseCanvas } from '../components/ReleaseCanvas';

export default function ReleasePlanningPage() {
  const { releaseId } = useParams<{ releaseId: string }>();
  const [data, setData] = useState<AppData | null>(null);
  const [showWorkload, setShowWorkload] = useState(false);

  useEffect(() => {
    setData(loadData());
  }, []);

  const handleDataChange = (newData: AppData) => {
    setData(newData);
  };

  if (!data || !releaseId) return null;

  const release = data.releases.find((r) => r.id === releaseId);
  if (!release) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Release not found</h2>
          <Link to="/">
            <Button>Back to Releases</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Header */}
        <header className="border-b bg-white flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">{release.name}</h1>
                <p className="text-sm text-neutral-500">
                  {release.startDate.toLocaleDateString()} - {release.targetEndDate.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showWorkload ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowWorkload(!showWorkload)}
              >
                <Users className="size-4 mr-2" />
                Workload
              </Button>
              <Link to="/team">
                <Button variant="outline" size="sm">
                  <Settings className="size-4 mr-2" />
                  Team
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 overflow-hidden">
          <ReleaseCanvas
            release={release}
            data={data}
            onDataChange={handleDataChange}
            showWorkload={showWorkload}
          />
        </main>
      </div>
    </DndProvider>
  );
}
