import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

interface Detection {
  class: string;
  confidence: number;
  x: number; y: number; w: number; h: number;
}

interface DrawerCameraContextValue {
  stream: MediaStream | null;
  cameraReady: boolean;
  serverReady: boolean;
  annotatedImage: string | null;
  latestDetections: Detection[];
  referenceComposition: string[];
  // Child components that run their own YOLO loop call these so the context
  // background loop yields rather than double-posting to the YOLO server.
  acquireDetection: () => void;
  releaseDetection: () => void;
}

const DrawerCameraContext = createContext<DrawerCameraContextValue | null>(null);

// Returns null when called outside the provider — components must guard against this.
export const useDrawerCamera = () => useContext(DrawerCameraContext);

const CAPTURE_W = 640;
const CAPTURE_H = 360;
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export const DrawerCameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const captureRef = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  // Count of child components currently running their own YOLO loop.
  const activeDetectorsRef = useRef(0);
  const referenceRef = useRef<string[]>([]);

  const [stream,           setStream]           = useState<MediaStream | null>(null);
  const [cameraReady,      setCameraReady]      = useState(false);
  const [serverReady,      setServerReady]      = useState(false);
  const [annotatedImage,   setAnnotatedImage]   = useState<string | null>(null);
  const [latestDetections, setLatestDetections] = useState<Detection[]>([]);
  const [referenceComposition, setRefComp]      = useState<string[]>([]);

  const acquireDetection = () => { activeDetectorsRef.current += 1; };
  const releaseDetection = () => { activeDetectorsRef.current = Math.max(0, activeDetectorsRef.current - 1); };

  // Start camera ONCE for the entire drawer operation — never restarts between screens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let s: MediaStream | null = null;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        try { s = await navigator.mediaDevices.getUserMedia({ video: true }); } catch { return; }
      }
      if (!cancelled && s) {
        streamRef.current = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } else {
        s?.getTracks().forEach(t => t.stop());
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Background detection loop — runs continuously.
  // Yields (sleeps) when a child component has acquired the detector slot so
  // we don't double-post concurrent YOLO requests to the server.
  useEffect(() => {
    if (!cameraReady) return;
    let active = true;
    (async () => {
      while (active) {
        if (activeDetectorsRef.current > 0) { await sleep(100); continue; }
        const video  = videoRef.current;
        const canvas = captureRef.current;
        if (!video || !canvas || video.readyState < 2) { await sleep(100); continue; }
        const ctx = canvas.getContext('2d');
        if (!ctx) break;
        ctx.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H);
        const frameData = canvas.toDataURL('image/jpeg', 0.75);
        try {
          const resp = await fetch(`${API_BASE_URL}/detection/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frameData }),
          });
          if (!resp.ok) { await sleep(300); continue; }
          const result = await resp.json();
          if (!result.success) { await sleep(500); continue; }
          setServerReady(true);
          if (result.annotated_image) setAnnotatedImage(result.annotated_image);
          const dets: Detection[] = result.detections ?? [];
          setLatestDetections(dets);
          const hasHand   = dets.some(d => d.class.toLowerCase() === 'main');
          const toolNames = dets.filter(d => d.class.toLowerCase() !== 'main').map(d => d.class);
          if (!hasHand && toolNames.length >= referenceRef.current.length) {
            referenceRef.current = [...toolNames];
            setRefComp([...toolNames]);
          }
        } catch { await sleep(500); }
      }
    })();
    return () => { active = false; };
  }, [cameraReady]);

  return (
    <DrawerCameraContext.Provider value={{
      stream, cameraReady, serverReady, annotatedImage, latestDetections, referenceComposition,
      acquireDetection, releaseDetection,
    }}>
      {/* Hidden video + canvas owned by the provider — shared stream, single YOLO loop. */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        className="hidden"
        onCanPlay={() => setCameraReady(true)}
      />
      <canvas ref={captureRef} className="hidden" width={CAPTURE_W} height={CAPTURE_H} />
      {children}
    </DrawerCameraContext.Provider>
  );
};
