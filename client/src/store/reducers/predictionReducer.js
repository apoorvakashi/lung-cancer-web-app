import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';
import { FULFILLED, IDLE, PENDING, REJECTED } from '../../constants/constants';

const INITIAL_STATE = {
  data: {
    0: {
      IRC_Coordinates: { col: 31, index: 41, row: 180 },
      Malignancy_Probability: 0.9550638794898987,
      Nodule_Probability: 0.9999810457229614,
      XYZ_Coordinates: {
        x: -174.48671735902406,
        y: -57.89058208465576,
        z: -232.709991,
      },
    },
    1: {
      IRC_Coordinates: { col: 28, index: 42, row: 184 },
      Malignancy_Probability: 0.866930365562439,
      Nodule_Probability: 0.9983554482460022,
      XYZ_Coordinates: {
        x: -176.7718743242798,
        y: -54.843706130981445,
        z: -230.209991,
      },
    },
    2: {
      IRC_Coordinates: { col: 86, index: 42, row: 297 },
      Malignancy_Probability: 0.4061785042285919,
      Nodule_Probability: 0.9887092709541321,
      XYZ_Coordinates: {
        x: -132.5921729960022,
        y: 31.230539560317993,
        z: -230.209991,
      },
    },
    3: {
      IRC_Coordinates: { col: 130, index: 52, row: 375 },
      Malignancy_Probability: 0.08192909508943558,
      Nodule_Probability: 0.9577417373657227,
      XYZ_Coordinates: {
        x: -99.07653750558472,
        y: 90.64462065696716,
        z: -205.209991,
      },
    },
  },
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
    const response = await api.post('/getplot', { id: noduleIndex });
    return {
      nodule: `nodule_${noduleIndex}`,
      data: response.data,
    };
  }
);

export const getPrediction = createAsyncThunk('prediction/getPrediction', async () => {
  const response = await api.get('/predict');
  return response.data;
});

export default predictionSlice.reducer;
