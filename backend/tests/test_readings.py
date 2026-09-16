def test_list_readings_sorted_desc(client):
    response = client.get("/api/sensors/sens-temp-01/readings")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 4
    assert [item["value"] for item in body["items"]] == [22.0, 21.0, 20.0, 21.9]


def test_list_readings_limit(client):
    body = client.get("/api/sensors/sens-temp-01/readings", params={"limit": 2}).json()
    assert len(body["items"]) == 2
    assert body["total"] == 4
    assert body["items"][0]["value"] == 22.0

    response = client.get("/api/sensors/sens-temp-01/readings", params={"limit": 0})
    assert response.status_code == 422
    response = client.get("/api/sensors/sens-temp-01/readings", params={"limit": 1001})
    assert response.status_code == 422


def test_list_readings_start_end_inclusive(client):
    body = client.get(
        "/api/sensors/sens-temp-01/readings",
        params={"start": "2026-02-01T00:00:00", "end": "2026-02-01T12:00:00"},
    ).json()
    assert body["total"] == 3
    assert {item["value"] for item in body["items"]} == {20.0, 21.0, 22.0}


def test_list_readings_timezone_aware_range(client):
    body = client.get(
        "/api/sensors/sens-temp-01/readings",
        params={"start": "2026-01-31T23:45:00Z", "end": "2026-01-31T23:45:00Z"},
    ).json()
    assert body["total"] == 1
    assert body["items"][0]["value"] == 21.9


def test_list_readings_empty_range(client):
    body = client.get(
        "/api/sensors/sens-temp-01/readings",
        params={"start": "2020-01-01T00:00:00", "end": "2020-01-02T00:00:00"},
    ).json()
    assert body == {"items": [], "total": 0}


def test_list_readings_unknown_sensor_404(client):
    response = client.get("/api/sensors/sens-nope/readings")
    assert response.status_code == 404
    assert response.json()["detail"] == "Sensor not found"


def test_bulk_ingest_partial_failure(client):
    import json

    payload = {
        "readings": [
            {"sensor_id": "sens-hum-01", "value": 51.0, "recorded_at": "2026-02-01T12:00:00Z"},
            {"sensor_id": "sens-vib-01", "value": 1.1, "recorded_at": "2026-02-01T12:15:00Z"},
            {"sensor_id": "sens-nope", "value": 1.0, "recorded_at": "2026-02-01T12:30:00Z"},
            {"sensor_id": "sens-hum-01", "value": float("nan"), "recorded_at": "2026-02-01T12:45:00Z"},
            {"sensor_id": "sens-hum-01", "value": 2.0, "recorded_at": "not-a-date"},
        ]
    }
    response = client.post(
        "/api/readings/bulk",
        content=json.dumps(payload),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 2
    assert body["rejected"] == 3
    assert [error["index"] for error in body["errors"]] == [2, 3, 4]
    assert "unknown sensor id 'sens-nope'" in body["errors"][0]["message"]
    assert body["errors"][1]["message"] == "value must be finite"
    assert "invalid recorded_at" in body["errors"][2]["message"]

    readings = client.get("/api/sensors/sens-hum-01/readings", params={"limit": 10}).json()
    assert readings["total"] == 2
    assert {item["value"] for item in readings["items"]} == {50.0, 51.0}

    vibrations = client.get("/api/sensors/sens-vib-01/readings").json()
    assert vibrations["total"] == 1
    assert vibrations["items"][0]["value"] == 1.1


def test_bulk_ingest_all_valid(client):
    payload = {
        "readings": [
            {"sensor_id": "sens-hum-01", "value": 51.5, "recorded_at": "2026-02-01T13:00:00Z"},
            {"sensor_id": "sens-vib-01", "value": 0.9, "recorded_at": "2026-02-01T13:15:00Z"},
        ]
    }
    body = client.post("/api/readings/bulk", json=payload).json()
    assert body == {"accepted": 2, "rejected": 0, "errors": []}


def test_bulk_ingest_missing_readings_field_422(client):
    response = client.post("/api/readings/bulk", json={"nope": []})
    assert response.status_code == 422
