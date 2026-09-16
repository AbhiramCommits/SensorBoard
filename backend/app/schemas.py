from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

SensorType = Literal["temperature", "humidity", "pressure", "vibration"]
SensorStatus = Literal["online", "offline", "degraded"]


class Sensor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: SensorType
    status: SensorStatus
    location: str
    unit: str
    last_reading: float | None
    updated_at: datetime


class Reading(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sensor_id: str
    value: float
    recorded_at: datetime


class ReadingInput(BaseModel):
    sensor_id: str
    value: float
    recorded_at: str


class BulkIngestRequest(BaseModel):
    readings: list[ReadingInput]


class BulkIngestError(BaseModel):
    index: int
    message: str


class BulkIngestResult(BaseModel):
    accepted: int
    rejected: int
    errors: list[BulkIngestError]


class SensorPage(BaseModel):
    items: list[Sensor]
    total: int
    page: int
    page_size: int


class ReadingList(BaseModel):
    items: list[Reading]
    total: int


class HealthStatus(BaseModel):
    status: Literal["ok"]
