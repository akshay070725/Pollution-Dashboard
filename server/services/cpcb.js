const CPCB_RESOURCE =
  "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

function parseNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function fetchCpcbByCity(city, apiKey, limit = 80) {
  if (!apiKey?.trim()) return { records: [], source: "cpcb_skipped_no_key" };
  const u = new URL(CPCB_RESOURCE);
  u.searchParams.set("api-key", apiKey.trim());
  u.searchParams.set("format", "json");
  u.searchParams.set("limit", String(limit));
  if (city?.trim()) u.searchParams.set("filters[city]", city.trim());
  const res = await fetch(u);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`data.gov.in CPCB resource: ${res.status} ${t}`);
  }
  const data = await res.json();
  const records = (data.records ?? []).map((r) => ({
    country: r.country,
    state: r.state,
    city: r.city,
    station: r.station,
    pollutant_id: r.pollutant_id,
    last_update: r.last_update,
    latitude: parseNum(r.latitude),
    longitude: parseNum(r.longitude),
    pollutant_min: parseNum(r.pollutant_min),
    pollutant_max: parseNum(r.pollutant_max),
    pollutant_avg: parseNum(r.pollutant_avg),
  }));
  return { records, source: "cpcb_data_gov_in" };
}

export function recordsToHeatmapPoints(records) {
  const byKey = new Map();
  for (const r of records) {
    if (r.latitude == null || r.longitude == null || r.pollutant_avg == null)
      continue;
    const key = `${r.station}|${r.latitude}|${r.longitude}`;
    const cur = byKey.get(key) ?? {
      lat: r.latitude,
      lng: r.longitude,
      station: r.station,
      city: r.city,
      maxAvg: 0,
    };
    cur.maxAvg = Math.max(cur.maxAvg, r.pollutant_avg);
    byKey.set(key, cur);
  }
  return [...byKey.values()];
}
