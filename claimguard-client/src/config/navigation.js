import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';

export const NAV_ITEMS = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: DashboardOutlined },
    { label: 'Claims', path: '/admin/claims', icon: AssignmentOutlined },
    { label: 'Staff Management', path: '/admin/staff', icon: GroupOutlined },
    { label: 'Rule Configuration', path: '/admin/rules', icon: RuleOutlined },
  ],
  DOCTOR: [
    { label: 'My Claims', path: '/doctor/my-claims', icon: AssignmentIndOutlined },
    { label: 'All Claims', path: '/doctor/claims', icon: AssignmentOutlined },
  ],
  BILLING_STAFF: [
    { label: 'New Claim', path: '/billing/new-claim', icon: AddCircleOutlined },
    { label: 'All Claims', path: '/billing/claims', icon: AssignmentOutlined },
  ],
};

export const ROLE_META = {
  ADMIN: {
    label: 'Admin',
    badgeText: '#2DD4BF',
    badgeBg: 'rgba(20, 184, 166, 0.16)',
  },
  DOCTOR: {
    label: 'Doctor',
    badgeText: '#60A5FA',
    badgeBg: 'rgba(59, 130, 246, 0.16)',
  },
  BILLING_STAFF: {
    label: 'Billing Staff',
    badgeText: '#C084FC',
    badgeBg: 'rgba(168, 85, 247, 0.16)',
  },
};
