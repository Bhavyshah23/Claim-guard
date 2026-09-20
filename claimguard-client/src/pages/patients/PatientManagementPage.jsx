import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
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
  Typography,
} from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PageHeader from '../../components/layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { createPatient, deletePatient, fetchPatients, updatePatient } from '../../api/patientsApi';
import { extractRequestError } from '../../utils/requestErrors';
import { formatDate } from '../../utils/dates';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  contactInfo: '',
};

const GENDER_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

function validate(values) {
  const errors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (!firstName) {
    errors.firstName = 'First name is required';
  } else if (firstName.length > 100) {
    errors.firstName = 'First name must be 100 characters or fewer';
  }

  if (!lastName) {
    errors.lastName = 'Last name is required';
  } else if (lastName.length > 100) {
    errors.lastName = 'Last name must be 100 characters or fewer';
  }

  if (values.contactInfo.trim().length > 150) {
    errors.contactInfo = 'Contact info must be 150 characters or fewer';
  }

  return errors;
}

function patientName(patient) {
  return `${patient.firstName} ${patient.lastName}`;
}

function patientInitials(patient) {
  const first = patient.firstName?.[0] ?? '';
  const last = patient.lastName?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

function toPayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dateOfBirth: values.dateOfBirth || null,
    gender: values.gender || null,
    contactInfo: values.contactInfo.trim() || null,
  };
}

