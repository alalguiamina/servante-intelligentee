import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// IN-MEMORY QUEUE (temporaire, pour tests)
// En production: utiliser une table Prisma
// ============================================

interface HardwareCommand {
  id: string;
  type: 'OPEN' | 'CLOSE';
  drawer: 'x' | 'y' | 'z' | 'a';
  status: 'PENDING' | 'SENT' | 'DONE' | 'FAILED';
  createdAt: Date;
  ack?: {
    result: string;
    message: string;
    at: Date;
  };
}

const commands: HardwareCommand[] = [];

// ============================================
// ENDPOINT 1: Créer une nouvelle commande
// POST /api/hardware/commands
// Body: { type: "OPEN"|"CLOSE", drawer: "x"|"y"|"z"|"a" }
// ============================================
export const createCommand = (req: Request, res: Response): void => {
  try {
    const { type, drawer } = req.body;

    if (!type || !drawer) {
      res.status(400).json({
        success: false,
        message: 'type et drawer requis'
      });
      return;
    }

    if (!['OPEN', 'CLOSE'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'type doit être OPEN ou CLOSE'
      });
      return;
    }

    if (!['x', 'y', 'z', 'a'].includes(drawer)) {
      res.status(400).json({
        success: false,
        message: 'drawer doit être x, y, z ou a'
      });
      return;
    }

    const id = `cmd-${Date.now()}`;
    const command: HardwareCommand = {
      id,
      type,
      drawer,
      status: 'PENDING',
      createdAt: new Date()
    };

    commands.push(command);

    console.log(`✅ Commande créée: ${id} (${type} ${drawer})`);

    res.status(201).json({
      success: true,
      id,
      message: `Commande ${type} ${drawer} créée`
    });
  } catch (error) {
    console.error('Erreur createCommand:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// ENDPOINT 2: Récupérer les commandes en attente
// GET /api/hardware/commands?pending=true
// Utilisé par le script pont série (Arduino polle cet endpoint)
// ============================================
export const getCommands = (req: Request, res: Response): void => {
  try {
    const pending = req.query.pending === 'true';

    let result = commands;
    if (pending) {
      result = commands.filter(c => c.status === 'PENDING');
    }

    console.log(`📋 Récupération commandes (pending=${pending}): ${result.length} trouvées`);

    res.json({
      success: true,
      count: result.length,
      commands: result
    });
  } catch (error) {
    console.error('Erreur getCommands:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// ENDPOINT 3: Envoyer un ACK quand le tiroir est ouvert/fermé
// PUT /api/hardware/commands/:id/ack
// Body: { result: "OPENED"|"CLOSED"|"FAILED", message: "texte optionnel" }
// ============================================
export const sendAck = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { result, message = '' } = req.body;

    const cmd = commands.find(c => c.id === id);

    if (!cmd) {
      res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
      return;
    }

    // Mettre à jour la commande
    cmd.status = result === 'FAILED' ? 'FAILED' : 'DONE';
    cmd.ack = {
      result,
      message,
      at: new Date()
    };

    console.log(`✅ ACK reçu: ${id} → ${result}`);

    // TODO: Mettre à jour la DB Prisma (HardwareEvent, Borrow state)
    // TODO: Notifier le frontend via WebSocket

    res.json({
      success: true,
      command: cmd,
      message: `ACK enregistré: ${result}`
    });
  } catch (error) {
    console.error('Erreur sendAck:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// ROUTE SETUP
// ============================================
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { startBadgeScan, checkBadgeScan, cancelBadgeScan, receiveRFIDWithScan } from '../controllers/badgeScanController';
import { openDrawer, closeDrawer, stopMotors, getMotorStatus } from '../controllers/motorController';
import { aiValidationService } from '../services/aiValidationService';

const router = express.Router();

router.post('/commands', createCommand);
router.get('/commands', getCommands);
router.put('/commands/:id/ack', sendAck);

// RFID endpoint - handles RFID UIDs from serial bridge
router.post('/rfid', receiveRFIDWithScan);

// Badge scanning endpoints - for admin interface
router.post('/badge-scan/start', startBadgeScan);
router.get('/badge-scan/:scanId', checkBadgeScan);
router.delete('/badge-scan/:scanId', cancelBadgeScan);

// Motor/drawer control endpoints
router.post('/drawer/open', openDrawer);
router.post('/drawer/close', closeDrawer);
router.post('/motor/stop', stopMotors);
router.get('/motor/status', getMotorStatus);

// Camera preview endpoints (lightweight, no YOLO — used on confirm & drawer-open screens)
router.post('/camera/preview/start', (req: Request, res: Response) => {
  const { cameraId = 0, duration = 600 } = req.body;
  aiValidationService.startPreview(Number(cameraId), Number(duration));
  res.json({ success: true });
});

router.post('/camera/preview/stop', (req: Request, res: Response) => {
  aiValidationService.stopPreview();
  res.json({ success: true });
});

router.get('/camera/preview', (req: Request, res: Response) => {
  const framePath = aiValidationService.previewFramePath;
  if (!fs.existsSync(framePath)) {
    res.status(404).json({ error: 'No preview frame available yet' });
    return;
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(framePath);
});

// Live camera frame endpoint (polled by frontend while scanning)
router.get('/camera/frame', (req: Request, res: Response) => {
  const framePath = path.join(os.tmpdir(), 'servante_live_frame.jpg');
  if (!fs.existsSync(framePath)) {
    res.status(404).json({ error: 'No frame available yet' });
    return;
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(framePath);
});

// Live detections endpoint (polled by frontend while scanning)
router.get('/camera/detections', (req: Request, res: Response) => {
  const detPath = path.join(os.tmpdir(), 'servante_live_detections.json');
  if (!fs.existsSync(detPath)) {
    res.json({ detected_tools: [], count: 0 });
    return;
  }
  try {
    const raw = fs.readFileSync(detPath, 'utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(JSON.parse(raw));
  } catch {
    res.json({ detected_tools: [], count: 0 });
  }
});

// YOLO drawer scan endpoint
router.post('/drawer/scan', async (req: Request, res: Response) => {
  try {
    const { cameraId = 0, confidence = 0.35, duration = 20 } = req.body;
    const result = await aiValidationService.scanDrawer(
      Number(cameraId),
      Number(confidence),
      Number(duration)
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Scan failed' });
  }
});

export default router;
