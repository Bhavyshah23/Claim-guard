import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import { confirmClaim, fetchClaims } from '../../api/claimsApi';
import { extractRequestError } from '../../utils/requestErrors';
import { formatDate } from '../../utils/dates';
import ClaimCard from './ClaimCard';

function ClaimSkeleton() {
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" height={24} />
            <Skeleton width="25%" height={16} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton variant="rounded" width={96} height={24} />
        </Stack>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} variant="rounded" width={92} height={28} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton variant="rounded" width={110} height={32} />
        </Box>
      </Stack>
    </Card>
  );
}

export default function MyClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sortBy, setSortBy] = useState('risk');
  const [confirmedOpen, setConfirmedOpen] = useState(false);
  const [confirmingClaim, setConfirmingClaim] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });

  const username = user?.username;

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

  const isMine = useCallback(
    (claim) => (claim.doctors ?? []).some((entry) => entry.doctorUsername === username),
    [username]
  );

  const awaiting = useMemo(
    () =>
      claims.filter(
        (claim) =>
          isMine(claim) &&
          (claim.doctors ?? []).some(
            (entry) => entry.doctorUsername === username && entry.confirmed === false
          )
      ),
    [claims, username, isMine]
  );

  const confirmedClaims = useMemo(
    () =>
      claims.filter(
        (claim) =>
          isMine(claim) &&
          (claim.doctors ?? []).some(
            (entry) => entry.doctorUsername === username && entry.confirmed === true
          )
      ),
    [claims, username, isMine]
  );

  const sortedAwaiting = useMemo(() => {
    const list = [...awaiting];
    if (sortBy === 'date') {
      list.sort(
        (a, b) => new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime()
      );
    } else {
      list.sort((a, b) => (b.riskScore ?? -1) - (a.riskScore ?? -1));
    }
    return list;
  }, [awaiting, sortBy]);

  const showSnackbar = (message, tone = 'success') => setSnackbar({ open: true, message, tone });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const openConfirm = (claim) => setConfirmingClaim(claim);
  const closeConfirm = () => {
    if (!confirming) setConfirmingClaim(null);
  };

  const handleConfirm = async () => {
    if (!confirmingClaim) return;
    setConfirming(true);
    try {
      const updated = await confirmClaim(confirmingClaim.id);
      setClaims((prev) => prev.map((claim) => (claim.id === updated.id ? updated : claim)));
      setConfirmingClaim(null);
      showSnackbar('Claim confirmed', 'success');
    } catch (error) {
      showSnackbar(extractRequestError(error, 'Could not confirm the claim'), 'error');
    } finally {
      setConfirming(false);
    }
  };

  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    fetchClaims()
      .then(setClaims)
      .catch(setLoadError)
      .finally(() => setLoading(false));
  };

  return (
    <>
      <PageHeader title="My Claims" subtitle="Review and confirm claims assigned to you" />

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
          Couldn't load your claims.
        </Alert>
      )}

      {loading ? (
        <Stack spacing={2.5}>
          <ClaimSkeleton />
          <ClaimSkeleton />
          <ClaimSkeleton />
        </Stack>
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
              Awaiting Your Confirmation{awaiting.length > 0 ? ` (${awaiting.length})` : ''}
            </Typography>
            {awaiting.length > 1 && (
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(_event, value) => value && setSortBy(value)}
                size="small"
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
                <ToggleButton value="risk" title="Highest risk first">
                  Highest risk
                </ToggleButton>
                <ToggleButton value="date" title="Newest first">
                  Newest
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Stack>

          {awaiting.length === 0 ? (
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
                  bgcolor: 'rgba(22, 163, 74, 0.1)',
                  color: '#16A34A',
                }}
              >
                <TaskAltOutlined sx={{ fontSize: 30 }} />
              </Box>
              <Typography sx={{ mt: 2.5, fontSize: 17, fontWeight: 700 }}>
                You're all caught up!
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 400 }}>
                No claims are waiting for your confirmation right now.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2.5}>
              {sortedAwaiting.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} onConfirm={openConfirm} />
              ))}
            </Stack>
          )}

          {confirmedClaims.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Button
                onClick={() => setConfirmedOpen((prev) => !prev)}
                aria-expanded={confirmedOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'text.primary',
                  textTransform: 'none',
                  px: 0,
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                  Already Confirmed ({confirmedClaims.length})
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    fontSize: 22,
                    color: 'text.secondary',
                    transition: 'transform 200ms ease',
                    transform: confirmedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </Button>

              <Collapse in={confirmedOpen}>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {confirmedClaims.map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} confirmed muted />
                  ))}
                </Stack>
              </Collapse>
            </Box>
          )}
        </>
      )}

      <Dialog open={Boolean(confirmingClaim)} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Confirm this claim?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{confirmingClaim?.patientName}</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
            Date of service: {formatDate(confirmingClaim?.dateOfService)}
          </Typography>
          <DialogContentText sx={{ mt: 2, fontSize: 14 }}>
            By confirming, you verify the diagnosis and procedure codes for this claim are accurate.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={closeConfirm} disabled={confirming}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirm} disabled={confirming}>
            {confirming ? <CircularProgress size={18} color="inherit" /> : 'Confirm'}
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
