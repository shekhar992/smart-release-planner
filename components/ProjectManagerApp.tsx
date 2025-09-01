import { useState, useEffect } from 'react';
import { ProjectProvider, useProjects } from '../contexts/ProjectContext';
import { ReleaseProvider, useReleases } from '../contexts/ReleaseContext';
import { ProjectDashboard } from './ProjectDashboard';
import { ProjectDetailView } from './ProjectDetailView';
import { ReleaseView } from './ReleaseView';
import { CreateProjectDialog } from './CreateProjectDialog';
import { CreateReleaseDialog } from './CreateReleaseDialog';
import { CreateReleasePage } from './CreateReleasePage';
import { ReleaseCreationChoiceDialog } from './ReleaseCreationChoiceDialog';
import { PocReleasesDashboard } from './PocReleasesDashboard';
import { Project } from '../types/project';
import { Release } from '../contexts/ReleaseContext';

type ViewType = 'dashboard' | 'project-detail' | 'release-detail' | 'create-release' | 'poc-dashboard';

interface AppState {
  currentView: ViewType;
  selectedProject: Project | null;
  selectedRelease: Release | null;
}

export function ProjectManagerApp() {
  return (
    <ProjectProvider>
      <ReleaseProvider>
        <ProjectManagerAppInner />
      </ReleaseProvider>
    </ProjectProvider>
  );
}

function ProjectManagerAppInner() {
  console.log('ProjectManagerApp rendered');
  const { projects } = useProjects();
  const [appState, setAppState] = useState<AppState>({
    currentView: 'dashboard',
    selectedProject: null,
    selectedRelease: null
  });
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [showReleaseChoiceDialog, setShowReleaseChoiceDialog] = useState(false);
  const [showCreateReleaseDialog, setShowCreateReleaseDialog] = useState(false);
  const [pendingReleaseProjectId, setPendingReleaseProjectId] = useState<string | null>(null);

  // Helper function to find project for a release
  const findProjectForRelease = (releaseId: string): Project | null => {
    return projects.find(project => 
      project.releases.includes(releaseId)
    ) || null;
  };

  const navigateToProjects = () => {
    setAppState({
      currentView: 'dashboard',
      selectedProject: null,
      selectedRelease: null
    });
  };

  const navigateToProject = (project: Project) => {
    setAppState({
      currentView: 'project-detail',
      selectedProject: project,
      selectedRelease: null
    });
  };

  const navigateToRelease = (release: Release) => {
    // Find the project this release belongs to
    const project = findProjectForRelease(release.id);
    
    setAppState({
      currentView: 'release-detail',
      selectedProject: project, // Set the project context
      selectedRelease: release
    });
  };

  const navigateToCreateRelease = (projectId?: string) => {
    setPendingReleaseProjectId(projectId || null);
    setShowReleaseChoiceDialog(true);
  };

  const navigateToPocDashboard = () => {
    setAppState({
      currentView: 'poc-dashboard',
      selectedProject: null,
      selectedRelease: null
    });
  };

  const navigateToCreatePocRelease = () => {
    setAppState({
      currentView: 'create-release',
      selectedProject: null,
      selectedRelease: null
    });
  };

  const handleReleaseCreationChoice = (useFullPage: boolean) => {
    setShowReleaseChoiceDialog(false);
    
    if (useFullPage) {
      // Use the full page experience
      setAppState({
        currentView: 'create-release',
        selectedProject: pendingReleaseProjectId ? projects.find(p => p.id === pendingReleaseProjectId) || null : null,
        selectedRelease: null
      });
    } else {
      // Use the dialog experience
      setShowCreateReleaseDialog(true);
    }
  };

  const handleCreateProject = () => {
    setShowCreateProjectDialog(true);
  };

  const handleEditProject = (project: Project) => {
    // TODO: Implement project editing modal
    console.log('Edit project:', project.name);
  };

  // Component to set current release in context
  const ReleaseDetailWrapper = ({ release }: { release: Release }) => {
    const { setCurrentRelease } = useReleases();
    
    useEffect(() => {
      console.log('Setting current release:', release);
      setCurrentRelease(release);
      return () => {
        console.log('Clearing current release');
        setCurrentRelease(null);
      };
    }, [release, setCurrentRelease]);

    return <ReleaseView />;
  };

  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'dashboard':
        return (
          <ProjectDashboard
            onNavigateToProject={navigateToProject}
            onNavigateToRelease={navigateToRelease}
            onCreateProject={handleCreateProject}
            onCreateRelease={() => navigateToCreateRelease()}
            onNavigateToPocDashboard={navigateToPocDashboard}
          />
        );

      case 'poc-dashboard':
        return (
          <PocReleasesDashboard
            onNavigateToRelease={navigateToRelease}
            onCreatePocRelease={navigateToCreatePocRelease}
            onNavigateBack={navigateToProjects}
          />
        );

      case 'project-detail':
        if (!appState.selectedProject) return null;
        return (
          <ProjectDetailView
            project={appState.selectedProject}
            onNavigateBack={navigateToProjects}
            onNavigateToRelease={navigateToRelease}
            onCreateRelease={() => navigateToCreateRelease(appState.selectedProject?.id)}
            onEditProject={handleEditProject}
          />
        );

      case 'create-release':
        return (
          <CreateReleasePage
            onNavigateBack={() => {
              if (appState.selectedProject) {
                // If we came from a project, go back to project detail
                setAppState({
                  currentView: 'project-detail',
                  selectedProject: appState.selectedProject,
                  selectedRelease: null
                });
              } else {
                // Otherwise go back to dashboard
                navigateToProjects();
              }
            }}
            projectId={appState.selectedProject?.id}
            projectName={appState.selectedProject?.name}
          />
        );

      case 'release-detail':
        if (!appState.selectedRelease) return null;
        return (
          <div className="min-h-screen bg-background">
            {/* Release Header */}
            <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (appState.selectedProject) {
                          // If we have a project context, go back to project detail
                          setAppState({
                            ...appState,
                            currentView: 'project-detail',
                            selectedRelease: null
                          });
                        } else {
                          // If no project context, go back to dashboard
                          navigateToProjects();
                        }
                      }}
                      className="flex items-center gap-2 hover:bg-primary/10 px-3 py-2 rounded-md transition-colors"
                    >
                      ← Back {appState.selectedProject ? 'to Project' : 'to Dashboard'}
                    </button>
                    <div 
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: appState.selectedRelease.color }}
                    />
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        {appState.selectedRelease.name}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {appState.selectedProject?.name} • v{appState.selectedRelease.version}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Release Content */}
            <ReleaseDetailWrapper release={appState.selectedRelease} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
      <CreateProjectDialog
        open={showCreateProjectDialog}
        onClose={() => setShowCreateProjectDialog(false)}
      />
      <ReleaseCreationChoiceDialog
        open={showReleaseChoiceDialog}
        onClose={() => {
          setShowReleaseChoiceDialog(false);
          setPendingReleaseProjectId(null);
        }}
        onChooseDialog={() => handleReleaseCreationChoice(false)}
        onChooseFullPage={() => handleReleaseCreationChoice(true)}
        projectName={pendingReleaseProjectId ? projects.find(p => p.id === pendingReleaseProjectId)?.name : undefined}
      />
      <CreateReleaseDialog
        open={showCreateReleaseDialog}
        onClose={() => {
          setShowCreateReleaseDialog(false);
          setPendingReleaseProjectId(null);
        }}
        projectId={pendingReleaseProjectId || undefined}
      />
    </div>
  );
}
