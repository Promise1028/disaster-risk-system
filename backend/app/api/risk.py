from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.assessment import RiskAssessment, AlertRecord
from app.models.disaster import DisasterEvent, RiskZone, SafeZone, EvacuationRoute
from app.models.sensor import EdgeServer
from app.schemas.risk import (
    RiskAssessmentResponse, RiskZoneResponse, SafeZoneResponse,
    DashboardStats, AlertResponse, DisasterEventResponse,
    EvacuationRouteResponse, ServerStatusResponse,
    RiskZoneCreate, DisasterEventCreate,
)
from app.services.risk_engine import haversine, calculate_risk_score, classify_risk_level
from app.services.decision_engine import make_decision
from app.services.simulator import generate_dashboard_stats
from typing import Optional
import random

router = APIRouter(prefix="/api", tags=["risk"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    stats = generate_dashboard_stats()

    # Override with real DB counts if available
    active_count = await db.scalar(select(func.count()).select_from(DisasterEvent).where(DisasterEvent.status == "active"))
    server_count = await db.scalar(select(func.count()).select_from(EdgeServer))
    online_count = await db.scalar(select(func.count()).select_from(EdgeServer).where(EdgeServer.status == "online"))

    stats["active_disasters"] = active_count or stats["active_disasters"]
    stats["total_servers"] = server_count or stats["total_servers"]
    stats["online_servers"] = online_count or stats["online_servers"]

    return DashboardStats(**stats)


@router.get("/risk-zones", response_model=list[RiskZoneResponse])
async def get_risk_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RiskZone))
    return result.scalars().all()


@router.post("/risk-zones", response_model=RiskZoneResponse)
async def create_risk_zone(zone: RiskZoneCreate, db: AsyncSession = Depends(get_db)):
    risk_zone = RiskZone(**zone.model_dump())
    db.add(risk_zone)
    await db.commit()
    await db.refresh(risk_zone)
    return risk_zone


@router.get("/safe-zones", response_model=list[SafeZoneResponse])
async def get_safe_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SafeZone))
    return result.scalars().all()


@router.get("/disasters", response_model=list[DisasterEventResponse])
async def get_disasters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DisasterEvent).order_by(DisasterEvent.created_at.desc()))
    return result.scalars().all()


@router.post("/disasters", response_model=DisasterEventResponse)
async def create_disaster(event: DisasterEventCreate, db: AsyncSession = Depends(get_db)):
    disaster = DisasterEvent(**event.model_dump(), status="active")
    db.add(disaster)
    await db.commit()
    await db.refresh(disaster)
    return disaster


@router.get("/assessments", response_model=list[RiskAssessmentResponse])
async def get_assessments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RiskAssessment).order_by(RiskAssessment.assessment_time.desc()).limit(50))
    return result.scalars().all()


@router.get("/alerts", response_model=list[AlertResponse])
async def get_alerts(
    active_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
):
    q = select(AlertRecord).order_by(AlertRecord.created_at.desc())
    if active_only:
        q = q.where(AlertRecord.is_active == True)
    result = await db.execute(q.limit(50))
    return result.scalars().all()


@router.get("/servers", response_model=list[ServerStatusResponse])
async def get_servers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EdgeServer))
    return result.scalars().all()


@router.get("/evacuation-routes", response_model=list[EvacuationRouteResponse])
async def get_evacuation_routes(
    disaster_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(EvacuationRoute).limit(50))
    return result.scalars().all()


@router.post("/decision")
async def get_emergency_decision(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    disaster_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    # Get nearest active disaster
    disasters_result = await db.execute(
        select(DisasterEvent).where(DisasterEvent.status == "active")
    )
    disasters = disasters_result.scalars().all()
    if not disasters:
        return {"error": "No active disasters"}

    nearest = min(disasters, key=lambda d: haversine(lat, lng, d.latitude, d.longitude))

    safe_result = await db.execute(select(SafeZone))
    safe_zones = [{"latitude": sz.latitude, "longitude": sz.longitude, "name": sz.name, "capacity": sz.capacity, "current_occupancy": sz.current_occupancy} for sz in safe_result.scalars().all()]

    decision = make_decision(
        person_lat=lat, person_lng=lng,
        disaster_lat=nearest.latitude, disaster_lng=nearest.longitude,
        disaster_severity=nearest.severity,
        disaster_radius_km=nearest.radius_km,
        population_density=random.uniform(500, 5000),
        safe_zones=safe_zones,
    )

    if decision is None:
        return {"error": "No safe zones available"}

    return {
        "risk_level": decision.risk_level,
        "risk_score": decision.risk_score,
        "recommended_action": decision.recommended_action,
        "safe_zone": decision.safe_zone_name,
        "safe_zone_distance_km": decision.safe_zone_distance_km,
        "evacuation_route": decision.evacuation_route,
        "estimated_time_minutes": decision.estimated_time_minutes,
        "disaster": {
            "name": nearest.name,
            "type": nearest.disaster_type,
            "severity": nearest.severity,
            "distance_km": round(haversine(lat, lng, nearest.latitude, nearest.longitude), 2),
        },
    }
