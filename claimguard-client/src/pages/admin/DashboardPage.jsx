import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { fetchClaims } from '../../api/claimsApi';
import { formatDate } from '../../utils/dates';
import { riskScoreColor, SEVERITY_META } from '../../utils/severity';

const STATUS_BADGE = {
  DRAFT: { label: 'Draft', color: '#64748B', background: '#F1F5F9' },
  CHECKED_CLEAN: { label: 'Checked clean', color: '#16A34A', background: '#F0FDF4' },
  CHECKED_FLAGGED: { label: 'Checked — issues', color: '#DC2626', background: '#FEF2F2' },
  SUBMITTED: { label: 'Submitted', color: '#2563EB', background: '#EFF6FF' },
  DENIED: { label: 'Denied', color: '#DC2626', background: '#FEF2F2' },
  APPROVED: { label: 'Approved', color: '#16A34A', background: '#F0FDF4' },
};

// Distinct shades so the donut stays legible even when CHECKED_CLEAN and
// APPROVED (or CHECKED_FLAGGED and DENIED) coexist in the data.
const STATUS_DONUT = {
  DRAFT: '#64748B',
  CHECKED_CLEAN: '#16A34A',
  CHECKED_FLAGGED: '#DC2626',
  SUBMITTED: '#2563EB',
  DENIED: '#991B1B',
  APPROVED: '#059669',
};

const SEVERITY_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const SUMMARY = [
  { key: 'total', label: 'Total Claims', accent: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', icon: AssignmentOutlined },
  { key: 'clean', label: 'Clean Claims', accent: '#16A34A', bg: 'rgba(22, 163, 74, 0.12)', icon: CheckCircleOutlined },
  { key: 'flagged', label: 'Flagged Claims', accent: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', icon: ErrorOutlineOutlined },
  { key: 'draft', label: 'Draft Claims', accent: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', icon: EditOutlined },
];

const TOOLTIP_BOX = {
  bgcolor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 1,
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
  px: 1.5,
  py: 1,
};

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const status = entry.payload?.status ?? entry.name;
  const meta = STATUS_BADGE[status] ?? { label: status, color: '#64748B' };
  return (
    <Box sx={TOOLTIP_BOX}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: meta.color }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</Typography>
      </Stack>
      <Typography data-tabular="true" sx={{ fontSize: 18, fontWeight: 700, mt: 0.25 }}>
        {entry.value} claim{entry.value === 1 ? '' : 's'}
      </Typography>
    </Box>
  );
}

function FlagTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <Box sx={TOOLTIP_BOX}>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{entry.ruleName}</Typography>
      <Typography data-tabular="true" sx={{ fontSize: 18, fontWeight: 700, mt: 0.25 }}>
        {entry.count} ×
      </Typography>
    </Box>
  );
}

function StatCard({ label, value, icon: Icon, accent, bg }) {
  return (
    <Card
      sx={{
        p: 2.5,
        position: 'relative',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.10)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: bg,
          color: accent,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Typography data-tabular="true" sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 13.5, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Card>
  );
}

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

function DashboardSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        {SUMMARY.map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item.key}>
            <Card sx={{ p: 2.5 }}>
              <Skeleton variant="text" width="35%" height={40} />
              <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Skeleton variant="text" width={180} height={24} />
            <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 3 }} />
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Skeleton variant="text" width={200} height={24} />
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} variant="rounded" width="100%" height={20} />
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: { xs: 3, sm: 4 } }}>
        <Skeleton variant="text" width="40%" height={36} />
        <Skeleton variant="text" width="60%" height={18} sx={{ mt: 1 }} />
      </Card>

      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 2 }}>
          <Skeleton variant="text" width={160} height={24} />
        </Box>
        <Stack spacing={1.5} sx={{ px: { xs: 2.5, sm: 3 }, pb: 3 }}>
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} variant="rounded" width="100%" height={40} />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

export default function DashboardPage() {
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

  const stats = useMemo(() => {
    const byStatus = {};
    const flagsByName = {};

    claims.forEach((claim) => {
      byStatus[claim.status] = (byStatus[claim.status] ?? 0) + 1;
      (claim.riskFlags ?? []).forEach((flag) => {
        const current = flagsByName[flag.ruleName];
        if (!current) {
          flagsByName[flag.ruleName] = {
            ruleName: flag.ruleName,
            count: 1,
            severity: flag.severity,
          };
        } else {
          current.count += 1;
          if (SEVERITY_ORDER[flag.severity] > SEVERITY_ORDER[current.severity]) {
            current.severity = flag.severity;
          }
        }
      });
    });

    const statusData = Object.entries(byStatus)
      .map(([status, value]) => ({ status, value }))
      .sort((a, b) => b.value - a.value);

    const flagData = Object.values(flagsByName)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((entry) => ({
        ...entry,
        shortName: entry.ruleName.length > 32 ? `${entry.ruleName.slice(0, 31)}…` : entry.ruleName,
      }));

    return {
      total: claims.length,
      clean: byStatus.CHECKED_CLEAN ?? 0,
      flagged: byStatus.CHECKED_FLAGGED ?? 0,
      draft: byStatus.DRAFT ?? 0,
      statusData,
      flagData,
      recent: [...claims]
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10),
    };
  }, [claims]);

  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    fetchClaims()
      .then(setClaims)
      .catch(setLoadError)
      .finally(() => setLoading(false));
  };

  const summaryValues = {
    total: stats.total,
    clean: stats.clean,
    flagged: stats.flagged,
    draft: stats.draft,
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Overview of your clinic's claim activity" />
        <DashboardSkeleton />
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Overview of your clinic's claim activity" />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retryLoad}>
              Retry
            </Button>
          }
        >
          Couldn't load your claims.
        </Alert>
      </>
    );
  }

  if (claims.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Overview of your clinic's claim activity" />
        <Card
          sx={{
            p: { xs: 5, sm: 8 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(15, 118, 110, 0.1)',
              color: '#0F766E',
            }}
          >
            <AssignmentOutlined sx={{ fontSize: 34 }} />
          </Box>
          <Typography sx={{ mt: 3, fontSize: 20, fontWeight: 700 }}>No claims yet</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 14.5, maxWidth: 420 }}>
            Claims will appear here once your billing staff starts creating them.
          </Typography>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your clinic's claim activity" />

      <Stack spacing={2.5}>
        <Grid container spacing={2.5}>
          {SUMMARY.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.key}>
              <StatCard
                label={item.label}
                value={summaryValues[item.key]}
                icon={item.icon}
                accent={item.accent}
                bg={item.bg}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Claims by Status</Typography>
              <Box sx={{ position: 'relative', height: 260, mt: 1.5 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      dataKey="value"
                      nameKey="status"
                      innerRadius="62%"
                      outerRadius="86%"
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="none"
                    >
                      {stats.statusData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_DONUT[entry.status] ?? '#64748B'} />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography data-tabular="true" sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                    {stats.total}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                    Total claims
                  </Typography>
                </Box>
              </Box>
              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 2, justifyContent: 'center', rowGap: 1 }}
              >
                {stats.statusData.map((entry) => {
                  const meta = STATUS_BADGE[entry.status] ?? { label: entry.status };
                  return (
                    <Stack key={entry.status} direction="row" spacing={0.75} alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: STATUS_DONUT[entry.status] ?? '#64748B',
                        }}
                      />
                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                        <Box component="span" data-tabular="true" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          {entry.value}
                        </Box>{' '}
                        {meta.label}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Most Common Risk Flags</Typography>
              {stats.flagData.length === 0 ? (
                <Box
                  sx={{
                    py: 7,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldOutlined sx={{ fontSize: 44, color: '#CBD5E1' }} />
                  <Typography sx={{ mt: 2, fontSize: 15, fontWeight: 600, color: 'text.secondary', maxWidth: 340 }}>
                    No risk flags recorded yet — run a check on a claim to see this populate
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: Math.max(220, stats.flagData.length * 46), mt: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.flagData}
                      layout="vertical"
                      margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        width={190}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12.5, fill: '#334155', fontWeight: 600 }}
                      />
                      <Tooltip content={<FlagTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                        {stats.flagData.map((entry) => (
                          <Cell
                            key={entry.ruleName}
                            fill={SEVERITY_META[entry.severity]?.color ?? SEVERITY_META.LOW.color}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        <Card
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            flexWrap: 'wrap',
            bgcolor: 'rgba(15, 118, 110, 0.07)',
            borderColor: 'rgba(13, 148, 136, 0.35)',
            borderLeft: '4px solid #0F766E',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#0F766E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 16px rgba(15, 118, 110, 0.35)',
            }}
          >
            <ShieldOutlined sx={{ fontSize: 34 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography data-tabular="true" sx={{ fontSize: { xs: 26, sm: 34 }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {stats.flagged} claim{stats.flagged === 1 ? '' : 's'} caught before submission
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 14.5, color: 'text.secondary', maxWidth: 640 }}>
              ClaimGuard flagged {stats.flagged === 1 ? 'this claim' : 'these claims'} for review,
              helping avoid potential denials and revenue loss.
            </Typography>
          </Box>
        </Card>

        <Card sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              px: { xs: 2.5, sm: 3 },
              pt: 2.5,
              pb: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Recent Claims</Typography>
            <Button
              component={RouterLink}
              to="/admin/claims"
              size="small"
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 16 }} />}
              sx={{ color: 'text.secondary' }}
            >
              View All
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Patient</TableCell>
                  <TableCell>Insurer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell sx={{ pr: 3 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recent.map((claim) => {
                  const status = STATUS_BADGE[claim.status] ?? {
                    label: claim.status,
                    color: '#64748B',
                    background: '#F1F5F9',
                  };
                  return (
                    <TableRow key={claim.id} hover>
                      <TableCell sx={{ pl: 3, py: 1.25 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{claim.patientName}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, color: 'text.secondary', fontSize: 13.5 }}>
                        {claim.insurerName}
                      </TableCell>
                      <TableCell sx={{ py: 1.25 }}>
                        <Chip
                          size="small"
                          label={status.label}
                          sx={{ bgcolor: status.background, color: status.color, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.25 }}>
                        <RiskScoreCell score={claim.riskScore} />
                      </TableCell>
                      <TableCell sx={{ py: 1.25, color: 'text.secondary', fontSize: 13.5, pr: 3 }}>
                        {formatDate(claim.dateOfService)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </>
  );
}
