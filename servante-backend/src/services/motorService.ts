import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

interface MotorStatus {
    connected: boolean;
    port: string | null;
    lastResponse: string | null;
}

class MotorService {
    private port: SerialPort | null = null;
    private parser: ReadlineParser | null = null;
    private motorStatus: MotorStatus = {
        connected: false,
        port: null,
        lastResponse: null,
    };

    // RFID callback for shared serial port
    private rfidCallback: ((uid: string) => void) | null = null;

    // Motor to drawer mapping
    // Motor X = Drawer 1
    // Motor Y = Drawer 2
    // Motor Z = Drawer 3
    // Motor A = Drawer 4
    private drawerToMotor: { [key: string]: string } = {
        '1': 'x',
        '2': 'y',
        '3': 'z',
        '4': 'a',
    };

    async initialize(): Promise<void> {
        try {
            console.log('🔌 Searching for Arduino controller...');

            const ports = await SerialPort.list();
            console.log('📋 Available serial ports:');
            ports.forEach(p => {
                console.log(`  - ${p.path} | Vendor: ${p.vendorId || 'N/A'} | Product: ${p.productId || 'N/A'}`);
            });

            // Use ARDUINO_PORT env var if set, otherwise auto-detect
            const forcedPort = process.env.ARDUINO_PORT;
            const arduinoPort = forcedPort
                ? ports.find(p => p.path === forcedPort)
                : ports.find(p =>
                    p.vendorId === '2341' || p.vendorId === '1a86' ||
                    p.path.includes('ttyACM') || p.path.includes('ttyUSB')
                  );

            if (!arduinoPort) {
                console.warn(`⚠️ Arduino not found on ${forcedPort || 'any port'}. Running in SIMULATION MODE.`);
                console.log('   Available ports:', ports.map(p => p.path).join(', ') || 'none');
                this.motorStatus.connected = false;
                return;
            }

            console.log(`🔌 Connecting to Arduino on ${arduinoPort.path}...`);
            this.port = new SerialPort({
                path: arduinoPort.path,
                baudRate: 9600,
            });

            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

            this.parser.on('data', (line: string) => {
                const cleaned = line.trim();
                if (!cleaned) return;
                if (cleaned.startsWith('UID:')) {
                    const uid = cleaned.replace('UID:', '').toUpperCase();
                    console.log('📇 RFID badge scanned:', uid);
                    if (this.rfidCallback) this.rfidCallback(uid);
                } else {
                    console.log(`[ARDUINO] ${cleaned}`);
                    this.motorStatus.lastResponse = cleaned;
                }
            });

            this.port.on('error', (err) => {
                console.error('❌ Serial port error:', err.message);
                this.motorStatus.connected = false;
            });

            this.port.on('open', () => {
                console.log(`✅ Serial port opened: ${arduinoPort.path}`);
            });

            // Wait for Arduino to finish homing and print ready signal.
            // homeAll() runs ~54 s (136 000 steps at 2500 steps/s × 4 axes).
            // We listen for the exact ready message; timeout after 90 s.
            console.log('⏳ Waiting for Arduino to finish homing (up to 90 s)...');
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    console.warn('⚠️ Arduino ready signal not received within 90 s — proceeding anyway.');
                    resolve();
                }, 90000);

