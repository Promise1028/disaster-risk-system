from sqlalchemy import String, Float, Integer, DateTime, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class EdgeServer(Base):
    __tablename__ = "edge_servers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    location: Mapped[str] = mapped_column(String(200))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="online")  # online, offline, degraded
    cpu_usage: Mapped[float] = mapped_column(Float, default=0.0)
    memory_usage: Mapped[float] = mapped_column(Float, default=0.0)
    sensor_count: Mapped[int] = mapped_column(Integer, default=0)
    region_risk_level: Mapped[str] = mapped_column(String(20), default="low")
    last_heartbeat: Mapped[str] = mapped_column(String(30), server_default=func.now())
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())


class Sensor(Base):
    __tablename__ = "sensors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    sensor_type: Mapped[str] = mapped_column(String(30))  # seismic, water_level, wind_speed, rain_gauge, smoke, camera
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    edge_server_id: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    unit: Mapped[str] = mapped_column(String(20), default="")
    normal_range_min: Mapped[float] = mapped_column(Float, nullable=True)
    normal_range_max: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())


class SensorData(Base):
    __tablename__ = "sensor_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    sensor_id: Mapped[int] = mapped_column(Integer, index=True)
    value: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[str] = mapped_column(String(30), server_default=func.now())
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
