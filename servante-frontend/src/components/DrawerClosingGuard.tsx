import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, AlertTriangle, CheckCircle, Loader, ShieldAlert, ShieldCheck, Package, XCircle } from 'lucide-react';
import { hardwareAPI, API_BASE_URL } from '../services/api';
import { useDrawerCamera } from './DrawerCameraContext';

interface DrawerTool { id: string; name: string; drawer: string; }

interface DrawerClosingGuardProps {
  drawerId: '1' | '2' | '3' | '4';
  onComplete: () => void;
  onBorrowStolenTools?: (toolClassNames: string[]) => Promise<void>;
}

const HAND_CONFIRM_FRAMES  = 2;
const CLEAR_CONFIRM_FRAMES = 4;
const GUARD_SECONDS        = 15;
const CLOSE_RESUME_SECONDS = 15;
const DRAWER_CLOSE_MS      = 13000;
const STABILIZE_FRAMES     = 3;
const TOOL_CONFIRM_FRAMES  = 3;

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
  'Rouge plat': 'Pince à bec plat',
};
const displayName = (cls: string) => DISPLAY[cls] ?? cls;

const DrawerClosingGuard: React.FC<DrawerClosingGuardProps> = ({ drawerId, onComplete, onBorrowStolenTools }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const camCtx = useDrawerCamera();

  // Derive camera state from shared context — camera is already running.
  const cameraReady    = camCtx?.cameraReady     ?? false;
  const serverReady    = camCtx?.serverReady      ?? false;
  const annotatedImage = camCtx?.annotatedImage   ?? null;
  const latestDets     = camCtx?.latestDetections ?? [];

  const isRunningRef             = useRef(true);
  const phaseRef                 = useRef<GuardPhase>('monitoring');
  const handCountRef             = useRef(0);
  const clearCountRef            = useRef(0);
  const bestPreHandSnapRef       = useRef<string[]>([]);
  const lastFrameBeforeHandRef   = useRef<string[]>([]);
  const missingCountRef          = useRef<Record<string, number>>({});
  const stolenRef                = useRef<string[]>([]);
  const timerPausedRef           = useRef(false);
  const borrowAutoTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBorrowStolenToolsRef   = useRef(onBorrowStolenTools);

  // Drawer-specific tool list — used to filter YOLO detections
  const drawerToolsRef = useRef<DrawerTool[]>([]);

  const motorRunningRef          = useRef(true);
  const motorStoppedByUsRef      = useRef(false);
  const motorWasRunningAtHandRef = useRef(false);
  const closeTimerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stabilizingFramesRef     = useRef(0);
  const preHandToolCountRef      = useRef<Record<string, number>>({});

  const [phase,                setPhase]                = useState<GuardPhase>('monitoring');
  const [stolenTools,          setStolenTools]          = useState<string[]>([]);
  const [timeLeft,             setTimeLeft]             = useState(GUARD_SECONDS);
  const [borrowConfirmLoading, setBorrowConfirmLoading] = useState(false);
  const [drawerWasMoving,      setDrawerWasMoving]      = useState(false);
  const [autoBorrowCountdown,  setAutoBorrowCountdown]  = useState(8);

  useEffect(() => { onBorrowStolenToolsRef.current = onBorrowStolenTools; }, [onBorrowStolenTools]);

  useEffect(() => {
    phaseRef.current       = phase;
    timerPausedRef.current = phase === 'alert' || phase === 'borrow-confirm';
  }, [phase]);

  const startCloseTimer = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    motorRunningRef.current     = true;
    motorStoppedByUsRef.current = false;
    closeTimerRef.current = setTimeout(() => {
      motorRunningRef.current = false;
    }, DRAWER_CLOSE_MS);
  }, []);

  // Auto-borrow countdown when borrow-confirm phase is active.
  useEffect(() => {
    if (phase !== 'borrow-confirm') return;
    setAutoBorrowCountdown(8);
    let isActive = true;
    const timer = setInterval(() => {
      setAutoBorrowCountdown(prev => {
        if (prev <= 1 && isActive) {
          clearInterval(timer);
          if (stolenRef.current.length > 0) {
            (async () => {
              setBorrowConfirmLoading(true);
              try {
                await onBorrowStolenToolsRef.current?.(stolenRef.current.map(displayName));
              } catch (error) {
                console.error('Error borrowing tools:', error);
              } finally {
                setBorrowConfirmLoading(false);
              }
              stolenRef.current = [];
              setStolenTools([]);
              lastFrameBeforeHandRef.current = [];
              if (motorStoppedByUsRef.current) {
                hardwareAPI.closeDrawer(drawerId).catch(() => {});
                motorStoppedByUsRef.current = false;
                startCloseTimer();
                setTimeLeft(CLOSE_RESUME_SECONDS);
              }
              preHandToolCountRef.current = {};
              phaseRef.current = 'monitoring';
              setPhase('monitoring');
            })();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    borrowAutoTimerRef.current = timer as any;
    return () => {
      isActive = false;
      clearInterval(timer);
      borrowAutoTimerRef.current = null;
    };
  }, [phase, drawerId, startCloseTimer]);

  // Fetch drawer-specific tools so we can filter detections to this drawer only.
  useEffect(() => {
    fetch(`${API_BASE_URL}/tools`)
      .then(r => r.json())
      .then(data => {
        drawerToolsRef.current = (data.data || []).filter(
          (t: DrawerTool) => String(t.drawer) === String(drawerId)
        );
      })
      .catch(() => {});
  }, [drawerId]);

  // Start closing the drawer on mount and arm the motor timer.
  useEffect(() => {
    hardwareAPI.closeDrawer(drawerId).catch(() => {});
    startCloseTimer();
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (borrowAutoTimerRef.current) clearTimeout(borrowAutoTimerRef.current);
    };
  }, [drawerId, startCloseTimer]);

  // Attach the shared stream to our display video element.
  useEffect(() => {
    if (camCtx?.stream && videoRef.current) {
      videoRef.current.srcObject = camCtx.stream;
    }
  }, [camCtx?.stream]);

  // Countdown — paused during borrow-confirm and alert.
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (timerPausedRef.current) return prev;
        if (prev <= 1) {
          clearInterval(t);
          isRunningRef.current = false;
          phaseRef.current = 'safe';
          setPhase('safe');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // safe → call onComplete after brief display; camera stays alive (context owns it).
  useEffect(() => {
    if (phase === 'safe') {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  // ── Detection state-machine driven by the shared context loop ──────────────
  useEffect(() => {
    if (!cameraReady || !serverReady || !isRunningRef.current) return;

    const dets        = latestDets;
    const hasHand     = dets.some(d => d.class.toLowerCase() === 'main');
    const allToolDets = dets.filter(d => d.class.toLowerCase() !== 'main');
    // Keep only tools that belong to this drawer (ignore tools from other drawers)
    const drawerNames = drawerToolsRef.current.map(t => t.name.toLowerCase());
    const toolClasses = (drawerNames.length > 0
      ? allToolDets.filter(d => drawerNames.includes((DISPLAY[d.class] ?? d.class).toLowerCase()))
      : allToolDets
    ).map(d => d.class);

    const cur = phaseRef.current;

    // ── monitoring ────────────────────────────────────────────────────────
    if (cur === 'monitoring') {
      if (hasHand) {
        clearCountRef.current = 0;
        handCountRef.current += 1;
        if (handCountRef.current >= HAND_CONFIRM_FRAMES) {
          handCountRef.current = 0;
          missingCountRef.current = {};
          motorWasRunningAtHandRef.current = motorRunningRef.current;
          setDrawerWasMoving(motorRunningRef.current);
          const confirmedTools = Object.keys(preHandToolCountRef.current)
            .filter(cls => preHandToolCountRef.current[cls] >= TOOL_CONFIRM_FRAMES);
          lastFrameBeforeHandRef.current = confirmedTools.length > 0 ? confirmedTools : [...toolClasses];
          preHandToolCountRef.current = {};
          if (motorRunningRef.current) {
            hardwareAPI.stopMotors().catch(() => {});
            motorStoppedByUsRef.current = true;
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            motorRunningRef.current = false;
            bestPreHandSnapRef.current = [];
            stabilizingFramesRef.current = STABILIZE_FRAMES;
          }
          phaseRef.current = 'hand-detected';
          setPhase('hand-detected');
        }
      } else {
        handCountRef.current = 0;
        if (!motorRunningRef.current) {
          toolClasses.forEach(cls => {
            preHandToolCountRef.current[cls] = (preHandToolCountRef.current[cls] ?? 0) + 1;
          });
          if (toolClasses.length >= bestPreHandSnapRef.current.length) {
            bestPreHandSnapRef.current = [...toolClasses];
          }
        }
      }
    }

    // ── hand-detected: wait for hand to leave ─────────────────────────────
    else if (cur === 'hand-detected') {
      if (stabilizingFramesRef.current > 0) {
        stabilizingFramesRef.current--;
      } else if (!hasHand) {
        clearCountRef.current += 1;
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
          lastFrameBeforeHandRef.current = [];
          handCountRef.current = 0;
          if (stolen.length > 0) {
            stolenRef.current = stolen;
            setStolenTools(stolen);
            phaseRef.current = 'borrow-confirm';
            setPhase('borrow-confirm');
          } else {
            if (motorStoppedByUsRef.current) {
              hardwareAPI.closeDrawer(drawerId).catch(() => {});
              startCloseTimer();
              setTimeLeft(CLOSE_RESUME_SECONDS);
            }
            preHandToolCountRef.current = {};
            phaseRef.current = 'monitoring';
            setPhase('monitoring');
          }
        }
      } else {
        clearCountRef.current = 0;
      }
    }

    // ── alert: wait for stolen tool(s) to come back ───────────────────────
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
          lastFrameBeforeHandRef.current = [];
          missingCountRef.current = {};
          handCountRef.current = 0;
          if (motorStoppedByUsRef.current) {
            hardwareAPI.closeDrawer(drawerId).catch(() => {});
            startCloseTimer();
            setTimeLeft(CLOSE_RESUME_SECONDS);
          }
          preHandToolCountRef.current = {};
          phaseRef.current = 'monitoring';
          setPhase('monitoring');
        }
      } else {
        clearCountRef.current = 0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestDets, cameraReady, serverReady, drawerId, startCloseTimer]);

  // ── Borrow-confirm handlers ───────────────────────────────────────────────

  const handleConfirmBorrow = async () => {
    if (borrowAutoTimerRef.current) {
      clearTimeout(borrowAutoTimerRef.current);
      borrowAutoTimerRef.current = null;
    }
    setBorrowConfirmLoading(true);
    try {
      await onBorrowStolenToolsRef.current?.(stolenRef.current.map(displayName));
    } catch (error) {
      console.error('Error borrowing tools:', error);
    } finally {
      setBorrowConfirmLoading(false);
    }
    stolenRef.current = [];
    setStolenTools([]);
    lastFrameBeforeHandRef.current = [];
    if (motorStoppedByUsRef.current) {
      hardwareAPI.closeDrawer(drawerId).catch(() => {});
      motorStoppedByUsRef.current = false;
      startCloseTimer();
      setTimeLeft(CLOSE_RESUME_SECONDS);
    }
    preHandToolCountRef.current = {};
    phaseRef.current = 'monitoring';
    setPhase('monitoring');
  };

  const handleDeclineBorrow = () => {
    if (borrowAutoTimerRef.current) {
      clearTimeout(borrowAutoTimerRef.current);
      borrowAutoTimerRef.current = null;
    }
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
            <p className="text-xs text-blue-600 mb-3 text-center font-medium">
              Auto-confirmation dans {autoBorrowCountdown}s si vous ne cliquez pas
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
            />
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

        {/* Manual close button — forces immediate drawer close as emergency fallback */}
        {phase !== 'safe' && (
          <button
            onClick={() => {
              isRunningRef.current = false;
              hardwareAPI.closeDrawer(drawerId).catch(() => {});
              onComplete();
            }}
            className="mt-4 w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-slate-300"
          >
            <XCircle className="w-4 h-4 text-slate-500" />
            Fermer le tiroir manuellement
          </button>
        )}
      </div>
    </div>
  );
};

export default DrawerClosingGuard;
