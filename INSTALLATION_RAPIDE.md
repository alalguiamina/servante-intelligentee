# Installation rapide - Détection en temps réel

## ⚡ TL;DR (Installation en 5 minutes)

### Prérequis
- Python 3.8+
- Node.js 16+
- Best.pt (modèle YOLOv8) déjà présent dans la racine du projet

### Installation

```bash
# 1. Installation des dépendances Python
cd servante-backend
pip install -r requirements-detection.txt

# 2. Installer les dépendances Node (si pas encore fait)
npm install

# 3. Retour à la racine et test
cd ..

# Sur Windows
test-realtime-detection.bat

# Sur macOS/Linux
chmod +x test-realtime-detection.sh
./test-realtime-detection.sh
```

### Démarrage

```bash
# Terminal 1: Backend
cd servante-backend
npm run dev

# Terminal 2: Frontend
cd servante-frontend  
npm run dev
```

### Accès
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health
- Detection Status: http://localhost:3000/api/detection/status

---

## 📋 Vérification après installation

Une fois les serveurs démarrés, vérifiez que tout fonctionne:

### Via Terminal
```bash
# Test de l'endpoint detection
curl -X POST http://localhost:3000/api/detection/status

# Vous devriez obtenir:
# {"success":true,"message":"Service de détection opérationnel",...}
```

### Via le Frontend
1. Allez sur http://localhost:5173
2. Connectez-vous
3. Sélectionnez un outil à emprunter
4. Cliquez sur "Confirmer l'emprunt"
5. Cliquez sur "Validate" → La détection doit démarrer (10 secondes)

---

## ⚙️ Configuration

### Variables d'environnement (optionnel)

Créez `.env` dans `servante-backend`:

```bash
# Chemin vers le modèle (relatif ou absolu)
AI_MODEL_PATH=../best.pt

# Seuil de confiance (0.0-1.0)
DETECTION_CONFIDENCE=0.35

# Timeout de détection (millisecondes)
DETECTION_TIMEOUT=30000

# Environnement
NODE_ENV=development
```

### Paramètres frontend (ProductValidation.tsx)

Durée de détection (10 secondes par défaut):
```typescript
const [timeRemaining, setTimeRemaining] = useState(10); // ← Modifier ici
```

Fréquence de capture (1 frame/seconde par défaut):
```typescript
}, 1000); // ← Modifier ici (en millisecondes)
```

---

## 🐛 Dépannage rapide

| Problème | Solution |
|----------|----------|
| "ModuleNotFoundError: No module named 'ultralytics'" | `pip install ultralytics` |
| "Erreur d'accès caméra" | Accordez les permissions de caméra au navigateur |
| "best.pt non trouvé" | Vérifiez que best.pt est dans la racine du projet |
| "Détection très lente" | Réduisez la résolution ou augmentez `conf_threshold` |
| "Pas de détections" | Réduisez `conf_threshold` à 0.25 |

---

## 📖 Documentation complète

Pour une documentation complète, consultez **REALTIME_DETECTION_GUIDE.md**

---

## 🎯 Flux utilisateur simplifié

```
┌─────────────────────────────────────────┐
│ 1. Sélectionner outil à emprunter      │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 2. Cliquer "Confirmer l'emprunt"        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 3. Caméra s'affiche (ProductValidation) │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 4. Cliquer "Validate"                   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 5. Détection en temps réel (10s)        │
│    - Vidéo camera (gauche)              │
│    - Détections annotées (droite)       │
│    - Minuteur (haut droit)              │
│    - Objets détectés (bas)              │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 6. Cliquer "Confirm"                    │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 7. Système vérifie détection → Succès/Échec
└─────────────────────────────────────────┘
```

---

## 🚀 Cas d'usage

- ✅ Vérifier que l'outil emprunté est bien celui sélectionné
- ✅ Détection en temps réel avec annotation
- ✅ Confirmation utilisateur après observation
- ✅ Support multi-objets dans le cadre
- ✅ Gestion des faux positifs via confidence threshold

---

## 📝 Notes importantes

1. **Caméra requise**: L'utilisateur doit avoir une caméra (intégrée ou USB)
2. **Permissions**: Accordez les permissions de caméra au navigateur
3. **HTTPS en production**: Nécessaire pour accéder à la caméra en production
4. **Modèle best.pt**: Doit être entraîné avec les outils de votre projet
5. **Performance**: Dépend de la puissance CPU/GPU disponible

---

## 🔗 Ressources

- [Documentation YOLO](https://docs.ultralytics.com)
- [OpenCV](https://docs.opencv.org)
- [Ultralytics GitHub](https://github.com/ultralytics/ultralytics)

---

Questions ? Consultez **REALTIME_DETECTION_GUIDE.md** pour la documentation complète.
