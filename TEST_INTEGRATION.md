## 🔌 GUIDE DE TEST — Intégration Arduino + Backend

### AVANT DE COMMENCER
- ✅ Arduino branché au port série (COM3 sur Windows, /dev/ttyUSB0 sur Linux/macOS)
- ✅ Code Arduino (`Moteurs_Servante_V2.ino` et `RFID_Servante_V2.ino`) uploadé
- ✅ Backend Node.js démarré sur `http://localhost:3000`
- ✅ Dépendances installées: `npm install serialport axios`

---

### 🚀 ÉTAPE 1: Démarrer le backend

```bash
cd "c:\Users\PC\Downloads\Servente intelligente\servante-backend"
npm run dev
```

Vous devez voir:
```
✅ Connexion à PostgreSQL réussie
🚀 Serveur démarré sur le port 3000
🔗 Health check: http://localhost:3000/health
```

---

### 🔌 ÉTAPE 2: Démarrer le script pont série

Ouvrez un **nouveau terminal** et exécutez:

```bash
cd "c:\Users\PC\Downloads\Servente intelligente"
SERIAL_PORT=COM3 node serial-bridge.js
```

Ou sur Linux/macOS:
```bash
SERIAL_PORT=/dev/ttyUSB0 node serial-bridge.js
```

Vous devez voir:
```
✅ Port série ouvert avec succès
⏰ Démarrage du polling des commandes toutes les 2000ms...
```

---

### 📤 ÉTAPE 3: Tester une commande (ouvrir un tiroir)

Ouvrez un **troisième terminal** et exécutez:

```bash
curl -X POST http://localhost:3000/api/hardware/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"OPEN","drawer":"x"}'
```

Résultat attendu:
```json
{
  "success": true,
  "id": "cmd-1703000000000",
  "message": "Commande OPEN x créée"
}
```

---

### 🎯 ÉTAPE 4: Observer le flux

Regardez les trois terminaux:

**Terminal 1 (Backend):**
```
POST /api/hardware/commands
✅ Commande créée: cmd-1703000000000 (OPEN x)
```

**Terminal 2 (Bridge):**
```
⏳ Aucune commande en attente...
(attend...)
📋 Récupération commandes (pending=true): 1 trouvées

📤 Bridge → Arduino: "OPEN:x:cmd-1703000000000"
   ✅ Commande envoyée et marquée SENT au backend
```

**Serial Monitor Arduino:**
```
LOG:Opening drawer x
(le moteur tourne...)
ACK:cmd-1703000000000:OPENED
```

**Terminal 2 (Bridge) — moment d'après:**
```
📨 Arduino → Bridge: "ACK:cmd-1703000000000:OPENED"
   → ACK pour commande cmd-1703000000000: OPENED
   ✅ Backend a enregistré l'ACK
```

**Terminal 1 (Backend) — moment d'après:**
```
PUT /api/hardware/commands/cmd-1703000000000/ack
✅ ACK reçu: cmd-1703000000000 → OPENED
```

---

### 📋 ÉTAPE 5: Tester les autres commandes

#### Fermer le tiroir:
```bash
curl -X POST http://localhost:3000/api/hardware/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"CLOSE","drawer":"x"}'
```

#### Ouvrir d'autres tiroirs:
```bash
# Tiroir Y
curl -X POST http://localhost:3000/api/hardware/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"OPEN","drawer":"y"}'

# Tiroir Z
curl -X POST http://localhost:3000/api/hardware/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"OPEN","drawer":"z"}'

# Tiroir A
curl -X POST http://localhost:3000/api/hardware/commands \
  -H "Content-Type: application/json" \
  -d '{"type":"OPEN","drawer":"a"}'
```

---

### 🏷️  ÉTAPE 6: Tester la lecture RFID

1. Assurez-vous que le lecteur RFID est connecté
2. Approchez un badge/carte du lecteur
3. Vérifiez le Terminal 2 (Bridge):
```
📨 Arduino → Bridge: "UID:0A1B2C3D"
   → UID RFID détecté: 0A1B2C3D
   ✅ Backend a enregistré l'UID RFID
```

---

### ✅ ÉTAPE 7: Récupérer l'état des commandes

```bash
curl http://localhost:3000/api/hardware/commands
```

Vous verrez toutes les commandes (PENDING, DONE, FAILED):
```json
{
  "success": true,
  "count": 3,
  "commands": [
    {
      "id": "cmd-1703000000000",
      "type": "OPEN",
      "drawer": "x",
      "status": "DONE",
      "createdAt": "2025-12-18T10:30:00.000Z",
      "ack": {
        "result": "OPENED",
        "message": "",
        "at": "2025-12-18T10:30:05.000Z"
      }
    }
  ]
}
```

---

### 🐛 TROUBLESHOOTING

#### ❌ "Impossible d'ouvrir le port COM3"
- Vérifiez que l'Arduino est bien branché
- Vérifiez le port dans le Device Manager (Windows)
- Essayez: `SERIAL_PORT=COM4 node serial-bridge.js` (peut être un autre port)

#### ❌ "Backend timeout ou connexion refusée"
- Vérifiez que le backend est bien démarré: `curl http://localhost:3000/health`
- Vérifiez que le port 3000 n'est pas utilisé par une autre application

#### ❌ "Arduino ne reçoit pas les commandes"
- Vérifiez le code Arduino (V2) avec `OPEN:x:cmd-123` supporté
- Testez avec Arduino Serial Monitor (envoyer `OPEN:x:test` manuellement)
- Vérifiez la vitesse 9600 baud

#### ❌ "RFID ne fonctionne pas"
- Vérifiez les pins SPI (SS=53, RST=9)
- Vérifiez le lecteur MFRC522 avec un exemple simple RFID de la lib

---

### 📊 MÉTRIQUES DE SUCCÈS

Si vous voyez tous ces logs, tout fonctionne ✅:

```
✅ Port série ouvert
✅ Commande créée
✅ Commande envoyée au port série
✅ Arduino reçoit la commande
✅ Arduino envoie ACK
✅ Bridge reçoit ACK
✅ Backend enregistre l'ACK
✅ Commande status passe à DONE
```

---

### 🎯 PROCHAINES ÉTAPES

1. **Ajouter WebSocket** pour notifier le frontend en temps réel
2. **Ajouter la caméra AI** — créer webhook `/api/webhooks/camera-detection`
3. **Intégrer avec le borrow flow** — quand user crée un borrow, automatiquement envoyer commande OPEN
4. **Bases de données** — remplacer in-memory commands par table Prisma

---

### 📚 FICHIERS IMPORTANTS

- **Backend routes:** `servante-backend/src/routes/hardwareRoutes.ts`
- **Arduino V2:** `Moteurs_Servante_V2.ino`
- **RFID V2:** `RFID_Servante_V2.ino`
- **Bridge:** `serial-bridge.js` (racine du projet)

Besoin d'aide ? Relancez les 3 terminaux et observez les logs 🎯
