import os
import cv2


RESOLUTION_1080P = (1920, 1080)


def charger_classe_yolo():
    """Charge YOLO avec un import cible, puis fallback sur import standard."""
    try:
        from ultralytics.models.yolo.model import YOLO as YoloClass
        return YoloClass
    except Exception:
        try:
            from ultralytics import YOLO as YoloClass
            return YoloClass
        except ImportError:
            return None


def appliquer_resolution(cap, resolution):
    """Applique la resolution demandee et retourne la resolution reelle."""
    largeur, hauteur = resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, largeur)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, hauteur)

    largeur_reelle = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    hauteur_reelle = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Resolution camera: {largeur_reelle}x{hauteur_reelle}")
    return largeur_reelle, hauteur_reelle


def choisir_modele_par_defaut():
    """Choisit automatiquement un modele YOLO disponible dans le dossier courant."""
    candidats = ["best.pt", "last.pt", "yolov8n.pt"]
    for modele in candidats:
        if os.path.exists(modele):
            return modele
    return None


def lancer_yolo_camera(
    camera_id=0,
    model_path=None,
    resolution=RESOLUTION_1080P,
    conf=0.35,
):
    """
    Lance YOLO en temps reel sur le flux camera en 1080p.

    Touches:
      q: quitter
    """
    YOLO = charger_classe_yolo()
    if YOLO is None:
        print("Erreur: le package 'ultralytics' n'est pas installe.")
        print("Installe-le avec: pip install ultralytics")
        return

    if model_path is None:
        model_path = choisir_modele_par_defaut()

    if not model_path:
        print("Erreur: aucun modele trouve.")
        print("Place un fichier .pt (ex: best.pt) dans le dossier du projet.")
        return

    if not os.path.exists(model_path):
        print(f"Erreur: modele introuvable -> {model_path}")
        return

    print(f"Chargement du modele YOLO: {model_path}")
    try:
        model = YOLO(model_path)
    except KeyboardInterrupt:
        print("Chargement interrompu. Relance le script sans couper le premier chargement.")
        return
    except Exception as exc:
        print(f"Erreur au chargement du modele YOLO: {exc}")
        return

    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        print(f"Erreur: impossible d'ouvrir la camera {camera_id}")
        print("Essaie camera_id=1 si tu as une camera externe.")
        return

    appliquer_resolution(cap, resolution)
    print("YOLO en cours. Appuie sur 'q' pour quitter.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Erreur: lecture camera impossible.")
            break

        results = model(frame, conf=conf, verbose=False)
        frame_annote = results[0].plot()

        cv2.putText(
            frame_annote,
            "Resolution cible: 1920x1080 | q: quitter",
            (10, frame_annote.shape[0] - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
        )

        cv2.imshow("YOLO Camera 1080p", frame_annote)

        if (cv2.waitKey(1) & 0xFF) == ord("q"):
            print("Arret de la detection.")
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    lancer_yolo_camera(
        camera_id=0,
        model_path="best.pt",
        resolution=RESOLUTION_1080P,
        conf=0.35,
    )