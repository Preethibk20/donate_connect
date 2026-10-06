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
| **Manual testing** | No claims of manual testing are made. All features require further manual verification. | | | |

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
- **Donor cancellation**: NOT IMPLEMENTED.
- **GPS Permission Denied / Geolocation Unavailable**: NOT TESTED.
- **Courier Reconnecting Mid-trip / Tab Closed**: NOT TESTED. 
- **Large Photo Upload**: NOT TESTED.
- **NGO rejecting after courier accepted**: NOT TESTED automatically.
- **Wrong OTP 3 times then regeneration**: NOT TESTED.

### Known Issues
- **Playwright E2E**: Fails at Simulate Route because the backend requires a Delivery entity, but the frontend passes the VolunteerTask ID.
- **Cancellation Post-Assignment**: Donor cancellation after a courier is assigned lacks a specific push notification back to the courier.
