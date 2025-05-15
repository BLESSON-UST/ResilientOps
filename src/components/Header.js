import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  List,
  ListItem,
  ListItemText,
  Divider,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { MenuOutlined, MenuOpenOutlined, Notifications, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import logo from '../images/ustlogowhite.png';
import SidebarFooterAccount from './SidebarFooterAccount';
import BASE_URL from '../ApiConfig/apiConfig';

const severityColor = (severity) => {
  switch (severity) {
    case 'Critical':
      return '#d32f2f';
    case 'Warning':
      return '#e1c515';
    case 'Info':
      return '#78bf35';
    default:
      return '#ccc';
  }
};

const Header = ({ collapsed, handleCollapse }) => {
  const [alerts, setAlerts] = useState([]);
  const [slaBreaches, setSlaBreaches] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Please log in to view notifications',
        severity: 'error',
      });
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUserRole(decodedToken.role || '');
    } catch (error) {
      console.error('Failed to decode token:', error);
      setSnackbar({
        open: true,
        message: 'Invalid token',
        severity: 'error',
      });
    }

    const fetchNotifications = async () => {
      try {
        const [servicesResponse, alertsResponse, breachesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/services`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/alerts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/alerts/sla_breaches`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const services = servicesResponse.data;
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filter alerts (unacknowledged) and breaches (last 24 hours)
        setAlerts(
          alertsResponse.data
            .filter((alert) => !alert.acknowledged)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
        setSlaBreaches(
          breachesResponse.data
            .filter((breach) => new Date(breach.created_at) >= oneDayAgo)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );

        // Create service_id to name map
        const serviceMap = {};
        services.forEach((svc) => {
          serviceMap[svc.id] = svc.name;
        });
        setServicesMap(serviceMap);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setSnackbar({
          open: true,
          message: 'Failed to load notifications',
          severity: 'error',
        });
      }
    };

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleAcknowledgeAlert = async (alertId) => {
    const token = sessionStorage.getItem('accessToken');
    try {
      await axios.put(
        `${BASE_URL}/alerts`,
        { id: alertId, acknowledged: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setSnackbar({
        open: true,
        message: 'Alert acknowledged',
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      setSnackbar({
        open: true,
        message: 'Failed to acknowledge alert',
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const notificationCount = alerts.length + slaBreaches.length;

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

      {/* Notifications and User Account Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={handleNotificationClick} sx={{ color: 'white' }}>
          <Badge badgeContent={notificationCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>
        <SidebarFooterAccount mini={false} />
      </Box>

      {/* Notification Dropdown */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box p={2}>
          <Typography variant="h6">Notifications</Typography>
          <List dense>
            {notificationCount === 0 ? (
              <ListItem>
                <ListItemText primary="No new notifications" />
              </ListItem>
            ) : (
              <>
                {alerts.map((alert) => (
                  <ListItem
                    key={`alert-${alert.id}`}
                    sx={{
                      bgcolor: severityColor(alert.severity),
                      borderRadius: 1,
                      mb: 1,
                      color: '#fff',
                    }}
                    secondaryAction={
                      userRole === 'Ops Analyst' && (
                        <IconButton
                          size="small"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          sx={{ color: '#006E74', '&:hover': { color: '#005a60' } }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={`${servicesMap[alert.service_id] || 'Unknown Service'}: ${alert.message}`}
                    />
                  </ListItem>
                ))}
                {alerts.length > 0 && slaBreaches.length > 0 && <Divider sx={{ my: 1 }} />}
                {slaBreaches.map((breach) => (
                  <ListItem
                    key={`breach-${breach.id}`}
                    sx={{
                      bgcolor: '#e1c515',
                      borderRadius: 1,
                      mb: 1,
                      color: '#fff',
                    }}
                  >
                    <ListItemText
                      primary={`${servicesMap[breach.service_id] || 'Unknown Service'}: ${breach.reason}`}
                    />
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </Box>
      </Menu>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Header;