import os
import cv2
import time
import tempfile
import argparse

PREVIEW_PATH = os.path.join(tempfile.gettempdir(), 'servante_preview.jpg')


def _atomic_write(path: str, data: bytes) -> None:
    tmp = path + '.tmp'
    with open(tmp, 'wb') as f:
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


def run_preview(camera_id: int, model_path: str, conf: float, duration: float) -> None:
    # Load YOLO model (same approach as detection.py)
    model = None
    if model_path and os.path.exists(model_path):
        try:
            model = load_yolo(model_path)
        except Exception as e:
            print(f'Warning: YOLO model failed to load: {e}', flush=True)

    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        return

    # 1080p — same as detection.py
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    # Warm-up: discard first 2 frames
    for _ in range(2):
        cap.read()

    deadline = time.monotonic() + duration

    while time.monotonic() < deadline:
        ret, frame = cap.read()
        if not ret:
            break

        if model is not None:
            results = model(frame, conf=conf, verbose=False)
            annotated = results[0].plot()
        else:
            annotated = frame

        ok, buf = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ok:
            _atomic_write(PREVIEW_PATH, buf.tobytes())

    cap.release()

    try:
        os.remove(PREVIEW_PATH)
    except OSError:
        pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Live camera preview with YOLO')
    parser.add_argument('--camera',   type=int,   default=0)
    parser.add_argument('--model',    type=str,   default=None)
    parser.add_argument('--conf',     type=float, default=0.35)
    parser.add_argument('--duration', type=float, default=600.0,
                        help='Max run duration in seconds (default 10 min)')
    args = parser.parse_args()
    run_preview(args.camera, args.model or '', args.conf, args.duration)
