# 🏷️ GUIDE : Enregistrement des Badges RFID

## 🎯 Problème à résoudre

Pour qu'un badge RFID puisse être utilisé pour se connecter, son **UID doit être enregistré dans la base de données** avec les informations de l'utilisateur.

## 🔄 Processus complet

```
┌─────────────────────────────────────────────────────┐
│  ÉTAPE 1: ENREGISTREMENT DU BADGE                   │
├─────────────────────────────────────────────────────┤
│  1. Admin scanne le nouveau badge                   │
│  2. Système capture l'UID (ex: 0A1B2C3D)           │
│  3. Admin entre: nom, email, rôle                   │
│  4. Système crée User avec badgeId = UID           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  ÉTAPE 2: UTILISATION DU BADGE                      │
├─────────────────────────────────────────────────────┤
│  1. Utilisateur scanne son badge                    │
│  2. Système lit UID et cherche dans User           │
│  3. Si trouvé → Génère JWT et connecte             │
│  4. Si non trouvé → Accès refusé                   │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Méthodes d'enregistrement

### Méthode 1: Script automatique (RECOMMANDÉ) ✅

**Avantages:**
- Scan en temps réel
- Pas d'erreur de saisie d'UID
- Validation immédiate

**Utilisation:**
```bash
# 1. Brancher l'Arduino avec le lecteur RFID
# 2. Démarrer le backend
cd servante-backend
npm run dev

# 3. Dans un autre terminal, lancer le script
cd ..
SERIAL_PORT=COM3 node register-badge.js

# 4. Suivre les instructions à l'écran:
#    - Scanner le badge
#    - Entrer nom, email, rôle
#    - Confirmer
```

**Exemple de session:**
```
═══════════════════════════════════════════════════════
🏷️  ENREGISTREMENT DE BADGE RFID
═══════════════════════════════════════════════════════
Port série: COM3
Backend: http://localhost:3000/api
═══════════════════════════════════════════════════════

✅ Port série ouvert

📝 Processus d'enregistrement d'un nouveau badge

Veuillez scanner le badge RFID maintenant...

🎯 Badge détecté: 0A1B2C3D

📋 Informations de l'utilisateur:

Nom complet: Ahmed Benali
Email: ahmed.benali@emines.um6p.ma

Rôle:
  1. STUDENT (Étudiant)
  2. PROFESSOR (Professeur)
  3. TECHNICIAN (Technicien)
  4. ADMIN (Administrateur)
Choisir (1-4): 1

────────────────────────────────────────────────────────
📋 RÉCAPITULATIF:
────────────────────────────────────────────────────────
Badge ID: 0A1B2C3D
Nom: Ahmed Benali
Email: ahmed.benali@emines.um6p.ma
Rôle: STUDENT
────────────────────────────────────────────────────────

Confirmer l'enregistrement? (o/n): o

⏳ Enregistrement en cours...

✅ Badge enregistré avec succès !
   ID utilisateur: uuid-123-456

🧪 Test d'authentification...
✅ Authentification réussie !
   Bienvenue Ahmed Benali

Enregistrer un autre badge? (o/n): 
```

---

### Méthode 2: Via API REST

**Pour interface admin ou import batch**

**Endpoint:** `POST /api/users`

**Request:**
```json
{
  "fullName": "Ahmed Benali",
  "email": "ahmed.benali@emines.um6p.ma",
  "badgeId": "0A1B2C3D",
  "role": "STUDENT"
}
```

**Avec curl:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmed Benali",
    "email": "ahmed.benali@emines.um6p.ma",
    "badgeId": "0A1B2C3D",
    "role": "STUDENT"
  }'
```

**⚠️ Important:** Vous devez connaître l'UID du badge à l'avance (scanner manuellement et noter).

---

### Méthode 3: Seed de la base de données

**Pour tests et développement**

**Fichier:** `servante-backend/prisma/seed.ts`

```typescript
// Remplacer les badgeId de test par les vrais UID RFID
const ahmed = await prisma.user.create({
  data: {
    fullName: 'Ahmed Benali',
    email: 'ahmed.benali@emines.um6p.ma',
    badgeId: '0A1B2C3D',  // ← Votre UID réel ici
    role: 'STUDENT'
  }
});
```

**Exécution:**
```bash
cd servante-backend
npx prisma db seed
```

---

## 📋 Étapes pratiques

### Configuration initiale (une fois)

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la base de données
cd servante-backend
npx prisma migrate dev
npx prisma generate

# 3. (Optionnel) Seed avec données de test
npx prisma db seed
```

### Enregistrer un nouveau badge

**Option A: Script automatique**
```bash
SERIAL_PORT=COM3 node register-badge.js
```

**Option B: Manuellement**
```bash
# 1. Scanner le badge avec serial-bridge pour voir l'UID
SERIAL_PORT=COM3 node serial-bridge.js

