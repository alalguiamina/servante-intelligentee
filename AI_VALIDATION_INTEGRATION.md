# Intégration Validation Produit IA - BEST2.PT

## Vue d'ensemble

Cette intégration ajoute une validation IA au processus d'emprunt. Après que l'utilisateur retire un produit du tiroir, le système capture une photo et utilise le modèle YOLO (best2.pt) pour vérifier que le produit emprunté correspond à celui sélectionné dans l'interface.

**Flux d'emprunt avec validation:**
1. Utilisateur scanne son badge RFID
2. Utilisateur sélectionne un produit
3. Confirme l'emprunt
4. Tiroir s'ouvre
5. Utilisateur prend le produit
6. Tiroir se ferme
7. **✨ NOUVEAU:** Écran de capture photo pour validation IA
8. L'IA vérifie que le produit pris correspond à celui sélectionné
9. Si valide → Emprunt confirmé (statut: VALIDATED)
10. Si invalide → Emprunt annulé et produit replacé (statut: REJECTED)

## Fichiers modifiés/créés

### Backend (Node.js/TypeScript)

#### Fichiers créés:
- **`servante-backend/scripts/ai_validation.py`** - Script Python pour l'inférence du modèle YOLOv5
- **`servante-backend/src/services/aiValidationService.ts`** - Service Node.js pour appeler le script Python

#### Fichiers modifiés:
- **`servante-backend/src/controllers/borrowsController.ts`** - Ajout de `validateBorrowProduct()`
- **`servante-backend/src/routes/borrowsRoutes.ts`** - Ajout de la route POST `/api/borrows/:id/validate-product`
- **`servante-backend/prisma/schema.prisma`** - Ajout des nouveaux statuts (VALIDATED, REJECTED) et table ProductValidation

### Frontend (React/TypeScript)

#### Fichiers créés:
- **`servante-frontend/src/components/ProductValidation.tsx`** - Composant pour capture et validation photo

#### Fichiers modifiés:
- **`servante-frontend/src/App.tsx`** - Ajout du nouvel écran 'product-validation' et logique d'intégration

## Installation et déploiement

### 1. Préparation du modèle IA

Placer le fichier `best2.pt` à la racine du projet:
```bash
cp best2.pt servante-backend/best2.pt
```

Le fichier doit contenir les classes d'objets (produits) à détecter. Format recommandé: **YOLOv5s/m/l**

### 2. Installation des dépendances Python

```bash
cd servante-backend
pip install torch torchvision ultralytics opencv-python pillow
```

Ou pour GPU (CUDA 11.8):
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install ultralytics opencv-python pillow
```

### 3. Mise à jour du modèle Prisma

```bash
cd servante-backend

# Générer les migrations
npx prisma migrate dev --name add_product_validation

# Ou synchroniser directement
npx prisma db push
```

### 4. Variables d'environnement

Ajouter à `servante-backend/.env`:
```env
# AI Model path (default: servante-backend/best2.pt)
AI_MODEL_PATH=./best2.pt

# Optional: Python executable path
PYTHON_EXECUTABLE=python3
```

### 5. Installation des dépendances Node.js

```bash
cd servante-backend
npm install multer # Pour les uploads d'images
```

Vérifier que multer est dans package.json:
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1"
  }
}
```

## Utilisation

### API Endpoint

**POST** `/api/borrows/:id/validate-product`

**Paramètres:**
- `id` - ID de l'emprunt (path parameter)
- `image` - Fichier image (FormData, multipart/form-data)

**Request:**
```bash
curl -X POST http://localhost:5001/api/borrows/borrow-id-123/validate-product \
  -F "image=@product_photo.jpg"
```

**Response (Valide):**
```json
{
  "success": true,
  "is_valid": true,
  "message": "✅ Produit valide! Emprunt confirmé",
  "validation": {
    "validationId": "val-123",
    "expectedProduct": "Tournevis Plat Grand",
    "detectedProduct": "tournevis_plat",
    "confidence": 0.95,
    "allDetections": [...]
  },
  "data": {
    "borrowId": "borrow-id-123",
    "status": "VALIDATED",
    "toolName": "Tournevis Plat Grand",
    "userName": "John Doe"
  }
}
```

