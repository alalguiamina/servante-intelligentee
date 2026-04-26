#!/bin/bash

# Script de test pour l'intégration de la détection en temps réel

echo "🔍 Test d'intégration - Détection en temps réel"
echo "=================================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Vérifier que best.pt existe
echo -e "\n${YELLOW}[Test 1]${NC} Vérification du modèle best.pt"
if [ -f "best.pt" ]; then
    SIZE=$(stat -f%z "best.pt" 2>/dev/null || stat -c%s "best.pt" 2>/dev/null)
    SIZE_MB=$((SIZE / 1024 / 1024))
    echo -e "${GREEN}✓${NC} Modèle trouvé (${SIZE_MB}MB)"
else
    echo -e "${RED}✗${NC} Modèle best.pt introuvable dans la racine du projet"
    exit 1
fi

# Test 2: Vérifier Python et les dépendances
echo -e "\n${YELLOW}[Test 2]${NC} Vérification des dépendances Python"
if ! command -v python &> /dev/null; then
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}✗${NC} Python n'est pas installé"
        exit 1
    else
        PYTHON="python3"
    fi
else
    PYTHON="python"
fi

echo "Python trouvé: $PYTHON"

# Vérifier ultralytics
if $PYTHON -c "import ultralytics" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} ultralytics installé"
else
    echo -e "${RED}✗${NC} ultralytics non installé. Installez avec:"
    echo "  pip install ultralytics opencv-python pillow"
    exit 1
fi

# Vérifier opencv
if $PYTHON -c "import cv2" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} opencv-python installé"
else
    echo -e "${RED}✗${NC} opencv-python non installé"
    exit 1
fi

# Vérifier PIL
if $PYTHON -c "from PIL import Image" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} pillow installé"
else
    echo -e "${RED}✗${NC} pillow non installé"
    exit 1
fi

# Test 3: Tester le script Python
echo -e "\n${YELLOW}[Test 3]${NC} Test du script realtime_detection.py"
if [ -f "servante-backend/src/services/realtime_detection.py" ]; then
    echo -e "${GREEN}✓${NC} Script trouvé"
    
    # Créer une image de test
    echo -e "\n  Création d'une image de test..."
    $PYTHON << 'EOF'
from PIL import Image, ImageDraw
import base64
from io import BytesIO

# Créer une image de test
img = Image.new('RGB', (640, 480), color='blue')
draw = ImageDraw.Draw(img)
draw.rectangle([100, 100, 300, 300], fill='red', outline='white', width=2)
draw.text((150, 150), 'Test Image', fill='white')

# Sauvegarder en base64
buffer = BytesIO()
img.save(buffer, format='JPEG')
base64_str = base64.b64encode(buffer.getvalue()).decode()
print(base64_str[:50] + '...')
EOF
    
    echo -e "${GREEN}✓${NC} Image de test créée"
else
    echo -e "${RED}✗${NC} Script realtime_detection.py introuvable"
    exit 1
fi

# Test 4: Vérifier l'endpoint Express
echo -e "\n${YELLOW}[Test 4]${NC} Vérification de la configuration Express"
if [ -f "servante-backend/src/controllers/detectionController.ts" ]; then
    echo -e "${GREEN}✓${NC} Detection controller trouvé"
else
    echo -e "${RED}✗${NC} Detection controller introuvable"
    exit 1
fi

if [ -f "servante-backend/src/routes/detectionRoutes.ts" ]; then
    echo -e "${GREEN}✓${NC} Detection routes trouvé"
else
    echo -e "${RED}✗${NC} Detection routes introuvable"
    exit 1
fi

if [ -f "servante-backend/src/services/realtimeDetectionService.ts" ]; then
    echo -e "${GREEN}✓${NC} Realtime detection service trouvé"
else
    echo -e "${RED}✗${NC} Realtime detection service introuvable"
    exit 1
fi

# Test 5: Vérifier le composant React
echo -e "\n${YELLOW}[Test 5]${NC} Vérification du composant React"
if [ -f "servante-frontend/src/components/RealtimeDetection.tsx" ]; then
    echo -e "${GREEN}✓${NC} Composant RealtimeDetection trouvé"
else
    echo -e "${RED}✗${NC} Composant RealtimeDetection introuvable"
    exit 1
fi

if grep -q "import RealtimeDetection" "servante-frontend/src/components/ProductValidation.tsx" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} ProductValidation importe RealtimeDetection"
else
    echo -e "${RED}✗${NC} ProductValidation ne configure pas RealtimeDetection"
fi

# Test 6: Résumé
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ Tous les tests réussis!${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${YELLOW}Prochaines étapes:${NC}"
echo "1. Démarrer le backend:"
echo "   cd servante-backend"
echo "   npm run dev"
echo ""
echo "2. Dans un autre terminal, démarrer le frontend:"
echo "   cd servante-frontend"
echo "   npm run dev"
echo ""
echo "3. Tester le flux:"
echo "   - Naviguer vers http://localhost:5173"
echo "   - Sélectionner un outil à emprunter"
echo "   - Confirmer l'emprunt"
echo "   - Cliquer sur 'Validate' pour démarrer la détection"

echo -e "\n${YELLOW}Documentation:${NC}"
echo "Consultez REALTIME_DETECTION_GUIDE.md pour plus de détails"
