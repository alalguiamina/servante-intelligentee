import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Obtenir toutes les catégories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { tools: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('❌ Erreur getAllCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Créer une nouvelle catégorie
// @route   POST /api/categories
// @access  Public (dev) / Protected (prod)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis'
      });
      return;
    }

    // Vérifier que le nom est unique
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });
  } catch (error) {
    console.error('❌ Erreur createCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Mettre à jour une catégorie
// @route   PUT /api/categories/:id
// @access  Public (dev) / Protected (prod)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis'
      });
      return;
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
      return;
    }

    // Vérifier que le nouveau nom est unique (si différent)
    if (category.name !== name.trim()) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: name.trim() }
      });

      if (existingCategory) {
        res.status(409).json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà'
        });
        return;
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: updatedCategory
    });
  } catch (error) {
    console.error('❌ Erreur updateCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Supprimer une catégorie
// @route   DELETE /api/categories/:id
// @access  Public (dev) / Protected (prod)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        tools: true
      }
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
      return;
    }

    // Vérifier que la catégorie n'a pas d'outils
    if (category.tools.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une catégorie qui contient des outils'
      });
      return;
    }

    await prisma.category.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur deleteCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
