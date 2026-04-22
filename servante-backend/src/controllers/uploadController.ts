import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Vérifier que c'est une image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Le fichier doit être une image'
      });
    }

    // Générer un nom unique
    const timestamp = Date.now();
    const filename = `tool-${timestamp}-${req.file.originalname}`;
    
    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sauvegarder le fichier
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    // Retourner l'URL relative
    const imageUrl = `/images/uploads/${filename}`;

    res.status(201).json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        imageUrl,
        filename
      }
    });
  } catch (error) {
    console.error('❌ Erreur uploadImage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload'
    });
  }
};
