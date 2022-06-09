import { Alert, Snackbar } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Footer from './components/Common/Footer';
import Header from './components/Common/Header';
import Home from './components/Home/Home';
import Main from './components/Main/Main';
import Results from './components/Results/Results';
import Team from './components/Team/Team';
import { hideSnackbar } from './store/reducers/snackbarReducer';
import { selectSnackbar } from './store/selectors';

function App() {
  const dispatch = useDispatch();
  const snackbar = useSelector(selectSnackbar);

  const handleSnackbarClose = () => {
    dispatch(hideSnackbar());
  };

  return (
    <React.Fragment>
      <Header />
      <Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/results" element={<Results />} />
          <Route
            path="/*"
            element={
              <Alert severity="error">The page you were looking for was not found.</Alert>
            }
          />
        </Routes>
      </Main>
      <Footer />
      <Snackbar
        open={snackbar.open}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
}

export default App;
