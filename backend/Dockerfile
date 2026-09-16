FROM python:3.11-slim

WORKDIR /srv

COPY pyproject.toml ./
COPY app ./app

RUN pip install --no-cache-dir . \
    && pip uninstall -y pip setuptools wheel 2>/dev/null || true \
    && find /usr/local -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /srv

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=4)"

CMD ["sh", "-c", "python -m app.migrate && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