function TableSkeleton() {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell sx={{ pl: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Skeleton variant="circular" width={36} height={36} />
                <Skeleton width={140} height={20} />
              </Stack>
            </TableCell>
            <TableCell>
              <Skeleton width={90} height={20} />
            </TableCell>
            <TableCell>
              <Skeleton width={70} height={20} />
            </TableCell>
            <TableCell>
              <Skeleton width={120} height={20} />
            </TableCell>
            <TableCell sx={{ pr: 3 }}>
              <Skeleton width={80} height={32} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({ title, subtitle, actionLabel, onAction }) {
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
          bgcolor: 'rgba(15, 118, 110, 0.1)',
          color: '#0F766E',
        }}
      >
        <PersonOutlineOutlined sx={{ fontSize: 30 }} />
      </Box>
      <Typography sx={{ mt: 2.5, fontSize: 17, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 420 }}>
        {subtitle}
      </Typography>
      {onAction && (
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={onAction}
          sx={{ mt: 3 }}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

export default function PatientManagementPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'DOCTOR';
  const canDelete = user?.role === 'ADMIN';

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  const loadPatients = () =>
    fetchPatients()
      .then(setPatients)
      .catch(setLoadError)
      .finally(() => setLoading(false));

  useEffect(() => {
    let active = true;
    fetchPatients()
      .then((data) => {
        if (active) setPatients(data);
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

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => {
      const fullName = patientName(patient).toLowerCase();
      const contact = (patient.contactInfo ?? '').toLowerCase();
      return fullName.includes(query) || contact.includes(query);
    });
  }, [patients, search]);

  const validationErrors = useMemo(() => validate(form), [form]);
  const canSubmit = !submitting && Object.keys(validationErrors).length === 0;

  const initialForm = editingPatient
    ? {
        firstName: editingPatient.firstName ?? '',
        lastName: editingPatient.lastName ?? '',
        dateOfBirth: editingPatient.dateOfBirth ?? '',
        gender: editingPatient.gender ?? '',
        contactInfo: editingPatient.contactInfo ?? '',
      }
    : EMPTY_FORM;

  const dirty = Object.keys(initialForm).some((key) => form[key] !== initialForm[key]);

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    loadPatients();
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingPatient(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setFormError(null);
    setDiscardOpen(false);
  };

  const openCreateDrawer = () => {
    setEditingPatient(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (patient) => {
    setEditingPatient(patient);
    setForm({
      firstName: patient.firstName ?? '',
      lastName: patient.lastName ?? '',
      dateOfBirth: patient.dateOfBirth ?? '',
      gender: patient.gender ?? '',
      contactInfo: patient.contactInfo ?? '',
    });
    setTouched({});
    setFormError(null);
    setDrawerOpen(true);
  };

  const requestCloseDrawer = () => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    closeDrawer();
  };

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      contactInfo: true,
    });

    const errors = validate(form);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    const payload = toPayload(form);

    try {
      if (editingPatient) {
        const updated = await updatePatient(editingPatient.id, payload);
        setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showSnackbar('Patient updated successfully');
      } else {
        const created = await createPatient(payload);
        setPatients((prev) => [...prev, created].sort((a, b) => patientName(a).localeCompare(patientName(b))));
        showSnackbar('Patient added successfully');
      }
      closeDrawer();
    } catch (error) {
      setFormError(extractRequestError(error, 'Could not save patient — please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatient(deleteTarget.id);
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showSnackbar('Patient removed');
      setDeleteTarget(null);
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Could not delete patient'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field) => (touched[field] ? validationErrors[field] : undefined);

  const subtitle =
    user?.role === 'DOCTOR'
      ? 'View and register patients for your clinic'
      : 'Manage patient records for your clinic';

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={subtitle}
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddCircleOutlined />} onClick={openCreateDrawer}>
              Add Patient
            </Button>
          ) : undefined
        }
      />

      {loading && (
        <Card sx={{ overflow: 'hidden' }}>
          <TableSkeleton />
        </Card>
      )}

      {!loading && loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retryLoad}>
              Retry
            </Button>
          }
        >
          Couldn't load patients.
        </Alert>
      )}

      {!loading && !loadError && patients.length === 0 && (
        <EmptyState
          title="No patients yet"
          subtitle={
            canManage
              ? 'Add your first patient so billing staff can create claims for them.'
              : 'Patients will appear here once your admin or doctor adds them.'
          }
          actionLabel={canManage ? 'Add Patient' : undefined}
          onAction={canManage ? openCreateDrawer : undefined}
        />
      )}

      {!loading && !loadError && patients.length > 0 && (
        <Stack spacing={2.5}>
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or contact info"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Card>

          {filteredPatients.length === 0 ? (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <SearchOffOutlined sx={{ fontSize: 44, color: '#CBD5E1' }} />
              <Typography sx={{ mt: 2, fontSize: 16, fontWeight: 600 }}>
                No patients match your search
              </Typography>
              <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 14 }}>
                Try a different name or clear the search box.
              </Typography>
            </Card>
          ) : (
            <Card sx={{ overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 3 }}>Patient</TableCell>
                      <TableCell>Date of Birth</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Contact</TableCell>
                      {canManage && <TableCell sx={{ pr: 3, width: 120 }}>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} hover>
                        <TableCell sx={{ pl: 3, py: 1.5 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: 'rgba(15, 118, 110, 0.12)',
                                color: '#0F766E',
                                fontSize: 14,
                                fontWeight: 700,
                              }}
                            >
                              {patientInitials(patient)}
                            </Avatar>
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                              {patientName(patient)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: 13.5 }}>
                          {formatDate(patient.dateOfBirth)}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: 13.5 }}>
                          {patient.gender || '—'}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: 13.5 }}>
                          {patient.contactInfo || '—'}
                        </TableCell>
                        {canManage && (
                          <TableCell sx={{ pr: 3, py: 1.5 }}>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton
                                size="small"
                                aria-label={`Edit ${patientName(patient)}`}
                                onClick={() => openEditDrawer(patient)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <EditOutlined sx={{ fontSize: 18 }} />
                              </IconButton>
                              {canDelete && (
                                <IconButton
                                  size="small"
                                  aria-label={`Delete ${patientName(patient)}`}
                                  onClick={() => setDeleteTarget(patient)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteOutlineOutlined sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {filteredPatients.length} of {patients.length} patient{patients.length === 1 ? '' : 's'}
          </Typography>
        </Stack>
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={requestCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 0 } }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Box
            sx={{
              px: 3,
              py: 2.5,
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              {editingPatient ? 'Edit Patient' : 'Add Patient'}
            </Typography>
            <IconButton onClick={requestCloseDrawer} aria-label="Close">
              <CloseOutlined />
            </IconButton>
          </Box>

          <Stack spacing={2.5} sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="First name"
              required
              fullWidth
              value={form.firstName}
              onChange={handleFieldChange('firstName')}
              onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
              error={Boolean(fieldError('firstName'))}
              helperText={fieldError('firstName')}
            />

            <TextField
              label="Last name"
              required
              fullWidth
              value={form.lastName}
              onChange={handleFieldChange('lastName')}
              onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
              error={Boolean(fieldError('lastName'))}
              helperText={fieldError('lastName')}
            />

            <TextField
              label="Date of birth"
              type="date"
              fullWidth
              value={form.dateOfBirth}
              onChange={handleFieldChange('dateOfBirth')}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Gender"
              fullWidth
              value={form.gender}
              onChange={handleFieldChange('gender')}
            >
              {GENDER_OPTIONS.map((option) => (
                <MenuItem key={option.value || 'none'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Contact info"
              fullWidth
              placeholder="Phone or email"
              value={form.contactInfo}
              onChange={handleFieldChange('contactInfo')}
              onBlur={() => setTouched((prev) => ({ ...prev, contactInfo: true }))}
              error={Boolean(fieldError('contactInfo'))}
              helperText={fieldError('contactInfo')}
            />
          </Stack>

          <Box
            sx={{
              px: 3,
              py: 2.5,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: 1.5,
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="outlined" onClick={requestCloseDrawer} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!canSubmit}>
              {submitting ? 'Saving…' : editingPatient ? 'Save Changes' : 'Add Patient'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            You have unsaved patient details. Closing will lose your changes.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDiscardOpen(false)}>
            Keep editing
          </Button>
          <Button variant="contained" color="error" onClick={closeDrawer}>
            Discard
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Remove patient?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {deleteTarget
              ? `Remove ${patientName(deleteTarget)} from your clinic? This cannot be undone. Patients with existing claims cannot be deleted.`
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
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
