from sqlalchemy import String, Float, Integer, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(primary_key=True)
    zone_name: Mapped[str] = mapped_column(String(100))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(20))  # low, medium, high, critical
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100
    population_total: Mapped[int] = mapped_column(Integer, default=0)
    population_density: Mapped[float] = mapped_column(Float, default=0.0)
    emotion_index: Mapped[float] = mapped_column(Float, default=0.5)  # 0-1
    alert_count: Mapped[int] = mapped_column(Integer, default=0)
    guide_count: Mapped[int] = mapped_column(Integer, default=0)
    estimated_loss: Mapped[float] = mapped_column(Float, default=0.0)  # estimated economic loss (万元)
    disaster_type: Mapped[str] = mapped_column(String(30), nullable=True)
    assessment_time: Mapped[str] = mapped_column(String(30), server_default=func.now())


class AlertRecord(Base):
    __tablename__ = "alert_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    alert_type: Mapped[str] = mapped_column(String(30))  # early_warning, evacuation, info
    severity: Mapped[str] = mapped_column(String(20))  # low, medium, high, critical
    content: Mapped[str] = mapped_column(Text)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    target_users: Mapped[str] = mapped_column(String(20), default="all")  # all, citizens, managers
    is_active: Mapped[bool] = mapped_column(Integer, default=1)
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())


class SystemLog(Base):
    __tablename__ = "system_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    log_type: Mapped[str] = mapped_column(String(30))  # info, warning, error
    module: Mapped[str] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String(30), server_default=func.now())
