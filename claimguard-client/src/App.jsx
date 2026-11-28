import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ClaimsListPage from './pages/claims/ClaimsListPage';
import ClaimDetailPage from './pages/claims/ClaimDetailPage';
import RuleConfigurationPage from './pages/admin/RuleConfigurationPage';
import NewClaimPage from './pages/billing/NewClaimPage';
import BillingQueuePage from './pages/billing/BillingQueuePage';
import MyClaimsPage from './pages/doctor/MyClaimsPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import InsurerManagementPage from './pages/admin/InsurerManagementPage';
import CodeCatalogPage from './pages/admin/CodeCatalogPage';
import DashboardPage from './pages/admin/DashboardPage';
import PatientManagementPage from './pages/patients/PatientManagementPage';
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
            element={<DashboardPage />}
          />
          <Route path="patients" element={<PatientManagementPage />} />
          <Route path="insurers" element={<InsurerManagementPage />} />
          <Route path="codes" element={<CodeCatalogPage />} />
          <Route path="claims" element={<ClaimsListPage />} />
          <Route path="claims/:id" element={<ClaimDetailPage />} />
          <Route
            path="staff"
            element={<StaffManagementPage />}
          />
          <Route path="rules" element={<RuleConfigurationPage />} />
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
          <Route path="my-claims" element={<MyClaimsPage />} />
          <Route path="patients" element={<PatientManagementPage />} />
          <Route path="claims" element={<ClaimsListPage />} />
          <Route path="claims/:id" element={<ClaimDetailPage />} />
        </Route>
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<BillingQueuePage />} />
          <Route path="new-claim" element={<NewClaimPage />} />
          <Route path="claims" element={<ClaimsListPage />} />
          <Route path="claims/:id" element={<ClaimDetailPage />} />
          <Route path="rules" element={<RuleConfigurationPage readOnly />} />
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
