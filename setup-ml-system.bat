@echo off
REM ========================================
REM ML E-Commerce System - Complete Setup
REM ========================================

echo.
echo ========================================
echo ML E-COMMERCE SYSTEM SETUP
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo Checking MongoDB...
mongosh --eval "db.version()" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB is not running or not accessible!
    echo Please start MongoDB before continuing.
    echo.
    choice /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
)

echo [OK] Prerequisites check passed!
echo.

REM ========================================
REM STEP 1: Backend Setup
REM ========================================
echo ========================================
echo STEP 1/4: Setting up Backend
echo ========================================
cd backend

echo Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend npm install failed!
    pause
    exit /b 1
)

echo Installing cookie-parser...
call npm install cookie-parser @types/cookie-parser
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install cookie-parser!
    pause
    exit /b 1
)

echo Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript build failed!
    pause
    exit /b 1
)

echo [OK] Backend setup complete!
echo.

cd ..

REM ========================================
REM STEP 2: Frontend Setup
REM ========================================
echo ========================================
echo STEP 2/4: Setting up Frontend
echo ========================================
cd frontend

echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend npm install failed!
    pause
    exit /b 1
)

echo [OK] Frontend setup complete!
echo.

cd ..

REM ========================================
REM STEP 3: ML Service Setup
REM ========================================
echo ========================================
echo STEP 3/4: Setting up ML Service
echo ========================================
cd ml-service

echo Creating Python virtual environment...
python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create virtual environment!
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing ML dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies!
    pause
    exit /b 1
)

echo [OK] ML Service setup complete!
echo.

cd ..

REM ========================================
REM STEP 4: Database Setup
REM ========================================
echo ========================================
echo STEP 4/4: Setting up Database
echo ========================================

echo Seeding database with sample data...
cd backend
call npm run seed:bonsai
call npm run seed:admin

echo Generating test ML data...
call npm run ml:test-data

echo [OK] Database setup complete!
echo.

cd ..

REM ========================================
REM SETUP COMPLETE
REM ========================================
echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Your ML E-Commerce system is ready!
echo.
echo To start the system, run these commands in separate terminals:
echo.
echo   1. Start MongoDB (if not already running):
echo      mongod
echo.
echo   2. Start Backend:
echo      cd backend
echo      npm run dev
echo.
echo   3. Start ML Service:
echo      cd ml-service
echo      venv\Scripts\activate
echo      python main.py
echo.
echo   4. Start Frontend:
echo      cd frontend
echo      ng serve
echo.
echo Then visit: http://localhost:4200
echo ML API Docs: http://localhost:8000/docs
echo.
echo See ML_SYSTEM_GUIDE.md for detailed usage instructions.
echo.
pause
