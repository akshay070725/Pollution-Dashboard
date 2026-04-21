import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function getApiUrl(pathWithQuery) {
  if (!API_BASE) return pathWithQuery;
  return `${API_BASE}${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
}

export default function useDashboardData(preset) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams({
        lat: String(preset.lat),
        lon: String(preset.lon),
        city: preset.city,
      });
      const res = await fetch(getApiUrl(`/api/dashboard?${q}`));
      const raw = await res.text();
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        const hint =
          raw.includes("Cannot GET") || raw.includes("<!DOCTYPE")
            ? API_BASE
              ? ` API base is set to ${API_BASE}. Verify this URL serves /api/dashboard.`
              : " You may be on the wrong URL: run the UI with `npm run dev` inside `client` and open http://localhost:5173 (not the API port)."
            : "";
        throw new Error(`Not JSON from server (${res.status}).${hint}`);
      }
      if (!res.ok) throw new Error(json.error || res.statusText);
      setData(json);
    } catch (error) {
      if (String(error.message || error).includes("Failed to fetch")) {
        setErr(
          API_BASE
            ? `Cannot reach API at ${API_BASE}. Check backend deployment and CORS, then retry.`
            : "Cannot reach the API. Start the server: `npm run dev:api` from the project root, and use the Vite app at http://localhost:5173 (not file://).",
        );
      } else {
        setErr(String(error.message || error));
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    load();
  }, [load]);

  const chartRows = useMemo(() => {
    if (!data?.openWeather?.forecast?.length) return [];
    const fc = data.openWeather.forecast;
    const pred = data.prediction?.forecast ?? [];
    const rows = fc.map((point) => ({
      t: new Date(point.dt * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      pm25: point.pm2_5 ?? null,
      owIndex: point.aqiIndex ?? null,
    }));
    const lastT = fc.length ? fc[fc.length - 1].dt : null;
    pred.slice(0, 24).forEach((v, i) => {
      const dt = lastT ? (lastT + (i + 1) * 3600) * 1000 : Date.now();
      rows.push({
        t: new Date(dt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        pm25: null,
        predicted: v,
      });
    });
    return rows;
  }, [data]);

  const maxHeat = useMemo(() => {
    const pts = data?.cpcb?.heatmap ?? [];
    return Math.max(1, ...pts.map((p) => p.maxAvg));
  }, [data]);

  return {
    data,
    err,
    loading,
    load,
    chartRows,
    maxHeat,
  };
}
