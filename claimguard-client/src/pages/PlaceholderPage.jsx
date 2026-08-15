import { Box, Card, Chip, Container, Typography } from '@mui/material';

const SEVERITY_TONES = ['high', 'medium', 'low', 'success', 'neutral'];

function getSeverityStyles(theme, tone) {
  const severity = theme.palette.severity;
  const key = SEVERITY_TONES.includes(tone) ? tone : 'neutral';
  return {
    color: severity[key],
    backgroundColor: severity[`${key}Background`],
  };
}

export default function PlaceholderPage({
  title,
  description,
  badgeLabel = 'Coming soon',
  badgeTone = 'neutral',
  children,
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ p: { xs: 4, sm: 7 }, textAlign: 'center' }}>
          <Chip
            label={badgeLabel}
            sx={(theme) => getSeverityStyles(theme, badgeTone)}
          />
          <Typography variant="h3" component="h1" sx={{ mt: 3 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1.5, maxWidth: 480, mx: 'auto' }}>
            {description}
          </Typography>
          {children}
        </Card>
      </Container>
    </Box>
  );
}
