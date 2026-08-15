import { createTheme } from '@mui/material/styles';

export const colors = {
  primary: '#0F766E',
  primaryHover: '#0D9488',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  hover: '#F1F5F9',
  divider: '#F1F5F9',
  severity: {
    high: '#DC2626',
    highBackground: '#FEF2F2',
    medium: '#D97706',
    mediumBackground: '#FFFBEB',
    low: '#CA8A04',
    lowBackground: '#FEFCE8',
    success: '#16A34A',
    successBackground: '#F0FDF4',
    neutral: '#64748B',
    neutralBackground: '#F1F5F9',
  },
};

const fontFamily = [
  'Inter',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(',');

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.border,
    severity: colors.severity,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily,
    h1: { fontWeight: 700, letterSpacing: '-0.025em', fontSize: '2rem' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', fontSize: '1.75rem' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em', fontSize: '1.5rem' },
    h4: { fontWeight: 600, letterSpacing: '-0.02em', fontSize: '1.25rem' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.125rem' },
    h6: { fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.005em' },
    subtitle1: { fontSize: 15, color: colors.textSecondary },
    subtitle2: { fontSize: 14, color: colors.textSecondary },
    body1: { fontSize: 15 },
    body2: { fontSize: 14 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
          fontFamily,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 14,
          lineHeight: '20px',
          padding: '8px 16px',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: 13,
        },
        sizeMedium: {
          minHeight: 40,
        },
        containedPrimary: {
          backgroundColor: colors.primary,
          '&:hover': {
            backgroundColor: colors.primaryHover,
          },
        },
        outlined: {
          borderColor: colors.border,
          color: colors.textPrimary,
          '&:hover': {
            borderColor: colors.borderHover,
            backgroundColor: colors.hover,
          },
        },
        text: {
          color: colors.primary,
          '&:hover': {
            backgroundColor: 'rgba(15, 118, 110, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 24,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.01em',
        },
        label: {
          paddingLeft: 10,
          paddingRight: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: 14,
            backgroundColor: colors.surface,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.borderHover,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
              borderWidth: 1.5,
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: 14,
          },
          '& .MuiFormHelperText-root': {
            marginLeft: 0,
            fontSize: 12,
            fontWeight: 500,
          },
        },
      },
    },
    MuiTable: {
      defaultProps: {
        size: 'medium',
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: colors.background,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.divider}`,
          fontVariantNumeric: 'tabular-nums',
          fontSize: 14,
        },
        head: {
          backgroundColor: colors.background,
          color: colors.textSecondary,
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.02em',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&[data-tabular="true"]': {
            fontVariantNumeric: 'tabular-nums',
          },
        },
      },
    },
  },
});

export default theme;
