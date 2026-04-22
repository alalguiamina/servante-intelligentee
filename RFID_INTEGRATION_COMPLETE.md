# 🎯 INTÉGRATION RFID COMPLÈTE

## ✅ État d'avancement par phase

### PHASE 1 — Préparation ✅
- [x] Cas d'usage défini: Badge pour connexion utilisateur
- [x] Interface web (React + Node.js backend)

### PHASE 2 — Matériel ✅
- [x] Lecteur RFID MFRC522 (13.56 MHz)
- [x] Arduino Mega configuré
- [x] Câblage SPI fonctionnel

### PHASE 3 — Programmation ✅
- [x] Code Arduino (`RFID_Servante_V2.ino`)
- [x] Lecture UID au format `UID:XXYYZZ`
- [x] Communication série USB

### PHASE 4 — Communication ✅
- [x] Pont série (`serial-bridge.js`)
- [x] Réception HTTP vers backend
- [x] Architecture client-serveur

### PHASE 5 — Gestion des accès ✅
- [x] Base de données Prisma avec table `User`
- [x] Vérification UID ↔ badgeId
- [x] Authentification JWT
- [x] Messages d'accès autorisé/refusé

### PHASE 6 — Sécurité ✅
- [x] Logging des tentatives dans `RFIDAttempt`
- [x] Anti-bruteforce (10 tentatives/minute)
- [x] Retour HTTP 429 si trop de tentatives
- [x] Stockage des tentatives avec timestamp

---

## 🔄 Flux complet

```
┌─────────────┐
│ Badge RFID  │
└──────┬──────┘
       │ Scan
       v
┌─────────────────────┐
│ Arduino MFRC522     │
│ Lit UID: 0A1B2C3D   │
└──────┬──────────────┘
       │ Serial USB
       v
┌─────────────────────────────────────┐
│ serial-bridge.js                    │
│ Reçoit: UID:0A1B2C3D                │
│ Envoie: POST /api/hardware/rfid    │
└──────┬──────────────────────────────┘
       │ HTTP
       v
┌──────────────────────────────────────────┐
│ Backend (hardwareRoutes.ts)              │
│ 1. Vérifie anti-bruteforce              │
│ 2. Cherche user.badgeId = "0A1B2C3D"    │
│ 3. Log tentative dans RFIDAttempt       │
│ 4. Si trouvé: génère JWT                │
│ 5. Sinon: accès refusé                  │
└──────┬───────────────────────────────────┘
       │
       v
┌──────────────────────────────────────────┐
│ Réponse JSON                             │
│ { success: true, authorized: true,       │
│   user: {...}, token: "jwt..." }         │
└──────────────────────────────────────────┘
```

---

## 📁 Fichiers modifiés

### 1. Arduino (`RFID_Servante_V2.ino`)
- Détection carte RFID
- Envoi format `UID:XXYYZZ`

### 2. Pont série (`serial-bridge.js`)
- Écoute port série
- POST vers `/api/hardware/rfid`

### 3. Backend (`servante-backend/src/routes/hardwareRoutes.ts`)
- Endpoint `POST /api/hardware/rfid`
- Vérification utilisateur
- Génération JWT
- Anti-bruteforce
- Logging tentatives

### 4. Base de données (`prisma/schema.prisma`)
- Nouveau modèle `RFIDAttempt`:
  - `uid`: Badge scanné
  - `ipAddress`: IP source
  - `success`: Tentative réussie?
  - `userId`: ID utilisateur (si trouvé)
  - `timestamp`: Horodatage

---

## 🚀 Comment tester

### Étape 1: Démarrer la base de données
```bash
docker-compose up -d postgres
```

### Étape 2: Démarrer le backend
```bash
cd servante-backend
npm run dev
```

### Étape 3: Démarrer le pont série
```bash
# Windows
set SERIAL_PORT=COM3
set BACKEND_URL=http://localhost:3000/api/hardware
node serial-bridge.js

# Linux/Mac
SERIAL_PORT=/dev/ttyUSB0 BACKEND_URL=http://localhost:3000/api/hardware node serial-bridge.js
```

### Étape 4: Scanner un badge
1. Approcher un badge du lecteur RFID
2. Observer les logs dans `serial-bridge.js`
3. Vérifier la réponse du backend

### Réponses attendues

#### ✅ Badge valide (dans la base)
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
  "token": "eyJhbGciOi..."
}
```

#### ❌ Badge inconnu
```json
{
  "success": false,
  "uid": "FFFFFFFF",
  "authorized": false,
  "message": "Badge non autorisé"
}
```

#### ⚠️ Trop de tentatives
```json
{
  "success": false,
  "message": "Trop de tentatives. Attendez 1 minute."
}
```

---

## 🔐 Sécurité implémentée

### 1. Anti-bruteforce
- Limite: **10 tentatives par minute** par IP
- Retour HTTP 429 (Too Many Requests)
- Compteur reset après 60 secondes

### 2. Logging
- Toutes les tentatives sont enregistrées
- Champs: UID, IP, succès, userId, timestamp
- Utile pour audit et forensics

### 3. Validation
- UID obligatoire
- Recherche case-insensitive
- Token JWT avec expiration

### 4. À ajouter (optionnel)
- [ ] Chiffrement HTTPS
- [ ] Rate limiting global
- [ ] Notification en temps réel (WebSocket)
- [ ] Alertes email sur tentatives suspectes
- [ ] Dashboard analytics RFID

---

## 📊 Requêtes SQL utiles

### Voir les tentatives récentes
```sql
SELECT * FROM "RFIDAttempt" 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Tentatives échouées par badge
```sql
SELECT uid, COUNT(*) as failed_attempts 
FROM "RFIDAttempt" 
WHERE success = false 
GROUP BY uid 
ORDER BY failed_attempts DESC;
```

### Tentatives par utilisateur
```sql
SELECT u."fullName", u."badgeId", COUNT(r.id) as total_scans
FROM "RFIDAttempt" r
JOIN "User" u ON r."userId" = u.id
WHERE r.success = true
GROUP BY u.id
ORDER BY total_scans DESC;
```

---

## 🎉 Mission accomplie !

Toutes les phases du plan RFID sont maintenant complétées:

✅ PHASE 1 — Préparation  
✅ PHASE 2 — Matériel  
✅ PHASE 3 — Programmation  
✅ PHASE 4 — Communication  
✅ PHASE 5 — Gestion des accès  
✅ PHASE 6 — Sécurité  

Le système est prêt pour la PHASE 7 — Tests & validation !

---

## 📚 Documentation référencée

- [RFID Basics (IBM)](https://www.ibm.com/topics/rfid)
- [MFRC522 Datasheet (NXP)](https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf)
- [Arduino SPI](https://docs.arduino.cc/learn/communication/spi)
- [RFID Library](https://github.com/miguelbalboa/rfid)
- [OWASP Auth](https://owasp.org/www-project-top-ten/)
- [RFID Security](https://www.sciencedirect.com/topics/engineering/rfid-security)
