def test_list_sensors_defaults(client):
    response = client.get("/api/sensors")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 5
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert len(body["items"]) == 5


def test_list_sensors_sorted_by_updated_at_desc(client):
    body = client.get("/api/sensors").json()
    updated = [item["updated_at"] for item in body["items"]]
    assert updated == sorted(updated, reverse=True)
    assert body["items"][0]["id"] == "sens-temp-01"


def test_pagination_page_size_bounds(client):
    response = client.get("/api/sensors", params={"page_size": 101})
    assert response.status_code == 422
    response = client.get("/api/sensors", params={"page_size": 0})
    assert response.status_code == 422
    response = client.get("/api/sensors", params={"page": 0})
    assert response.status_code == 422


def test_pagination_slices_into_pages(client):
    body = client.get("/api/sensors", params={"page_size": 2, "page": 1}).json()
    assert body["total"] == 5
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert [item["id"] for item in body["items"]] == ["sens-temp-01", "sens-hum-01"]

    body = client.get("/api/sensors", params={"page_size": 2, "page": 3}).json()
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == "sens-temp-02"


def test_pagination_past_last_page_is_empty(client):
    body = client.get("/api/sensors", params={"page_size": 10, "page": 999}).json()
    assert body["total"] == 5
    assert body["items"] == []


def test_filter_q_matches_name_case_insensitive(client):
    body = client.get("/api/sensors", params={"q": "boiler"}).json()
    assert [item["id"] for item in body["items"]] == ["sens-temp-01"]
    body = client.get("/api/sensors", params={"q": "BOILER"}).json()
    assert [item["id"] for item in body["items"]] == ["sens-temp-01"]


def test_filter_q_matches_location(client):
    body = client.get("/api/sensors", params={"q": "Building B"}).json()
    assert [item["id"] for item in body["items"]] == ["sens-temp-02"]


def test_filter_type(client):
    body = client.get("/api/sensors", params={"type": "temperature"}).json()
    assert sorted(item["id"] for item in body["items"]) == ["sens-temp-01", "sens-temp-02"]
    assert body["total"] == 2

    body = client.get("/api/sensors", params={"type": "vibration"}).json()
    assert [item["id"] for item in body["items"]] == ["sens-vib-01"]


def test_filter_status(client):
    body = client.get("/api/sensors", params={"status": "degraded"}).json()
    assert sorted(item["id"] for item in body["items"]) == ["sens-hum-01", "sens-vib-01"]

    body = client.get("/api/sensors", params={"status": "offline"}).json()
    assert [item["id"] for item in body["items"]] == ["sens-temp-02"]


def test_filter_combined_type_status(client):
    body = client.get(
        "/api/sensors", params={"type": "temperature", "status": "offline"}
    ).json()
    assert [item["id"] for item in body["items"]] == ["sens-temp-02"]
    assert body["total"] == 1


def test_filter_invalid_enum_rejected(client):
    assert client.get("/api/sensors", params={"type": "wind"}).status_code == 422
    assert client.get("/api/sensors", params={"status": "sleeping"}).status_code == 422


def test_empty_results(client):
    body = client.get("/api/sensors", params={"q": "does-not-exist"}).json()
    assert body == {"items": [], "total": 0, "page": 1, "page_size": 20}


def test_get_sensor(client):
    response = client.get("/api/sensors/sens-hum-01")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "sens-hum-01"
    assert body["type"] == "humidity"
    assert body["status"] == "degraded"
    assert body["last_reading"] == 55.1


def test_get_sensor_unknown_returns_404(client):
    response = client.get("/api/sensors/sens-nope")
    assert response.status_code == 404
    assert response.json()["detail"] == "Sensor not found"


def test_healthz(client):
    assert client.get("/healthz").json() == {"status": "ok"}
