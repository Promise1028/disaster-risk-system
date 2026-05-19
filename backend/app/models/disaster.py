from sqlalchemy import String, Float, Integer, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    disaster_type: Mapped[str] = mapped_column(String(30))  # earthquake, flood, typhoon, landslide, fire
    severity: Mapped[str] = mapped_column(String(20), default="low")  # low, medium, high, critical
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    radius_km: Mapped[float] = mapped_column(Float, default=1.0)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, monitoring, resolved
    affected_population: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(String(30), server_default=func.now())


class RiskZone(Base):
    __tablename__ = "risk_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    risk_level: Mapped[str] = mapped_column(String(20))  # low, medium, high, critical
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    radius_km: Mapped[float] = mapped_column(Float, default=2.0)
    disaster_id: Mapped[int] = mapped_column(Integer, nullable=True)
    population_density: Mapped[float] = mapped_column(Float, default=0.0)
    emotion_index: Mapped[float] = mapped_column(Float, default=0.5)
    alert_count: Mapped[int] = mapped_column(Integer, default=0)
    guide_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())


class SafeZone(Base):
    __tablename__ = "safe_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    capacity: Mapped[int] = mapped_column(Integer, default=500)
    current_occupancy: Mapped[int] = mapped_column(Integer, default=0)
    facility_type: Mapped[str] = mapped_column(String(50), default="shelter")  # shelter, hospital, supply_station
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())


class EvacuationRoute(Base):
    __tablename__ = "evacuation_routes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    from_lat: Mapped[float] = mapped_column(Float)
    from_lng: Mapped[float] = mapped_column(Float)
    to_lat: Mapped[float] = mapped_column(Float)
    to_lng: Mapped[float] = mapped_column(Float)
    safe_zone_id: Mapped[int] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="low")
    path_json: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of [lat, lng] pairs
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())
