import { createTheme, alpha } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    viavel: Palette['primary']
    parcial: Palette['primary']
    inviavel: Palette['primary']
  }
  interface PaletteOptions {
    viavel?: PaletteOptions['primary']
    parcial?: PaletteOptions['primary']
    inviavel?: PaletteOptions['primary']
  }
}

export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },

  palette: {
    mode: 'light',
    primary: {
      main: '#1B4FD8',
      light: '#3B6EF0',
      dark: '#1238A8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0EA472',
      light: '#2EBF8D',
      dark: '#087A54',
      contrastText: '#ffffff',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    success: {
      main: '#16A34A',
      light: '#22C55E',
      dark: '#15803D',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
    viavel: {
      main: '#16A34A',
      light: '#DCFCE7',
      dark: '#15803D',
      contrastText: '#ffffff',
    },
    parcial: {
      main: '#D97706',
      light: '#FEF3C7',
      dark: '#B45309',
      contrastText: '#ffffff',
    },
    inviavel: {
      main: '#DC2626',
      light: '#FEE2E2',
      dark: '#B91C1C',
      contrastText: '#ffffff',
    },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 4px rgba(0,0,0,0.08)',
    '0 2px 8px rgba(0,0,0,0.10)',
    '0 4px 12px rgba(0,0,0,0.10)',
    '0 4px 16px rgba(0,0,0,0.12)',
    '0 8px 24px rgba(0,0,0,0.12)',
    '0 12px 32px rgba(0,0,0,0.12)',
    '0 16px 40px rgba(0,0,0,0.12)',
    '0 20px 48px rgba(0,0,0,0.12)',
    '0 24px 56px rgba(0,0,0,0.12)',
    '0 28px 64px rgba(0,0,0,0.12)',
    '0 32px 72px rgba(0,0,0,0.12)',
    '0 36px 80px rgba(0,0,0,0.12)',
    '0 40px 88px rgba(0,0,0,0.12)',
    '0 44px 96px rgba(0,0,0,0.12)',
    '0 48px 104px rgba(0,0,0,0.12)',
    '0 52px 112px rgba(0,0,0,0.12)',
    '0 56px 120px rgba(0,0,0,0.12)',
    '0 60px 128px rgba(0,0,0,0.12)',
    '0 64px 136px rgba(0,0,0,0.12)',
    '0 68px 144px rgba(0,0,0,0.12)',
    '0 72px 152px rgba(0,0,0,0.12)',
    '0 76px 160px rgba(0,0,0,0.12)',
    '0 80px 168px rgba(0,0,0,0.12)',
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: `
        * { box-sizing: border-box; }
        body { background-color: #F1F5F9; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiDataGrid: {
      defaultProps: { density: 'comfortable' },
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 12,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: alpha('#1B4FD8', 0.04),
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', fontWeight: 500 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          color: '#0F172A',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F172A',
          color: '#F1F5F9',
          borderRight: 'none',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
      },
    },
  },
})
