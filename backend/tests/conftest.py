import os

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

if TEST_DATABASE_URL:
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
else:
    os.environ["DATABASE_URL"] = "sqlite://"

from datetime import datetime  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.db import Base, get_db, set_sqlite_pragma  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Reading, Sensor  # noqa: E402

SENSORS = [
    dict(
        id="sens-temp-01",
        name="Boiler Room Temp",
        type="temperature",
        status="online",
        location="Building A, Room 101",
        unit="°C",
        last_reading=21.5,
        updated_at=datetime(2026, 2, 1, 9, 41, 0),
    ),
    dict(
        id="sens-temp-02",
        name="Freezer Temp",
        type="temperature",
        status="offline",
        location="Building B, Room 202",
        unit="°C",
        last_reading=-18.2,
        updated_at=datetime(2026, 1, 28, 18, 2, 0),
    ),
    dict(
        id="sens-hum-01",
        name="Roof Humidity",
        type="humidity",
        status="degraded",
        location="Building A, Roof",
        unit="%RH",
        last_reading=55.1,
        updated_at=datetime(2026, 2, 1, 9, 40, 0),
    ),
    dict(
        id="sens-pres-01",
        name="Pressure Well A",
        type="pressure",
        status="online",
        location="Field 3",
        unit="hPa",
        last_reading=1013.2,
        updated_at=datetime(2026, 2, 1, 8, 0, 0),
    ),
    dict(
        id="sens-vib-01",
        name="Pump Bearing",
        type="vibration",
        status="degraded",
        location="Plant 2",
        unit="mm/s",
        last_reading=0.82,
        updated_at=datetime(2026, 2, 1, 9, 39, 0),
    ),
]

READINGS = [
    dict(sensor_id="sens-temp-01", value=21.9, recorded_at=datetime(2026, 1, 31, 23, 45, 0)),
    dict(sensor_id="sens-temp-01", value=20.0, recorded_at=datetime(2026, 2, 1, 0, 0, 0)),
    dict(sensor_id="sens-temp-01", value=21.0, recorded_at=datetime(2026, 2, 1, 6, 0, 0)),
    dict(sensor_id="sens-temp-01", value=22.0, recorded_at=datetime(2026, 2, 1, 12, 0, 0)),
    dict(sensor_id="sens-hum-01", value=50.0, recorded_at=datetime(2026, 2, 1, 0, 0, 0)),
]


def build_engine():
    if TEST_DATABASE_URL:
        engine = create_engine(TEST_DATABASE_URL)
    else:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        event.listen(engine, "connect", set_sqlite_pragma)
    return engine


@pytest.fixture()
def client():
    engine = build_engine()
    TestingSession = sessionmaker(bind=engine, expire_on_commit=False)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestingSession() as session:
        session.add_all(Sensor(**row) for row in SENSORS)
        session.add_all(Reading(**row) for row in READINGS)
        session.commit()

    def override_get_db():
        with TestingSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()
