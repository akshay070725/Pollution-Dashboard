import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function heatColor(v, maxV) {
  if (!maxV) return "#3dd6c6";
  const t = Math.min(1, v / maxV);
  if (t < 0.33) return "#3dd6c6";
  if (t < 0.66) return "#f0b429";
  return "#ff6b6b";
}

function getAqiMeta(aqiIndex) {
  if (aqiIndex <= 1) return { label: "Good", className: "aqi-good", icon: "😊" };
  if (aqiIndex === 2) return { label: "Moderate", className: "aqi-moderate", icon: "🙂" };
  if (aqiIndex === 3) return { label: "Unhealthy", className: "aqi-poor", icon: "😷" };
  if (aqiIndex === 4) return { label: "Very Unhealthy", className: "aqi-very-poor", icon: "⚠️" };
  return { label: "Hazardous", className: "aqi-severe", icon: "🚨" };
}

function getFeelsLikeSummary(aqiIndex) {
  if (aqiIndex <= 1) return "Fresh and safe for outdoor activities.";
  if (aqiIndex === 2) return "Comfortable for most people; sensitive groups should stay aware.";
  if (aqiIndex === 3) return "Air feels heavy. Reduce prolonged outdoor activity.";
  if (aqiIndex === 4) return "Irritating air quality. Prefer indoor activities and wear a mask.";
  return "Very harmful conditions. Stay indoors and use strong protection if outside.";
}

function formatHour(dt) {
  return new Date(dt * 1000).toLocaleTimeString([], { hour: "numeric" });
}

function formatDay(dt) {
  return new Date(dt * 1000).toLocaleDateString([], { weekday: "short" });
}

function aqiProxyFromIndex(aqiIndex, pm25) {
  if (typeof pm25 === "number" && Number.isFinite(pm25)) return Math.round(pm25 * 2.5);
  return aqiIndex * 50;
}

