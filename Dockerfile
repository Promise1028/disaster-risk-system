FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY frontend/dist/ ./frontend/dist/

RUN python seed_data.py

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
