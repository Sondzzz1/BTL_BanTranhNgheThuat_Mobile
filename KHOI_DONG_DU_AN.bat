@echo off
chcp 65001 >nul
title Art Gallery - Khoi Dong Du An

echo ============================================
echo   ART GALLERY - KHOI DONG HE THONG
echo ============================================
echo.

REM Kiem tra thu muc
if not exist "DoAn3_BackEnd" (
    echo [LOI] Khong tim thay thu muc DoAn3_BackEnd!
    echo Hay chay file nay tu thu muc goc du an.
    pause
    exit /b 1
)

if not exist "art-gallery-react" (
    echo [LOI] Khong tim thay thu muc art-gallery-react!
    pause
    exit /b 1
)

echo [1/2] Dang khoi dong Backend (port 5273)...
start "BACKEND - ASP.NET Core" cmd /k "cd /d %~dp0DoAn3_BackEnd\DoAn2_BackEnd && dotnet run --launch-profile http"

echo     Doi 10 giay de backend khoi dong...
timeout /t 10 /nobreak >nul

echo [2/2] Dang khoi dong Frontend (port 3000)...
start "FRONTEND - React" cmd /k "cd /d %~dp0art-gallery-react && npm start"

echo.
echo ============================================
echo   HAI SERVER DANG CHAY:
echo   Backend:  http://localhost:5273
echo   Frontend: http://localhost:3000
echo   Swagger:  http://localhost:5273/swagger
echo ============================================
echo.
echo Dong cua so nay khi muon tat.
pause
