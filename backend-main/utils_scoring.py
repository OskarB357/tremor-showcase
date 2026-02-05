# LAST COMMIT: Anika Kulkarni, 1/30/26
# This script executes spiral scoring criteria, including data extraction, metric generation, weighting, and summing into a final score  

from __future__ import annotations

import base64
import io
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np
import matplotlib.pyplot as plt

from scipy.signal import savgol_filter

# Define weights such that final score = sum of weights * values
WEIGHTS = {
    "log_dr_dtheta_mean": 0.30,
    "log_dr_dt_mean": 0.20,
    "auc_ratio": 0.20,
    "geom_power": 0.10,
    "temp_power": 0.10,
    "jerk_proxy": 0.10,
}

# Import population stats for z-scores
def load_population_stats(path: str) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Population stats not found at: {p.resolve()}")
    import json
    obj = json.loads(p.read_text(encoding="utf-8"))
    return obj["statistics"] if "statistics" in obj else obj

# Prevent crashes and NaNs in final score
def zscore(x: float, mean: float, std: float) -> float:
    if not np.isfinite(x) or not np.isfinite(mean) or not np.isfinite(std) or std == 0:
        return 0.0
    return float((x - mean) / std)

# Computes mean ignoring NaN and inf
def safe_mean(arr: np.ndarray) -> float:
    arr = arr[np.isfinite(arr)]
    return float(np.mean(arr)) if arr.size else float("nan")

# Computes smoothed version of dr/dt
def moving_average(x: np.ndarray, window: int = 7) -> np.ndarray:
    window = max(1, int(window))
    if window == 1:
        return x.copy()
    kernel = np.ones(window, dtype=float) / float(window)
    return np.convolve(x, kernel, mode="same")


def odd_window_at_most(n: int, target: int) -> int:
    if n < 7:
        return 0
    w = min(target, n - 1)
    if w % 2 == 0:
        w -= 1
    return max(5, w)

