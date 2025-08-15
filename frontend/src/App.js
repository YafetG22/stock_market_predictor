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

// Use env var in prod; fall back to your Render URL; strip trailing slash
const API_BASE = (
  process.env.REACT_APP_API_BASE ||
  "https://stock-market-predictor-46tn.onrender.com"
).replace(/\/$/, "");

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

      const url = `${API_BASE}/api/predict?symbol=${encodeURIComponent(
        symbol
      )}&start=${encodeURIComponent(start)}`;

      const res = await fetch(url);
      const data = await res.json(); // will throw if not JSON

      // Expect either your new shape { ok, chart, prediction, ... }
      // or a fallback shape { dates, prices, predictions }
      if (data.ok === false) {
        throw new Error(data.error || "Server returned an error");
      }

      // Normalize to a single shape for the chart
      let chart = null;
      if (data.chart) {
        chart = {
          dates: data.chart.dates,
          close: data.chart.close,
          sma20: data.chart.sma20,
          upperB: data.chart.upperB,
          lowerB: data.chart.lowerB
        };
      } else {
        chart = {
          dates: data.dates || [],
          close: data.prices || [],
          sma20: data.sma20 || [],
          upperB: data.upperB || [],
          lowerB: data.lowerB || []
        };
      }

      setResult({
        symbol: (data.symbol || symbol).toUpperCase(),
        last_close: data.last_close,
        prediction: data.prediction,
        chart
      });
    } catch (err) {
      // If backend returns HTML (e.g., 404 page), json() above throws with Unexpected token '<'
      setError(err.message || "Failed to fetch prediction");
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
        {
          label: "Close",
          data: result.chart.close,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25
        },
        {
          label: "SMA 20",
          data: result.chart.sma20,
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [6, 6],
          tension: 0.25
        },
        {
          label: "Upper Band",
          data: result.chart.upperB,
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [4, 4],
          tension: 0.25
        },
        {
          label: "Lower Band",
          data: result.chart.lowerB,
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [4, 4],
          tension: 0.25
        }
      ]
    }))();

  const chartOptions = {
    responsive: true,
    scales: { x: { type: "time", time: { unit: "month" } } },
    plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#2c3e50 0%,#4ca1af 100%)",
        paddingTop: 24,
        paddingBottom: 24
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={6}
          style={{
            padding: 24,
            borderRadius: 20,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(6px)"
          }}
        >
          <Typography variant="h4" gutterBottom>
            📈 Stock Market Predictor
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} style={{ marginBottom: 16 }}>
            <TextField
              label="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              fullWidth
            />
            <TextField
              type="date"
              label="Start Date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button variant="contained" onClick={fetchPrediction} disabled={loading} style={{ minWidth: 160 }}>
              {loading ? "Loading..." : "PREDICT"}
            </Button>
          </Stack>

          {error && (
            <Typography color="error" style={{ marginBottom: 8 }}>
              {error}
            </Typography>
          )}

          {result && (
            <>
              {typeof result.last_close === "number" && (
                <Typography variant="h6" style={{ marginBottom: 8 }}>
                  {result.symbol} — Last Close: ${result.last_close.toFixed(2)}
                </Typography>
              )}

              {result.chart?.dates?.length ? (
                <div style={{ background: "white", padding: 12, borderRadius: 12 }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  No chart data returned.
                </Typography>
              )}

              {result.prediction && (
                <Paper
                  elevation={0}
                  style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 12,
                    background:
                      result.prediction.direction === "up"
                        ? "rgba(0,200,0,0.1)"
                        : "rgba(200,0,0,0.1)"
                  }}
                >
                  <Typography variant="h5" style={{ fontWeight: 700 }}>
                    Next Day Predicted Close: $
                    {Number(result.prediction.next_close).toFixed(2)}{" "}
                    {result.prediction.direction === "up" ? "⬆️" : "⬇️"}
                  </Typography>
                  <Typography variant="body2">
                    Model MSE: {Number(result.prediction.mse).toFixed(4)}
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Paper>
      </Container>
    </div>
  );
}
