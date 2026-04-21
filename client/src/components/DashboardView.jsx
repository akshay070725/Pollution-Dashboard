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
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function heatColor(v, maxV) {
  if (!maxV) return "#3dd6c6";
  const t = Math.min(1, v / maxV);
  if (t < 0.33) return "#3dd6c6";
  if (t < 0.66) return "#f0b429";
  return "#ff6b6b";
}

export default function DashboardView({ preset, data, err, loading, load, chartRows, maxHeat }) {
  const ow = data?.openWeather?.current;

  return (
    <>
      <div className="toolbar">
        <h2 className="section-title">{preset.name} Air Quality</h2>
        <button type="button" onClick={load} disabled={loading} className="button button-secondary">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err && <div className="alert-error">{err}</div>}

      <div className="grid-cards">
        <section className="panel-card">
          <h3>Live AQI (OpenWeather)</h3>
          {ow ? (
            <>
              <div className="aqi-label">{ow.aqiLabel}</div>
              <div className="muted">
                Index {ow.aqiIndex} · {preset.city}
              </div>
              <dl className="metrics-grid">
                {Object.entries(ow.components || {}).map(([k, v]) => (
                  <div key={k} className="metrics-row">
                    <dt>{k}</dt>
                    <dd>{v != null ? v.toFixed(2) : "—"}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="muted">No OpenWeather data.</p>
          )}
        </section>

        <section className="panel-card">
          <h3>Health recommendations</h3>
          {data?.health ? (
            <>
              <div className="health-title">{data.health.title}</div>
              <ul className="health-list">
                {(data.health.tips || []).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
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
