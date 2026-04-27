import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, AlertCircle, Loader, CheckCircle, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import { API_BASE_URL, hardwareAPI } from '../services/api';

interface RealtimeDetectionProps {
  toolName: string;
  borrowId: string;
  drawerId?: string;
  action?: 'borrow' | 'return';
  isRetry?: boolean;
  initialSnapshot?: Detection[];
  onDetectionSuccess: () => void;
  onDetectionFailure: (reason: string) => void;
  onRetry: () => void;
  onBorrowAlternative?: (wrongToolName: string) => void;
  onExtraToolsDetected?: (extraToolNames: string[]) => void;
}

interface Detection {
  class: string;
  confidence: number;
  polygon?: number[][];
  x: number; y: number; w: number; h: number;
}

interface DetectionResult {
  success: boolean;
  detections: Detection[];
  annotated_image?: string | null;
  error?: string;
}

interface DrawerTool {
  id: string;
  name: string;
  drawer: string;
  availableQuantity: number;
  totalQuantity: number;
}

// ── Mapping noms modèle → noms d'affichage ────────────────────────────────
const CLASS_DISPLAY_NAMES: Record<string, string> = {
  'Cle 1':                 'Clé 1',
  'Cle 2':                 'Clé 2',
  'Cle 3':                 'Clé 3',
  'Cle 4':                 'Clé 4',
  'Cle 5':                 'Clé 5',
  'Cle 6':                 'Clé 6',
  'Cle L petite':          'Clé L petite',
  'Cle L grande':          'Clé L grande',
  'Denudeur automatique':  'Dénudeur automatique',
  'Grise coupante':        'Mini pince coupante',
  'Jaune coude':           'Pince à bec coudée',
  'Pince a denuder':       'Pince à dénuder',
  'Pince coude':           'Mini pince à bec demi rond coudée',
  'Pince universelle':     'Pince universelle',
  'Rouge coupante':        'Pince coupante',
  'Tournevis american':    'Tournevis américain',
  'Tournevis plat':        'Tournevis plat',
  'cutteur':               'Cutteur',
  'multimetre':            'Multimètre',
  'multimetre fils':       'Multimètre fils',
  'perceuse':              'Perceuse',
  'pied coulisse':         'Pied à coulisse',
  'pince plat':            'Mini pince à bec plat',
  'pince rond':            'Mini pince à bec rond',
  'rouge plat':            'Pince à bec plat',
};

const getDisplayName = (raw: string) => {
  const entry = Object.entries(CLASS_DISPLAY_NAMES).find(
    ([k]) => k.toLowerCase() === raw.toLowerCase()
  );
  return entry ? entry[1] : raw;
};

const toDisplayNames = (dets: Detection[]) =>
  dets.map(d => getDisplayName(d.class));

const normalize = (s: string) =>
  s.toLowerCase().trim().replace(/-/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '');


const DURATION       = 35; // initial borrow/return
const RETRY_DURATION = 20; // after wrong tool taken and retrying
const ACTION_PHASE_SECONDS = 10;
const DRAWER_OPEN_TRAVEL_SECONDS = Number(import.meta.env.VITE_DRAWER_OPEN_TRAVEL_SECONDS ?? 4);
const HAND_CONFIRM_FRAMES = 2;
const CLEAR_CONFIRM_FRAMES = 4;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

type Phase = 'hand-detection' | 'hand-detected' | 'alert' | 'detecting' | 'phase1-blocked' | 'comparing' | 'confirming' | 'return-wrong-tool';

type P1Result = ReturnType<typeof phase1Conformity>;

// ── Helper: phase 1 DB conformity ────────────────────────────────────────────
function phase1Conformity(
  snap1Names: string[],
  drawerTools: DrawerTool[],
  toolName: string,
  action: 'borrow' | 'return',
) {
  // Expected in drawer = tools currently available (availableQty > 0)
  // For borrow: target is available → included
  // For return: target was borrowed (availableQty = 0) → excluded automatically
  const expected = drawerTools
    .filter(t => t.availableQuantity > 0)
    .map(t => t.name);

  const missing    = expected.filter(e => !snap1Names.some(s => normalize(s) === normalize(e)));
  const unexpected = snap1Names.filter(s => !drawerTools.some(t => normalize(t.name) === normalize(s)));
  const ok         = missing.length === 0 && unexpected.length === 0;
  return { ok, expected, missing, unexpected };
}

// ── Helper: phase 2 action result (diff snap1→snap2) ─────────────────────────
type DetectionStatus =
  | { code: 'C1' | 'C2'; ok: true; message: string }
  | { code: 'E1'; ok: false; message: string; canRetry: boolean; wrongToolName: string }
  | { code: 'E2' | 'E4' | 'E6'; ok: false; message: string; canRetry: boolean }
  | { code: 'E3'; ok: false; message: string; canRetry: boolean; extraToolNames: string[] };

