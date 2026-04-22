import express from 'express';
import {
  getAllTools,
  getAvailableTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  getToolsStats
} from '../controllers/toolsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// ============================================
// ROUTES PUBLIQUES (pas de protection)
// ============================================
router.get('/', getAllTools);
router.get('/available', getAvailableTools);
router.get('/:id', getToolById);

// ============================================
// ROUTES PUBLIQUES POUR DÉVELOPPEMENT
// ============================================
router.post('/', createTool);
router.put('/:id', updateTool);
router.delete('/:id', deleteTool);
router.get('/stats/overview', getToolsStats);

export default router;