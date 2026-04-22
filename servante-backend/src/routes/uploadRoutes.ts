import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController';

const router = express.Router();

// Configuration de multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  }
});

// Route d'upload
router.post('/upload', upload.single('image'), uploadImage);

export default router;
