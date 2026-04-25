#!/usr/bin/env python3
"""
AI Validation Service - Validates product identification using YOLOv5 model
Checks if the borrowed product matches the selected product using computer vision
"""

import sys
import json
import argparse
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import warnings

warnings.filterwarnings('ignore')

try:
    import cv2
    import numpy as np
    import torch
    from PIL import Image
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing dependency: {e}",
        "message": "Please install: pip install opencv-python numpy torch torchvision pillow"
    }))
    sys.exit(1)


class ProductValidator:
    """Validates products using YOLOv5 model"""
    
    def __init__(self, model_path: str):
        """Initialize the validator with YOLOv5 model"""
        self.model_path = model_path
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self._load_model()
        
        # Product class mapping - adjust based on your model's classes
        # These should match the classes in your best2.pt model
        self.product_classes = {
            0: "tournevis_plat",
            1: "tournevis_americain",
            2: "cle_molette",
            3: "pince",
            4: "ciseaux",
            5: "clé",
            # Add more classes as needed based on your model
        }
    
    def _load_model(self) -> bool:
        """Load the YOLOv5 model"""
        try:
            print(f"Loading model from: {self.model_path}", file=sys.stderr)
            
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load YOLOv5 model
            self.model = torch.hub.load('ultralytics/yolov5', 'custom', 
                                       path=self.model_path, force_reload=False)
            self.model.to(self.device)
            self.model.eval()
            
            print(f"Model loaded successfully on {self.device}", file=sys.stderr)
            return True
            
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            raise
    
    def _get_product_name(self, class_id: int) -> str:
        """Get product name from class ID"""
        return self.product_classes.get(class_id, f"unknown_class_{class_id}")
    
    def detect_products(self, image_path: str, confidence: float = 0.5) -> Dict:
        """Detect products in image"""
        try:
            if not os.path.exists(image_path):
                return {
                    "success": False,
                    "error": "Image file not found",
                    "image_path": image_path
                }
            
            # Read image
            img = Image.open(image_path)
            
            # Run inference
            results = self.model(img, conf=confidence)
            
            # Parse detections
            detections = []
            predictions = results.pred[0]  # predictions (tensor)
            
            for pred in predictions:
                x1, y1, x2, y2, conf, cls = pred.tolist()
                class_id = int(cls)
                product_name = self._get_product_name(class_id)
                
                detections.append({
                    "class_id": class_id,
                    "product_name": product_name,
                    "confidence": float(conf),
                    "bbox": {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2)
                    }
                })
            
            return {
                "success": True,
                "detections": detections,
                "detection_count": len(detections)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "image_path": image_path
            }
    
    def validate_product(self, image_path: str, expected_product: str, 
                        confidence_threshold: float = 0.5) -> Dict:
        """
        Validate if detected product matches expected product
        
        Args:
            image_path: Path to the image file
            expected_product: Expected product name/ID
            confidence_threshold: Minimum confidence for detection
        
        Returns:
            Validation result with success status and details
        """
        try:
            # Detect products
            detection_result = self.detect_products(image_path, confidence=confidence_threshold)
            
            if not detection_result["success"]:
                return {
                    "success": False,
                    "is_valid": False,
                    "error": detection_result.get("error", "Detection failed"),
                    "reason": "Detection failed"
                }
            
            detections = detection_result.get("detections", [])
            
            if not detections:
                return {
                    "success": True,
                    "is_valid": False,
                    "reason": "No products detected in image",
                    "detections": []
                }
            
            # Find best matching detection
            best_detection = max(detections, key=lambda x: x["confidence"])
            
            # Normalize product names for comparison
            detected_product = best_detection["product_name"].lower().strip()
            expected_product_norm = str(expected_product).lower().strip()
            
            # Check if products match
            is_match = detected_product in expected_product_norm or \
                      expected_product_norm in detected_product
            
            result = {
                "success": True,
                "is_valid": is_match,
                "expected_product": expected_product,
                "detected_product": best_detection["product_name"],
                "confidence": best_detection["confidence"],
                "all_detections": detections,
                "message": "Product validated successfully" if is_match 
                          else "Product does not match expected product"
            }
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "is_valid": False,
                "error": str(e),
                "reason": "Validation failed"
            }


def main():
    parser = argparse.ArgumentParser(description='AI Product Validator')
    parser.add_argument('--model', type=str, required=True, help='Path to best.pt model')
    parser.add_argument('--image', type=str, required=True, help='Path to image file')
    parser.add_argument('--expected-product', type=str, required=False, 
                       help='Expected product name for validation')
    parser.add_argument('--confidence', type=float, default=0.5, 
                       help='Confidence threshold (0-1)')
    
    args = parser.parse_args()
    
    try:
        validator = ProductValidator(args.model)
        
        if args.expected_product:
            # Validate against expected product
            result = validator.validate_product(
                args.image,
                args.expected_product,
                args.confidence
            )
        else:
            # Just detect products
            result = validator.detect_products(args.image, args.confidence)
        
        print(json.dumps(result))
        sys.exit(0 if result.get("success") else 1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "message": "Validation service error"
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
