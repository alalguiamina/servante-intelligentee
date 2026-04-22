import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { motorService } from './motorService';
import { associateUidWithPendingScan } from '../controllers/badgeScanController';

class RFIDService {
    private lastScannedBadge: { uid: string; timestamp: number } | null = null;
    private usingSharedPort: boolean = false;

    async initialize() {
        try {
            // Check if motorService already has a port open
            const motorPort = motorService.getPortPath();

            if (motorPort) {
                // Use shared port with motorService
                console.log('📡 Utilisation du port partagé avec motorService:', motorPort);
                this.usingSharedPort = true;

                // Register callback to receive RFID data from motorService
                motorService.setRfidCallback((uid: string) => {
                    this.lastScannedBadge = {
                        uid,
                        timestamp: Date.now()
                    };
                    // Also push to any pending badge scan session (frontend polling)
                    associateUidWithPendingScan(uid);
                });

                return true;
            } else {
                console.warn('⚠️ Arduino RFID reader not detected (motorService not connected)');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur initialisation RFID:', error);
            return false;
        }
    }

    getLastScan(): { uid: string; timestamp: number } | null {
        if (!this.lastScannedBadge) {
            return null;
        }

        // Expiration après 10 secondes
        const age = Date.now() - this.lastScannedBadge.timestamp;
        if (age > 10000) {
            this.lastScannedBadge = null;
            return null;
        }

        return this.lastScannedBadge;
    }

    consumeLastScan(): string | null {
        const scan = this.getLastScan();
        if (scan) {
            this.lastScannedBadge = null;
            return scan.uid;
        }
        return null;
    }

    getStatus(): { connected: boolean; port?: string } {
        if (this.usingSharedPort) {
            const motorPort = motorService.getPortPath();
            return {
                connected: motorPort !== null,
                port: motorPort || undefined
            };
        }
        return {
            connected: false,
            port: undefined
        };
    }

    close() {
        // Don't close the port, it's shared with motorService
        // Just clear the callback
        if (this.usingSharedPort) {
            motorService.setRfidCallback(() => { });
            console.log('🔌 Callback RFID désactivé (port partagé)');
        }
    }
}

export const rfidService = new RFIDService();