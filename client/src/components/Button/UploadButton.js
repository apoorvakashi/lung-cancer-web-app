import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography } from '@mui/material';
import { BiUpload } from 'react-icons/bi';
import {
  filenameStyle,
  uploadButtonBoxStyle,
  uploadButtonStyle,
} from './UploadButtonStyle';

const UploadButton = React.forwardRef((props, ref) => {
  const { label, name, fileExtension, setFileChosenStatus } = props;

  const [filename, setFilename] = useState('');

  const handleFileInputChange = event => {
    if (!event.target.files) {
      return;
    }

    setFileChosenStatus(event.target.name);
    const file = event.target.files[0];
    setFilename(file.name);
  };

  return (
    <Box sx={uploadButtonBoxStyle}>
      <Button
        component="label"
        startIcon={<BiUpload />}
        sx={uploadButtonStyle}
        variant="contained"
      >
        {label}
        <input
          ref={ref}
          data-testid={props['data-testid']}
          hidden
          type="file"
          name={name}
          accept={fileExtension}
          onChange={handleFileInputChange}
        />
      </Button>
      <Typography
        component="span"
        sx={filenameStyle}
        data-testid={`${props['data-testid']}-filename`}
      >
        {filename === '' ? 'No file chosen' : filename}
      </Typography>
    </Box>
  );
});

UploadButton.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  fileExtension: PropTypes.string,
  setFileChosenStatus: PropTypes.func,
  'data-testid': PropTypes.string,
};

export default UploadButton;
