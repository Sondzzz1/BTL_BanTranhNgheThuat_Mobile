@echo off
echo ========================================
echo UPDATE TO EXPO SDK 54 COMPATIBLE VERSIONS
echo ========================================
echo.

echo Stopping any running Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo Step 1: Removing old files...
if exist node_modules (
    echo Deleting node_modules...
    rmdir /s /q node_modules
)
if exist .expo (
    echo Deleting .expo cache...
    rmdir /s /q .expo
)
if exist package-lock.json (
    echo Deleting package-lock.json...
    del /f /q package-lock.json
)
echo Done!
echo.

echo Step 2: Cleaning npm cache...
call npm cache clean --force
echo Done!
echo.

echo Step 3: Installing correct versions for SDK 54...
call npm install --legacy-peer-deps
echo Done!
echo.

echo ========================================
echo SUCCESS! Now run: npx expo start -c
echo ========================================
echo.
pause
