import asyncio
import json
import random
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.simulator import generate_dashboard_stats

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections:
            self.active_connections.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@router.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            stats = generate_dashboard_stats()
            await websocket.send_json({"type": "dashboard_update", "data": stats})
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    await manager.connect(websocket)
    alert_types = [
        {"title": "地震预警", "type": "early_warning", "severity": "high", "content": "距您3.2公里处检测到震感，请注意防护"},
        {"title": "暴雨红色预警", "type": "early_warning", "severity": "critical", "content": "未来2小时内将有特大暴雨，请立即前往安全区域"},
        {"title": "疏散指引", "type": "evacuation", "severity": "medium", "content": "请沿新华路向南前往市中心体育馆避难所"},
    ]
    try:
        while True:
            if random.random() < 0.4:
                alert = random.choice(alert_types)
                await websocket.send_json({"type": "alert", "data": alert})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/sensors")
async def sensors_ws(websocket: WebSocket):
    await manager.connect(websocket)
    sensor_types = ["seismic", "water_level", "wind_speed", "rain_gauge", "temperature"]
    try:
        while True:
            data = []
            for i in range(5):
                st = sensor_types[i % len(sensor_types)]
                data.append({
                    "sensor_id": i + 1,
                    "sensor_type": st,
                    "value": round(random.gauss(5, 2) if st == "seismic" else random.gauss(50, 20), 2),
                    "is_anomaly": random.random() < 0.05,
                    "timestamp": int(time.time() * 1000),
                })
            await websocket.send_json({"type": "sensor_update", "data": data})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
