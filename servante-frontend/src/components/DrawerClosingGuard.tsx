import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, AlertTriangle, CheckCircle, Loader, ShieldAlert, ShieldCheck, Package } from 'lucide-react';
import { API_BASE_URL, hardwareAPI } from '../services/api';

interface Detection {
  class: string;
  confidence: number;
  x: number; y: number; w: number; h: number;
}

interface DetectionResult {
  success: boolean;
  detections: Detection[];
  annotated_image?: string | null;
  error?: string;
}

interface DrawerClosingGuardProps {
  drawerId: '1' | '2' | '3' | '4';
  onComplete: () => void;
  onBorrowStolenTools?: (toolClassNames: string[]) => Promise<void>;
}

const CAPTURE_W = 640;
const CAPTURE_H = 360;
const HAND_CONFIRM_FRAMES = 2;
const CLEAR_CONFIRM_FRAMES = 4;
const GUARD_SECONDS = 15;
const CLOSE_RESUME_SECONDS = 15; // temps accordé après reprise moteur
const DRAWER_CLOSE_MS = 13000;   // durée estimée de fermeture complète du tiroir
const STABILIZE_FRAMES = 3;      // frames to collect before comparison (allow tool visibility before grab)

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

type GuardPhase = 'monitoring' | 'hand-detected' | 'borrow-confirm' | 'alert' | 'safe';

const DISPLAY: Record<string, string> = {
  'Cle 1': 'Clé 1', 'Cle 2': 'Clé 2', 'Cle 3': 'Clé 3', 'Cle 4': 'Clé 4',
  'Cle 5': 'Clé 5', 'Cle 6': 'Clé 6',
  'Cle L petite': 'Clé L petite', 'Cle L grande': 'Clé L grande',
  'Denudeur automatique': 'Dénudeur automatique',
  'Grise coupante': 'Mini pince coupante',
  'Jaune coude': 'Pince à bec coudée',
  'Pince a denuder': 'Pince à dénuder',
  'Pince coude': 'Mini pince à bec demi rond coudée',
  'Pince universelle': 'Pince universelle',
  'Rouge coupante': 'Pince coupante',
  'Tournevis american': 'Tournevis américain',
  'Tournevis plat': 'Tournevis plat',
  'cutteur': 'Cutteur',
  'multimetre': 'Multimètre', 'multimetre fils': 'Multimètre fils',
  'perceuse': 'Perceuse', 'pied coulisse': 'Pied à coulisse',
  'pince plat': 'Mini pince à bec plat', 'pince rond': 'Mini pince à bec rond',
  'rouge plat': 'Pince à bec plat',
};
const displayName = (cls: string) => DISPLAY[cls] ?? cls;

