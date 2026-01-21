# Start Backend and Frontend Development Servers
Write-Host "Starting ReachInbox Scheduler Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "⚠ Backend is already running on http://localhost:4000" -ForegroundColor Yellow
} catch {
    Write-Host "Starting Backend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

# Check if frontend is already running
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "⚠ Frontend is already running on http://localhost:3000" -ForegroundColor Yellow
} catch {
    Write-Host "Starting Frontend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ Development servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
