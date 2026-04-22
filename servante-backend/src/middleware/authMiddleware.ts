import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Étendre le type Request pour inclure admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        fullName: string;
        role: string;
      };
    }
  }
}

// ✅ Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/api/auth/badge-scan',
  '/api/auth/admin-login',
  '/api/auth/user-login',
  '/api/borrows',              // ← AJOUTÉ
  '/api/tools',   
  '/api/users',              // ← AJOUTÉ
  '/health'
];

// Middleware de protection des routes
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ Vérifier si la route est publique
    const isPublicRoute = publicRoutes.some(route => 
      req.path.startsWith(route)
    );

    if (isPublicRoute) {
      next();
      return;
    }

    let token: string | undefined;

    // Récupérer le token depuis le header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
      return;
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as { id: string };

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non trouvé'
      });
      return;
    }

    // Attacher l'utilisateur à la requête
    req.admin = user;

    next();
  } catch (error) {
    console.error('Erreur middleware protect:', error);
    res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide ou expiré'
    });
  }
};