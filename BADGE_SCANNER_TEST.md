# 🔧 Badge Scanner Testing Guide

## Issue Found & Fixed
The badge-scan endpoints were missing from the route registration! They're now properly wired up.

## ✅ Before Testing - Make Sure These Are Running:

### 1. Backend Server
```bash
cd servante-backend
npm run dev
```
Should show: `Server running on port 3001`

### 2. Frontend Server
```bash
cd "servante frontend"
npm run dev
```
Should show: `Local: http://localhost:5173/`

### 3. Serial Bridge (CRITICAL!)
```bash
# In project root
node serial-bridge.js
```
Should show:
```
🔌 Connected to Arduino on COM3 (or your COM port)
🚀 Serial bridge ready
```

### 4. Arduino
- Upload `Servante_Complete_V1.ino` to your Arduino Mega
- Connect via USB
- Open Serial Monitor (9600 baud) to verify it's working

## 🧪 Testing Steps

### Test 1: Check Backend Endpoints
Open browser console (F12) and run:
```javascript
// Test if badge-scan endpoint is available
fetch('http://localhost:3001/api/hardware/badge-scan/start', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'}
}).then(r => r.json()).then(console.log)
```

Expected response:
```json
{
  "success": true,
  "scanId": "scan-1234567890-abc123",
  "message": "Scan en attente..."
}
```

### Test 2: Click "Scan Badge"
1. Click on the badge icon on the home screen
2. **You should now see:**
   - A modal dialog
   - "Placer votre badge sur le lecteur" message
   - Spinning animation
   - Instructions

3. **Console logs should show:**
   ```
   🚀 Starting badge scan...
   📡 Scan start response status: 200
   📡 Scan start response data: {success: true, scanId: "..."}
   📡 Poll attempt 1/60: {success: true, uid: null}
   📡 Poll attempt 2/60: {success: true, uid: null}
   ...
   ```

### Test 3: Scan Your Badge
1. Place your RFID badge near the RC522 reader
2. Arduino should output: `UID:D3C44823` (or similar)
3. Serial bridge should forward this to backend
4. Console should show:
   ```
   ✅ Badge detected! UID: D3C44823
   🔐 Attempting authentication with UID: D3C44823
   ```

5. **If badge is registered:**
   - Success message
   - Welcome screen
   
6. **If badge is NOT registered:**
   - Alert showing the Badge ID
   - Message to register it

## 🐛 Troubleshooting

### "Badge invalide" immediately after clicking
**BEFORE the fix:** This was because endpoints weren't registered.
**AFTER the fix:** This shouldn't happen anymore.

If it still happens:
1. Restart the backend server
2. Clear browser cache (Ctrl+Shift+Del)
3. Check browser console for errors

### "Server connection error"
- Backend isn't running on port 3001
- Check with: `curl http://localhost:3001/api/health`

### No UID detected after 60 seconds
- Serial bridge not running
- Arduino not connected
- Wrong COM port in serial-bridge.js
- RFID reader not working

### Badge detected but "Badge invalide"
- Badge UID not registered in database
- Use: `node set-badge.js <email> <scanned-uid>`
- Or register via Admin Panel

## 📊 Expected Console Output (Good Flow)

```
🚀 Starting badge scan...
📡 Scan start response status: 200
📡 Scan start response data: {success: true, scanId: "scan-1739369423-x7k9m"}
📡 Poll attempt 1/60: {success: true, uid: null, message: "En attente du badge..."}
📡 Poll attempt 2/60: {success: true, uid: null, message: "En attente du badge..."}
📡 Poll attempt 3/60: {success: true, uid: null, message: "En attente du badge..."}
✅ Badge detected! UID: D3C44823
🔐 Attempting authentication with UID: D3C44823
🔍 Attempting login with Badge ID: D3C44823
✅ Login réussi: {id: "...", fullName: "...", ...}
```

## 🔑 Quick Badge Registration

If you see "Badge invalide" with a UID:

```bash
# Register the badge to a user
node set-badge.js admin@emines.um6p.ma D3C44823

# Or check all users
node check-badges.js
```

## ✨ Success Criteria

- ✅ Modal opens when clicking scan badge
- ✅ "Waiting" animation shows
- ✅ Badge UID is captured when scanned
- ✅ Authentication succeeds or shows proper error with UID
- ✅ User is logged in and sees tool selection screen
