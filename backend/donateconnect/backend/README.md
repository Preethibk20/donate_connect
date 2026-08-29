# DonateConnect Backend (Spring Boot 3.4 + Java 21)

REST API backend for DonateConnect built with Spring Boot 3.x, Java 21, Maven, Spring Data JPA, and PostgreSQL.

## Features
- `GET /api/health` returns `{"status": "UP"}`
- Startup JPA database connection check with SLF4J log report
- CORS pre-configured for Vite dev server (`http://localhost:5173`)
- REST endpoints under `/api/donations`

## Environment Variables
Environment variables can be provided via terminal or `.env` file:
- `DB_URL` (Default: `jdbc:postgresql://localhost:5432/donateconnect_db`)
- `DB_USERNAME` (Default: `postgres`)
- `DB_PASSWORD` (Default: `postgres`)
- `SERVER_PORT` (Default: `8080`)

## Running Locally

Using Maven installed on your system:
```bash
mvn spring-boot:run
```

Or using Maven Wrapper:
```bash
# Windows PowerShell
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```
