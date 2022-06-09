/// <reference types="cypress" />

const BACKEND_SERVER = 'http://127.0.0.1:5000';
const API_ENDPOINTS = {
  upload: '/upload',
  predict: '/predict',
  download: '/download',
  getPlot: '/getplot',
};
const NO_FILE_CHOSEN = 'No file chosen';
const SOMETHING_WENT_WRONG = 'Something went very wrong! Please try again.';
const SAMPLE_CT_RAW = 'sample_ct.raw';
const SAMPLE_CT_MHD = 'sample_ct.mhd';
const PREDICTION_DATA = 'prediction_data.json';

const rawFileInput = '[data-testid="raw-file-input"]';
const mhdFileInput = '[data-testid="mhd-file-input"]';
const rawFileInputFilename = '[data-testid="raw-file-input-filename"]';
const mhdFileInputFilename = '[data-testid="mhd-file-input-filename"]';

const uploadBtn = '[data-testid="upload-btn"]';
const predictBtn = '[data-testid="predict-btn"]';
const downloadBtn = '[data-testid="download-btn"]';
const closeModalBtn = '[data-testid="close-modal-btn"]';

const appSnackbar = '[data-testid="app-snackbar"]';
const imagePlotModal = '[data-testid="image-plot-modal"]';
const imagePlotError = '[data-testid="image-plot-error"]';

const get_IRC_Coordinates = coordinates => {
  return `(
    ${coordinates.index},
    ${coordinates.row},
    ${coordinates.col}
  )`;
};

const get_XYZ_Coordinates = coordinates => {
  return `(
    ${coordinates.x.toFixed(2)},
    ${coordinates.y.toFixed(2)},
    ${coordinates.z.toFixed(2)}
  )`;
};

describe('home page', () => {
  beforeEach(() => {
    cy.intercept({
      method: 'POST',
      url: BACKEND_SERVER + API_ENDPOINTS.upload,
    }).as('uploadFiles');

    cy.intercept(
      {
        method: 'GET',
        url: BACKEND_SERVER + API_ENDPOINTS.predict,
      },
      { statusCode: 200, fixture: PREDICTION_DATA }
    ).as('predictData');

    cy.intercept({
      method: 'POST',
      url: BACKEND_SERVER + API_ENDPOINTS.getPlot,
    }).as('getPlot');
  });

  it('should upload raw and mhd files', () => {
    cy.visit('/');

    cy.get(rawFileInput).should('exist');
    cy.get(mhdFileInput).should('exist');

    cy.get(rawFileInputFilename).should('exist').and('have.text', NO_FILE_CHOSEN);
    cy.get(mhdFileInputFilename).should('exist').and('have.text', NO_FILE_CHOSEN);

    cy.get(uploadBtn).should('exist').and('have.text', 'Upload').and('be.disabled');
    cy.get(predictBtn).should('exist').and('have.text', 'Predict').and('be.disabled');

    cy.get(rawFileInput).attachFile(SAMPLE_CT_RAW);
    cy.get(mhdFileInput).attachFile(SAMPLE_CT_MHD);

    cy.get(rawFileInputFilename).should('have.text', SAMPLE_CT_RAW);
    cy.get(mhdFileInputFilename).should('have.text', SAMPLE_CT_MHD);

    cy.get(uploadBtn).should('not.be.disabled');
    cy.get(uploadBtn).click();

    cy.wait('@uploadFiles').then(intercepted => {
      if (intercepted.error) {
        cy.get(predictBtn).should('be.disabled');
        cy.get(appSnackbar).should(
          'have.text',
          'Error while uploading files. Please try again.'
        );
      } else {
        if (intercepted.response.statusCode === 200) {
          cy.get(predictBtn).should('not.be.disabled');

          cy.get(appSnackbar).should(
            'have.text',
            'Data uploaded to directory. Ready for inferencing!!'
          );
        } else if (intercepted.response.statusCode === 400) {
          cy.get(appSnackbar).should(
            'have.text',
            'Error while uploading files. Please try again.'
          );
          cy.get(predictBtn).should('be.disabled');
        }
      }
    });
  });

  it('should predict data and go to results page', () => {
    cy.visit('/');
    cy.get(rawFileInput).attachFile(SAMPLE_CT_RAW);
    cy.get(mhdFileInput).attachFile(SAMPLE_CT_MHD);

    cy.get(uploadBtn).click();
    cy.wait('@uploadFiles');

    cy.get(predictBtn).click();

    cy.wait('@predictData').then(intercepted => {
      if (intercepted.error) {
        cy.location('pathname').should('equal', '/');
        cy.get(appSnackbar).should('have.text', SOMETHING_WENT_WRONG);
      } else {
        if (intercepted.response.statusCode === 200) {
          cy.get(appSnackbar).should(
            'have.text',
            'Prediction results have been generated.'
          );
          cy.location('pathname').should('equal', '/results');
        } else if (intercepted.response.statusCode === 500) {
          cy.get(appSnackbar).should('have.text', SOMETHING_WENT_WRONG);
          cy.location('pathname').should('equal', '/');
        }
      }
    });

    cy.fixture(PREDICTION_DATA).then(data => {
      Object.values(data.results).forEach((nodule, index) => {
        cy.get(`[data-testid="nodule-probability_${index}"]`).should(
          'have.text',
          nodule.Nodule_Probability.toFixed(2)
        );
        cy.get(`[data-testid="malignancy-probability_${index}"]`).should(
          'have.text',
          nodule.Malignancy_Probability.toFixed(2)
        );
        cy.get(`[data-testid="xyz-coordinates_${index}"]`).should(
          'have.text',
          get_XYZ_Coordinates(nodule.XYZ_Coordinates)
        );
        cy.get(`[data-testid="irc-coordinates_${index}"]`).should(
          'have.text',
          get_IRC_Coordinates(nodule.IRC_Coordinates)
        );
        cy.get(`[data-testid="plot-nodules-btn_${index}"]`)
          .should('exist')
          .and('have.text', 'Plot Nodules');
      });
    });

    cy.get(downloadBtn).should('exist').and('have.text', 'Download Nodule Data');

    const noduleIndex = 0;
    cy.get(`[data-testid="plot-nodules-btn_${noduleIndex}"]`).click();
    cy.wait('@getPlot', { responseTimeout: 10000 }).then(intercepted => {
      if (intercepted.error) {
        cy.get(imagePlotError).should('exist').and('have.text', SOMETHING_WENT_WRONG);
      } else {
        if (intercepted.response.statusCode === 200) {
          cy.get(imagePlotError).should('not.exist');
          cy.get(`[data-testid="nodules-plot_${noduleIndex}"]`).should('exist');
        } else if (intercepted.response.statusCode === 500) {
          cy.get(imagePlotError).should('exist').and('have.text', SOMETHING_WENT_WRONG);
        }
      }
    });
    cy.get(imagePlotModal).should('exist');
    cy.get(closeModalBtn).should('exist');
    cy.get(closeModalBtn).click();
    cy.get(imagePlotModal).should('not.exist');
  });
});
