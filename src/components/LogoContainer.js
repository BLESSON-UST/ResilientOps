import React from 'react';
import './LogoContainer.css';
import { Typography } from '@mui/material';

const LogoContainer = ({ logo }) => {
  return (
    <div className="logo-item">
      <img src={logo} alt="UST Logo" className="logo" />
      <Typography variant="h5" className="logo-text">
        ResilientOps
      </Typography>
    </div>
  );
};

export default LogoContainer;
