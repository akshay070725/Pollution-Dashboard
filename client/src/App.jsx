import { Link, NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import DashboardView from "./components/DashboardView";
import { getCityById, PRESETS } from "./data/cities";
import useDashboardData from "./hooks/useDashboardData";

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/cities" element={<CitiesPage />} />
      <Route path="/cities/:cityId" element={<CityDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
