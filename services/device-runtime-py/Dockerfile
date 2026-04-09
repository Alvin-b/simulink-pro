FROM python:3.12-slim

WORKDIR /app

COPY services/device-runtime-py/pyproject.toml ./pyproject.toml
RUN pip install --no-cache-dir fastapi uvicorn pydantic

COPY services/device-runtime-py/app ./app

EXPOSE 4043

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4043"]