                const onReady = (line: string) => {
                    if (line.includes('PRÊT') || line.includes('READY') || line.includes('PRET')) {
                        clearTimeout(timeout);
                        this.parser!.off('data', onReady);
                        console.log('✅ Arduino homing complete — ready for commands.');
                        resolve();
                    }
                };
                this.parser!.on('data', onReady);
            });

            this.motorStatus.connected = true;
            this.motorStatus.port = arduinoPort.path;
            console.log(`✅ Motor controller ready on ${arduinoPort.path}`);
        } catch (error) {
            console.error('❌ Motor initialization error:', error instanceof Error ? error.message : error);
            this.motorStatus.connected = false;
        }
    }

    /**
     * Open drawer by number (1-4)
     */
    async openDrawer(drawerNumber: string): Promise<boolean> {
        try {
            console.log(`📤 openDrawer called with drawerNumber: ${drawerNumber}`);
            
            if (!drawerNumber) {
                console.error(`❌ No drawer number provided`);
                return true; // Return true to allow UI to continue
            }

            const motor = this.drawerToMotor[drawerNumber];
            if (!motor) {
                console.warn(`⚠️ Unknown drawer: ${drawerNumber} - using simulation`);
                return true; // Simulate success
            }

            // If not connected, just simulate
            if (!this.motorStatus.connected || !this.port) {
                console.log(`ℹ️ Motors not connected - Simulation mode for drawer ${drawerNumber}`);
                return true;
            }

            // Double-check port is still valid
            if (typeof this.port.write !== 'function') {
                console.warn(`⚠️ Port write is invalid - using simulation`);
                return true;
            }

            const command = `${motor}o\n`;
            console.log(`🔓 Sending open command to drawer ${drawerNumber}: "${command.trim()}"`);

            this.port.write(command, (err: any) => {
                if (err) {
                    console.error(`❌ Write error:`, err.message);
                } else {
                    console.log(`✅ Command sent successfully`);
                }
            });

            return true;
        } catch (error) {
            console.error('❌ Exception in openDrawer:', error);
            return true; // Always return true to keep UI flowing
        }
    }

    /**
     * Close drawer by number (1-4)
     */
    async closeDrawer(drawerNumber: string): Promise<boolean> {
        try {
            console.log(`📤 closeDrawer called with drawerNumber: ${drawerNumber}`);
            
            if (!drawerNumber) {
                console.error(`❌ No drawer number provided`);
                return true; // Return true to allow UI to continue
            }

            const motor = this.drawerToMotor[drawerNumber];
            if (!motor) {
                console.warn(`⚠️ Unknown drawer: ${drawerNumber} - using simulation`);
                return true; // Simulate success
            }

            // If not connected, just simulate
            if (!this.motorStatus.connected || !this.port) {
                console.log(`ℹ️ Motors not connected - Simulation mode for drawer ${drawerNumber}`);
                return true;
            }

            // Double-check port is still valid
            if (typeof this.port.write !== 'function') {
                console.warn(`⚠️ Port write is invalid - using simulation`);
                return true;
            }

            const command = `${motor}f\n`;
            console.log(`🔒 Sending close command to drawer ${drawerNumber}: "${command.trim()}"`);

            this.port.write(command, (err: any) => {
                if (err) {
                    console.error(`❌ Write error:`, err.message);
                } else {
                    console.log(`✅ Command sent successfully`);
                }
            });

            return true;
        } catch (error) {
            console.error('❌ Exception in closeDrawer:', error);
            return true; // Always return true to keep UI flowing
        }
    }

    /**
     * Emergency stop all motors
     */
    async stopAll(): Promise<boolean> {
        try {
            if (!this.motorStatus.connected || !this.port) {
                console.warn('⚠️ Motors not connected - stopAll ignored');
                return true;
            }

            this.port.write('s\n', (err) => {
                if (err) {
                    console.error('❌ Error sending stop command:', err);
                }
            });
            console.log('🛑 EMERGENCY STOP - All motors');
            return true;
        } catch (error) {
            console.error('❌ Error in stopAll:', error);
            return true; // Return true anyway
        }
    }

    getStatus(): MotorStatus {
        try {
            return { 
                connected: this.motorStatus?.connected ?? false,
                port: this.motorStatus?.port ?? null,
                lastResponse: this.motorStatus?.lastResponse ?? null,
            };
        } catch (error) {
            console.error('❌ Error in getStatus:', error);
            return { connected: false, port: null, lastResponse: null };
        }
    }

    /**
     * Register RFID callback for shared serial port
     */
    setRfidCallback(callback: (uid: string) => void): void {
        this.rfidCallback = callback;
    }

    /**
     * Get the serial port path (for RFID service to know which port is being used)
     */
    getPortPath(): string | null {
        return this.motorStatus.port;
    }

    async close(): Promise<void> {
        if (this.port && this.port.isOpen) {
            await new Promise<void>((resolve) => {
                this.port!.close((err) => {
                    if (err) console.error('Erreur fermeture port moteur:', err);
                    resolve();
                });
            });
            this.motorStatus.connected = false;
            this.motorStatus.port = null;
            console.log('🔌 Connexion moteurs fermée');
        }
    }
}

export const motorService = new MotorService();
