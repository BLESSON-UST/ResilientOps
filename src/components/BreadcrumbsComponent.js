import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';

const BreadcrumbsComponent = () => {
  const location = useLocation();  // Get the current location
  const path = location.pathname.split('/').filter(Boolean); // Split the path to get individual parts

  // Custom breadcrumb labels for paths
  const breadcrumbLabels = {
    home: 'Home',
    file: 'File Upload',
    rm: 'Route Map',
    dashboard: 'Dashboard',
    db4: 'Dashboard ',
    km: 'Key Metrics',
    upload: 'Assessment'
    // Add more custom labels as needed
  };

  // Handle breadcrumb items to display only "Home" once
  const breadcrumbItems = path.map((segment, index) => {
    const isLastItem = index === path.length - 1;
    const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1); // Default to segment name if no custom label

    return isLastItem ? (
      <Typography key={segment} sx={{ color: "#000000" }}>
        {label}
      </Typography>
    ) : (
      <Link key={segment} to={`/${path.slice(0, index + 1).join('/')}`}
      >
        {label}
       
      </Link>
    );
  });

  return (
    <Breadcrumbs aria-label="breadcrumb" separator=">" sx={{ paddingLeft: 2, }}>
    {/* Only show the Home link if we're not on the home page */}
    {location.pathname !== '/home' && (
      <Link to="/db4" style={{ color: "#828282" }}>Home</Link>
    )}

    {/* Show breadcrumbItems only if we're not on the home page */}
    {location.pathname !== '/db4' && breadcrumbItems}
  </Breadcrumbs>
  );
};

export default BreadcrumbsComponent;
