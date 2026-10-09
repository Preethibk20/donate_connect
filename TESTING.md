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

## 5. Actual Test Coverage & Results

### Backend (JUnit 5 / Spring Boot Test)
**Status:** All passed (100% success on isolated H2).
- `ConcurrencyIntegrationTest`: Verifies 409 Conflict handling when multiple couriers claim a delivery.
- `DeliveryOtpIntegrationTest`: Verifies secure OTP verification and delivery finalization.
- `IntegrationWorkflowTest`: End-to-end integration of Donation creation to Delivery.
- `RoleMatrixIntegrationTest`: Tests IDOR protections (Donor can only see own, NGO isolated, OTP hidden from unauthorized).
- `LocationPipelineTest`: Validates live location websocket updates.
- `SecurityAndRbacTests`: Role access matrices for controllers.
- `GlobalExceptionHandlerIntegrationTest`: Checks generic and specific error wrapping.
- `AuthRateLimitTest`, `IpRateLimitTrustedIntegrationTest`, `IpRateLimitUntrustedIntegrationTest`: Validates IP limiting logic.
- `WebSocketAuthTest`: Verifies JWT handshake for STOMP.

### Frontend (Vitest & React Testing Library)
**Status:** 23 tests passed across 6 files.
- `urlUtils.test.ts`: URL parsing utilities.
- `ProtectedRoute.test.tsx`: RBAC client-side routing logic.
- `AuthContext.test.tsx`: JWT storage and login/logout state.
- `OtpInput.test.tsx`: Component functionality.
- `CreateDonationPage.test.tsx`: Validates description length, photo requirements, map pins, and required fields.
- `TrackDeliveryPage.test.tsx`: Simulates offline state, polling fallback on WebSocket drop, and "Mark Delivered" modal submission.

### E2E (Playwright)
**Status:** 1 test passed (Chromium).
- `Full flow: Donor -> NGO -> Courier -> Delivery -> OTP`: Verifies complete lifecycle using `e2e` isolated environment.
