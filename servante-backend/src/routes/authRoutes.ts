import express from 'express';
import { badgeScan, adminLogin, userLogin, getMe } from '../controllers/authController';

const router = express.Router();

// Connexion avec badge RFID
router.post('/badge-scan', badgeScan);

// Connexion admin
router.post('/admin-login', adminLogin);

// Connexion utilisateur avec email et mot de passe
router.post('/user-login', userLogin);

// Obtenir l'utilisateur connecté
router.get('/me', getMe);

export default router;