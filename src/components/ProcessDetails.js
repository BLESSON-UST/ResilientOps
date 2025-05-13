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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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

  // Fetch service details
  const fetchServiceDetail = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const services = response.data;
      const selectedService = services.find((svc) => svc.id === Number(id));
      setService(selectedService);

      // Fetch additional details based on role
      if (userRole === "Ops Analyst") {
        fetchRiskDetails(selectedService.id);
        fetchDowntimeDetails(selectedService.id);
      } else if (userRole === "Engineer") {
        fetchDependencies();
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRisk(response.data);
    } catch (error) {
      console.error("Error fetching risk details:", error);
    }
  };

  // Fetch downtime details
  const fetchDowntimeDetails = async (serviceId) => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/services/${serviceId}/downtime`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Filter dependencies for the current service
      const serviceDependencies = response.data.dependencies.find(
        (dep) => dep.service_id === Number(id)
      );
      setDependencies(serviceDependencies ? serviceDependencies.dependencies : []);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  // Decode the JWT token to extract the user role
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

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchServiceDetail();
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

  // Render the service details based on role
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
          <Typography variant="h6" gutterBottom>
            Risk Details
          </Typography>
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
          <Typography variant="h6" gutterBottom>
            Downtime Details
          </Typography>
          {downtime.length > 0 ? (
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
    </>
  )}

  {/* Business Owner Rendering */}
  {userRole === "Business Owner" && service && (
    <>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {service.name}
      </Typography>
      

      <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Service Information
          </Typography>
          <Typography variant="body1"><strong>ID:</strong> {service.id}</Typography>
          <Typography variant="body1"><strong>Name:</strong> {service.name}</Typography>
          <Typography variant="body1"><strong>Description:</strong> {service.description}</Typography>
          <Typography variant="body1"><strong>Created By:</strong> {service.created_by}</Typography>
          <Typography variant="body1"><strong>Status:</strong> {service.status}</Typography>
          <Typography variant="body1"><strong>Last Updated:</strong> {service.last_updated || "N/A"}</Typography>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />
      <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            BIA Information
          </Typography>
          <Typography variant="body1"><strong>Criticality:</strong> {service.bia?.criticality || "N/A"}</Typography>
          <Typography variant="body1"><strong>Impact:</strong> {service.bia?.impact || "N/A"}</Typography>
          <Typography variant="body1"><strong>RTO:</strong> {service.bia?.rto || "N/A"}</Typography>
          <Typography variant="body1"><strong>RPO:</strong> {service.bia?.rpo || "N/A"}</Typography>
          <Typography variant="body1"><strong>Signed Off:</strong> {service.bia?.signed_off ? "Yes" : "No"}</Typography>
          <Typography variant="body1">
            <strong>Dependencies:</strong> {service.bia?.dependencies?.join(', ') || "None"}
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
    </>
  )}
</Box>
  );
};

export default ServiceDetail;