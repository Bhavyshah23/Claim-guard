import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import PageHeader from '../../components/layout/PageHeader';
import { fetchClaims } from '../../api/claimsApi';
import { claimStatusMeta } from '../../utils/claimStatus';
import { riskScoreColor } from '../../utils/severity';

const EDITABLE = ['DRAFT', 'CHECKED_CLEAN', 'CHECKED_FLAGGED'];

const COLUMNS = [
  {
    key: 'fix',
    title: 'Needs fix',
    hint: 'Drafts and claims with screening issues',
    color: '#DC2626',
  },
  {
    key: 'doctor',
    title: 'Waiting for doctor',
    hint: 'Clean claims still missing a confirmation',
    color: '#D97706',
  },
  {
    key: 'ready',
    title: 'Ready to submit',
    hint: 'Passed every rule and confirmed',
    color: '#16A34A',
  },
];

function needsDoctor(claim) {
  return (claim.doctors ?? []).some((doctor) => !doctor.confirmed);
}

function columnFor(claim) {
  if (claim.status === 'DRAFT' || claim.status === 'CHECKED_FLAGGED') return 'fix';
  if (claim.status === 'CHECKED_CLEAN' && needsDoctor(claim)) return 'doctor';
  if (claim.status === 'CHECKED_CLEAN') return 'ready';
  return null;
}

function QueueCard({ claim, onOpen }) {
  const status = claimStatusMeta(claim.status);
  const flag = claim.riskFlags?.[0];
  const scoreColor = riskScoreColor(claim.riskScore ?? 0);
  return (
    <Card
      onClick={onOpen}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderTop: `3px solid ${status.color}`,
        '&:hover': { borderColor: '#CBD5E1' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{claim.patientName}</Typography>
        <Typography data-tabular="true" sx={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>
          {claim.riskScore ?? 0}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: 12.5, color: 'text.secondary' }}>
        {claim.insurerName}
      </Typography>
      <Chip
        label={status.label}
        size="small"
        sx={{ mt: 1.25, bgcolor: status.background, color: status.color, fontWeight: 700 }}
      />
      {flag && (
        <Typography sx={{ mt: 1.25, fontSize: 12.5, color: 'text.secondary' }}>
          {flag.ruleName}
        </Typography>
      )}
    </Card>
  );
}

export default function BillingQueuePage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchClaims()
      .then((data) => {
        if (active) setClaims(data);
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

  const grouped = useMemo(() => {
    const buckets = { fix: [], doctor: [], ready: [] };
    claims
      .filter((claim) => EDITABLE.includes(claim.status))
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
      .forEach((claim) => {
        const key = columnFor(claim);
        if (key) buckets[key].push(claim);
      });
    return buckets;
  }, [claims]);

  const openClaims = grouped.fix.length + grouped.doctor.length + grouped.ready.length;

  return (
    <>
      <PageHeader
        title="Work queue"
        subtitle="Claims that still need a fix, a doctor, or a submit"
        action={
          <Button
            component={RouterLink}
            to="/billing/new-claim"
            variant="contained"
            startIcon={<AddCircleOutlined />}
          >
            New Claim
          </Button>
        }
      />

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn't load the queue.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {COLUMNS.map((column) => (
            <Skeleton key={column.key} variant="rounded" height={280} />
          ))}
        </Box>
      ) : openClaims === 0 && !loadError ? (
        <Card sx={{ p: { xs: 5, sm: 7 }, textAlign: 'center' }}>
          <AssignmentOutlined sx={{ fontSize: 36, color: '#0F766E' }} />
          <Typography sx={{ mt: 2, fontSize: 17, fontWeight: 700 }}>Nothing waiting</Typography>
          <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14 }}>
            New claims land here. Submitted claims stay on All Claims.
          </Typography>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 2,
            p: 2,
            borderRadius: 3,
            bgcolor: '#0F172A',
          }}
        >
          {COLUMNS.map((column) => (
            <Box key={column.key} sx={{ minHeight: 320 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5, mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>{column.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>{column.hint}</Typography>
                </Box>
                <Box
                  sx={{
                    minWidth: 32,
                    height: 32,
                    px: 1,
                    borderRadius: 999,
                    bgcolor: column.color,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {grouped[column.key].length}
                </Box>
              </Stack>
              <Stack spacing={1.5}>
                {grouped[column.key].length === 0 ? (
                  <Typography sx={{ px: 0.5, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>None</Typography>
                ) : (
                  grouped[column.key].map((claim) => (
                    <QueueCard
                      key={claim.id}
                      claim={claim}
                      onOpen={() => navigate(`/billing/claims/${claim.id}`)}
                    />
                  ))
                )}
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
