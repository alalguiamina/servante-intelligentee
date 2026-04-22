import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoriesController';

const router = express.Router();

// ============================================
// CATEGORIES ROUTES
// ============================================

// Obtenir toutes les catégories
router.get('/', getAllCategories);

// Créer une catégorie
router.post('/', createCategory);

// Mettre à jour une catégorie
router.put('/:id', updateCategory);

// Supprimer une catégorie
router.delete('/:id', deleteCategory);

export default router;
