from __future__ import annotations

from math import fsum
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
    y = [float(v) for v in values]
    n = len(y)
    if n < 2:
        v = float(y[0]) if n else 0.0
        return [max(0.0, v)] * hours_ahead

    # Ordinary least squares for y = a*x + b
    # x = 0..n-1
    sum_x = (n - 1) * n / 2
    sum_x2 = (n - 1) * n * (2 * n - 1) / 6
    sum_y = fsum(y)
    sum_xy = fsum(i * y[i] for i in range(n))
    denom = n * sum_x2 - sum_x * sum_x
    slope = (n * sum_xy - sum_x * sum_y) / denom if denom else 0.0
    intercept = (sum_y - slope * sum_x) / n

    out: list[float] = []
    for i in range(1, hours_ahead + 1):
        x = (n - 1) + i
        out.append(max(0.0, slope * x + intercept))
    return out


@app.post("/predict")
def predict(body: PredictBody):
    pred = _predict_linear(body.values, body.hours_ahead)
    return {
        "hours_ahead": body.hours_ahead,
        "input_points": len(body.values),
        "forecast": pred,
        "method": "linear_trend_pure_python",
        "label": body.label,
    }


@app.get("/healthz")
def healthz():
    return {"ok": True}
