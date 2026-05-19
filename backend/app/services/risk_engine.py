"""Risk assessment engine for disaster risk calculation.

Risk = Hazard × Vulnerability × Exposure
- Hazard: disaster intensity/frequency
- Vulnerability: population density, building resilience
- Exposure: proximity to disaster source
"""

import math
from typing import Optional


SEVERITY_WEIGHTS = {"low": 20, "medium": 50, "high": 80, "critical": 100}


def calculate_risk_score(
    hazard_severity: str,
    distance_km: float,
    population_density: float,
    radius_km: float = 1.0,
    base_hazard: float = 0.5,
) -> float:
    """Calculate risk score (0-100) for a location relative to a hazard source."""
    severity_weight = SEVERITY_WEIGHTS.get(hazard_severity, 10)

    # Hazard component: decays with distance from source
    if distance_km <= radius_km:
        hazard = severity_weight * base_hazard
    else:
        decay = math.exp(-(distance_km - radius_km) / (radius_km + 0.1))
        hazard = severity_weight * base_hazard * decay

    # Vulnerability: higher density = higher vulnerability
    vulnerability = min(population_density / 10000 + 0.3, 1.0)

    # Exposure factor based on distance
    exposure = min(1.0, radius_km / max(distance_km, 0.01))

    risk = hazard * vulnerability * exposure
    return round(min(risk, 100.0), 1)


def classify_risk_level(score: float) -> str:
    if score >= 70:
        return "critical"
    elif score >= 50:
        return "high"
    elif score >= 25:
        return "medium"
    return "low"


def estimate_economic_loss(
    population_affected: int,
    risk_score: float,
    disaster_type: str,
) -> float:
    """Estimate economic loss in 万元 based on simplified model."""
    loss_per_person = {
        "earthquake": 15.0,
        "flood": 8.0,
        "typhoon": 12.0,
        "landslide": 10.0,
        "fire": 6.0,
    }
    base = loss_per_person.get(disaster_type, 5.0)
    factor = risk_score / 50.0  # scale by risk score
    return round(population_affected * base * factor / 10000, 2)


def find_nearest_safe_zone(
    person_lat: float,
    person_lng: float,
    safe_zones: list[dict],
) -> Optional[dict]:
    """Find nearest safe zone with available capacity."""
    best = None
    best_dist = float("inf")
    for sz in safe_zones:
        d = haversine(person_lat, person_lng, sz["latitude"], sz["longitude"])
        available = sz.get("capacity", 1000) - sz.get("current_occupancy", 0)
        if d < best_dist and available > 0:
            best_dist = d
            best = {**sz, "distance_km": round(d, 2)}
    return best


def generate_evacuation_path(
    from_lat: float, from_lng: float,
    to_lat: float, to_lng: float,
    steps: int = 10,
) -> list[list[float]]:
    """Generate a simplified straight-line path between two points."""
    path = []
    for i in range(steps + 1):
        t = i / steps
        lat = from_lat + (to_lat - from_lat) * t
        lng = from_lng + (to_lng - from_lng) * t
        path.append([round(lat, 6), round(lng, 6)])
    return path


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
