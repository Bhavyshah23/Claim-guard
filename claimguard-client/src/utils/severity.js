// Shared severity language so the insurer note banner and the risk flag
// cards visually connect — insurer-specific quirks are exactly the kind of
// thing the risk check surfaces.
export const SEVERITY_META = {
  HIGH: { color: '#DC2626', background: '#FEF2F2', border: '#FECACA', label: 'High' },
  MEDIUM: { color: '#D97706', background: '#FFFBEB', border: '#FCD34D', label: 'Medium' },
  LOW: { color: '#CA8A04', background: '#FEFCE8', border: '#FDE68A', label: 'Low' },
};

export function riskScoreColor(score) {
  if (score < 30) return '#16A34A';
  if (score < 60) return '#D97706';
  return '#DC2626';
}
