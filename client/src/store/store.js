import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import fileUploadReducer from './reducers/fileUploadReducer';
import predictionReducer from './reducers/predictionReducer';
import snackbarReducer from './reducers/snackbarReducer';

const reducer = combineReducers({
  snackbar: snackbarReducer,
  upload: fileUploadReducer,
  prediction: predictionReducer,
});

const store = configureStore({
  middleware: getDefaultMiddleWare => {
    return getDefaultMiddleWare({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    });
  },
  reducer: reducer,
});

export const persistor = persistStore(store);

export default store;