const DrawerClosingGuard: React.FC<DrawerClosingGuardProps> = ({ drawerId, onComplete, onBorrowStolenTools }) => {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const captureRef = useRef<HTMLCanvasElement>(null);

  const isRunningRef        = useRef(true);
  const phaseRef            = useRef<GuardPhase>('monitoring');
  const handCountRef        = useRef(0);
  const clearCountRef       = useRef(0);
  const bestPreHandSnapRef  = useRef<string[]>([]);
  const lastFrameBeforeHandRef = useRef<string[]>([]); // ← FREEZE last frame right before hand detected
  const missingCountRef     = useRef<Record<string, number>>({});
  const stolenRef           = useRef<string[]>([]);
  const timerPausedRef      = useRef(false);

  // Motor state tracking — prevents sending commands to a motor already at end-stop
  const motorRunningRef          = useRef(true);  // true while we believe the motor is still moving
  const motorStoppedByUsRef      = useRef(false); // true if WE issued stopMotors()
  const motorWasRunningAtHandRef = useRef(false); // was motor moving when hand was first confirmed?
  const closeTimerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stabilizingFramesRef     = useRef(0);    // frames after motor stop before comparing

  const [phase,                setPhase]                = useState<GuardPhase>('monitoring');
  const [cameraReady,          setCameraReady]          = useState(false);
  const [annotatedImage,       setAnnotatedImage]       = useState<string | null>(null);
  const [loading,              setLoading]              = useState(false);
  const [serverReady,          setServerReady]          = useState(false);
  const [stolenTools,          setStolenTools]          = useState<string[]>([]);
  const [timeLeft,             setTimeLeft]             = useState(GUARD_SECONDS);
  const [borrowConfirmLoading, setBorrowConfirmLoading] = useState(false);
  const [drawerWasMoving,      setDrawerWasMoving]      = useState(false);

  // Pause timer during borrow-confirm and alert
  useEffect(() => {
    phaseRef.current = phase;
    timerPausedRef.current = phase === 'alert' || phase === 'borrow-confirm';
  }, [phase]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start (or restart) the "motor still running" timer
  const startCloseTimer = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    motorRunningRef.current = true;
    motorStoppedByUsRef.current = false; // reset since we're restarting the motor
    closeTimerRef.current = setTimeout(() => {
      motorRunningRef.current = false; // drawer reached end-stop, motor stopped naturally
    }, DRAWER_CLOSE_MS);
  }, []);

  // Command drawer to close on mount and start motor timer
  useEffect(() => {
    hardwareAPI.closeDrawer(drawerId).catch(() => {});
    startCloseTimer();
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [drawerId, startCloseTimer]);

  // Camera start
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); } catch { return; }
      }
      if (!cancelled && videoRef.current && stream) videoRef.current.srcObject = stream;
      else if (stream) stream.getTracks().forEach(t => t.stop());
    })();
    return () => { cancelled = true; stopCamera(); setCameraReady(false); };
  }, [stopCamera]);

  // Countdown — paused during alert and borrow-confirm
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (timerPausedRef.current) return prev;
        if (prev <= 1) {
          clearInterval(t);
          isRunningRef.current = false;
          stopCamera();
          phaseRef.current = 'safe';
          setPhase('safe');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stopCamera]);

  // safe → call onComplete after brief display
  useEffect(() => {
    if (phase === 'safe') {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  // Detection loop
  useEffect(() => {
    if (!cameraReady) return;
    let active = true;
    (async () => {
      while (active && isRunningRef.current) {
        const video = videoRef.current;
        const canvas = captureRef.current;
        if (!video || !canvas || video.readyState < 2) { await sleep(100); continue; }
        const ctx = canvas.getContext('2d');
        if (!ctx) break;
        ctx.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H);
        const frameData = canvas.toDataURL('image/jpeg', 0.75);
        setLoading(true);
        try {
          const resp = await fetch(`${API_BASE_URL}/detection/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frameData }),
          });
          if (!resp.ok) { await sleep(300); continue; }
          const result: DetectionResult = await resp.json();
          if (!result.success) { await sleep(500); continue; }

          if (result.annotated_image) setAnnotatedImage(result.annotated_image);
          setServerReady(true);

          const dets = result.detections ?? [];
          const hasHand = dets.some(d => d.class.toLowerCase() === 'main');
          const toolClasses = dets
            .filter(d => d.class.toLowerCase() !== 'main')
            .map(d => d.class);

          const cur = phaseRef.current;

          // ── monitoring ──────────────────────────────────────────────────
          if (cur === 'monitoring') {
            if (hasHand) {
              clearCountRef.current = 0;
              handCountRef.current += 1;
              if (handCountRef.current >= HAND_CONFIRM_FRAMES) {
                handCountRef.current = 0;
                missingCountRef.current = {};
                motorWasRunningAtHandRef.current = motorRunningRef.current;
                setDrawerWasMoving(motorRunningRef.current);
                // ← FREEZE the last frame RIGHT NOW before hand detection (most accurate comparison)
                lastFrameBeforeHandRef.current = [...toolClasses];
                if (motorRunningRef.current) {
                  hardwareAPI.stopMotors().catch(() => {});
                  motorStoppedByUsRef.current = true;
                  if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                  motorRunningRef.current = false;
                  // Clear reference and start stabilization period to collect fresh frames
                  // from the now-stationary drawer (before user grabs tools)
                  bestPreHandSnapRef.current = [];
                  stabilizingFramesRef.current = STABILIZE_FRAMES;
                }
                phaseRef.current = 'hand-detected';
                setPhase('hand-detected');
              }
            } else {
              handCountRef.current = 0;
              // Only update the reference when the drawer is stationary.
              if (!motorRunningRef.current && toolClasses.length >= bestPreHandSnapRef.current.length) {
                bestPreHandSnapRef.current = [...toolClasses];
              }
            }
          }

          // ── hand-detected: wait for hand to leave ───────────────────────
          else if (cur === 'hand-detected') {
            // During stabilization: just skip frames until hand position stabilizes
            // Don't update reference — we use lastFrameBeforeHandRef (frozen when hand was first detected)
            if (stabilizingFramesRef.current > 0) {
              stabilizingFramesRef.current--;
            }
            // After stabilization: compare frozen "before hand" frame with current detections
            else if (!hasHand) {
              clearCountRef.current += 1;
              // Compare against the LAST FRAME RIGHT BEFORE hand was detected (most accurate)
              lastFrameBeforeHandRef.current.forEach(cls => {
                const present = toolClasses.some(c => c.toLowerCase() === cls.toLowerCase());
                if (!present) {
                  missingCountRef.current[cls] = (missingCountRef.current[cls] ?? 0) + 1;
                }
              });
              if (clearCountRef.current >= CLEAR_CONFIRM_FRAMES) {
                clearCountRef.current = 0;
                const threshold = Math.ceil(CLEAR_CONFIRM_FRAMES / 2);
                const stolen = lastFrameBeforeHandRef.current.filter(
                  cls => (missingCountRef.current[cls] ?? 0) >= threshold
                );
                missingCountRef.current = {};
                motorWasRunningAtHandRef.current = false;
                setDrawerWasMoving(false);
                lastFrameBeforeHandRef.current = []; // ← Reset for next cycle
                handCountRef.current = 0; // ← Reset hand detection counter
                if (stolen.length > 0) {
                  stolenRef.current = stolen;
                  setStolenTools(stolen);
                  phaseRef.current = 'borrow-confirm';
                  setPhase('borrow-confirm');
                } else {
                  if (motorStoppedByUsRef.current) {
                    hardwareAPI.closeDrawer(drawerId).catch(() => {});
                    startCloseTimer(); // ← This now also resets motorStoppedByUsRef.current
                    setTimeLeft(CLOSE_RESUME_SECONDS);
                  }
                  phaseRef.current = 'monitoring';
                  setPhase('monitoring');
                }
              }
            } else {
              clearCountRef.current = 0;
            }
          }

          // ── alert: wait for stolen tool(s) to come back ─────────────────
          else if (cur === 'alert') {
            const allBack = stolenRef.current.every(
              cls => toolClasses.some(c => c.toLowerCase() === cls.toLowerCase())
            );
            if (allBack && !hasHand) {
              clearCountRef.current += 1;
              if (clearCountRef.current >= CLEAR_CONFIRM_FRAMES) {
                clearCountRef.current = 0;
                stolenRef.current = [];
                setStolenTools([]);
                bestPreHandSnapRef.current = [...toolClasses];
                lastFrameBeforeHandRef.current = []; // ← Reset for next cycle
                missingCountRef.current = {};
                handCountRef.current = 0; // ← Reset hand detection counter
                if (motorStoppedByUsRef.current) {
                  hardwareAPI.closeDrawer(drawerId).catch(() => {});
                  startCloseTimer(); // ← This now also resets motorStoppedByUsRef.current
                  setTimeLeft(CLOSE_RESUME_SECONDS);
                }
                phaseRef.current = 'monitoring';
                setPhase('monitoring');
              }
            } else {
              clearCountRef.current = 0;
            }
          }

        } catch { await sleep(500); }
        finally { setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [cameraReady, drawerId, startCloseTimer]);

  // ── Handlers borrow-confirm ───────────────────────────────────────────────

  const handleConfirmBorrow = async () => {
    setBorrowConfirmLoading(true);
    try {
      await onBorrowStolenTools?.(stolenRef.current);
    } finally {
      setBorrowConfirmLoading(false);
    }
    stolenRef.current = [];
    setStolenTools([]);
    lastFrameBeforeHandRef.current = []; // ← Reset for next cycle
    missingCountRef.current = {}; // ← Reset missing count
    handCountRef.current = 0; // ← Reset hand detection counter
    clearCountRef.current = 0; // ← Reset clear counter
    if (motorStoppedByUsRef.current) {
      hardwareAPI.closeDrawer(drawerId).catch(() => {});
      startCloseTimer(); // ← This now also resets motorStoppedByUsRef.current
      setTimeLeft(CLOSE_RESUME_SECONDS);
    }
    phaseRef.current = 'monitoring';
    setPhase('monitoring');
  };

  const handleDeclineBorrow = () => {
    phaseRef.current = 'alert';
    setPhase('alert');
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const borderColor =
    phase === 'alert'            ? 'border-red-500'
    : phase === 'borrow-confirm' ? 'border-blue-500'
    : phase === 'hand-detected'  ? 'border-amber-500'
    : phase === 'safe'           ? 'border-green-500'
    : 'border-blue-300';

  const bgColor =
    phase === 'alert'            ? 'from-red-50 via-white to-orange-50'
    : phase === 'borrow-confirm' ? 'from-blue-50 via-white to-indigo-50'
    : phase === 'hand-detected'  ? 'from-amber-50 via-white to-orange-50'
    : phase === 'safe'           ? 'from-green-50 via-white to-blue-50'
    : 'from-blue-50 via-white to-slate-50';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} flex items-center justify-center p-6`}>
      <div className={`max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 border-2 ${borderColor} transition-colors duration-500`}>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-5">
          {phase === 'safe' ? (
            <ShieldCheck className="w-12 h-12 text-green-500" />
          ) : phase === 'alert' ? (
            <ShieldAlert className="w-12 h-12 text-red-500" />
          ) : phase === 'borrow-confirm' ? (
            <Package className="w-12 h-12 text-blue-500" />
          ) : phase === 'hand-detected' ? (
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
          ) : (
            <ShieldCheck className="w-12 h-12 text-blue-400" />
          )}
          <h2 className="text-2xl font-bold text-slate-900">
            {phase === 'safe'            ? 'Fermeture sécurisée'
            : phase === 'alert'          ? 'Remettez l\'outil dans le tiroir'
            : phase === 'borrow-confirm' ? 'Outil retiré — emprunt ?'
            : phase === 'hand-detected'  ? (drawerWasMoving ? 'Tiroir en mouvement' : 'Main détectée — analyse en cours')
            : 'Surveillance de fermeture'}
          </h2>
          <p className="text-sm text-slate-500 text-center">
            {phase === 'safe'
              ? 'Aucune anomalie détectée. Le tiroir est sécurisé.'
              : phase === 'alert'
              ? 'Remettez l\'outil dans le tiroir pour reprendre la fermeture.'
              : phase === 'borrow-confirm'
              ? 'Un outil a été retiré pendant la fermeture. Souhaitez-vous l\'emprunter ?'
              : phase === 'hand-detected'
              ? (drawerWasMoving
                  ? 'Le tiroir est encore en train de se fermer — retirez votre main.'
                  : 'Main détectée — Retirez votre main pour analyser le contenu du tiroir.')
              : `Tiroir ${drawerId} — surveillance active pendant la fermeture`}
          </p>
        </div>

        {/* Borrow confirm panel */}
        {phase === 'borrow-confirm' && (
          <div className="mb-4 rounded-xl border-2 border-blue-400 bg-blue-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-3">
              Outil(s) retiré(s) lors de la fermeture
            </p>
            <ul className="space-y-1.5 mb-4">
              {stolenTools.map(cls => (
                <li key={cls} className="flex items-center gap-2 text-sm font-semibold text-blue-900 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2">
                  <Package className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{displayName(cls)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm font-semibold text-blue-800 mb-3 text-center">
              Voulez-vous emprunter {stolenTools.length > 1 ? 'ces outils' : 'cet outil'} ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmBorrow}
                disabled={borrowConfirmLoading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {borrowConfirmLoading
                  ? <Loader className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Oui, emprunter
              </button>
              <button
                onClick={handleDeclineBorrow}
                disabled={borrowConfirmLoading}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-slate-600" />
                Non, remettre
              </button>
            </div>
          </div>
        )}

        {/* Alert banner */}
        {phase === 'alert' && (
          <div className="mb-4 rounded-xl border-2 border-red-400 bg-red-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">
              Outil(s) à remettre dans le tiroir
            </p>
            <ul className="space-y-1.5">
              {stolenTools.map(cls => (
                <li key={cls} className="flex items-center gap-2 text-sm font-semibold text-red-800 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  Remettez <span className="font-bold ml-1">"{displayName(cls)}"</span> dans le tiroir
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-600 mt-2 text-center">
              La fermeture reprendra automatiquement dès la détection du retour.
            </p>
          </div>
        )}

        {/* Hand detected banner */}
        {phase === 'hand-detected' && (
          <div className="mb-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-3 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm font-bold text-amber-800">
              {drawerWasMoving
                ? 'Tiroir en mouvement — retirez votre main pour reprendre la fermeture.'
                : 'Main détectée — Retirez votre main pour analyser le contenu du tiroir.'}
            </p>
          </div>
        )}

        {/* Camera feed */}
        {phase !== 'safe' && (
          <div className={`relative bg-black rounded-2xl overflow-hidden border-4 shadow-lg mb-4 transition-colors duration-300 ${borderColor}`}
            style={{ aspectRatio: '16/9' }}>
            <video ref={videoRef} autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: cameraReady && !annotatedImage ? 1 : 0 }}
              onCanPlay={() => setCameraReady(true)}
            />
            <canvas ref={captureRef} className="hidden" width={CAPTURE_W} height={CAPTURE_H} />
            {annotatedImage && (
              <img src={`data:image/jpeg;base64,${annotatedImage}`} alt="YOLO"
                className="absolute inset-0 w-full h-full object-cover" />
            )}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                <Camera className="w-10 h-10 text-slate-500 mb-3" />
                <p className="text-slate-400 text-sm">Initialisation caméra...</p>
              </div>
            )}
            {cameraReady && !serverReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                <Loader className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
                <p className="text-slate-300 text-sm">Chargement YOLO...</p>
              </div>
            )}
            {loading && serverReady && (
              <div className="absolute top-3 left-3 bg-blue-600/85 px-2 py-1 rounded-lg flex items-center gap-2 z-20">
                <Loader className="w-3 h-3 text-white animate-spin" />
                <span className="text-white text-xs font-medium">YOLO...</span>
              </div>
            )}
            {phase === 'monitoring' && (
              <div className="absolute top-3 right-3 bg-black/70 rounded-full w-12 h-12 flex items-center justify-center z-20">
                <span className="text-xl font-bold text-white">{timeLeft}</span>
              </div>
            )}
          </div>
        )}

        {/* Safe state */}
        {phase === 'safe' && (
          <div className="rounded-xl p-6 border-2 border-green-400 bg-green-50 flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <p className="text-lg font-bold text-green-800">Fermeture sécurisée ✓</p>
            <p className="text-sm text-green-600">Aucun outil supplémentaire détecté.</p>
          </div>
        )}

        {/* Status indicator — monitoring */}
        {phase === 'monitoring' && serverReady && (
          <div className="rounded-xl p-3 border border-green-300 bg-green-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs font-semibold text-green-800">
              Surveillance active — aucune main détectée dans le tiroir
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawerClosingGuard;
