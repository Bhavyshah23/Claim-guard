import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import PageHeader from '../../components/layout/PageHeader';
import {
  createRule,
  deleteRule,
  fetchRules,
  toggleRuleActive,
  updateRule,
} from '../../api/rulesApi';
import { extractRequestError } from '../../utils/requestErrors';
import { SEVERITY_META } from '../../utils/severity';

const RULE_TYPES = [
  { value: 'MISSING_FIELD', label: 'Missing field' },
  { value: 'MISSING_MODIFIER', label: 'Missing modifier' },
  { value: 'INSURER_SPECIFIC', label: 'Insurer specific' },
  { value: 'CODE_MISMATCH', label: 'Code mismatch' },
];

const RULE_TYPE_LABELS = Object.fromEntries(
  RULE_TYPES.map((type) => [type.value, type.label])
);

const CONDITION_TEMPLATES = {
  MISSING_FIELD: '{\n  "field": "preAuthNumber"\n}',
  MISSING_MODIFIER: '{\n  "procedureCode": "99213",\n  "requiredModifier": "25"\n}',
  INSURER_SPECIFIC:
    '{\n  "insurerName": "BlueCross BlueShield",\n  "procedureCode": "73721",\n  "requiredModifier": "59"\n}',
  CODE_MISMATCH:
    '{\n  "diagnosisCode": "J20.9",\n  "incompatibleProcedureCode": "73721"\n}',
};

const CONDITION_HINTS = {
  MISSING_FIELD:
    'Use "field": "preAuthNumber" or "field": "doctorConfirmation". Add optional "insurerName" to limit the rule to one insurer.',
  MISSING_MODIFIER:
    'Requires "procedureCode" and "requiredModifier". The rule flags matching procedures without that modifier.',
  INSURER_SPECIFIC:
    'Requires "insurerName", "procedureCode" and "requiredModifier". Only applies when the claim insurer matches.',
  CODE_MISMATCH:
    'Requires "diagnosisCode" and "incompatibleProcedureCode". Flags claims carrying both codes together.',
};

const EMPTY_FORM = {
  ruleName: '',
  conditionType: 'MISSING_FIELD',
  conditionLogic: CONDITION_TEMPLATES.MISSING_FIELD,
  severity: 'MEDIUM',
  message: '',
  active: true,
};

const REQUIRED_FIELDS = {
  MISSING_FIELD: ['field'],
  MISSING_MODIFIER: ['procedureCode', 'requiredModifier'],
  INSURER_SPECIFIC: ['insurerName', 'procedureCode', 'requiredModifier'],
  CODE_MISMATCH: ['diagnosisCode', 'incompatibleProcedureCode'],
};

function validateCondition(type, conditionLogic) {
  let parsed;
  try {
    parsed = JSON.parse(conditionLogic);
  } catch {
    return 'Condition logic must be valid JSON.';
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return 'Condition logic must be a JSON object.';
  }
  const missing = REQUIRED_FIELDS[type].filter(
    (field) => typeof parsed[field] !== 'string' || !parsed[field].trim()
  );
  if (missing.length > 0) {
    return `Condition logic is missing: ${missing.join(', ')}.`;
  }
  if (
    type === 'MISSING_FIELD' &&
    !['preAuthNumber', 'doctorConfirmation'].includes(parsed.field)
  ) {
    return 'MISSING_FIELD requires "field" to be preAuthNumber or doctorConfirmation.';
  }
  return null;
}

function SeverityChip({ severity }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.LOW;
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{ bgcolor: meta.background, color: meta.color, fontWeight: 700 }}
    />
  );
}

function RulesSkeleton() {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell sx={{ pl: 3 }}>
              <Skeleton width={220} height={20} />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={130} height={24} />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={80} height={24} />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={44} height={24} />
            </TableCell>
            <TableCell sx={{ pr: 3 }}>
              <Skeleton width={70} height={20} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({ readOnly }) {
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
        <RuleOutlined sx={{ fontSize: 30 }} />
      </Box>
      <Typography sx={{ mt: 2.5, fontSize: 17, fontWeight: 700 }}>No rules configured</Typography>
      <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 420 }}>
        {readOnly
          ? 'Your clinic admin has not added screening rules yet.'
          : 'Add a denial rule to start screening claims before they are submitted to a payer.'}
      </Typography>
    </Card>
  );
}

