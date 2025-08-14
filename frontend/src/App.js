import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

const API_BASE = process.env.REACT_APP_API_BASE || ""; // falls back to proxy in dev

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [start, setStart] = useState("2024-01-01");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchPrediction = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/predict?symbol=${symbol}&start=${start}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error fetching prediction");
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: 20 }}>
      <Paper style={{ padding: 20 }}>
        <Typography variant="h4" gutterBottom>
          Stock Market Predictor
        </Typography>
        <Stack direction="row" spacing={2} marginBottom={2}>
          <TextField
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <TextField
            label="Start Date"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={fetchPrediction} disabled={loading}>
            {loading ? "Loading..." : "Predict"}
          </Button>
        </Stack>
        {error && <Typography color="error">{error}</Typography>}
        {result && result.dates && (
          <Line
            data={{
              labels: result.dates,
              datasets: [
                {
                  label: "Close Price",
                  data: result.prices,
                  borderColor: "blue",
                  fill: false
                },
                {
                  label: "Prediction",
                  data: result.predictions,
                  borderColor: "red",
                  fill: false
                }
              ]
            }}
          />
        )}
      </Paper>
    </Container>
  );
}
