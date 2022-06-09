import { Typography } from '@mui/material';
import React from 'react';
import { APP_HEADER } from '../../constants/constants';
import Loading from './Loading';
import classes from './SplashScreen.module.css';

const SplashScreen = () => {
  return (
    <div className={classes['splash-screen']}>
      <Typography variant="h4" color="primary.main">
        {APP_HEADER}
      </Typography>
      <Loading />
    </div>
  );
};

export default SplashScreen;
