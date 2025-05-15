import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BASE_URL from '../ApiConfig/apiConfig';
import axios from "axios";
import jwtDecode from "jwt-decode";

const riskColor = (risk) => {
  switch (risk) {
    case "Low":
      return "#78bf35";
    case "Medium":
      return "#e1c515";
    case "High":
      return "#f57c00";
    case "Critical":
      return "#d32f2f";
    default:
      return "#ccc";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [servicesList, setServicesList] = useState([]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("");
  const [selectedCards, setSelectedCards] = useState([]);
  const [verifiedServices, setVerifiedServices] = useState({});
  const [userRole, setUserRole] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      setSnackbar({
        open: true,
        message: "Please log in to view the dashboard",
        severity: "error",
      });
      navigate("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUserRole(decodedToken.role || "");
    } catch (error) {
      console.error("Failed to decode token:", error);
      setSnackbar({
        open: true,
        message: "Invalid token",
        severity: "error",
      });
    }

    const fetchServicesAndRisks = async () => {
      try {
        const servicesResponse = await axios.get(`${BASE_URL}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const services = servicesResponse.data;

        const servicesWithRisk = await Promise.all(
          services.map(async (svc) => {
            try {
              const riskResponse = await axios.get(`${BASE_URL}/risk/${svc.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const risk = riskResponse.data;
              return {
                id: svc.id,
                name: svc.name,
                status: svc.status || "Unknown",
                risk: risk.risk_level || "Unknown",
                rto: svc.bia?.rto ? `${svc.bia.rto} minutes` : "N/A",
                dependencies: svc.bia?.dependencies?.length || 0,
                verified: false,
                type: "core",
                last_updated: svc.last_updated || null,
              };
            } catch (error) {
              return {
                id: svc.id,
                name: svc.name,
                status: svc.status || "Unknown",
                risk: "Unknown",
                rto: svc.bia?.rto ? `${svc.bia.rto} minutes` : "N/A",
                dependencies: svc.bia?.dependencies?.length || 0,
                verified: false,
                type: "core",
                last_updated: svc.last_updated || null,
              };
            }
          })
        );

        setServicesList(servicesWithRisk);
        const verifiedMap = {};
        servicesWithRisk.forEach((svc) => {
          verifiedMap[svc.id] = svc.verified;
        });
        setVerifiedServices(verifiedMap);
      } catch (err) {
        console.error("Failed to fetch services or risks:", err);
        setSnackbar({
          open: true,
          message: "Failed to load dashboard data",
          severity: "error",
        });
      }
    };

    fetchServicesAndRisks();

    const interval = setInterval(() => {
      fetchServicesAndRisks();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [navigate]);

  const toggleVerification = (id) => {
    setVerifiedServices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSelectCard = (id) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteClick = (svc) => {
    setServiceToDelete(svc);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await axios.delete(`${BASE_URL}/services`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
        data: { id: serviceToDelete.id },
      });

      setServicesList((prev) => prev.filter((svc) => svc.id !== serviceToDelete.id));
      setSelectedCards((prev) => prev.filter((id) => id !== serviceToDelete.id));
      setVerifiedServices((prev) => {
        const newVerified = { ...prev };
        delete newVerified[serviceToDelete.id];
        return newVerified;
      });

      setSnackbar({
        open: true,
        message: `Service ${serviceToDelete.name} deleted successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to delete service:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete service",
        severity: "error",
      });
    }

    setOpenDeleteDialog(false);
    setServiceToDelete(null);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setServiceToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredServices = selectedRiskLevel
    ? servicesList.filter((s) => s.risk === selectedRiskLevel)
    : servicesList;

  return (
    <Box p={3} sx={{ bgcolor: "white", minHeight: "100vh" }}>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Service Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Risk Level</InputLabel>
            <Select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              label="Risk Level"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Service Cards Grid */}
      <Grid container spacing={3}>
        {userRole === "Business Owner" && (
          <Grid item xs={12} sm={6} md={3} display="flex" justifyContent="center">
            <Card
              onClick={() => navigate("/new")}
              sx={{
                width: 300,
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "2px dashed #e0e0e0",
                borderRadius: 2,
                transition: "background-color 0.2s",
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <AddIcon sx={{ fontSize: 60, color: "#666" }} />
            </Card>
          </Grid>
        )}

        {filteredServices.map((svc) => (
          <Grid item xs={12} sm={6} md={3} key={svc.id} display="flex" justifyContent="center">
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ width: 300, height: 9, bgcolor: riskColor(svc.risk), mb: 0 , borderRadius: 2,}} />
              <Card
                onClick={() => navigate(`/service/${svc.id}/view`, { state: { service: svc } })}
                sx={{
                  width: 300,
                  height: 300,
                  position: "relative",
                  borderRadius: 2,
                  boxShadow: 3,
                  bgcolor: selectedCards.includes(svc.id) ? "#f0f0f0" : "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                <Checkbox
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<CheckCircleIcon />}
                  size="small"
                  sx={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}
                  checked={selectedCards.includes(svc.id)}
                  onChange={() => toggleSelectCard(svc.id)}
                />
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    justifyContent: "space-between",
                    p: 2,
                  }}
                >
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {svc.name}
                    </Typography>
                  </Box>
                  <Box sx={{ fontSize: 14, mb: 1 }}>
                    <Typography>Status: {svc.status}</Typography>
                    <Typography>Risk: {svc.risk}</Typography>
                    <Typography>RTO: {svc.rto}</Typography>
                    <Typography>Dependencies: {svc.dependencies}</Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption">
                      Last updated: {svc.last_updated ? new Date(svc.last_updated).toLocaleDateString() : "N/A"}
                    </Typography>
                    <Box>
                     
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the service <strong>{serviceToDelete?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            sx={{ color: "#006E74" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;