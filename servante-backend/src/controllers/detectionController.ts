import { Request, Response } from 'express';
import realtimeDetectionService from '../services/realtimeDetectionService';

/**
 * POST /api/detection/detect
 * Détecte les objets dans une image base64
 */
export const detectObjects = async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image base64 requise'
      });
    }

    console.log(`[DETECTION] Traitement d'une image de ${image.length} caractères`);

    const result = await realtimeDetectionService.detectFromBase64(image);

    res.json(result);
  } catch (error) {
    console.error('[DETECTION] Erreur:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
};

/**
 * POST /api/borrows/:borrowId/detect-tool
 * Détecte les outils pendant la confirmation d'emprunt
 */
export const detectToolDuringBorrow = async (req: Request, res: Response) => {
  try {
    const { borrowId } = req.params;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image base64 requise'
      });
    }

    console.log(`[DETECTION] Détection pour emprunt: ${borrowId}`);

    const result = await realtimeDetectionService.detectFromBase64(image);

    res.json({
      ...result,
      borrowId
    });
  } catch (error) {
    console.error('[DETECTION] Erreur:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
};

/**
 * GET /api/detection/status
 * Vérifie que le service de détection fonctionne
 */
export const checkStatus = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Service de détection opérationnel',
      features: ['realtime-detection', 'bounding-boxes', 'confidence-scores']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
};
