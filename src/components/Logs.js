import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../ApiConfig/apiConfig";
import jwtDecode from "jwt-decode";

const Logs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  // Fetch logs from API
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      setSnackbar({
        open: true,
        message: "Please log in to view logs",
        severity: "error",
      });
      navigate("/login");
      return;
    }

    // Optional: Decode token to verify (e.g., for role or user info)
    try {
      jwtDecode(token); // Decode to ensure token is valid
    } catch (error) {
      console.error("Failed to decode token:", error);
      setSnackbar({
        open: true,
        message: "Invalid token",
        severity: "error",
      });
      navigate("/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/audit`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(response.data);
        setLoading(false);
      } catch (err) {
        setSnackbar({
          open: true,
          message: err.response?.data?.error || "Failed to fetch logs",
          severity: "error",
        });
        setLoading(false);
      }
    };

    fetchLogs();
  }, [navigate]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate rows to display
  const paginatedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Audit Logs
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                    Action
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                    Entity
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                    Entity ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                    Timestamp
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                    User ID
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell>{log.entity_id}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.user_id}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No logs available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={logs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
          />
        </Paper>
      )}
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

export default Logs;