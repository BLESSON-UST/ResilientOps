
import React from 'react';
import { Box, Stack, IconButton, Menu, MenuItem, Typography, Tooltip } from '@mui/material';
import { AccountCircle, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const SidebarFooterAccount = ({ mini }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  
  // Get and decode JWT token
  let username = 'User';
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username || decoded.name || decoded.sub || 'User';
    } catch (error) {
      console.error('Failed to decode token:', error);
      // Optional: Redirect to login if token is invalid
      // navigate('/login');
    }
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('accessToken'); // Also clear token
    window.location.reload();
  };

  const handleProfileNavigation = () => {
    navigate('/profile');
    handleClose();
  };

  const handleMyAccountNavigation = () => {
    navigate('/account');
    handleClose();
  };

  return (
    <Box sx={{ mt: 'auto', p: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={mini ? 'center' : 'space-between'}
        sx={{
          flexDirection: mini ? 'column' : 'row',
          alignItems: 'center',
        }}
      >
        {!mini && (
          <Typography
            variant="body1"
            fontWeight="bold"
            sx={{
              color: 'white',
              marginLeft: 1,
              marginTop: '4px',
            }}
          >
            {username}
          </Typography>
        )}
        <Tooltip title={mini ? username : ''} placement="top">
          <IconButton onClick={handleClick} sx={{ color: 'white' }}>
            <AccountCircle fontSize="large" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{
            sx: {
              minWidth: 200,
              padding: 1,
            },
          }}
        >
          <MenuItem onClick={handleLogout}>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              Logout
            </Typography>
            <LogoutIcon sx={{ marginLeft: 1 }} />
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
};

export default SidebarFooterAccount;
