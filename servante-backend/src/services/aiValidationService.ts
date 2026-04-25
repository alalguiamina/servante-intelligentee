import { exec, spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  success: boolean;
  is_valid?: boolean;
  detected_product?: string;
  expected_product?: string;
  confidence?: number;
  all_detections?: any[];
  error?: string;
  message?: string;
}

interface BorrowValidation {
  borrowId: string;
  toolId: string;
  toolName: string;
  imagePath: string;
  isValid: boolean;
  confidence: number;
  detectedProduct: string;
  expectedProduct: string;
  validatedAt: Date;
}

class AIValidationService {
  private modelPath: string;
  private pythonScriptPath: string;
  private previewScriptPath: string;
  private previewProcess?: ChildProcess;
  readonly previewFramePath: string;

  constructor() {
    this.modelPath = process.env.AI_MODEL_PATH || path.join(__dirname, '../../best2.pt');
    this.pythonScriptPath = path.join(__dirname, 'ai_validation.py');
    this.previewScriptPath = path.join(__dirname, 'camera_preview.py');
    this.previewFramePath = path.join(os.tmpdir(), 'servante_preview.jpg');
  }

  /**
   * Start a lightweight background camera preview (no YOLO).
   * Writes frames to servante_preview.jpg in the OS temp dir.
   * Must be stopped before starting a YOLO scan (same camera).
   */
  startPreview(cameraId: number = 0, duration: number = 600): void {
    this.stopPreview();

    if (!fs.existsSync(this.previewScriptPath)) {
      console.warn('⚠️ camera_preview.py not found');
      return;
    }

    const args = [
      this.previewScriptPath,
      '--camera', String(cameraId),
      '--duration', String(duration),
    ];

    // Pass model path so YOLO annotations appear in preview
    if (fs.existsSync(this.modelPath)) {
      args.push('--model', this.modelPath);
    }

    this.previewProcess = spawn('python', args, { windowsHide: true });

    this.previewProcess.on('error', (err) =>
      console.warn('⚠️ Preview process error:', err.message)
    );

    console.log('📷 Camera preview started with model:', this.modelPath);
  }

  /**
   * Stop the background preview process.
   */
  stopPreview(): void {
    if (this.previewProcess) {
      try { this.previewProcess.kill(); } catch { /* already dead */ }
      this.previewProcess = undefined;
      console.log('📷 Camera preview stopped');
    }
  }

  /**
   * Check if the required dependencies are installed
   */
  async checkDependencies(): Promise<boolean> {
    try {
      const { stdout } = await execPromise('python --version 2>&1');
      console.log('✅ Python available:', stdout.trim());

      // Check for required Python packages
      try {
        await execPromise('python -c "import torch; import cv2; import yolov5"');
        console.log('✅ All Python dependencies available');
        return true;
      } catch {
        console.warn('⚠️ Some Python dependencies missing. Install with:');
        console.warn('   pip install torch torchvision opencv-python yolov5 pillow ultralytics');
        return false;
      }
    } catch (error) {
      console.error('❌ Python not found. Install Python 3.8+');
      return false;
    }
  }

  /**
   * Check if model file exists
   */
  async modelExists(): Promise<boolean> {
    return fs.existsSync(this.modelPath);
  }

  /**
   * Validate a product in an image against expected product
   * 
   * @param imagePath - Path to the image file
   * @param expectedProduct - Expected product name
   * @param confidence - Confidence threshold (0-1)
   * @returns Validation result
   */
  async validateProductInImage(
    imagePath: string,
    expectedProduct: string,
    confidence: number = 0.5
  ): Promise<ValidationResult> {
    try {
      // Validate inputs
      if (!fs.existsSync(imagePath)) {
        return {
          success: false,
          error: 'Image file not found',
          message: `File: ${imagePath}`
        };
      }

      if (!fs.existsSync(this.modelPath)) {
        return {
          success: false,
          error: 'AI Model file not found',
          message: `Model: ${this.modelPath}`
        };
      }

      if (!fs.existsSync(this.pythonScriptPath)) {
        return {
          success: false,
          error: 'AI Validation script not found',
          message: `Script: ${this.pythonScriptPath}`
        };
      }

      // Build command
      const cmd = [
        'python',
        this.pythonScriptPath,
        '--model', this.modelPath,
        '--image', imagePath,
        '--expected-product', expectedProduct,
        '--confidence', confidence.toString()
      ].join(' ');

      console.log(`🔍 Running validation: ${cmd}`);

      const { stdout, stderr } = await execPromise(cmd, {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      if (stderr && !stderr.includes('UserWarning')) {
        console.warn('⚠️ Python stderr:', stderr);
      }

      // Parse JSON result
      try {
        const result = JSON.parse(stdout) as ValidationResult;
        console.log('✅ Validation result:', {
          success: result.success,
          is_valid: result.is_valid,
          confidence: result.confidence,
          message: result.message
        });
        return result;
      } catch (parseError) {
        console.error('❌ Failed to parse Python output:', stdout);
        return {
          success: false,
          error: 'Invalid response from AI service',
          message: stdout
        };
      }

    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Validation error:', errorMsg);

      return {
        success: false,
        error: 'Validation service error',
        message: errorMsg
      };
    }
  }

  /**
   * Detect products in an image without validation
   */
  async detectProducts(imagePath: string, confidence: number = 0.5) {
    try {
      if (!fs.existsSync(imagePath)) {
        return {
          success: false,
          error: 'Image file not found'
        };
      }

      const cmd = [
        'python',
        this.pythonScriptPath,
        '--model', this.modelPath,
        '--image', imagePath,
        '--confidence', confidence.toString()
      ].join(' ');

      const { stdout } = await execPromise(cmd, {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024
      });

      return JSON.parse(stdout);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Detection failed'
      };
    }
  }

  /**
   * Scan a drawer via live camera using YOLO.
   * Returns a list of detected tools with their DB-mapped names.
   */
  async scanDrawer(cameraId: number = 0, confidence: number = 0.35, duration: number = 20) {
    const drawerScanScript = path.join(__dirname, 'drawer_scan.py');

    if (!fs.existsSync(drawerScanScript)) {
      return { success: false, error: 'drawer_scan.py not found' };
    }

    const modelArg = fs.existsSync(this.modelPath) ? `--model "${this.modelPath}"` : '';

    const cmd = [
      'python',
      `"${drawerScanScript}"`,
      `--camera ${cameraId}`,
      modelArg,
      `--conf ${confidence}`,
      `--duration ${duration}`,
    ].filter(Boolean).join(' ');

    console.log(`🔍 Scanning drawer (${duration}s): ${cmd}`);

    try {
      const { stdout, stderr } = await execPromise(cmd, {
        timeout: (duration + 20) * 1000,   // durée + 20 s (chargement modèle ~10 s + marge)
        maxBuffer: 10 * 1024 * 1024,
      });

      if (stderr && !stderr.includes('UserWarning') && !stderr.includes('FutureWarning')) {
        console.warn('⚠️ drawer_scan stderr:', stderr);
      }

      return JSON.parse(stdout);
    } catch (error: any) {
      console.error('❌ Drawer scan error:', error.message);
      return { success: false, error: error.message || 'Scan failed' };
    }
  }
}

export const aiValidationService = new AIValidationService();
export type { ValidationResult, BorrowValidation };
