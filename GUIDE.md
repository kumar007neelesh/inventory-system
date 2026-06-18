# Inventory & Order Management System — Complete Guide

## Project Structure
```
inventory-system/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/index.html
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── docker-compose.yml
├── .env
└── .gitignore
```

---

## STEP 1 — Run Locally with Docker

```bash
# 1. Clone or create your project folder, then inside it:
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs  ← (Swagger UI, very useful for demo)

---

## STEP 2 — Push to GitHub

```bash
cd inventory-system
git init
git add .
git commit -m "Initial commit: Inventory Management System"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/inventory-system.git
git branch -M main
git push -u origin main
```

---

## STEP 3 — Push Backend Image to Docker Hub

```bash
# Login
docker login

# Build and tag
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend

# Push
docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest
```

Your Docker Hub link: https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-backend

---

## STEP 4 — Deploy Backend on Render (Free)

1. Go to https://render.com → Sign up / Log in
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name**: inventory-backend
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Scroll to **Environment Variables**, add:
   - `DATABASE_URL` → you'll get this from Render's PostgreSQL (see below)

### Create PostgreSQL on Render:
1. **New** → **PostgreSQL**
2. Name it `inventory-db`, click **Create Database**
3. Copy the **Internal Database URL**
4. Go back to your Web Service → Environment → set `DATABASE_URL` to that URL
5. Click **Deploy**

Your backend URL: `https://inventory-backend-XXXX.onrender.com`

---

## STEP 5 — Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com → Sign up with GitHub
2. Click **New Project** → Import your GitHub repo
3. Settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: frontend
4. **Environment Variables**, add:
   - `REACT_APP_API_URL` → `https://inventory-backend-XXXX.onrender.com`
     (your Render backend URL from Step 4)
5. Click **Deploy**

Your frontend URL: `https://inventory-system-XXXX.vercel.app`

---

## STEP 6 — Fix CORS for Production

After deploy, update `main.py` line with `allow_origins`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://YOUR-APP.vercel.app"],  # your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push — Render auto-redeploys.

---

## Submission Checklist

| Item | What to submit |
|------|---------------|
| GitHub repo | https://github.com/YOUR_USERNAME/inventory-system |
| Docker Hub image | https://hub.docker.com/r/YOUR_USERNAME/inventory-backend |
| Live frontend URL | https://your-app.vercel.app |
| Live backend API URL | https://inventory-backend-xxx.onrender.com |

> Tip: Visit `https://your-backend.onrender.com/docs` — this shows the automatic Swagger UI which is a great demo of all your APIs!

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /products | Create product |
| GET | /products | List products |
| GET | /products/{id} | Get product |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |
| POST | /customers | Create customer |
| GET | /customers | List customers |
| GET | /customers/{id} | Get customer |
| DELETE | /customers/{id} | Delete customer |
| POST | /orders | Create order |
| GET | /orders | List orders |
| GET | /orders/{id} | Get order |
| DELETE | /orders/{id} | Cancel order |
| GET | /dashboard | Dashboard stats |
