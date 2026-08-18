import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/shared/ui';
import { env } from '@/shared/config/env';
import { AppLayout } from '@/widgets/app-shell';
import { ForbiddenPage, NotFoundPage } from '@/pages/errors/ErrorPages';
import { RequirePermission } from './guards';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'));
const TeamPage = lazy(() => import('@/pages/team/TeamPage'));
const MembersPage = lazy(() => import('@/pages/members/MembersPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const SettingsLayout = lazy(() => import('@/pages/settings/SettingsLayout'));
const ProfileSettings = lazy(() => import('@/pages/settings/ProfileSettings'));
const AppearanceSettings = lazy(() => import('@/pages/settings/AppearanceSettings'));
const NotificationSettings = lazy(() => import('@/pages/settings/NotificationSettings'));
const SecuritySettings = lazy(() => import('@/pages/settings/SecuritySettings'));
const OrganizationSettings = lazy(() => import('@/pages/settings/OrganizationSettings'));
const PermissionsSettings = lazy(() => import('@/pages/settings/PermissionsSettings'));
const DevUiPage = lazy(() => import('@/pages/dev/DevUiPage'));

function PageFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner label="Loading page" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/" replace />} />

        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="analytics" element={<RequirePermission action="analytics:view"><AnalyticsPage /></RequirePermission>} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="members" element={<RequirePermission action="member:invite"><MembersPage /></RequirePermission>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="billing" element={<RequirePermission action="billing:view"><BillingPage /></RequirePermission>} />

          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="organization" element={<RequirePermission action="settings:organization"><OrganizationSettings /></RequirePermission>} />
            <Route path="permissions" element={<RequirePermission action="settings:permissions"><PermissionsSettings /></RequirePermission>} />
          </Route>

          {env.isDev && <Route path="dev/ui" element={<DevUiPage />} />}
        </Route>

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
