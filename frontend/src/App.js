import React, { useState } from "react";
import { Container, Paper, TextField, Button, Typography, Stack } from "@mui/material";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale } from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

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
      const res = await fetch(`/api/predict?symbol=${symbol}&start=${start}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Something went wrong");
        setResult(null);
        return;
      }
      setResult(data);
    } catch (e) {
      setError("Network error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    result &&
    (() => ({
      labels: result.chart.dates,
      datasets: [
        { label: "Close", data: result.chart.close, borderWidth: 2, pointRadius: 0, tension: 0.25 },
        { label: "SMA 20", data: result.chart.sma20, borderWidth: 1, pointRadius: 0, borderDash: [6, 6], tension: 0.25 },
        { label: "Upper Band", data: result.chart.upperB, borderWidth: 1, pointRadius: 0, borderDash: [4, 4], tension: 0.25 },
        { label: "Lower Band", data: result.chart.lowerB, borderWidth: 1, pointRadius: 0, borderDash: [4, 4], tension: 0.25 },
      ],
    }))();

  const chartOptions = {
    responsive: true,
    scales: { x: { type: "time", time: { unit: "month" } }, y: { ticks: { beginAtZero: false } } },
    plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#2c3e50 0%,#4ca1af 100%)", paddingTop: 24, paddingBottom: 24 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: 3, borderRadius: "20px", bgcolor: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}>
          <Typography variant="h4" gutterBottom>📈 Stock Market Predictor</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
            <TextField label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} fullWidth />
            <TextField type="date" label="Start Date" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <Button variant="contained" onClick={fetchPrediction} disabled={loading} sx={{ minWidth: 160 }}>
              {loading ? "Loading..." : "Get Prediction"}
            </Button>
          </Stack>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          {result && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {result.symbol} — Last Close: ${result.last_close.toFixed(2)}
              </Typography>
              <div style={{ background: "white", padding: 12, borderRadius: 12 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
              <Paper sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: result.prediction.direction === "up" ? "rgba(0,200,0,0.1)" : "rgba(200,0,0,0.1)" }} elevation={0}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Next Day Predicted Close: ${result.prediction.next_close.toFixed(2)} {result.prediction.direction === "up" ? "⬆️" : "⬇️"}
                </Typography>
                <Typography variant="body2">Model MSE: {result.prediction.mse.toFixed(4)}</Typography>
              </Paper>
            </>
          )}
        </Paper>
      </Container>
    </div>
  );
}
