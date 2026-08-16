import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS, ROLE_META } from '../../config/navigation';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_BG = '#0F172A';
const ACTIVE_BG = 'rgba(15, 118, 110, 0.15)';
const ACTIVE_BORDER = '#14B8A6';
const INACTIVE_TEXT = '#94A3B8';

function RoleBadge({ roleMeta }) {
  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.03em',
        lineHeight: 1.4,
        color: roleMeta.badgeText,
        bgcolor: roleMeta.badgeBg,
      }}
    >
      {roleMeta.label}
    </Typography>
  );
}

function SidebarContent({ navItems, roleMeta, user, initial, onNavigate, onLogoutClick }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: SIDEBAR_BG,
        color: '#FFFFFF',
      }}
    >
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1 }}>
          ClaimGuard
        </Typography>
        <Box sx={{ mt: 1, width: 28, height: 3, borderRadius: 999, bgcolor: ACTIVE_BORDER }} />
      </Box>

      <Box component="nav" sx={{ px: 2, pt: 1, flex: 1, overflowY: 'auto' }}>
        <List sx={{ p: 0 }}>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <NavLink to={item.path} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                {({ isActive }) => (
                  <ListItemButton
                    onClick={onNavigate}
                    sx={{
                      px: 1.5,
                      py: 0.875,
                      minHeight: 44,
                      borderRadius: 1,
                      borderLeft: `3px solid ${isActive ? ACTIVE_BORDER : 'transparent'}`,
                      backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                      color: isActive ? '#FFFFFF' : INACTIVE_TEXT,
                      transition:
                        'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
                      '&:hover': {
                        backgroundColor: isActive ? ACTIVE_BG : 'rgba(148, 163, 184, 0.1)',
                        color: isActive ? '#FFFFFF' : '#E2E8F0',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                      <item.icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'inherit' }}>
                      {item.label}
                    </Typography>
                  </ListItemButton>
                )}
              </NavLink>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box
        sx={{
          m: 2,
          mt: 1,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'rgba(20, 184, 166, 0.18)',
              color: '#2DD4BF',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                color: '#F1F5F9',
                fontSize: 13.5,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.username}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <RoleBadge roleMeta={roleMeta} />
            </Box>
          </Box>
          <Tooltip title="Log out">
            <IconButton
              onClick={onLogoutClick}
              size="small"
              aria-label="Log out"
              sx={{
                color: INACTIVE_TEXT,
                transition: 'color 200ms ease, background-color 200ms ease',
                '&:hover': {
                  color: '#FCA5A5',
                  backgroundColor: 'rgba(148, 163, 184, 0.12)',
                },
              }}
            >
              <LogoutOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const role = user?.role;
  const navItems = NAV_ITEMS[role] ?? [];
  const roleMeta = ROLE_META[role] ?? ROLE_META.ADMIN;
  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const openLogoutDialog = () => {
    setMenuAnchor(null);
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <SidebarContent
      navItems={navItems}
      roleMeta={roleMeta}
      user={user}
      initial={initial}
      onNavigate={() => setDrawerOpen(false)}
      onLogoutClick={openLogoutDialog}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0, width: SIDEBAR_WIDTH }}>
        <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH }}>
          {sidebar}
        </Box>
      </Box>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            bgcolor: SIDEBAR_BG,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          color="inherit"
          sx={{
            bgcolor: '#FFFFFF',
            color: 'text.primary',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 4 }, gap: 2 }}>
            <IconButton
              edge="start"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { md: 'none' }, color: 'text.primary', mr: 0.5 }}
            >
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>

            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  lineHeight: 1.2,
                }}
              >
                Clinic
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'text.primary',
                  lineHeight: 1.3,
                  maxWidth: { xs: 180, sm: 360 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.clinicName ?? 'ClaimGuard Clinic'}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Typography
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontSize: 13.5,
                color: 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {today}
            </Typography>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' }, my: 1 }}
            />

            <IconButton
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              size="small"
              aria-label="Account menu"
              sx={{
                p: 0.5,
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                transition: 'border-color 200ms ease',
                '&:hover': { borderColor: '#CBD5E1', backgroundColor: 'transparent' },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'rgba(15, 118, 110, 0.12)',
                  color: '#0F766E',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {initial}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: 2 } } }}
            >
              <Box sx={{ px: 2, py: 1.25 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
                  {user?.username}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <RoleBadge roleMeta={roleMeta} />
                </Box>
              </Box>
              <Divider />
              <MenuItem
                onClick={openLogoutDialog}
                sx={{ py: 1.25, gap: 1.5, color: 'text.primary', fontSize: 14 }}
              >
                <LogoutOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
          <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Log out of ClaimGuard?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            You will need to sign in again to access your clinic workspace.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setLogoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmLogout}>
            Log out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
