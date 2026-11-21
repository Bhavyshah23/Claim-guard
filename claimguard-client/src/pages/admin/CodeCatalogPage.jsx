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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import LocalHospitalOutlined from '@mui/icons-material/LocalHospitalOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PageHeader from '../../components/layout/PageHeader';
import {
  createDiagnosisCode,
  createProcedureCode,
  deleteDiagnosisCode,
  deleteProcedureCode,
  fetchDiagnosisCodes,
  fetchProcedureCodes,
} from '../../api/codesApi';
import { extractRequestError } from '../../utils/requestErrors';

const EMPTY_FORM = { code: '', description: '', category: '' };

const TABS = [
  { value: 'diagnosis', label: 'Diagnosis codes' },
  { value: 'procedure', label: 'Procedure codes' },
];

export default function CodeCatalogPage() {
  const [tab, setTab] = useState('diagnosis');
  const [diagnosisCodes, setDiagnosisCodes] = useState([]);
  const [procedureCodes, setProcedureCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  useEffect(() => {
    let active = true;
    Promise.all([fetchDiagnosisCodes(), fetchProcedureCodes()])
      .then(([diagnoses, procedures]) => {
        if (!active) return;
        setDiagnosisCodes(diagnoses);
        setProcedureCodes(procedures);
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

  const source = tab === 'diagnosis' ? diagnosisCodes : procedureCodes;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return source;
    return source.filter(
      (item) =>
        item.code?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
  }, [source, search]);

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.description.trim()) {
      setFormError('Code and description are required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      code: form.code.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
    };
    try {
      if (tab === 'diagnosis') {
        const created = await createDiagnosisCode(payload);
        setDiagnosisCodes((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
      } else {
        const created = await createProcedureCode(payload);
        setProcedureCodes((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
      }
      showSnackbar('Code added');
      setDrawerOpen(false);
    } catch (error) {
      setFormError(extractRequestError(error, 'Could not add code'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (tab === 'diagnosis') {
        await deleteDiagnosisCode(deleteTarget.id);
        setDiagnosisCodes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      } else {
        await deleteProcedureCode(deleteTarget.id);
        setProcedureCodes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      }
      showSnackbar('Code removed');
      setDeleteTarget(null);
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Could not delete code'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Codes"
        subtitle="Diagnosis and procedure codes used when billing staff build a claim"
        action={
          <Button
            variant="contained"
            startIcon={<AddCircleOutlined />}
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormError(null);
              setDrawerOpen(true);
            }}
          >
            Add Code
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_event, value) => {
          setTab(value);
          setSearch('');
        }}
        sx={{ mb: 2.5 }}
      >
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Couldn't load codes.
        </Alert>
      )}

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Skeleton variant="rounded" height={220} />
        </Card>
      ) : !loadError && source.length === 0 ? (
        <Card sx={{ p: { xs: 5, sm: 7 }, textAlign: 'center' }}>
          <LocalHospitalOutlined sx={{ fontSize: 36, color: '#0F766E' }} />
          <Typography sx={{ mt: 2, fontSize: 17, fontWeight: 700 }}>No codes in this list</Typography>
          <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 460, mx: 'auto' }}>
            Add a code, or start from a fresh database to load the demo ICD and CPT subset.
          </Typography>
        </Card>
      ) : !loadError ? (
        <Stack spacing={2.5}>
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by code, description, or category"
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
                    <TableCell sx={{ pl: 3 }}>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ pl: 3, fontWeight: 700 }}>{item.code}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.category || '—'}</TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <IconButton
                          aria-label={`Delete ${item.code}`}
                          onClick={() => setDeleteTarget(item)}
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
              Add {tab === 'diagnosis' ? 'diagnosis' : 'procedure'} code
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close">
              <CloseOutlined />
            </IconButton>
          </Box>
          <Stack spacing={2.5} sx={{ px: 3, flex: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Code"
              required
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder={tab === 'diagnosis' ? 'J20.9' : '99213'}
            />
            <TextField
              label="Description"
              required
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <TextField
              label="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            />
          </Stack>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setDrawerOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add Code'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove code?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `Remove ${deleteTarget.code}? Codes already used on a claim cannot be deleted.`
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
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