export default function RuleConfigurationPage({ readOnly = false }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  useEffect(() => {
    let active = true;
    fetchRules()
      .then((data) => {
        if (active) setRules(data);
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

  const activeCount = useMemo(() => rules.filter((rule) => rule.active).length, [rules]);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  const conditionError = useMemo(
    () => validateCondition(form.conditionType, form.conditionLogic),
    [form.conditionType, form.conditionLogic]
  );
  const ruleNameError = form.ruleName.trim() ? null : 'Rule name is required';
  const messageError = form.message.trim() ? null : 'Message is required';
  const canSave = !submitting && !ruleNameError && !messageError && !conditionError;

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    fetchRules()
      .then(setRules)
      .catch(setLoadError)
      .finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditingRule(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setTouched({});
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (rule) => {
    const next = {
      ruleName: rule.ruleName,
      conditionType: rule.conditionType,
      conditionLogic: rule.conditionLogic,
      severity: rule.severity,
      message: rule.message,
      active: Boolean(rule.active),
    };
    setEditingRule(rule);
    setForm(next);
    setInitialForm(next);
    setTouched({});
    setFormError(null);
    setDrawerOpen(true);
  };

  const requestClose = () => {
    if (submitting) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setDrawerOpen(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDiscardOpen(false);
    setEditingRule(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setTouched({});
    setFormError(null);
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormError(null);
  };

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    setForm((prev) => ({
      ...prev,
      conditionType: nextType,
      conditionLogic:
        !prev.conditionLogic.trim() || prev.conditionLogic === CONDITION_TEMPLATES[prev.conditionType]
          ? CONDITION_TEMPLATES[nextType]
          : prev.conditionLogic,
    }));
    setFormError(null);
  };

  const handleSave = async () => {
    setTouched({ ruleName: true, message: true, conditionLogic: true });
    if (!canSave) return;

    setSubmitting(true);
    setFormError(null);
    const payload = {
      ruleName: form.ruleName.trim(),
      conditionType: form.conditionType,
      conditionLogic: JSON.stringify(JSON.parse(form.conditionLogic)),
      severity: form.severity,
      message: form.message.trim(),
      active: form.active,
    };

    try {
      if (editingRule) {
        const updated = await updateRule(editingRule.id, payload);
        setRules((prev) => prev.map((rule) => (rule.id === updated.id ? updated : rule)));
        showSnackbar('Rule updated', 'success');
      } else {
        const created = await createRule(payload);
        setRules((prev) => [created, ...prev]);
        showSnackbar('Rule created', 'success');
      }
      closeDrawer();
    } catch (error) {
      setFormError(extractRequestError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (rule) => {
    setTogglingId(rule.id);
    try {
      const updated = await toggleRuleActive(rule.id);
      setRules((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showSnackbar(updated.active ? 'Rule activated' : 'Rule deactivated', 'success');
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Could not update the rule'), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRule(deleteTarget.id);
      setRules((prev) => prev.filter((rule) => rule.id !== deleteTarget.id));
      showSnackbar('Rule deleted', 'success');
      setDeleteTarget(null);
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Could not delete the rule'), 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={readOnly ? 'Screening Rules' : 'Rule Configuration'}
        subtitle={
          readOnly
            ? 'Rules your clinic uses before a claim is submitted. Only an admin can change them.'
            : 'Create, edit and switch claim screening rules on or off'
        }
        action={
          readOnly ? null : (
            <Button variant="contained" startIcon={<AddCircleOutlined />} onClick={openCreate}>
              Add Rule
            </Button>
          )
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
          Couldn't load the rule list.
        </Alert>
      )}

      {!loading && !loadError && rules.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            {rules.length} rule{rules.length === 1 ? '' : 's'}
          </Typography>
          <Chip
            label={`${activeCount} active`}
            sx={{ bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 700 }}
          />
          {rules.length - activeCount > 0 && (
            <Chip
              label={`${rules.length - activeCount} inactive`}
              sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700 }}
            />
          )}
        </Stack>
      )}

      {loading ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <RulesSkeleton />
          </TableContainer>
        </Card>
      ) : !loadError && rules.length === 0 ? (
        <EmptyState readOnly={readOnly} />
      ) : !loadError ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Rule</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Active</TableCell>
                  {!readOnly && (
                    <TableCell align="right" sx={{ pr: 3 }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell sx={{ pl: 3, py: 1.5, maxWidth: 460 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{rule.ruleName}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
                        {rule.message}
                      </Typography>
                      <Typography
                        component="code"
                        sx={{
                          display: 'block',
                          mt: 0.75,
                          fontFamily: 'monospace',
                          fontSize: 11.5,
                          color: '#64748B',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rule.conditionLogic}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={RULE_TYPE_LABELS[rule.conditionType] ?? rule.conditionType}
                        sx={{ bgcolor: 'rgba(100, 116, 139, 0.1)', color: '#475569', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <SeverityChip severity={rule.severity} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          size="small"
                          checked={Boolean(rule.active)}
                          onChange={() => handleToggle(rule)}
                          disabled={readOnly || togglingId === rule.id}
                          inputProps={{ 'aria-label': `Toggle ${rule.ruleName}` }}
                        />
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', minWidth: 44 }}>
                          {togglingId === rule.id ? 'Saving…' : rule.active ? 'On' : 'Off'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    {!readOnly && (
                    <TableCell align="right" sx={{ pr: 3, py: 1.5 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit rule">
                          <IconButton size="small" onClick={() => openEdit(rule)} aria-label={`Edit ${rule.ruleName}`}>
                            <EditOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete rule">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(rule)}
                            aria-label={`Delete ${rule.ruleName}`}
                            sx={{ color: '#DC2626' }}
                          >
                            <DeleteOutlineOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}

      {!readOnly && (
      <>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={requestClose}
        slotProps={{
          paper: { sx: { width: { xs: '100%', sm: 540 }, bgcolor: 'background.paper' } },
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
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              {editingRule ? 'Edit Rule' : 'Add Rule'}
            </Typography>
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
                label="Rule Name"
                autoFocus
                value={form.ruleName}
                onChange={updateField('ruleName')}
                error={touched.ruleName && Boolean(ruleNameError)}
                helperText={(touched.ruleName && ruleNameError) || ' '}
              />

              <TextField
                select
                label="Condition Type"
                value={form.conditionType}
                onChange={handleTypeChange}
                helperText={CONDITION_HINTS[form.conditionType]}
              >
                {RULE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Severity"
                value={form.severity}
                onChange={updateField('severity')}
              >
                {Object.entries(SEVERITY_META).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>
                    {meta.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Message"
                value={form.message}
                onChange={updateField('message')}
                multiline
                minRows={2}
                error={touched.message && Boolean(messageError)}
                helperText={
                  (touched.message && messageError) ||
                  'Shown to billing staff when this rule flags a claim.'
                }
              />

              <TextField
                label="Condition Logic (JSON)"
                value={form.conditionLogic}
                onChange={updateField('conditionLogic')}
                multiline
                minRows={5}
                error={touched.conditionLogic && Boolean(conditionError)}
                helperText={(touched.conditionLogic && conditionError) || CONDITION_HINTS[form.conditionType]}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
              />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Active</Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    Inactive rules are skipped by the risk engine.
                  </Typography>
                </Box>
                <Switch
                  checked={form.active}
                  onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  inputProps={{ 'aria-label': 'Rule active' }}
                />
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
              onClick={handleSave}
              disabled={!canSave}
              startIcon={
                submitting ? undefined : editingRule ? <EditOutlined /> : <AddCircleOutlined />
              }
              sx={{ minWidth: 150 }}
            >
              {submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : editingRule ? (
                'Save Changes'
              ) : (
                'Create Rule'
              )}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            You have unsaved changes to this rule. They'll be lost if you close the drawer.
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

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Delete this rule?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{deleteTarget?.ruleName}</Typography>
          <DialogContentText sx={{ mt: 1, fontSize: 14 }}>
            Rules that have already flagged claims cannot be deleted. Deactivate those rules instead.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete Rule'}
          </Button>
        </DialogActions>
      </Dialog>
      </>
      )}

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
