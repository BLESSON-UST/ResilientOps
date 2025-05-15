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
import { Home, Dashboard, ExpandLess, ExpandMore, HistoryOutlined } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import SidebarFooterAccount from "./SidebarFooterAccount";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(false);

  const handleDropdownToggle = () => {
    setOpenDropdown(!openDropdown);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Box
        sx={{
          width: collapsed ? 80 : 250,
          backgroundColor: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          p: 2,
          position: "sticky",
          top: 0,
          transition: "width 0.3s",
          paddingTop: "40px",
        }}
      >
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
            to="/logs"
            sx={{
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              },
              transition: "all 0.3s ease",
              backgroundColor:
                location.pathname === "/logs"
                  ? "rgba(173, 216, 230, 0.3)"
                  : "transparent",
              borderRadius: location.pathname === "/logs" ? "12px" : "0px",
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === "/logs" ? "#1E90FF" : "#808080",
                minWidth: "35px",
              }}
            >
              <HistoryOutlined />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Logs" />}
          </ListItem>

        </List>
        {/* <SidebarFooterAccount mini={collapsed} /> */}
      </Box>
    </Box>
  );
};

export default Sidebar;