export default function DashboardView({ preset, data, err, loading, load, chartRows, maxHeat }) {
  const ow = data?.openWeather?.current;
  const [showLocalAlert, setShowLocalAlert] = useState(false);

  const hourlyRows = useMemo(() => (data?.openWeather?.forecast ?? []).slice(0, 24), [data]);
  const dailyRows = useMemo(() => {
    const byDay = new Map();
    for (const point of data?.openWeather?.forecast ?? []) {
      const dayKey = new Date(point.dt * 1000).toDateString();
      const current = byDay.get(dayKey) ?? { dt: point.dt, pm25: [], aqi: [] };
      if (typeof point.pm2_5 === "number") current.pm25.push(point.pm2_5);
      if (typeof point.aqiIndex === "number") current.aqi.push(point.aqiIndex);
      byDay.set(dayKey, current);
    }
    return Array.from(byDay.values())
      .slice(0, 7)
      .map((d) => {
        const avgPm25 = d.pm25.length
          ? d.pm25.reduce((sum, v) => sum + v, 0) / d.pm25.length
          : null;
        const avgAqi = d.aqi.length ? Math.round(d.aqi.reduce((sum, v) => sum + v, 0) / d.aqi.length) : 1;
        return { ...d, avgPm25, avgAqi, meta: getAqiMeta(avgAqi) };
      });
  }, [data]);

  const heroMeta = getAqiMeta(ow?.aqiIndex ?? 1);
  const currentProxyAqi = aqiProxyFromIndex(ow?.aqiIndex ?? 1, ow?.components?.pm2_5);
  const alertTip =
    currentProxyAqi > 200
      ? "Avoid outdoor workouts and keep windows closed."
      : "Wear an N95 mask outdoors and limit prolonged exposure.";

  useEffect(() => {
    const aqiKey =
      heroMeta.className === "aqi-good"
        ? "good"
        : heroMeta.className === "aqi-moderate"
          ? "moderate"
          : heroMeta.className === "aqi-poor"
            ? "poor"
            : heroMeta.className === "aqi-very-poor"
              ? "very-poor"
              : "severe";
    document.body.dataset.aqi = aqiKey;

    if (!ow) return;
    const overThreshold = aqiProxyFromIndex(ow.aqiIndex ?? 1, ow.components?.pm2_5) > 150;
    if (!overThreshold) {
      setShowLocalAlert(false);
      return;
    }
    setShowLocalAlert(true);
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(`AQI alert for ${preset.city}`, {
        body: `AQI proxy ${currentProxyAqi}. ${alertTip}`,
      });
      return;
    }
    if (Notification.permission !== "denied") Notification.requestPermission();
  }, [ow, preset.city, currentProxyAqi, alertTip]);

  return (
    <>
      <div className="toolbar">
        <h2 className="section-title">{preset.name} Air Quality</h2>
        <button type="button" onClick={load} disabled={loading} className="button button-secondary">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err && <div className="alert-error">{err}</div>}
      {showLocalAlert && (
        <div className="alert-warning">
          AQI alert: {preset.city} is at {currentProxyAqi}. {alertTip}
        </div>
      )}

      <section className={`panel-card hero-card ${heroMeta.className}`}>
        <p className="hero-kicker">Today</p>
        <div className="hero-row">
          <div>
            <h3 className="hero-city">{preset.city}</h3>
            <div className="hero-aqi">{currentProxyAqi}</div>
            <div className="hero-status">
              <span>{heroMeta.icon}</span> {heroMeta.label}
            </div>
            <p className="hero-summary">{getFeelsLikeSummary(ow?.aqiIndex ?? 1)}</p>
          </div>
          <div className="hero-metrics">
            <div>
              <div className="metric-label">AQI Index</div>
              <div className="metric-value">{ow?.aqiIndex ?? "—"}/5</div>
            </div>
            <div>
              <div className="metric-label">PM2.5</div>
              <div className="metric-value">
                {typeof ow?.components?.pm2_5 === "number" ? ow.components.pm2_5.toFixed(1) : "—"} ug/m3
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <h3>Next 24 hours</h3>
        <div className="hourly-strip">
          {hourlyRows.map((point) => {
            const meta = getAqiMeta(point.aqiIndex ?? 1);
            return (
              <article className={`hour-card ${meta.className}`} key={point.dt}>
                <p>{formatHour(point.dt)}</p>
                <strong>{aqiProxyFromIndex(point.aqiIndex ?? 1, point.pm2_5)}</strong>
                <span>{meta.label}</span>
                <small>PM2.5 {typeof point.pm2_5 === "number" ? point.pm2_5.toFixed(1) : "—"}</small>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid-cards">
        <section className="panel-card">
          <h3>Daily outlook</h3>
          <div className="daily-list">
            {dailyRows.map((day, i) => {
              const trend = i > 0 && dailyRows[i - 1].avgPm25 != null && day.avgPm25 != null
                ? day.avgPm25 < dailyRows[i - 1].avgPm25
                  ? "improving"
                  : "worsening"
                : "steady";
              const trendIcon = trend === "improving" ? "⬇️" : trend === "worsening" ? "⬆️" : "➡️";
              return (
                <article key={`${day.dt}-${i}`} className="daily-item">
                  <div>
                    <strong>{formatDay(day.dt)}</strong>
                    <p className="muted">
                      {day.meta.label} {trendIcon} {trend}
                    </p>
                  </div>
                  <div className="daily-metrics">
                    <span>AQI {aqiProxyFromIndex(day.avgAqi, day.avgPm25)}</span>
                    <span>PM2.5 {day.avgPm25 != null ? day.avgPm25.toFixed(1) : "—"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel-card">
          <h3>Health guidance</h3>
          {ow ? (
            <>
              <div className="health-cards">
                <article className="health-action-card">
                  <h4>Outdoor activity</h4>
                  <p>{ow.aqiIndex >= 3 ? "Avoid jogging 6–9 PM near traffic." : "Safe for light outdoor activity."}</p>
                </article>
                <article className="health-action-card">
                  <h4>Mask guidance</h4>
                  <p>{ow.aqiIndex >= 3 ? "Wear an N95/KN95 mask outdoors." : "Mask optional for most users."}</p>
                </article>
                <article className="health-action-card">
                  <h4>Home air</h4>
                  <p>{ow.aqiIndex >= 4 ? "Keep windows closed and use purifier if possible." : "Ventilate during cleaner hours."}</p>
                </article>
              </div>
            </>
          ) : (
            <p className="muted">Load data to see guidance.</p>
          )}
        </section>
      </div>

      <section className="panel-card">
        <h3>Pollution trend and forecast</h3>
        <p className="muted">
          Solid line: OpenWeather PM2.5 (ug/m3) from hourly forecast. Dashed: linear trend
          extrapolation from the Python model (demo - not a certified forecast).
        </p>
        <div className="chart-wrap">
          <ResponsiveContainer>
            <LineChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
              <XAxis dataKey="t" stroke="#8b9bb5" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8b9bb5" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#141c28", border: "1px solid #243044" }} />
              <Legend />
              <Line type="monotone" dataKey="pm25" name="PM2.5 (OW)" stroke="#3dd6c6" dot={false} />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted (ML)"
                stroke="#f0b429"
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {data?.prediction?.error && (
          <p className="warn">Forecast unavailable: {data.prediction.error}</p>
        )}
      </section>

      <section className="panel-card">
        <h3>Station heatmap (CPCB)</h3>
        <p className="muted">
          Circles sized and colored by max reported pollutant average for each station.
        </p>
        {data?.cpcb?.meta?.error && (
          <p className="warn">CPCB fetch issue: {data.cpcb.meta.error}</p>
        )}
        <div className="map-wrap">
          <MapContainer
            key={`${preset.lat}-${preset.lon}`}
            center={[preset.lat, preset.lon]}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {(data?.cpcb?.heatmap ?? []).map((p, i) => (
              <CircleMarker
                key={`${p.station}-${i}`}
                center={[p.lat, p.lng]}
                radius={10 + Math.min(28, (p.maxAvg / maxHeat) * 28)}
                pathOptions={{
                  color: heatColor(p.maxAvg, maxHeat),
                  fillColor: heatColor(p.maxAvg, maxHeat),
                  fillOpacity: 0.55,
                }}
              >
                <Popup>
                  <strong>{p.station}</strong>
                  <br />
                  {p.city}
                  <br />
                  max avg ug/m3 (sub-index): {p.maxAvg.toFixed(1)}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>
    </>
  );
}