# Remove consecutive identifical points to prevent nonsense derivatives (so pen lifts # doesn't explode)
def _remove_consecutive_duplicates(x: np.ndarray, y: np.ndarray, t: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    if len(t) == 0:
        return x, y, t
    keep = np.ones(len(t), dtype=bool)
    keep[1:] = ~((x[1:] == x[:-1]) & (y[1:] == y[:-1]) & (t[1:] == t[:-1]))
    return x[keep], y[keep], t[keep]


def extract_xy_t(spiral_json: dict) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Expected formats (supports several):
      - spiral_json["points"] with keys x/y/t_ms
      - spiral_json["points"] with keys "x []"/"y []"/"t [ms]"
      - spiral_json["data"]["points"] ... (if wrapped)
    """
    candidate = spiral_json
    if "data" in spiral_json and isinstance(spiral_json["data"], dict):
        candidate = spiral_json["data"]

    pts = candidate.get("points") or spiral_json.get("points")
    if not pts:
        raise ValueError("Could not find 'points' in spiral JSON.")

    def get(p, *keys):
        for k in keys:
            if k in p:
                return p[k]
        raise KeyError(f"None of keys {keys} found in point: {p.keys()}")

    # Extract x, y, t into Numpy arrays 
    x = np.array([float(get(p, "x", "x []")) for p in pts], dtype=float)
    y = np.array([float(get(p, "y", "y []")) for p in pts], dtype=float)
    t = np.array([float(get(p, "t_ms", "t [ms]", "t")) for p in pts], dtype=float)
    return x, y, t

# Convert trace into processed trace by adding r, theta, relative r (basically, unwrap spiral)
def build_processed_trace(a: float, b: float, x: np.ndarray, y: np.ndarray, t_ms: np.ndarray) -> Dict[str, Any]:
    r = np.sqrt(x**2 + y**2)
    theta = np.unwrap(np.arctan2(y, x))
    rel_r = r - (a + b * theta)

    pts = []
    for i in range(len(t_ms)):
        pts.append({
            "x []": float(x[i]),
            "y []": float(y[i]),
            "t [ms]": float(t_ms[i]),
            "r []": float(r[i]),
            "theta [rad]": float(theta[i]),
            "relative r []": float(rel_r[i]),
        })

    return {"metadata": {"a []": float(a), "b []": float(b)}, "points": pts}

# Andrew's code basically
def compute_metrics_from_processed_trace(data: Dict[str, Any]) -> Tuple[Dict[str, float], Dict[str, Any]]:
    meta = data["metadata"]
    pts = data["points"]

    theta = np.array([p["theta [rad]"] for p in pts], dtype=float)
    r = np.array([p["r []"] for p in pts], dtype=float)
    rel_r = np.array([p["relative r []"] for p in pts], dtype=float)
    x = np.array([p["x []"] for p in pts], dtype=float)
    y = np.array([p["y []"] for p in pts], dtype=float)
    t = np.array([p["t [ms]"] for p in pts], dtype=float)

    a = float(meta["a []"])
    b = float(meta.get("b [/rad]", meta.get("b []")))

    n = len(t)
    if n < 10:
        raise ValueError(f"Too few points ({n}) to compute stable derivatives.")

    dt = float(np.mean(np.diff(t)))
    if not np.isfinite(dt) or dt <= 0:
        raise ValueError("Bad dt computed from t [ms].")

    w_main = odd_window_at_most(n, 31)
    w_jerk = odd_window_at_most(n, 51)
    if w_main == 0 or w_jerk == 0:
        raise ValueError("Trace too short for Savitzky-Golay filtering.")

    dr_dt = savgol_filter(r, window_length=w_main, polyorder=5, deriv=1, delta=dt)
    dtheta_dt = savgol_filter(theta, window_length=w_main, polyorder=5, deriv=1, delta=dt)
    d3r_dt3 = savgol_filter(r, window_length=w_jerk, polyorder=7, deriv=3, delta=dt)

    with np.errstate(divide="ignore", invalid="ignore"):
        dr_dtheta = dr_dt / dtheta_dt
        dr_dtheta[~np.isfinite(dr_dtheta)] = np.nan

    valid = np.isfinite(dr_dtheta) & (dr_dtheta > 0)
    mean_log_dr_dtheta = safe_mean(np.log(dr_dtheta[valid]))

    valid = np.isfinite(dr_dt) & (dr_dt > 0)
    mean_log_dr_dt = safe_mean(np.log(dr_dt[valid]))

    dr_dt_smooth = moving_average(dr_dt, window=7)

    # AUC ratio (smoothed r)
    r_s = savgol_filter(r, window_length=w_main, polyorder=3, deriv=0)
    dA_dt_s = 0.5 * (r_s**2) * dtheta_dt
    area_cum = np.concatenate(([0.0], np.cumsum(0.5 * (dA_dt_s[:-1] + dA_dt_s[1:]) * np.diff(t))))
    drawn_auc = float(area_cum[-1])

    th1 = float(theta[0])
    th2 = float(theta[-1])
    fit_auc = float(
        0.5
        * (
            (b**2) * (th2**3 - th1**3) / 3.0
            + b * a * (th2**2 - th1**2)
            + (a**2) * (th2 - th1)
        )
    )
    auc_ratio = float(drawn_auc / fit_auc) if fit_auc != 0 else float("nan")

    geom_power = float(np.mean(rel_r**2))
    temp_power = float(np.mean((dr_dt - dr_dt_smooth) ** 2))

    # Jerk proxy
    T = float(t[-1] - t[0])  # ms
    dx = np.diff(x)
    dy = np.diff(y)
    L = float(np.sum(np.sqrt(dx**2 + dy**2)))
    jerk_integral = float(np.sum((d3r_dt3**2) * dt))
    jerk_proxy = float(np.log(T**3) * jerk_integral / (L**2)) if (T > 0 and L > 0) else float("nan")

    metrics = {
        "Mean of log dr_dtheta": mean_log_dr_dtheta,
        "Mean of log dr_dt": mean_log_dr_dt,
        "AUC ratio (drawn/fit)": auc_ratio,
        "Geometric power": geom_power,
        "Temporal power": temp_power,
        "Jerk proxy": jerk_proxy,
    }

    debug = {
        "a": a,
        "b": b,
        "dt_ms": dt,
        "n_points": n,
        "sg_window_main": w_main,
        "sg_window_jerk": w_jerk,
    }
    return metrics, debug

# Build population reference tbale, compute z-scores, add weights
# Kavin's code basically 
def score_from_metrics(metrics: Dict[str, float], pop: Dict[str, Any]) -> Dict[str, Any]:
    pop_ref = {
        "log_dr_dtheta_mean": {
            "mean": pop["Population mean of log dr_dtheta"],
            "std": pop["Population stdev of log dr_dtheta"],
            "raw": metrics["Mean of log dr_dtheta"],
        },
        "log_dr_dt_mean": {
            "mean": pop["Population mean of log dr_dt"],
            "std": pop["Population stdev of log dr_dt"],
            "raw": metrics["Mean of log dr_dt"],
        },
        "auc_ratio": {
            "mean": pop["Population mean of drawn AUC to fit AUC"],
            "std": pop["Population stdev of drawn AUC to fit AUC"],
            "raw": metrics["AUC ratio (drawn/fit)"],
        },
        "geom_power": {
            "mean": pop["Population mean of geometric power"],
            "std": pop["Population stdev of geometric power"],
            "raw": metrics["Geometric power"],
        },
        "temp_power": {
            "mean": pop["Population mean of temporal power"],
            "std": pop["Population stdev of temporal power"],
            "raw": metrics["Temporal power"],
        },
        "jerk_proxy": {
            "mean": pop["Population mean of log dimensionless jerk"],
            "std": pop["Population stdev of log dimensionless jerk"],
            "raw": metrics["Jerk proxy"],
        },
    }

    z = {k: zscore(v["raw"], v["mean"], v["std"]) for k, v in pop_ref.items()}
    contrib = {k: float(z[k] * WEIGHTS[k]) for k in z}
    final_score = float(sum(contrib.values()))
    sorted_contrib = sorted(contrib.items(), key=lambda kv: abs(kv[1]), reverse=True)

    return {
        "population_reference": pop_ref,
        "z_scores": z,
        "weights": WEIGHTS,
        "weighted_contributions": contrib,
        "weighted_contributions_sorted": sorted_contrib,
        "final_score": final_score,
    }

# Creates preview image of spiral in report
def render_spiral_png_base64(processed_trace: Dict[str, Any]) -> str:
    pts = processed_trace["points"]
    x = [p["x []"] for p in pts]
    y = [p["y []"] for p in pts]

    fig = plt.figure()
    plt.plot(x, y)
    plt.gca().set_aspect("equal", adjustable="box")
    plt.axis("off")

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)

    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def score_spiral_json(
    spiral_json: dict,
    a: float,
    b: float,
    popstats_path: str,
    include_image: bool = True,
) -> Dict[str, Any]:
    x, y, t = extract_xy_t(spiral_json)
    x, y, t = _remove_consecutive_duplicates(x, y, t)
    if len(t) < 10:
        raise ValueError("Too few points after cleaning to score reliably.")

    # Center the coordinates at origin (required for spiral analysis)
    # The spiral equation r = a + b*theta assumes origin at (0,0)
    x_center = float(np.mean(x))
    y_center = float(np.mean(y))
    x = x - x_center
    y = y - y_center
    
    # After centering, recalculate a and b to fit the centered spiral
    # This ensures the spiral parameters match the actual centered coordinates
    r_centered = np.sqrt(x**2 + y**2)
    theta_centered = np.unwrap(np.arctan2(y, x))
    
    # Fit a linear model: r = a + b*theta using least squares
    # Only use points where theta is well-defined
    valid = np.isfinite(theta_centered) & np.isfinite(r_centered) & (theta_centered > 0)
    if np.sum(valid) > 10:
        theta_valid = theta_centered[valid]
        r_valid = r_centered[valid]
        # Solve: r = a + b*theta -> [1, theta] @ [a, b]^T = r
        A = np.vstack([np.ones(len(theta_valid)), theta_valid]).T
        coeffs = np.linalg.lstsq(A, r_valid, rcond=None)[0]
        a_fitted = float(coeffs[0])
        b_fitted = float(coeffs[1])
        # Use fitted parameters if they're reasonable, otherwise use original
        if np.isfinite(a_fitted) and np.isfinite(b_fitted) and b_fitted > 0:
            a = a_fitted
            b = b_fitted

    processed = build_processed_trace(a, b, x, y, t)
    pop = load_population_stats(popstats_path)
    metrics, debug = compute_metrics_from_processed_trace(processed)
    scoring = score_from_metrics(metrics, pop)

    total_time_ms = float(processed["points"][-1]["t [ms]"] - processed["points"][0]["t [ms]"])
    metrics_out = dict(metrics)
    metrics_out["Total time (ms)"] = total_time_ms

    img64 = render_spiral_png_base64(processed) if include_image else None
    top3 = scoring["weighted_contributions_sorted"][:3]
    top_contributors = [{"name": k, "contribution": float(v)} for k, v in top3]

    return {
        "metrics": metrics_out,
        "debug": debug,
        "scoring": scoring,
        "report": {
            "spiral_image_png_base64": img64,
            "top_contributors": top_contributors,
        },
        "generated_at": datetime.utcnow().isoformat(),
        "version": "utils_scoring_v1",
    }

