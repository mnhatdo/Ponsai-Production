# ML E-Commerce System - Quick Setup Script
# Run this to set up the entire system

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ML E-COMMERCE SYSTEM SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed!" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Prerequisites check passed!" -ForegroundColor Green
Write-Host ""

# ========================================
# STEP 1: Backend Setup
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 1/4: Setting up Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location backend

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Installing cookie-parser..." -ForegroundColor Yellow
npm install cookie-parser @types/cookie-parser
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install cookie-parser!" -ForegroundColor Red
    exit 1
}

Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] TypeScript build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Backend setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# ========================================
# STEP 2: Frontend Setup
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 2/4: Setting up Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location frontend

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Frontend setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# ========================================
# STEP 3: ML Service Setup
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 3/4: Setting up ML Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location ml-service

Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create virtual environment!" -ForegroundColor Red
    exit 1
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Installing ML dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install Python dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] ML Service setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# ========================================
# STEP 4: Database Setup
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 4/4: Setting up Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location backend

Write-Host "Seeding database with sample data..." -ForegroundColor Yellow
npm run seed:bonsai
npm run seed:admin

Write-Host "Generating test ML data (this may take a few minutes)..." -ForegroundColor Yellow
npm run ml:test-data

Write-Host "[OK] Database setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# ========================================
# SETUP COMPLETE
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your ML E-Commerce system is ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the system, run these commands in separate terminals:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Start MongoDB (if not already running):" -ForegroundColor White
Write-Host "     mongod" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start Backend:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start ML Service:" -ForegroundColor White
Write-Host "     cd ml-service" -ForegroundColor Gray
Write-Host "     .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "     python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Start Frontend:" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Gray
Write-Host "     ng serve" -ForegroundColor Gray
Write-Host ""
Write-Host "Then visit: http://localhost:4200" -ForegroundColor Cyan
Write-Host "ML API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "See ML_SYSTEM_GUIDE.md for detailed usage instructions." -ForegroundColor Yellow
Write-Host ""
