# 🤝 DonateConnect - Full-Stack Donation Platform

DonateConnect is a modern, full-stack web application connecting generous donors with verified NGO partners. Built with Spring Boot 3, Java 21, PostgreSQL, React 18, Vite, and TypeScript.

---

## ✨ Features & Architecture Updates

- **Authenticated Profile Dropdown**: Top-right navbar profile section displaying user initial avatar, full name, role badge (`DONOR`, `NGO`, `VOLUNTEER`, `CORPORATE`, `ADMIN`), and navigation links (`My Donations`, `My Requests`, `Profile`, `Settings`, `Sign Out`).
- **My Donations History (`/donations`)**: Complete donor donation management interface with real summary metrics (`Total Donations`, `NGOs Supported`, `Delivered Donations`), dual responsive table & mobile card layouts, status filter bar, and pagination.
- **Single Donation Inspector**: Detailed inspector modal featuring a status lifecycle timeline (`REQUESTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `DELIVERED`, or `REJECTED`), attached photo gallery with lightbox, and NGO partner information.
- **Single Donation Ownership Security (`GET /api/donations/mine/{id}`)**: End-to-end database-level ownership isolation (`findByIdAndDonorId`) preventing unauthorized cross-user access.
- **Warm Organic Light Theme**: Human-centric design system featuring Warm Pearl (`#FAF8F5`) page background, Pure White (`#FFFFFF`) card surfaces, Deep Espresso (`#111827`) high-contrast typography, and flat brick-red (`#DC2626`) Emergency SOS banner.
- **Session Persistence**: Persistent JWT authentication state (`dc-token` & `dc-user` in `localStorage`), enabling seamless user re-validation across page reloads and browser restarts.

---

## 🏗️ Technology Stack

- **Backend**: Spring Boot 3.4.2, Java 21, Maven, PostgreSQL JPA/Hibernate, Spring Security 6 (Stateless JWT), Lombok.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, React Hook Form, React Router DOM.
- **Security & RBAC**:
  - `DONOR`: Can browse verified NGOs, submit donation requests with multi-photo upload, view personal donation history, and inspect status timelines.
  - `NGO`: Can view assigned donation requests, accept/reject, update status to Picked Up / Delivered, manage inventory statistics, and edit organization profile.
  - `ADMIN`: System-wide analytics overview, NGO partner creation & verification, and paginated cross-NGO donation auditing.
  - `VOLUNTEER`: Driver logistics console with live GPS simulation.
  - `CORPORATE`: Corporate Social Responsibility (CSR) impact dashboard.

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
   Set environment variables or update `application.properties`:
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
   The backend server starts at `http://localhost:8080` (health check at `http://localhost:8080/api/health`). Run test suite with:
   ```bash
   mvn test
   ```

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
   Open `http://localhost:5173` in your browser. Verify TypeScript types and production build with:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

## 🐳 Docker Setup

Build and run the backend container locally:

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


## 🔒 API & Endpoint Reference

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Health check (`{"status":"UP"}`) |
| `/api/auth/register` | POST | Public | Donor-only self-registration |
| `/api/auth/login` | POST | Public | User login (returns JWT token & role) |
| `/api/auth/me` | GET | Authenticated | Current user profile |
| `/api/ngo` | GET | Public/Donor | List verified NGOs |
| `/api/donations` | POST | DONOR | Submit new donation request |
| `/api/donations/mine` | GET | DONOR | Donor's own paginated donation list |
| `/api/donations/mine/{id}` | GET | DONOR | Single donation details (ownership isolated) |
| `/api/ngo/donations` | GET | NGO | NGO's assigned donations |
| `/api/ngo/donations/{id}/status` | PATCH | NGO | Update status (`ACCEPTED`, `REJECTED`, `PICKED_UP`, `DELIVERED`) |
| `/api/admin/stats` | GET | ADMIN | System-wide JPA count aggregations |
| `/api/admin/ngo` | GET/POST | ADMIN | List all NGOs / Create NGO partner |
| `/api/admin/donations` | GET | ADMIN | Paginated cross-NGO donation audit |
