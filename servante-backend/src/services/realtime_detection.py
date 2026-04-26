#!/usr/bin/env python3
"""
Service de détection d'objets en temps réel utilisant YOLO (best.pt)
Traite les images base64 et retourne les détections avec boîtes englobantes
"""

import os
import sys
import json
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from typing import Dict, List, Any, Tuple


def charger_yolo():
    """Charge la classe YOLO avec gestion des erreurs."""
    try:
        from ultralytics import YOLO
        return YOLO
    except ImportError:
        print("Erreur: le package 'ultralytics' n'est pas installé.", file=sys.stderr)
        print("Installe-le avec: pip install ultralytics opencv-python pillow", file=sys.stderr)
        return None


# Mapping noms modèle → noms d'affichage corrects (français avec accents)
DISPLAY_NAMES: Dict[str, str] = {
    "Cle L petite":          "Clé L petite",
    "Cle L grande":          "Clé L grande",
    "Cles plates":           "Lot de clés plates",
    "Denudeur automatique":  "Dénudeur automatique",
    "Grise coupante":        "Mini pince coupante",
    "Jaune coude":           "Pince à bec coudée",
    "Pince a denuder":       "Pince à dénuder",
    "Pince coude":           "Mini pince à bec demi rond coudée",
    "Pince universelle":     "Pince universelle",
    "Rouge coupante":        "Pince coupante",
    "Tournevis american":    "Tournevis américain",
    "Tournevis plat":        "Tournevis plat",
    "cutteur":               "Cutteur",
    "multimetre":            "Multimètre",
    "multimetre fils":       "Multimètre fils",
    "perceuse":              "Perceuse",
    "pied coulisse":         "Pied à coulisse",
    "pince plat":            "Mini pince à bec plat",
    "pince rond":            "Mini pince à bec rond",
    "rouge plat":            "Pince à bec plat",
}

def get_display_name(model_name: str) -> str:
    """Retourne le nom d'affichage correspondant au nom du modèle (insensible à la casse)."""
    for key, value in DISPLAY_NAMES.items():
        if key.lower() == model_name.lower():
            return value
    return model_name  # Fallback : nom brut du modèle


class RealtimeDetector:
    """Détecteur d'objets en temps réel utilisant YOLOv8."""
    
    def __init__(self, model_path: str = "best.pt", conf_threshold: float = 0.35):
        """
        Initialise le détecteur.
        
        Args:
            model_path: Chemin vers le modèle best.pt
            conf_threshold: Seuil de confiance pour les détections
        """
        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self.model = None
        self.load_model()
    
    def load_model(self) -> bool:
        """Charge le modèle YOLO."""
        try:
            YOLO = charger_yolo()
            if YOLO is None:
                return False
            
            if not os.path.exists(self.model_path):
                print(f"Erreur: modèle introuvable -> {self.model_path}", file=sys.stderr)
                return False
            
            print(f"[DETECTION] Chargement du modèle: {self.model_path}", file=sys.stderr)
            self.model = YOLO(self.model_path)
            # Appliquer les noms d'affichage corrects via model.model.names (interne ultralytics)
            # → result.plot() utilisera ces noms dans l'image annotée avec les polygones
            for class_id, name in list(self.model.model.names.items()):
                self.model.model.names[class_id] = get_display_name(name)
            print(f"[DETECTION] Modèle chargé. Classes: {list(self.model.names.values())}", file=sys.stderr)
            return True
        except Exception as e:
            print(f"Erreur au chargement du modèle: {e}", file=sys.stderr)
            return False
    
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        """Décode une image base64 en array numpy."""
        try:
            # Supprimer le préfixe data:image/... si présent
            if "," in base64_string:
                base64_string = base64_string.split(",", 1)[1]
            
            image_data = base64.b64decode(base64_string)
            image = Image.open(BytesIO(image_data))
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Erreur décodage base64: {e}", file=sys.stderr)
            return None
    
    def detect(self, base64_image: str) -> Dict[str, Any]:
        """
        Exécute la détection sur une image base64.
        
        Returns:
            Dict avec:
            - success: bool
            - detections: List[Dict] avec x, y, w, h, class, confidence
            - annotated_image: image annotée en base64
            - error: message d'erreur si applicable
        """
        if self.model is None:
            return {
                "success": False,
                "error": "Modèle non chargé",
                "detections": []
            }
        
        try:
            # Décoder l'image base64
            frame = self.decode_base64_image(base64_image)
            if frame is None:
                return {
                    "success": False,
                    "error": "Impossible de décoder l'image",
                    "detections": []
                }
            
            # Exécuter la détection
            results = self.model(frame, conf=self.conf_threshold, verbose=False)
            detections = []

            if results:
                result = results[0]
                boxes = result.boxes

                # Extraire les polygones de segmentation (masks.xy = liste de tableaux (N,2))
                masks_xy = []
                if result.masks is not None:
                    masks_xy = [m.tolist() for m in result.masks.xy]

                for i, box in enumerate(boxes):
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id   = int(box.cls[0].cpu().numpy())
                    raw_name   = result.names[class_id] if class_id in result.names else f"class_{class_id}"
                    class_name = get_display_name(raw_name)

                    polygon = masks_xy[i] if i < len(masks_xy) else []

                    detections.append({
                        "x":          float(x1),
                        "y":          float(y1),
                        "w":          float(x2 - x1),
                        "h":          float(y2 - y1),
                        "class":      class_name,
                        "class_id":   class_id,
                        "confidence": confidence,
                        "polygon":    polygon   # [[x,y], ...] dans l'espace de l'image capturée
                    })

            return {
                "success":    True,
                "detections": detections,
                "count":      len(detections)
            }
            
        except Exception as e:
            print(f"Erreur détection: {e}", file=sys.stderr)
            return {
                "success": False,
                "error": str(e),
                "detections": []
            }


def main():
    """Fonction main pour tester le service."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Service de détection YOLO en temps réel")
    parser.add_argument("--image", type=str, help="Chemin vers l'image à traiter")
    parser.add_argument("--model", type=str, default="best.pt", help="Chemin vers le modèle")
    parser.add_argument("--json", action="store_true", help="Sortie au format JSON")
    
    args = parser.parse_args()
    
    # Initialiser le détecteur
    detector = RealtimeDetector(model_path=args.model)
    
    if args.image and os.path.exists(args.image):
        # Traiter l'image
        with open(args.image, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        result = detector.detect(image_data)
        
        if args.json:
            print(json.dumps(result))
        else:
            print(f"Détections: {result['count']}")
            for det in result['detections']:
                print(f"  - {det['class']}: {det['confidence']:.2%}")


if __name__ == "__main__":
    main()
