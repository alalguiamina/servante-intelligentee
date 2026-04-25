import os
import json
import time
import tempfile
import argparse
import cv2

# Mapping YOLO class names → DB tool names
CLASS_TO_TOOL: dict[str, str] = {
    'Cle L petite':         'Clé L petite',
    'Cle L grande':         'Clé L grande',
    'Denudeur automatique': 'Dénudeur automatique',
    'Grise coupante':       'Mini pince coupante',
    'Jaune coude':          'Pince à bec coudé',
    'Pince a denuder':      'Pince à dénuder',
    'Pince coude':          'Mini pince à bec demi-rond coudé',
    'Pince universelle':    'Pince universelle',
    'Rouge coupante':       'Pince coupante',
    'Tournevis american':   'Tournevis américain moyen',
    'Tournevis plat':       'Tournevis plat moyen',
    'cutteur':              'Cutteur',
    'multimetre':           'Multimètre',
    'perceuse':             'Perceuse',
    'pied coulisse':        'Pied à coulisse',
    'pince plat':           'Mini pince à bec plat',
    'pince rond':           'Mini pince à bec rond',
    'Rouge plat':           'Pince à bec plat',
    'Cles plates':          'Lot de clés plates',
}

LIVE_FRAME_PATH      = os.path.join(tempfile.gettempdir(), 'servante_live_frame.jpg')
LIVE_DETECTIONS_PATH = os.path.join(tempfile.gettempdir(), 'servante_live_detections.json')


def _atomic_write(path: str, data: bytes | str, binary: bool = False) -> None:
    tmp = path + '.tmp'
    if binary:
        with open(tmp, 'wb') as f:
            f.write(data)
    else:
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write(data)
    try:
        os.replace(tmp, path)
    except OSError:
        pass


def load_yolo(model_path: str):
    try:
        from ultralytics.models.yolo.model import YOLO
        return YOLO(model_path)
    except Exception:
        from ultralytics import YOLO
        return YOLO(model_path)


def scan_drawer(camera_id: int, model_path: str, conf: float, duration: float) -> dict:
    if not os.path.exists(model_path):
        return {'success': False, 'error': f'Model not found: {model_path}'}

    try:
        model = load_yolo(model_path)
    except Exception as exc:
        return {'success': False, 'error': f'Cannot load model: {exc}'}

    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        return {'success': False, 'error': f'Cannot open camera {camera_id}'}

    # Set 1080p resolution (from detection.py)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    # Discard first 2 frames (camera warm-up)
    for _ in range(2):
        cap.read()

    best: dict[str, dict] = {}         # meilleure confiance tous frames confondus
    last_frame_tools: list[dict] = []  # détections du dernier frame traité

    deadline = time.monotonic() + duration

    while time.monotonic() < deadline:
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame, conf=conf, verbose=False)

        # Frame annotée → fichier temp (live feed frontend)
        ok, buf = cv2.imencode('.jpg', results[0].plot())
        if ok:
            _atomic_write(LIVE_FRAME_PATH, buf.tobytes(), binary=True)

        # Détections de ce frame
        frame_tools: dict[str, dict] = {}
        for box in results[0].boxes:
            cls_id     = int(box.cls[0])
            cls_name   = model.names[cls_id]
            confidence = float(box.conf[0])
            tool_name  = CLASS_TO_TOOL.get(cls_name, cls_name)
            if tool_name not in frame_tools or confidence > frame_tools[tool_name]['confidence']:
                frame_tools[tool_name] = {
                    'class_name': cls_name,
                    'tool_name':  tool_name,
                    'confidence': round(confidence, 3),
                }

        # Mise à jour de l'agrégat global
        for tool_name, det in frame_tools.items():
            if tool_name not in best or det['confidence'] > best[tool_name]['confidence']:
                best[tool_name] = det

        # Mémoriser ce frame comme dernier frame traité
        last_frame_tools = sorted(frame_tools.values(), key=lambda d: d['confidence'], reverse=True)

        # Détections cumulées → fichier temp (liste live frontend)
        partial = sorted(best.values(), key=lambda d: d['confidence'], reverse=True)
        _atomic_write(
            LIVE_DETECTIONS_PATH,
            json.dumps({'detected_tools': partial, 'count': len(partial)}, ensure_ascii=False)
        )

    cap.release()

    # Nettoyage fichiers temp
    for p in (LIVE_FRAME_PATH, LIVE_DETECTIONS_PATH):
        try:
            os.remove(p)
        except OSError:
            pass

    # Composition finale = dernier frame (fallback : meilleur agrégat)
    composition = last_frame_tools or sorted(
        best.values(), key=lambda d: d['confidence'], reverse=True
    )

    return {
        'success':        True,
        'detected_tools': composition,
        'count':          len(composition),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scan drawer with YOLO')
    parser.add_argument('--camera',   type=int,   default=0)
    parser.add_argument('--model',    type=str,   default=None)
    parser.add_argument('--conf',     type=float, default=0.35)
    parser.add_argument('--duration', type=float, default=20.0,
                        help='Detection duration in seconds')
    args = parser.parse_args()

    if args.model is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(script_dir, 'best (2).pt'),
            os.path.join(script_dir, 'best.pt'),
            os.path.join(script_dir, '..', '..', '..', 'best (2).pt'),
            os.path.join(script_dir, '..', '..', '..', 'best.pt'),
        ]
        args.model = next((p for p in candidates if os.path.exists(p)), candidates[0])

    result = scan_drawer(args.camera, args.model, args.conf, args.duration)
    print(json.dumps(result, ensure_ascii=False))
