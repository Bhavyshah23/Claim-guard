import { Box, Button, Card, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { riskScoreColor, SEVERITY_META } from '../../utils/severity';

function RiskGauge({ score }) {
  const color = riskScoreColor(score);
  return (
    <Box sx={{ position: 'relative', width: 116, height: 116, flexShrink: 0 }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={116}
        thickness={5}
        sx={{ color: '#E2E8F0', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={116}
        thickness={5}
        sx={{
          color,
          position: 'absolute',
          '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 700,
            color,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </Typography>
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 600,
            color: 'text.secondary',
            mt: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          risk score
        </Typography>
      </Box>
    </Box>
  );
}

function RiskFlagCard({ flag }) {
  const meta = SEVERITY_META[flag.severity] ?? SEVERITY_META.LOW;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 2,
        borderRadius: 1.5,
        bgcolor: meta.background,
        border: `1px solid ${meta.border}`,
        borderLeft: `4px solid ${meta.color}`,
      }}
    >
      <WarningAmberOutlined sx={{ fontSize: 20, color: meta.color, mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" gapY={0.5}>
          <Chip
            label={meta.label}
            size="small"
            sx={{ bgcolor: meta.color, color: '#FFFFFF', fontWeight: 700, fontSize: 10.5, height: 22 }}
          />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
            {flag.ruleName}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.75 }}>
          {flag.message}
        </Typography>
      </Box>
    </Box>
  );
}

function StatusBanner({ result }) {
  const clean = result.status === 'CHECKED_CLEAN';
  const styles = clean
    ? {
        background: '#F0FDF4',
        border: '#BBF7D0',
        color: '#15803D',
        Icon: CheckCircleOutlined,
        title: 'This claim looks clean — ready to submit',
        subtitle: 'This claim passed every screening rule and is ready to be submitted to the insurer.',
      }
    : {
        background: '#FFFBEB',
        border: '#FDE68A',
        color: '#B45309',
        Icon: WarningAmberOutlined,
        title: 'Issues found — review before submitting',
        subtitle: `${result.riskFlags?.length ?? 0} issue(s) were detected. Review the items below before submitting.`,
      };
  const { Icon } = styles;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        p: 2.5,
        borderRadius: 1.5,
        bgcolor: styles.background,
        border: `1px solid ${styles.border}`,
      }}
    >
      <Icon sx={{ fontSize: 26, color: styles.color, flexShrink: 0, mt: 0.25 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: styles.color }}>
          {styles.title}
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.5 }}>
          {styles.subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

export default function RiskResultsPanel({ result, onEdit, onReset }) {
  const clean = result.status === 'CHECKED_CLEAN';
  const flags = result.riskFlags ?? [];
  const score = Math.max(0, Math.min(100, Math.round(result.riskScore ?? 0)));

  return (
    <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
      <StatusBanner result={result} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mt: 3.5 }}>
        <RiskGauge score={score} />
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Risk score {score}/100</Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            {clean
              ? 'No issues found across any screening rule.'
              : `ClaimGuard flagged ${flags.length} potential issue${
                  flags.length === 1 ? '' : 's'
                } that could lead to a denial.`}
          </Typography>
        </Box>
      </Box>

      {!clean && flags.length > 0 && (
        <>
          <Typography
            sx={{
              mt: 3.5,
              mb: 1.5,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'text.secondary',
            }}
          >
            Flagged issues
          </Typography>
          <Stack spacing={1.5}>
            {flags.map((flag) => (
              <RiskFlagCard key={flag.id} flag={flag} />
            ))}
          </Stack>
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        {clean ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<AddCircleOutlined />}
            onClick={onReset}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Create Another Claim
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="large"
            startIcon={<EditOutlined />}
            onClick={onEdit}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Edit claim details
          </Button>
        )}
      </Box>
    </Card>
  );
}
