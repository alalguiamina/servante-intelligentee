# Détection en Temps Réel - Documentation

## Vue d'ensemble

Ce système ajoute une détection d'objets en temps réel avec le modèle YOLOv8 (best.pt) lors de la confirmation d'emprunt d'outils. Le processus dure 10 secondes pendant lesquelles le système:

1. Capture les frames vidéo depuis la caméra
2. Envoie chaque frame au serveur backend
3. Le backend exécute la détection avec le modèle best.pt
4. Affiche les détections en temps réel avec les boîtes englobantes
5. Vérifie que l'outil attendu a été détecté
6. Demande une confirmation finale

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ProductValidation.tsx                                   ││
│  │ - Gère le flux de validation du produit                 ││
│  │ - Lance RealtimeDetection quand l'utilisateur valide    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ RealtimeDetection.tsx                                   ││
│  │ - Affiche la vidéo de la caméra                         ││
│  │ - Capture les frames toutes les 1 seconde               ││
│  │ - Envoie les frames base64 au backend                   ││
│  │ - Affiche les détections avec annotation (10s)          ││
│  │ - Demande la confirmation finale                        ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┬─┘
                         HTTP (POST)
                         ↓
┌───────────────────────────────────────────────────────────┐
│              Backend Express.js (Node.js)                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ detectionController.ts                              │  │
│  │ - POST /api/detection/detect                         │  │
│  │ - POST /api/borrows/:borrowId/detect-tool           │  │
│  │ - GET /api/detection/status                         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ realtimeDetectionService.ts                         │  │
│  │ - Appelle le script Python via child_process        │  │
│  │ - Gère les fichiers temporaires                     │  │
│  │ - Parse les résultats JSON                          │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┬─┘
                    child_process.exec
                         ↓
┌───────────────────────────────────────────────────────────┐
│           Backend Python (Machine Learning)               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ realtime_detection.py                               │  │
│  │ - RealtimeDetector class                            │  │
│  │ - Charge le modèle best.pt (YOLOv8)                 │  │
│  │ - Décode l'image base64                             │  │
│  │ - Exécute la détection                              │  │
│  │ - Génère les boîtes englobantes                     │  │
│  │ - Retourne JSON avec détections et image annotée    │  │
│  └─────────────────────────────────────────────────────┘  │
│                    ↓                                       │
│             best.pt (YOLOv8 model)                        │
└───────────────────────────────────────────────────────────┘
```

## Installation

### 1. Dépendances Backend

Installez les dépendances Python requises:

```bash
cd servante-backend
pip install ultralytics opencv-python pillow
```

Vérifiez que le modèle `best.pt` est présent dans la racine du projet:

```bash
ls ../best.pt
# Ou si le fichier est ailleurs:
cp /chemin/vers/best.pt ../best.pt
```

### 2. Vérifier la Configuration

Assurez-vous que le port 3000 est disponible et que le backend Express peut exécuter les scripts Python:

```bash
# Test rapide du script Python
python src/services/realtime_detection.py --model ../best.pt
```

### 3. Démarrer le Serveur

```bash
# Terminal 1: Backend
cd servante-backend
npm run dev

# Terminal 2: Frontend
cd servante-frontend
npm run dev
```

## Utilisation

### Flux utilisateur

1. **Emprunter un outil** → L'utilisateur sélectionne un outil à emprunter
2. **Confirmation** → Click sur "Confirmer l'emprunt"
3. **Caméra activée** → Le composant ProductValidation affiche la caméra
4. **Capture initiale** → L'utilisateur capture une photo de l'outil (optionnel)
5. **Validation** → Click sur "Validate" lance la détection en temps réel
6. **Détection (10s)** → 
   - La caméra s'affiche à gauche
   - Les détections s'affichent à droite avec les boîtes englobantes
   - Chaque frame est traité 1 fois par seconde
   - Un minuteur affiche le temps restant (en haut à droite)
7. **Confirmation finale** → L'utilisateur clique sur "Confirm"
8. **Validation** → Le système vérifie que l'outil attendu a été détecté
9. **Succès/Échec** → Message de confirmation ou d'erreur

### Endpoints API

#### Détection générique
```bash
POST /api/detection/detect
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZ..." 
}

Response:
{
  "success": true,
  "detections": [
    {
      "x": 100,
      "y": 150,
      "w": 200,
      "h": 180,
      "class": "Multimètre",
      "class_id": 0,
      "confidence": 0.92
    }
  ],
  "annotated_image": "iVBORw0KGgoAAAANS...",
  "count": 1
}
```

#### Détection pour emprunt
```bash
POST /api/borrows/:borrowId/detect-tool
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}

