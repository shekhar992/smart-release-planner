import React, { useState } from 'react';
import { 
  ModernCard, 
  StatusBadge, 
  ModernProgress,
  FloatingActionButton,
  CommandPalette
} from './ui/enhanced-design-system';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  Plus,
  Search,
  Bell,
  Settings,
  Menu,
  Home,
  Folder,
  BarChart3,
  CheckCircle2,
  Star,
  Filter,
  Download,
  MoreHorizontal,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { cn } from './ui/utils';

interface ModernDashboardProps {
  className?: string;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ className }) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sample data
  const metrics = {
    totalProjects: 12,
    activeTasks: 47,
    completedTasks: 156,
    teamMembers: 8,
    upcomingDeadlines: 5,
    progress: 68
  };

  const recentProjects = [
    { name: 'Web Platform Redesign', progress: 85, status: 'active', team: 6, deadline: '2 days' },
    { name: 'Mobile App V2', progress: 42, status: 'planning', team: 4, deadline: '1 week' },
    { name: 'API Integration', progress: 95, status: 'review', team: 3, deadline: 'Today' },
    { name: 'Database Migration', progress: 23, status: 'active', team: 5, deadline: '3 days' }
  ];

  const quickActions = [
    { title: 'Create Project', icon: Folder, color: 'blue', action: () => console.log('Create Project clicked') },
    { title: 'Add Task', icon: Plus, color: 'green', action: () => console.log('Add Task clicked') },
    { title: 'Team Meeting', icon: Users, color: 'purple', action: () => console.log('Team Meeting clicked') },
    { title: 'Reports', icon: BarChart3, color: 'amber', action: () => console.log('Reports clicked') }
  ];

  return (
    <div className={cn("min-h-screen bg-gray-50/50 dark:bg-gray-950", className)}>
      {/* Modern Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover-lift"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Timeline View</h1>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects, tasks, or team members..."
                className="pl-10 input-modern"
                onClick={() => setCommandOpen(true)}
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover-lift relative"
              onClick={() => console.log('Notifications clicked')}
            >
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover-lift"
              onClick={() => console.log('Settings clicked')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <div 
              className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 cursor-pointer hover-lift" 
              onClick={() => console.log('Profile clicked')}
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Modern Sidebar */}
        <aside className={cn(
          "sidebar-modern h-[calc(100vh-4rem)] transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <nav className="p-4 space-y-2">
            {[
              { icon: Home, label: 'Dashboard', active: true, action: () => console.log('Dashboard clicked') },
              { icon: Folder, label: 'Projects', count: 12, action: () => console.log('Projects clicked') },
              { icon: CheckCircle2, label: 'Tasks', count: 47, action: () => console.log('Tasks clicked') },
              { icon: Users, label: 'Team', count: 8, action: () => console.log('Team clicked') },
              { icon: BarChart3, label: 'Analytics', action: () => console.log('Analytics clicked') },
              { icon: Calendar, label: 'Calendar', action: () => console.log('Calendar clicked') }
            ].map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer hover-lift",
                  item.active 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={item.action}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.count && (
                      <StatusBadge variant="default" size="sm">
                        {item.count}
                      </StatusBadge>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Welcome Section */}
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Good morning, Alex! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your projects today.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <ModernCard 
                key={index} 
                variant="interactive" 
                size="sm"
                className="group cursor-pointer"
                onClick={action.action}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    action.color === 'blue' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    action.color === 'green' && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                    action.color === 'purple' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                    action.color === 'amber' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </span>
                </div>
              </ModernCard>
            ))}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernCard variant="elevated" className="hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.totalProjects}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">+2 this week</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </ModernCard>

            <ModernCard variant="elevated" className="hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.activeTasks}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">{metrics.upcomingDeadlines} due soon</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </ModernCard>

            <ModernCard variant="elevated" className="hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.teamMembers}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-purple-600 dark:text-purple-400">100% active</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </ModernCard>

            <ModernCard variant="elevated" className="hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.progress}%</p>
                  <ModernProgress 
                    value={metrics.progress} 
                    variant="success" 
                    className="mt-2" 
                  />
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </ModernCard>
          </div>

          {/* Recent Projects */}
          <ModernCard variant="default" size="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Projects</h3>
                <p className="text-gray-600 dark:text-gray-400">Your most active projects and their current status</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover-lift"
                  onClick={() => console.log('Filter projects')}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover-lift"
                  onClick={() => console.log('Export projects')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer hover-lift"
                  onClick={() => console.log(`Opening project: ${project.name}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{project.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-2">
                          <ModernProgress 
                            value={project.progress} 
                            variant={project.progress > 80 ? 'success' : project.progress > 50 ? 'default' : 'warning'}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{project.progress}%</span>
                        </div>
                        <StatusBadge 
                          variant={
                            project.status === 'active' ? 'success' : 
                            project.status === 'planning' ? 'warning' : 
                            'primary'
                          }
                          dot
                        >
                          {project.status}
                        </StatusBadge>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          {project.team}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {project.deadline}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover-lift"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Opening project details: ${project.name}`);
                      }}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover-lift"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`More options for: ${project.name}`);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-800 mt-6">
              <Button 
                variant="outline" 
                className="hover-lift"
                onClick={() => console.log('View All Projects clicked')}
              >
                View All Projects
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </ModernCard>
        </main>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => console.log('Create new item')}>
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Command Palette */}
      <CommandPalette 
        open={commandOpen} 
        onOpenChange={setCommandOpen}
        placeholder="Search projects, tasks, or commands..."
      />

      {/* Dialogs - Temporarily disabled for debugging */}
      {/*
      <CreateProjectDialog 
        open={createProjectOpen} 
        onClose={() => setCreateProjectOpen(false)} 
      />
      
      <CreateReleaseDialog 
        open={createReleaseOpen} 
        onClose={() => setCreateReleaseOpen(false)} 
      />

      <NewTaskForm 
        open={newTaskOpen} 
        onOpenChange={setNewTaskOpen} 
      />
      */}
    </div>
  );
};

export default ModernDashboard;
