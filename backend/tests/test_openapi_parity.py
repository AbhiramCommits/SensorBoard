from pathlib import Path

import yaml

from app.main import app

SPEC_PATH = Path(__file__).resolve().parents[2] / "openapi" / "telemetry.yaml"
HTTP_METHODS = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}


def test_generated_openapi_paths_match_spec():
    spec = yaml.safe_load(SPEC_PATH.read_text())
    generated = app.openapi()

    spec_paths = {
        path: {method for method in methods if method in HTTP_METHODS}
        for path, methods in spec["paths"].items()
    }
    generated_paths = {
        path: {method for method in methods if method in HTTP_METHODS}
        for path, methods in generated["paths"].items()
    }

    assert generated_paths == spec_paths
