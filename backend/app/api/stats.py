from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.assessment import RiskAssessment, AlertRecord
from app.models.disaster import RiskZone
from app.services.risk_engine import haversine
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/stats", tags=["stats"])

PERIOD_DAYS = {"today": 1, "week": 7, "month": 30}


def get_start_date(period: str) -> datetime:
    days = PERIOD_DAYS.get(period, 7)
    return datetime.utcnow() - timedelta(days=days)


@router.get("/trends")
async def get_trends(
    period: str = Query(default="week"),
    db: AsyncSession = Depends(get_db),
):
    """Return daily risk score averages and alert counts for the period."""
    start = get_start_date(period)
    days = PERIOD_DAYS.get(period, 7)

    trends = []
    for i in range(days):
        day = start + timedelta(days=i)
        day_end = day + timedelta(days=1)

        score_result = await db.scalar(
            select(func.avg(RiskAssessment.risk_score)).where(
                RiskAssessment.assessment_time >= day.isoformat(),
                RiskAssessment.assessment_time < day_end.isoformat(),
            )
        )

        alert_result = await db.scalar(
            select(func.count()).select_from(AlertRecord).where(
                AlertRecord.created_at >= day.isoformat(),
                AlertRecord.created_at < day_end.isoformat(),
            )
        )

        trends.append({
            "date": day.strftime("%m-%d"),
            "avg_risk_score": round(score_result or 0, 1),
            "alert_count": alert_result or 0,
        })

    return trends


@router.get("/population")
async def get_population_stats(
    period: str = Query(default="week"),
    db: AsyncSession = Depends(get_db),
):
    """Return affected population by disaster type for the period."""
    from app.models.disaster import DisasterEvent
    start = get_start_date(period)

    result = await db.execute(
        select(
            DisasterEvent.disaster_type,
            func.sum(DisasterEvent.affected_population)
        )
        .where(DisasterEvent.created_at >= start.isoformat())
        .group_by(DisasterEvent.disaster_type)
    )
    rows = result.all()

    disaster_types = ["earthquake", "flood", "typhoon", "landslide", "fire"]
    data = []
    for dtype in disaster_types:
        row = next((r for r in rows if r[0] == dtype), None)
        data.append({
            "disaster_type": dtype,
            "affected_population": row[1] if row else 0,
        })

    return data


@router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Given lat/lng, return the nearest risk zone info."""
    result = await db.execute(select(RiskZone))
    zones = result.scalars().all()

    if not zones:
        return {"found": False, "message": "暂无风险区域数据"}

    nearest = None
    nearest_dist = float("inf")
    for z in zones:
        d = haversine(lat, lng, z.latitude, z.longitude)
        if d < nearest_dist:
            nearest_dist = d
            nearest = z

    if nearest_dist > 50:
        return {"found": False, "message": "该区域50km内暂无风险数据", "distance_km": round(nearest_dist, 1)}

    return {
        "found": True,
        "zone_name": nearest.name,
        "risk_level": nearest.risk_level,
        "latitude": nearest.latitude,
        "longitude": nearest.longitude,
        "radius_km": nearest.radius_km,
        "population_density": nearest.population_density,
        "distance_km": round(nearest_dist, 1),
    }
