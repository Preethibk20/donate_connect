$ErrorActionPreference = "Stop"

function Check-Port {
    param ($Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conn) {
        $pid = $conn.OwningProcess
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        Write-Host "ERROR: Port $Port is already in use by PID $pid ($($proc.ProcessName))!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Checking ports 8081 and 5173..."
Check-Port 8081
Check-Port 5173

Write-Host "Starting e2e backend..."
Start-Process -FilePath "..\mvnw.cmd" -ArgumentList "spring-boot:run -Dspring-boot.run.profiles=e2e" -WorkingDirectory "..\backend"

Write-Host "Waiting 15 seconds for backend..."
Start-Sleep -Seconds 15

Write-Host "Starting frontend proxying to e2e backend..."
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "..\frontend"

Write-Host "Demo Accounts (Password: pass123):"
Write-Host "- Donor: priya.patel@gmail.com"
Write-Host "- NGO: contact@goonj.org"
Write-Host "- Volunteer/Driver: vikram.s@gmail.com"
Write-Host "- Corporate: info@infosys.com"
Write-Host "- Admin: admin@donateconnect.com"