Response:
{
  "success": true,
  "detections": [...],
  "annotated_image": "...",
  "count": 1,
  "borrowId": "abc123"
}
```

#### Vérifier le statut
```bash
GET /api/detection/status

Response:
{
  "success": true,
  "message": "Service de détection opérationnel",
  "features": [
    "realtime-detection",
    "bounding-boxes",
    "confidence-scores"
  ]
}
```

## Configuration Avancée

### Variables d'environnement (.env)

```bash
# Backend
AI_MODEL_PATH=./best.pt
DETECTION_CONFIDENCE=0.35
DETECTION_TIMEOUT=30000
```

### Paramètres de détection

Dans `realtime_detection.py`:

```python
# Seuil de confiance (0-1)
conf_threshold=0.35  # Augmentez pour moins de faux positifs

# Modèle
model_path="best.pt"
```

## Optimisation Performance

### Frontend

1. **Réduction de la qualité vidéo**: Les frames JPEG sont compressés à 80% de qualité
2. **Fréquence de capture**: 1 frame par seconde (ajustable)
3. **Buffer limité**: Maximum 50MB par requête

### Backend

1. **Timeout**: 30 secondes max par requête
2. **Cache du modèle**: Le modèle est chargé une seule fois
3. **Nettoyage**: Les fichiers temporaires sont supprimés après traitement

## Dépannage

### "Erreur: le package 'ultralytics' n'est pas installé"

```bash
pip install ultralytics
# Ou
pip install -r requirements.txt
```

### "Modèle introuvable -> best.pt"

```bash
# Vérifier le chemin
ls ../best.pt

# Ou spécifier le chemin complet
export AI_MODEL_PATH=/chemin/complet/vers/best.pt
```

### "Unable to access camera"

```javascript
// Vérifier les permissions:
// - Chrome: Paramètres → Confidentialité → Caméra → Autoriser
// - Firefox: À propos:preferences → Confidentialité → Caméra
// - Utiliser HTTPS en production (https:// requis)
```

### Performance lente

1. Vérifier le GPU: `nvidia-smi` ou utiliser CPU
2. Réduire la résolution: 640x480 au lieu de 1280x720
3. Augmenter `conf_threshold` pour moins de détections
4. Réduire la fréquence: Capturer tous les 2 secondes au lieu de 1

### Pas de détections

1. Vérifier l'image: S'assurer que l'outil est visible
2. Réduire `conf_threshold` à 0.25
3. Vérifier le modèle: `python src/services/realtime_detection.py --image test.jpg --json`

## Intégration avec les emprunts

### Flow complet

```typescript
// Dans le composant d'emprunt
const createBorrow = async (toolId: string) => {
  // 1. Créer l'emprunt en BD
  const borrow = await borrowsAPI.create({
    toolId,
    userId,
    dueDate: daysFromNow(7)
  });

  // 2. Afficher ProductValidation
  // ProductValidation →
  //   - Capture photo (optionnel)
  //   - Validation click → RealtimeDetection
  //   - RealtimeDetection (10s)
  //   - Confirm click
  //   - onValidationSuccess() appelé
  //   - Emprunt confirmé

  return borrow;
};
```

## Classes détectables

Les classes détectables dépendent du dataset utilisé pour entraîner best.pt. Par défaut, il détecte:

- Clés (L grande, L petite)
- Cutteur
- Dénudeur automatique
- Multimètres
- Pinces (coupante, à bec, universelle, etc.)
- Perceuse
- Tournevis
- Et autres outils dans le dataset

Pour ajouter de nouveaux outils:

1. Réentraîner le modèle avec `ultralytics`
2. Exporter en `best.pt`
3. Remplacer le fichier dans le projet

## Performance attendue

- **Latence**: 500-2000ms par frame (CPU: 1-5s, GPU: 0.2-0.5s)
- **Détections/frame**: Variable selon le nombre d'objets
- **Mémoire**: ~2-3GB (backend avec modèle chargé)
- **Bande passante**: ~500KB-2MB par frame JPEG

## Futures améliorations

- [ ] Support GPU (CUDA/TensorRT)
- [ ] WebGL côté frontend pour détection locale
- [ ] Cache des frames pour post-processing
- [ ] Détection multi-caméra
- [ ] Logs et métriques
- [ ] API de confidence variable par classe
- [ ] Support des modèles YOLOv9/v10

## Support et Questions

Pour toute question sur la détection en temps réel, consultez:

- Documentation YOLO: https://docs.ultralytics.com
- OpenCV docs: https://docs.opencv.org
- Issues GitHub du projet
