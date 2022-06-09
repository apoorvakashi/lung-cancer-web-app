import { AppBar, Link, Toolbar, Typography } from '@mui/material';
import React from 'react';
import { REPOSITORY_LINK } from '../../constants/constants';
import { appBarStyle, toolbarStyle } from './FooterStyle';

const Footer = () => {
  return (
    <AppBar component="footer" sx={appBarStyle}>
      <Toolbar sx={toolbarStyle}>
        <Typography>2022 &#169; ISE-B14-2022 Team</Typography>
        <Link color="primary.contrastText" href={REPOSITORY_LINK} target="_blank">
          Repository Link
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default Footer;
