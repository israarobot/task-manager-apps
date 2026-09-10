FROM python:3.11-slim

WORKDIR /app

# Copier requirements et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier l'ensemble du code source dans /app
COPY . .

# Lancer uvicorn (selon l'emplacement de votre fichier main.py)
# Option A: si main.py est à la racine du dépôt backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Option B: si main.py est dans un sous-dossier src/main.py ou app/main.py
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
