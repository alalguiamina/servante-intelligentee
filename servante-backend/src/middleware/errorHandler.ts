import { Request, Response, NextFunction } from 'express';

// Interface pour les erreurs personnalisées
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  errors?: any;
}

// Middleware de gestion des erreurs globales
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Erreur:', err);

  // Erreur Prisma (code commence par P)
  if (err.code && err.code.startsWith('P')) {
    res.status(400).json({
      success: false,
      message: 'Erreur de base de données',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    return;
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
    return;
  }

  // Erreur de validation
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors
    });
    return;
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Middleware pour les routes non trouvées
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée - ${req.originalUrl}`
  });
};