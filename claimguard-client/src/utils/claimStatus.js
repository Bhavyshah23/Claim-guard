export const CLAIM_STATUS_META = {
  DRAFT: { label: 'Draft', color: '#64748B', background: '#F1F5F9' },
  CHECKED_CLEAN: { label: 'Checked clean', color: '#16A34A', background: '#F0FDF4' },
  CHECKED_FLAGGED: { label: 'Checked — issues', color: '#DC2626', background: '#FEF2F2' },
  SUBMITTED: { label: 'Submitted', color: '#2563EB', background: '#EFF6FF' },
  DENIED: { label: 'Denied', color: '#DC2626', background: '#FEF2F2' },
  APPROVED: { label: 'Approved', color: '#16A34A', background: '#F0FDF4' },
};

export const CLAIM_STATUS_OPTIONS = Object.entries(CLAIM_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export function claimStatusMeta(status) {
  return CLAIM_STATUS_META[status] ?? { label: status, color: '#64748B', background: '#F1F5F9' };
}

export const EDITABLE_STATUSES = ['DRAFT', 'CHECKED_CLEAN', 'CHECKED_FLAGGED'];
