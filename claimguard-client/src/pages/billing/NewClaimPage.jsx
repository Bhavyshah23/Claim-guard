import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import EditOutlined from '@mui/icons-material/EditOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import PageHeader from '../../components/layout/PageHeader';
import {
  checkClaim,
  createClaim,
  fetchDiagnosisCodes,
  fetchDoctors,
  fetchInsurers,
  fetchPatients,
  fetchProcedureCodes,
} from '../../api/claimsApi';
import { extractRequestError } from '../../utils/requestErrors';
import { formatDate } from '../../utils/dates';
import ClaimDetailsForm from './ClaimDetailsForm';
import RiskResultsPanel from './RiskResultsPanel';

const INITIAL_LOOKUPS = {
  patients: [],
  insurers: [],
  diagnosisCodes: [],
  procedureCodes: [],
  doctors: [],
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  CHECKED_CLEAN: 'Checked clean',
  CHECKED_FLAGGED: 'Checked — issues',
  SUBMITTED: 'Submitted',
  DENIED: 'Denied',
  APPROVED: 'Approved',
};

function statusChipSx(theme, status) {
  const tones = {
    DRAFT: 'neutral',
    CHECKED_CLEAN: 'success',
    CHECKED_FLAGGED: 'medium',
    SUBMITTED: 'neutral',
    DENIED: 'high',
    APPROVED: 'success',
  };
  const tone = tones[status] ?? 'neutral';
  const severity = theme.palette.severity;
  return { color: severity[tone], backgroundColor: severity[`${tone}Background`] };
}

function FormSkeleton() {
  return (
    <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Skeleton variant="rounded" height={48} />
          </Grid>
        ))}
        {Array.from({ length: 2 }).map((_, index) => (
          <Grid item xs={12} key={`full-${index}`}>
            <Skeleton variant="rounded" height={48} />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Skeleton variant="rounded" width={200} height={44} />
      </Box>
    </Card>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: 'text.primary', mt: 0.25, overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function ClaimSummaryCard({ claim, onEdit }) {
  return (
    <Card sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={1}
        flexWrap="wrap"
      >
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Claim #{claim.id}
          </Typography>
          <Typography sx={{ fontSize: 17, fontWeight: 600, mt: 0.5 }}>{claim.patientName}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={STATUS_LABELS[claim.status] ?? claim.status} sx={(theme) => statusChipSx(theme, claim.status)} />
          <Button size="small" startIcon={<EditOutlined />} onClick={onEdit} sx={{ color: 'text.secondary' }}>
            Edit details
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ my: 2.25 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gapX: 4,
          gapY: 1.75,
        }}
      >
        <SummaryRow label="Insurer" value={claim.insurerName} />
        <SummaryRow label="Date of service" value={formatDate(claim.dateOfService)} />
        <SummaryRow
          label="Doctors"
          value={(claim.doctors ?? []).map((doctor) => doctor.doctorUsername).join(', ')}
        />
        <SummaryRow
          label="Diagnosis codes"
          value={(claim.diagnosisCodes ?? []).map((item) => item.code).join(', ')}
        />
        <SummaryRow
          label="Procedure codes"
          value={(claim.procedureCodes ?? [])
            .map((item) => `${item.code}${item.modifier ? ` (${item.modifier})` : ''}`)
            .join(', ')}
        />
      </Box>
    </Card>
  );
}

function RunRiskCheckCard({ checking, onRun }) {
  return (
    <Card
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Pre-submission risk check</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5, maxWidth: 520 }}>
          Run the ClaimGuard rules engine against this claim to catch issues before it goes to the
          insurer.
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        startIcon={<FactCheckOutlined />}
        onClick={onRun}
        disabled={checking}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {checking ? <CircularProgress size={20} color="inherit" /> : 'Run Risk Check'}
      </Button>
    </Card>
  );
}

export default function NewClaimPage() {
  const [lookups, setLookups] = useState(INITIAL_LOOKUPS);
  const [lookupErrors, setLookupErrors] = useState({});
  const [lookupLoading, setLookupLoading] = useState(true);
  const [claim, setClaim] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  useEffect(() => {
    let active = true;
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
  }, []);

  const showSnackbar = (message, tone = 'success') =>
    setSnackbar({ open: true, message, tone });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const runCheck = async (claimId) => {
    setChecking(true);
    try {
      const result = await checkClaim(claimId);
      setCheckResult(result);
      setDetailsExpanded(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Risk check failed — please try again'), 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (payload) => {
    if (claim) {
      await runCheck(claim.id);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createClaim(payload);
      setClaim(created);
      setCheckResult(null);
      setDetailsExpanded(false);
      showSnackbar('Claim created successfully', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showSnackbar(extractRequestError(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setDetailsExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setClaim(null);
    setCheckResult(null);
    setDetailsExpanded(true);
    setFormKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formBusy = claim ? checking : submitting;

  return (
    <>
      <PageHeader title="New Claim" subtitle="Enter claim details to run a pre-submission risk check" />

      <Box sx={{ display: detailsExpanded ? 'block' : 'none' }}>
        {lookupLoading ? (
          <FormSkeleton />
        ) : (
          <ClaimDetailsForm
            key={formKey}
            lookups={lookups}
            lookupErrors={lookupErrors}
            mode={claim ? 'recheck' : 'create'}
            busy={formBusy}
            onSubmit={handleSubmit}
          />
        )}
      </Box>

      {claim && !detailsExpanded && (
        <Stack spacing={3}>
          <ClaimSummaryCard claim={claim} onEdit={handleEdit} />
          {!checkResult && <RunRiskCheckCard checking={checking} onRun={() => runCheck(claim.id)} />}
          {checkResult && <RiskResultsPanel result={checkResult} onEdit={handleEdit} onReset={handleReset} />}
        </Stack>
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
