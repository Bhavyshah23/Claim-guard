import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import LocalHospitalOutlined from '@mui/icons-material/LocalHospitalOutlined';

export const NAV_ITEMS = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: DashboardOutlined },
    { label: 'Patients', path: '/admin/patients', icon: PeopleOutlined },
    { label: 'Insurers', path: '/admin/insurers', icon: AccountBalanceOutlined },
    { label: 'Codes', path: '/admin/codes', icon: LocalHospitalOutlined },
    { label: 'Claims', path: '/admin/claims', icon: AssignmentOutlined },
    { label: 'Staff Management', path: '/admin/staff', icon: GroupOutlined },
    { label: 'Rule Configuration', path: '/admin/rules', icon: RuleOutlined },
  ],
  DOCTOR: [
    { label: 'My Claims', path: '/doctor/my-claims', icon: AssignmentIndOutlined },
    { label: 'Patients', path: '/doctor/patients', icon: PeopleOutlined },
    { label: 'All Claims', path: '/doctor/claims', icon: AssignmentOutlined },
  ],
  BILLING_STAFF: [
    { label: 'Queue', path: '/billing', end: true, icon: ViewKanbanOutlined },
    { label: 'New Claim', path: '/billing/new-claim', icon: AddCircleOutlined },
    { label: 'All Claims', path: '/billing/claims', icon: AssignmentOutlined },
    { label: 'Screening Rules', path: '/billing/rules', icon: RuleOutlined },
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
