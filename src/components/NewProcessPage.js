import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jwtDecode from "jwt-decode";
import BASE_URL from "../ApiConfig/apiConfig"; // Adjust path to your API config

const AddServiceForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    criticality: "",
    impact: "",
    rto: "",
    rpo: "",
    dependencies: [],
    signed_off: false,
    status: "", // New field for initial status
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState("");

  // Check user role and fetch services on mount
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role || "");
        if (decodedToken.role !== "Business Owner") {
          setError("You do not have permission to add a service.");
          navigate("/db4");
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
        setError("Invalid token. Please log in again.");
        navigate("/login");
      }
    } else {
      setError("Please log in to access this page.");
      navigate("/login");
    }

    // Fetch existing services for dependencies dropdown
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setServices(response.data);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setError("Failed to load services for dependencies.");
      }
    };
    fetchServices();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDependenciesChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      dependencies: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Client-side validation
    if (!formData.name.trim()) {
      setError("Service name is required.");
      setLoading(false);
      return;
    }
    if (!formData.status) {
      setError("Initial status is required.");
      setLoading(false);
      return;
    }

    const token = sessionStorage.getItem("accessToken");
    try {
      // Step 1: Create the service
      const serviceResponse = await axios.post(
        `${BASE_URL}/services`,
        {
          name: formData.name,
          description: formData.description || undefined,
          criticality: formData.criticality || undefined,
          impact: formData.impact || undefined,
          rto: formData.rto ? parseInt(formData.rto, 10) : undefined,
          rpo: formData.rto ? parseInt(formData.rpo, 10) : undefined,
          dependencies: formData.dependencies,
          signed_off: formData.signed_off,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Step 2: Set the initial status
      const serviceId = serviceResponse.data.service_id || null; // Adjust based on actual response
      if (serviceId) {
        await axios.post(
          `${BASE_URL}/services/${serviceId}/status`,
          {
            status: formData.status,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Fallback: Fetch the service ID if not returned in response
        const servicesResponse = await axios.get(`${BASE_URL}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newService = servicesResponse.data.find(
          (s) => s.name === formData.name
        );
        if (newService) {
          await axios.post(
            `${BASE_URL}/services/${newService.id}/status`,
            {
              status: formData.status,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          throw new Error("Service ID not found.");
        }
      }

      setSuccess("Service and status created successfully.");
      setTimeout(() => navigate("/db4"), 2000);
    } catch (err) {
      console.error("Failed to create service or status:", err);
      setError(
        err.response?.data?.error ||
          "Failed to create service or status. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: "white",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ maxWidth: 600, width: "100%" }}>
        <Typography variant="h4" gutterBottom>
          Add New Service
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Service Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Criticality</InputLabel>
            <Select
              name="criticality"
              value={formData.criticality}
              onChange={handleChange}
              label="Criticality"
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Impact</InputLabel>
            <Select
              name="impact"
              value={formData.impact}
              onChange={handleChange}
              label="Impact"
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Severe">Severe</MenuItem>
              <MenuItem value="Moderate">Moderate</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="RTO (minutes)"
            name="rto"
            type="number"
            value={formData.rto}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            label="RPO (minutes)"
            name="rpo"
            type="number"
            value={formData.rpo}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Dependencies</InputLabel>
            <Select
              multiple
              name="dependencies"
              value={formData.dependencies}
              onChange={handleDependenciesChange}
              label="Dependencies"
              renderValue={(selected) =>
                selected
                  .map((id) => services.find((s) => s.id === id)?.name || "")
                  .join(", ")
              }
            >
              {services.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Initial Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Initial Status"
              required
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="Healthy">Up</MenuItem>
              <MenuItem value="Degraded">Degraded</MenuItem>
              <MenuItem value="Down">Down</MenuItem>
              <MenuItem value="Unknown">Unknown</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                name="signed_off"
                checked={formData.signed_off}
                onChange={handleChange}
              />
            }
            label="Signed Off"
          />
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#006E74",
                "&:hover": { bgcolor: "#005a60" },
              }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Create Service
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/db4")}
              disabled={loading}
              sx={{ color: "#e0e0e0", borderColor: "#e0e0e0" }}
            >
              Cancel
            </Button>
          </Box>
        </form>
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AddServiceForm;
