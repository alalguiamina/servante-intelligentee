#!/bin/bash

# ============================================
# Installation Rapide - Validation Produit IA
# ============================================

set -e

echo "🚀 Début de l'installation de la validation produit IA (best2.pt)"
echo ""

# Vérifier si les fichiers existent
echo "✓ Vérification des fichiers installés..."

files=(
    "servante-backend/scripts/ai_validation.py"
    "servante-backend/src/services/aiValidationService.ts"
    "servante-frontend/src/components/ProductValidation.tsx"
    "AI_VALIDATION_INTEGRATION.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING!"
        exit 1
    fi
done

echo ""
echo "📦 Installation des dépendances Python..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python3 not found. Please install Python 3.8+"
    exit 1
fi

python3 -m pip install --upgrade pip
python3 -m pip install torch torchvision ultralytics opencv-python pillow

echo ""
echo "📦 Installation des dépendances Node.js..."
cd servante-backend
npm install
cd ..

echo ""
echo "🗄️  Mise à jour de la base de données..."
cd servante-backend

# Vérifier si la migration est nécessaire
echo "Exécution: npx prisma db push"
npx prisma db push

echo ""
echo "📋 Vérification des variables d'environnement..."

# Vérifier if .env exists
if [ -f servante-backend/.env ]; then
    if grep -q "AI_MODEL_PATH" servante-backend/.env; then
        echo "  ✅ AI_MODEL_PATH trouvé dans .env"
    else
        echo "  ⚠️  AI_MODEL_PATH non défini. Ajout..."
        echo "AI_MODEL_PATH=./best2.pt" >> servante-backend/.env
    fi
else
    echo "  ⚠️  Fichier .env non trouvé. Création..."
    echo "AI_MODEL_PATH=./best2.pt" >> servante-backend/.env
fi

cd ..

echo ""
echo "✅ Installation terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Placez le fichier best2.pt à: ./servante-backend/best2.pt"
echo "  2. Démarrez le backend: cd servante-backend && npm run dev"
echo "  3. Démarrez le frontend: cd servante-frontend && npm run dev"
echo "  4. Pour la documentation complète, voir: AI_VALIDATION_INTEGRATION.md"
echo ""
echo "🧪 Test rapide:"
echo "  python3 servante-backend/scripts/ai_validation.py --help"
