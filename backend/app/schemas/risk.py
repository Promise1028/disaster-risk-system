from pydantic import BaseModel
from typing import Optional


class RiskAssessmentResponse(BaseModel):
    id: int
    zone_name: str
    latitude: float
    longitude: float
    risk_level: str
    risk_score: float
    population_total: int
    population_density: float
    emotion_index: float
    alert_count: int
    guide_count: int
    estimated_loss: float
    disaster_type: Optional[str] = None
    assessment_time: str

    model_config = {"from_attributes": True}


class RiskZoneResponse(BaseModel):
    id: int
    name: str
    risk_level: str
    latitude: float
    longitude: float
    radius_km: float
    population_density: float
    emotion_index: float
    alert_count: int
    guide_count: int

    model_config = {"from_attributes": True}


class SafeZoneResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    facility_type: str

    model_config = {"from_attributes": True}


class DisasterEventResponse(BaseModel):
    id: int
    name: str
    disaster_type: str
    severity: str
    latitude: float
    longitude: float
    radius_km: float
    description: str
    status: str
    affected_population: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class EvacuationRouteResponse(BaseModel):
    id: int
    name: str
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    safe_zone_id: Optional[int] = None
    distance_km: float
    risk_level: str
    path_json: str

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_population: int
    avg_population_density: float
    avg_emotion_index: float
    total_alerts: int
    total_guides: int
    risk_level_distribution: dict  # {"low": N, "medium": N, "high": N, "critical": N}
    disaster_type_distribution: dict
    estimated_total_loss: float
    active_disasters: int
    online_servers: int
    total_servers: int


class ServerStatusResponse(BaseModel):
    id: int
    name: str
    location: str
    latitude: float
    longitude: float
    status: str
    cpu_usage: float
    memory_usage: float
    sensor_count: int
    region_risk_level: str
    last_heartbeat: str

    model_config = {"from_attributes": True}


class AlertResponse(BaseModel):
    id: int
    title: str
    alert_type: str
    severity: str
    content: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    target_users: str
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class RiskZoneCreate(BaseModel):
    name: str
    risk_level: str
    latitude: float
    longitude: float
    radius_km: float = 2.0


class DisasterEventCreate(BaseModel):
    name: str
    disaster_type: str
    severity: str
    latitude: float
    longitude: float
    radius_km: float = 1.0
    description: str = ""
