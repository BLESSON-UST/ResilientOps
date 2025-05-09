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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate, useLocation } from "react-router-dom";

const initialServices = [
  {
    id: "1",
    name: "Authentication Service",
    status: "Healthy",
    risk: "Low",
    rto: "2 hours",
    dependencies: 3,
    verified: true,
    type: "core",
  },
  {
    id: "2",
    name: "Order Processing",
    status: "Degraded",
    risk: "High",
    rto: "6 hours",
    dependencies: 5,
    verified: false,
    type: "core",
  },
  {
    id: "3",
    name: "Payment Gateway",
    status: "Down",
    risk: "Critical",
    rto: "8 hours",
    dependencies: 2,
    verified: false,
    type: "support",
  },
];

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

  const [servicesList, setServicesList] = useState(initialServices);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedCards, setSelectedCards] = useState([]);
  const [verifiedServices, setVerifiedServices] = useState(
    initialServices.reduce((acc, svc) => {
      acc[svc.id] = svc.verified;
      return acc;
    }, {})
  );

  // Add new service if passed from navigation state
  useEffect(() => {
    if (location.state?.newService) {
      const newService = location.state.newService;
      setServicesList((prev) => [...prev, newService]);
      setVerifiedServices((prev) => ({
        ...prev,
        [newService.id]: newService.verified || false,
      }));

      // Clear navigation state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{
          position: "sticky",
          top: "-17px",
          zIndex: 1000,
          backgroundColor: "white",
          pb: 2,
          pt: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          ResilientOps Dashboard
        </Typography>
        <FormControl variant="outlined" size="small" sx={{ width: 250 }}>
          <InputLabel>Service Type</InputLabel>
          <Select
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            label="Service Type"
            IconComponent={ArrowDropDownIcon}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="core">Core Services</MenuItem>
            <MenuItem value="support">Support Services</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Add New Card */}
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
                bgcolor: "#f9f9f9",
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
                    bgcolor: verifiedServices[svc.id]
                      ? "#78bf35"
                      : "#e1c515",
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
                    Last updated: 1 month ago
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
                      onClick={() => navigate(`/service/${svc.id}/edit`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete ${svc.name}?`
                          )
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
