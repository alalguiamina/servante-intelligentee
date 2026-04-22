import express from 'express';
import {
  createBorrow,
  returnBorrow,
  getAllBorrows,
  getBorrowById,
  getBorrowsByUser,
  updateBorrowStatuses,
  getBorrowsStats,
  markAsReturned  // ← AJOUTE CETTE LIGNE
} from '../controllers/borrowsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// ✅ Routes publiques (SANS protect)
router.get('/', getAllBorrows);                    // GET /api/borrows
router.post('/', createBorrow);                    // POST /api/borrows
router.get('/:id', getBorrowById);                 // GET /api/borrows/:id
router.get('/user/:userId', getBorrowsByUser);     // GET /api/borrows/user/:userId
router.put('/:id/return', returnBorrow);           // PUT /api/borrows/:id/return
router.post('/:id/mark-returned', markAsReturned); // POST /api/borrows/:id/mark-returned)
router.put('/update-statuses', updateBorrowStatuses);
router.get('/stats/overview', getBorrowsStats);

export default router;