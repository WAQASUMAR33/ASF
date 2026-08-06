'use client';

import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e5631',
      light: '#2e7d48',
      dark: '#1b4d2e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2d6a4f',
      light: '#386641',
      dark: '#1b4332',
      contrastText: '#ffffff',
    },
    background: {
      default: 'transparent',
      paper: '#ffffff',
    },
    text: {
      primary: '#191c1a',
      secondary: '#56615b',
    },
    error: {
      main: '#c0392b',
    },
    success: {
      main: '#1e5631',
    },
    warning: {
      main: '#d97706',
    },
    info: {
      main: '#2980b9',
    },
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
          fontWeight: 700,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(30, 86, 49, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '0px !important',
          border: '1px solid #e0e2db',
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e0e2db',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
          backgroundColor: '#f5f5f3',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e0e2db',
            borderRadius: '0px !important',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1e5631',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1e5631',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
          fontWeight: 700,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '0px !important',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
