import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PageHeader from '../../components/layout/PageHeader';
import { createInsurer, deleteInsurer, fetchInsurers, updateInsurer } from '../../api/insurersApi';
import { extractRequestError } from '../../utils/requestErrors';

const EMPTY_FORM = { name: '', rulesNotes: '' };

export default function InsurerManagementPage() {
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  useEffect(() => {
    let active = true;
    fetchInsurers()
      .then((data) => {
        if (active) setInsurers(data);
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return insurers;
    return insurers.filter(
      (insurer) =>
        insurer.name?.toLowerCase().includes(query) ||
        insurer.rulesNotes?.toLowerCase().includes(query)
    );
  }, [insurers, search]);

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (insurer) => {
    setEditing(insurer);
    setForm({ name: insurer.name ?? '', rulesNotes: insurer.rulesNotes ?? '' });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Insurer name is required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      rulesNotes: form.rulesNotes.trim() || null,
    };
    try {
      if (editing) {
        const updated = await updateInsurer(editing.id, payload);
        setInsurers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showSnackbar('Insurer updated');
      } else {
        const created = await createInsurer(payload);
        setInsurers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        showSnackbar('Insurer added');
      }
      setDrawerOpen(false);
    } catch (error) {
      setFormError(extractRequestError(error, 'Could not save insurer'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInsurer(deleteTarget.id);
      setInsurers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      showSnackbar('Insurer removed');
      setDeleteTarget(null);
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Could not delete insurer'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Insurers"
        subtitle="Insurance companies your clinic bills against"
        action={
          <Button variant="contained" startIcon={<AddCircleOutlined />} onClick={openCreate}>
            Add Insurer
          </Button>
        }
      />

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Couldn't load insurers.
        </Alert>
      )}

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Skeleton variant="rounded" height={220} />
        </Card>
      ) : !loadError && insurers.length === 0 ? (
        <Card sx={{ p: { xs: 5, sm: 7 }, textAlign: 'center' }}>
          <AccountBalanceOutlined sx={{ fontSize: 36, color: '#0F766E' }} />
          <Typography sx={{ mt: 2, fontSize: 17, fontWeight: 700 }}>No insurers yet</Typography>
          <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14 }}>
            Add an insurer before billing staff can file a claim. Demo insurers appear only on a fresh database.
          </Typography>
        </Card>
      ) : !loadError ? (
        <Stack spacing={2.5}>
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search insurers"
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
          <Card sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 3 }}>Insurer</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((insurer) => (
                    <TableRow key={insurer.id} hover>
                      <TableCell sx={{ pl: 3, fontWeight: 600 }}>{insurer.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', maxWidth: 480 }}>
                        {insurer.rulesNotes || '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <IconButton aria-label={`Edit ${insurer.name}`} onClick={() => openEdit(insurer)}>
                          <EditOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${insurer.name}`}
                          onClick={() => setDeleteTarget(insurer)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteOutlineOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      ) : null}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !submitting && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              {editing ? 'Edit Insurer' : 'Add Insurer'}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close">
              <CloseOutlined />
            </IconButton>
          </Box>
          <Stack spacing={2.5} sx={{ px: 3, flex: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              label="Rules notes"
              multiline
              minRows={3}
              value={form.rulesNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, rulesNotes: event.target.value }))}
              helperText="Shown to billing staff when they select this insurer."
            />
          </Stack>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setDrawerOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Insurer'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove insurer?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `Remove ${deleteTarget.name}? Insurers that already have claims cannot be deleted.`
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.tone}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
