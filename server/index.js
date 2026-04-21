import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchCurrentAirPollution, fetchAirPollutionForecast } from "./services/openweather.js";
import { fetchCpcbByCity, recordsToHeatmapPoints } from "./services/cpcb.js";
import { healthRecommendationsFromOpenWeather } from "./services/health.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5050";

app.use(cors({ origin: true }));
app.use(express.json());

function parseCoord(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pollution Dashboard API</title></head>
<body style="font-family:system-ui;max-width:42rem;margin:2rem auto;padding:0 1rem">
  <h1>Pollution Dashboard — API only</h1>
  <p>This port serves JSON. The <strong>dashboard UI</strong> runs from the Vite dev server:</p>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px">cd client && npm run dev</pre>
  <p>Then open <a href="http://localhost:5173">http://localhost:5173</a> (not this page).</p>
  <p>Try: <a href="/api/healthz">/api/healthz</a> · <a href="/api/dashboard?city=Delhi">/api/dashboard?city=Delhi</a></p>
</body></html>`);
});

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/dashboard", async (req, res) => {
  const lat = parseCoord(req.query.lat, 28.6139);
  const lon = parseCoord(req.query.lon, 77.209);
  const city = (req.query.city || "Delhi").toString().trim();
  const owKey = process.env.OPENWEATHER_API_KEY;
  const dataGovKey = process.env.DATA_GOV_IN_API_KEY || "";

  if (!owKey) {
    return res.status(503).json({
      error: "Missing OPENWEATHER_API_KEY in server environment.",
    });
  }

  try {
    const [current, forecast, cpcb] = await Promise.all([
      fetchCurrentAirPollution(lat, lon, owKey),
      fetchAirPollutionForecast(lat, lon, owKey),
      fetchCpcbByCity(city, dataGovKey).catch((e) => ({
        records: [],
        source: "cpcb_error",
        error: String(e.message || e),
      })),
    ]);

    const health = healthRecommendationsFromOpenWeather(current?.aqiIndex);
    const heatmap = recordsToHeatmapPoints(cpcb.records ?? []);

    const historySeries = forecast
      .map((p) =>
        typeof p.pm2_5 === "number" && Number.isFinite(p.pm2_5)
          ? p.pm2_5
          : typeof p.aqiIndex === "number"
            ? p.aqiIndex * 20
            : null,
      )
      .filter((x) => x != null);

    let prediction = null;
    if (historySeries.length >= 3) {
      try {
        const pr = await fetch(`${ML_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values: historySeries,
            hours_ahead: 24,
            label: "pm2_5_proxy",
          }),
        });
        if (pr.ok) prediction = await pr.json();
        else prediction = { error: (await pr.text()) || `ML HTTP ${pr.status}` };
      } catch {
        prediction = { error: "ML service unreachable" };
      }
    }

    res.json({
      location: { lat, lon, city },
      openWeather: { current, forecast },
      cpcb: {
        records: cpcb.records ?? [],
        heatmap,
        meta: {
          source: cpcb.source,
          error: cpcb.error ?? null,
        },
      },
      health,
      prediction,
    });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

const server = app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use (often a previous "npm run dev:api").\n\n` +
        `Free it — run:\n  lsof -nP -iTCP:${PORT} -sTCP:LISTEN\n` +
        `Then stop the process using the number in the PID column, e.g.:\n  kill 18400\n\n` +
        `Or use another port: add a line PORT=3002 to server/.env, restart this API, ` +
        `then restart the Vite client (it reads server/.env for the proxy).\n`,
    );
    process.exit(1);
    return;
  }
  throw err;
});
