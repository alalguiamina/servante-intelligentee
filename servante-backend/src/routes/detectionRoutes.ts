import express from 'express';
import {
  detectObjects,
  detectToolDuringBorrow,
  checkStatus
} from '../controllers/detectionController';

const router = express.Router();

/**
 * Routes de détection
 */

// GET /api/detection/status - Vérifier le statut du service
router.get('/status', checkStatus);

// POST /api/detection/detect - Détecter les objets dans une image
router.post('/detect', detectObjects);

// POST /api/borrows/:borrowId/detect-tool - Détecter pendant l'emprunt
router.post('/:borrowId/detect-tool', detectToolDuringBorrow);

export default router;