# Sortie: 🏷️ RFID reçu: 0A1B2C3D

# 2. Créer l'utilisateur via API
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"fullName": "...", "badgeId": "0A1B2C3D", ...}'
```

---

## 🔍 Vérifier les badges enregistrés

### Via SQL
```sql
SELECT 
  "badgeId",
  "fullName",
  "email",
  "role",
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

### Via Prisma Studio
```bash
cd servante-backend
npx prisma studio
```

Naviguer vers la table `User` et voir tous les badges.

### Via API
```bash
curl http://localhost:3000/api/users
```

---

## 🧪 Tester un badge

### Test 1: Via script de test
```bash
# Modifier test-rfid-flow.js ligne ~30
# Remplacer '0A1B2C3D' par votre UID réel
node test-rfid-flow.js
```

### Test 2: Via curl
```bash
curl -X POST http://localhost:3000/api/hardware/rfid \
  -H "Content-Type: application/json" \
  -d '{"uid": "0A1B2C3D"}'
```

**Réponse attendue (succès):**
```json
{
  "success": true,
  "authorized": true,
  "uid": "0A1B2C3D",
  "message": "Accès autorisé",
  "user": {
    "id": "uuid",
    "badgeId": "0A1B2C3D",
    "fullName": "Ahmed Benali",
    "email": "ahmed.benali@emines.um6p.ma",
    "role": "STUDENT"
  },
  "token": "eyJhbGciOiJI..."
}
```

### Test 3: Scan physique complet
```bash
# Terminal 1: Backend
cd servante-backend
npm run dev

# Terminal 2: Pont série
SERIAL_PORT=COM3 node serial-bridge.js

# Terminal 3: Observer les logs
# Scanner un badge physique et voir:
# ✅ Badge autorisé: 0A1B2C3D → Ahmed Benali
```

---

## ❓ FAQ

### Q: Où trouver l'UID de mon badge?
**R:** Scannez-le avec le script `serial-bridge.js` ou téléversez le code Arduino et ouvrez le Serial Monitor.

### Q: Le format de l'UID est-il important?
**R:** Oui, le système convertit en UPPERCASE. `0a1b2c3d` devient `0A1B2C3D`.

### Q: Peut-on changer le badge d'un utilisateur?
**R:** Oui, via `PUT /api/users/:id` avec le nouveau `badgeId`.

### Q: Un badge peut-il être partagé?
**R:** Non, chaque `badgeId` doit être unique (contrainte DB).

### Q: Comment supprimer un badge?
**R:** Supprimez l'utilisateur ou mettez `badgeId` à une valeur unique temporaire.

---

## 🔐 Sécurité

### ✅ Bonnes pratiques
- [ ] Enregistrer les badges dans un environnement sécurisé
- [ ] Limiter l'accès au script register-badge.js (admin uniquement)
- [ ] Logger tous les enregistrements de badges
- [ ] Valider l'email (format et domaine @emines.um6p.ma)
- [ ] Désactiver les badges des utilisateurs inactifs

### ⚠️ À éviter
- ❌ Stocker les UID en clair dans le code source
- ❌ Partager les badges entre utilisateurs
- ❌ Permettre l'auto-enregistrement sans validation
- ❌ Négliger les logs d'enregistrement

---

## 📊 Workflow production

```
1. Nouvel utilisateur (étudiant/prof/technicien)
   ↓
2. Admin remplit formulaire papier/digital
   ↓
3. Admin scanne le nouveau badge
   ↓
4. Script register-badge.js enregistre automatiquement
   ↓
5. Test immédiat d'authentification
   ↓
6. Badge remis à l'utilisateur
   ↓
7. Utilisateur peut maintenant accéder à la servante
```

---

## 🎯 Résumé rapide

| Méthode | Facilité | Usage |
|---------|----------|-------|
| `register-badge.js` | ⭐⭐⭐⭐⭐ | Production |
| API REST | ⭐⭐⭐ | Admin/Batch |
| Seed Prisma | ⭐⭐⭐⭐ | Développement |
| SQL Direct | ⭐⭐ | Debug uniquement |

**Recommandation:** Utilisez `register-badge.js` pour tous les enregistrements en production.

---

## 📁 Fichiers créés

- `register-badge.js` - Script d'enregistrement interactif
- `BADGE_REGISTRATION_GUIDE.md` - Ce guide

## 🔗 Voir aussi

- `RFID_INTEGRATION_COMPLETE.md` - Intégration complète RFID
- `test-rfid-flow.js` - Tests automatisés
- `servante-backend/prisma/seed.ts` - Données de test
