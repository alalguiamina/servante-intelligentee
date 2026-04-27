import express from 'express';
import {
  createBorrow,
  cancelBorrow,
  returnBorrow,
  returnAllBorrows,
  getAllBorrows,
  getBorrowById,
  getBorrowsByUser,
  updateBorrowStatuses,
  getBorrowsStats,
  markAsReturned,
  validateBorrowProduct,
  sendExtraToolsWarning
} from '../controllers/borrowsController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';

const router = express.Router();

// Configuration for image uploads
const upload = multer({
  dest: 'uploads/validations/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ✅ Routes publiques (SANS protect)
router.get('/', getAllBorrows);                    // GET /api/borrows
router.post('/', createBorrow);                    // POST /api/borrows
router.post('/return-all', returnAllBorrows);      // POST /api/borrows/return-all
router.get('/user/:userId', getBorrowsByUser);     // GET /api/borrows/user/:userId
router.get('/stats/overview', getBorrowsStats);    // GET /api/borrows/stats/overview
router.put('/update-statuses', updateBorrowStatuses);
router.post('/warnings/extra-tools', sendExtraToolsWarning);
router.get('/:id', getBorrowById);                 // GET /api/borrows/:id
router.put('/:id/return', returnBorrow);           // PUT /api/borrows/:id/return
router.post('/:id/mark-returned', markAsReturned); // POST /api/borrows/:id/mark-returned
router.delete('/:id/cancel', cancelBorrow);        // DELETE /api/borrows/:id/cancel
router.post('/:id/validate-product', upload.single('image'), validateBorrowProduct); // POST /api/borrows/:id/validate-product - VALIDATION AI

export default router;
