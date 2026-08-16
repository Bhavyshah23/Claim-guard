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

const FIELD_NAMES = ['clinicName', 'username', 'email', 'password'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { isAuthenticated, user, register } = useAuth();
  const navigate = useNavigate();

  const [clinicName, setClinicName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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

  const validate = () => {
    const nextErrors = {};
    if (!clinicName.trim()) {
      nextErrors.clinicName = 'Enter your clinic name';
    }
    if (!username.trim()) {
      nextErrors.username = 'Enter a username';
    } else if (username.trim().length < 3 || username.trim().length > 50) {
      nextErrors.username = 'Username must be between 3 and 50 characters';
    }
    if (!email.trim()) {
      nextErrors.email = 'Enter an email address';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      nextErrors.password = 'Enter a password';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      const authenticated = await register(
        clinicName.trim(),
        username.trim(),
        password,
        email.trim()
      );
      navigate(ROLE_HOMES[authenticated.role] ?? '/login', { replace: true });
    } catch (error) {
      const { fieldErrors, formError: message } = mapAuthError(error, FIELD_NAMES, {
        messageOnField: true,
      });
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Set up your clinic
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        Create your clinic account to start pre-screening claims.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <TextField
            label="Clinic name"
            name="clinicName"
            autoFocus
            value={clinicName}
            onChange={(event) => updateField(setClinicName)('clinicName', event.target.value)}
            error={Boolean(errors.clinicName)}
            helperText={errors.clinicName || ' '}
          />
          <TextField
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => updateField(setUsername)('username', event.target.value)}
            error={Boolean(errors.username)}
            helperText={errors.username || ' '}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => updateField(setEmail)('email', event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email || ' '}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
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
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Create Account'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
        Already have an account?{' '}
        <RouterLink
          to="/login"
          style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}
        >
          Sign in
        </RouterLink>
      </Typography>
    </AuthLayout>
  );
}
