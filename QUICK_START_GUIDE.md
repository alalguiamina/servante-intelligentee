# 🚀 Guide de déploiement rapide - Validation Produit IA

## En 5 minutes

### 1️⃣ Placer le modèle
```bash
cp best2.pt servante-backend/best2.pt
```

### 2️⃣ Installer (Linux/Mac)
```bash
bash install-ai-validation.sh
```

### 3️⃣ Installer (Windows)
```bash
install-ai-validation.bat
```

### 4️⃣ Démarrer l'application
```bash
# Terminal 1
cd servante-backend && npm run dev

# Terminal 2
cd servante-frontend && npm run dev
```

### 5️⃣ Tester
Ouvrir http://localhost:5173 et suivre le flux:
- Scanner badge
- Sélectionner produit
- Confirmer
- Prendre produit (tiroir s'ouvre/ferme)
- Capturer photo pour validation ✅

---

## ✅ Checklist pré-déploiement

- [ ] Fichier `best2.pt` présent
- [ ] Python 3.8+ installé
- [ ] Dépendances Python installées: `pip install -r requirements.txt` OU `pip install torch torchvision ultralytics opencv-python pillow`
- [ ] Migrations Prisma appliquées: `npx prisma db push`
- [ ] Variables d'environnement configurées dans `.env`
- [ ] Caméra accessible depuis le navigateur
- [ ] Backend et frontend démarrés

---

## 🔧 Configuration (Fichiers clés)

### Backend - `.env`
```env
AI_MODEL_PATH=./best2.pt
DATABASE_URL=...
PORT=5001
```

### Frontend - Variables d'environnement
```env
VITE_API_URL=http://localhost:5001
```

---

## 🧪 Commandes de test

```bash
# Test Python
python servante-backend/scripts/ai_validation.py \
  --model servante-backend/best2.pt \
  --image test.jpg \
  --expected-product tournevis_plat

# Test API
curl -X POST http://localhost:5001/api/borrows/{borrowId}/validate-product \
  -F "image=@test.jpg"

# Vérifier BD
cd servante-backend && npx prisma studio
```

---

## 📊 Statuts de l'emprunt après validation

| Statut | Meaning |
|--------|---------|
| ACTIVE | ⏳ En attente de validation |
| VALIDATED | ✅ Produit confirmé |
| REJECTED | ❌ Produit invalide (annulé) |
| RETURNED | 📦 Retourné à temps |
| OVERDUE | ⏰ En retard |

---

## 📝 Logs à vérifier

### Backend console
```
🔍 Validating product for borrow abc123: Tournevis Plat Grand
✅ Validation result: { success: true, is_valid: true, confidence: 0.95 }
```

### Frontend console (DevTools F12)
```
POST /api/borrows/abc123/validate-product 200 OK
ProductValidation component mounted
```

---

## ❌ Problèmes courants

### "Python not found"
```bash
# Installer Python
# Windows: https://www.python.org/downloads/
# Mac: brew install python3
# Linux: sudo apt install python3
```

### "Model file not found"
```bash
# Vérifier le chemin
ls -la servante-backend/best2.pt
# Ou définir dans .env
echo "AI_MODEL_PATH=/chemin/complet/best2.pt" >> servante-backend/.env
```

### "Camera not working"
```bash
# Utiliser HTTPS ou localhost
# Permettre l'accès caméra dans les paramètres du navigateur
# Test: Ouvrir https://localhost:5173 
```

### "Database migration failed"
```bash
cd servante-backend
npx prisma db push --force-reset  # ⚠️ Attention: réinitialise la BD
# Ou restaurer depuis backup
```

---

## 🎯 Points d'intégration clés

### 1. Routes modifiées
- **POST** `/api/borrows/:id/validate-product` → Nouvelle validation

### 2. Contrôleurs modifiés
- `borrowsController.ts` → Nouvelle fonction `validateBorrowProduct()`

### 3. Schéma BD modifié
- Enum `BorrowStatus` → Ajout VALIDATED, REJECTED
- Table `ProductValidation` → Nouvelle table pour audit
- Table `Borrow` → Relation avec ProductValidation

### 4. Composants frontend
- `ProductValidation.tsx` → Nouveau composant
- `App.tsx` → Nouvel écran 'product-validation'

---

## 📚 Documentation complète

👉 **`AI_VALIDATION_INTEGRATION.md`** - Guide détaillé (50+ pages)
👉 **`MODIFICATION_SUMMARY.md`** - Résumé des changements

---

## ✨ Prochaines étapes (optionnel)

- [ ] Ajouter notifications push pour erreurs
- [ ] Créer dashboard d'analytics des validations
- [ ] Support multi-modèles par catégorie
- [ ] Intégration serveur ML distant
- [ ] Cache des résultats pour performance

---

## 🆘 Support

Si vous rencontrez des problèmes:

1. Vérifier les logs du backend: `npm run dev` (volet Terminal)
2. Vérifier les logs du frontend: DevTools (F12)
3. Tester manuellement l'API: `curl` ou Postman
4. Consulter la documentation complète: `AI_VALIDATION_INTEGRATION.md`

---

**Status: ✅ Prêt pour production**
