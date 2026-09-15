@echo off
echo ================================================
echo CAI DAT CAC TINH NANG MOI
echo ================================================
echo.

cd /d "%~dp0"

echo Dang cai dat cac thu vien...
echo - @react-native-picker/picker (cho Contact screen)
echo - expo-image-picker (cho Return Request)
echo.

call npm install

if errorlevel 1 (
    echo.
    echo [ERROR] Cai dat that bai!
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo CAI DAT THANH CONG!
echo ================================================
echo.
echo Cac man hinh moi da duoc them:
echo  1. Tin Tuc (NewsScreen)
echo  2. Gioi Thieu (AboutScreen)
echo  3. Hoa Si (ArtistsScreen)
echo  4. Lien He (ContactScreen)
echo.
echo Buoc tiep theo:
echo  1. Chay: npx expo start --clear
echo  2. Reload app tren dien thoai
echo  3. Vao Profile de xem cac menu moi
echo.

pause
