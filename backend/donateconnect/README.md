# 🤝 DonateConnect - Full-Stack Donation Platform

DonateConnect is a modern, full-stack web application connecting generous donors with verified NGO partners. Built with Spring Boot 3, Java 21, PostgreSQL, React 18, Vite, and TypeScript.

---

## 🏗️ Architecture & Technology Stack

- **Backend**: Spring Boot 3.4.2, Java 21, Maven, PostgreSQL JPA/Hibernate, Spring Security 6 (Stateless JWT), Lombok.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, React Hook Form, React Router DOM.
- **Security & RBAC**:
  - `DONOR`: Can browse verified NGOs, submit donation requests with multi-photo upload, and track donation progress.
  - `NGO`: Can view assigned donation requests, accept/reject, update status to Picked Up / Delivered, manage inventory statistics, and edit organization profile.
  - `ADMIN`: System-wide analytics overview, NGO partner creation & verification, and paginated cross-NGO donation auditing.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Java 21 JDK** installed
- **Node.js 18+** & `npm` installed
- **PostgreSQL 14+** running locally (or via Docker)

---

### 2. Backend Setup (`backend/`)

1. **Configure Database**:
   Create a PostgreSQL database named `donateconnect`:
   ```sql
   CREATE DATABASE donateconnect;
   ```

2. **Environment Variables**:
   Copy `.env.example` or set the following environment variables:
   ```properties
   DB_URL=jdbc:postgresql://localhost:5432/donateconnect
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=donateConnectSecretKey32BytesLongString123!
   ```

3. **Run Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   The backend server will start at `http://localhost:8080` (verify health at `http://localhost:8080/api/health`).

---

### 3. Frontend Setup (`frontend/`)

1. **Environment Variables**:
   Create `.env` inside `frontend/`:
   ```properties
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

2. **Install Dependencies & Run**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🐳 Docker Setup

Build and run the backend locally using the multi-stage Docker container:

```bash
cd backend

# Build Docker image
docker build -t donateconnect-backend .

# Run Docker container linked to PostgreSQL
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/donateconnect \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=donateConnectSecretKey32BytesLongString123! \
  donateconnect-backend
```

---

## 🚀 Cloud Deployment Guide

### Backend Deployment (Render.com)

1. **Create PostgreSQL Database on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) &rarr; **New +** &rarr; **PostgreSQL**.
   - Note the Internal/External Database URL, Username, and Password.

2. **Deploy Spring Boot Web Service**:
   - Select **New +** &rarr; **Web Service**.
   - Connect your GitHub Repository containing `backend/`.
   - Set Environment to **Docker** and Root Directory to `backend`.
   - Configure Environment Variables:
     - `DB_URL` = `jdbc:postgresql://<render-db-host>:5432/<dbname>`
     - `DB_USERNAME` = `<render-db-username>`
     - `DB_PASSWORD` = `<render-db-password>`
     - `JWT_SECRET` = `<a-secure-random-32+-character-string>`
   - Click **Deploy Web Service**. Render will execute the multi-stage `Dockerfile`.

---

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/) &rarr; **Add New Project**.
   - Import repository and set Root Directory to `frontend`.
   - Build Settings: Framework Preset = `Vite`.
   - Configure Environment Variable:
     - `VITE_API_BASE_URL` = `https://<your-render-backend-url>.onrender.com/api`

2. **SPA Routing**:
   The included [`vercel.json`](file:///C:/Users/Pruthvi%20Upadhya/.gemini/antigravity/scratch/donateconnect/frontend/vercel.json) handles client-side React Router rewrites (`/(.*)` &rarr; `/index.html`).

---

## 🔒 Security & Endpoint Reference

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Health check (`{"status":"UP"}`) |
| `/api/auth/register` | POST | Public | Donor-only self-registration |
| `/api/auth/login` | POST | Public | User login (returns JWT token & role) |
| `/api/auth/me` | GET | Authenticated | Current user details |
| `/api/ngo` | GET | Public/Donor | List verified NGOs |
| `/api/donations` | POST | DONOR | Submit new donation request |
| `/api/donations/mine` | GET | DONOR | Donor's own submitted requests |
| `/api/ngo/donations` | GET | NGO | NGO's assigned donations |
| `/api/ngo/donations/{id}/status` | PATCH | NGO | Update status (ownership guarded, 403 on cross-NGO attempt) |
| `/api/admin/stats` | GET | ADMIN | System-wide JPA count aggregations |
| `/api/admin/ngo` | GET/POST | ADMIN | List all NGOs / Create NGO partner |
| `/api/admin/donations` | GET | ADMIN | Paginated cross-NGO donation audit |
