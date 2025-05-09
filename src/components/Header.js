import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { MenuOutlined, MenuOpenOutlined } from '@mui/icons-material';
import logo from '../images/ustlogowhite.png';
import SidebarFooterAccount from './SidebarFooterAccount';

const Header = ({ collapsed, handleCollapse }) => {
  return (
    <Box
      sx={{
        backgroundColor: '#006E74',
        color: 'black',
        padding: '0 px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Menu Toggle Icon */}
        <IconButton
          onClick={handleCollapse}
          sx={{
            marginRight: 2,
            color: 'white',
            width: 40,
            height: 40,
          }}
        >
          {collapsed ? <MenuOutlined /> : <MenuOpenOutlined />}
        </IconButton>

        <img
          src={logo}
          alt="UST Logo"
          style={{
            width: 35,
            height: 35,
            marginRight: 8,
          }}
        />
      </Box>
      
      {/* User Account Section */}
      <SidebarFooterAccount mini={false} />
    </Box>
  );
};

export default Header;
