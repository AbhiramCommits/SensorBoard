import math
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, insert, or_, select
from sqlalchemy.orm import Session

from . import models, schemas
from .db import Base, engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="TelemetryAPI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def parse_recorded_at(value: str) -> datetime | None:
    try:
        return to_naive_utc(datetime.fromisoformat(value.replace("Z", "+00:00")))
    except ValueError:
        return None


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@app.get("/api/sensors", response_model=schemas.SensorPage)
def list_sensors(
    q: str | None = Query(None, description="Free-text search across sensor name and location"),
    type: schemas.SensorType | None = Query(None),
    status: schemas.SensorStatus | None = Query(None),
    start: datetime | None = Query(None, description="Inclusive start of updated_at range (ISO 8601)"),
    end: datetime | None = Query(None, description="Inclusive end of updated_at range (ISO 8601)"),
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
) -> schemas.SensorPage:
    stmt = select(models.Sensor)
    if q:
        pattern = f"%{escape_like(q)}%"
        stmt = stmt.where(
            or_(
                models.Sensor.name.ilike(pattern, escape="\\"),
                models.Sensor.location.ilike(pattern, escape="\\"),
            )
        )
    if type is not None:
        stmt = stmt.where(models.Sensor.type == type)
    if status is not None:
        stmt = stmt.where(models.Sensor.status == status)
    if start is not None:
        stmt = stmt.where(models.Sensor.updated_at >= to_naive_utc(start))
    if end is not None:
        stmt = stmt.where(models.Sensor.updated_at <= to_naive_utc(end))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(models.Sensor.updated_at.desc(), models.Sensor.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return schemas.SensorPage(items=list(items), total=total, page=page, page_size=page_size)


@app.get("/api/sensors/{id}", response_model=schemas.Sensor)
def get_sensor(id: str, db: Session = Depends(get_db)) -> schemas.Sensor:
    sensor = db.get(models.Sensor, id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@app.get("/api/sensors/{id}/readings", response_model=schemas.ReadingList)
def list_readings(
    id: str,
    start: datetime | None = Query(None, description="Inclusive start of range (ISO 8601)"),
    end: datetime | None = Query(None, description="Inclusive end of range (ISO 8601)"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> schemas.ReadingList:
    if db.get(models.Sensor, id) is None:
        raise HTTPException(status_code=404, detail="Sensor not found")

    stmt = select(models.Reading).where(models.Reading.sensor_id == id)
    if start is not None:
        stmt = stmt.where(models.Reading.recorded_at >= to_naive_utc(start))
    if end is not None:
        stmt = stmt.where(models.Reading.recorded_at <= to_naive_utc(end))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(models.Reading.recorded_at.desc()).limit(limit)
    ).all()
    return schemas.ReadingList(items=list(items), total=total)


@app.post("/api/readings/bulk", response_model=schemas.BulkIngestResult)
def ingest_readings(
    payload: schemas.BulkIngestRequest,
    db: Session = Depends(get_db),
) -> schemas.BulkIngestResult:
    known_sensor_ids = set(db.scalars(select(models.Sensor.id)).all())

    accepted_rows: list[dict] = []
    errors: list[schemas.BulkIngestError] = []

    for index, item in enumerate(payload.readings):
        if item.sensor_id not in known_sensor_ids:
            errors.append(
                schemas.BulkIngestError(
                    index=index, message=f"unknown sensor id '{item.sensor_id}'"
                )
            )
            continue
        if not math.isfinite(item.value):
            errors.append(schemas.BulkIngestError(index=index, message="value must be finite"))
            continue
        recorded_at = parse_recorded_at(item.recorded_at)
        if recorded_at is None:
            errors.append(
                schemas.BulkIngestError(
                    index=index, message=f"invalid recorded_at '{item.recorded_at}'"
                )
            )
            continue
        accepted_rows.append(
            {
                "sensor_id": item.sensor_id,
                "value": item.value,
                "recorded_at": recorded_at,
            }
        )

    if accepted_rows:
        db.execute(insert(models.Reading), accepted_rows)
        db.commit()

    return schemas.BulkIngestResult(
        accepted=len(accepted_rows), rejected=len(errors), errors=errors
    )


@app.get("/healthz", response_model=schemas.HealthStatus)
def healthz() -> schemas.HealthStatus:
    return schemas.HealthStatus(status="ok")
