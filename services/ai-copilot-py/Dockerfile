FROM python:3.12-slim

WORKDIR /app

COPY services/ai-copilot-py/pyproject.toml ./pyproject.toml
RUN pip install --no-cache-dir fastapi uvicorn pydantic

COPY services/ai-copilot-py/app ./app

EXPOSE 4042

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4042"]
