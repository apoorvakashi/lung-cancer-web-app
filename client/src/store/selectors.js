export const selectUploadStatus = state => state.upload.status;
export const selectUploadSuccessResponse = state => state.upload.successResponse;

export const selectSnackbar = state => state.snackbar;

export const selectPredictionData = state => {
  if (state.prediction.data && Object.keys(state.prediction.data).length > 0) {
    return Object.values(state.prediction.data);
  }
  return [];
};
export const selectPredictionStatus = state => state.prediction.predictionStatus;
export const selectPredictionSuccessResponse = state =>
  state.prediction.predictionSuccessResponse;

export const selectImagePlot = state => state.prediction.imagePlot;
export const selectImagePlotStatus = state => state.prediction.imagePlotStatus;
