# Sugularity Daemon Setup for Windows (Phase B)
# This script installs pm2 globally and sets up the node-cron daemon to run automatically.

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Setting up Sugularity Background Daemon " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Install pm2 globally if not installed
Write-Host "`n[1/3] Checking for PM2 globally..." -ForegroundColor Yellow
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "PM2 is already installed." -ForegroundColor Green
} else {
    Write-Host "PM2 not found. Installing globally..." -ForegroundColor Yellow
    npm install -g pm2
    Write-Host "PM2 installed." -ForegroundColor Green
}
    
# 2. Start the daemon using PM2
Write-Host "`n[2/3] Starting Daemon via PM2..." -ForegroundColor Yellow
# We use tsx to run the typescript file directly via pm2
pm2 start "npx tsx scripts/daemon.ts" --name "sugularity-daemon"
Write-Host "Daemon started in background." -ForegroundColor Green

# 3. Handle Windows Startup
Write-Host "`n[3/3] Configuring Windows Startup..." -ForegroundColor Yellow
if (Get-Command pm2-startup -ErrorAction SilentlyContinue) {
    Write-Host "pm2-windows-startup already present." -ForegroundColor Green
} else {
    Write-Host "Installing pm2-windows-startup..." -ForegroundColor Yellow
    npm install pm2-windows-startup -g
    pm2-startup install
}

pm2 save
Write-Host "PM2 state saved and configured for startup." -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host " Setup Complete! 🚀" -ForegroundColor Green
Write-Host " The Sugularity Daemon is now running."
Write-Host " To view logs: pm2 logs sugularity-daemon"
Write-Host " To stop daemon: pm2 stop sugularity-daemon"
Write-Host "=========================================" -ForegroundColor Cyan
