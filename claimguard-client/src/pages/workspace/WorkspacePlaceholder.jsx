import { Box, Card, Typography } from '@mui/material';
import ConstructionOutlined from '@mui/icons-material/ConstructionOutlined';
import PageHeader from '../../components/layout/PageHeader';

export default function WorkspacePlaceholder({ title, subtitle, description }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: { xs: 6, md: 10 },
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(15, 118, 110, 0.08)',
            color: '#0F766E',
          }}
        >
          <ConstructionOutlined sx={{ fontSize: 26 }} />
        </Box>
        <Typography sx={{ mt: 2.5, fontSize: 16, fontWeight: 600, color: 'text.primary' }}>
          Coming soon
        </Typography>
        <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 14, maxWidth: 420 }}>
          {description}
        </Typography>
      </Card>
    </>
  );
}
