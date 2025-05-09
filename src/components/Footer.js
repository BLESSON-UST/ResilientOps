import React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'white', padding: '10px 0' }}>
      <Typography variant="body2" color="text.secondary" align="center">
        {' Confidential and Proprietary. ©  '}
        {new Date().getFullYear()}
        {' UST Global Inc.'}
      </Typography>
    </footer>
  );
};

export default Footer;
