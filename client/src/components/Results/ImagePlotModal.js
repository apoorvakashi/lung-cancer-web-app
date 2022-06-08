import { Alert, Grid, IconButton, Modal, Paper, Typography } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { selectImagePlot, selectImagePlotStatus } from '../../store/selectors';
import { imageContainerStyle, imageStyle, paperStyle } from './ImagePlotModalStyle';
import { FULFILLED, PENDING, REJECTED } from '../../constants/constants';

const ImagePlotModal = props => {
  const { open, closeModal, noduleIndex } = props;
  const imagePlotStatus = useSelector(selectImagePlotStatus);
  const imagePlot = useSelector(selectImagePlot);

  return (
    <Modal open={open} onClose={closeModal}>
      <Paper sx={paperStyle}>
        <Grid container spacing={2}>
          <Grid item sm={11}>
            <Typography variant="h5" color="primary">
              Nodule Slices
            </Typography>
          </Grid>
          <Grid item sm={1}>
            <IconButton onClick={closeModal}>
              <AiOutlineCloseCircle size="1.5em" color="#15133C" />
            </IconButton>
          </Grid>
          <Grid item sm={12} sx={imageContainerStyle}>
            {imagePlotStatus === PENDING && <div>Loading...</div>}
            {imagePlotStatus === REJECTED && (
              <Alert severity="error">Something went wrong! Please try again.</Alert>
            )}
            {imagePlotStatus === FULFILLED && imagePlot[`nodule_${noduleIndex}`] && (
              <img
                style={imageStyle}
                src={`data:image/png;base64,${imagePlot[`nodule_${noduleIndex}`]}`}
                alt={`image_plot_nodule_${noduleIndex}`}
              />
            )}
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  );
};

ImagePlotModal.propTypes = {
  open: PropTypes.bool,
  closeModal: PropTypes.func,
  noduleIndex: PropTypes.number,
};

export default ImagePlotModal;
