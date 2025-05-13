import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import axios from "axios";
import jwt_decode from "jwt-decode";
import BASE_URL from "../ApiConfig/apiConfig";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState(null);
  const [downtime, setDowntime] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [openBiaDialog, setOpenBiaDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openDowntimeDialog, setOpenDowntimeDialog] = useState(false);
  const [openRiskDialog, setOpenRiskDialog] = useState(false);
  const [openIntegrationDialog, setOpenIntegrationDialog] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    id: "",
    name: "",
    description: "",
  });
  const [biaForm, setBiaForm] = useState({
    criticality: "",
    impact: "",
    rto: "",
    rpo: "",
    signed_off: false,
    dependencies: [],
  });
  const [statusForm, setStatusForm] = useState({ status: "" });
  const [downtimeForm, setDowntimeForm] = useState({
    start_time: "",
    end_time: "",
    reason: "",
  });
  const [riskForm, setRiskForm] = useState({
    risk_score: "",
    risk_level: "",
    reason: "",
  });
  const [integrationForm, setIntegrationForm] = useState({
    service_id: id,
    type: "",
    config: "",
  });
  const [allServices, setAllServices] = useState([]);

  // Fetch all services for dependency dropdown
  const fetchAllServices = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllServices(response.data.filter((svc) => svc.id !== Number(id)));
    } catch (error) {
      console.error("Error fetching all services:", error);
    }
  };

  // Fetch service details
  const fetchServiceDetail = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const services = response.data;
      const selectedService = services.find((svc) => svc.id === Number(id));
      setService(selectedService);

      if (selectedService) {
        setServiceForm({
          id: selectedService.id,
          name: selectedService.name || "",
          description: selectedService.description || "",
        });
        setBiaForm({
          criticality: selectedService.bia?.criticality || "",
          impact: selectedService.bia?.impact || "",
          rto: selectedService.bia?.rto || "",
          rpo: selectedService.bia?.rpo || "",
          signed_off: selectedService.bia?.signed_off || false,
          dependencies: selectedService.bia?.dependencies || [],
        });
        setStatusForm({ status: selectedService.status || "" });
        setIntegrationForm({ service_id: id, type: "", config: "" });
      }

      if (userRole === "Ops Analyst") {
        fetchRiskDetails(selectedService.id);
        fetchDowntimeDetails(selectedService.id);
      } else if (userRole === "Engineer") {
        fetchDependencies();
        fetchIntegrations();
      } else if (userRole === "Business Owner") {
        fetchRiskDetails(selectedService.id);
      }
    } catch (error) {
      console.error("Error fetching service details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch risk details
  const fetchRiskDetails = async (serviceId) => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/risk/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRisk(response.data);
      setRiskForm({
        risk_score: response.data.risk_score || "",
        risk_level: response.data.risk_level || "",
        reason: response.data.reason || "",
      });
    } catch (error) {
      console.error("Error fetching risk details:", error);
    }
  };

  // Fetch downtime details
  const fetchDowntimeDetails = async (serviceId) => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services/${serviceId}/downtime`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDowntime(response.data.downtimes);
    } catch (error) {
      console.error("Error fetching downtime details:", error);
    }
  };

  // Fetch dependencies for the current service
  const fetchDependencies = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services/dependencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serviceDependencies = response.data.dependencies.find(
        (dep) => dep.service_id === Number(id)
      );
      setDependencies(serviceDependencies ? serviceDependencies.dependencies : []);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  // Fetch integrations
  const fetchIntegrations = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services/integrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIntegrations(response.data.filter((int) => int.service_id === Number(id)));
    } catch (error) {
      console.error("Error fetching integrations:", error);
    }
  };

  // Decode JWT to get user role
  const fetchUserRole = () => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Error decoding JWT token:", error);
      }
    }
  };

  // Handle form input changes
  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBiaFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBiaForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDowntimeFormChange = (e) => {
    const { name, value } = e.target;
    setDowntimeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRiskFormChange = (e) => {
    const { name, value } = e.target;
    setRiskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIntegrationFormChange = (e) => {
    const { name, value } = e.target;
    setIntegrationForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle dependency selection
  const handleDependencyChange = (e) => {
    const value = e.target.value;
    setBiaForm((prev) => ({ ...prev, dependencies: value }));
  };

  // Handle service update submission
  const handleServiceUpdate = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.put(`${BASE_URL}/services`, serviceForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenServiceDialog(false);
      fetchServiceDetail();
      alert("Service updated successfully");
    } catch (error) {
      console.error("Error updating service:", error);
      alert("Failed to update service");
    }
  };

  // Handle BIA update submission
  const handleBiaUpdate = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.put(`${BASE_URL}/services/${id}/bia`, biaForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenBiaDialog(false);
      fetchServiceDetail();
      alert("BIA updated successfully");
    } catch (error) {
      console.error("Error updating BIA:", error);
      alert("Failed to update BIA");
    }
  };

  // Handle status update submission
  const handleStatusUpdate = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.put(`${BASE_URL}/services/${id}/status`, statusForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenStatusDialog(false);
      fetchServiceDetail();
      alert("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  // Handle downtime submission
  const handleDowntimeSubmit = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const payload = {
        start_time: downtimeForm.start_time,
        end_time: downtimeForm.end_time || null,
        reason: downtimeForm.reason || "Not specified",
      };
      await axios.post(`${BASE_URL}/services/${id}/downtime`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenDowntimeDialog(false);
      setDowntimeForm({ start_time: "", end_time: "", reason: "" });
      fetchDowntimeDetails(id);
      alert("Downtime logged successfully");
    } catch (error) {
      console.error("Error logging downtime:", error);
      alert("Failed to log downtime");
    }
  };

  // Handle automated risk submission
  const handleAutomatedRiskSubmit = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.post(`${BASE_URL}/risk/${id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenRiskDialog(false);
      fetchRiskDetails(id);
      alert("Automated risk score saved successfully");
    } catch (error) {
      console.error("Error saving automated risk:", error);
      alert("Failed to save automated risk");
    }
  };

  // Handle manual risk update submission
  const handleManualRiskUpdate = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const payload = {
        risk_score: parseInt(riskForm.risk_score),
        risk_level: riskForm.risk_level,
        reason: riskForm.reason || "",
      };
      await axios.put(`${BASE_URL}/risk/${id}/manual`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenRiskDialog(false);
      fetchRiskDetails(id);
      alert("Risk score updated successfully");
    } catch (error) {
      console.error("Error updating risk:", error);
      alert("Failed to update risk");
    }
  };

  // Handle integration submission
  const handleIntegrationSubmit = async () => {
    try {
      // Validate config as JSON
      let configObj;
      try {
        configObj = JSON.parse(integrationForm.config);
      } catch (error) {
        alert("Invalid JSON format for config. Please provide a valid JSON object.");
        return;
      }

      const token = sessionStorage.getItem("accessToken");
      const payload = {
        service_id: parseInt(id),
        type: integrationForm.type,
        config: configObj, // Send parsed JSON object
      };
      await axios.post(`${BASE_URL}/services/integrations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenIntegrationDialog(false);
      setIntegrationForm({ service_id: id, type: "", config: "" });
      fetchIntegrations();
      alert("Integration added successfully");
    } catch (error) {
      console.error("Error adding integration:", error);
      alert("Failed to add integration");
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchServiceDetail();
      if (userRole === "Business Owner") {
        fetchAllServices();
      }
    }
  }, [userRole, id]);

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!service) {
    return (
      <Box p={4}>
        <Typography variant="h6" color="error">
          Service not found
        </Typography>
        <Button onClick={() => navigate("/db4")} variant="outlined">
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4} width="100%" sx={{ textAlign: "left" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/db4")}
        variant="outlined"
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      {/* Business Owner Rendering */}
      {userRole === "Business Owner" && service && (
        <>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {service.name}
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Service Information
                </Typography>
                <IconButton
                  onClick={() => setOpenServiceDialog(true)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>ID:</strong> {service.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {service.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {service.description}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" gutterBottom>
                  <strong>Status:</strong> {service.status}
                </Typography>
                <IconButton
                  onClick={() => setOpenStatusDialog(true)}
                  color="primary"
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Last Updated:</strong> {service.last_updated || "N/A"}
              </Typography>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  BIA Information
                </Typography>
                <IconButton
                  onClick={() => setOpenBiaDialog(true)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Criticality:</strong> {service.bia?.criticality || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Impact:</strong> {service.bia?.impact || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>RTO:</strong> {service.bia?.rto || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>RPO:</strong> {service.bia?.rpo || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Signed Off:</strong> {service.bia?.signed_off ? "Yes" : "No"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Dependencies:</strong> {service.bia?.dependencies?.join(", ") || "None"}
              </Typography>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Level
              </Typography>
              {risk ? (
                <Typography variant="body1" gutterBottom>
                  <strong>Risk Level:</strong> {risk.risk_level}
                </Typography>
              ) : (
                <Typography variant="body1">No risk level available.</Typography>
              )}
            </CardContent>
          </Card>

          {/* Service Update Dialog */}
          <Dialog open={openServiceDialog} onClose={() => setOpenServiceDialog(false)}>
            <DialogTitle>Update Service</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Name"
                name="name"
                value={serviceForm.name}
                onChange={handleServiceFormChange}
                fullWidth
                required
              />
              <TextField
                margin="dense"
                label="Description"
                name="description"
                value={serviceForm.description}
                onChange={handleServiceFormChange}
                fullWidth
                multiline
                rows={4}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenServiceDialog(false)}>Cancel</Button>
              <Button onClick={handleServiceUpdate} variant="contained">
                Update
              </Button>
            </DialogActions>
          </Dialog>

          {/* BIA Update Dialog */}
          <Dialog open={openBiaDialog} onClose={() => setOpenBiaDialog(false)}>
            <DialogTitle>Update BIA</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Criticality"
                name="criticality"
                value={biaForm.criticality}
                onChange={handleBiaFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Impact"
                name="impact"
                value={biaForm.impact}
                onChange={handleBiaFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="RTO (Recovery Time Objective)"
                name="rto"
                type="number"
                value={biaForm.rto}
                onChange={handleBiaFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="RPO (Recovery Point Objective)"
                name="rpo"
                type="number"
                value={biaForm.rpo}
                onChange={handleBiaFormChange}
                fullWidth
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Dependencies</InputLabel>
                <Select
                  multiple
                  name="dependencies"
                  value={biaForm.dependencies}
                  onChange={handleDependencyChange}
                  renderValue={(selected) =>
                    selected
                      .map((id) => allServices.find((svc) => svc.id === id)?.name)
                      .join(", ")
                  }
                >
                  {allServices.map((svc) => (
                    <MenuItem key={svc.id} value={svc.id}>
                      {svc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    name="signed_off"
                    checked={biaForm.signed_off}
                    onChange={handleBiaFormChange}
                  />
                }
                label="Signed Off"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenBiaDialog(false)}>Cancel</Button>
              <Button onClick={handleBiaUpdate} variant="contained">
                Update
              </Button>
            </DialogActions>
          </Dialog>

          {/* Status Update Dialog */}
          <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
            <DialogTitle>Update Status</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Status"
                name="status"
                value={statusForm.status}
                onChange={handleStatusFormChange}
                fullWidth
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
              <Button onClick={handleStatusUpdate} variant="contained">
                Update
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Ops Analyst Rendering */}
      {userRole === "Ops Analyst" && service && (
        <>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {service.name}
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {service.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {service.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Criticality:</strong> {service.bia?.criticality || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Impact:</strong> {service.bia?.impact || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {service.status}
              </Typography>
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Risk Details
                </Typography>
                <IconButton
                  onClick={() => setOpenRiskDialog(true)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              {risk ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Risk Score:</strong> {risk.risk_score}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Risk Level:</strong> {risk.risk_level}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Reason:</strong> {risk.reason}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Source:</strong> {risk.source}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Created By:</strong> {risk.created_by}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Created At:</strong> {new Date(risk.created_at).toLocaleString()}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1">No risk details available.</Typography>
              )}
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Downtime Details
                </Typography>
                <IconButton
                  onClick={() => setOpenDowntimeDialog(true)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              {downtime.every((dt) => Object.keys(dt).length !== 0) && downtime.length > 0 ? (
                downtime.map((dt, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Start Time:</strong> {new Date(dt.start_time).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>End Time:</strong> {dt.end_time ? new Date(dt.end_time).toLocaleString() : "Ongoing"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Reason:</strong> {dt.reason}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Duration:</strong> {dt.duration}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Total Minutes:</strong> {dt.total_minutes}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1">No downtime details available.</Typography>
              )}
            </CardContent>
          </Card>

          {/* Downtime Log Dialog */}
          <Dialog open={openDowntimeDialog} onClose={() => setOpenDowntimeDialog(false)}>
            <DialogTitle>Log Downtime</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Start Time (YYYY-MM-DDTHH:MM:SS)"
                name="start_time"
                value={downtimeForm.start_time}
                onChange={handleDowntimeFormChange}
                fullWidth
                required
                placeholder="2025-05-14T00:00:00"
              />
              <TextField
                margin="dense"
                label="End Time (YYYY-MM-DDTHH:MM:SS, optional)"
                name="end_time"
                value={downtimeForm.end_time}
                onChange={handleDowntimeFormChange}
                fullWidth
                placeholder="2025-05-14T01:00:00"
              />
              <TextField
                margin="dense"
                label="Reason"
                name="reason"
                value={downtimeForm.reason}
                onChange={handleDowntimeFormChange}
                fullWidth
                multiline
                rows={4}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDowntimeDialog(false)}>Cancel</Button>
              <Button onClick={handleDowntimeSubmit} variant="contained">
                Log Downtime
              </Button>
            </DialogActions>
          </Dialog>

          {/* Risk Update Dialog */}
          <Dialog open={openRiskDialog} onClose={() => setOpenRiskDialog(false)}>
            <DialogTitle>Risk Management</DialogTitle>
            <DialogContent>
              <Box mb={2}>
                <Button
                  onClick={handleAutomatedRiskSubmit}
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  Calculate and Save Automated Risk
                </Button>
              </Box>
              {risk ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Update Risk
                  </Typography>
                  <TextField
                    margin="dense"
                    label="Risk Score"
                    name="risk_score"
                    type="number"
                    value={riskForm.risk_score}
                    onChange={handleRiskFormChange}
                    fullWidth
                    required
                  />
                  <TextField
                    margin="dense"
                    label="Risk Level"
                    name="risk_level"
                    value={riskForm.risk_level}
                    onChange={handleRiskFormChange}
                    fullWidth
                    required
                  />
                  <TextField
                    margin="dense"
                    label="Reason"
                    name="reason"
                    value={riskForm.reason}
                    onChange={handleRiskFormChange}
                    fullWidth
                    multiline
                    rows={4}
                  />
                </>
              ) : (
                <Typography variant="body1">
                  No risk record available to update. Use automated risk calculation.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenRiskDialog(false)}>Cancel</Button>
              {risk && (
                <Button onClick={handleManualRiskUpdate} variant="contained">
                  Update Risk
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Engineer Rendering */}
      {userRole === "Engineer" && service && (
        <>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {service.name}
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {service.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {service.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Criticality:</strong> {service.bia?.criticality || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Impact:</strong> {service.bia?.impact || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {service.status}
              </Typography>
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dependent Services
              </Typography>
              {dependencies.length > 0 ? (
                dependencies.map((dep, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Service Name:</strong> {dep.service_name}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Service ID:</strong> {dep.service_id}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Criticality:</strong> {dep.criticality || "N/A"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Impact:</strong> {dep.impact || "N/A"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>RTO:</strong> {dep.rto || "N/A"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>RPO:</strong> {dep.rpo || "N/A"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Status:</strong> {dep.status || "N/A"}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1">No dependent services available.</Typography>
              )}
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Integrations
                </Typography>
                <IconButton
                  onClick={() => setOpenIntegrationDialog(true)}
                  color="primary"
                >
                  <AddCircleIcon />
                </IconButton>
              </Box>
              {integrations.length > 0 ? (
                integrations.map((int, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Type:</strong> {int.type}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Config:</strong> {JSON.stringify(int.config, null, 2)}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Created By:</strong> {int.created_by}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Created At:</strong> {new Date(int.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1">No integrations available.</Typography>
              )}
            </CardContent>
          </Card>

          {/* Integration Add Dialog */}
          <Dialog open={openIntegrationDialog} onClose={() => setOpenIntegrationDialog(false)}>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Service ID"
                name="service_id"
                value={integrationForm.service_id}
                fullWidth
                disabled
              />
              <TextField
                margin="dense"
                label="Type"
                name="type"
                value={integrationForm.type}
                onChange={handleIntegrationFormChange}
                fullWidth
                required
                placeholder="e.g., Slack, AWS"
              />
              <TextField
                margin="dense"
                label="Config (JSON)"
                name="config"
                value={integrationForm.config}
                onChange={handleIntegrationFormChange}
                fullWidth
                required
                multiline
                rows={4}
                placeholder='{"webhook_url": "https://hooks.slack.com/services/xxx", "channel": "#alerts"}'
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenIntegrationDialog(false)}>Cancel</Button>
              <Button onClick={handleIntegrationSubmit} variant="contained">
                Add Integration
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ServiceDetail;