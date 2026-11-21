import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
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
  Divider,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import PageHeader from '../../components/layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import {
  checkClaim,
  confirmClaim,
  fetchClaim,
  fetchDiagnosisCodes,
  fetchDoctors,
  fetchInsurers,
  fetchPatients,
  fetchProcedureCodes,
  submitClaim,
  updateClaim,
  updateClaimOutcome,
} from '../../api/claimsApi';
import { extractRequestError } from '../../utils/requestErrors';
import { formatDate } from '../../utils/dates';
import { claimStatusMeta, EDITABLE_STATUSES } from '../../utils/claimStatus';
import { riskScoreColor, SEVERITY_META } from '../../utils/severity';
import ClaimDetailsForm from '../billing/ClaimDetailsForm';

const ROLE_BASE_PATH = {
  ADMIN: '/admin/claims',
  BILLING_STAFF: '/billing/claims',
  DOCTOR: '/doctor/claims',
};

const INITIAL_LOOKUPS = {
  patients: [],
  insurers: [],
  diagnosisCodes: [],
  procedureCodes: [],
  doctors: [],
};

function DetailItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, color: 'text.primary', mt: 0.35, overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

function CodeRow({ code, description, category, modifier }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 1,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Typography sx={{ fontSize: 13.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {code}
        {modifier ? `-${modifier}` : ''}
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: 'text.secondary', flex: 1, minWidth: 160 }}>
        {description}
      </Typography>
      {category && (
        <Chip
          label={category}
          size="small"
          sx={{ height: 20, fontSize: 10.5, bgcolor: 'rgba(100, 116, 139, 0.1)', color: '#64748B' }}
        />
      )}
    </Box>
  );
}

function RiskFlagRow({ flag }) {
  const meta = SEVERITY_META[flag.severity] ?? SEVERITY_META.LOW;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 1.75,
        borderRadius: 1.5,
        bgcolor: meta.background,
        border: `1px solid ${meta.border}`,
        borderLeft: `4px solid ${meta.color}`,
      }}
    >
      <WarningAmberOutlined sx={{ fontSize: 19, color: meta.color, mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gapY={0.5}>
          <Chip
            label={meta.label}
            size="small"
            sx={{ bgcolor: meta.color, color: '#FFFFFF', fontWeight: 700, fontSize: 10.5, height: 22 }}
          />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{flag.ruleName}</Typography>
        </Stack>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.5 }}>
          {flag.message}
        </Typography>
      </Box>
    </Box>
  );
}

function DetailSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="text" width={220} height={44} />
      <Card sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={120} />
      </Card>
      <Card sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={160} />
      </Card>
    </Stack>
  );
}

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const basePath = ROLE_BASE_PATH[user?.role] ?? '/admin/claims';

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editingBusy, setEditingBusy] = useState(false);
  const [lookups, setLookups] = useState(INITIAL_LOOKUPS);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupErrors, setLookupErrors] = useState({});
  const [busyAction, setBusyAction] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  const role = user?.role;
  const editable = EDITABLE_STATUSES.includes(claim?.status);
  const canEdit = role === 'BILLING_STAFF' && editable;
  const myDoctorEntry = (claim?.doctors ?? []).find(
    (entry) => entry.doctorUsername === user?.username
  );
  const canConfirm = role === 'DOCTOR' && Boolean(myDoctorEntry) && !myDoctorEntry.confirmed && editable;

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    fetchClaim(id)
      .then((data) => {
        if (active) setClaim(data);
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
  }, [id]);

  useEffect(() => {
    if (role !== 'BILLING_STAFF') return undefined;
    let active = true;
    setLookupLoading(true);
    const requests = [
      ['patients', fetchPatients],
      ['insurers', fetchInsurers],
      ['diagnosisCodes', fetchDiagnosisCodes],
      ['procedureCodes', fetchProcedureCodes],
      ['doctors', fetchDoctors],
    ];

    Promise.all(
      requests.map(([key, request]) =>
        request()
          .then((data) => ({ key, data }))
          .catch((error) => ({ key, error }))
      )
    ).then((results) => {
      if (!active) return;
      const next = { ...INITIAL_LOOKUPS };
      const errors = {};
      results.forEach((result) => {
        if (result.error) {
          errors[result.key] = result.error;
        } else {
          next[result.key] = result.data;
        }
      });
      setLookups(next);
      setLookupErrors(errors);
      setLookupLoading(false);
    });

    return () => {
      active = false;
    };
  }, [role]);

  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    fetchClaim(id)
      .then(setClaim)
      .catch(setLoadError)
      .finally(() => setLoading(false));
  };

  const runAction = async (action, request, successMessage) => {
    setBusyAction(action);
    try {
      const updated = await request();
      setClaim(updated);
      showSnackbar(successMessage, 'success');
    } catch (error) {
      showSnackbar(extractRequestError(error), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveEdit = async (payload) => {
    setEditingBusy(true);
    try {
      const updated = await updateClaim(claim.id, payload);
      setClaim(updated);
      setEditing(false);
      showSnackbar('Claim updated — run a risk check before submitting.', 'success');
    } catch (error) {
      showSnackbar(extractRequestError(error), 'error');
    } finally {
      setEditingBusy(false);
    }
  };

  const handleOutcome = async () => {
    if (!outcome) return;
    const nextStatus = outcome;
    setOutcome(null);
    await runAction(
      `outcome-${nextStatus}`,
      () => updateClaimOutcome(claim.id, nextStatus),
      nextStatus === 'APPROVED' ? 'Claim marked as approved' : 'Claim marked as denied'
    );
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Claim Detail" subtitle="Loading claim information" />
        <DetailSkeleton />
      </>
    );
  }

  if (loadError || !claim) {
    return (
      <>
        <PageHeader title="Claim Detail" subtitle="The requested claim could not be loaded" />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retryLoad}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          Couldn't load this claim.
        </Alert>
        <Button
          component={RouterLink}
          to={basePath}
          startIcon={<ArrowBackOutlined />}
          variant="outlined"
        >
          Back to claims
        </Button>
      </>
    );
  }

  const status = claimStatusMeta(claim.status);
  const riskColor = riskScoreColor(claim.riskScore ?? 0);
  const flags = claim.riskFlags ?? [];

  const actionButtons = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button
        component={RouterLink}
        to={basePath}
        variant="outlined"
        startIcon={<ArrowBackOutlined />}
      >
        Back
      </Button>
      {canEdit && (
        <Button
          variant="outlined"
          startIcon={<EditOutlined />}
          onClick={() => setEditing(true)}
          disabled={busyAction !== null || editing}
        >
          Edit
        </Button>
      )}
      {(role === 'BILLING_STAFF' || role === 'ADMIN') && editable && (
        <Button
          variant="outlined"
          startIcon={
            busyAction === 'check' ? <CircularProgress size={16} /> : <FactCheckOutlined />
          }
          onClick={() =>
            runAction('check', () => checkClaim(claim.id), 'Risk check completed')
          }
          disabled={busyAction !== null}
        >
          Run check
        </Button>
      )}
      {role === 'BILLING_STAFF' && claim.status === 'CHECKED_CLEAN' && (
        <Button
          variant="contained"
          startIcon={busyAction === 'submit' ? <CircularProgress size={16} color="inherit" /> : <SendOutlined />}
          onClick={() => runAction('submit', () => submitClaim(claim.id), 'Claim submitted to the payer')}
          disabled={busyAction !== null}
        >
          Submit
        </Button>
      )}
      {canConfirm && (
        <Button
          variant="contained"
          startIcon={busyAction === 'confirm' ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
          onClick={() => runAction('confirm', () => confirmClaim(claim.id), 'Confirmed. Run the risk check again so this flag can clear.')}
          disabled={busyAction !== null}
        >
          Confirm
        </Button>
      )}
      {role === 'ADMIN' && claim.status === 'SUBMITTED' && (
        <>
          <Button
            variant="contained"
            startIcon={busyAction === 'outcome-APPROVED' ? <CircularProgress size={16} color="inherit" /> : <TaskAltOutlined />}
            onClick={() => setOutcome('APPROVED')}
            disabled={busyAction !== null}
          >
            Mark approved
          </Button>
          <Button
            variant="outlined"
            startIcon={busyAction === 'outcome-DENIED' ? <CircularProgress size={16} /> : <CloseOutlined />}
            onClick={() => setOutcome('DENIED')}
            disabled={busyAction !== null}
            sx={{ color: '#DC2626', borderColor: '#FECACA', '&:hover': { borderColor: '#DC2626' } }}
          >
            Mark denied
          </Button>
        </>
      )}
    </Stack>
  );

  if (editing) {
    return (
      <>
        <PageHeader
          title={`Edit Claim #${claim.id}`}
          subtitle="Update claim details, then run a fresh risk check"
          action={
            <Button variant="outlined" startIcon={<ArrowBackOutlined />} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          }
        />
        {lookupLoading ? (
          <Card sx={{ p: 3 }}>
            <Skeleton variant="rounded" height={260} />
          </Card>
        ) : (
          <ClaimDetailsForm
            lookups={lookups}
            lookupErrors={lookupErrors}
            mode="edit"
            initialClaim={claim}
            busy={editingBusy}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditing(false)}
          />
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

  return (
    <>
      <PageHeader
        title={`Claim #${claim.id}`}
        subtitle={`${claim.patientName} · ${claim.insurerName}`}
        action={actionButtons}
      />

      <Stack spacing={2.5}>
        {role === 'ADMIN' && editable && (
          <Alert severity="info">
            Billing staff edit and submit this claim. You can run a check here, and record the payer outcome after it is submitted.
          </Alert>
        )}
        <Card sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={1.5}
          >
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{claim.patientName}</Typography>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
                Date of service {formatDate(claim.dateOfService)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={status.label}
                sx={{ bgcolor: status.background, color: status.color, fontWeight: 700 }}
              />
              <Chip
                label={`Risk ${claim.riskScore ?? 0}/100`}
                sx={{
                  bgcolor: 'background.default',
                  color: riskColor,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2.5 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gapX: 4,
              gapY: 2,
            }}
          >
            <DetailItem label="Insurer" value={claim.insurerName} />
            <DetailItem label="Policy number" value={claim.policyNumber} />
            <DetailItem label="Pre-authorization" value={claim.preAuthNumber || 'Not provided'} />
            <DetailItem label="Created by" value={claim.createdByUsername} />
            <DetailItem label="Created" value={formatDate(claim.createdAt)} />
            <DetailItem label="Last updated" value={formatDate(claim.updatedAt)} />
          </Box>

          <Divider sx={{ my: 2.5 }} />
          <SectionLabel>Assigned doctors</SectionLabel>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(claim.doctors ?? []).map((doctor) => (
              <Chip
                key={doctor.doctorId}
                label={`${doctor.doctorUsername}${doctor.confirmed ? ' · confirmed' : ' · pending'}`}
                sx={{
                  bgcolor: doctor.confirmed ? '#F0FDF4' : '#F1F5F9',
                  color: doctor.confirmed ? '#16A34A' : '#64748B',
                  fontWeight: 600,
                }}
              />
            ))}
          </Stack>
        </Card>

        <Card sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Box>
              <SectionLabel>Diagnosis codes</SectionLabel>
              {(claim.diagnosisCodes ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>None recorded</Typography>
              ) : (
                claim.diagnosisCodes.map((item) => (
                  <CodeRow
                    key={item.id}
                    code={item.code}
                    description={item.description}
                    category={item.category}
                  />
                ))
              )}
            </Box>
            <Box>
              <SectionLabel>Procedure codes</SectionLabel>
              {(claim.procedureCodes ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>None recorded</Typography>
              ) : (
                claim.procedureCodes.map((item) => (
                  <CodeRow
                    key={item.procedureCodeId}
                    code={item.code}
                    description={item.description}
                    modifier={item.modifier}
                  />
                ))
              )}
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <SectionLabel>Risk flags</SectionLabel>
          {flags.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleOutlined />}>
              No risk flags on this claim.
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              {flags.map((flag) => (
                <RiskFlagRow key={flag.id} flag={flag} />
              ))}
            </Stack>
          )}
        </Card>
      </Stack>

      <Dialog open={Boolean(outcome)} onClose={() => setOutcome(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>
          {outcome === 'APPROVED' ? 'Mark claim approved?' : 'Mark claim denied?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {outcome === 'APPROVED'
              ? 'This records a simulated payer decision of APPROVED for this claim.'
              : 'This records a simulated payer decision of DENIED for this claim.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setOutcome(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleOutcome}
            sx={
              outcome === 'DENIED'
                ? { bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }
                : undefined
            }
          >
            {outcome === 'APPROVED' ? 'Mark approved' : 'Mark denied'}
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
