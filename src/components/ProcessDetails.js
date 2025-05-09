// import React from "react";
// import { useParams } from "react-router-dom";
// import { Card, CardContent, Typography, Button, Grid } from "@mui/material";
// import * as XLSX from "xlsx";

// // Sample Data (Replace this with actual API data)
// const processData = {
//   sampleScreen1: {
//     processName: "Adjudicate Claims and Process Reimbursement",
//     businessCapability: "Deliver Services",
//     description:
//       "The goal of the process is to manage insurance claims from submission to resolution, ensuring accurate data handling, eligibility determination, and compliance through adjudication. It aims to facilitate timely reimbursement, notify stakeholders, and properly manage liability, all while maintaining adherence to policies and regulatory guidelines.",
//   },
//   sampleScreen5: [
//     {
//       processCategory: "Intake and Validate Claims",
//       subProcess: "Extract claim data",
//       description:
//         "Uses generative AI to extract key claim details from diverse document types (PDFs, scans, handwritten forms) and convert them into structured data.",
//       requirement:
//         "Understanding of various claim document formats and the key data elements required for processing.",
//       functionality: "Data Extraction",
//       metrics:
//         "Extraction accuracy; reduction in manual data entry; overall processing speed",
//       tbd: "TBD",
//       prompt:
//         "Extract all relevant fields (e.g., claim ID, date of service, provider details) from the attached claim document and present them in a structured format.",
//     },
//     {
//       processCategory: "Intake and Validate Claims",
//       subProcess: "Cleanse claim information",
//       description:
//         "Applies AI-driven validation to detect and correct erroneous or incomplete claim data, thereby ensuring high data quality for downstream processing.",
//       requirement:
//         "Familiarity with common data quality issues in claims and the rules for data validation and correction.",
//       functionality: "Validation, Cleansing",
//       metrics:
//         "Improvement in data accuracy; reduced rate of manual corrections; faster processing times",
//       tbd: "TBD",
//       prompt:
//         "Review the extracted claim data for inconsistencies or errors. Provide the corrected, validated claim information along with suggestions for improvement.",
//     },
//   ],
// };

// const ProcessDetails = () => {
//   const { id } = useParams(); // Get process ID from URL

//   const { processName, businessCapability, description } =
//     processData.sampleScreen1;
//   const subProcesses = processData.sampleScreen5;

//   // Export to Excel Function
//   const exportToExcel = () => {
//     const exportData = subProcesses.map((item) => ({
//       ProcessName: processName, // Adding Process Name
//       ProcessCategory: item.processCategory,
//       SubProcess: item.subProcess,
//       Description: item.description,
//       Requirement: item.requirement,
//       Functionality: item.functionality,
//       Metrics: item.metrics,
//       TBD: item.tbd,
//       Prompt: item.prompt,
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Process Details");

//     // Download Excel file
//     XLSX.writeFile(wb, `Process_${id}_Details.xlsx`);
//   };

//   return (
//     <Grid container spacing={2} justifyContent="center">
//       {/* Export Button in Top-Right Above the Card */}
//       <Grid item xs={12} display="flex" justifyContent="flex-end">
//         <Button
//           variant="contained"
//           onClick={exportToExcel}
//           sx={{
//             backgroundColor: "#006E74",
//             "&:hover": {
//               backgroundColor: "#007382",
//             },
//           }}
//         >
//           Export to Excel
//         </Button>
//       </Grid>
//       <Grid item xs={12}>
//         <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
//           Process Details
//         </Typography>
//       </Grid>
//       {/* Process Cover Details */}
//       <Grid item xs={12}>
//         <Card sx={{ p: 3, bgcolor: "#f5f5f5" }}>
//           <CardContent>
//             <Typography variant="h5" fontWeight="bold">
//               {processName}
//             </Typography>
//             <Typography variant="subtitle1" color="textSecondary">
//               {businessCapability}
//             </Typography>
//             <Typography variant="body1" sx={{ mt: 2 }}>
//               {description}
//             </Typography>
//           </CardContent>
//         </Card>
//       </Grid>

//       <Grid item xs={12}>
//         <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
//           Scenario Cards
//         </Typography>
//       </Grid>

