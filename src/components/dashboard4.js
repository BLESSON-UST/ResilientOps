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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BASE_URL from '../ApiConfig/apiConfig';
import axios from "axios";
import jwtDecode from "jwt-decode"; // Import jwt-decode

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
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedCards, setSelectedCards] = useState([]);
  const [verifiedServices, setVerifiedServices] = useState({});
  const [userRole, setUserRole] = useState(""); // State to store user role

  useEffect(() => {
    // Decode JWT token and extract role
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role || ""); // Adjust 'role' key based on your JWT payload
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }

    const fetchServicesAndRisks = async () => {
      try {
        // Fetch all services
        const servicesResponse = await axios.get(`${BASE_URL}/services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const services = servicesResponse.data;

        // Fetch risk for each service
        const servicesWithRisk = await Promise.all(
          services.map(async (svc) => {
            try {
              const riskResponse = await axios.get(`${BASE_URL}/risk/${svc.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
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
      }
    };

    fetchServicesAndRisks();
  }, []);

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

  const filteredServices = selectedServiceType
    ? servicesList.filter((s) => s.type === selectedServiceType)
    : servicesList;

  return (
    <Box p={2} sx={{ bgcolor: "white", minHeight: "100vh" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Service Dashboard</Typography>
        <FormControl variant="outlined" size="small">
          <InputLabel>Service Type</InputLabel>
          <Select
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            label="Service Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="core">Core</MenuItem>
            <MenuItem value="support">Support</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Conditionally render Add New Card for Business Owner role */}
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
                border: "2px dashed #ccc",
                borderRadius: 2,
              }}
            >
              <AddIcon sx={{ fontSize: 60 }} />
            </Card>
          </Grid>
        )}

        {/* Render Service Cards */}
        {filteredServices.map((svc) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            key={svc.id}
            display="flex"
            justifyContent="center"
          >
            <Card
              sx={{
                width: 300,
                height: 300,
                position: "relative",
                borderRadius: 2,
                boxShadow: 2,
                bgcolor: selectedCards.includes(svc.id) ? "#f0f0f0" : "#f9f9f9",
                borderTop: `6px solid ${riskColor(svc.risk)}`,
              }}
            >
              <Checkbox
                icon={<RadioButtonUncheckedIcon />}
                checkedIcon={<CheckCircleIcon />}
                size="small"
                sx={{ position: "absolute", top: 16, right: 16 }}
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
                  <Typography variant="h6" fontWeight="bold">
                    {svc.name}
                  </Typography>
                </Box>

                <Box sx={{ fontSize: 14, mb: 1 }}>
                  <Typography>Status: {svc.status}</Typography>
                  <Typography>Risk: {svc.risk}</Typography>
                  <Typography>RTO: {svc.rto}</Typography>
                  <Typography>Dependencies: {svc.dependencies}</Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: verifiedServices[svc.id] ? "#78bf35" : "#e1c515",
                    color: "white",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    cursor: "pointer",
                    width: "fit-content",
                    mb: 1,
                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() => toggleVerification(svc.id)}
                >
                  {verifiedServices[svc.id] ? "Verified" : "Not Verified"}
                </Typography>

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
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/service/${svc.id}/view`, {
                          state: { service: svc },
                        })
                      }
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (
                          window.confirm(`Are you sure you want to delete ${svc.name}?`)
                        ) {
                          alert("Service deleted (not yet implemented)");
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;