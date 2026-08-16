import { Box, Stack, Typography } from '@mui/material';
import { CheckCircle, HealthAndSafety } from '@mui/icons-material';

const VALUE_POINTS = [
  {
    title: 'Data-driven rules engine',
    description: 'Claims are screened against clinical and billing rules automatically.',
  },
  {
    title: 'Built for small clinics',
    description: 'No enterprise bloat — set up in minutes and get to work.',
  },
  {
    title: 'Reduce denials before submission',
    description: 'Catch errors while they are still easy to fix.',
  },
];

export default function AuthLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: '#FFFFFF',
          p: { md: 6, lg: 8 },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <HealthAndSafety sx={{ fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            ClaimGuard
          </Typography>
        </Stack>

        <Box sx={{ maxWidth: 440 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.025em' }}>
            Catch claim errors before they cost you.
          </Typography>
          <Typography sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.85)', fontSize: 15 }}>
            ClaimGuard pre-screens insurance claims before submission, so your clinic
            catches rule violations while they are still easy to fix.
          </Typography>

          <Stack spacing={3} sx={{ mt: 5 }}>
            {VALUE_POINTS.map((point) => (
              <Stack key={point.title} direction="row" spacing={2}>
                <CheckCircle sx={{ color: '#FFFFFF', mt: 0.25, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: 15 }}>
                    {point.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, mt: 0.25 }}>
                    {point.description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
          Clinical-grade software for patient data you can trust.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#FFFFFF',
          p: { xs: 3, sm: 5 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', display: { xs: 'flex', md: 'none' }, mb: 4 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: '#FFFFFF',
              }}
            >
              <HealthAndSafety sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              ClaimGuard
            </Typography>
          </Stack>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
