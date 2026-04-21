from __future__ import annotations

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Pollution trend predictor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictBody(BaseModel):
    values: list[float] = Field(..., min_length=1)
    hours_ahead: int = Field(24, ge=1, le=168)
    label: str | None = None


def _predict_linear(values: list[float], hours_ahead: int) -> list[float]:
    y = np.asarray(values, dtype=float)
    if y.size < 2:
        v = float(y[0]) if y.size else 0.0
        return [max(0.0, v)] * hours_ahead
    x = np.arange(y.size, dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    future_x = np.arange(y.size, y.size + hours_ahead, dtype=float)
    pred = slope * future_x + intercept
    return np.maximum(pred, 0.0).tolist()


@app.post("/predict")
def predict(body: PredictBody):
    pred = _predict_linear(body.values, body.hours_ahead)
    return {
        "hours_ahead": body.hours_ahead,
        "input_points": len(body.values),
        "forecast": pred,
        "method": "linear_trend_numpy",
        "label": body.label,
    }


@app.get("/healthz")
def healthz():
    return {"ok": True}
