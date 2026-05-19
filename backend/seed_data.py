"""Seed database with demo data for testing."""

import asyncio
from sqlalchemy import select
from app.database import async_session, init_db, Base, engine
from app.models.user import User
from app.models.disaster import DisasterEvent, RiskZone, SafeZone, EvacuationRoute
from app.models.sensor import EdgeServer, Sensor
from app.models.assessment import RiskAssessment, AlertRecord
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    await init_db()
    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded, skipping.")
            return

        # Users
        admin = User(username="admin", email="admin@disaster.gov.cn", hashed_password=pwd_context.hash("admin123"), role="admin")
        manager = User(username="manager", email="manager@disaster.gov.cn", hashed_password=pwd_context.hash("manager123"), role="manager")
        citizen = User(username="citizen", email="citizen@example.com", hashed_password=pwd_context.hash("citizen123"), role="citizen")
        db.add_all([admin, manager, citizen])

        # Edge Servers (模拟边缘计算网关)
        servers = [
            EdgeServer(name="城东边缘网关", location="东城区", latitude=30.5928, longitude=114.3055, status="online", cpu_usage=45.2, memory_usage=62.1, sensor_count=12, region_risk_level="medium"),
            EdgeServer(name="城西边缘网关", location="西城区", latitude=30.5930, longitude=114.2900, status="online", cpu_usage=32.8, memory_usage=48.5, sensor_count=8, region_risk_level="low"),
            EdgeServer(name="城南边缘网关", location="南湖区", latitude=30.5500, longitude=114.3050, status="online", cpu_usage=58.3, memory_usage=71.2, sensor_count=15, region_risk_level="high"),
            EdgeServer(name="城北边缘网关", location="北山区", latitude=30.6300, longitude=114.3000, status="degraded", cpu_usage=89.1, memory_usage=92.5, sensor_count=6, region_risk_level="medium"),
            EdgeServer(name="高新区边缘网关", location="高新区", latitude=30.5100, longitude=114.4200, status="online", cpu_usage=28.5, memory_usage=35.8, sensor_count=10, region_risk_level="low"),
            EdgeServer(name="经开区边缘网关", location="经开区", latitude=30.4800, longitude=114.3500, status="online", cpu_usage=41.2, memory_usage=55.3, sensor_count=9, region_risk_level="low"),
        ]
        db.add_all(servers)
        await db.flush()

        # Disaster Events
        disasters = [
            DisasterEvent(name="城区地震灾害", disaster_type="earthquake", severity="high", latitude=30.5931, longitude=114.3054, radius_km=5.0, description="震中位于城区，震级5.8级，波及周边20平方公里", status="active", affected_population=85000),
            DisasterEvent(name="南湖洪水预警", disaster_type="flood", severity="medium", latitude=30.5480, longitude=114.3100, radius_km=3.0, description="南湖水位持续上涨，超过警戒水位1.2米", status="active", affected_population=35000),
            DisasterEvent(name="北山滑坡风险", disaster_type="landslide", severity="medium", latitude=30.6350, longitude=114.3050, radius_km=2.0, description="连续降雨导致山体松动，监测到位移异常", status="monitoring", affected_population=12000),
            DisasterEvent(name="台风登陆预警", disaster_type="typhoon", severity="high", latitude=30.5000, longitude=114.4500, radius_km=12.0, description="台风中心风速42m/s，预计6小时内影响城区", status="active", affected_population=200000),
        ]
        db.add_all(disasters)
        await db.flush()

        # Risk Zones
        risk_zones = [
            RiskZone(name="高风险区A", risk_level="critical", latitude=30.5931, longitude=114.3054, radius_km=2.0, disaster_id=1, population_density=8500, emotion_index=0.25, alert_count=12, guide_count=85),
            RiskZone(name="中风险区B", risk_level="high", latitude=30.5800, longitude=114.3100, radius_km=3.0, disaster_id=1, population_density=6200, emotion_index=0.45, alert_count=8, guide_count=42),
            RiskZone(name="洪水风险区", risk_level="high", latitude=30.5480, longitude=114.3100, radius_km=2.5, disaster_id=2, population_density=4500, emotion_index=0.38, alert_count=15, guide_count=63),
            RiskZone(name="台风风险区", risk_level="medium", latitude=30.5000, longitude=114.4500, radius_km=8.0, disaster_id=4, population_density=3000, emotion_index=0.55, alert_count=6, guide_count=28),
            RiskZone(name="中风险区C", risk_level="medium", latitude=30.6100, longitude=114.2900, radius_km=2.0, population_density=5200, emotion_index=0.62, alert_count=3, guide_count=15),
            RiskZone(name="低风险区D", risk_level="low", latitude=30.5200, longitude=114.4100, radius_km=5.0, population_density=2800, emotion_index=0.78, alert_count=1, guide_count=5),
        ]
        db.add_all(risk_zones)

        # Safe Zones (shelters)
        safe_zones = [
            SafeZone(name="市中心体育馆", latitude=30.5950, longitude=114.3100, capacity=3000, current_occupancy=450, facility_type="shelter"),
            SafeZone(name="第一中学避难所", latitude=30.5800, longitude=114.2950, capacity=2000, current_occupancy=320, facility_type="shelter"),
            SafeZone(name="人民广场应急避难所", latitude=30.5900, longitude=114.3050, capacity=5000, current_occupancy=1200, facility_type="shelter"),
            SafeZone(name="市人民医院", latitude=30.6000, longitude=114.3150, capacity=800, current_occupancy=280, facility_type="hospital"),
            SafeZone(name="南湖物资储备站", latitude=30.5550, longitude=114.3050, capacity=500, current_occupancy=45, facility_type="supply_station"),
            SafeZone(name="高新区应急指挥中心", latitude=30.5150, longitude=114.4150, capacity=1500, current_occupancy=200, facility_type="shelter"),
        ]
        db.add_all(safe_zones)

        # Evacuation Routes
        routes = [
            EvacuationRoute(name="城区→体育馆路线", from_lat=30.5931, from_lng=114.3054, to_lat=30.5950, to_lng=114.3100, safe_zone_id=1, distance_km=0.8, path_json='[[30.5931,114.3054],[30.5942,114.3075],[30.5950,114.3100]]'),
            EvacuationRoute(name="南湖→物资站路线", from_lat=30.5480, from_lng=114.3100, to_lat=30.5550, to_lng=114.3050, safe_zone_id=5, distance_km=1.1, path_json='[[30.5480,114.3100],[30.5510,114.3080],[30.5550,114.3050]]'),
            EvacuationRoute(name="北山→人民医院路线", from_lat=30.6350, from_lng=114.3050, to_lat=30.6000, to_lng=114.3150, safe_zone_id=4, distance_km=4.2, path_json='[[30.6350,114.3050],[30.6180,114.3100],[30.6000,114.3150]]'),
        ]
        db.add_all(routes)

        # Assessment records
        assessments = [
            RiskAssessment(zone_name="高风险区A", latitude=30.5931, longitude=114.3054, risk_level="critical", risk_score=85.5, population_total=85000, population_density=8500, emotion_index=0.25, alert_count=12, guide_count=85, estimated_loss=3200.5, disaster_type="earthquake"),
            RiskAssessment(zone_name="南湖洪水区", latitude=30.5480, longitude=114.3100, risk_level="high", risk_score=68.2, population_total=35000, population_density=4500, emotion_index=0.38, alert_count=15, guide_count=63, estimated_loss=850.0, disaster_type="flood"),
            RiskAssessment(zone_name="台风影响区", latitude=30.5000, longitude=114.4500, risk_level="high", risk_score=72.8, population_total=200000, population_density=3000, emotion_index=0.55, alert_count=6, guide_count=28, estimated_loss=4500.0, disaster_type="typhoon"),
            RiskAssessment(zone_name="低风险区D", latitude=30.5200, longitude=114.4100, risk_level="low", risk_score=15.3, population_total=28000, population_density=2800, emotion_index=0.78, alert_count=1, guide_count=5, estimated_loss=45.2, disaster_type="fire"),
        ]
        db.add_all(assessments)

        # Alerts
        alerts = [
            AlertRecord(title="地震红色预警", alert_type="early_warning", severity="critical", content="城区发生5.8级地震，震源深度10公里，请所有居民立即前往最近的安全区域！", latitude=30.5931, longitude=114.3054, target_users="all"),
            AlertRecord(title="南湖洪水橙色预警", alert_type="early_warning", severity="high", content="南湖水位超警戒1.2米，下游居民请做好转移准备", latitude=30.5480, longitude=114.3100, target_users="all"),
            AlertRecord(title="台风蓝色预警", alert_type="early_warning", severity="medium", content="台风预计6小时后影响本市，请市民减少外出", latitude=30.5000, longitude=114.4500, target_users="citizens"),
            AlertRecord(title="疏散指引通知", alert_type="evacuation", severity="high", content="高风险A区居民请沿指定路线前往市中心体育馆和人民广场避难", latitude=30.5931, longitude=114.3054, target_users="citizens"),
            AlertRecord(title="物资调配通知", alert_type="info", severity="low", content="南湖物资储备站已调配帐篷500顶、饮用水2000箱", latitude=30.5550, longitude=114.3050, target_users="managers"),
        ]
        db.add_all(alerts)

        # Sensors
        sensors_data = [
            {"name": "地震监测站01", "type": "seismic", "lat": 30.5931, "lng": 114.3054, "edge": 1},
            {"name": "水位监测站01", "type": "water_level", "lat": 30.5480, "lng": 114.3100, "edge": 3},
            {"name": "风速监测站01", "type": "wind_speed", "lat": 30.5000, "lng": 114.4500, "edge": 5},
            {"name": "雨量监测站01", "type": "rain_gauge", "lat": 30.6350, "lng": 114.3050, "edge": 4},
            {"name": "地震监测站02", "type": "seismic", "lat": 30.5800, "lng": 114.2900, "edge": 2},
            {"name": "水位监测站02", "type": "water_level", "lat": 30.5550, "lng": 114.3050, "edge": 3},
            {"name": "烟雾监测站01", "type": "smoke", "lat": 30.5200, "lng": 114.4100, "edge": 5},
            {"name": "风速监测站02", "type": "wind_speed", "lat": 30.6100, "lng": 114.2900, "edge": 2},
        ]
        for s in sensors_data:
            db.add(Sensor(name=s["name"], sensor_type=s["type"], latitude=s["lat"], longitude=s["lng"], edge_server_id=s["edge"], unit={"seismic": "级", "water_level": "m", "wind_speed": "m/s", "rain_gauge": "mm/h", "smoke": "ppm"}.get(s["type"], "")))
        await db.commit()

        print("Demo data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
