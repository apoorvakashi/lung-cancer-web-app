import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';
import api from '../../api/api';
import {
  API_ENDPOINTS,
  FULFILLED,
  IDLE,
  PENDING,
  REJECTED,
} from '../../constants/constants';

const INITIAL_STATE = {
  data: {},
  predictionSuccessResponse: '',
  predictionStatus: IDLE,
  predictionError: null,
  imagePlot: {},
  imagePlotStatus: IDLE,
  imagePlotError: null,
};

const predictionSlice = createSlice({
  name: 'prediction',
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getImagePlot.pending, state => {
        state.imagePlotStatus = PENDING;
      })
      .addCase(getImagePlot.fulfilled, (state, action) => {
        state.imagePlotStatus = FULFILLED;
        state.imagePlot = {
          ...state.imagePlot,
          [action.payload.nodule]: [action.payload.data],
        };
      })
      .addCase(getImagePlot.rejected, (state, action) => {
        state.imagePlotStatus = REJECTED;
        state.imagePlotError = action.error;
      })
      .addCase(getPrediction.pending, state => {
        state.predictionStatus = PENDING;
      })
      .addCase(getPrediction.fulfilled, (state, action) => {
        state.predictionStatus = FULFILLED;
        state.predictionSuccessResponse = action.payload.message;
        state.data = action.payload.results;
      })
      .addCase(getPrediction.rejected, (state, action) => {
        state.predictionStatus = REJECTED;
        state.predictionError = action.error;
      });
  },
});

export const getImagePlot = createAsyncThunk(
  'prediction/getNodulePlot',
  async noduleIndex => {
    const response = await api.post(API_ENDPOINTS.getPlot, { id: noduleIndex });
    return {
      nodule: `nodule_${noduleIndex}`,
      data: response.data,
    };
  }
);

export const getPrediction = createAsyncThunk('prediction/getPrediction', async () => {
  const response = await api.get(API_ENDPOINTS.predict);
  return response.data;
});

const PERSIST_CONFIG = {
  key: 'prediction',
  version: 1,
  storage: storage,
  stateReconciler: autoMergeLevel2,
  whitelist: ['data'],
  blacklist: [
    'predictionSuccessResponse',
    'predictionStatus',
    'predictionError',
    'imagePlot',
    'imagePlotStatus',
    'imagePlotError',
  ],
};

const predictionReducer = persistReducer(PERSIST_CONFIG, predictionSlice.reducer);

export default predictionReducer;
