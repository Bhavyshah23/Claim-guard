import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../../components/layout/PageHeader';
import { createStaff, fetchStaff } from '../../api/staffApi';
import { mapAuthError } from '../../utils/authErrors';
import { formatDate } from '../../utils/dates';

const ROLE_META = {
  ADMIN: { label: 'Admin', text: '#0F766E', bg: 'rgba(15, 118, 110, 0.14)' },
  DOCTOR: { label: 'Doctor', text: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  BILLING_STAFF: { label: 'Billing Staff', text: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' },
};

const roleMeta = (role) =>
  ROLE_META[role] ?? { label: role, text: '#64748B', bg: '#F1F5F9' };

const FIELD_NAMES = ['username', 'email', 'password'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = { username: '', email: '', password: '' };

function validate(values) {
  const errors = {};
  const username = values.username.trim();
  if (!username) {
    errors.username = 'Username is required';
  } else if (username.length < 3 || username.length > 50) {
    errors.username = 'Username must be between 3 and 50 characters';
  }
  const email = values.email.trim();
  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Email must be valid';
  }
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
}

const ROLE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'DOCTOR', label: 'Doctors' },
  { value: 'BILLING_STAFF', label: 'Billing Staff' },
];

function TableSkeleton() {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell sx={{ pl: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Skeleton variant="circular" width={36} height={36} />
                <Skeleton width={120} height={20} />
              </Stack>
            </TableCell>
            <TableCell>
              <Skeleton width={180} height={20} />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={90} height={24} />
            </TableCell>
            <TableCell sx={{ pr: 3 }}>
              <Skeleton width={90} height={20} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StaffTableHead() {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ pl: 3 }}>Member</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Role</TableCell>
        <TableCell sx={{ pr: 3 }}>Date Added</TableCell>
      </TableRow>
    </TableHead>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <Card
      sx={{
        p: { xs: 5, sm: 7 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(100, 116, 139, 0.1)',
          color: '#64748B',
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ mt: 2.5, fontSize: 17, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 400 }}>
        {subtitle}
      </Typography>
    </Card>
  );
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [role, setRole] = useState('DOCTOR');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  useEffect(() => {
    let active = true;
    fetchStaff()
      .then((data) => {
        if (active) setStaff(data);
      })
      .catch((error) => {
        if (active) setLoadError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const result = { total: staff.length, ADMIN: 0, DOCTOR: 0, BILLING_STAFF: 0 };
    staff.forEach((member) => {
      if (Object.prototype.hasOwnProperty.call(result, member.role)) {
        result[member.role] += 1;
      }
    });
    return result;
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      if (roleFilter !== 'all' && member.role !== roleFilter) return false;
      if (!query) return true;
      return (
        member.username.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    });
  }, [staff, search, roleFilter]);

  const validationErrors = useMemo(() => validate(form), [form]);
  const canSubmit = !submitting && Object.keys(validationErrors).length === 0;
  const dirty = form.username !== '' || form.email !== '' || form.password !== '' || role !== 'DOCTOR';

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    fetchStaff()
      .then(setStaff)
      .catch(setLoadError)
      .finally(() => setLoading(false));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setForm(EMPTY_FORM);
    setRole('DOCTOR');
    setShowPassword(false);
    setTouched({});
    setFieldErrors({});
    setFormError(null);
    setSubmitted(false);
    setDiscardOpen(false);
  };

  const openDrawer = () => {
    setForm(EMPTY_FORM);
    setRole('DOCTOR');
    setShowPassword(false);
    setTouched({});
    setFieldErrors({});
    setFormError(null);
    setSubmitted(false);
    setDrawerOpen(true);
  };

  const requestClose = () => {
    if (submitting) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    closeDrawer();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const fieldError = (field) => {
    if (touched[field] || submitted) {
      return fieldErrors[field] ?? validationErrors[field];
    }
    return undefined;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const errors = validate(form);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const created = await createStaff({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      });
      setStaff((prev) => [created, ...prev]);
      closeDrawer();
      showSnackbar(`${created.username} added as ${roleMeta(created.role).label}`, 'success');
    } catch (error) {
      const mapped = mapAuthError(error, FIELD_NAMES);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff Management"
        subtitle="Manage your clinic's team"
        action={
          <Button variant="contained" startIcon={<AddCircleOutlined />} onClick={openDrawer}>
            Add Staff Member
          </Button>
        }
      />

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retryLoad}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          Couldn't load your staff list.
        </Alert>
      )}

      {!loading && !loadError && (
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            {counts.total} team member{counts.total === 1 ? '' : 's'}
          </Typography>
          {Object.keys(ROLE_META).map(
            (key) =>
              counts[key] > 0 && (
                <Chip
                  key={key}
                  size="small"
                  label={`${counts[key]} ${roleMeta(key).label}${counts[key] === 1 ? '' : 's'}`}
                  sx={{ bgcolor: roleMeta(key).bg, color: roleMeta(key).text, fontWeight: 700 }}
                />
              )
          )}
        </Stack>
      )}

      {!loading && !loadError && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={2}
          sx={{ mb: 2 }}
        >
          <TextField
            placeholder="Search by username or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 320 } }}
          />
          <ToggleButtonGroup
            value={roleFilter}
            exclusive
            onChange={(_event, value) => value && setRoleFilter(value)}
            size="small"
            aria-label="Filter by role"
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontSize: 12.5,
                py: 0.5,
                px: 1.5,
                fontWeight: 600,
              },
            }}
          >
            {ROLE_FILTERS.map((filter) => (
              <ToggleButton key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      )}

      {loading ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <StaffTableHead />
              <TableSkeleton />
            </Table>
          </TableContainer>
        </Card>
      ) : !loadError && staff.length === 0 ? (
        <EmptyState
          icon={<GroupOutlined sx={{ fontSize: 30 }} />}
          title="No team members yet"
          subtitle="Add your first staff member to start building your clinic team."
        />
      ) : !loadError && filteredStaff.length === 0 ? (
        <EmptyState
          icon={<SearchOffOutlined sx={{ fontSize: 30 }} />}
          title="No staff members match your search"
          subtitle="Try adjusting your search term or role filter."
        />
      ) : !loadError ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <StaffTableHead />
              <TableBody>
                {filteredStaff.map((member) => {
                  const meta = roleMeta(member.role);
                  return (
                    <TableRow key={member.id} hover>
                      <TableCell sx={{ pl: 3, py: 1.25 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: meta.bg,
                              color: meta.text,
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {member.username[0]?.toUpperCase() ?? '?'}
                          </Avatar>
                          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                            {member.username}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, color: 'text.secondary', fontSize: 13.5 }}>
                        {member.email}
                      </TableCell>
                      <TableCell sx={{ py: 1.25 }}>
                        <Chip
                          size="small"
                          label={meta.label}
                          sx={{ bgcolor: meta.bg, color: meta.text, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.25, color: 'text.secondary', fontSize: 13.5 }}>
                        {formatDate(member.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={requestClose}
        slotProps={{
          paper: { sx: { width: { xs: '100%', sm: 440 }, bgcolor: 'background.paper' } },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Add Staff Member</Typography>
            <IconButton onClick={requestClose} aria-label="Close" disabled={submitting}>
              <CloseOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: 3, py: 3, overflowY: 'auto', flex: 1 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {formError}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <TextField
                label="Username"
                autoFocus
                value={form.username}
                onChange={updateField('username')}
                error={Boolean(fieldError('username'))}
                helperText={fieldError('username') || ' '}
                autoComplete="off"
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={updateField('email')}
                error={Boolean(fieldError('email'))}
                helperText={fieldError('email') || ' '}
                autoComplete="email"
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={updateField('password')}
                error={Boolean(fieldError('password'))}
                helperText={fieldError('password') || ' '}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOffOutlined sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityOutlined sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Role</Typography>
                <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={(_event, value) => value && setRole(value)}
                  fullWidth
                  aria-label="Role"
                  sx={{
                    '& .MuiToggleButton-root': {
                      textTransform: 'none',
                      fontSize: 13.5,
                      py: 0.75,
                      fontWeight: 600,
                    },
                  }}
                >
                  <ToggleButton value="DOCTOR">Doctor</ToggleButton>
                  <ToggleButton value="BILLING_STAFF">Billing Staff</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              px: 3,
              py: 2.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
            }}
          >
            <Button variant="outlined" onClick={requestClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit}
              startIcon={submitting ? undefined : <AddCircleOutlined />}
              sx={{ minWidth: 160 }}
            >
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Add Staff Member'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            You have unsaved changes in the form. They'll be lost if you close the drawer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDiscardOpen(false)}>
            Keep editing
          </Button>
          <Button
            variant="contained"
            onClick={closeDrawer}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.tone} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
