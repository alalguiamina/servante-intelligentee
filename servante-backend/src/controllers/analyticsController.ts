import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Tableau de bord général - Vue d'ensemble
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    // Total des outils avec quantités réelles
    const totalTools = await prisma.tool.findMany();
    const totalCount = totalTools.length;
    const totalQuantity = totalTools.reduce((sum, tool) => sum + tool.totalQuantity, 0);
    const availableQuantity = totalTools.reduce((sum, tool) => sum + tool.availableQuantity, 0);
    const borrowedQuantity = totalTools.reduce((sum, tool) => sum + tool.borrowedQuantity, 0);

    // Utilisateurs actifs ce mois
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const activeUsers = await prisma.user.findMany({
      where: {
        borrows: {
          some: {
            borrowDate: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    // Taux de disponibilité
    const availabilityRate = totalQuantity > 0 ? Math.round((availableQuantity / totalQuantity) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalTools: totalCount,
        totalQuantity,
        availableQuantity,
        borrowedQuantity,
        activeUsers: activeUsers.length,
        availabilityRate
      }
    });
  } catch (error) {
    console.error('❌ Erreur getDashboardOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Analyses outils - Détails d'utilisation
export const getToolsAnalytics = async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    
    // Déterminer la plage de dates si un mois est spécifié
    let borrowDateFilter: any = {};
    if (month && typeof month === 'string') {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 1);
      borrowDateFilter = {
        gte: startDate,
        lt: endDate
      };
    }

    // Tous les outils avec leur catégorie
    const tools = await prisma.tool.findMany({
      include: { category: true }
    });
    const totalQuantity = tools.reduce((sum, tool) => sum + tool.totalQuantity, 0);
    const borrowedQuantity = tools.reduce((sum, tool) => sum + tool.borrowedQuantity, 0);

    // Taux d'utilisation global (basé sur le stock réel)
    const utilizationRate = totalQuantity > 0 ? Math.round((borrowedQuantity / totalQuantity) * 100) : 0;

    // Durée moyenne d'emprunt
    const completedBorrows = await prisma.borrow.findMany({
      where: {
        status: 'RETURNED',
        returnDate: { not: null },
        ...(Object.keys(borrowDateFilter).length > 0 && { borrowDate: borrowDateFilter })
      }
    });

    let averageBorrowDays = 0;
    if (completedBorrows.length > 0) {
      const totalDays = completedBorrows.reduce((sum, borrow) => {
        if (borrow.returnDate) {
          const days = Math.ceil(
            (borrow.returnDate.getTime() - borrow.borrowDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);
      averageBorrowDays = totalDays / completedBorrows.length;
    }

    // Outils nécessitant maintenance (empruntés depuis longtemps)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const toolsNeedingMaintenance = await prisma.borrow.findMany({
      where: {
        status: 'ACTIVE',
        borrowDate: {
          lt: thirtyDaysAgo
        }
      }
    });

    // Total emprunts pour le mois sélectionné
    const totalBorrowsCount = await prisma.borrow.count({
      where: {
        ...(Object.keys(borrowDateFilter).length > 0 && { borrowDate: borrowDateFilter })
      }
    });

    // Grouper par catégorie en utilisant les quantités réelles du stock
    const categoryMap = new Map<string, { borrowed: number; total: number; available: number }>();

    for (const tool of tools) {
      const categoryName = tool.category.name;
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { borrowed: 0, total: 0, available: 0 });
      }
      const cat = categoryMap.get(categoryName)!;
      cat.total += tool.totalQuantity;
      cat.available += tool.availableQuantity;
      cat.borrowed += tool.borrowedQuantity;
    }

    const byCategory = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      borrowed: data.borrowed,
      available: data.available
    }));

    res.json({
      success: true,
      data: {
        utilizationRate,
        averageBorrowDays: averageBorrowDays.toFixed(1),
        toolsNeedingMaintenance: toolsNeedingMaintenance.length,
        totalBorrows: totalBorrowsCount,
        totalQuantity,
        availableQuantity: tools.reduce((sum, tool) => sum + tool.availableQuantity, 0),
        borrowedQuantity,
        byCategory
      }
    });
  } catch (error) {
    console.error('❌ Erreur getToolsAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Analyses utilisateurs
export const getUsersAnalytics = async (req: Request, res: Response) => {
  try {
    // Total utilisateurs
    const totalUsers = await prisma.user.count();

    // Utilisateurs actifs (derniers 30 jours)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const activeUsers = await prisma.user.findMany({
      where: {
        borrows: {
          some: {
            borrowDate: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    // Taux de retour à temps
    const completedBorrows = await prisma.borrow.findMany({
      where: {
        status: 'RETURNED',
        returnDate: { not: null }
      }
    });

    let onTimeReturnRate = 0;
    if (completedBorrows.length > 0) {
      const onTimeReturns = completedBorrows.filter(borrow => {
        if (borrow.returnDate && borrow.dueDate) {
          return borrow.returnDate <= borrow.dueDate;
        }
        return false;
      });
      onTimeReturnRate = Math.round((onTimeReturns.length / completedBorrows.length) * 100);
    }

    // Segmentation par rôle
    const byRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers: activeUsers.length,
        onTimeReturnRate,
        byRole: byRole.map(role => ({
          name: role.role,
          count: role._count
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erreur getUsersAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Tendance des emprunts (6 derniers mois)
export const getBorrowsTrend = async (req: Request, res: Response) => {
  try {
    const months = [];
    const today = new Date();

    // Récupérer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const borrows = await prisma.borrow.count({
        where: {
          borrowDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const returns = await prisma.borrow.count({
        where: {
          returnDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      months.push({
        month: monthLabel,
        borrows,
        returns
      });
    }

    res.json({
      success: true,
      data: months
    });
  } catch (error) {
    console.error('❌ Erreur getBorrowsTrend:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Alertes de stock
export const getStockAlerts = async (req: Request, res: Response) => {
  try {
    const tools = await prisma.tool.findMany({
      where: {
        availableQuantity: {
          lte: 2 // Alerte si 2 ou moins disponibles
        }
      },
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      alerts: tools.length,
      data: tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        category: tool.category.name,
        availableQuantity: tool.availableQuantity,
        totalQuantity: tool.totalQuantity
      }))
    });
  } catch (error) {
    console.error('❌ Erreur getStockAlerts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Vue d'ensemble inventaire
export const getInventoryOverview = async (req: Request, res: Response) => {
  try {
    const tools = await prisma.tool.findMany({
      include: {
        category: true
      }
    });

    const totalStock = tools.reduce((sum, tool) => sum + tool.totalQuantity, 0);
    const availableStock = tools.reduce((sum, tool) => sum + tool.availableQuantity, 0);
    const borrowedStock = tools.reduce((sum, tool) => sum + tool.borrowedQuantity, 0);

    const availabilityRate = totalStock > 0 ? Math.round((availableStock / totalStock) * 100) : 0;

    // Stock par catégorie
    const categoryMap = new Map();
    tools.forEach(tool => {
      const categoryName = tool.category.name;
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          total: 0,
          borrowed: 0,
          available: 0
        });
      }
      const cat = categoryMap.get(categoryName);
      cat.total += tool.totalQuantity;
      cat.borrowed += tool.borrowedQuantity;
      cat.available += tool.availableQuantity;
    });

    const byCategory = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      borrowed: data.borrowed,
      available: data.available
    }));

    res.json({
      success: true,
      data: {
        totalStock,
        availableStock,
        borrowedStock,
        availabilityRate,
        byCategory
      }
    });
  } catch (error) {
    console.error('❌ Erreur getInventoryOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
