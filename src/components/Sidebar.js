import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
} from "@mui/material";
import { Home, Dashboard, ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom"; // Import useLocation hook for detecting the active route
import SidebarFooterAccount from "./SidebarFooterAccount";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const Sidebar = ({ collapsed }) => {
  const location = useLocation(); // Get the current location (active route)
  const [openDropdown, setOpenDropdown] = useState(false); // State for dropdown menu

  const handleDropdownToggle = () => {
    setOpenDropdown(!openDropdown); // Toggle dropdown menu
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: collapsed ? 80 : 250, // Change width based on collapse state
          backgroundColor: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          p: 2,
          position: "sticky",
          top: 0,
          transition: "width 0.3s", // Smooth transition for width change
          paddingTop: "40px", // To avoid overlap with the fixed button
        }}
      >
        {/* Sidebar List */}
        <List>

          <ListItem
            button
            component={Link}
            to="/db4"
            sx={{
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              },
              transition: "all 0.3s ease",
              backgroundColor:
                location.pathname === "/db4"
                  ? "rgba(173, 216, 230, 0.3)"
                  : "transparent",
              borderRadius: location.pathname === "/db4" ? "12px" : "0px",
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === "/db4" ? "#1E90FF" : "#808080",
                minWidth: "35px",
              }}
            >
              <Dashboard />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Dashboard" />}
          </ListItem>

          <ListItem
  button
  component={Link}
  to="/settings"
  sx={{
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.08)",
      borderRadius: "12px",
    },
    transition: "all 0.3s ease",
    backgroundColor:
      location.pathname === "/settings"
        ? "rgba(173, 216, 230, 0.3)"
        : "transparent",
    borderRadius: location.pathname === "/settings" ? "12px" : "0px",
  }}
>
  <ListItemIcon
    sx={{
      color: location.pathname === "/settings" ? "#1E90FF" : "#808080",
      minWidth: "35px",
    }}
  >
    <SettingsOutlinedIcon />
  </ListItemIcon>
  {!collapsed && <ListItemText primary="Settings" />}
</ListItem>




        </List>
       
        {/* <SidebarFooterAccount mini={collapsed} /> */}
      </Box>
    </Box>
  );
};

export default Sidebar;
