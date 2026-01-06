import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/dashboard-layout";
import Layout from "./components/layout";
import { CandidateRouteRedirect } from "./components/CandidateRouteRedirect";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PermissionGuard } from "./components/auth/PermissionGuard";
import { RoleGuard } from "./components/auth/RoleGuard";
import { Toaster } from "./components/ui/sonner";
import PublicApplyPage from "./pages/apply";
import ApplySuccessPage from "./pages/apply/success";
import ForgotPasswordPage from "./pages/auth/forgot-password";
import LoginPage from "./pages/auth/login";
import MagicLinkPage from "./pages/auth/magic-link";
import RegisterAdminPage from "./pages/auth/register-admin";
import ResetPasswordPage from "./pages/auth/reset-password";
import VerifyEmailPage from "./pages/auth/verify-email";
import VerifyMagicLinkPage from "./pages/auth/verify-magic-link";
import AccountPage from "./pages/dashboard/account";
import ApplicationsPage from "./pages/dashboard/applications";
import CandidatesPage from "./pages/dashboard/candidates";
import CandidateDetailsPage from "./pages/dashboard/candidates/details";
import QuickImportPage from "./pages/dashboard/candidates/quick-import";
import CategoriesPage from "./pages/dashboard/categories";
import ClientsPage from "./pages/dashboard/clients";
import ClientDetailPage from "./pages/dashboard/clients/detail";
import DashboardMainPage from "./pages/dashboard/dashboard-main";
import HelpPage from "./pages/dashboard/help";
import DashboardJobsPage from "./pages/dashboard/jobs";
import JobCandidateCommunicationPage from "./pages/dashboard/jobs/candidate-communication";
import JobCandidateDetailPage from "./pages/dashboard/jobs/candidate-detail";
import JobDetailPage from "./pages/dashboard/jobs/detail";
import InterviewPage from "./pages/dashboard/jobs/interview";
import JobPipelinePage from "./pages/dashboard/jobs/pipeline";
import MessagesPage from "./pages/dashboard/messages";
import NotificationsPage from "./pages/dashboard/notifications";
import SearchPage from "./pages/dashboard/search";
import SettingsPage from "./pages/dashboard/settings";
import TagsPage from "./pages/dashboard/tags";
import TeamPage from "./pages/dashboard/team";
import TeamMemberDetailPage from "./pages/dashboard/team/detail";
import EmailsPage from "./pages/dashboard/emails";
import HomePage from "./pages/home";
import JobsPage from "./pages/jobs";
import PublicJobDetailPage from "./pages/jobs/detail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:jobId" element={<PublicJobDetailPage />} />
          <Route path="apply/:jobId" element={<PublicApplyPage />} />
          <Route path="apply/success" element={<ApplySuccessPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register-admin" element={<RegisterAdminPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="magic-link" element={<MagicLinkPage />} />
        <Route path="magic-link/:token" element={<VerifyMagicLinkPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardMainPage />} />

          {/* Clients Routes */}
          <Route path="clients" element={<PermissionGuard permission="canManageClients"><ClientsPage /></PermissionGuard>} />
          <Route path="clients/:clientId" element={<PermissionGuard permission="canManageClients"><ClientDetailPage /></PermissionGuard>} />
          <Route
            path="clients/:clientId/jobs/:jobId"
            element={<PermissionGuard permission="canManageJobs"><JobDetailPage /></PermissionGuard>}
          />
          <Route
            path="clients/:clientId/jobs/:jobId/candidates/:candidateId"
            element={<CandidateRouteRedirect />}
          />
          <Route
            path="clients/:clientId/jobs/:jobId/candidates/:candidateId/interviews"
            element={<PermissionGuard permission="canManageCandidates"><InterviewPage /></PermissionGuard>}
          />
          <Route
            path="clients/:clientId/jobs/:jobId/candidates/:candidateId/communication"
            element={<PermissionGuard permission="canSendEmails"><JobCandidateCommunicationPage /></PermissionGuard>}
          />

          {/* Jobs Routes */}
          <Route path="jobs" element={<PermissionGuard permission="canManageJobs"><DashboardJobsPage /></PermissionGuard>} />
          <Route path="jobs/:jobId" element={<PermissionGuard permission="canManageJobs"><JobDetailPage /></PermissionGuard>} />
          <Route
            path="jobs/:jobId/candidates/:candidateId"
            element={<CandidateRouteRedirect />}
          />
          <Route
            path="jobs/:jobId/candidates/:candidateId/interviews"
            element={<PermissionGuard permission="canManageCandidates"><InterviewPage /></PermissionGuard>}
          />
          <Route
            path="jobs/:jobId/candidates/:candidateId/communication"
            element={<PermissionGuard permission="canSendEmails"><JobCandidateCommunicationPage /></PermissionGuard>}
          />
          <Route path="jobs/pipeline/:jobId" element={<PermissionGuard permission="canManageJobs"><JobPipelinePage /></PermissionGuard>} />

          {/* Candidates Routes */}
          <Route path="candidates" element={<PermissionGuard permission="canManageCandidates"><CandidatesPage /></PermissionGuard>} />
          <Route path="candidates/quick-import" element={<PermissionGuard permission="canManageCandidates"><QuickImportPage /></PermissionGuard>} />
          <Route
            path="candidates/:candidateId"
            element={<PermissionGuard permission="canManageCandidates"><CandidateDetailsPage /></PermissionGuard>}
          />
          <Route
            path="candidates/:candidateId/interviews"
            element={<PermissionGuard permission="canManageCandidates"><InterviewPage /></PermissionGuard>}
          />
          <Route
            path="candidates/:candidateId/communication"
            element={<PermissionGuard permission="canSendEmails"><JobCandidateCommunicationPage /></PermissionGuard>}
          />

          {/* Other Routes */}
          <Route path="applications" element={<PermissionGuard permission="canReviewApplications"><ApplicationsPage /></PermissionGuard>} />
          <Route path="emails" element={<PermissionGuard permission="canSendEmails"><EmailsPage /></PermissionGuard>} />
          <Route path="team" element={<PermissionGuard permission="canManageTeam"><TeamPage /></PermissionGuard>} />
          <Route path="team/:memberId" element={<PermissionGuard permission="canManageTeam"><TeamMemberDetailPage /></PermissionGuard>} />
          <Route path="tags" element={<PermissionGuard permission="canManageCandidates"><TagsPage /></PermissionGuard>} />
          <Route path="categories" element={<PermissionGuard permission="canManageJobs"><CategoriesPage /></PermissionGuard>} />
          <Route path="account" element={<AccountPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<RoleGuard allowedRoles={["admin"]}><SettingsPage /></RoleGuard>} />
          <Route path="help" element={<HelpPage />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
