import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { useEffect, useState, lazy, Suspense } from "react";

// --- Core Components & Pages (Always loaded) ---
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/Toaster";
import { useAuthStore } from "./stores/authStore";
import { Spinner } from "./components/ui/Spinner";
import { MainLayout } from "./components/layout/MainLayout";

// --- Lazy loaded pages ---
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));
const ResendVerificationPage = lazy(
  () => import("./pages/auth/ResendVerificationPage")
);
const Verify2faPage = lazy(() => import("./pages/auth/Verify2faPage"));
const AuthCallbackPage = lazy(() =>
  import("./pages/auth/AuthCallbackPage").then((m) => ({
    default: m.AuthCallbackPage,
  }))
);
const AcceptInvitationPage = lazy(
  () => import("./pages/invitations/AcceptInvitationPage")
);
const InviteMembersPage = lazy(
  () => import("./pages/invitations/InviteMembersPage")
);
const InboxLayout = lazy(() =>
  import("./pages/inbox/InboxLayout").then((m) => ({ default: m.InboxLayout }))
);
const MessagePane = lazy(() =>
  import("./components/features/inbox/MessagePane").then((m) => ({
    default: m.MessagePane,
  }))
);
const SettingsLayout = lazy(() =>
  import("./pages/settings/SettingsLayout").then((m) => ({
    default: m.SettingsLayout,
  }))
);
const ProfilePage = lazy(() =>
  import("./pages/settings/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  }))
);
const SecurityPage = lazy(() =>
  import("./pages/settings/SecurityPage").then((m) => ({
    default: m.SecurityPage,
  }))
);
const ProjectSettingsPage = lazy(() =>
  import("./pages/settings/ProjectSettingsPage").then((m) => ({
    default: m.ProjectSettingsPage,
  }))
);
const ProjectsListPage = lazy(() =>
  import("./pages/settings/ProjectsListPage").then((m) => ({
    default: m.ProjectsListPage,
  }))
);

/**
 * PublicRoute HOC for better auth flow.
 * Automatically redirects authenticated users from public pages.
 * EXCEPTION: If accessing /register with invitation_token, allow through
 * so RegisterPage can redirect to /accept-invitation
 */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // Allow authenticated users to access /register if they have an invitation token
  // The RegisterPage will handle redirecting them to /accept-invitation
  if (
    isAuthenticated &&
    location.pathname === "/register" &&
    location.search.includes("invitation_token=")
  ) {
    console.log(
      "[PublicRoute] Allowing authenticated user to access register page with invitation token"
    );
    return children;
  }

  // Otherwise, redirect authenticated users to inbox
  return isAuthenticated ? <Navigate to="/inbox" replace /> : children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const verifySessionAndFetchUser = useAuthStore(
    (state) => state.verifySessionAndFetchUser
  );

  useEffect(() => {
    const verifySession = async () => {
      try {
        await verifySessionAndFetchUser();
      } catch (error) {
        // Error is handled in the store, which will log out the user
        // or handle 2FA redirection.
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [verifySessionAndFetchUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <Routes>
          {/* === Public Routes with Guard === */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/resend-verification"
            element={<ResendVerificationPage />}
          />
          <Route path="/verify-2fa" element={<Verify2faPage />} />

          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Accept invitation can be accessed by both authenticated and unauthenticated users */}
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

          {/* === Protected Routes === */}

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/inbox">
              <Route index element={<InboxLayout />} />

              <Route path="projects/:projectId" element={<InboxLayout />}>
                <Route
                  path="conversations/:conversationId"
                  element={<MessagePane />}
                />
              </Route>
            </Route>

            {/* Settings Area is now a child of MainLayout */}
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="projects" element={<ProjectsListPage />} />
            </Route>

            {/* Project-specific settings page */}
            <Route
              path="/projects/:projectId/settings"
              element={<ProjectSettingsPage />}
            />

            {/* Invitation management (protected) */}
            <Route
              path="/projects/:projectId/invite"
              element={<InviteMembersPage />}
            />
          </Route>
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Routes>
      </Suspense>

      <Toaster />
    </>
  );
}

export default App;
