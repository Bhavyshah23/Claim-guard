import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceholderPage from './pages/PlaceholderPage';
import WorkspacePlaceholder from './pages/workspace/WorkspacePlaceholder';
import theme from './theme';

const ROLE_HOMES = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  BILLING_STAFF: '/billing',
};

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROLE_HOMES[user?.role] ?? '/login'} replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <WorkspacePlaceholder
                title="Dashboard"
                subtitle="Overview of clinic claim activity."
                description="Your clinic's claim performance dashboard will live here."
              />
            }
          />
          <Route
            path="claims"
            element={
              <WorkspacePlaceholder
                title="Claims"
                subtitle="Review, screen and manage all clinic claims."
                description="Clinic-wide claim management tools will live here."
              />
            }
          />
          <Route
            path="staff"
            element={
              <WorkspacePlaceholder
                title="Staff Management"
                subtitle="Manage clinic staff and their roles."
                description="Staff and role management tools will live here."
              />
            }
          />
          <Route
            path="rules"
            element={
              <WorkspacePlaceholder
                title="Rule Configuration"
                subtitle="Configure claim screening rules."
                description="Rule configuration tools will live here."
              />
            }
          />
        </Route>
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="my-claims" replace />} />
          <Route
            path="my-claims"
            element={
              <WorkspacePlaceholder
                title="My Claims"
                subtitle="Claims awaiting your clinical sign-off."
                description="Claims assigned to you will appear here."
              />
            }
          />
          <Route
            path="claims"
            element={
              <WorkspacePlaceholder
                title="All Claims"
                subtitle="All claims across the clinic."
                description="Every clinic claim will be listed here."
              />
            }
          />
        </Route>
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="new-claim" replace />} />
          <Route
            path="new-claim"
            element={
              <WorkspacePlaceholder
                title="New Claim"
                subtitle="Draft and submit a new insurance claim."
                description="The claim intake form will live here."
              />
            }
          />
          <Route
            path="claims"
            element={
              <WorkspacePlaceholder
                title="All Claims"
                subtitle="Manage and screen all clinic claims."
                description="Billing and screening workflows will live here."
              />
            }
          />
        </Route>

        <Route
          path="/unauthorized"
          element={
            <PlaceholderPage
              badgeLabel="403"
              badgeTone="high"
              title="Not authorized"
              description="Your account does not have permission to access this area. Contact your clinic administrator if you believe this is a mistake."
            />
          }
        />
        <Route
          path="*"
          element={
            <PlaceholderPage
              badgeLabel="404"
              title="Page not found"
              description="The page you are looking for does not exist or has been moved."
            />
          }
        />
      </Routes>
    </ThemeProvider>
  );
}
