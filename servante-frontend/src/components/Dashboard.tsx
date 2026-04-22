import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  fetchDashboardOverview,
  fetchToolsAnalytics,
  fetchUsersAnalytics,
  fetchBorrowsTrend,
  fetchStockAlerts,
  fetchInventoryOverview,
  DashboardOverview,
  ToolsAnalytics,
  UsersAnalytics,
  BorrowsTrend,
  StockAlert,
  InventoryOverview
} from '../services/analyticsService';

interface DashboardProps {
  token: string;
  language: 'fr' | 'en';
}

const COLORS = ['#0066CC', '#FF6B6B', '#4ECDC4', '#FFA500', '#9B59B6'];

export const Dashboard: React.FC<DashboardProps> = ({ token, language }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'users' | 'inventory'>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // État pour les données
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [toolsAnalytics, setToolsAnalytics] = useState<ToolsAnalytics | null>(null);
  const [usersAnalytics, setUsersAnalytics] = useState<UsersAnalytics | null>(null);
  const [borrowsTrend, setBorrowsTrend] = useState<BorrowsTrend[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview | null>(null);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        fetchDashboardOverview(token),
        fetchToolsAnalytics(token, selectedMonth),
        fetchUsersAnalytics(token),
        fetchBorrowsTrend(token),
        fetchStockAlerts(token),
        fetchInventoryOverview(token)
      ]);

      // Process results and handle individual failures
      let hasError = false;
      if (results[0].status === 'fulfilled') setDashboardOverview(results[0].value);
      else { console.error('Dashboard overview failed:', results[0]); hasError = true; }
      
      if (results[1].status === 'fulfilled') setToolsAnalytics(results[1].value);
      else { console.error('Tools analytics failed:', results[1]); hasError = true; }
      
      if (results[2].status === 'fulfilled') setUsersAnalytics(results[2].value);
      else { console.error('Users analytics failed:', results[2]); hasError = true; }
      
      if (results[3].status === 'fulfilled') setBorrowsTrend(results[3].value);
      else { console.error('Borrows trend failed:', results[3]); hasError = true; }
      
      if (results[4].status === 'fulfilled') setStockAlerts(results[4].value);
      else { console.error('Stock alerts failed:', results[4]); hasError = true; }
      
      if (results[5].status === 'fulfilled') setInventoryOverview(results[5].value);
      else { console.error('Inventory overview failed:', results[5]); hasError = true; }

      if (hasError) {
        setError('⚠️ Certaines données n\'ont pas pu être chargées. Certains graphiques peuvent être incomplets.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Disable auto-refresh to prevent infinite loading state
    // Auto-refresh every 60 seconds only if no errors
    const interval = setInterval(() => {
      if (!error) {
        loadData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [token, selectedMonth, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Statistique Card réutilisable
  const StatCard = ({ icon: Icon, label, value, trend, color = 'blue' }: any) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        <Icon className={`w-10 h-10 text-${color}-500 opacity-20`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {language === 'fr' ? 'Tableau de bord' : 'Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              {language === 'fr' ? 'Analyse complète de votre servante intelligente' : 'Complete analysis of your smart toolbox'}
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {(['overview', 'tools', 'users', 'inventory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {language === 'fr'
              ? tab === 'overview'
                ? 'Vue d\'ensemble'
                : tab === 'tools'
                ? 'Outils'
                : tab === 'users'
                ? 'Utilisateurs'
                : 'Inventaire'
              : tab === 'overview'
              ? 'Overview'
              : tab === 'tools'
              ? 'Tools'
              : tab === 'users'
              ? 'Users'
              : 'Inventory'}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet Overview */}
      {activeTab === 'overview' && dashboardOverview && (
        <div className="space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Package}
              label={language === 'fr' ? 'Total des outils' : 'Total Tools'}
              value={dashboardOverview.totalQuantity}
            />
            <StatCard
              icon={TrendingUp}
              label={language === 'fr' ? 'Disponibles' : 'Available'}
              value={dashboardOverview.availableQuantity}
              trend={`${dashboardOverview.availabilityRate}%`}
            />
            <StatCard
              icon={Package}
              label={language === 'fr' ? 'Empruntés' : 'Borrowed'}
              value={dashboardOverview.borrowedQuantity}
            />
            <StatCard
              icon={Users}
              label={language === 'fr' ? 'Utilisateurs actifs' : 'Active Users'}
              value={dashboardOverview.activeUsers}
            />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendance des emprunts */}
            {borrowsTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {language === 'fr' ? 'Tendance des emprunts' : 'Borrow Trends'}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={borrowsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="borrows" stroke="#0066CC" strokeWidth={2} />
                    <Line type="monotone" dataKey="returns" stroke="#4ECDC4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Alertes de stock */}
            {stockAlerts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {language === 'fr' ? 'Alertes de stock' : 'Stock Alerts'}
                </h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {stockAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-yellow-900">{alert.name}</p>
                        <p className="text-yellow-700">
                          {alert.availableQuantity}/{alert.totalQuantity} disponibles
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Distribution par catégorie */}
          {toolsAnalytics && toolsAnalytics.byCategory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    {language === 'fr' ? 'Utilisation par catégorie' : 'Usage by Category'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {language === 'fr' ? 'Total nombre d\'emprunts' : 'Total number of borrows'}
                  </p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'fr' ? 'Filtrer par mois' : 'Filter by Month'}
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolsAnalytics.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="borrowed" fill="#FF6B6B" name={language === 'fr' ? 'Empruntés' : 'Borrowed'} />
                  <Bar dataKey="available" fill="#4ECDC4" name={language === 'fr' ? 'Disponibles' : 'Available'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Tools */}
      {activeTab === 'tools' && toolsAnalytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label={language === 'fr' ? 'Taux d\'utilisation' : 'Utilization Rate'}
              value={`${toolsAnalytics.utilizationRate}%`}
            />
            <StatCard
              icon={Package}
              label={language === 'fr' ? 'Durée moyenne' : 'Average Duration'}
              value={`${toolsAnalytics.averageBorrowDays}j`}
            />
            <StatCard
              icon={AlertCircle}
              label={language === 'fr' ? 'Maintenance requise' : 'Maintenance Required'}
              value={toolsAnalytics.toolsNeedingMaintenance}
            />
            <StatCard
              icon={Package}
              label={language === 'fr' ? 'Total emprunts' : 'Total Borrows'}
              value={toolsAnalytics.totalBorrows}
            />
          </div>

          {/* Distribution par catégorie */}
          {toolsAnalytics.byCategory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    {language === 'fr' ? 'Utilisation par catégorie' : 'Usage by Category'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {language === 'fr' ? 'Total nombre d\'emprunts' : 'Total number of borrows'}
                  </p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'fr' ? 'Filtrer par mois' : 'Filter by Month'}
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolsAnalytics.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="borrowed" fill="#FF6B6B" name={language === 'fr' ? 'Empruntés' : 'Borrowed'} />
                  <Bar dataKey="available" fill="#4ECDC4" name={language === 'fr' ? 'Disponibles' : 'Available'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Users */}
      {activeTab === 'users' && usersAnalytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label={language === 'fr' ? 'Total utilisateurs' : 'Total Users'}
              value={usersAnalytics.totalUsers}
            />
            <StatCard
              icon={Users}
              label={language === 'fr' ? 'Utilisateurs actifs' : 'Active Users'}
              value={usersAnalytics.activeUsers}
            />
            <StatCard
              icon={TrendingUp}
              label={language === 'fr' ? 'Taux de retour à temps' : 'On-time Return Rate'}
              value={`${usersAnalytics.onTimeReturnRate}%`}
            />
          </div>

          {/* Distribution par rôle */}
          {usersAnalytics.byRole.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {language === 'fr' ? 'Segmentation des utilisateurs' : 'User Segmentation'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usersAnalytics.byRole.map(role => ({ name: role.name, value: role.count }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usersAnalytics.byRole.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Inventory */}
      {activeTab === 'inventory' && inventoryOverview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={Package}
              label={language === 'fr' ? 'Stock total' : 'Total Stock'}
              value={inventoryOverview.totalStock}
            />
            <StatCard
              icon={TrendingUp}
              label={language === 'fr' ? 'Disponible' : 'Available'}
              value={inventoryOverview.availableStock}
            />
            <StatCard
              icon={Package}
              label={language === 'fr' ? 'Emprunté' : 'Borrowed'}
              value={inventoryOverview.borrowedStock}
            />
            <StatCard
              icon={TrendingUp}
              label={language === 'fr' ? 'Taux de disponibilité' : 'Availability Rate'}
              value={`${inventoryOverview.availabilityRate}%`}
            />
          </div>

          {/* Stock par catégorie */}
          {inventoryOverview.byCategory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {language === 'fr' ? 'Stock par catégorie' : 'Stock by Category'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryOverview.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#0066CC" name={language === 'fr' ? 'Total' : 'Total'} />
                  <Bar dataKey="borrowed" fill="#FF6B6B" name={language === 'fr' ? 'Empruntés' : 'Borrowed'} />
                  <Bar dataKey="available" fill="#4ECDC4" name={language === 'fr' ? 'Disponibles' : 'Available'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
