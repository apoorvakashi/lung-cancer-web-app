import { createSlice } from '@reduxjs/toolkit';

const INITIAL_STATE = {
  open: false,
  severity: 'info',
  message: '',
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState: INITIAL_STATE,
  reducers: {
    showSnackbar: (state, action) => {
      state.open = true;
      state.severity = action.payload.severity;
      state.message = action.payload.message;
    },
    hideSnackbar: state => {
      state.open = false;
      state.severity = 'info';
      state.message = '';
    },
  },
});

export const { showSnackbar, hideSnackbar } = snackbarSlice.actions;

export default snackbarSlice.reducer;
