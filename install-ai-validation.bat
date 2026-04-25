@echo off
REM ============================================
REM Installation Rapide - Validation Produit IA
REM Windows Batch Script
REM ============================================

setlocal enabledelayedexpansion

echo.
echo 🚀 Debut de l'installation de la validation produit IA (best2.pt)
echo.

REM Check if Python is installed
echo 📍 Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non trouve. Installez Python 3.8+
    echo    Telecharger: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python trouve

echo.
echo 📦 Installation des dependances Python...
python -m pip install --upgrade pip
python -m pip install torch torchvision ultralytics opencv-python pillow

if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des packages Python
    pause
    exit /b 1
)
echo ✅ Dependances Python installes

echo.
echo 📦 Installation des dependances Node.js...
cd servante-backend
call npm install

if errorlevel 1 (
    echo ❌ Erreur lors de l'installation npm
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependances Node.js installes
cd ..

echo.
echo 🗄️  Mise a jour de la base de donnees...
cd servante-backend

REM Run prisma migration
echo Execution: npx prisma db push
call npx prisma db push

if errorlevel 1 (
    echo ⚠️  Attention: Erreur lors de la migration Prisma
    echo Essayez manuellement: npx prisma db push
)

cd ..

echo.
echo 📋 Verification des fichiers...

set files[0]=servante-backend\scripts\ai_validation.py
set files[1]=servante-backend\src\services\aiValidationService.ts
set files[2]=servante-frontend\src\components\ProductValidation.tsx
set files[3]=AI_VALIDATION_INTEGRATION.md

for %%f in (%files[0]% %files[1]% %files[2]% %files[3]%) do (
    if exist "%%f" (
        echo   ✅ %%f
    ) else (
        echo   ❌ %%f - MANQUANT!
    )
)

echo.
echo ✅ Installation terminee!
echo.
echo 📝 Prochaines etapes:
echo   1. Placez le fichier best2.pt dans: servante-backend\best2.pt
echo   2. Demarrez le backend: cd servante-backend ^&^& npm run dev
echo   3. Demarrez le frontend: cd servante-frontend ^&^& npm run dev
echo   4. Voir la documentation: AI_VALIDATION_INTEGRATION.md
echo.
echo 🧪 Test rapide:
echo   python servante-backend\scripts\ai_validation.py --help
echo.
pause
