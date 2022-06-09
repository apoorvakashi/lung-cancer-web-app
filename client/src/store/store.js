import { configureStore } from '@reduxjs/toolkit';
import fileUploadReducer from './reducers/fileUploadReducer';
import predictionReducer from './reducers/predictionReducer';
import snackbarReducer from './reducers/snackbarReducer';

const store = configureStore({
  reducer: {
    snackbar: snackbarReducer,
    upload: fileUploadReducer,
    prediction: predictionReducer,
  },
});

export default store;
