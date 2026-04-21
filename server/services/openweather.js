const OW_AIR = "https://api.openweathermap.org/data/2.5/air_pollution";
const OW_FORECAST = "https://api.openweathermap.org/data/2.5/air_pollution/forecast";

function aqiLabelFromOwIndex(i) {
  const m = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
  return m[i] ?? "Unknown";
}

export async function fetchCurrentAirPollution(lat, lon, apiKey) {
  const u = new URL(OW_AIR);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lon));
  u.searchParams.set("appid", apiKey);
  const res = await fetch(u);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenWeather air_pollution: ${res.status} ${t}`);
  }
  const data = await res.json();
  const list = data.list ?? [];
  const latest = list[0];
  if (!latest) return null;
  const main = latest.main ?? {};
  const comp = latest.components ?? {};
  return {
    dt: latest.dt,
    aqiIndex: main.aqi,
    aqiLabel: aqiLabelFromOwIndex(main.aqi),
    components: {
      co: comp.co,
      no: comp.no,
      no2: comp.no2,
      o3: comp.o3,
      so2: comp.so2,
      pm2_5: comp.pm2_5,
      pm10: comp.pm10,
      nh3: comp.nh3,
    },
  };
}

export async function fetchAirPollutionForecast(lat, lon, apiKey) {
  const u = new URL(OW_FORECAST);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lon));
  u.searchParams.set("appid", apiKey);
  const res = await fetch(u);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenWeather forecast: ${res.status} ${t}`);
  }
  const data = await res.json();
  return (data.list ?? []).map((item) => ({
    dt: item.dt,
    aqiIndex: item.main?.aqi,
    aqiLabel: aqiLabelFromOwIndex(item.main?.aqi),
    pm2_5: item.components?.pm2_5,
    pm10: item.components?.pm10,
  }));
}
