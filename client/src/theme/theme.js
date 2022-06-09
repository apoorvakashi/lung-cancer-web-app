import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      light: '#434263',
      main: '#15133c',
      dark: '#0e0d2a',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#efad6f',
      main: '#ec994b',
      dark: '#a56b34',
      contrastText: '#0e0d2a',
    },
    background: {
      paper: '#eeeeee',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'capitalize',
        },
      },
    },
  },
});

export default theme;
