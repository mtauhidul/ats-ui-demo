import * as React from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import DashboardLayout from "./components/dashboard-layout";
import Layout from "./components/layout";
import { CandidateRouteRedirect } from "./components/CandidateRouteRedirect";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PermissionGuard } from "./components/auth/PermissionGuard";
import { RoleGuard } from "./components/auth/RoleGuard";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoaderFullPage } from "./components/ui/loader";
import { setNavigate } from "./lib/navigation";

// Lazy-loaded page components — each page chunk is loaded on demand
const PublicApplyPage = React.lazy(() => import("./pages/apply"));
const ApplySuccessPage = React.lazy(() => import("./pages/apply/success"));
const ForgotPasswordPage = React.lazy(() => import("./pages/auth/forgot-password"));
const LoginPage = React.lazy(() => import("./pages/auth/login"));
const MagicLinkPage = React.lazy(() => import("./pages/auth/magic-link"));
const RegisterAdminPage = React.lazy(() => import("./pages/auth/register-admin"));
const ResetPasswordPage = React.lazy(() => import("./pages/auth/reset-password"));
const VerifyEmailPage = React.lazy(() => import("./pages/auth/verify-email"));
const VerifyMagicLinkPage = React.lazy(() => import("./pages/auth/verify-magic-link"));
const AccountPage = React.lazy(() => import("./pages/dashboard/account"));
const ApplicationsPage = React.lazy(() => import("./pages/dashboard/applications"));
const CandidatesPage = React.lazy(() => import("./pages/dashboard/candidates"));
const CandidateDetailsPage = React.lazy(() => import("./pages/dashboard/candidates/details"));
const QuickImportPage = React.lazy(() => import("./pages/dashboard/candidates/quick-import"));
const CategoriesPage = React.lazy(() => import("./pages/dashboard/categories"));
const ClientsPage = React.lazy(() => import("./pages/dashboard/clients"));
const ClientDetailPage = React.lazy(() => import("./pages/dashboard/clients/detail"));
const DashboardMainPage = React.lazy(() => import("./pages/dashboard/dashboard-main"));
const HelpPage = React.lazy(() => import("./pages/dashboard/help"));
const DashboardJobsPage = React.lazy(() => import("./pages/dashboard/jobs"));
const JobCandidateCommunicationPage = React.lazy(() => import("./pages/dashboard/jobs/candidate-communication"));
const JobCandidateDetailPage = React.lazy(() => import("./pages/dashboard/jobs/candidate-detail"));
const JobDetailPage = React.lazy(() => import("./pages/dashboard/jobs/detail"));
const InterviewPage = React.lazy(() => import("./pages/dashboard/jobs/interview"));
const JobPipelinePage = React.lazy(() => import("./pages/dashboard/jobs/pipeline"));
const MessagesPage = React.lazy(() => import("./pages/dashboard/messages"));
const NotificationsPage = React.lazy(() => import("./pages/dashboard/notifications"));
const SearchPage = React.lazy(() => import("./pages/dashboard/search"));
const SettingsPage = React.lazy(() => import("./pages/dashboard/settings"));
const TagsPage = React.lazy(() => import("./pages/dashboard/tags"));
const TeamPage = React.lazy(() => import("./pages/dashboard/team"));
const TeamMemberDetailPage = React.lazy(() => import("./pages/dashboard/team/detail"));
const EmailsPage = React.lazy(() => import("./pages/dashboard/emails"));
const HomePage = React.lazy(() => import("./pages/home"));
const JobsPage = React.lazy(() => import("./pages/jobs"));
const PublicJobDetailPage = React.lazy(() => import("./pages/jobs/detail"));

/** Registers the React Router navigate function into the navigation singleton */
function NavigationSetup() {
  const navigate = useNavigate();
  React.useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <NavigationSetup />
      <ErrorBoundary>
        <React.Suspense fallback={<LoaderFullPage />}>
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
        </React.Suspense>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
