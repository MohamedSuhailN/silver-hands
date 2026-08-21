@echo off
title SilverHands Unified Platform
echo ==========================================================
echo    SilverHands ? Unified Elder Livelihood Platform
echo ==========================================================
echo.
echo [1/2] Starting Django REST Backend (Port 8000)...
start "SilverHands Backend" cmd /k "cd /d %~dp0backend && ..\..\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

echo [2/2] Starting Vite React Frontend (Port 5173)...
start "SilverHands Frontend" cmd /k "cd /d %~dp0frontend && set PATH=C:\Program Files\nodejs;%%PATH%% && npm.cmd run dev"

echo.
echo ==========================================================
echo  ? Backend running at:  http://127.0.0.1:8000/
echo  ? Frontend running at: http://localhost:5173/
echo ==========================================================
echo.
echo Default Credentials:
echo   - Admin:    admin / admin123
echo   - Customer: demo_customer / demo1234
echo   - Provider: lakshmi / demo1234
echo.
pause
