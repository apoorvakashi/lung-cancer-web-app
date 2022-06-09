import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import React, { createRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FULFILLED, IDLE, PENDING, REJECTED } from '../../constants/constants';
import { uploadFiles } from '../../store/reducers/fileUploadReducer';
import { getPrediction } from '../../store/reducers/predictionReducer';
import { showSnackbar } from '../../store/reducers/snackbarReducer';
import {
  selectPredictionStatus,
  selectPredictionSuccessResponse,
  selectUploadStatus,
  selectUploadSuccessResponse,
} from '../../store/selectors';
import UploadButton from '../Button/UploadButton';
import Loading from '../Loading/Loading';
import {
  buttonsBoxStyle,
  buttonStyle,
  homeContainerStyle,
  loadingContainerStyle,
  noteTitleStyle,
  textStyle,
} from './HomeStyle';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const uploadStatus = useSelector(selectUploadStatus);
  const uploadSuccessResponse = useSelector(selectUploadSuccessResponse);

  const predictionStatus = useSelector(selectPredictionStatus);
  const predictionSuccessResponse = useSelector(selectPredictionSuccessResponse);

  const rawFileInputRef = createRef();
  const mhdFileInputRef = createRef();

  const [rawFileUploaded, setRawFileUploaded] = useState(false);
  const [mhdFileUploaded, setMhdFileUploaded] = useState(false);

  useEffect(() => {
    if (uploadStatus === FULFILLED && uploadSuccessResponse !== '') {
      dispatch(showSnackbar({ severity: 'success', message: uploadSuccessResponse }));
    } else if (uploadStatus === REJECTED) {
      dispatch(
        showSnackbar({
          severity: 'error',
          message: 'Error while uploading files. Please try again.',
        })
      );
    }
  }, [uploadStatus, uploadSuccessResponse]);

  useEffect(() => {
    if (predictionStatus === FULFILLED && predictionSuccessResponse !== '') {
      dispatch(showSnackbar({ severity: 'success', message: predictionSuccessResponse }));
      navigate('/results');
    } else if (predictionStatus === REJECTED) {
      dispatch(
        showSnackbar({
          severity: 'error',
          message: 'Error while predicting data. Please try again.',
        })
      );
    }
  }, [predictionStatus, predictionSuccessResponse]);

  const setFileChosenStatus = name => {
    if (name === 'rawfile') {
      setRawFileUploaded(true);
    } else if (name === 'mhdfile') {
      setMhdFileUploaded(true);
    }
  };

  const handleUploadBtnClick = () => {
    if (
      rawFileInputRef.current.files &&
      rawFileInputRef.current.files.length > 0 &&
      mhdFileInputRef.current.files &&
      mhdFileInputRef.current.files.length > 0
    ) {
      const data = new FormData();
      data.append('rawfile', rawFileInputRef.current.files[0]);
      data.append('mhdfile', mhdFileInputRef.current.files[0]);
      dispatch(uploadFiles(data));
    }
  };

  const handlePredictBtnClick = () => {
    if (
      uploadStatus === FULFILLED &&
      (predictionStatus === IDLE || predictionStatus === REJECTED)
    ) {
      dispatch(getPrediction());
      // navigate('/results');
    }
  };

  return (
    <div style={homeContainerStyle}>
      <Typography sx={textStyle}>
        This application takes 3D CT scans of human torsos as input and returns the
        location of the malignant nodules, if any exist.
      </Typography>
      <Typography sx={textStyle}>
        Input Format: RAW and MHD files of a CT scan.
      </Typography>
      <UploadButton
        ref={rawFileInputRef}
        label="Select RAW file"
        name="rawfile"
        fileExtension=".raw"
        setFileChosenStatus={setFileChosenStatus}
      />
      <UploadButton
        ref={mhdFileInputRef}
        label="Select MHD file"
        name="mhdfile"
        fileExtension=".mhd"
        setFileChosenStatus={setFileChosenStatus}
      />
      <Box sx={buttonsBoxStyle}>
        <Button
          sx={buttonStyle}
          variant="outlined"
          disabled={!rawFileUploaded || !mhdFileUploaded}
          onClick={handleUploadBtnClick}
        >
          Upload
        </Button>
        <Button
          sx={buttonStyle}
          variant="outlined"
          disabled={
            uploadStatus !== FULFILLED ||
            predictionStatus === PENDING ||
            predictionStatus === REJECTED
          }
          onClick={handlePredictBtnClick}
        >
          Predict
        </Button>
      </Box>
      {predictionStatus === PENDING && (
        <div style={loadingContainerStyle}>
          <Alert icon={false} severity="info">
            <AlertTitle sx={noteTitleStyle}>Note</AlertTitle>
            Relax while we generate the prediction results. Until then, please do not
            close this tab or refresh the page.
          </Alert>
          <Loading />
        </div>
      )}
    </div>
  );
};

export default Home;
