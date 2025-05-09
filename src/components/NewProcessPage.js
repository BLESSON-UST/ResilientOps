import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const AddServiceForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    status: "",
    risk: "",
    rto: "",
    dependencies: "",
    verified: false,
    type: "core",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newService = {
      ...formData,
      id: uuidv4(), // Assign a unique ID
    };

    navigate("/db4", { state: { newService } });
  };

  return (
    <Box p={4} display="flex" justifyContent="center">
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 600 }}>
        <Typography variant="h5" mb={3} fontWeight="bold">
          Add New Service
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Service Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="Healthy">Healthy</MenuItem>
            <MenuItem value="Degraded">Degraded</MenuItem>
            <MenuItem value="Down">Down</MenuItem>
          </TextField>

          <TextField
            select
            label="Risk"
            name="risk"
            value={formData.risk}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </TextField>

          <TextField
            label="RTO"
            name="rto"
            value={formData.rto}
            onChange={handleChange}
            placeholder="e.g., 4 hours"
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Number of Dependencies"
            name="dependencies"
            type="number"
            value={formData.dependencies}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Service Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="core">Core</MenuItem>
            <MenuItem value="support">Support</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={formData.verified}
                onChange={handleChange}
                name="verified"
              />
            }
            label="Verified"
            sx={{ mb: 3 }}
          />

          <Box display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => navigate("/db4")}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Add Service
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddServiceForm;
