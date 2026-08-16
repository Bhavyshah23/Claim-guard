import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { formatDate } from '../../utils/dates';
import { SEVERITY_META } from '../../utils/severity';

const STATUS_META = {
  DRAFT: { label: 'Draft', color: '#64748B', background: '#F1F5F9' },
  CHECKED_CLEAN: { label: 'Checked clean', color: '#16A34A', background: '#F0FDF4' },
  CHECKED_FLAGGED: { label: 'Checked — issues', color: '#DC2626', background: '#FEF2F2' },
  SUBMITTED: { label: 'Submitted', color: '#2563EB', background: '#EFF6FF' },
  DENIED: { label: 'Denied', color: '#DC2626', background: '#FEF2F2' },
  APPROVED: { label: 'Approved', color: '#16A34A', background: '#F0FDF4' },
};

const SEVERITY_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function highestSeverityFlag(flags) {
  return flags.reduce(
    (highest, flag) =>
      SEVERITY_ORDER[flag.severity] > SEVERITY_ORDER[highest.severity] ? flag : highest,
    flags[0]
  );
}

function RiskFlagRow({ flags }) {
  if (!flags || flags.length === 0) return null;
  const meta = SEVERITY_META[highestSeverityFlag(flags).severity] ?? SEVERITY_META.LOW;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        mt: 1.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: meta.background,
        color: meta.color,
      }}
    >
      <WarningAmberOutlined sx={{ fontSize: 16 }} />
      <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
        {flags.length} issue{flags.length === 1 ? '' : 's'} flagged
      </Typography>
    </Box>
  );
}

function DetailRow({ code, description, category }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', minWidth: 0 }}>
      <Typography
        sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
      >
        {code}
      </Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{description}</Typography>
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

function DetailSection({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'text.secondary',
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Stack spacing={0.75}>
        {items.map((item) => (
          <DetailRow key={`${item.code}-${item.description}`} {...item} />
        ))}
      </Stack>
    </Box>
  );
}

function RiskFlagDetail({ flag }) {
  const meta = SEVERITY_META[flag.severity] ?? SEVERITY_META.LOW;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        p: 1.5,
        mb: 1,
        borderRadius: 1,
        bgcolor: meta.background,
        border: `1px solid ${meta.border}`,
      }}
    >
      <WarningAmberOutlined sx={{ fontSize: 18, color: meta.color, mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={meta.label}
            size="small"
            sx={{ bgcolor: meta.color, color: '#FFFFFF', fontSize: 10.5, fontWeight: 700, height: 20 }}
          />
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{flag.ruleName}</Typography>
        </Stack>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
          {flag.message}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ClaimCard({ claim, confirmed = false, onConfirm, muted = false }) {
  const [expanded, setExpanded] = useState(false);

  const status = STATUS_META[claim.status] ?? { label: claim.status, color: '#64748B', background: '#F1F5F9' };
  const flags = claim.riskFlags ?? [];
  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <Card
      sx={{
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
        ...(muted ? { borderColor: '#F1F5F9', boxShadow: 'none' } : {}),
      }}
    >
      <Box
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpanded();
          }
        }}
        aria-expanded={expanded}
        sx={{ cursor: 'pointer', p: { xs: 2.5, sm: 3 }, pb: 2.5, outline: 'none' }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1.5}
          flexWrap="wrap"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 16.5, fontWeight: 600, color: 'text.primary' }}>
              {claim.patientName}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
              {formatDate(claim.dateOfService)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={status.label}
              size="small"
              sx={{ bgcolor: status.background, color: status.color, fontWeight: 700 }}
            />
            {confirmed && <CheckCircleOutlined sx={{ fontSize: 18, color: '#16A34A' }} />}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2, rowGap: 1 }}
        >
          <Chip
            label={claim.insurerName}
            size="small"
            variant="outlined"
            sx={{ borderColor: '#E2E8F0', color: 'text.secondary' }}
          />
          {(claim.diagnosisCodes ?? []).map((diagnosis) => (
            <Tooltip key={diagnosis.id} title={diagnosis.description} arrow>
              <Chip
                label={diagnosis.code}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#CBD5E1',
                  color: 'text.primary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </Tooltip>
          ))}
          {(claim.procedureCodes ?? []).map((procedure) => (
            <Tooltip key={procedure.procedureCodeId} title={procedure.description} arrow>
              <Chip
                label={`${procedure.code}${procedure.modifier ? `-${procedure.modifier}` : ''}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#CBD5E1',
                  color: 'text.primary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </Tooltip>
          ))}
        </Stack>

        <RiskFlagRow flags={flags} />
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 3, pt: 2.5, borderTop: '1px solid #F1F5F9' }}>
          <DetailSection
            label="Diagnosis codes"
            items={(claim.diagnosisCodes ?? []).map((item) => ({
              code: item.code,
              description: item.description,
              category: item.category,
            }))}
          />
          <DetailSection
            label="Procedure codes"
            items={(claim.procedureCodes ?? []).map((item) => ({
              code: `${item.code}${item.modifier ? `-${item.modifier}` : ''}`,
              description: item.description,
            }))}
          />
          {flags.length > 0 && (
            <Box>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  mb: 1,
                }}
              >
                Risk flags
              </Typography>
              {flags.map((flag) => (
                <RiskFlagDetail key={flag.id} flag={flag} />
              ))}
            </Box>
          )}
        </Box>
      </Collapse>

      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          pb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Button size="small" onClick={toggleExpanded} sx={{ color: 'text.secondary' }}>
          <ExpandMoreIcon
            sx={{
              fontSize: 18,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
          {expanded ? 'Less details' : 'View details'}
        </Button>
        {onConfirm && (
          <Button
            variant="contained"
            size="small"
            startIcon={<FactCheckOutlined />}
            onClick={() => onConfirm(claim)}
          >
            Confirm
          </Button>
        )}
      </Box>
    </Card>
  );
}
