import React from 'react';
import { AppBar, Grid, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  appBarStyle,
  headerLinkContainerStyle,
  linkStyle,
  linkTextStyle,
  linkTextStyle2,
  toolbarStyle,
} from './HeaderStyle';
import { APP_HEADER } from '../../constants/constants';

const Header = () => {
  return (
    <AppBar sx={appBarStyle}>
      <Toolbar sx={toolbarStyle}>
        <Grid container spacing={2} alignItems="center">
          <Grid item sm={10}>
            <RouterLink to="/" style={linkStyle}>
              <Typography sx={linkTextStyle} component="span">
                {APP_HEADER}
              </Typography>
            </RouterLink>
          </Grid>
          <Grid item sm={2} sx={headerLinkContainerStyle}>
            <RouterLink to="/" style={linkStyle}>
              <Typography sx={linkTextStyle2} component="span">
                Predict
              </Typography>
            </RouterLink>
            <RouterLink to="/team" style={linkStyle}>
              <Typography sx={linkTextStyle2} component="span">
                Team
              </Typography>
            </RouterLink>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
