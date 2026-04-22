# 🏷️ Branche MINA - Intégration RFID Complète

Cette branche contient l'implémentation complète du système d'authentification RFID pour la Servante Intelligente.

## 📋 Résumé des changements

### 1. Backend - Authentification RFID
**Fichier:** `servante-backend/src/routes/hardwareRoutes.ts`

✅ **Nouveau endpoint:** `POST /api/hardware/rfid`
- Reçoit l'UID du badge depuis le pont série
- Vérifie l'existence de l'utilisateur dans la base
- Génère un token JWT si autorisé
- Retourne accès autorisé/refusé

✅ **Fonctionnalités:**
- Authentification automatique par badge
- Génération JWT pour session utilisateur
- Retour structuré (success, authorized, user, token)

### 2. Base de données - Logging & Sécurité
**Fichier:** `servante-backend/prisma/schema.prisma`

✅ **Nouveau modèle:** `RFIDAttempt`
```prisma
model RFIDAttempt {
  id          String   @id @default(uuid())
  uid         String
  ipAddress   String
  success     Boolean
  userId      String?
  timestamp   DateTime @default(now())
  
  @@index([uid, timestamp])
  @@index([ipAddress, timestamp])
}
```

✅ **Fonctionnalités:**
- Enregistrement de toutes les tentatives RFID
- Traçabilité complète (qui, quand, succès/échec)
- Indexes pour requêtes rapides
- Support audit et forensics

### 3. Sécurité - Anti-bruteforce
**Implémenté dans:** `hardwareRoutes.ts`

✅ **Protection:**
- Limite: 10 tentatives par minute par IP
- Retour HTTP 429 (Too Many Requests)
- Compteur automatique reset après 60 secondes
- Logging même des tentatives bloquées

### 4. Documentation & Tests
**Nouveaux fichiers:**
- `RFID_INTEGRATION_COMPLETE.md` - Guide complet d'intégration
- `test-rfid-flow.js` - Suite de tests automatisés

---

## 🚀 Démarrage rapide

### Prérequis
```bash
# 1. Base de données PostgreSQL (via Docker)
docker-compose up -d postgres

# 2. Variables d'environnement
# Fichier: servante-backend/.env
DATABASE_URL="postgresql://user:password@localhost:5433/servante_db"
JWT_SECRET="votre_secret_jwt"
```

### Installation
```bash
# Backend
cd servante-backend
npm install
npx prisma generate
npm run dev
```

### Test du système
```bash
# Dans le répertoire racine
node test-rfid-flow.js
```

---

## 📡 Endpoints API

### POST /api/hardware/rfid
Authentification par badge RFID

**Request:**
```json
{
  "uid": "0A1B2C3D"
}
```

**Response (succès):**
```json
{
  "success": true,
  "authorized": true,
  "uid": "0A1B2C3D",
  "message": "Accès autorisé",
  "user": {
    "id": "uuid",
    "badgeId": "0A1B2C3D",
    "fullName": "Jean Dupont",
    "email": "jean@emines.um6p.ma",
    "role": "STUDENT"
  },
  "token": "eyJhbGc..."
}
```

**Response (échec):**
```json
{
  "success": false,
  "uid": "FFFFFFFF",
  "authorized": false,
  "message": "Badge non autorisé"
}
```

**Response (bruteforce):**
```json
{
  "success": false,
  "message": "Trop de tentatives. Attendez 1 minute."
}
```

---

## 🔄 Flux d'authentification

```
Badge RFID scanné
    ↓
Arduino lit UID
    ↓
serial-bridge.js reçoit UID
    ↓
POST /api/hardware/rfid
    ↓
Backend vérifie:
  1. Anti-bruteforce (< 10/min)
  2. User existe? (badgeId = UID)
  3. Log tentative
    ↓
Si valide: JWT généré
    ↓
Frontend reçoit token
    ↓
Utilisateur connecté
```

---

## 🧪 Tests disponibles

Exécutez: `node test-rfid-flow.js`

**Tests inclus:**
1. ✅ Badge valide → vérifie JWT généré
2. ✅ Badge invalide → vérifie refus
3. ✅ UID manquant → vérifie validation
4. ✅ Structure réponse → vérifie format JSON
5. ✅ Anti-bruteforce → vérifie limite 10/min

---

## 📊 Requêtes SQL utiles

### Voir les 20 dernières tentatives
```sql
SELECT 
  r.uid,
  r.success,
  u."fullName",
  r."ipAddress",
  r.timestamp
FROM "RFIDAttempt" r
LEFT JOIN "User" u ON r."userId" = u.id
ORDER BY r.timestamp DESC
LIMIT 20;
```

### Badges les plus utilisés
```sql
SELECT 
  r.uid,
  u."fullName",
  COUNT(*) as scans,
  SUM(CASE WHEN r.success THEN 1 ELSE 0 END) as success_count
FROM "RFIDAttempt" r
LEFT JOIN "User" u ON r."userId" = u.id
GROUP BY r.uid, u."fullName"
ORDER BY scans DESC
LIMIT 10;
```

### Tentatives échouées par IP
```sql
SELECT 
  "ipAddress",
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt
FROM "RFIDAttempt"
WHERE success = false
GROUP BY "ipAddress"
ORDER BY failed_attempts DESC;
```

---

## 🔐 Sécurité implémentée

### ✅ Déjà fait
- [x] Anti-bruteforce (10 tentatives/min)
- [x] Logging de toutes les tentatives
- [x] Validation des entrées
- [x] JWT avec expiration
- [x] Indexes DB pour performance

### 📝 À ajouter (optionnel)
- [ ] HTTPS obligatoire en production
- [ ] Chiffrement UID en base
- [ ] Notification temps réel (WebSocket)
- [ ] Dashboard analytics RFID
- [ ] Alertes email tentatives suspectes
- [ ] Blacklist automatique badges

---

## 📁 Structure des fichiers modifiés

```
servante-intelligente/
├── RFID_INTEGRATION_COMPLETE.md    ← Documentation complète
├── test-rfid-flow.js                ← Tests automatisés
│
├── RFID_Servante_V2.ino             ← Arduino (déjà existant)
├── serial-bridge.js                 ← Pont série (déjà existant)
│
└── servante-backend/
    ├── prisma/
    │   └── schema.prisma            ← + RFIDAttempt model
    │
    └── src/
        └── routes/
            └── hardwareRoutes.ts    ← + RFID auth + anti-bruteforce
```

---

## 🎯 Checklist avant merge

- [ ] Tests passés (`node test-rfid-flow.js`)
- [ ] Migration Prisma appliquée
- [ ] Variables d'environnement configurées
- [ ] Arduino + serial-bridge testés
- [ ] Documentation relue
- [ ] Backend démarre sans erreur

---

## 📚 Documentation référencée

- [RFID Basics (IBM)](https://www.ibm.com/topics/rfid)
- [MFRC522 Datasheet](https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf)
- [Arduino MFRC522 Library](https://github.com/miguelbalboa/rfid)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens)
- [OWASP Authentication](https://owasp.org/www-project-top-ten/)

---

## 🤝 Contact & Support

Pour toute question sur cette implémentation:
1. Consulter `RFID_INTEGRATION_COMPLETE.md`
2. Lancer les tests: `node test-rfid-flow.js`
3. Vérifier les logs backend et serial-bridge

---

**Auteur:** Amina  
**Branche:** mina  
**Date:** Février 2026  
**Status:** ✅ Prêt pour test & validation
