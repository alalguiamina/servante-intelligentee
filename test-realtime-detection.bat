@echo off
REM Script de test pour l'intégration de la détection en temps réel (Windows)

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Detection en temps reel - Test Windows
echo ========================================
echo.

REM Test 1: Verifier que best.pt existe
echo [Test 1] Verification du modele best.pt
if exist "best.pt" (
    for /F "tokens=*" %%A in ('powershell -Command "(Get-Item 'best.pt').Length / 1MB"') do set "SIZE=%%A"
    echo ✓ Modele trouve ^(!SIZE:.0=! MB^)
) else (
    echo ✗ Modele best.pt introuvable
    exit /b 1
)

REM Test 2: Verifier Python et les dependances
echo.
echo [Test 2] Verification des dependances Python
where python >nul 2>nul
if !errorlevel! neq 0 (
    where python3 >nul 2>nul
    if !errorlevel! neq 0 (
        echo ✗ Python n'est pas installe
        exit /b 1
    ) else (
        set "PYTHON=python3"
    )
) else (
    set "PYTHON=python"
)

echo Python trouve: !PYTHON!

REM Verifier ultralytics
!PYTHON! -c "import ultralytics" >nul 2>nul
if !errorlevel! equ 0 (
    echo ✓ ultralytics installe
) else (
    echo ✗ ultralytics non installe
    echo   Installez avec: pip install ultralytics opencv-python pillow
    exit /b 1
)

REM Verifier opencv
!PYTHON! -c "import cv2" >nul 2>nul
if !errorlevel! equ 0 (
    echo ✓ opencv-python installe
) else (
    echo ✗ opencv-python non installe
    exit /b 1
)

REM Verifier PIL
!PYTHON! -c "from PIL import Image" >nul 2>nul
if !errorlevel! equ 0 (
    echo ✓ pillow installe
) else (
    echo ✗ pillow non installe
    exit /b 1
)

REM Test 3: Tester le script Python
echo.
echo [Test 3] Test du script realtime_detection.py
if exist "servante-backend\src\services\realtime_detection.py" (
    echo ✓ Script trouve
) else (
    echo ✗ Script realtime_detection.py introuvable
    exit /b 1
)

REM Test 4: Verifier l'endpoint Express
echo.
echo [Test 4] Verification de la configuration Express
if exist "servante-backend\src\controllers\detectionController.ts" (
    echo ✓ Detection controller trouve
) else (
    echo ✗ Detection controller introuvable
    exit /b 1
)

if exist "servante-backend\src\routes\detectionRoutes.ts" (
    echo ✓ Detection routes trouve
) else (
    echo ✗ Detection routes introuvable
    exit /b 1
)

if exist "servante-backend\src\services\realtimeDetectionService.ts" (
    echo ✓ Realtime detection service trouve
) else (
    echo ✗ Realtime detection service introuvable
    exit /b 1
)

REM Test 5: Verifier le composant React
echo.
echo [Test 5] Verification du composant React
if exist "servante-frontend\src\components\RealtimeDetection.tsx" (
    echo ✓ Composant RealtimeDetection trouve
) else (
    echo ✗ Composant RealtimeDetection introuvable
    exit /b 1
)

REM Test 6: Resume
echo.
echo ========================================
echo ✓ Tous les tests reussis!
echo ========================================
echo.
echo Prochaines etapes:
echo.
echo 1. Demarrer le backend:
echo    cd servante-backend
echo    npm run dev
echo.
echo 2. Dans un autre terminal, demarrer le frontend:
echo    cd servante-frontend
echo    npm run dev
echo.
echo 3. Tester le flux:
echo    - Naviguer vers http://localhost:5173
echo    - Selectionner un outil a emprunter
echo    - Confirmer l'emprunt
echo    - Cliquer sur 'Validate' pour demarrer la detection
echo.
echo Documentation:
echo Consultez REALTIME_DETECTION_GUIDE.md pour plus de details

endlocal
