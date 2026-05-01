import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import DashboardView from "./components/DashboardView";
import { getCityById, PRESETS } from "./data/cities";
import { getSeverity, MONTHLY_RANKING, WEEKLY_RANKING } from "./data/pollutionRankings";
import useDashboardData from "./hooks/useDashboardData";

const RECENT_KEY = "pollution-dashboard-recent-locations";

function MainLayout({ children }) {
  return (
    <div className="page-shell">
      <header className="app-header">
        <div>
          <h1>Smart City Pollution Dashboard</h1>
          <p>
            Live AQI, CPCB heatmap insights, and ML-based trend forecasts for major Indian
            cities.
          </p>
        </div>
        <nav className="main-nav">
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/cities">Cities</NavLink>
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/rankings">Rankings</NavLink>
        </nav>
      </header>
      {children}
    </div>
  );
}

function OverviewPage() {
  const preset = PRESETS[0];
  const dashboard = useDashboardData(preset);

  return (
    <MainLayout>
      <section className="panel-card">
        <h2 className="section-title">Platform Overview</h2>
        <p className="muted">
          Start with the default city snapshot, then use the Cities page for dedicated city
          dashboards.
        </p>
        <Link className="button button-primary" to={`/cities/${preset.id}`}>
          Open {preset.name} dashboard
        </Link>
      </section>
      <DashboardView preset={preset} {...dashboard} />
    </MainLayout>
  );
}

function CitiesPage() {
  return (
    <MainLayout>
      <section className="city-grid">
        {PRESETS.map((city) => (
          <article key={city.id} className="city-card">
            <h3>{city.name}</h3>
            <p className="muted">
              Coordinates: {city.lat}, {city.lon}
            </p>
            <Link to={`/cities/${city.id}`} className="button button-secondary">
              View dashboard
            </Link>
          </article>
        ))}
      </section>
    </MainLayout>
  );
}

async function searchPlace(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Location lookup failed. Try again.");
  const places = await res.json();
  if (!places.length) throw new Error("No location found. Try a more specific name.");
  const place = places[0];
  return {
    id: "custom-search",
    name: place.name || query,
    city: place.display_name?.split(",")[0] || query,
    lat: Number(place.lat),
    lon: Number(place.lon),
  };
}

async function reverseGeocode(lat, lon) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) return "Current Location";
  const data = await res.json();
  const address = data.address || {};
  return address.city || address.town || address.village || data.name || "Current Location";
}

async function fetchApproxLocationFromIP() {
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) throw new Error("Unable to fetch approximate location from IP.");
  const data = await res.json();
  if (data?.latitude == null || data?.longitude == null) {
    throw new Error("IP-based location is unavailable at the moment.");
  }
  return {
    lat: Number(data.latitude),
    lon: Number(data.longitude),
    city: data.city || "Approximate Location",
  };
}

function getLocationErrorMessage(error) {
  if (!error) return "Unable to access your location.";
  if (error.code === 1) return "Location permission denied. Allow location access in browser site settings.";
  if (error.code === 2) return "Location unavailable right now. Check GPS/network and try again.";
  if (error.code === 3) {
    return "Location request timed out. We tried a fallback method too, but could not resolve your location.";
  }
  return error.message || "Unable to access your location.";
}

