import React from 'react';
import { Box, Stack, IconButton, Menu, MenuItem, Typography, Tooltip } from '@mui/material';
import { AccountCircle, MoreVert, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SidebarFooterAccount = ({ mini, username = 'User Name' }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn'); // Remove login status
    window.location.reload(); // Reload the page to reset state
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
              marginLeft: 1, // Space between icon and text
              marginTop: '4px', // Moves text slightly down
            }}
          >
            {username}
          </Typography>
        )}
        {/* Account Icon */}
        <Tooltip title={mini ? username : ''} placement="top">
          <IconButton onClick={handleClick} sx={{ color: 'white' }}>
            <AccountCircle fontSize="large" />
          </IconButton>
        </Tooltip>


        {/* Account Options Menu */}
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
          <MenuItem onClick={handleProfileNavigation}>
            <Typography variant="body1">Profile</Typography>
          </MenuItem>
          <MenuItem onClick={handleMyAccountNavigation}>
            <Typography variant="body1">My Account</Typography>
          </MenuItem>
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
