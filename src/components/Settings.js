import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Slider,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";

const SettingsPage = () => {
  const [highLevelStep, setHighLevelStep] = useState(0);
  const [columns, setColumns] = useState([
    "Search",
    "Summarization",
    "Creation",
    "Validation",
  ]);

  const handleAddStep = () => {
    setHighLevelStep((prevStep) => prevStep + 5);
  };

  const handleAddColumn = () => {
    setColumns([...columns, `Column ${columns.length + 1}`]);
  };

  const handleDeleteColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const getSliderColor = (value) => {
    if (value <= 10) return "#76FF03";
    if (value <= 30) return "#FFEB3B";
    return "#F44336";
  };

  return (
    <Box sx={{ padding: 4, maxWidth: "100%", textAlign: "left" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        ⚙️ Settings
      </Typography>

      {/* Process Outline Card */}
      <Card sx={{ marginBottom: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Process Outline
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Adjust the number of high-level steps.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2">0</Typography>
            <Slider
              value={highLevelStep}
              min={0}
              max={50}
              step={5}
              valueLabelDisplay="auto"
              sx={{ flexGrow: 1, color: getSliderColor(highLevelStep) }}
              disabled
            />
            <Typography variant="body2">{highLevelStep}</Typography>
          </Box>

          <Box sx={{ marginTop: 2 }}>
            <Button variant="contained" sx={{ backgroundColor: "#006E74", "&:hover": { backgroundColor: "#007382" } }}  onClick={handleAddStep}>
              Add Step
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Gen-AI Mapping Card */}
      <Card sx={{ marginBottom: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Gen-AI Mapping
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Add or remove dynamic columns for data entry.
          </Typography>

          <Grid container spacing={2}>
            {columns.map((col, index) => (
              <Grid item xs={6} key={index} sx={{ display: "flex", alignItems: "center" }}>
                <TextField label={col} variant="outlined" fullWidth />
                <IconButton onClick={() => handleDeleteColumn(index)} >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ marginTop: 2 }}>
            <Button variant="contained" sx={{ backgroundColor: "#006E74", "&:hover": { backgroundColor: "#007382" } }} onClick={handleAddColumn}>
              Add Column
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Save Settings Button */}
      <Box>
        <Button variant="contained" sx={{ backgroundColor: "#006E74", "&:hover": { backgroundColor: "#007382" } }} size="large">
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage;
