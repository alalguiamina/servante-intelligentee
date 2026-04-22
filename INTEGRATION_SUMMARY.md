# 📚 RÉSUMÉ — ÉTAPES 1 À 4 COMPLÉTÉES

## Ce que vous avez maintenant

### ✅ Étape 1 — Routes Backend
Fichier: `servante-backend/src/routes/hardwareRoutes.ts`

Endpoints créés:
- `POST /api/hardware/commands` — créer une commande (OPEN/CLOSE)
- `GET /api/hardware/commands?pending=true` — récupérer commandes en attente
- `PUT /api/hardware/commands/:id/ack` — envoyer ACK quand terminé
- `POST /api/hardware/rfid` — recevoir UIDs RFID

Routes intégrées dans `server.ts` ✅

---

### ✅ Étape 2 — Script Pont Série
Fichier: `serial-bridge.js` (racine du projet)

Rôle:
- Écoute le port série (Arduino)
- Poll les commandes du backend toutes les 2 sec
- Envoie les commandes à Arduino via Serial
- Reçoit les ACK d'Arduino et les poste au backend
- Reçoit les UIDs RFID et les poste au backend

Dépendances: `serialport`, `axios` (installez avec `npm install`)

---

### ✅ Étape 3 — Code Arduino Moteurs Modifié
Fichier: `Moteurs_Servante_V2.ino`

Changements clés:
- Accepte format: `OPEN:x:cmd-123` et `CLOSE:x:cmd-123`
- Envoie ACK au format: `ACK:cmd-123:OPENED` ou `ACK:cmd-123:CLOSED`
- Stocke `currentCommandId` pour l'inclure dans l'ACK
- Reste rétro-compatible (accepte encore `ox`, `fy`, `s`)

À faire: Uploader ce code sur votre Arduino

---

### ✅ Étape 4 — Code RFID Modifié
Fichier: `RFID_Servante_V2.ino`

Changements clés:
- Envoie format compact: `UID:0A1B2C3D` (au lieu de log séparé)
- Bridge peut parser facilement cet UID
- Reste simplement un lecteur de badge

À faire: Uploader ce code sur votre Arduino (ou même chipset)

---

## 🎯 Flux complet

```
1. User crée commande via API ou Frontend:
   POST /api/hardware/commands → { type: "OPEN", drawer: "x" }

2. Backend crée et stocke la commande:
   { id: "cmd-123", status: "PENDING", ... }

3. Bridge poll les commandes toutes les 2 sec:
   GET /api/hardware/commands?pending=true
   → Récoit [ cmd-123 ]

4. Bridge envoie à Arduino via Serial:
   "OPEN:x:cmd-123\n"

5. Arduino reçoit et exécute:
   - Ouvre tiroir X
   - Envoie: "ACK:cmd-123:OPENED\n"

6. Bridge reçoit ACK:
   Envoie au backend: PUT /api/hardware/commands/cmd-123/ack
   { result: "OPENED" }

7. Backend met à jour:
   cmd-123.status = "DONE"
   cmd-123.ack = { result: "OPENED", at: now }

8. (Futur) Frontend notifié via WebSocket:
   "Tiroir ouvert!"
```

---

## ⚡ PROCHAINES ACTIONS

### IMMÉDIATEMENT (< 30 min)
```
1. Installer dépendances:
   cd servante-backend && npm install
   cd .. && npm install serialport axios

2. Upload code Arduino:
   - Moteurs_Servante_V2.ino → Arduino principal
   - RFID_Servante_V2.ino → Arduino RFID (ou même Arduino si 2 serial)

3. Tester:
   Terminal 1: npm run dev (backend)
   Terminal 2: SERIAL_PORT=COM3 node serial-bridge.js
   Terminal 3: curl -X POST http://localhost:3000/api/hardware/commands ...
   
   Voir TEST_INTEGRATION.md pour instructions complètes
```

### COURT TERME (1-2 jours)
```
✅ Tester tous les tiroirs (x, y, z, a) — OUVRIR et FERMER
✅ Tester la lecture RFID
✅ Voir les ACKs dans les logs
✅ Documenter tout pour l'équipe Arduino
```

### MOYEN TERME (3-5 jours)
```
⬜ Ajouter WebSocket pour notifications temps réel
⬜ Ajouter webhook AI pour caméra
⬜ Intégrer state machine (PENDING → OPENED → CAMERA_CHECK → BORROWED)
⬜ Mettre à jour base de données (HardwareEvent, Borrow.state)
```

---

## 📋 POINTS À RETENIR

1. **Format des commandes:** `TYPE:DRAWER:CMDID` (MAJUSCULES)
   - Exemple: `OPEN:x:cmd-123`, `CLOSE:a:cmd-456`

2. **Format des ACKs:** `ACK:CMDID:RESULT` ou `ACK:CMDID:RESULT:ERROR_MSG`
   - Résultat: `OPENED`, `CLOSED`, `FAILED`

3. **Format RFID:** `UID:XXYYZZ...` (hex compact)
   - Exemple: `UID:0A1B2C3D`

4. **Bridge polls tous les 2 secondes** — pas de push depuis Arduino

5. **Commandes en mémoire** pour tests — remplacer par BD Prisma en prod

---

## 🔗 FICHIERS CLÉS

```
servante-backend/
├── src/
│   ├── routes/hardwareRoutes.ts ← NOUVEAU
│   └── server.ts (modifié: ajout import + route)
│
serial-bridge.js ← NOUVEAU (racine)
Moteurs_Servante_V2.ino ← NOUVEAU
RFID_Servante_V2.ino ← NOUVEAU
TEST_INTEGRATION.md ← Documentation de test
```

---

## ❓ QUESTIONS FRÉQUENTES

**Q: Le bridge ne démarre pas?**
A: Vérifiez `npm install serialport axios` et le port série correct (COM3, COM4, etc.)

**Q: Arduino ne répond pas?**
A: Upload le code V2, vérifiez le format `OPEN:x:cmd-123` (MAJUSCULES)

**Q: Les commandes ne s'envoient pas?**
A: Backend en cours d'exécution ? Port 3000 libre ? Bridge lancé ?

**Q: RFID ne fonctionne pas?**
A: Vérifiez les pins (SS=53, RST=9) et la lib MFRC522

---

## 🎁 BONUS — Script pour tester sans Arduino

Si vous voulez simuler Arduino sans matériel:

```bash
# Simuler Arduino qui récupère et ACK une commande
curl -X PUT http://localhost:3000/api/hardware/commands/cmd-123/ack \
  -H "Content-Type: application/json" \
  -d '{"result":"OPENED","message":"simulated"}'

# Simuler RFID
curl -X POST http://localhost:3000/api/hardware/rfid \
  -H "Content-Type: application/json" \
  -d '{"uid":"0A1B2C3D"}'
```

---

## ✨ SUMMARY

Vous avez maintenant une **intégration Arduino ↔ Backend complète** qui:
- ✅ Crée des commandes
- ✅ Les envoie à Arduino via un pont série
- ✅ Reçoit les ACKs
- ✅ Reçoit les UIDs RFID

**Prochaine étape:** Tester avec votre matériel (voir TEST_INTEGRATION.md)
