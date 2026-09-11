FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Copie et installation des dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du reste du code source (main.py)
COPY . .

# Lancement de FastAPI avec uvicorn (main.py étant directement à la racine)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
