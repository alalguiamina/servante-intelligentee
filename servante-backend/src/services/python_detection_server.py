#!/usr/bin/env python3
"""
Serveur de détection YOLO persistant.
Charge le modèle UNE SEULE FOIS au démarrage → ~100-300ms par frame au lieu de 5s.
"""
import sys
import json
import base64
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

DISPLAY_NAMES = {
    "Cle L petite":         "Clé L petite",
    "Cle L grande":         "Clé L grande",
    "Cles plates":          "Lot de clés plates",
    "Denudeur automatique": "Dénudeur automatique",
    "Grise coupante":       "Mini pince coupante",
    "Jaune coude":          "Pince à bec coudée",
    "Pince a denuder":      "Pince à dénuder",
    "Pince coude":          "Mini pince à bec demi rond coudée",
    "Pince universelle":    "Pince universelle",
    "Rouge coupante":       "Pince coupante",
    "Tournevis american":   "Tournevis américain",
    "Tournevis plat":       "Tournevis plat",
    "cutteur":              "Cutteur",
    "multimetre":           "Multimètre",
    "multimetre fils":      "Multimètre fils",
    "perceuse":             "Perceuse",
    "pied coulisse":        "Pied à coulisse",
    "pince plat":           "Mini pince à bec plat",
    "pince rond":           "Mini pince à bec rond",
    "rouge plat":           "Pince à bec plat",
}

def get_display_name(name):
    for k, v in DISPLAY_NAMES.items():
        if k.lower() == name.lower():
            return v
    return name

# ── Chargement du modèle (une seule fois) ────────────────────────────────────
model_path = sys.argv[1] if len(sys.argv) > 1 else "best.pt"
print(f"[YOLO] Chargement de {model_path}...", file=sys.stderr, flush=True)

from ultralytics import YOLO
model = YOLO(model_path)
for cid, name in list(model.model.names.items()):
    model.model.names[cid] = get_display_name(name)

print("[YOLO] Modèle prêt.", file=sys.stderr, flush=True)

inference_lock = threading.Lock()


def decode_image(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    img = Image.open(BytesIO(data))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


def run_detection(b64_image: str) -> dict:
    frame = decode_image(b64_image)

    with inference_lock:
        results = model(frame, conf=0.35, verbose=False)

    detections = []
    annotated_b64 = None

    if results:
        result = results[0]
        masks_xy = [m.tolist() for m in result.masks.xy] if result.masks else []

        for i, box in enumerate(result.boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            cid  = int(box.cls[0].cpu().numpy())
            conf = float(box.conf[0].cpu().numpy())
            name = get_display_name(result.names.get(cid, f"class_{cid}"))
            detections.append({
                "x": float(x1), "y": float(y1),
                "w": float(x2 - x1), "h": float(y2 - y1),
                "class": name, "class_id": cid,
                "confidence": conf,
                "polygon": masks_xy[i] if i < len(masks_xy) else []
            })

        # Image annotée avec masques de segmentation
        annotated = result.plot()
        _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 82])
        annotated_b64 = base64.b64encode(buf).decode()

    return {
        "success": True,
        "detections": detections,
        "count": len(detections),
        "annotated_image": annotated_b64
    }


class DetectionHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/detect":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body   = json.loads(self.rfile.read(length))
        try:
            result = run_detection(body["image"])
        except Exception as e:
            result = {"success": False, "detections": [], "error": str(e)}
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass  # silence HTTP logs


if __name__ == "__main__":
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 5002
    server = HTTPServer(("127.0.0.1", port), DetectionHandler)
    # Signal vers Node.js que le serveur est prêt
    print(f"DETECTION_SERVER_READY:{port}", flush=True)
    server.serve_forever()
