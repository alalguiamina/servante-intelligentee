# 🔧 GUIDE COMPLET: Système d'Automatisation des Tiroirs

## Vue d'ensemble

Quand un utilisateur emprunte un outil via l'interface web, le système:
1. Crée un enregistrement d'emprunt dans la BD
2. Envoie automatiquement une commande d'ouverture du tiroir au serveur
3. Le serial-bridge récupère la commande et l'envoie à l'Arduino
4. L'Arduino ouvre le tiroir via le moteur
5. Quand le tiroir est ouvert, l'Arduino confirme (ACK) au backend

## Architecture du Flux

```
Frontend (React)
    ↓ POST /api/borrows
Backend (Node.js/Express)
    ↓ POST /api/hardware/commands
    ↓ (créer commande OPEN)
Serial Bridge (Node.js)
    ↓ Récupère les commandes en attente
    ↓ Envoie via port série
Arduino
    ↓ Tourne le moteur
    ↓ Envoie ACK quand terminé
Serial Bridge
    ↓ Récupère l'ACK
    ↓ PUT /api/hardware/commands/:id/ack
Backend
    ↓ Marque comme DONE
```

## 📋 Étapes de Configuration

### 1️⃣ **Connecter Arduino à votre PC**

```bash
# Identifier le COM port
# Windows: Device Manager → Ports (COM & LPT)
# Exemple: COM3, COM4

# Télécharger le code Arduino
# Fichier: Moteurs_Servante_V2.ino
# Ouvrir avec: Arduino IDE
# Sélectionner Board: Arduino Mega (ou votre modèle)
# Sélectionner Port: COM3 (votre port)
# Cliquer: Upload
```

### 2️⃣ **Démarrer le Serial Bridge**

```bash
# Terminal 1: Serial Bridge
cd "c:\Users\PC\Downloads\Servente intelligente"
SERIAL_PORT=COM3 BACKEND_URL=http://localhost:3001/api/hardware node serial-bridge.js

# Notes:
# - Remplacer COM3 par votre port réel
# - BACKEND_URL doit pointer vers votre backend (port 3001)
# - Le script va afficher: "Démarrage du polling..."
```

### 3️⃣ **Démarrer le Backend**

```bash
# Terminal 2: Backend
cd "c:\Users\PC\Downloads\Servente intelligente\servante-backend"
$env:PORT=3001
npm run dev

# Affichera: "🚀 Serveur démarré sur le port 3001"
```

### 4️⃣ **Démarrer le Frontend**

```bash
# Terminal 3: Frontend
cd "c:\Users\PC\Downloads\Servente intelligente\servante frontend"
npm run dev

# Affichera: "VITE ... ready in ... ms"
```

### 5️⃣ **Tester le Flux Complet**

```
1. Ouvrir http://localhost:5173 dans le navigateur
2. Se connecter avec:
   - Email: ahmed.benali@emines.um6p.ma
   - Password: ahmed123

3. Cliquer sur un outil pour l'emprunter

4. Vérifier les logs:
   Terminal 1 (Serial Bridge): Doit afficher commande envoyée à Arduino
   Terminal 2 (Backend): Doit afficher ouverture du tiroir
   Arduino Serial Monitor: Doit afficher mouvement du moteur
```

## 🎯 Commandes Arduino Directes (pour tests)

Si vous voulez tester le moteur sans la web app, utilisez Arduino Serial Monitor:

```
ox  → Ouvre Motor X
oy  → Ouvre Motor Y
oz  → Ouvre Motor Z
oa  → Ouvre Motor A

fx  → Ferme Motor X (f = fermer)
fy  → Ferme Motor Y
fz  → Ferme Motor Z
fa  → Ferme Motor A

s   → Stop d'urgence
```

## 📡 Endpoints API

### Créer une commande moteur
```bash
POST /api/hardware/commands
Content-Type: application/json

{
  "type": "OPEN",
  "drawer": "x"
}

Réponse:
{
  "success": true,
  "id": "cmd-1736345678901",
  "message": "Commande OPEN x créée"
}
```

### Récupérer les commandes en attente
```bash
GET /api/hardware/commands?pending=true

Réponse:
{
  "success": true,
  "commands": [
    {
      "id": "cmd-1736345678901",
      "type": "OPEN",
      "drawer": "x",
      "status": "PENDING",
      "createdAt": "2026-01-08T15:30:00Z"
    }
  ]
}
```

### Enregistrer un ACK (confirmation Arduino)
```bash
PUT /api/hardware/commands/cmd-1736345678901/ack
Content-Type: application/json

{
  "result": "OPENED",
  "message": "Tiroir x ouvert avec succès"
}

Réponse:
{
  "success": true,
  "message": "ACK enregistré"
}
```

## 🔌 Configuration du Serial Bridge

Fichier: `serial-bridge.js`

```javascript
// Modifier ces variables selon votre setup:
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001/api/hardware';
const POLL_INTERVAL_MS = 2000;  // Récupérer les commandes toutes les 2 secondes
const BAUD_RATE = 9600;  // Doit correspondre à Serial.begin(9600) dans Arduino
```

## 🛠 Dépannage

### Serial Bridge ne se connecte pas
```
❌ Erreur: ENOENT: no such file or directory, open 'COM3'

Solution:
1. Vérifier que l'Arduino est branché
2. Ouvrir Device Manager
3. Chercher le port réel (COM3, COM4, COM5, etc.)
4. Relancer: SERIAL_PORT=COM5 node serial-bridge.js
```

### Backend ne reçoit pas les commandes
```
❌ Erreur polling backend: ECONNREFUSED

Solution:
1. Vérifier que le backend tourne sur le port 3001
2. Vérifier BACKEND_URL dans serial-bridge.js
3. Si vous avez changé le port: BACKEND_URL=http://localhost:3002/api/hardware
```

### Moteur ne tourne pas quand on emprunte
```
Solutions à vérifier:
1. Serial bridge tourne-t-il? (Terminal 1)
2. Backend reçoit-il la commande? (Vérifier les logs Backend)
3. Arduino a-t-il confirmé? (Vérifier Arduino Serial Monitor)
4. Les pins sont-elles correctes? (Vérifier Moteurs_Servante_V2.ino #define)
```

## 📊 Logs à surveiller

**Serial Bridge - Bon:**
```
✅ Port série ouvert avec succès
📤 Bridge → Arduino: "ox"
✅ Commande envoyée et marquée SENT au backend
```

**Serial Bridge - Mauvais:**
```
❌ Port série pas encore connecté
❌ Erreur polling backend
```

**Backend - Bon:**
```
🤖 Ouverture du tiroir x pour l'outil: Tournevis Plat
```

**Arduino - Bon:**
```
✅ Moteur x : Mouvement terminé
🛑 Moteur x : Fermeture atteinte
```

## 🎓 Prochaines Étapes

1. **Feedback visuel au frontend**: Afficher l'état du tiroir (ouvert/fermé)
2. **Historique des commandes**: Enregistrer dans la BD au lieu de mémoire
3. **Gestion des erreurs**: Si le moteur échoue, notifier l'utilisateur
4. **Configuration Web**: Interface pour changer les pins Arduino sans recompiler
5. **Dashboard temps réel**: WebSocket pour voir l'état des moteurs en direct

---

**Besoin d'aide?** Vérifier les logs de chaque composant pour identifier où ça bloque! 🎯
