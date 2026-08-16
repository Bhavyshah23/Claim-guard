import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { mapAuthError } from '../utils/authErrors';

const ROLE_HOMES = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  BILLING_STAFF: '/billing',
};

const FIELD_NAMES = ['username', 'password'];

export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROLE_HOMES[user?.role] ?? '/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const updateField = (setter) => (field, value) => {
    setter(value);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!username.trim()) nextErrors.username = 'Enter your username';
    if (!password) nextErrors.password = 'Enter your password';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      const authenticated = await login(username.trim(), password);
      navigate(ROLE_HOMES[authenticated.role] ?? '/login', { replace: true });
    } catch (error) {
      const { fieldErrors, formError: message } = mapAuthError(error, FIELD_NAMES);
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Welcome back
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        Sign in to access your clinic workspace.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <TextField
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => updateField(setUsername)('username', event.target.value)}
            error={Boolean(errors.username)}
            helperText={errors.username || ' '}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => updateField(setPassword)('password', event.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password || ' '}
          />
        </Stack>

        {formError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Sign In'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
        New clinic?{' '}
        <RouterLink
          to="/register"
          style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}
        >
          Set up your account
        </RouterLink>
      </Typography>
    </AuthLayout>
  );
}
