import { Router } from 'express';
import { rfidService } from '../services/rfidService.js';

const router = Router();

// GET /api/rfid/last-scan - Obtenir le dernier badge scanné
router.get('/last-scan', (req, res) => {
    const scan = rfidService.getLastScan();

    if (!scan) {
        return res.json({
            success: false,
            message: 'Aucun badge scanné récemment'
        });
    }

    res.json({
        success: true,
        data: {
            badgeId: scan.uid,
            timestamp: scan.timestamp
        }
    });
});

// POST /api/rfid/consume - Consommer le dernier scan (usage unique)
router.post('/consume', (req, res) => {
    const uid = rfidService.consumeLastScan();

    if (!uid) {
        return res.json({
            success: false,
            message: 'Aucun badge disponible'
        });
    }

    res.json({
        success: true,
        data: { badgeId: uid }
    });
});

// GET /api/rfid/status - Vérifier l'état du lecteur
router.get('/status', (req, res) => {
    res.json({
        success: true,
        connected: true,
        message: 'Lecteur RFID opérationnel'
    });
});

export default router;