@echo off
echo ========================================
echo FIX EXPO 54 DEPENDENCIES
echo ========================================
echo.

echo Step 1: Remove old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist .expo rmdir /s /q .expo
if exist package-lock.json del /f /q package-lock.json
echo Done!
echo.

echo Step 2: Clean npm cache...
call npm cache clean --force
echo Done!
echo.

echo Step 3: Install Expo 54 compatible versions...
call npx expo install --fix
echo Done!
echo.

echo Step 4: Install additional packages...
call npm install --legacy-peer-deps
echo Done!
echo.

echo ========================================
echo FIXED! Now run: npx expo start -c
echo ========================================
pause
