import React, { useEffect, useState, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Warning from "@mui/icons-material/Warning";
import Error from "@mui/icons-material/Error";
import axios from "axios";
import jwt_decode from "jwt-decode";
import * as d3 from "d3";
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
  const [openHealthDialog, setOpenHealthDialog] = useState(false);
  const [healthInfo, setHealthInfo] = useState(null);
  const [healthError, setHealthError] = useState(null);
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const graphRef = useRef(null);
  const downtimeGraphRef = useRef(null);

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
      setSnackbar({
        open: true,
        message: "Failed to fetch services",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Failed to fetch service details",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Failed to fetch risk details",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Failed to fetch downtime details",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Failed to fetch dependencies",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Failed to fetch integrations",
        severity: "error",
      });
    }
  };

  // Fetch health check
  const handleHealthCheck = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services/${id}/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealthInfo(response.data);
      setHealthError(null);
      setOpenHealthDialog(true);
    } catch (error) {
      console.error("Error fetching health check:", error);
      setHealthError("Failed to fetch health status. Please try again.");
      setHealthInfo(null);
      setOpenHealthDialog(true);
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
        setSnackbar({
          open: true,
          message: "Failed to decode user role",
          severity: "error",
        });
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

  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
      setSnackbar({
        open: true,
        message: "Service updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating service:", error);
      setSnackbar({
        open: true,
        message: "Failed to update service",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "BIA updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating BIA:", error);
      setSnackbar({
        open: true,
        message: "Failed to update BIA",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Status updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update status",
        severity: "error",
      });
    }
  };

  // Handle downtime submission
  const handleDowntimeSubmit = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
  
      const toISOStringIfExists = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };
      
      const payload = {
        start_time: toISOStringIfExists(downtimeForm.start_time),
        end_time: toISOStringIfExists(downtimeForm.end_time),
        reason: downtimeForm.reason || "Not specified",
      };
     
  
      await axios.post(`${BASE_URL}/services/${id}/downtime`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(payload)
      setOpenDowntimeDialog(false);
      setDowntimeForm({ start_time: "", end_time: "", reason: "" });
      fetchDowntimeDetails(id);
      setSnackbar({
        open: true,
        message: "Downtime logged successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error logging downtime:", error);
      setSnackbar({
        open: true,
        message: "Failed to log downtime",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: "Automated risk score saved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving automated risk:", error);
      setSnackbar({
        open: true,
        message: "Failed to save automated risk",
        severity: "error",
      });
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
        is_critical: riskForm.risk_level === "High" // Automatically set is_critical based on risk_level
      };
      await axios.put(`${BASE_URL}/risk/${id}/manual`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenRiskDialog(false);
      fetchRiskDetails(id);
      setSnackbar({
        open: true,
        message: "Risk score updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating risk:", error);
      setSnackbar({
        open: true,
        message: "Failed to update risk",
        severity: "error",
      });
    }
  };

  // Handle integration submission
  const handleIntegrationSubmit = async () => {
    try {
      let configObj;
      try {
        configObj = JSON.parse(integrationForm.config);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Invalid JSON format for config. Please provide a valid JSON object.",
          severity: "error",
        });
        return;
      }

      const token = sessionStorage.getItem("accessToken");
      const payload = {
        service_id: parseInt(id),
        type: integrationForm.type,
        config: configObj,
      };
      await axios.post(`${BASE_URL}/services/integrations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenIntegrationDialog(false);
      setIntegrationForm({ service_id: id, type: "", config: "" });
      fetchIntegrations();
      setSnackbar({
        open: true,
        message: "Integration added successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding integration:", error);
      setSnackbar({
        open: true,
        message: "Failed to add integration",
        severity: "error",
      });
    }
  };

  // D3 Force-Directed Graph for Dependencies (Engineer)
  useEffect(() => {
    if (userRole !== "Engineer" || !service || !graphRef.current) return;

    // Clear previous SVG
    d3.select(graphRef.current).selectAll("*").remove();

    // Prepare data
    const nodes = [
      { id: `service_${service.id}`, name: service.name, type: "current" },
      ...dependencies.map((dep) => ({
        id: `dep_${dep.service_id}`,
        name: dep.service_name,
        type: "dependency",
        criticality: dep.criticality || "N/A",
        impact: dep.impact || "N/A",
        rto: dep.rto || "N/A",
        rpo: dep.rpo || "N/A",
        status: dep.status || "N/A",
      })),
    ];
    const links = dependencies.map((dep) => ({
      source: `service_${service.id}`,
      target: `dep_${dep.service_id}`,
    }));

    // Set up SVG
    const width = 600;
    const height = 400;
    const svg = d3
      .select(graphRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line");

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add circles
    node
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) => (d.type === "current" ? "#006E74" : "#4caf50"));

    // Add labels
    node
      .append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text((d) => d.name)
      .attr("fill", "#000")
      .attr("font-size", "12px");

    // Add tooltips
    node
      .append("title")
      .text(
        (d) =>
          d.type === "current"
            ? `Name: ${d.name}`
            : `Name: ${d.name}\nID: ${
                d.id.split("_")[1]
              }\nCriticality: ${d.criticality}\nImpact: ${d.impact}\nRTO: ${d.rto}\nRPO: ${d.rpo}\nStatus: ${d.status}`
      );

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [userRole, service, dependencies]);

  // D3 Horizontal Bar Chart for Downtime (Ops Analyst)
  useEffect(() => {
    if (userRole !== "Ops Analyst" || !service || !downtimeGraphRef.current || downtime.length === 0) return;

    // Clear previous SVG
    d3.select(downtimeGraphRef.current).selectAll("*").remove();

    // Prepare data
    const data = downtime.map((dt, index) => ({
      index,
      start_time: new Date(dt.start_time),
      end_time: dt.end_time ? new Date(dt.end_time) : null,
      reason: dt.reason || "Not specified",
      duration: dt.duration || "N/A",
      total_minutes: dt.total_minutes || 0,
      isOngoing: !dt.end_time,
    }));

    // Set up SVG
    const margin = { top: 20, right: 20, bottom: 50, left: 150 };
    const width = 600 - margin.left - margin.right;
    const height = Math.max(100, downtime.length * 40) - margin.top - margin.bottom;

    const svg = d3
      .select(downtimeGraphRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total_minutes) || 100])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.index))
      .range([0, height])
      .padding(0.2);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text("Total Minutes");

    svg
      .append("g")
      .call(d3.axisLeft(y).tickFormat((d) => {
        const reason = data[d].reason;
        return reason.length > 20 ? `${reason.slice(0, 17)}...` : reason;
      }))
      .selectAll("text")
      .style("text-anchor", "end");

    // Add bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d) => y(d.index))
      .attr("width", (d) => x(d.total_minutes))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => (d.isOngoing ? "#d32f2f" : "#757575"))
      .append("title")
      .text(
        (d) =>
          `Start Time: ${d.start_time.toLocaleString()}\nEnd Time: ${
            d.isOngoing ? "Ongoing" : d.end_time?.toLocaleString() || "N/A"
          }\nReason: ${d.reason}\nDuration: ${d.duration}\nTotal Minutes: ${d.total_minutes}`
      );

    // Add gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(-height)
          .tickFormat(() => "")
      )
      .selectAll(".tick line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-opacity", 0.5);
  }, [userRole, service, downtime]);

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
        <Button
          onClick={() => navigate("/db4")}
          sx={{ color: "#1976d2", borderColor: "#1976d2" }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  // Determine health icon and color
  const getHealthIcon = (health) => {
    switch (health) {
      case "Healthy":
        return <CheckCircle sx={{ color: "#4caf50", verticalAlign: "middle", mr: 1 }} />;
      case "Degraded":
        return <Warning sx={{ color: "#ff9800", verticalAlign: "middle", mr: 1 }} />;
      case "Unhealthy":
        return <Error sx={{ color: "#d32f2f", verticalAlign: "middle", mr: 1 }} />;
      default:
        return null;
    }
  };

  return (
    <Box p={4} width="100%" sx={{ textAlign: "left" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/db4")}
          sx={{ color: "#1976d2", borderColor: "#1976d2" }}
        >
          Back to Dashboard
        </Button>
        <Button
          startIcon={<HealthAndSafetyIcon />}
          onClick={handleHealthCheck}
          variant="outlined"
          sx={{ color: "#006E74", borderColor: "#006E74" }}
        >
          Health Check
        </Button>
      </Box>

      {/* Health Check Dialog */}
      <Dialog open={openHealthDialog} onClose={() => setOpenHealthDialog(false)}>
        <DialogTitle>Service Health Status</DialogTitle>
        <DialogContent>
          {healthError ? (
            <Typography variant="body1" color="error">
              {healthError}
            </Typography>
          ) : healthInfo ? (
            <>
              <Box display="flex" alignItems="center" mb={2}>
                {getHealthIcon(healthInfo.overall_health)}
                <Typography variant="h6">
                  Overall Health: {healthInfo.overall_health}
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Service Name:</strong> {healthInfo.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {healthInfo.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Risk Score:</strong> {healthInfo.risk_score}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Is Critical:</strong> {healthInfo.is_critical ? "Yes" : "No"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Reason:</strong> {healthInfo.reason || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Uptime Percentage:</strong> {healthInfo.uptime_percentage.toFixed(2)}%
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Criticality:</strong> {healthInfo.bia.criticality || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>RTO:</strong> {healthInfo.bia.rto || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>RPO:</strong> {healthInfo.bia.rpo || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Latest Downtime:</strong>{" "}
                {healthInfo.downtime.start_time
                  ? `${new Date(healthInfo.downtime.start_time).toLocaleString()} (${healthInfo.downtime.reason || "N/A"})`
                  : "None"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Last Updated:</strong>{" "}
                {healthInfo.last_updated
                  ? new Date(healthInfo.last_updated).toLocaleString()
                  : "N/A"}
              </Typography>
            </>
          ) : (
            <Typography variant="body1">Loading health information...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenHealthDialog(false)}
            sx={{ color: "#1976d2" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Business Owner Rendering */}
      {userRole === "Business Owner" && service && (
        <>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {service.name}
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Service Information
                </Typography>
                <IconButton
                  onClick={() => setOpenServiceDialog(true)}
                  sx={{ color: "#006E74" }}
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
                  sx={{ color: "#006E74" }}
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

          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  BIA Information
                </Typography>
                <IconButton
                  onClick={() => setOpenBiaDialog(true)}
                  sx={{ color: "#006E74" }}
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

          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
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
              <Button
                onClick={() => setOpenServiceDialog(false)}
                sx={{ color: "#e0e0e0" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleServiceUpdate}
                sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
                variant="contained"
              >
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
              <FormControl fullWidth margin="dense">
                <InputLabel>Impact</InputLabel>
                <Select
                  name="impact"
                  value={biaForm.impact}
                  onChange={handleBiaFormChange}
                  label="Impact"
                >
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Severe">Severe</MenuItem>
                  <MenuItem value="Moderate">Moderate</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
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
              <Button
                onClick={() => setOpenBiaDialog(false)}
                sx={{ color: "#e0e0e0" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBiaUpdate}
                sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
                variant="contained"
              >
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
              <Button
                onClick={() => setOpenStatusDialog(false)}
                sx={{ color: "#e0e0e0" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
                variant="contained"
              >
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
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
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
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Risk Details
                </Typography>
                <IconButton
                  onClick={() => setOpenRiskDialog(true)}
                  sx={{ color: "#006E74" }}
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
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Downtime Details
                </Typography>
                <IconButton
                  onClick={() => setOpenDowntimeDialog(true)}
                  sx={{ color: "#006E74" }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
              {downtime.every((dt) => Object.keys(dt).length !== 0) && downtime.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Start Time</strong></TableCell>
                        <TableCell><strong>End Time</strong></TableCell>
                        <TableCell><strong>Reason</strong></TableCell>
                        <TableCell><strong>Duration</strong></TableCell>
                        <TableCell><strong>Total Minutes</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {downtime.map((dt, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(dt.start_time).toLocaleString()}</TableCell>
                          <TableCell>{dt.end_time ? new Date(dt.end_time).toLocaleString() : "Ongoing"}</TableCell>
                          <TableCell>{dt.reason}</TableCell>
                          <TableCell>{dt.duration}</TableCell>
                          <TableCell>{dt.total_minutes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">No downtime details available.</Typography>
              )}
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Downtime Visualization
              </Typography>
              {downtime.every((dt) => Object.keys(dt).length !== 0) && downtime.length > 0 ? (
                <Box ref={downtimeGraphRef} sx={{ width: "100%", height: Math.max(100, downtime.length * 40) }} />
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
              <Button
                onClick={() => setOpenDowntimeDialog(false)}
                sx={{ color: "#e0e0e0" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDowntimeSubmit}
                sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
                variant="contained"
              >
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
                  sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
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
                    inputProps={{ min: 0, max: 100 }}
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Risk Level</InputLabel>
                    <Select
                      name="risk_level"
                      value={riskForm.risk_level}
                      onChange={handleRiskFormChange}
                      label="Risk Level"
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </Select>
                  </FormControl>
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
              <Button
                onClick={() => setOpenRiskDialog(false)}
                sx={{ color: "#e0e0e0" }}
              >
                Cancel
              </Button>
              {risk && (
                <Button
                  onClick={handleManualRiskUpdate}
                  sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
                  variant="contained"
                >
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
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
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
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dependent Services
              </Typography>
              {dependencies.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>Criticality</strong></TableCell>
                        <TableCell><strong>Impact</strong></TableCell>
                        <TableCell><strong>RTO</strong></TableCell>
                        <TableCell><strong>RPO</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dependencies.map((dep, index) => (
                        <TableRow key={index}>
                          <TableCell>{dep.service_name}</TableCell>
                          <TableCell>{dep.service_id}</TableCell>
                          <TableCell>{dep.criticality || "N/A"}</TableCell>
                          <TableCell>{dep.impact || "N/A"}</TableCell>
                          <TableCell>{dep.rto || "N/A"}</TableCell>
                          <TableCell>{dep.rpo || "N/A"}</TableCell>
                          <TableCell>{dep.status || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">No dependent services available.</Typography>
              )}
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dependency Graph
              </Typography>
              {dependencies.length > 0 ? (
                <Box ref={graphRef} sx={{ width: "100%", height: 400 }} />
              ) : (
                <Typography variant="body1">No dependent services available.</Typography>
              )}
            </CardContent>
          </Card>
          <Divider sx={{ my: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, borderColor: "#e0e0e0" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Integrations
                </Typography>
                <IconButton
                  onClick={() => setOpenIntegrationDialog(true)}
                  sx={{ color: "#006E74" }}
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
              <Button
                onClick={() => setOpenIntegrationDialog(false)}
                sx={{ color: "#e0e0e0" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleIntegrationSubmit}
                sx={{ bgcolor: "#006E74", "&:hover": { bgcolor: "#005a60" } }}
                variant="contained"
              >
                Add Integration
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Snackbar for Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceDetail;