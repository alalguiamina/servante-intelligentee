import { API_BASE_URL } from './api';

export interface DashboardOverview {
  totalTools: number;
  totalQuantity: number;
  availableQuantity: number;
  borrowedQuantity: number;
  activeUsers: number;
  availabilityRate: number;
}

export interface ToolsAnalytics {
  utilizationRate: number;
  averageBorrowDays: string;
  toolsNeedingMaintenance: number;
  totalBorrows: number;
  byCategory: Array<{
    name: string;
    total: number;
    borrowed: number;
    available: number;
  }>;
}

export interface UsersAnalytics {
  totalUsers: number;
  activeUsers: number;
  onTimeReturnRate: number;
  byRole: Array<{
    name: string;
    count: number;
  }>;
}

export interface BorrowsTrend {
  month: string;
  borrows: number;
  returns: number;
}

export interface StockAlert {
  id: string;
  name: string;
  category: string;
  availableQuantity: number;
  totalQuantity: number;
}

export interface InventoryOverview {
  totalStock: number;
  availableStock: number;
  borrowedStock: number;
  availabilityRate: number;
  byCategory: Array<{
    name: string;
    total: number;
    borrowed: number;
    available: number;
  }>;
}

// ✅ Récupérer l'aperçu du tableau de bord
export const fetchDashboardOverview = async (token: string): Promise<DashboardOverview> => {
  const response = await fetch(`${API_BASE_URL}/analytics/dashboard/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  const data = await response.json();
  return data.data;
};

// ✅ Récupérer les analyses des outils
export const fetchToolsAnalytics = async (token: string, month?: string): Promise<ToolsAnalytics> => {
  const url = new URL(`${API_BASE_URL}/analytics/tools`);
  if (month) {
    url.searchParams.append('month', month);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  const data = await response.json();
  return data.data;
};

// ✅ Récupérer les analyses utilisateurs
export const fetchUsersAnalytics = async (token: string): Promise<UsersAnalytics> => {
  const response = await fetch(`${API_BASE_URL}/analytics/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  const data = await response.json();
  return data.data;
};

// ✅ Récupérer la tendance des emprunts
export const fetchBorrowsTrend = async (token: string): Promise<BorrowsTrend[]> => {
  const response = await fetch(`${API_BASE_URL}/analytics/borrows/trend`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  const data = await response.json();
  return data.data;
};

// ✅ Récupérer les alertes de stock
export const fetchStockAlerts = async (token: string): Promise<StockAlert[]> => {
  const response = await fetch(`${API_BASE_URL}/analytics/stock/alerts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  const data = await response.json();
  return data.data;
};

// ✅ Récupérer l'aperçu de l'inventaire
export const fetchInventoryOverview = async (token: string): Promise<InventoryOverview> => {
  const response = await fetch(`${API_BASE_URL}/analytics/inventory/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  const data = await response.json();
  return data.data;
};
