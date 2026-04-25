# 🎨 Architecture - Intégration Validation Produit IA

## 📊 Diagramme du flux complet

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  Badge   │
│  Scan    │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Tool Selection   │
│ (Utilisateur     │
│  choisit produit)│
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Confirm Borrow   │
│ (Confirmation)   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  POST /api/      │
│  borrows         │
│  (Créer emprunt) │
└────┬─────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│  Drawer Opens (Motor spins)              │
│  ├─ Arduino: M1 on (X,Y,Z,A motors)     │
│  └─ Hardware API sends command           │
└────┬─────────────────────────────────────┘
     │
     ▼ (Utilisateur prend le produit)
     │
     ▼
┌──────────────────────────────────────────┐
│  Drawer Closes (Motor spins back)        │
│  └─ Arduino: M1 off                      │
└────┬─────────────────────────────────────┘
     │
     ▼
✨ ┌───────────────────────────────────────┐ ✨
   │   PRODUCT VALIDATION SCREEN (NEW)     │
   │   ═══════════════════════════════════ │
   │                                       │
   │   📷 Capture Product Photo            │
   │   ├─ Camera Live Feed                 │
   │   ├─ Capture Button                   │
   │   └─ Upload File Alternative          │
   │                                       │
   │   🔄 Sending to AI...                 │
   │                                       │
   │   📊 Validation Result:               │
   │   ├─ Expected: Tournevis Plat Grand   │
   │   ├─ Detected: tournevis_plat (95%)   │
   │   └─ Status: ✅ VALID                 │
   └────┬────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────┐
    │  Frontend Action                    │
    │  ┌──────────────────────────────┐   │
    │  │ Axios: POST /borrows/:id/    │   │
    │  │ validate-product             │   │
    │  │ + FormData (image file)      │   │
    │  └──────────────────────────────┘   │
    └─────────────┬───────────────────────┘
                  │
         ┌────────┼────────┐
         │                 │
         ▼                 ▼
    ✅ VALID          ❌ INVALID
         │                 │
         ▼                 ▼
   Update Borrow      Update Borrow
   Status:VALIDATED   Status:REJECTED
         │                 │
         ├─ Save in DB     ├─ Revert tool qty
         ├─ Create audit   ├─ Delete emprunt
         └─ Show toast     └─ Show error
         
         │                 │
         ▼                 ▼
   ✅ Emprunt      ❌ Emprunt
   Confirmé         Annulé
```

---

## 🏗️ Architecture système

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB APPLICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      FRONTEND (React)                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌─ ProductValidation Component                          │  │
│  │  │  ├─ Camera API (getUserMedia)                         │  │
│  │  │  ├─ Canvas (capture photo)                            │  │
│  │  │  └─ Form Upload (alternative)                         │  │
│  │  │                                                        │  │
│  │  └─ App.tsx Integration                                 │  │
│  │     ├─ Screen 'product-validation'                       │  │
│  │     ├─ States: activeBorrowId, validationRequired        │  │
│  │     └─ Handlers: onValidationSuccess/Failure             │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │ HTTP                              │
│                              │ POST /api/borrows/:id/            │
│                              │ validate-product                  │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
├──────────────────────────────┼──────────────────────────────────┤
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           borrowsController.ts                           │  │
│  │                                                           │  │
│  │  validateBorrowProduct(req, res)                        │  │
│  │  ├─ Parse file upload (multer)                          │  │
│  │  ├─ Validate borrow exists & ACTIVE                    │  │
│  │  └─ Call aiValidationService                           │  │
│  │                                                           │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │        aiValidationService.ts (Node wrapper)            │  │
│  │                                                           │  │
│  │  validateProductInImage(imagePath, expectedProduct)    │  │
│  │  ├─ Validate inputs                                    │  │
│  │  ├─ Execute Python script via exec()                   │  │
│  │  ├─ Parse JSON output                                  │  │
│  │  └─ Return ValidationResult                            │  │
│  │                                                           │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │ spawn child process                     │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  borrowsController.ts (continue)                        │  │
│  │                                                           │  │
│  │  ├─ Save ProductValidation record                       │  │
│  │  ├─ Update Borrow status (VALIDATED/REJECTED)           │  │
│  │  ├─ Update Tool quantities if rejected                  │  │
│  │  └─ Return response                                     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────┬──┘  │
│                                                          │       │
└──────────────────────────────────────────────────────────┼───────┘
                                                           │
                  ┌────────────────────────────────────────┼────────────────┐
                  │                                        │                │
                  ▼                                        ▼                │
        ┌──────────────────┐              ┌──────────────────────┐       │
        │   ai_validation   │              │  Prisma ORM          │       │
        │   .py (Python)    │              │  ├─ Save ProductVal  │       │
        │                  │              │  ├─ Update Borrow    │       │
        │ YOLOv5 Detection │              │  ├─ Update Tool      │       │
        │ ├─ Load best2.pt │              │  └─ Query relations  │       │
        │ ├─ Run inference │              └──────────┬───────────┘       │
        │ ├─ Parse results │                         │                   │
        │ └─ JSON output   │                         ▼                   │
        └──────────────────┘              ┌──────────────────────┐       │
                  ▲                        │  PostgreSQL DB       │       │
                  │                        │  ├─ Borrow table     │       │
                  │ best2.pt               │  ├─ ProductValidat   │       │
                  │ YOLO model             │  ├─ Tool table       │       │
                  │                        │  └─ User table       │       │
                  └────────────────────────┴──────────────────────┘       │
```

