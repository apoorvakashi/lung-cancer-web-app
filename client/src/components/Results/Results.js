import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  API_ENDPOINTS,
  BACKEND_SERVER_BASE_URL,
  PENDING,
} from '../../constants/constants';
import { getImagePlot } from '../../store/reducers/predictionReducer';
import {
  selectImagePlot,
  selectPredictionData,
  selectPredictionStatus,
} from '../../store/selectors';
import Loading from '../Loading/Loading';
import ImagePlotModal from './ImagePlotModal';
import {
  downloadLinkStyle,
  resultsContainerStyle,
  resultsHeadingBoxStyle,
  tableHeaderCellStyle,
  tableHeaderRowStyle,
} from './ResultsStyle';

const render_IRC_Coordinates = coordinates => {
  return `(
    ${coordinates.index},
    ${coordinates.row},
    ${coordinates.col}
  )`;
};

const render_XYZ_Coordinates = coordinates => {
  return `(
    ${coordinates.x.toFixed(2)},
    ${coordinates.y.toFixed(2)},
    ${coordinates.z.toFixed(2)}
  )`;
};

const Results = () => {
  const dispatch = useDispatch();
  const predictionData = useSelector(selectPredictionData);
  const predictionStatus = useSelector(selectPredictionStatus);
  const imagePlot = useSelector(selectImagePlot);

  const [imagePlotModalOpen, setImagePlotModalOpen] = useState(false);
  const [noduleIndex, setNoduleIndex] = useState(0);

  const openImagePlotModal = () => {
    setImagePlotModalOpen(true);
  };

  const closeImagePlotModal = () => {
    setImagePlotModalOpen(false);
  };

  const handlePlotNodulesBtnClick = noduleIndex => {
    setNoduleIndex(noduleIndex);
    if (
      !imagePlot[`nodule_${noduleIndex}`] ||
      imagePlot[`nodule_${noduleIndex}`] === ''
    ) {
      dispatch(getImagePlot(noduleIndex));
    }
    openImagePlotModal();
  };

  return (
    <React.Fragment>
      <div style={resultsContainerStyle}>
        {predictionStatus === PENDING && <Loading />}
        {predictionData && predictionData.length > 0 ? (
          <React.Fragment>
            <Box sx={resultsHeadingBoxStyle}>
              <Typography variant="h4" color="primary">
                Nodule Predictions
              </Typography>
              <Button variant="contained" color="secondary" data-testid="download-btn">
                <Link
                  sx={downloadLinkStyle}
                  href={BACKEND_SERVER_BASE_URL + API_ENDPOINTS.download}
                  target="_self"
                >
                  Download Nodule Data
                </Link>
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={tableHeaderRowStyle}>
                  <TableRow>
                    <TableCell sx={tableHeaderCellStyle} align="center">
                      Index
                    </TableCell>
                    <TableCell sx={tableHeaderCellStyle} align="center">
                      Nodule Probability
                    </TableCell>
                    <TableCell sx={tableHeaderCellStyle} align="center">
                      Malignancy Probability
                    </TableCell>
                    <TableCell sx={tableHeaderCellStyle} align="center">
                      XYZ Coordinates
                    </TableCell>
                    <TableCell sx={tableHeaderCellStyle} align="center">
                      IRC Coordinates
                    </TableCell>
                    <TableCell sx={tableHeaderCellStyle} align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictionData.map((data, index) => (
                    <TableRow key={`prediction_nodule_${index}`}>
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell
                        align="center"
                        data-testid={`nodule-probability_${index}`}
                      >
                        {data.Nodule_Probability.toFixed(2)}
                      </TableCell>
                      <TableCell
                        align="center"
                        data-testid={`malignancy-probability_${index}`}
                      >
                        {data.Malignancy_Probability.toFixed(2)}
                      </TableCell>
                      <TableCell align="center" data-testid={`xyz-coordinates_${index}`}>
                        {render_XYZ_Coordinates(data.XYZ_Coordinates)}
                      </TableCell>
                      <TableCell align="center" data-testid={`irc-coordinates_${index}`}>
                        {render_IRC_Coordinates(data.IRC_Coordinates)}
                      </TableCell>
                      <TableCell>
                        <Button
                          data-testid={`plot-nodules-btn_${index}`}
                          variant="contained"
                          color="secondary"
                          onClick={() => {
                            handlePlotNodulesBtnClick(index);
                          }}
                        >
                          Plot Nodules
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </React.Fragment>
        ) : (
          <Alert severity="info">No Prediction Data Found.</Alert>
        )}
      </div>
      <ImagePlotModal
        open={imagePlotModalOpen}
        closeModal={closeImagePlotModal}
        noduleIndex={noduleIndex}
      />
    </React.Fragment>
  );
};

export default Results;
