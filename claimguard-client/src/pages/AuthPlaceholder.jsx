import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function AuthPlaceholder({ mode }) {
  const isLogin = mode === 'login';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        backgroundColor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: { xs: 4, sm: 5 } }}>
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            ClaimGuard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Insurance claim pre-screening for small medical clinics
          </Typography>
        </Stack>

        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', mt: 5 }}>
          <Chip label="Coming soon" sx={(theme) => ({
            color: theme.palette.severity.neutral,
            backgroundColor: theme.palette.severity.neutralBackground,
          })} />
          <Typography variant="h6">
            {isLogin ? 'Sign in to ClaimGuard' : 'Create your clinic'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {isLogin
              ? 'Authentication is being set up. Check back shortly.'
              : 'Clinic registration is being set up. Check back shortly.'}
          </Typography>

          <Button variant="outlined" component={Link} to={isLogin ? '/register' : '/login'} sx={{ alignSelf: 'stretch' }}>
            {isLogin ? 'Go to registration' : 'Go to sign in'}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
