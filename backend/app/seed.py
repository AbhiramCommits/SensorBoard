"""Seed the database with deterministic demo data.

40 sensors across all four types/statuses and 30 days of readings at
15-minute intervals, generated with a fixed random seed. Idempotent: exits
early if sensors already exist.
"""

import math
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, insert, select

from . import models
from .db import Base, SessionLocal, engine

SEED = 42
SENSOR_COUNT = 40
READING_INTERVAL = timedelta(minutes=15)
HISTORY_DAYS = 30

TYPES = ["temperature", "humidity", "pressure", "vibration"]
UNITS = {"temperature": "°C", "humidity": "%RH", "pressure": "hPa", "vibration": "mm/s"}
BASELINES = {"temperature": 21.0, "humidity": 50.0, "pressure": 1013.0, "vibration": 0.5}
AMPLITUDES = {"temperature": 4.0, "humidity": 12.0, "pressure": 6.0, "vibration": 0.4}
STATUSES = ["online", "online", "online", "degraded", "offline"]


def chunked(rows: list[dict], size: int):
    for i in range(0, len(rows), size):
        yield rows[i : i + size]


def main() -> None:
    Base.metadata.create_all(engine)
    rng = random.Random(SEED)

    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    end = now.replace(tzinfo=None)
    start = end - timedelta(days=HISTORY_DAYS)

    with SessionLocal() as session:
        existing = session.scalar(select(func.count(models.Sensor.id)))
        if existing:
            print(f"Database already seeded ({existing} sensors); nothing to do.")
            return

        sensors: list[models.Sensor] = []
        reading_rows: list[dict] = []

        for i in range(SENSOR_COUNT):
            sensor_type = TYPES[i % len(TYPES)]
            status = STATUSES[i % len(STATUSES)]
            sensor = models.Sensor(
                id=f"sens-{i + 1:03d}",
                name=f"{sensor_type.title()} Sensor {i + 1:02d}",
                type=sensor_type,
                status=status,
                location=f"Building {chr(ord('A') + i % 4)}, Room {(i % 10) + 1:03d}",
                unit=UNITS[sensor_type],
                last_reading=None,
                updated_at=end,
            )
            sensors.append(sensor)

            last_recorded = end if status != "offline" else end - timedelta(days=2)
            baseline = BASELINES[sensor_type]
            amplitude = AMPLITUDES[sensor_type]
            t = start
            sensor_rows: list[dict] = []
            while t <= last_recorded:
                if sensor_type == "vibration":
                    spike = rng.random() < 0.02
                    value = max(0.05, baseline + rng.uniform(-0.2, 0.2) + (1.5 if spike else 0.0))
                    value = round(value, 3)
                else:
                    daily = amplitude * math.sin((t.hour / 24.0) * 2 * math.pi)
                    noise = rng.uniform(-1.0, 1.0) * amplitude * 0.15
                    value = round(baseline + daily + noise, 2)
                sensor_rows.append(
                    {"sensor_id": sensor.id, "value": value, "recorded_at": t}
                )
                t += READING_INTERVAL

            sensor.last_reading = sensor_rows[-1]["value"]
            sensor.updated_at = sensor_rows[-1]["recorded_at"]
            reading_rows.extend(sensor_rows)

        session.add_all(sensors)
        session.flush()
        for batch in chunked(reading_rows, 5000):
            session.execute(insert(models.Reading), batch)
        session.commit()

        print(
            f"Seeded {len(sensors)} sensors and {len(reading_rows)} readings "
            f"({start.isoformat()} .. {end.isoformat()} UTC)."
        )


if __name__ == "__main__":
    main()
