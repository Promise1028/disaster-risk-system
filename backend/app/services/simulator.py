"""IoT data simulator - generates realistic sensor readings for demo purposes."""

import random
import math
import time
from typing import AsyncGenerator


def simulate_sensor_value(sensor_type: str, base_value: float = 0) -> float:
    """Generate a realistic sensor reading based on type."""
    ranges = {
        "seismic": (0.0, 7.0),       # Richter scale
        "water_level": (0.0, 10.0),   # meters
        "wind_speed": (0.0, 50.0),    # m/s
        "rain_gauge": (0.0, 200.0),   # mm/h
        "smoke": (0.0, 500.0),        # ppm
        "temperature": (-10.0, 45.0), # Celsius
    }
    lo, hi = ranges.get(sensor_type, (0.0, 100.0))
    noise = random.gauss(0, (hi - lo) * 0.05)
    value = base_value + noise if base_value else random.uniform(lo, hi * 0.4)
    return round(max(lo, min(hi, value)), 2)


async def simulate_sensor_stream(sensor_id: int, sensor_type: str) -> AsyncGenerator[dict, None]:
    """Generate a stream of simulated sensor data."""
    anomaly_chance = random.uniform(0.02, 0.08)
    while True:
        value = simulate_sensor_value(sensor_type)
        is_anomaly = random.random() < anomaly_chance
        yield {
            "sensor_id": sensor_id,
            "value": value,
            "timestamp": int(time.time() * 1000),
            "is_anomaly": is_anomaly,
        }


def generate_dashboard_stats() -> dict:
    """Generate realistic dashboard statistics for demo."""
    risk_levels = ["low", "medium", "high", "critical"]
    weights = [0.4, 0.3, 0.2, 0.1]
    disaster_types = ["earthquake", "flood", "typhoon", "landslide", "fire"]
    d_weights = [0.2, 0.3, 0.25, 0.15, 0.1]

    risk_dist = {}
    for rl, w in zip(risk_levels, weights):
        risk_dist[rl] = random.randint(int(50 * w), int(150 * w))

    disaster_dist = {}
    for dt, w in zip(disaster_types, d_weights):
        disaster_dist[dt] = random.randint(int(10 * w), int(50 * w))

    return {
        "total_population": random.randint(50000, 500000),
        "avg_population_density": round(random.uniform(500, 8000), 1),
        "avg_emotion_index": round(random.uniform(0.3, 0.9), 2),
        "total_alerts": random.randint(5, 50),
        "total_guides": random.randint(10, 100),
        "risk_level_distribution": risk_dist,
        "disaster_type_distribution": disaster_dist,
        "estimated_total_loss": round(random.uniform(100, 5000), 1),
        "active_disasters": random.randint(1, 8),
        "online_servers": random.randint(3, 10),
        "total_servers": 10,
    }
