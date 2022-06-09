import React from 'react';
import { FadeLoader } from 'react-spinners';
import classes from './Loading.module.css';

const Loading = () => {
  return (
    <div className={classes.loading}>
      <FadeLoader size={60} color="#15133c" />
    </div>
  );
};

export default Loading;