**Response (Invalide):**
```json
{
  "success": false,
  "is_valid": false,
  "message": "❌ Produit invalide! Emprunt annulé",
  "reason": "Product mismatch",
  "validation": {
    "validationId": "val-124",
    "expectedProduct": "Tournevis Plat Grand",
    "detectedProduct": "tournevis_americain",
    "confidence": 0.87
  },
  "error": "Validation service error"
}
```

## Statuts d'emprunt

| Statut | Description |
|--------|-------------|
| ACTIVE | Emprunt créé, en attente de validation |
| VALIDATED | ✅ Validation réussie, produit confirmé |
| REJECTED | ❌ Validation échouée, emprunt annulé |
| RETURNED | Produit retourné à temps |
| OVERDUE | Produit en retard |

## Personnalisation

### Modifier les classes produits

Éditer `servante-backend/scripts/ai_validation.py`:
```python
self.product_classes = {
    0: "tournevis_plat",
    1: "tournevis_americain",
    2: "cle_molette",
    3: "pince",
    4: "ciseaux",
    5: "clé",
    # Ajouter plus de classes
}
```

### Ajuster le seuil de confiance

Modifier le seuil dans `validateBorrowProduct()`:
```typescript
// Confiance minimum de 50% (0.5 = 50%)
const validationResult = await aiValidationService.validateProductInImage(
  uploadedFilePath,
  borrow.tool.name,
  0.5  // ← Modifier ici
);
```

## Dépannage

### Python module not found
```bash
# Vérifier que Python est installé
python --version

# Installer les dépendances
pip install torch torchvision ultralytics opencv-python pillow
```

### Modèle best.pt non trouvé
```bash
# Placer le fichier au bon endroit
ls -la servante-backend/best2.pt

# Ou configurer le chemin
export AI_MODEL_PATH=/path/to/best2.pt
```

### Erreur lors de la validation
Vérifier les logs du backend:
```bash
# Terminal 1 - Backend
npm run dev
```

Les détails d'erreur seront affichés dans la console.

### Caméra non détectée au frontend
- Vérifier les permissions du navigateur
- Sur localhost, utiliser HTTPS ou accepter l'accès caméra
- Supporter le fallback par upload de fichier

## Tests

### Tester manuellement l'API Python

```bash
cd servante-backend

# Tester la détection
python scripts/ai_validation.py \
  --model best2.pt \
  --image /path/to/test_image.jpg

# Tester la validation
python scripts/ai_validation.py \
  --model best2.pt \
  --image /path/to/test_image.jpg \
  --expected-product "tournevis_plat"
```

### Tester l'endpoint de validation

```bash
# 1. Créer un emprunt
curl -X POST http://localhost:5001/api/borrows \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "toolId": "tool-id"
  }'

# 2. Récupérer l'ID de l'emprunt (dans la réponse)

# 3. Tester la validation
curl -X POST http://localhost:5001/api/borrows/borrow-id/validate-product \
  -F "image=@test_photo.jpg"
```

## Performance

- **Inférence YOLOv5s**: ~50-100ms (CPU), ~20-50ms (GPU)
- **Upload image**: ~1-2s (par réseau)
- **Total par validation**: ~2-4s

## Sécurité

- Les images sont supprimées après validation
- Validateur requiert un emprunt ACTIVE existant
- Seuil de confiance minimum de 50% pour éviter faux positifs
- Logs de validation stockés pour audit

## Futures améliorations

- ✨ Intégration avec model serveur distant (AWS, GCP)
- ✨ Cache des modèles pour performances
- ✨ Notifications push pour erreurs de validation
- ✨ Dashboard d'analytics des validations
- ✨ Support multi-modèles par catégorie produit