//       {/* Sub Processes as Cards */}
//       {subProcesses.map((subProcess, index) => (
//         <Grid item xs={12} sm={6} key={index}>
//           <Card
//             sx={{ p: 2, bgcolor: "#f5f5f5", height: 400, overflow: "auto" }}
//           >
//             <CardContent>
//               <Typography variant="h6">{subProcess.subProcess}</Typography>
//               <Typography variant="body2" color="textSecondary">
//                 {subProcess.processCategory}
//               </Typography>
//               <Typography variant="body1" sx={{ mt: 1 }}>
//                 {subProcess.description}
//               </Typography>
//               <Typography variant="body2" sx={{ mt: 1 }}>
//                 <strong>Requirement:</strong> {subProcess.requirement}
//               </Typography>
//               <Typography variant="body2" sx={{ mt: 1 }}>
//                 <strong>Functionality:</strong> {subProcess.functionality}
//               </Typography>
//               <Typography variant="body2" sx={{ mt: 1 }}>
//                 <strong>Metrics:</strong> {subProcess.metrics}
//               </Typography>
//               <Typography variant="body2" sx={{ mt: 1 }}>
//                 <strong>Prompt:</strong> {subProcess.prompt}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       ))}
//     </Grid>
//   );
// };

// export default ProcessDetails;



import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import * as d3 from "d3";

// Sample service data (mock for now)
const services = [
  {
    id: "1",
    name: "Authentication Service",
    status: "Healthy",
    risk: "Low",
    rto: "2 hours",
    dependencies: 3,
    verified: true,
    metrics: [
      { time: "Week 1", downtime: 0 },
      { time: "Week 2", downtime: 1 },
      { time: "Week 3", downtime: 0 },
      { time: "Week 4", downtime: 2 },
    ],
  },
  {
    id: "2",
    name: "Order Processing",
    status: "Degraded",
    risk: "High",
    rto: "6 hours",
    dependencies: 5,
    verified: false,
    metrics: [
      { time: "Week 1", downtime: 3 },
      { time: "Week 2", downtime: 2 },
      { time: "Week 3", downtime: 4 },
      { time: "Week 4", downtime: 1 },
    ],
  },
  {
    id: "3",
    name: "Payment Gateway",
    status: "Down",
    risk: "Critical",
    rto: "8 hours",
    dependencies: 2,
    verified: false,
    metrics: [
      { time: "Week 1", downtime: 5 },
      { time: "Week 2", downtime: 6 },
      { time: "Week 3", downtime: 4 },
      { time: "Week 4", downtime: 5 },
    ],
  },
];

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const service = services.find((svc) => svc.id === id);
  const d3ChartRef = useRef(null);

  useEffect(() => {
    if (!service || !d3ChartRef.current) return;

    const svg = d3.select(d3ChartRef.current);
    svg.selectAll("*").remove(); // clear previous

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .domain(service.metrics.map((d) => d.time))
      .range([0, width])
      .padding(0.4);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(service.metrics, (d) => d.downtime)])
      .nice()
      .range([height, 0]);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis
    chart
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Y Axis
    chart.append("g").call(d3.axisLeft(y));

    // Bars
    chart
      .selectAll(".bar")
      .data(service.metrics)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.time))
      .attr("y", (d) => y(d.downtime))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.downtime))
      .attr("fill", "#1e88e5");
  }, [service]);

  if (!service) return <Typography>Service not found</Typography>;

  const riskColor = {
    Low: "#78bf35",
    High: "#e1c515",
    Critical: "#e53935",
  };

  return (
    <Box p={3}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")}>
        Back to Dashboard
      </Button>

      <Typography variant="h4" fontWeight="bold" mt={2} mb={2}>
        {service.name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: riskColor[service.risk], color: "white" }}>
            <CardContent>
              <Typography variant="h6">Status: {service.status}</Typography>
              <Typography>Risk Level: {service.risk}</Typography>
              <Typography>RTO: {service.rto}</Typography>
              <Typography>Dependencies: {service.dependencies}</Typography>
              <Typography>
                Verified: {service.verified ? "Yes" : "No"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Downtime Trend (Recharts)
              </Typography>
              <LineChart
                width={400}
                height={200}
                data={service.metrics}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="downtime" stroke="#8884d8" />
              </LineChart>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Downtime Histogram (D3.js)
              </Typography>
              <svg ref={d3ChartRef} width="100%" height="250" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceDetail;