function getCurrentPositionAsync(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function ExplorePage() {
  const [query, setQuery] = useState("");
  const [locationErr, setLocationErr] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [recentLocations, setRecentLocations] = useState(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const dashboard = useDashboardData(preset);

  function saveRecent(nextPreset) {
    const next = [
      nextPreset,
      ...recentLocations.filter((p) => p.city !== nextPreset.city).slice(0, 4),
    ].slice(0, 5);
    setRecentLocations(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLocationErr("");
    setSearching(true);
    try {
      const place = await searchPlace(query.trim());
      setPreset(place);
      saveRecent(place);
    } catch (error) {
      setLocationErr(String(error.message || error));
    } finally {
      setSearching(false);
    }
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationErr("Geolocation is not supported in this browser.");
      return;
    }
    if (!window.isSecureContext) {
      setLocationErr(
        "Location works only on secure origins. Use http://localhost:5173 (not a local IP or file URL).",
      );
      return;
    }
    setLocationErr("");
    setLocating(true);
    try {
      let position;
      try {
        position = await getCurrentPositionAsync({
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0,
        });
      } catch (error) {
        // Retry once with lower accuracy and a longer timeout.
        if (error?.code !== 3) throw error;
        try {
          position = await getCurrentPositionAsync({
            timeout: 20000,
            enableHighAccuracy: false,
            maximumAge: 300000,
          });
        } catch (retryError) {
          if (retryError?.code !== 3) throw retryError;
          const approx = await fetchApproxLocationFromIP();
          setPreset({
            id: "custom-ip",
            name: `${approx.city} (Approx.)`,
            city: approx.city,
            lat: approx.lat,
            lon: approx.lon,
          });
          saveRecent({
            id: "custom-ip",
            name: `${approx.city} (Approx.)`,
            city: approx.city,
            lat: approx.lat,
            lon: approx.lon,
          });
          return;
        }
      }

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Show data immediately even if reverse geocoding fails.
      setPreset({
        id: "custom-current",
        name: "Current Location",
        city: "Current Location",
        lat,
        lon,
      });
      saveRecent({
        id: "custom-current",
        name: "Current Location",
        city: "Current Location",
        lat,
        lon,
      });

      try {
        const city = await reverseGeocode(lat, lon);
        const resolved = {
          id: "custom-current",
          name: city,
          city,
          lat,
          lon,
        };
        setPreset(resolved);
        saveRecent(resolved);
      } catch {
        // Keep coordinate-based data; reverse geocode is optional.
      }
    } catch (error) {
      setLocationErr(getLocationErrorMessage(error));
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    if (recentLocations.length > 0) return;
    handleUseCurrentLocation();
    // Intentionally run once for first-time UX.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <section className="panel-card">
        <h2 className="section-title">Explore Any Location</h2>
        <p className="muted">
          Search for a city/place or use your current location to get AQI details, health tips,
          trend forecast, and station heatmap.
        </p>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or location (e.g. Pune, India)"
          />
          <button className="button button-primary" type="submit" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? "Locating..." : "Use my location"}
          </button>
        </form>
        <div className="quick-city-row">
          {PRESETS.slice(0, 8).map((city) => (
            <button
              key={city.id}
              type="button"
              className="chip-button"
              onClick={() => {
                setPreset(city);
                saveRecent(city);
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
        {recentLocations.length > 0 && (
          <div className="recent-row">
            <p className="muted">Recent locations</p>
            <div className="quick-city-row">
              {recentLocations.map((city) => (
                <button
                  key={`${city.city}-${city.lat}-${city.lon}`}
                  type="button"
                  className="chip-button chip-button-recent"
                  onClick={() => setPreset(city)}
                >
                  {city.city}
                </button>
              ))}
            </div>
          </div>
        )}
        {locationErr && <div className="alert-error">{locationErr}</div>}
      </section>
      <DashboardView preset={preset} {...dashboard} />
    </MainLayout>
  );
}

function CityDetailPage() {
  const { cityId = "" } = useParams();
  const preset = getCityById(cityId);
  const dashboard = useDashboardData(preset);

  return (
    <MainLayout>
      <div className="breadcrumbs">
        <Link to="/cities">Cities</Link>
        <span>/</span>
        <span>{preset.name}</span>
      </div>
      <DashboardView preset={preset} {...dashboard} />
    </MainLayout>
  );
}

function RankingTable({ title, rows }) {
  const maxAqi = Math.max(...rows.map((r) => r.aqi));
  return (
    <section className="panel-card">
      <h2 className="section-title">{title}</h2>
      <p className="muted">Higher AQI means higher health risk. Colors indicate severity level.</p>
      <div className="ranking-list">
        {rows.map((row, index) => {
          const severity = getSeverity(row.aqi);
          const width = `${Math.max(20, (row.aqi / maxAqi) * 100)}%`;
          return (
            <article key={row.city} className="ranking-item">
              <div className="ranking-item-head">
                <div>
                  <span className="rank-index">#{index + 1}</span> {row.city}
                </div>
                <span className={`severity-pill ${severity.className}`}>
                  AQI {row.aqi} · {severity.label}
                </span>
              </div>
              <div className="aqi-bar-bg">
                <div className={`aqi-bar ${severity.className}`} style={{ width }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HealthSuggestionsPage() {
  return (
    <section className="panel-card">
      <h2 className="section-title">Health Protection Suggestions</h2>
      <div className="suggestion-grid">
        <article className="suggestion-card">
          <h3>Personal Protection</h3>
          <ul className="health-list">
            <li>Use an N95/KN95 mask outdoors when AQI is above 150.</li>
            <li>Avoid heavy exercise near traffic corridors in peak hours.</li>
            <li>Carry water and stay hydrated to reduce throat irritation.</li>
          </ul>
        </article>
        <article className="suggestion-card">
          <h3>Home and Indoor Air</h3>
          <ul className="health-list">
            <li>Keep windows closed during high-AQI periods.</li>
            <li>Use air purifiers in bedrooms and work spaces.</li>
            <li>Wet-mop floors to reduce dust re-suspension indoors.</li>
          </ul>
        </article>
        <article className="suggestion-card">
          <h3>High-Risk Groups</h3>
          <ul className="health-list">
            <li>Children, seniors, and asthma patients should limit outdoor time.</li>
            <li>Keep inhalers and prescribed medicines easily accessible.</li>
            <li>Seek medical help quickly for chest tightness or breathlessness.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function RankingsPage() {
  return (
    <MainLayout>
      <section className="panel-card">
        <h1 className="section-title">Most Polluted Cities in India</h1>
        <p className="muted">
          Top 10 city ranking view for the last 1 week and last 1 month with severity colors.
        </p>
      </section>
      <div className="grid-cards">
        <RankingTable title="Top 10 - Last 7 Days" rows={WEEKLY_RANKING} />
        <RankingTable title="Top 10 - Last 30 Days" rows={MONTHLY_RANKING} />
      </div>
      <HealthSuggestionsPage />
    </MainLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/cities" element={<CitiesPage />} />
      <Route path="/cities/:cityId" element={<CityDetailPage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/rankings" element={<RankingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
