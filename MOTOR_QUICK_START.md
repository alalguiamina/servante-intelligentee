# ✅ SYSTÈME D'AUTOMATISATION DES TIROIRS - RÉSUMÉ

## 🎯 Ce qui a été configuré

**Quand un utilisateur emprunte un outil:**
1. ✅ L'outil est enregistré dans la base de données
2. ✅ Une commande d'ouverture du tiroir est créée automatiquement
3. ✅ Le moteur correspondant tourne pour ouvrir le tiroir
4. ✅ Le système confirme que le tiroir a été ouvert

## 📦 Composants

### 1. **Arduino (Moteurs_Servante_V2.ino)**
- ✅ Code uploadé et prêt
- ✅ Support 4 moteurs (X, Y, Z, A)
- ✅ Accélération trapézoïdale pour mouvement fluide
- ✅ Nouveaux pins configurés (26, 28, 30, 32)
- ✅ Commandes simples: `ox`, `fx`, `oy`, `fy`, etc.

### 2. **Backend Node.js (Port 3001)**
- ✅ Endpoint POST `/api/borrows` crée l'emprunt ET déclenche le moteur
- ✅ Endpoint POST `/api/hardware/commands` crée la commande moteur
- ✅ Endpoint GET `/api/hardware/commands?pending=true` récupère les commandes en attente
- ✅ Endpoint PUT `/api/hardware/commands/:id/ack` enregistre la confirmation Arduino

### 3. **Serial Bridge (Node.js)**
- ✅ Relie Arduino ↔ Backend via le port série
- ✅ Récupère les commandes toutes les 2 secondes
- ✅ Envoie les commandes à l'Arduino
- ✅ Reçoit les ACK et les renvoie au backend

### 4. **Frontend React (Port 5173)**
- ✅ Interface pour emprunter les outils
- ✅ Authentification avec email/mot de passe
- ✅ Chaque utilisateur a son propre mot de passe

## 🚀 Démarrage Rapide

### Terminal 1: Serial Bridge
```bash
cd "c:\Users\PC\Downloads\Servente intelligente"
SERIAL_PORT=COM3 BACKEND_URL=http://localhost:3001/api/hardware node serial-bridge.js
```
*(Remplacer COM3 par votre port réel)*

### Terminal 2: Backend
```bash
cd "c:\Users\PC\Downloads\Servente intelligente\servante-backend"
$env:PORT=3001
npm run dev
```

### Terminal 3: Frontend
```bash
cd "c:\Users\PC\Downloads\Servente intelligente\servante frontend"
npm run dev
```

### Accéder à l'application
- URL: http://localhost:5173
- Email: ahmed.benali@emines.um6p.ma
- Mot de passe: ahmed123

## 🧪 Test du Moteur

1. **Via l'interface web:**
   - Se connecter
   - Cliquer sur un outil
   - Cliquer "Emprunter"
   - Le tiroir doit s'ouvrir automatiquement

2. **Avec le script de test:**
   ```bash
   node test-motor-flow.js
   ```
   Cela va:
   - Créer un emprunt
   - Déclencher la commande moteur
   - Afficher le statut

3. **Directement sur Arduino (sans web app):**
   - Arduino Serial Monitor (9600 bauds)
   - Taper: `ox` puis Enter → ouvre Motor X
   - Taper: `fx` puis Enter → ferme Motor X

## 📊 Utilisateurs de Test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| ahmed.benali@emines.um6p.ma | ahmed123 | STUDENT |
| fatima.zahra@emines.um6p.ma | fatima123 | STUDENT |
| youssef.alami@emines.um6p.ma | youssef123 | STUDENT |
| sara.bennani@emines.um6p.ma | sara123 | STUDENT |
| karim.mansouri@emines.um6p.ma | karim123 | PROFESSOR |
| leila.berrada@emines.um6p.ma | leila123 | TECHNICIAN |

## 🔧 Configuration

**Arduino Pins:**
- Motor X: STEP=2, DIR=3, END=26
- Motor Y: STEP=4, DIR=5, END=28
- Motor Z: STEP=6, DIR=7, END=30
- Motor A: STEP=22, DIR=24, END=32
- Enable: PIN 14

**Baud Rate:** 9600

**Moteur Settings:**
- Max Speed: 2500 steps/sec
- Acceleration: 500 steps/sec²
- Microstep: 8
- Course: 380mm

## 📝 Logs à surveiller

### ✅ Bon fonctionnement:

**Backend:** 
```
🤖 Ouverture du tiroir x pour l'outil: Tournevis Plat
```

**Serial Bridge:**
```
📤 Bridge → Arduino: "ox"
✅ Commande envoyée et marquée SENT au backend
```

**Arduino Monitor:**
```
✅ Moteur x : Mouvement terminé
```

### ❌ Problèmes:

Si rien ne se passe:
1. Serial Bridge affiche l'erreur? → Vérifier le port COM
2. Backend ne lance pas la commande? → Vérifier que tool.drawer existe
3. Arduino ne reçoit rien? → Vérifier le baud rate (9600)
4. Moteur ne tourne pas? → Vérifier les pins et l'alimentation

## 📚 Documentation

- [MOTOR_SETUP_GUIDE.md](MOTOR_SETUP_GUIDE.md) - Guide complet détaillé
- [TEST_INTEGRATION.md](TEST_INTEGRATION.md) - Tests API
- [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md) - Résumé technique
- [Moteurs_Servante_V2.ino](Moteurs_Servante_V2.ino) - Code Arduino

## 🎓 Prochaines étapes possibles

1. **Feedback visuel** - Afficher l'état du tiroir au frontend
2. **Historique** - Enregistrer les commandes moteur dans la BD
3. **Gestion erreurs** - Notifier si le moteur échoue
4. **WebSocket** - Mise à jour temps réel du statut des moteurs
5. **Dashboard** - Voir l'état de tous les moteurs simultanément

---

**Tout est prêt! Lancez les 3 terminals et testez! 🚀**
