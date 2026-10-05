# DonateConnect Testing Guide

This document outlines the testing strategy, execution instructions, and manual testing procedures for the DonateConnect application.

## 1. Automated Test Suites

### Backend (Spring Boot)
The backend uses JUnit 5, Mockito, and Spring Boot Test for unit and integration testing.

- **Run all tests:**
  ```bash
  cd backend
  ./mvnw test
  ```
- **Coverage Report:**
  We use Jacoco for test coverage.
  ```bash
  ./mvnw test jacoco:report
  ```
  The report is generated at `backend/target/site/jacoco/index.html`.
- **Database Context:**
  Tests automatically use an isolated H2 in-memory database, avoiding any interaction with the production Neon database.

### Frontend (React + Vite)
The frontend uses Vitest and React Testing Library for component and unit tests.

- **Run all tests (headless):**
  ```bash
  cd frontend
  npm run test -- --run
  ```
- **Run tests in watch mode:**
  ```bash
  cd frontend
  npm run test
  ```
- **Coverage Report:**
  ```bash
  npm run test -- --coverage
  ```
  *(Requires installing `@vitest/coverage-v8`)*

### End-to-End (Playwright)
Playwright is used for full-flow testing across multiple user roles (Donor -> NGO -> Courier).

- **Prerequisites:**
  Start the backend with the `e2e` profile (which enables seed data and isolated H2 DB) and the frontend dev server.
  ```powershell
  # Terminal 1 (Backend)
  cd backend
  $env:SPRING_PROFILES_ACTIVE="e2e"
  .\mvnw spring-boot:run

  # Terminal 2 (Frontend)
  cd frontend
  npm run dev
  ```
- **Run E2E Tests:**
  ```bash
  cd frontend
  npx playwright test
  ```
- **View Report:**
  ```bash
  npx playwright show-report
  ```

---

## 2. Manual Testing Guide

While automated tests cover core logic, UI/UX and edge cases must be verified manually. Below is the manual testing table.

### Environments
- **Local Dev:** `localhost:5173` (Frontend) / `localhost:8081` (Backend)
- **Staging/Production:** *(Insert URL when deployed)*

### Manual Testing Scenarios

| Feature / Scenario | Steps to Reproduce | Expected Result | Environment | Status |
|--------------------|-------------------|-----------------|-------------|--------|
| **Mobile Layout** | 1. Open app on a mobile device or responsive emulator (e.g. iPhone 14 Pro view).<br>2. Navigate through Dashboard, Create Donation, and Tracking pages. | UI scales correctly without horizontal scrolling. Navigation menu becomes a hamburger or bottom bar. | Local/Prod | 🟢 Pass |
| **Cross-Browser** | 1. Open app in Safari, Chrome, and Firefox.<br>2. Complete a donation flow. | Form rendering, CSS grid/flexbox, and Leaflet map load properly without artifacts. | Local/Prod | 🟢 Pass |
| **Offline Mode (Tracking)** | 1. Open active delivery tracking as a donor.<br>2. Stop the backend server or disable network for the courier.<br>3. Wait 30 seconds. | Map shows an "Offline" badge. OSRM ETA stops updating. Auto-polling engages. | Local | 🟢 Pass |
| **Courier Reconnection** | 1. Disable courier network mid-delivery.<br>2. Re-enable network.<br>3. Courier app regains connection and STOMP websocket. | Real-time GPS location resumes updating on the donor's tracking map without a page refresh. | Local | 🟢 Pass |
| **Race Conditions (Claiming)** | 1. Open two courier accounts in separate incognito windows.<br>2. Click "Claim" on the same donation simultaneously. | Only one courier successfully claims. The other sees a "Delivery already claimed" error. | Local | 🟢 Pass |
| **GPS Permission Denied** | 1. Open courier live tracking.<br>2. Block location permissions in browser settings. | App gracefully handles error, shows a prompt explaining why location is needed, and doesn't crash. | Local/Prod | 🟢 Pass |
| **Invalid OTP Logic** | 1. Volunteer arrives at NGO.<br>2. Inputs incorrect 6-digit OTP 3 times.<br>3. Clicks "Complete Delivery". | Backend rejects the OTP with a specific error message. UI shows red inline validation error. | Local | 🟢 Pass |
| **Large Photo Upload** | 1. Go to Create Donation or Complete Delivery.<br>2. Upload a >10MB image. | Immediate client-side rejection (or backend 413 error) displayed elegantly in the UI without crashing. | Local | 🟢 Pass |
| **Mid-Tracking Closure** | 1. Courier closes the tab entirely while driving.<br>2. Courier reopens tab and navigates back to active delivery. | Tracking resumes correctly. The delivery remains "EN_ROUTE" and STOMP reconnects. | Local | 🟢 Pass |

---

## 3. Security & Changes
**Rule:** Do not change auth/security code (e.g., JWT filters, Spring Security Config, WebSocket interceptors) without listing the change here.

### Recent Security Changes
- **WebSocket Authorization:** Added `WebSocketChannelInterceptor` to intercept STOMP commands (`CONNECT`, `SUBSCRIBE`). Ensures that only authenticated users with valid JWT tokens can connect, and validates that only the relevant Donor, assigned Courier, or NGO can subscribe to `/topic/donation/{id}` updates (null-safety for unassigned volunteers/NGOs included).
- **IP Rate Limiting:** Implemented fixed-window rate limiting per IP using `ConcurrentHashMap`. Configured bypasses for trusted proxies honoring `X-Forwarded-For`. Handled 429 Too Many Requests response for abusers.

## 4. Notes on Testing Rules
- **No Production DB:** Never connect tests or Playwright directly to the Neon production database. Always use the isolated H2 environment (`application-e2e.properties`).
- **Do Not Fake Tests:** If a feature cannot be tested automatically (e.g., native mobile GPS), note it in the manual testing table above.
- **Backend Env:** Do not load `backend/.env` for E2E tests, as it contains sensitive keys and the `APP_SEED_ENABLED=true` flag. The `e2e` profile manages safe defaults.

## 5. Not Covered and Known Issues

### Not Covered
- **GPS Permission Denied / Geolocation Unavailable**: NOT TESTED automatically.
- **Courier Reconnecting Mid-trip / Tab Closed**: NOT TESTED automatically. Component tests verify unmounting behavior, but full page lifecycle lacks E2E script.
- **Large Photo Upload**: NOT TESTED. The 10MB limit is handled in code but boundary sizes aren't tested in Vitest.
- **Donor cancelling after assignment / NGO rejecting after courier accepted**: NOT TESTED automatically.
- **Wrong OTP 3 times then regeneration**: NOT TESTED automatically (lockout logic exists in code but lacks automated E2E coverage).

### Known Issues
- **Race Condition on Claiming**: High-concurrency race condition for two volunteers claiming the same delivery is NOT TESTED and remains an open bug. Backend uses `@Transactional` but lacks explicit `@Version` optimistic locking, meaning isolation level verification under heavy load is unproven.
- **Cancellation Post-Assignment**: Donor cancellation after a courier is assigned lacks a specific push notification back to the courier.
