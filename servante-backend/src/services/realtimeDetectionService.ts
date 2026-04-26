import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

interface Detection {
  x: number; y: number; w: number; h: number;
  class: string; class_id: number; confidence: number;
  polygon?: number[][];
}

interface DetectionResult {
  success: boolean;
  detections: Detection[];
  annotated_image?: string | null;
  count?: number;
  error?: string;
}

const SERVER_PORT = 5002;

class RealtimeDetectionService {
  private process: ChildProcess | null = null;
  private ready = false;
  private readonly modelPath: string;
  private readonly scriptPath: string;

  constructor() {
    this.modelPath  = path.join(__dirname, '../../..', 'best.pt');
    this.scriptPath = path.join(__dirname, 'python_detection_server.py');
    this.startPythonServer();
  }

  // ── Démarrage du serveur Python persistant ────────────────────────────────
  private startPythonServer(): void {
    if (!fs.existsSync(this.scriptPath)) {
      console.error('[DETECTION] Script introuvable:', this.scriptPath);
      return;
    }
    if (!fs.existsSync(this.modelPath)) {
      console.warn('[DETECTION] Modèle introuvable:', this.modelPath);
    }

    console.log('[DETECTION] Démarrage du serveur Python YOLO...');
    this.process = spawn('python', [this.scriptPath, this.modelPath, String(SERVER_PORT)], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg.includes('DETECTION_SERVER_READY')) {
        this.ready = true;
        console.log(`[DETECTION] Serveur Python prêt sur port ${SERVER_PORT}`);
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      console.log('[DETECTION Python]', data.toString().trim());
    });

    this.process.on('exit', (code) => {
      console.warn('[DETECTION] Serveur Python arrêté (code', code, ')');
      this.ready = false;
    });
  }

  // ── Appel HTTP vers le serveur Python ────────────────────────────────────
  private callServer(image: string): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      let b64 = image;
      if (b64.includes(',')) b64 = b64.split(',')[1];

      const body = JSON.stringify({ image: b64 });

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: SERVER_PORT,
          path: '/detect',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try { resolve(JSON.parse(raw)); }
            catch { reject(new Error('Réponse JSON invalide')); }
          });
        }
      );

      req.setTimeout(15_000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // ── API publique ──────────────────────────────────────────────────────────
  async detectFromBase64(base64Image: string): Promise<DetectionResult> {
    if (!this.ready) {
      return { success: false, detections: [], error: 'Serveur YOLO en cours de démarrage...' };
    }
    try {
      return await this.callServer(base64Image);
    } catch (err) {
      return {
        success: false,
        detections: [],
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      };
    }
  }

  isReady(): boolean { return this.ready; }

  shutdown(): void { this.process?.kill(); }
}

export default new RealtimeDetectionService();
