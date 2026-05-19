"""Emergency decision engine for generating evacuation and response plans."""

from dataclasses import dataclass
from typing import Optional

from app.services.risk_engine import haversine, classify_risk_level


@dataclass
class DecisionResult:
    risk_level: str
    risk_score: float
    recommended_action: str
    safe_zone_name: str
    safe_zone_distance_km: float
    evacuation_route: list[list[float]]
    estimated_time_minutes: float


ACTION_MAP = {
    "critical": "立即组织疏散！灾害即将/已发生，请按推荐路线前往安全区。",
    "high": "发布紧急预警！密切监测灾害发展，准备疏散高风险区域人员。",
    "medium": "加强监测，通知居民做好应急准备，检查应急物资储备。",
    "low": "维持正常监测，定期发布安全信息，开展日常防灾宣传。",
}


def make_decision(
    person_lat: float,
    person_lng: float,
    disaster_lat: float,
    disaster_lng: float,
    disaster_severity: str,
    disaster_radius_km: float,
    population_density: float,
    safe_zones: list[dict],
) -> Optional[DecisionResult]:
    from app.services.risk_engine import calculate_risk_score, find_nearest_safe_zone, generate_evacuation_path

    distance = haversine(person_lat, person_lng, disaster_lat, disaster_lng)
    risk_score = calculate_risk_score(disaster_severity, distance, population_density, disaster_radius_km)
    risk_level = classify_risk_level(risk_score)

    nearest_safe = find_nearest_safe_zone(person_lat, person_lng, safe_zones)
    if nearest_safe is None:
        return None

    route = generate_evacuation_path(
        person_lat, person_lng,
        nearest_safe["latitude"], nearest_safe["longitude"],
    )

    avg_walking_speed_kmh = 5.0
    est_time = (nearest_safe["distance_km"] / avg_walking_speed_kmh) * 60

    return DecisionResult(
        risk_level=risk_level,
        risk_score=risk_score,
        recommended_action=ACTION_MAP.get(risk_level, ACTION_MAP["low"]),
        safe_zone_name=nearest_safe["name"],
        safe_zone_distance_km=nearest_safe["distance_km"],
        evacuation_route=route,
        estimated_time_minutes=round(est_time, 1),
    )
