@echo off
setlocal enabledelayedexpansion
title Servante Intelligentee - Startup

echo.
echo ============================================================
echo   SERVANTE INTELLIGENTEE - FULL STACK STARTUP
echo ============================================================
echo.

REM ─── 1. Stop any old containers to clear port conflicts ─────
echo [1/7] Stopping old Docker containers...
docker-compose -f docker-compose.infra.yml down --remove-orphans 2>nul
docker-compose down --remove-orphans 2>nul
echo       Done.
echo.

REM ─── 2. Start infra services ────────────────────────────────
echo [2/7] Starting PostgreSQL + ChromaDB + Ollama (Docker)...
docker-compose -f docker-compose.infra.yml up -d
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker failed to start. Is Docker Desktop running?
    echo         Open Docker Desktop and try again.
    pause
    exit /b 1
)
echo       Services started.
echo.

REM ─── 3. Wait for PostgreSQL to be healthy ───────────────────
echo [3/7] Waiting for PostgreSQL to be ready...
set /a tries=0
:waitpg
set /a tries+=1
docker exec servante-intelligentee-postgres-1 pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    if !tries! geq 30 (
        echo [ERROR] PostgreSQL did not become ready in time.
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto waitpg
)
echo       PostgreSQL is ready.
echo.

REM ─── 4. Backend: install deps + migrate + seed ──────────────
echo [4/7] Setting up backend...
cd servante-backend
call npm install --silent
call npx prisma migrate deploy 2>nul
if %errorlevel% neq 0 (
    echo       Running prisma db push (first-time setup)...
    call npx prisma db push --accept-data-loss
)
call npx prisma db seed 2>nul
cd ..
echo       Backend ready.
echo.

REM ─── 5. Install serial bridge deps ─────────────────────────
echo [5/7] Installing serial bridge dependencies...
call npm install --silent
echo       Done.
echo.

REM ─── 6. Open terminal windows ───────────────────────────────
echo [6/7] Starting Backend (port 5001)...
start "Backend :5001" cmd /k "cd /d %~dp0servante-backend && npm run dev"

echo       Starting Frontend (port 5174)...
cd servante-frontend
call npm install --silent
cd ..
start "Frontend :5174" cmd /k "cd /d %~dp0servante-frontend && npm run dev"

echo       Starting Serial Bridge (COM3 -> :5001)...
start "Serial Bridge COM3" cmd /k "cd /d %~dp0 && node serial-bridge.js"

REM ─── 7. Summary ─────────────────────────────────────────────
echo.
echo [7/7] All services launching!
echo.
echo ============================================================
echo   SERVICE          URL
echo ============================================================
echo   Frontend       http://localhost:5174
echo   Backend API    http://localhost:5001/api
echo   PostgreSQL     localhost:5433
echo   ChromaDB       http://localhost:8001
echo   Ollama         http://localhost:11434
echo   Arduino        COM3 (serial bridge running)
echo ============================================================
echo.
echo   Wait ~10 seconds for backend to fully start, then open:
echo   http://localhost:5174
echo.
echo   To stop everything: run STOP.bat or close all windows
echo   and run: docker-compose -f docker-compose.infra.yml down
echo.
pause
