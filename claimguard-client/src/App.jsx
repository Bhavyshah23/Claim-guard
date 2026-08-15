import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import AuthPlaceholder from './pages/AuthPlaceholder';
import PlaceholderPage from './pages/PlaceholderPage';
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

        <Route path="/login" element={<AuthPlaceholder mode="login" />} />
        <Route path="/register" element={<AuthPlaceholder mode="register" />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <PlaceholderPage
                title="Admin console"
                description="Clinic, staff and reference-data management will live here."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/*"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <PlaceholderPage
                title="Doctor workspace"
                description="Review and confirm clinical details for claims awaiting your sign-off."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/*"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
              <PlaceholderPage
                title="Billing workspace"
                description="Draft, screen and submit insurance claims."
              />
            </ProtectedRoute>
          }
        />

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