---

## 📁 Arborescence des fichiers

```
servante-intelligentee/
├── 📄 AI_VALIDATION_INTEGRATION.md ⭐ (Documentation complète)
├── 📄 MODIFICATION_SUMMARY.md ⭐ (Résumé modifications)
├── 📄 QUICK_START_GUIDE.md ⭐ (Guide déploiement)
├── 🔧 install-ai-validation.sh ⭐ (Script Linux/Mac)
├── 🔧 install-ai-validation.bat ⭐ (Script Windows)
├── 📄 best2.pt ⭐ (À placer ici)
│
├── servante-backend/
│   ├── 📄 best2.pt ← PLACE LE MODÈLE ICI
│   ├── .env ← Ajouter: AI_MODEL_PATH=./best2.pt
│   ├── package.json (multer déjà présent)
│   ├── scripts/
│   │   └── 🆕 ai_validation.py ⭐ (Script Python)
│   ├── src/
│   │   ├── controllers/
│   │   │   └── borrowsController.ts ⭐ (Modifié: +validateBorrowProduct)
│   │   ├── routes/
│   │   │   └── borrowsRoutes.ts ⭐ (Modifié: +route validation)
│   │   └── services/
│   │       └── 🆕 aiValidationService.ts ⭐ (Service IA)
│   └── prisma/
│       └── schema.prisma ⭐ (Modifié: +VALIDATED, +REJECTED, +ProductValidation)
│
└── servante-frontend/
    └── src/
        ├── App.tsx ⭐ (Modifié: +product-validation screen)
        └── components/
            └── 🆕 ProductValidation.tsx ⭐ (Composant capture/validation)
```

---

## 🔗 Dépendances et flux

```
Frontend Request
    ↓
ReactComponent (ProductValidation)
    ↓ (FormData + image)
Express Route
    ↓ (POST /borrows/:id/validate-product)
borrowsController
    ↓
aiValidationService
    ↓ (exec Python script)
ai_validation.py
    ↓ (PyTorch + YOLOv5)
best2.pt Model
    ↓
Detection Result (JSON)
    ↓
aiValidationService (parse)
    ↓
borrowsController (handle result)
    ↓
Prisma ORM (save ProductValidation)
    ↓
PostgreSQL Database
    ↓
Response (JSON)
    ↓
Frontend (show result)
```

---

## 📊 Données de validation

```
ProductValidation Record:
{
  id: UUID
  borrowId: String (FK)
  toolId: String (FK)
  isValid: Boolean
  expectedProduct: String (e.g., "Tournevis Plat Grand")
  detectedProduct: String (e.g., "tournevis_plat")
  confidence: Float (0.0 - 1.0)
  allDetections: JSON [] (toutes les détections)
  imagePath: String (supprimée après validation)
  validatedAt: DateTime
}

Borrow Status Flow:
ACTIVE → VALIDATED (success) ✅
ACTIVE → REJECTED (failure) ❌
```

---

## ⚡ Performance

```
Component Timeline:
├─ Frontend
│  ├─ Camera initialization: ~500ms
│  ├─ Photo capture: <50ms
│  └─ Request send: ~100ms
│
├─ Network
│  └─ Upload/download: 500ms - 2s
│
├─ Python Script
│  ├─ Model load (first time): ~3-5s
│  ├─ Model load (cached): <100ms
│  ├─ Inference (GPU): 30-50ms
│  ├─ Inference (CPU): 100-150ms
│  └─ Total: 200-300ms avg
│
└─ Database
   └─ Save + update: 50-100ms

Total average: 2-4 seconds per validation
```

---

## 🔐 Sécurité

```
Input Validation:
├─ Borrow must be ACTIVE
├─ File size max 10MB
├─ MIME types: JPEG, PNG, WEBP only
└─ User can only validate own borrow

Output Protection:
├─ Images deleted immediately after
├─ Confidence threshold minimum 50%
├─ All validations logged for audit
└─ No sensitive data in logs
```

---

**Architecture complete et validated ✅**
