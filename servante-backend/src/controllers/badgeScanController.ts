import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store pour les scans en attente (en mémoire)
// En production, utiliser Redis ou une table DB
const pendingScans: Map<string, { uid: string; timestamp: Date }> = new Map();

/**
 * Endpoint pour initier un scan de badge
 * GET /api/hardware/badge-scan/start
 * 
 * Retourne un scanId unique que le frontend peut utiliser pour poller le résultat
 */
export const startBadgeScan = (req: Request, res: Response): void => {
    try {
        const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Initialiser le scan (pas encore de UID)
        pendingScans.set(scanId, { uid: '', timestamp: new Date() });

        // Nettoyer les anciens scans (> 5 minutes)
        cleanOldScans();

        console.log(`📋 Nouveau scan initié: ${scanId}`);

        res.json({
            success: true,
            scanId,
            message: 'Scan en attente. Approchez le badge du lecteur RFID.'
        });
    } catch (error) {
        console.error('Erreur startBadgeScan:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

/**
 * Endpoint pour vérifier si un UID a été scanné
 * GET /api/hardware/badge-scan/:scanId
 * 
 * Retourne l'UID s'il a été capturé, sinon indique qu'il faut attendre
 */
export const checkBadgeScan = (req: Request, res: Response): void => {
    try {
        const { scanId } = req.params;

        const scan = pendingScans.get(scanId);

        if (!scan) {
            res.status(404).json({
                success: false,
                message: 'Scan non trouvé ou expiré'
            });
            return;
        }

        if (scan.uid) {
            // UID capturé !
            console.log(`✅ UID capturé pour scan ${scanId}: ${scan.uid}`);

            // Nettoyer ce scan
            pendingScans.delete(scanId);

            res.json({
                success: true,
                uid: scan.uid,
                message: 'Badge détecté avec succès'
            });
        } else {
            // Pas encore de UID
            res.json({
                success: true,
                uid: null,
                message: 'En attente du badge...'
            });
        }
    } catch (error) {
        console.error('Erreur checkBadgeScan:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

/**
 * Endpoint modifié pour recevoir les UIDs RFID
 * Maintenant il peut aussi associer l'UID à un scan en attente
 */
export const receiveRFIDWithScan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uid } = req.body;

        if (!uid) {
            res.status(400).json({
                success: false,
                message: 'uid requis'
            });
            return;
        }

        console.log(`🏷️  RFID reçu: ${uid}`);

        // Vérifier s'il y a un scan en attente (pour l'admin)
        const waitingScan = Array.from(pendingScans.entries()).find(
            ([_, scan]) => !scan.uid
        );

        if (waitingScan) {
            const [scanId, scan] = waitingScan;
            scan.uid = uid.toUpperCase();
            console.log(`📋 UID associé au scan admin: ${scanId}`);
        }

        // Reste du code original pour l'authentification...
        // (voir hardwareRoutes.ts existant)

        // Pour simplifier, on retourne juste le succès ici
        res.json({
            success: true,
            uid,
            message: 'UID reçu'
        });

    } catch (error) {
        console.error('Erreur receiveRFIDWithScan:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

/**
 * Associate a UID with the first waiting pending scan.
 * Called from rfidService when a badge is read from serial.
 */
export function associateUidWithPendingScan(uid: string): boolean {
    const waitingScan = Array.from(pendingScans.entries()).find(
        ([_, scan]) => !scan.uid
    );

    if (waitingScan) {
        const [scanId, scan] = waitingScan;
        scan.uid = uid.toUpperCase();
        console.log(`📋 UID associé au scan (via serial): ${scanId} → ${uid.toUpperCase()}`);
        return true;
    }
    return false;
}

/**
 * Nettoyer les scans de plus de 5 minutes
 */
function cleanOldScans() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    for (const [scanId, scan] of pendingScans.entries()) {
        if (scan.timestamp < fiveMinutesAgo) {
            pendingScans.delete(scanId);
            console.log(`🗑️  Scan expiré nettoyé: ${scanId}`);
        }
    }
}

/**
 * Endpoint pour annuler un scan
 * DELETE /api/hardware/badge-scan/:scanId
 */
export const cancelBadgeScan = (req: Request, res: Response): void => {
    try {
        const { scanId } = req.params;

        if (pendingScans.has(scanId)) {
            pendingScans.delete(scanId);
            console.log(`❌ Scan annulé: ${scanId}`);
        }

        res.json({
            success: true,
            message: 'Scan annulé'
        });
    } catch (error) {
        console.error('Erreur cancelBadgeScan:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};
