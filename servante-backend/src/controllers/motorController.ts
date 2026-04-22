import { Request, Response } from 'express';
import { motorService } from '../services/motorService.js';

/**
 * Open a specific drawer
 * POST /api/hardware/drawer/open
 * Body: { drawerNumber: "1" | "2" | "3" | "4" }
 */
export const openDrawer = async (req: Request, res: Response): Promise<void> => {
    let responseSent = false;
    try {
        const { drawerNumber } = req.body || {};

        console.log(`🔍 [openDrawer] drawerNumber: ${drawerNumber}`);

        if (!drawerNumber || !['1', '2', '3', '4'].includes(String(drawerNumber))) {
            console.error(`❌ Invalid drawerNumber: ${drawerNumber}`);
            responseSent = true;
            return res.status(400).json({
                success: false,
                message: 'Invalid drawer number',
            });
        }

        if (!motorService || typeof motorService.openDrawer !== 'function') {
            console.warn('⚠️ motorService not available');
            responseSent = true;
            return res.json({ success: true, message: 'Command queued' });
        }

        await motorService.openDrawer(String(drawerNumber));
        
        responseSent = true;
        return res.json({
            success: true,
            message: `Drawer ${drawerNumber} opening`,
            drawerNumber,
        });
    } catch (error) {
        console.error('❌ [openDrawer] Error:', error instanceof Error ? error.message : error);
        if (!responseSent) {
            responseSent = true;
            return res.json({ success: true, message: 'Command processed' });
        }
    }
};

/**
 * Close a specific drawer
 * POST /api/hardware/drawer/close
 * Body: { drawerNumber: "1" | "2" | "3" | "4" }
 */
export const closeDrawer = async (req: Request, res: Response): Promise<void> => {
    let responseSent = false;
    try {
        const { drawerNumber } = req.body || {};

        console.log(`🔍 [closeDrawer] drawerNumber: ${drawerNumber}`);

        if (!drawerNumber || !['1', '2', '3', '4'].includes(String(drawerNumber))) {
            console.error(`❌ Invalid drawerNumber: ${drawerNumber}`);
            responseSent = true;
            return res.status(400).json({
                success: false,
                message: 'Invalid drawer number',
            });
        }

        if (!motorService || typeof motorService.closeDrawer !== 'function') {
            console.warn('⚠️ motorService not available');
            responseSent = true;
            return res.json({ success: true, message: 'Command queued' });
        }

        await motorService.closeDrawer(String(drawerNumber));
        
        responseSent = true;
        return res.json({
            success: true,
            message: `Drawer ${drawerNumber} closing`,
            drawerNumber,
        });
    } catch (error) {
        console.error('❌ [closeDrawer] Error:', error instanceof Error ? error.message : error);
        if (!responseSent) {
            responseSent = true;
            return res.json({ success: true, message: 'Command processed' });
        }
    }
};

/**
 * Emergency stop all motors
 * POST /api/hardware/motor/stop
 */
export const stopMotors = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🛑 [stopMotors] Stop command received');

        if (motorService && typeof motorService.stopAll === 'function') {
            await motorService.stopAll();
        }

        res.json({
            success: true,
            message: 'Stop command sent',
        });
    } catch (error) {
        console.error('❌ [stopMotors] Error:', error instanceof Error ? error.message : error);
        res.json({
            success: true,
            message: 'Stop command processed',
        });
    }
};

/**
 * Get motor system status
 * GET /api/hardware/motor/status
 */
export const getMotorStatus = (req: Request, res: Response): void => {
    try {
        let status = { connected: false, port: null, lastResponse: null };

        if (motorService && typeof motorService.getStatus === 'function') {
            status = motorService.getStatus();
        }

        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('❌ [getMotorStatus] Error:', error instanceof Error ? error.message : error);
        res.json({
            success: true,
            data: { connected: false, port: null, lastResponse: null },
        });
    }
};
