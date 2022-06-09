import React from 'react';
import { AppBar, Button, Grid, Link, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  appBarStyle,
  headerButtonContainerStyle,
  linkStyle,
  toolbarStyle,
} from './HeaderStyle';

const Header = () => {
  return (
    <AppBar sx={appBarStyle}>
      <Toolbar sx={toolbarStyle}>
        <Grid container spacing={2}>
          <Grid item sm={10}>
            <Link to="/" component={RouterLink} sx={linkStyle}>
              <Typography variant="h5">Early Detection of Lung Cancer</Typography>
            </Link>
          </Grid>
          <Grid item sm={2} sx={headerButtonContainerStyle}>
            <Button href="/" variant="filled" color="secondary">
              Predict
            </Button>
            <Button href="/team" variant="filled" color="secondary">
              Team
            </Button>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
