import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { LoginPage } from './features/auth/LoginPage';
import { ProfilePage } from './features/auth/ProfilePage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OkrListPage } from './features/okr-list/OkrListPage';
import { OkrStatusBoardPage } from './features/okr-list/OkrStatusBoardPage';
import { CreateObjectivePage } from './features/objective/CreateObjectivePage';
import { ObjectiveDetailsPage } from './features/objective/ObjectiveDetailsPage';
import { KeyResultDetailsPage } from './features/key-result/KeyResultDetailsPage';
import { ApprovalsInboxPage } from './features/approvals/ApprovalsInboxPage';
import { ApprovalReviewPage } from './features/approvals/ApprovalReviewPage';
import { TeamOkrsPage } from './features/team/TeamOkrsPage';
import { CompanyOkrsPage } from './features/company/CompanyOkrsPage';
import { CheckInsPage } from './features/check-ins/CheckInsPage';
import { ReviewsPage } from './features/reviews/ReviewsPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { CyclesAdminPage } from './features/cycles/CyclesAdminPage';
import { TemplatesAdminPage } from './features/templates/TemplatesAdminPage';
import { WorkflowsAdminPage } from './features/workflows/WorkflowsAdminPage';
import { ScoresAdminPage } from './features/scoring/ScoresAdminPage';
import { MasterDataAdminPage } from './features/master-data/MasterDataAdminPage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { DesignSystemPage } from './features/design-system/DesignSystemPage';
import { StatesGalleryPage } from './features/dev/StatesGalleryPage';
import { ForbiddenPage } from './features/common/ForbiddenPage';
import { NotFoundPage } from './features/common/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* Public Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Application Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Core OKR & Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/okrs" element={<OkrListPage />} />
          <Route path="/okrs/new" element={<Navigate to="/okrs?create=true" replace />} />
          <Route path="/okrs/create" element={<Navigate to="/okrs?create=true" replace />} />
          <Route path="/okrs/edit/:objectiveId" element={<CreateObjectivePage />} />
          <Route path="/okrs/status" element={<OkrStatusBoardPage />} />
          <Route path="/okrs/:objectiveId" element={<ObjectiveDetailsPage />} />
          <Route path="/okrs/:objectiveId/kr/:krId" element={<KeyResultDetailsPage />} />
          <Route path="/okrs/:objectiveId/krs/:krId" element={<KeyResultDetailsPage />} />
          <Route path="/okrs/:objectiveId/krs/:krId/update" element={<KeyResultDetailsPage />} />
          <Route path="/okrs/:objectiveId/krs/new" element={<ObjectiveDetailsPage />} />

          {/* Manager & Workflow Views */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ApprovalsInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals/:id"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ApprovalReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <TeamOkrsPage />
              </ProtectedRoute>
            }
          />

          {/* Company-wide OKRs */}
          <Route path="/company" element={<CompanyOkrsPage />} />

          {/* Check-ins & Continuous Tracking */}
          <Route path="/check-ins" element={<CheckInsPage />} />

          {/* Performance Reviews & Evaluations */}
          <Route path="/reviews" element={<ReviewsPage />} />

          {/* Notifications & Profile */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* HR / Admin Administration */}
          <Route
            path="/admin/cycles"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <CyclesAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <TemplatesAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workflows"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <WorkflowsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scores"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <ScoresAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <ReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/master-data"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <MasterDataAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute requiredRole="HR_ADMIN">
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Developer & Design System Tools */}
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="/dev/states" element={<StatesGalleryPage />} />

          {/* Access Control & Fallback */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
  );
};

export default App;
