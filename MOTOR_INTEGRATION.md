# Motor Integration Guide

## Overview
This system integrates 4 stepper motors with drawers 1-4 to automatically open the correct drawer when a tool is selected.

## Motor-Drawer Mapping

| Motor | Drawer | Arduino Pin |
|-------|--------|-------------|
| X     | 1      | STEP_X=2, DIR_X=3, END_X=26 |
| Y     | 2      | STEP_Y=4, DIR_Y=5, END_Y=28 |
| Z     | 3      | STEP_Z=6, DIR_Z=7, END_Z=30 |
| A     | 4      | STEP_A=22, DIR_A=24, END_A=32 |

## Setup

### 1. Database Configuration
Each tool in the database has an optional `drawer` field (String):
- Valid values: `"1"`, `"2"`, `"3"`, `"4"`
- Example: `drawer: "1"` means the tool is in drawer 1

To update tools with drawer numbers:
```sql
-- Update specific tools
UPDATE "Tool" SET drawer = '1' WHERE name = 'Tournevis plat';
UPDATE "Tool" SET drawer = '2' WHERE name = 'Pince coupante';
-- etc.
```

### 2. Arduino Setup
1. Upload `Moteurs_Servante_V2.ino` to Arduino Mega
2. Connect via USB (will auto-detect on startup)
3. The backend automatically initializes motor service on startup

### 3. Hardware Connection
- Connect Arduino Mega via USB to the server computer
- Motors will be detected automatically (vendor IDs: 2341, 1a86)
- Different COM port than RFID (if RFID is on COM5, motors will use another available port)

## How It Works

### Automatic Flow:
1. **User selects a tool** in the frontend
2. **Frontend checks** if tool has a `drawer` field (`"1"`, `"2"`, `"3"`, or `"4"`)
3. **Frontend calls** `POST /api/hardware/drawer/open` with `drawerNumber`
4. **Backend translates** drawer number to motor:
   - Drawer 1 → Motor X → Sends `"xo\n"` (X open)
   - Drawer 2 → Motor Y → Sends `"yo\n"` (Y open)
   - Drawer 3 → Motor Z → Sends `"zo\n"` (Z open)
   - Drawer 4 → Motor A → Sends `"ao\n"` (A open)
5. **Arduino executes** the motor command to open the drawer
6. **User takes the tool** from the open drawer
7. **Confirmation screen** appears for borrowing

### Manual Control:
Admin can also manually control drawers:
- Open: `POST /api/hardware/drawer/open` with `{ drawerNumber: "1" }`
- Close: `POST /api/hardware/drawer/close` with `{ drawerNumber: "1" }`
- Emergency stop: `POST /api/hardware/motor/stop`

## API Endpoints

### Open Drawer
```typescript
POST /api/hardware/drawer/open
Body: { drawerNumber: "1" | "2" | "3" | "4" }
Response: { success: true, message: "Tiroir 1 en cours d'ouverture", drawerNumber: "1" }
```

### Close Drawer
```typescript
POST /api/hardware/drawer/close
Body: { drawerNumber: "1" | "2" | "3" | "4" }
Response: { success: true, message: "Tiroir 1 en cours de fermeture", drawerNumber: "1" }
```

### Emergency Stop
```typescript
POST /api/hardware/motor/stop
Response: { success: true, message: "Arrêt d'urgence envoyé" }
```

### Motor Status
```typescript
GET /api/hardware/motor/status
Response: {
  success: true,
  data: {
    connected: true,
    port: "COM3",
    lastResponse: "✅ DONE in 2.34 s"
  }
}
```

## Frontend Integration

The frontend automatically triggers motor opening in `App.tsx`:

```typescript
const handleToolSelection = async (tool: Tool) => {
  if (tool.availableQuantity <= 0) return;

  // Ouvrir le tiroir si le numéro est défini
  if (tool.drawer && ['1', '2', '3', '4'].includes(tool.drawer)) {
    try {
      const result = await hardwareAPI.openDrawer(tool.drawer as '1' | '2' | '3' | '4');
      if (result.success) {
        showToast(`Tiroir ${tool.drawer} en cours d'ouverture`, 'success', 2000);
      }
    } catch (error) {
      console.warn('⚠️ Moteurs non disponibles ou erreur:', error);
      // Continue même si les moteurs ne sont pas connectés
    }
  }

  setSelectedTool(tool);
  setIsReturnMode(false);
  setCurrentScreen('confirm-borrow');
};
```

## Testing

### Test Motor Service:
```bash
cd servante-backend
npm run dev
# Look for: "✅ Contrôleur de moteurs connecté sur COM3"
```

### Test Manual Commands:
```bash
# Open drawer 1
curl -X POST http://localhost:5000/api/hardware/drawer/open \
  -H "Content-Type: application/json" \
  -d '{"drawerNumber":"1"}'

# Close drawer 1
curl -X POST http://localhost:5000/api/hardware/drawer/close \
  -H "Content-Type: application/json" \
  -d '{"drawerNumber":"1"}'

# Emergency stop
curl -X POST http://localhost:5000/api/hardware/motor/stop

# Check status
curl http://localhost:5000/api/hardware/motor/status
```

### Test from Frontend:
1. Start frontend: `cd servante frontend && npm run dev`
2. Login with badge
3. Select a tool that has a drawer assigned (e.g., drawer="1")
4. Watch console for: "🔓 Ouverture du tiroir 1 pour [tool name]..."
5. Drawer should automatically open

## Troubleshooting

### Motors not connecting:
- Check Arduino is connected via USB
- Check COM port is not in use by Arduino IDE Serial Monitor
- Verify Arduino Mega vendor ID matches (2341 or 1a86)
- Check backend logs for initialization errors

### Drawer not opening:
- Verify tool has `drawer` field set in database
- Check motor status: `GET /api/hardware/motor/status`
- Check Arduino Serial Monitor for motor feedback
- Verify endstops are not already pressed

### Wrong drawer opens:
- Verify drawer number in database matches physical drawer
- Check motor-to-drawer mapping in `motorService.ts`

## Database Schema

```prisma
model Tool {
  id                String   @id @default(uuid())
  name              String
  categoryId        String
  imageUrl          String
  size              String?
  drawer            String?  // ← Drawer number: "1", "2", "3", or "4"
  totalQuantity     Int      @default(1)
  availableQuantity Int      @default(1)
  borrowedQuantity  Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  category          Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  borrows           Borrow[]
}
```

## File Structure

```
servante-backend/src/
├── services/
│   ├── motorService.ts       # Motor serial communication
│   └── rfidService.ts         # RFID (separate Arduino)
├── controllers/
│   └── motorController.ts     # Motor API handlers
└── routes/
    └── hardwareRoutes.ts      # Motor + RFID routes

servante frontend/src/
├── services/
│   └── api.ts                 # hardwareAPI with motor methods
└── App.tsx                    # handleToolSelection() with motor trigger

Moteurs_Servante_V2/
└── Moteurs_Servante_V2.ino    # Arduino motor control
```

## Next Steps

1. **Assign drawer numbers to all tools** in the database
2. **Test each drawer** individually with manual API calls
3. **Add drawer close** on tool return (optional enhancement)
4. **Add visual indicator** showing which drawer is opening (optional UI enhancement)

## Safety Features

- ✅ Endstop detection prevents over-travel
- ✅ Emergency stop command available
- ✅ System continues if motors offline (graceful degradation)
- ✅ Duplicate command filtering (250ms cooldown)
- ✅ Boot recovery closes all drawers to endstops on startup
