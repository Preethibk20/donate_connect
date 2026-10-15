$ErrorActionPreference = "Stop"
Write-Host "Starting backend with Neon (local profile)..."
$env:SPRING_PROFILES_ACTIVE="local"
Start-Process -FilePath ".\mvnw.cmd" -ArgumentList "spring-boot:run" -WorkingDirectory "backend"
Write-Host "Waiting 15 seconds for backend..."
Start-Sleep -Seconds 15
Write-Host "Starting frontend proxying to backend..."
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "frontend"
Write-Host "Dev server is running! Frontend URL: http://localhost:5173"
