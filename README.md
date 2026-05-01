# Pollution Dashboard (Web + API + ML)

This repo contains:
- `client/`: Vite + React frontend
- `server/`: Express API (calls OpenWeather + CPCB + ML)
- `ml/`: FastAPI ML predictor service

## Run locally (one command)

From the repo root:

```bash
cd /Users/akshey/Downloads/Pollution-Dashboard
npm run dev
```

Open: `http://localhost:5173`

## Deploy permanently (Render, 3 services)

This repo includes a `render.yaml` blueprint to deploy **ML + API + Web** on Render.

### 1) Push this repo to GitHub

Render deploys from a GitHub repo. Push your project to GitHub (any private/public repo is fine).

### 2) Create a new Render Blueprint deploy

In Render:
- New → **Blueprint**
- Select your GitHub repo
- Render will detect `render.yaml` and create:
  - `pollution-dashboard-ml`
  - `pollution-dashboard-api`
  - `pollution-dashboard-web`

### 3) Set environment variables (important)

After the services are created, open each service → Environment and set:

**ML service (`pollution-dashboard-ml`)**
- No secrets required.

**API service (`pollution-dashboard-api`)**
- `OPENWEATHER_API_KEY` = your OpenWeather key (**required**)
- `DATA_GOV_IN_API_KEY` = data.gov.in key (optional)
- `ML_SERVICE_URL` = the public URL of the ML service, for example:
  - `https://pollution-dashboard-ml.onrender.com`

**Web service (`pollution-dashboard-web`)**
- `VITE_API_BASE_URL` = the public URL of the API service, for example:
  - `https://pollution-dashboard-api.onrender.com`

### 4) Redeploy

After setting env vars, redeploy:
- API service
- Web service

Then open the Web service URL from Render.

## Notes

- Render free plan can sleep when idle; first load after a while may take some seconds.

