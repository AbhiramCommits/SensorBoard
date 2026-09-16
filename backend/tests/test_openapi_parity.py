from pathlib import Path

import yaml

from app.main import app

SPEC_PATH = Path(__file__).resolve().parents[2] / "openapi" / "telemetry.yaml"
HTTP_METHODS = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}


def parameter_names(parameters: list[dict]) -> set[tuple[str, str]]:
    names = set()
    for parameter in parameters:
        location = parameter.get("in")
        name = parameter.get("name")
        if location and name:
            names.add((location, name))
    return names


def normalize_paths(paths: dict) -> dict[str, dict[str, set[tuple[str, str]]]]:
    normalized = {}
    for path, item in paths.items():
        operations = {}
        for method, operation in item.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            operations[method] = parameter_names(operation.get("parameters", []))
        normalized[path] = operations
    return normalized


def test_generated_openapi_paths_match_spec():
    spec = yaml.safe_load(SPEC_PATH.read_text())
    generated = app.openapi()

    assert normalize_paths(generated["paths"]) == normalize_paths(spec["paths"])
