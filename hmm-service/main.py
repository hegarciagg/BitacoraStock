"""
HMM Microservice — Regime Detection
POST /detect-regimes  →  { states, bullState, bearState }
GET  /health          →  { status: "ok" }
"""
from __future__ import annotations

import logging
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from hmmlearn.hmm import GaussianHMM
from pydantic import BaseModel, field_validator
from sklearn.preprocessing import StandardScaler

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("hmm-service")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="HMM Regime Detection Service",
    version="1.0.0",
    description="GaussianHMM microservice for BTC regime detection",
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class DetectRegimesRequest(BaseModel):
    returns: List[float]
    range: List[float]          # (high - low) / close
    volVolatility: List[float]  # pct_change(volume)

    @field_validator("returns", "range", "volVolatility")
    @classmethod
    def must_have_data(cls, v: List[float]) -> List[float]:
        if len(v) < 20:
            raise ValueError("Need at least 20 data points for HMM fitting")
        return v


class DetectRegimesResponse(BaseModel):
    states: List[int]
    bullState: int
    bearState: int
    meanReturnsByState: List[float]


# ── Core logic ────────────────────────────────────────────────────────────────
def detect_regimes(
    returns: List[float],
    range_vals: List[float],
    vol_vol: List[float],
) -> DetectRegimesResponse:
    """
    1. Build feature matrix X = [Returns, Range, VolVolatility]
    2. Fit GaussianHMM(n_components=7)
    3. Predict hidden states
    4. Identify bull / bear state by mean return
    """
    # Build and scale feature matrix
    X_raw = np.column_stack([returns, range_vals, vol_vol]).astype(np.float64)

    # Replace NaN / Inf that may arise from pct_change on first row
    X_raw = np.nan_to_num(X_raw, nan=0.0, posinf=0.0, neginf=0.0)

    scaler = StandardScaler()
    X = scaler.fit_transform(X_raw)

    n_components = 7

    model = GaussianHMM(
        n_components=n_components,
        covariance_type="full",
        n_iter=1000,
        random_state=42,
        verbose=False,
    )

    try:
        model.fit(X)
    except Exception as exc:
        log.error("HMM fit failed: %s", exc)
        raise HTTPException(status_code=422, detail=f"HMM fit error: {exc}")

    states: List[int] = model.predict(X).tolist()

    # Mean return per state (using raw unscaled returns)
    ret_arr = np.array(returns)
    mean_returns: List[float] = []
    for s in range(n_components):
        mask = np.array(states) == s
        mean_ret = float(ret_arr[mask].mean()) if mask.any() else 0.0
        mean_returns.append(mean_ret)

    bull_state = int(np.argmax(mean_returns))
    bear_state = int(np.argmin(mean_returns))

    log.info(
        "Regimes detected: bullState=%d (μ=%.4f), bearState=%d (μ=%.4f)",
        bull_state, mean_returns[bull_state],
        bear_state, mean_returns[bear_state],
    )

    return DetectRegimesResponse(
        states=states,
        bullState=bull_state,
        bearState=bear_state,
        meanReturnsByState=mean_returns,
    )


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "hmm-regime-detection"}


@app.post("/detect-regimes", response_model=DetectRegimesResponse)
def detect_regimes_endpoint(body: DetectRegimesRequest) -> DetectRegimesResponse:
    n = len(body.returns)
    if len(body.range) != n or len(body.volVolatility) != n:
        raise HTTPException(
            status_code=400,
            detail="All feature arrays must have the same length",
        )

    log.info("Received detect-regimes request with %d data points", n)
    return detect_regimes(body.returns, body.range, body.volVolatility)


# ── Dev entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