function phase2Status(
  snap1Names: string[],
  snap2Names: string[],
  toolName: string,
  action: 'borrow' | 'return',
): DetectionStatus {
  if (action === 'borrow') {
    const taken      = snap1Names.filter(s => !snap2Names.some(s2 => normalize(s2) === normalize(s)));
    const targetTaken = taken.some(s => normalize(s) === normalize(toolName));
    const wrongTaken  = taken.filter(s => normalize(s) !== normalize(toolName));

    if (wrongTaken.length > 0 && targetTaken)
      return { code: 'E3', ok: false, message: `Plusieurs outils pris simultanément : ${taken.join(', ')}.`, canRetry: true, extraToolNames: wrongTaken };
    if (wrongTaken.length > 0 && !targetTaken)
      return { code: 'E1', ok: false, message: `Mauvais outil pris : "${wrongTaken[0]}" au lieu de "${toolName}".`, canRetry: true, wrongToolName: wrongTaken[0] };
    if (!targetTaken)
      return { code: 'E2', ok: false, message: `"${toolName}" n'a pas été retiré du tiroir.`, canRetry: false };
    return { code: 'C1', ok: true, message: `"${toolName}" a bien été pris. Emprunt confirmé.` };
  } else {
    const returned       = snap2Names.filter(s => !snap1Names.some(s1 => normalize(s1) === normalize(s)));
    const targetReturned = returned.some(s => normalize(s) === normalize(toolName));
    const wrongReturned  = returned.filter(s => normalize(s) !== normalize(toolName));

    if (wrongReturned.length > 0 && !targetReturned)
      return { code: 'E4', ok: false, message: `Mauvais outil retourné : "${wrongReturned[0]}" au lieu de "${toolName}".`, canRetry: true };
    if (!targetReturned)
      return { code: 'E6', ok: false, message: `"${toolName}" n'a pas été replacé dans le tiroir.`, canRetry: true };
    return { code: 'C2', ok: true, message: `"${toolName}" a bien été retourné. Retour confirmé.` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const CAPTURE_W = 640;
const CAPTURE_H = 360;

const RealtimeDetection: React.FC<RealtimeDetectionProps> = ({
  toolName, drawerId, action = 'borrow', isRetry = false, initialSnapshot, onDetectionSuccess, onDetectionFailure, onRetry, onBorrowAlternative, onExtraToolsDetected,
}) => {
  // Shorter timer only for borrow retries (quick re-pick); returns always need full time
  const drawerTravelSeconds = Math.max(1, DRAWER_OPEN_TRAVEL_SECONDS);

  // If initialSnapshot provided (from DrawerOpeningGuard), skip hand-detection and go straight to action phase (10s)
  const hasInitialSnapshot = initialSnapshot && initialSnapshot.length > 0;
  const totalDuration = hasInitialSnapshot
    ? ACTION_PHASE_SECONDS  // Just the 10s action phase
    : (isRetry && action === 'borrow')
    ? RETRY_DURATION
    : !isRetry && drawerId
    ? drawerTravelSeconds + ACTION_PHASE_SECONDS
    : DURATION;
  const actionStartAt = ACTION_PHASE_SECONDS;
  const isHandDetectionPhase = !hasInitialSnapshot && !isRetry && Boolean(drawerId); // Skip hand-detection if we have initial snapshot
  const initialPhase: Phase = isHandDetectionPhase ? 'hand-detection' : 'detecting';
  const videoRef   = useRef<HTMLVideoElement>(null);
  const captureRef = useRef<HTMLCanvasElement>(null);

  const isRunningRef         = useRef(true);
  const lastDetectionsRef    = useRef<Detection[]>([]);
  const snapshot1SavedRef    = useRef(false);
  const bestSnapshot1Ref     = useRef<Detection[]>([]); // best frame during phase 1 (most tools)
  const bestSnapshot2Ref     = useRef<Detection[]>([]); // best frame during phase 2 (for return: most tools = returned tool present)
  const snapshot2Ref         = useRef<Detection[]>([]);
  const timerPausedRef       = useRef(false);
  const cancelPendingToolRef    = useRef<string | null>(null);
  const returnConfirmCountRef   = useRef(0); // consecutive frames where wrong tool detected in drawer
  const actionRef               = useRef(action);
  const phaseRef                = useRef<Phase>(initialPhase);
  // ── Hand detection refs (from DrawerOpeningGuard) ───────────────────────
  const handCountRef         = useRef(0);
  const clearCountRef        = useRef(0);
  const bestPreHandSnapRef   = useRef<string[]>([]);
  const lastFrameBeforeHandRef = useRef<string[]>([]); // ← FREEZE frame before hand detected (for return action)
  const missingCountRef      = useRef<Record<string, number>>({});
  const stolenRef            = useRef<string[]>([]);
  // ── Drawer state tracking for return action (matches DrawerClosingGuard pattern) ──
  const drawerStoppedByUsRef = useRef(false); // true if WE issued stop on drawer
  const drawerOpenCommandSentRef = useRef(false); // true if we already sent the open command during this cycle (NEVER send twice)
  const drawerOpenTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimeLeftRef    = useRef(totalDuration);

  const [phase,             setPhase]             = useState<Phase>(initialPhase);
  const [timeRemaining,     setTimeRemaining]     = useState(totalDuration);
  const [detections,        setDetections]        = useState<Detection[]>([]);
  const [snapshot1,         setSnapshot1]         = useState<Detection[]>([]);
  const [annotatedImage,    setAnnotatedImage]    = useState<string | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [cameraReady,       setCameraReady]       = useState(false);
  const [serverReady,       setServerReady]       = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [drawerTools,       setDrawerTools]       = useState<DrawerTool[]>([]);
  const [loadingDrawer,     setLoadingDrawer]     = useState(false);
  const [phase1Result,      setPhase1Result]      = useState<P1Result | null>(null);
  const [cancelPendingTool, setCancelPendingTool] = useState<string | null>(null);
  const [cameraRestartKey,  setCameraRestartKey]  = useState(0);
  // ── Hand detection states ───────────────────────────────────────────────
  const [stolenTools,       setStolenTools]       = useState<string[]>([]);

  // Keep refs in sync — lastDetectionsRef is also updated directly in the loop to avoid React render delay
  useEffect(() => { lastDetectionsRef.current = detections; }, [detections]);
  useEffect(() => { cancelPendingToolRef.current = cancelPendingTool; }, [cancelPendingTool]);
  useEffect(() => { actionRef.current = action; }, [action]);
  useEffect(() => {
    phaseRef.current = phase;
    timerPausedRef.current = phase === 'hand-detected' || phase === 'alert';
  }, [phase]);
  const serverReadyRef = useRef(false);
  useEffect(() => { serverReadyRef.current = serverReady; }, [serverReady]);

  // ── Initialize with snapshot from DrawerOpeningGuard (if provided) ──────────
  useEffect(() => {
    if (initialSnapshot && initialSnapshot.length > 0) {
      bestSnapshot1Ref.current = [...initialSnapshot];
      snapshot1SavedRef.current = true;
      setSnapshot1([...initialSnapshot]);
    }
  }, [initialSnapshot]);

  // ── Fetch drawer tools on mount (needed for live phase-1 indicator) ────────
  useEffect(() => {
    if (!drawerId) return;
    setLoadingDrawer(true);
    fetch(`${API_BASE_URL}/tools`)
      .then(r => r.json())
      .then(data => setDrawerTools(
        (data.data || []).filter((t: DrawerTool) => String(t.drawer) === String(drawerId))
      ))
      .catch(() => setDrawerTools([]))
      .finally(() => setLoadingDrawer(false));
  }, [drawerId]);

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Return wrong tool then cancel: restart camera and wait for detection ────
  const handleReturnAndCancel = useCallback((wrongToolName: string) => {
    cancelPendingToolRef.current = wrongToolName;
    setCancelPendingTool(wrongToolName);
    isRunningRef.current = true;
    snapshot1SavedRef.current = true; // don't save snapshots in this mode
    bestSnapshot1Ref.current = [];
    bestSnapshot2Ref.current = [];
    returnConfirmCountRef.current = 0;
    timerPausedRef.current = false;
    setDetections([]);
    setAnnotatedImage(null);
    setServerReady(false);
    setPhase('return-wrong-tool');
    setCameraRestartKey(k => k + 1);
  }, []);

  // Transition from drawer travel / hand detection to tool action.
  useEffect(() => {
    if (timeRemaining === actionStartAt && !snapshot1SavedRef.current) {
      // The travel duration is configurable to match the real motor course.
      if (phase === 'hand-detection') {
        setPhase('detecting');
      }
      // UNLOCK the drawer open command for the next cycle
      drawerOpenCommandSentRef.current = false;
      // Freeze best snapshot for Phase 2 comparison
      snapshot1SavedRef.current = true;
      const best = bestSnapshot1Ref.current.length > 0 ? bestSnapshot1Ref.current : lastDetectionsRef.current;
      if (drawerTools.length > 0 && best.length > 0) {
        const snap1Names = toDisplayNames(best);
        const p1 = phase1Conformity(snap1Names, drawerTools, toolName, action);
        setPhase1Result(p1); // kept for display, never blocks
      }
    }
  }, [timeRemaining, drawerTools, toolName, action, phase, actionStartAt]);

  // ── Timer end: capture snap2 explicitly, then show comparison ───────────────
  const onTimerEnd = useCallback(() => {
    // For return: use best Phase 2 snapshot (most tools = returned tool is present).
    // For borrow: use last detection (fewer tools = borrowed tool is gone).
    // lastDetectionsRef is updated directly in the loop (no React render delay).
    if (actionRef.current === 'return' && bestSnapshot2Ref.current.length > 0) {
      snapshot2Ref.current = [...bestSnapshot2Ref.current];
    } else {
      snapshot2Ref.current = [...lastDetectionsRef.current];
    }
    if (!drawerId) { onDetectionSuccess(); return; }
    // Keep detection running (isRunningRef.current stays true) so camera continues detecting during comparison
    setPhase('comparing');
  }, [drawerId, onDetectionSuccess]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (timerPausedRef.current) return prev;
        // Freeze Phase 1 countdown until YOLO gives its first response (model loaded)
        if (!serverReadyRef.current && prev > actionStartAt) return prev;
        if (prev <= 1) { clearInterval(timer); onTimerEnd(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTimerEnd, actionStartAt]);

  // ── Cleanup drawer timer on unmount (for return action) ────────────────────
  useEffect(() => {
    // Reset drawer open command lock on fresh mount or action change
    drawerOpenCommandSentRef.current = false;
    return () => {
      if (drawerOpenTimerRef.current) clearTimeout(drawerOpenTimerRef.current);
    };
  }, [action]);

  // ── Start camera (rear on mobile, any camera on desktop) ─────────────────
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {
          if (!cancelled) {
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            isRunningRef.current = false;
          }
          return;
        }
      }
      if (!cancelled && videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      } else if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
    start();
    return () => {
      cancelled = true;
      stopCamera();
      setCameraReady(false);
    };
  }, [stopCamera, cameraRestartKey]);

  // ── Continuous detection loop ──────────────────────────────────────────────
  useEffect(() => {
    if (!cameraReady) return;
    let active = true;
    const loop = async () => {
      while (active && isRunningRef.current) {
        const video  = videoRef.current;
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
          if (resp.ok) {
            const result: DetectionResult = await resp.json();
            if (result.success) {
              if (result.annotated_image) setAnnotatedImage(result.annotated_image);
              if (result.detections) {
                // Strip hand detections — "main" is never a borrowable tool
                const hasHand = result.detections.some(d => d.class.toLowerCase() === 'main');
                const toolDets = result.detections.filter(d => d.class.toLowerCase() !== 'main');
                const toolNames = toDisplayNames(toolDets);
                const currentPhase = phaseRef.current;
                // Update ref directly (no React render delay) so onTimerEnd always gets latest
                lastDetectionsRef.current = toolDets;
                setDetections(toolDets);
                if (currentPhase === 'hand-detection') {
                  if (hasHand) {
                    clearCountRef.current = 0;
                    handCountRef.current += 1;
                    if (handCountRef.current >= HAND_CONFIRM_FRAMES) {
                      handCountRef.current = 0;
                      missingCountRef.current = {};
                      // ← FREEZE the last frame RIGHT NOW before hand confirmed (for accurate return detection)
                      lastFrameBeforeHandRef.current = [...toolNames];
                      setPhase('hand-detected');
                    }
                  } else {
                    handCountRef.current = 0;
                    if (toolNames.length >= bestPreHandSnapRef.current.length) {
                      bestPreHandSnapRef.current = [...toolNames];
                    }
                  }
                } else if (currentPhase === 'hand-detected') {
                  if (!hasHand) {
                    clearCountRef.current += 1;
                    // Compare against LAST FRAME RIGHT BEFORE hand was detected (for return: most accurate)
                    lastFrameBeforeHandRef.current.forEach(name => {
                      const present = toolNames.some(current => normalize(current) === normalize(name));
                      if (!present) {
                        missingCountRef.current[name] = (missingCountRef.current[name] ?? 0) + 1;
                      }
                    });
                    if (clearCountRef.current >= CLEAR_CONFIRM_FRAMES) {
                      clearCountRef.current = 0;
                      const threshold = Math.ceil(CLEAR_CONFIRM_FRAMES / 2);
                      const stolen = lastFrameBeforeHandRef.current.filter(
                        name => (missingCountRef.current[name] ?? 0) >= threshold
                      );
                      missingCountRef.current = {};
                      if (stolen.length > 0) {
                        stolenRef.current = stolen;
                        setStolenTools(stolen);
                        setPhase('alert');
                      } else {
                        // For return action: DO NOT reopen drawer during hand-detection cycles
                        // Drawer should stay open throughout the entire return sequence
                        // Only the parent component (ReturnTool) should close it after detection succeeds
                        handCountRef.current = 0; // ← Reset hand detection counter for next cycle
                        clearCountRef.current = 0; // ← Reset clear counter
                        setPhase('hand-detection');
                      }
                    }
                  } else {
                    clearCountRef.current = 0;
                  }
                } else if (currentPhase === 'alert') {
                  const allBack = stolenRef.current.every(name =>
                    toolNames.some(current => normalize(current) === normalize(name))
                  );
                  if (allBack && !hasHand) {
                    clearCountRef.current += 1;
                    if (clearCountRef.current >= CLEAR_CONFIRM_FRAMES) {
                      clearCountRef.current = 0;
                      stolenRef.current = [];
                      setStolenTools([]);
                      bestPreHandSnapRef.current = [...toolNames];
                      lastFrameBeforeHandRef.current = []; // ← Reset for next cycle
                      missingCountRef.current = {};
                      // For return action: DO NOT reopen drawer during alert recovery
                      // Drawer should stay open throughout the entire return sequence
                      handCountRef.current = 0; // ← Reset hand detection counter for next cycle
                      clearCountRef.current = 0; // ← Reset clear counter
                      setPhase('hand-detection');
                    }
                  } else {
                    clearCountRef.current = 0;
                  }
                }

                // Phase 1: keep best snapshot (most tools = drawer fully visible)
                if (!snapshot1SavedRef.current && currentPhase === 'hand-detection' && !hasHand && toolDets.length > 0) {
                  if (toolDets.length >= bestSnapshot1Ref.current.length) {
                    bestSnapshot1Ref.current = [...toolDets];
                    setSnapshot1([...toolDets]);
                  }
                }
                // Phase 2 return: keep best snapshot (most tools = returned tool appeared)
                if (snapshot1SavedRef.current && actionRef.current === 'return') {
                  if (toolDets.length >= bestSnapshot2Ref.current.length) {
                    bestSnapshot2Ref.current = [...toolDets];
                  }
                }
              }
              setServerReady(true);
              // Auto-cancel: require 4 consecutive frames detecting the wrong tool back in drawer
              // to avoid triggering on a hand passing in front of the camera
              if (cancelPendingToolRef.current) {
                const detected = toDisplayNames(lastDetectionsRef.current);
                const toolSeen = detected.some(d => normalize(d) === normalize(cancelPendingToolRef.current!));
                if (toolSeen) {
                  returnConfirmCountRef.current += 1;
                  if (returnConfirmCountRef.current >= 4) {
                    isRunningRef.current = false;
                    active = false;
                    stopCamera();
                    onDetectionFailure('Emprunt annulé — l\'outil a été remis dans le tiroir.');
                    return;
                  }
                } else {
                  returnConfirmCountRef.current = 0; // reset on any frame that misses the tool
                }
              }
            } else if (result.error?.includes('démarrage')) {
              await sleep(1000);
            }
          }
        } catch { await sleep(500); }
        finally { setLoading(false); }
      }
    };
    loop();
    return () => { active = false; };
  }, [cameraReady]);

  // ── Phase: PHASE 1 BLOCKED (non-conformant drawer) ────────────────────────
  if (phase === 'phase1-blocked' && phase1Result) {
    const p1 = phase1Result;
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 border-2 border-orange-400">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-9 h-9 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center">Tiroir non conforme</h2>
            <p className="text-slate-500 text-sm text-center">
              L'état du tiroir ne correspond pas à la base de données.<br />
              Aucune action n'a été enregistrée.
            </p>
          </div>

          {/* Phase 1 detail */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-1">
              Écart détecté — Phase 1
            </p>
            <p className="text-sm font-semibold text-orange-800">
              {p1.expected.length - p1.missing.length}/{p1.expected.length} outil{p1.expected.length > 1 ? 's' : ''} détecté{p1.expected.length > 1 ? 's' : ''}
            </p>
            {p1.missing.length > 0 && (
              <div>
                <p className="text-xs text-orange-700 font-semibold mt-1">Manquants dans le tiroir :</p>
                <ul className="mt-1 space-y-1">
                  {p1.missing.map(name => (
                    <li key={name} className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                      <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p1.unexpected.length > 0 && (
              <div>
                <p className="text-xs text-orange-700 font-semibold mt-1">Inattendus dans le tiroir :</p>
                <ul className="mt-1 space-y-1">
                  {p1.unexpected.map(name => (
                    <li key={name} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base hover:from-blue-700 hover:to-blue-600 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Réessayer la détection
            </button>
            <button
              onClick={() => onDetectionFailure('Tiroir non conforme — opération annulée.')}
              className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-base hover:bg-slate-200 transition-all"
            >
              Annuler l'opération
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: RETURN WRONG TOOL (awaiting camera confirmation before cancel) ────
  if (phase === 'return-wrong-tool' && cancelPendingTool) {
    const toolBack = detections.some(
      d => normalize(getDisplayName(d.class)) === normalize(cancelPendingTool)
    );
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 border-2 border-amber-400">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <RefreshCw className="w-9 h-9 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center">Remettez l'outil dans le tiroir</h2>
            <p className="text-slate-500 text-sm text-center">
              Replacez <span className="font-semibold text-amber-700">&ldquo;{cancelPendingTool}&rdquo;</span> dans le tiroir.<br />
              L'annulation sera confirmée automatiquement dès la détection.
            </p>
          </div>
          <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-amber-200 shadow-lg mb-4" style={{ aspectRatio: '16/9' }}>
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
                <p className="text-slate-400 text-sm">Initialisation de la caméra...</p>
              </div>
            )}
            {loading && serverReady && (
              <div className="absolute top-4 left-4 bg-blue-600/85 px-3 py-1.5 rounded-lg flex items-center gap-2 z-20">
                <Loader className="w-3 h-3 text-white animate-spin" />
                <span className="text-white text-xs font-medium">YOLO...</span>
              </div>
            )}
          </div>
          {toolBack ? (
            <div className="rounded-xl p-4 border-2 border-green-400 bg-green-50 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-0.5">Outil détecté</p>
                <p className="text-sm font-semibold text-green-800">
                  <span className="font-bold">{cancelPendingTool}</span> est de retour dans le tiroir — annulation en cours...
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4 border-2 border-amber-400 bg-amber-50 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-0.5">En attente</p>
                <p className="text-sm font-semibold text-amber-800">
                  Placez <span className="font-bold">{cancelPendingTool}</span> dans le tiroir devant la caméra
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Phase: COMPARISON ─────────────────────────────────────────────────────
  if (phase === 'comparing') {
    return (
      <ComparisonScreen
        drawerId={drawerId!}
        toolName={toolName}
        action={action}
        drawerTools={drawerTools}
        loadingDrawer={loadingDrawer}
        snapshot1={snapshot1}
        snapshot2={snapshot2Ref.current}
        annotatedImage={annotatedImage}
        videoRef={videoRef}
        captureRef={captureRef}
        cameraReady={cameraReady}
        detections={detections}
        onConfirm={() => { isRunningRef.current = false; stopCamera(); setPhase('confirming'); onDetectionSuccess(); }}
        onCancel={() => { isRunningRef.current = false; stopCamera(); onDetectionFailure("Validation annulée par l'utilisateur."); }}
        onRetry={onRetry}
        onBorrowAlternative={onBorrowAlternative}
        onReturnAndCancel={handleReturnAndCancel}
        onExtraToolsDetected={onExtraToolsDetected}
      />
    );
  }

  if (phase === 'confirming') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-xl font-semibold text-slate-700">Confirmation en cours...</p>
        </div>
      </div>
    );
  }

  // ── Phase: DETECTING ──────────────────────────────────────────────────────
  const inActionPhase  = timeRemaining <= actionStartAt;
  const detectedNames  = toDisplayNames(detections);
  const snap1Names     = toDisplayNames(snapshot1);

  // Phase-1 live DB conformity
  const p1 = drawerTools.length > 0
    ? phase1Conformity(detectedNames, drawerTools, toolName, action)
    : null;

  // Phase-2 live action feedback
  const matchTarget = detectedNames.some(d => normalize(d) === normalize(toolName));

  const actionPrompt = action === 'return'
    ? "Replacez l'outil dans le tiroir, puis retirez votre main"
    : phase === 'detecting' && timeRemaining <= actionStartAt
    ? "Prenez l'outil maintenant"
    : "Veuillez prendre l'outil maintenant";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className={`bg-white rounded-3xl shadow-2xl p-8 border-2 transition-colors duration-500 ${inActionPhase ? 'border-amber-400' : 'border-blue-200'}`}>

          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-slate-900">Détection en temps réel</h2>
          </div>
          <p className="text-xl text-center text-slate-600 mb-1">
            Outil&nbsp;: <span className="font-semibold text-blue-700">{toolName}</span>
            {drawerId && <span className="ml-3 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tiroir {drawerId}</span>}
          </p>

          {/* Phase label */}
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-5 mt-1">
            {phase === 'hand-detection'
              ? <span className="text-purple-600">Phase 0 — Surveillance de la main ({timeRemaining}s)</span>
              : phase === 'hand-detected'
              ? <span className="text-amber-600">Main detectee - moteur arrete</span>
              : phase === 'alert'
              ? <span className="text-red-600">Outil manquant - moteur bloque</span>
              : inActionPhase
              ? <span className="text-amber-600">Phase 2 — Action ({timeRemaining}s)</span>
              : <span className="text-blue-500">Phase 1 — Scan du tiroir ({timeRemaining}s)</span>}
          </p>

          {phase === 'hand-detected' && (
            <div className="mb-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-4 flex items-center gap-4 animate-pulse">
              <AlertTriangle className="w-7 h-7 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-0.5">Moteur arrete</p>
                <p className="text-lg font-bold text-amber-800">Levez votre main pour continuer la verification.</p>
              </div>
            </div>
          )}

          {phase === 'alert' && (
            <div className="mb-4 rounded-xl border-2 border-red-400 bg-red-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-1">Moteur bloque</p>
                  <p className="text-lg font-bold text-red-800 mb-2">
                    Remettez l'outil manquant dans le tiroir.
                  </p>
                  <ul className="space-y-1">
                    {stolenTools.map(name => (
                      <li key={name} className="text-sm font-semibold text-red-800 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
                        {name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 mt-2">
                    Le chrono reprend automatiquement des que l'outil est detecte de nouveau.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action prompt banner (phase 2) */}
          {inActionPhase && (
            <div className="mb-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-4 flex items-center gap-4 animate-pulse">
              <span className="text-3xl">👋</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-0.5">Action requise</p>
                <p className="text-lg font-bold text-amber-800">{actionPrompt}</p>
              </div>
              <span className="ml-auto text-4xl font-black text-amber-600">{timeRemaining}</span>
            </div>
          )}

          {/* Hand detection surveillance banner (phase 0) */}
          {phase === 'hand-detection' && (
            <div className="mb-4 rounded-xl border-2 border-purple-400 bg-purple-50 px-5 py-4 flex items-center gap-4">
              <span className="text-3xl animate-bounce">🎥</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-0.5">Surveillance de sécurité</p>
                <p className="text-lg font-bold text-purple-800">Détection de la main en cours — écartez votre main du tiroir</p>
              </div>
              <span className="ml-auto text-4xl font-black text-purple-600">{timeRemaining}</span>
            </div>
          )}

          {/* Camera */}
          <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-blue-200 shadow-lg mb-4"
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
            {!cameraReady && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                <Camera className="w-10 h-10 text-slate-500 mb-3" />
                <p className="text-slate-400 text-sm">Initialisation de la caméra...</p>
              </div>
            )}
            {cameraReady && !serverReady && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                <Loader className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
                <p className="text-slate-300 text-sm">Chargement du modèle YOLO...</p>
                <p className="text-slate-500 text-xs mt-1">(première fois ~5 secondes)</p>
              </div>
            )}
            {/* Timer badge (phase 1 only, hidden during phase 2 — already in banner) */}
            {!inActionPhase && (
              <div className="absolute top-4 right-4 bg-black/70 rounded-full w-16 h-16 flex items-center justify-center z-20">
                <span className="text-3xl font-bold text-white">{timeRemaining}</span>
              </div>
            )}
            {loading && serverReady && (
              <div className="absolute top-4 left-4 bg-blue-600/85 px-3 py-1.5 rounded-lg flex items-center gap-2 z-20">
                <Loader className="w-3 h-3 text-white animate-spin" />
                <span className="text-white text-xs font-medium">YOLO...</span>
              </div>
            )}
            {detections.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-green-600/90 px-3 py-1.5 rounded-lg z-20">
                <span className="text-white text-xs font-semibold">
                  {detections.length} objet{detections.length > 1 ? 's' : ''} détecté{detections.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* ── Live indicators ── */}
          {serverReady && (
            <>
              {/* PHASE 1: DB conformity indicator */}
              {!inActionPhase && (
                <div className={`rounded-xl p-4 border-2 mb-3 ${
                  !p1 ? 'border-slate-200 bg-slate-50'
                  : p1.ok ? 'border-green-400 bg-green-50'
                  : detectedNames.length === 0 ? 'border-slate-200 bg-slate-50'
                  : 'border-orange-400 bg-orange-50'
                }`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Phase 1 — Conformité tiroir vs base de données
                  </p>
                  {detectedNames.length === 0 ? (
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span>Analyse du contenu du tiroir en cours...</span>
                    </div>
                  ) : p1 === null ? (
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span>Chargement des données...</span>
                    </div>
                  ) : p1.ok ? (
                    <div className="flex items-center gap-2 text-green-800 text-sm font-semibold">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Tiroir conforme — {p1.expected.length}/{p1.expected.length} outil{p1.expected.length > 1 ? 's' : ''} présent{p1.expected.length > 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-orange-800 text-sm font-semibold">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>
                          Tiroir non conforme —{' '}
                          {p1.expected.length - p1.missing.length}/{p1.expected.length} outils détectés
                        </span>
                      </div>
                      {p1.missing.length > 0 && (
                        <p className="text-xs text-orange-700 ml-7">Manquants : {p1.missing.join(', ')}</p>
                      )}
                      {p1.unexpected.length > 0 && (
                        <p className="text-xs text-orange-700 ml-7">Inattendus : {p1.unexpected.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PHASE 1: target tool specifically */}
              {!inActionPhase && (
                <div className={`rounded-xl p-4 border-2 mb-3 ${
                  matchTarget ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
                }`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Outil sélectionné — {action === 'borrow' ? 'doit être présent' : 'doit être absent'}
                  </p>
                  {action === 'borrow' ? (
                    matchTarget ? (
                      <div className="flex items-center gap-2 text-green-800 text-sm font-semibold">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span><span className="font-bold">{toolName}</span> — présent dans le tiroir ✓</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-700 text-sm font-semibold">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span><span className="font-bold">{toolName}</span> — non détecté dans le tiroir</span>
                      </div>
                    )
                  ) : (
                    matchTarget ? (
                      <div className="flex items-center gap-2 text-orange-700 text-sm font-semibold">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span><span className="font-bold">{toolName}</span> — encore détecté (déjà dans le tiroir ?)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-800 text-sm font-semibold">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span><span className="font-bold">{toolName}</span> — absent du tiroir (en cours de retour) ✓</span>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* PHASE 2: action result live */}
              {inActionPhase && (() => {
                if (action === 'borrow') {
                  const taken = snap1Names.filter(s => !detectedNames.some(d => normalize(d) === normalize(s)));
                  const targetTaken = taken.some(s => normalize(s) === normalize(toolName));
                  if (targetTaken) return (
                    <div className="rounded-xl p-4 border-2 border-green-400 bg-green-50 mb-3 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-0.5">Outil pris</p>
                        <p className="text-sm font-semibold text-green-800"><span className="font-bold">{toolName}</span> a été retiré du tiroir ✓</p>
                      </div>
                    </div>
                  );
                  if (matchTarget) return (
                    <div className="rounded-xl p-4 border-2 border-amber-400 bg-amber-50 mb-3 flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-0.5">En attente</p>
                        <p className="text-sm font-semibold text-amber-800"><span className="font-bold">{toolName}</span> est encore dans le tiroir — prenez-le</p>
                      </div>
                    </div>
                  );
                  const wrongTaken = taken.filter(s => normalize(s) !== normalize(toolName));
                  if (wrongTaken.length > 0) return (
                    <div className="rounded-xl p-4 border-2 border-red-400 bg-red-50 mb-3 flex items-center gap-3">
                      <X className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-0.5">Mauvais outil pris</p>
                        <p className="text-sm font-semibold text-red-800">Pris : <span className="font-bold">{wrongTaken[0]}</span> — attendu : <span className="font-bold">{toolName}</span></p>
                      </div>
                    </div>
                  );
                  return (
                    <div className="rounded-xl p-4 border-2 border-slate-200 bg-slate-50 mb-3 flex items-center gap-3">
                      <Loader className="w-5 h-5 text-slate-400 animate-spin flex-shrink-0" />
                      <p className="text-sm font-semibold text-slate-600">Analyse en cours...</p>
                    </div>
                  );
                } else {
                  const returned = detectedNames.filter(d => !snap1Names.some(s => normalize(s) === normalize(d)));
                  const targetReturned = returned.some(s => normalize(s) === normalize(toolName));
                  if (targetReturned) return (
                    <div className="rounded-xl p-4 border-2 border-green-400 bg-green-50 mb-3 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-0.5">Outil retourné</p>
                        <p className="text-sm font-semibold text-green-800"><span className="font-bold">{toolName}</span> a été replacé dans le tiroir ✓</p>
                      </div>
                    </div>
                  );
                  return (
                    <div className="rounded-xl p-4 border-2 border-amber-400 bg-amber-50 mb-3 flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-0.5">En attente</p>
                        <p className="text-sm font-semibold text-amber-800">Replacez <span className="font-bold">{toolName}</span> dans le tiroir</p>
                      </div>
                    </div>
                  );
                }
              })()}
            </>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">{error}</p>
                <button onClick={onRetry} className="mt-2 text-sm text-red-600 underline">Réessayer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
interface ComparisonProps {
  drawerId: string;
  toolName: string;
  action: 'borrow' | 'return';
  drawerTools: DrawerTool[];
  loadingDrawer: boolean;
  snapshot1: Detection[];
  snapshot2: Detection[];
  annotatedImage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  captureRef: React.RefObject<HTMLCanvasElement>;
  cameraReady: boolean;
  detections: Detection[];
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onBorrowAlternative?: (wrongToolName: string) => void;
  onReturnAndCancel?: (wrongToolName: string) => void;
  onExtraToolsDetected?: (extraToolNames: string[]) => void;
}

const statusConfig: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  C1: { bg: 'bg-green-50',  border: 'border-green-400',  icon: <CheckCircle className="w-5 h-5 text-green-600" />,   label: 'C1 — Emprunt conforme' },
  C2: { bg: 'bg-green-50',  border: 'border-green-400',  icon: <CheckCircle className="w-5 h-5 text-green-600" />,   label: 'C2 — Retour conforme' },
  E1: { bg: 'bg-red-50',    border: 'border-red-400',    icon: <X className="w-5 h-5 text-red-600" />,               label: 'E1 — Outil incorrect pris' },
  E2: { bg: 'bg-red-50',    border: 'border-red-400',    icon: <X className="w-5 h-5 text-red-600" />,               label: 'E2 — Outil non pris' },
  E3: { bg: 'bg-red-50',    border: 'border-red-400',    icon: <X className="w-5 h-5 text-red-600" />,               label: 'E3 — Plusieurs outils pris' },
  E4: { bg: 'bg-red-50',    border: 'border-red-400',    icon: <X className="w-5 h-5 text-red-600" />,               label: 'E4 — Mauvais outil retourné' },
  E6: { bg: 'bg-red-50',    border: 'border-red-400',    icon: <X className="w-5 h-5 text-red-600" />,               label: 'E6 — Outil non retourné' },
};

const ComparisonScreen: React.FC<ComparisonProps> = ({
  drawerId, toolName, action, drawerTools, loadingDrawer,
  snapshot1, snapshot2, annotatedImage, videoRef, captureRef, cameraReady, detections,
  onConfirm, onCancel, onRetry, onBorrowAlternative, onReturnAndCancel, onExtraToolsDetected,
}) => {
  const snap1Names = toDisplayNames(snapshot1);
  const snap2Names = toDisplayNames(snapshot2);

  const p1 = phase1Conformity(snap1Names, drawerTools, toolName, action);
  const p2 = phase2Status(snap1Names, snap2Names, toolName, action);
  const cfg = statusConfig[p2.code];
  const warningSentRef = React.useRef(false);

  React.useEffect(() => {
    if (p2.code === 'E3' && action === 'borrow' && !warningSentRef.current) {
      warningSentRef.current = true;
      onExtraToolsDetected?.(p2.extraToolNames);
    }
  }, [action, onExtraToolsDetected, p2]);

  const validateLabel = action === 'return' ? 'Valider le retour' : "Valider l'emprunt";

  const toolPresenceInSnap = (name: string, snap: string[]) =>
    snap.some(s => normalize(s) === normalize(name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-200">

          {/* Drawer badge */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-2 bg-blue-600 text-white text-lg font-bold px-6 py-2 rounded-full shadow">
              Tiroir {drawerId}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-1">Résultat de la détection</h2>
          <p className="text-center text-slate-500 mb-5 text-sm">
            Opération : <span className="font-semibold text-blue-700">{action === 'borrow' ? 'Emprunt' : 'Retour'}</span>
            {' '}— Outil : <span className="font-semibold text-blue-700">{toolName}</span>
          </p>

          {/* Live camera feed */}
          <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-blue-200 shadow-lg mb-4" style={{ aspectRatio: '16/9' }}>
            <video ref={videoRef} autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: cameraReady ? 1 : 0 }}
            />
            <canvas ref={captureRef} className="hidden" width={CAPTURE_W} height={CAPTURE_H} />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                <Camera className="w-10 h-10 text-slate-500 mb-3" />
                <p className="text-slate-400 text-sm">Caméra...</p>
              </div>
            )}
            {detections.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-green-600/90 px-3 py-1.5 rounded-lg z-20">
                <span className="text-white text-xs font-semibold">
                  {detections.length} objet{detections.length > 1 ? 's' : ''} détecté{detections.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {loadingDrawer ? (
            <div className="flex justify-center py-10"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <>
              {/* ── Phase 1 conformity ── */}
              <div className={`rounded-xl px-4 py-3 border-2 mb-3 ${p1.ok ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
                <div className="flex items-start gap-3">
                  {p1.ok
                    ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                      Phase 1 — État initial du tiroir (avant action)
                    </p>
                    {p1.ok ? (
                      <p className="text-sm font-semibold text-green-800">
                        Conforme à la base de données — {p1.expected.length}/{p1.expected.length} outil{p1.expected.length > 1 ? 's' : ''} présent{p1.expected.length > 1 ? 's' : ''}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-orange-800">
                          Non conforme — {p1.expected.length - p1.missing.length}/{p1.expected.length} outils détectés
                        </p>
                        {p1.missing.length > 0 && (
                          <p className="text-xs text-orange-700 mt-0.5">Manquants : {p1.missing.join(', ')}</p>
                        )}
                        {p1.unexpected.length > 0 && (
                          <p className="text-xs text-orange-700 mt-0.5">Inattendus : {p1.unexpected.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Phase 2 action result ── */}
              <div className={`rounded-xl px-4 py-3 border-2 mb-5 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-0.5">{cfg.label}</p>
                    <p className="text-sm font-semibold text-slate-800">{p2.message}</p>
                  </div>
                </div>
              </div>

              {/* ── Last annotated capture ── */}
              {annotatedImage && (
                <div className="mb-5 rounded-2xl overflow-hidden border-2 border-slate-200 shadow">
                  <div className="bg-slate-800 px-4 py-2 text-sm text-slate-300 font-medium">
                    Dernière capture YOLO (Phase 2)
                  </div>
                  <img src={`data:image/jpeg;base64,${annotatedImage}`}
                    alt="Détection" className="w-full object-contain max-h-56" />
                </div>
              )}

              {/* ── 3-column comparison table ── */}
              <div className="grid grid-cols-3 gap-3 mb-5">

                {/* DB */}
                <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                    Base de données
                  </h3>
                  {drawerTools.length === 0
                    ? <p className="text-slate-400 text-xs italic">Aucun outil enregistré</p>
                    : <ul className="space-y-1.5">
                        {drawerTools.map(t => {
                          const available = t.availableQuantity > 0;
                          return (
                            <li key={t.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
                              ${available ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
                              <span>{available ? '🔵' : '⚫'}</span>
                              <span className="truncate">{t.name}</span>
                              {!available && <span className="ml-auto shrink-0 text-xs bg-slate-200 text-slate-600 px-1.5 rounded">emprunté</span>}
                            </li>
                          );
                        })}
                      </ul>}
                </div>

                {/* Snapshot 1 — Before */}
                <div className="bg-slate-50 rounded-2xl p-4 border-2 border-blue-200">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
                    Avant (Phase 1)
                  </h3>
                  {snap1Names.length === 0
                    ? <p className="text-slate-400 text-xs italic">Aucune détection</p>
                    : <ul className="space-y-1.5">
                        {drawerTools.filter(t => t.availableQuantity > 0).map(t => {
                          const present = toolPresenceInSnap(t.name, snap1Names);
                          return (
                            <li key={t.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
                              ${present ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                              {present
                                ? <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                              <span className="truncate">{t.name}</span>
                            </li>
                          );
                        })}
                      </ul>}
                </div>

                {/* Snapshot 2 — After */}
                <div className="bg-slate-50 rounded-2xl p-4 border-2 border-green-200">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                    Après (Phase 2)
                  </h3>
                  {drawerTools.filter(t => t.availableQuantity > 0).length === 0
                    ? <p className="text-slate-400 text-xs italic">Aucun outil attendu</p>
                    : <ul className="space-y-1.5">
                        {drawerTools.filter(t => t.availableQuantity > 0).map(t => {
                          const wasInP1  = toolPresenceInSnap(t.name, snap1Names);
                          const isInP2   = toolPresenceInSnap(t.name, snap2Names);
                          const changed  = wasInP1 !== isInP2;
                          const isTarget = normalize(t.name) === normalize(toolName);
                          return (
                            <li key={t.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
                              ${isInP2
                                ? changed && isTarget && action === 'return'
                                  ? 'bg-green-100 border-2 border-green-400 text-green-900 font-bold'
                                  : 'bg-green-50 border border-green-200 text-green-800'
                                : changed && isTarget && action === 'borrow'
                                  ? 'bg-blue-100 border-2 border-blue-400 text-blue-900 font-bold'
                                  : 'bg-red-50 border border-red-200 text-red-700'}`}>
                              {isInP2
                                ? <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                              <span className="truncate">{t.name}</span>
                              {changed && isTarget && (
                                <span className="ml-auto shrink-0 text-xs px-1.5 rounded font-bold
                                  bg-blue-200 text-blue-800">
                                  {action === 'borrow' ? 'pris' : 'retourné'}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>}
                </div>
              </div>

              {/* Buttons */}
              {p2.code === 'E1' ? (
                /* ── E1: mauvais outil pris → deux options ── */
                <div className="space-y-3">
                  <p className="text-center text-sm font-semibold text-slate-700 mb-1">
                    Que souhaitez-vous faire ?
                  </p>

                  {/* Option 1 — Retourner l'outil incorrect et réessayer */}
                  <button onClick={onRetry}
                    className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow">
                    <RefreshCw className="w-5 h-5" />
                    Remettre "{p2.wrongToolName}" dans le tiroir et réessayer
                  </button>

                  {/* Option 2 — Emprunter l'outil pris à la place */}
                  {onBorrowAlternative && (
                    <button onClick={() => onBorrowAlternative(p2.wrongToolName)}
                      className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow">
                      <Check className="w-5 h-5" />
                      Emprunter "{p2.wrongToolName}" à la place
                    </button>
                  )}

                  {/* Annuler — camera verifies tool is returned before canceling */}
                  <button onClick={() => onReturnAndCancel?.(p2.wrongToolName)}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Annuler l'emprunt (remettre l'outil)
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button onClick={onCancel}
                    className="flex-1 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center justify-center gap-2">
                    <X className="w-5 h-5" /> Annuler
                  </button>
                  {!p2.ok && p2.canRetry && (
                    <button onClick={onRetry}
                      className="flex-1 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow">
                      <RefreshCw className="w-5 h-5" /> Réessayer
                    </button>
                  )}
                  <button onClick={onConfirm} disabled={!p2.ok}
                    className={`flex-1 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg
                      ${p2.ok ? 'bg-[#0f2b56] hover:bg-[#0a1f3d] text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                    <Check className="w-5 h-5" /> {validateLabel}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeDetection;
