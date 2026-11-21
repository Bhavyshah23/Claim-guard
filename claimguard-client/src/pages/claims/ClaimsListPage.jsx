import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  InputAdornment,
  MenuItem,
  Skeleton,
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
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PageHeader from '../../components/layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { fetchClaims } from '../../api/claimsApi';
import { formatDate } from '../../utils/dates';
import { claimStatusMeta, CLAIM_STATUS_OPTIONS } from '../../utils/claimStatus';
import { riskScoreColor } from '../../utils/severity';

const ROLE_BASE_PATH = {
  ADMIN: '/admin/claims',
  BILLING_STAFF: '/billing/claims',
  DOCTOR: '/doctor/claims',
};

function RiskScoreCell({ score }) {
  if (score === null || score === undefined) {
    return <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>—</Typography>;
  }
  const color = riskScoreColor(score);
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 48,
          height: 5,
          borderRadius: 999,
          bgcolor: 'rgba(100, 116, 139, 0.15)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.min(score, 100)}%`,
            height: '100%',
            borderRadius: 999,
            bgcolor: color,
          }}
        />
      </Box>
      <Typography data-tabular="true" sx={{ fontSize: 13, fontWeight: 700, color, minWidth: 26 }}>
        {score}
      </Typography>
    </Stack>
  );
}

function ClaimsTableSkeleton() {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell sx={{ pl: 3 }}>
              <Skeleton width={150} height={20} />
            </TableCell>
            <TableCell>
              <Skeleton width={120} height={20} />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={110} height={24} />
            </TableCell>
            <TableCell>
              <Skeleton width={80} height={20} />
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

function EmptyState({ filtered, icon, title, subtitle }) {
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
          bgcolor: filtered ? 'rgba(100, 116, 139, 0.1)' : 'rgba(15, 118, 110, 0.1)',
          color: filtered ? '#64748B' : '#0F766E',
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ mt: 2.5, fontSize: 17, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 420 }}>
        {subtitle}
      </Typography>
    </Card>
  );
}

export default function ClaimsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const basePath = ROLE_BASE_PATH[user?.role] ?? '/admin/claims';

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

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();
    return claims
      .filter((claim) => statusFilter === 'ALL' || claim.status === statusFilter)
      .filter((claim) => {
        if (!query) return true;
        return (
          claim.patientName?.toLowerCase().includes(query) ||
          claim.insurerName?.toLowerCase().includes(query) ||
          claim.policyNumber?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [claims, search, statusFilter]);

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
      <PageHeader
        title="All Claims"
        subtitle={
          user?.role === 'DOCTOR'
            ? 'Read-only view of every claim in your clinic'
            : 'Review, screen and manage every claim in your clinic'
        }
        action={
          user?.role === 'BILLING_STAFF' ? (
            <Button
              component={RouterLink}
              to="/billing/new-claim"
              variant="contained"
              startIcon={<AddCircleOutlined />}
            >
              New Claim
            </Button>
          ) : null
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
          Couldn't load the claims list.
        </Alert>
      )}

      {!loading && !loadError && claims.length > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={2}
          sx={{ mb: 2 }}
        >
          <TextField
            placeholder="Search by patient, insurer or policy"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 360 } }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ width: { xs: '100%', sm: 200 } }}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            {CLAIM_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {loading ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <ClaimsTableSkeleton />
          </TableContainer>
        </Card>
      ) : !loadError && claims.length === 0 ? (
        <EmptyState
          filtered={false}
          icon={<AssignmentOutlined sx={{ fontSize: 30 }} />}
          title="No claims yet"
          subtitle="Claims will appear here as soon as your billing staff starts creating them. Demo claims load only on a fresh database."
        />
      ) : !loadError && filteredClaims.length === 0 ? (
        <EmptyState
          filtered
          icon={<SearchOffOutlined sx={{ fontSize: 30 }} />}
          title="No claims match your filters"
          subtitle="Try a different search term or status filter."
        />
      ) : !loadError ? (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
              {filteredClaims.length} claim{filteredClaims.length === 1 ? '' : 's'}
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Patient</TableCell>
                  <TableCell>Insurer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell sx={{ pr: 3 }}>Date of Service</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClaims.map((claim) => {
                  const status = claimStatusMeta(claim.status);
                  return (
                    <TableRow
                      key={claim.id}
                      hover
                      onClick={() => navigate(`${basePath}/${claim.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ pl: 3, py: 1.5 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                          {claim.patientName}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                          Claim #{claim.id}
                          {claim.policyNumber ? ` · Policy ${claim.policyNumber}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: 13.5 }}>
                        {claim.insurerName}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          size="small"
                          label={status.label}
                          sx={{ bgcolor: status.background, color: status.color, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <RiskScoreCell score={claim.riskScore} />
                      </TableCell>
                      <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: 13.5, pr: 3 }}>
                        {formatDate(claim.dateOfService)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}
    </>
  );
}
