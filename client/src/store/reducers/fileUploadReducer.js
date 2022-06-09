import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';
import {
  API_ENDPOINTS,
  FULFILLED,
  IDLE,
  PENDING,
  REJECTED,
} from '../../constants/constants';

const INITIAL_STATE = {
  status: IDLE,
  successResponse: '',
  error: null,
};

const fileUploadSlice = createSlice({
  name: 'upload',
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(uploadFiles.pending, state => {
        state.status = PENDING;
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.status = FULFILLED;
        state.successResponse = action.payload.message;
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.status = REJECTED;
        state.error = action.error;
      });
  },
});

export const uploadFiles = createAsyncThunk('upload/uploadFiles', async data => {
  const response = await api.post(API_ENDPOINTS.upload, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
});

export default fileUploadSlice.reducer;
