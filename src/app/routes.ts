import { createBrowserRouter } from 'react-router';
import { PlanningDashboard } from './components/PlanningDashboard';
import { ReleasePlanningCanvas } from './components/ReleasePlanningCanvas';
import { TeamRoster } from './components/TeamRoster';
import { TeamMemberDetail } from './components/TeamMemberDetail';
import { HolidayManagement } from './components/HolidayManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import NotFoundPage from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: PlanningDashboard,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/release/:releaseId',
    Component: ReleasePlanningCanvas,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/release/:releaseId/team',
    Component: TeamRoster,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/release/:releaseId/team/holidays',
    Component: HolidayManagement,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/product/:productId/team',
    Component: TeamRoster,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/product/:productId/team/:memberId',
    Component: TeamMemberDetail,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/team',
    Component: TeamRoster,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/team/:memberId',
    Component: TeamMemberDetail,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '/holidays',
    Component: HolidayManagement,
    ErrorBoundary: ErrorBoundary
  },
  {
    path: '*',
    Component: NotFoundPage,
  }
]);