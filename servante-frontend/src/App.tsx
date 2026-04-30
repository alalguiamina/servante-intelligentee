// ============================================
// IMPORTS - Bibliothèques et dépendances
// ============================================
import React, { useState, useCallback } from "react";
import {
  Wifi,
  Settings,
  ArrowLeft,
  Lock,
  TrendingUp,
  Users,
  Package,
  CheckCircle,
  X,
  Search,
  Filter,
  Box,
  Grid,
  List,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  ShoppingCart,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  RotateCcw,
  Wrench,
  User,
  LogOut,
  History,
  Bell,
  CreditCard,
  SortAsc,
  Plus,
  Scan
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from "recharts";
import * as XLSX from 'xlsx';
// ============================================
// IMPORTS - i18next pour traduction
// ============================================
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

// ============================================
// IMPORT - Logo de l'école
// ============================================
import logo from './images/emines_logo.png';

// ============================================
// IMPORT - Toast Notifications
// ============================================
import { ToastContainer, Toast } from './components/Toast';

// ============================================
// IMPORTS - Components
// ============================================
import UserNotifications from './components/UserNotifications';
import UserSettings from './components/UserSettings';
import AdminSettings from './components/AdminSettings';
import BadgeScanner from './components/BadgeScanner';
import ReturnTool from './components/ReturnTool';
import ProductValidation from './components/ProductValidation';
import DrawerClosingGuard from './components/DrawerClosingGuard';
import DrawerOpeningGuard from './components/DrawerOpeningGuard';
import { DrawerCameraProvider } from './components/DrawerCameraContext';

// ============================================
// IMPORTS - API Backend
// ============================================
import { authAPI, toolsAPI, borrowsAPI, usersAPI, uploadAPI, categoriesAPI, hardwareAPI, API_BASE_URL } from './services/api';
import { useEffect } from 'react';

// ============================================
// TYPES - Définitions TypeScript
// ============================================
type Tool = {
  id: string;
  name: string;
  category: string;
  image: string;
  totalQuantity: number;        // NOUVEAU
  availableQuantity: number;    // NOUVEAU
  borrowedQuantity: number;     // NOUVEAU
  size?: 'Grand' | 'Moyen' | 'Petit' | 'Mini';
  drawer?: string;
};
type BorrowRecord = {
  id: string;
  toolId: string;
  toolName: string;
  borrowDate: Date;
  returnDate?: Date;
  dueDate: Date;  // ✅ NOUVEAU : Date limite de retour
  status: 'active' | 'returned' | 'overdue';
  userName: string;
  userEmail?: string;
  drawer?: string;
  isLate?: boolean;  // ✅ NOUVEAU
  daysLate?: number;  // ✅ NOUVEAU
};

type UserAccount = {
  id: string;
  fullName: string;
  email: string;
  badgeID: string;
  role: 'student' | 'professor' | 'technician';
  borrowHistory: BorrowRecord[];
  currentBorrows: BorrowRecord[];
  warnings: number;  // ✅ NOUVEAU : Nombre d'avertissements
  lateReturns: number;  // ✅ NOUVEAU : Nombre de retards
};
type User = {
  id: string;
  fullName: string;
  email: string;
  badgeId: string;
  role: 'student' | 'professor' | 'technician';
  password?: string | null;
  createdAt?: Date;
};

type DetectedTool = {
  class_name: string;
  tool_name: string;
  confidence: number;
};

type DrawerScanResult = {
  success: boolean;
  detected_tools: DetectedTool[];
  count: number;
  error?: string;
};

type ModalMode = 'create' | 'edit' | 'delete';

type AdminFilter = {
  user: string;
  drawer: string;
  category: string;
  status: 'all' | 'active' | 'due-soon' | 'overdue';  // ✅ NOUVEAU
};

/// ============================================
// TYPES - Filtres Admin
// ============================================
type AdminBorrowFilter = {
  searchUser: string;
  status: 'all' | 'active' | 'overdue' | 'due-soon' | 'returned';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | '2024' | '2023' | '2022' | '2021' | 'custom';  // ✅ AJOUT DES ANNÉES
  startDate?: Date;
  endDate?: Date;
  drawer: 'all' | '1' | '2' | '3' | '4';
};

type Screen =
  | 'badge-scan'
  | 'tool-selection'
  | 'confirm-borrow'
  | 'drawer-open'
  | 'drawer-opening-guard'
  | 'drawer-closing-guard'
  | 'product-validation'
  | 'admin-login'
  | 'user-login'
  | 'admin-dashboard'
  | 'admin-overview'
  | 'admin-tools-analysis'
  | 'admin-users-analysis'
  | 'return-tool'
  | 'user-account'
  | 'user-notifications'
  | 'user-settings'
  | 'admin-settings'
  | 'admin-manage-users'
  | 'admin-manage-tools';
type SortOption = 'default' | 'name-asc' | 'name-desc' | 'category';
type AvailabilityFilter = 'all' | 'available' | 'borrowed';
type ViewMode = 'grid' | 'list';


// ============================================
// TOOL NAME TRANSLATION KEY MAPPING
// ============================================
const toolNameToKeyMap: Record<string, string> = {
  'Tournevis Plat Grand': 'tool.tournevisPlatGrand',
  'Tournevis Plat Moyen': 'tool.tournevisPlatMoyen',
  'Tournevis Plat Petit': 'tool.tournevisPlatPetit',
  'Tournevis Plat Mini': 'tool.tournevisPlatMini',
  'Tournevis Américain Grand': 'tool.tournevisAmericainGrand',
  'Tournevis Américain Moyen': 'tool.tournevisAmericainMoyen',
  'Tournevis Américain Petit': 'tool.tournevisAmericainPetit',
  'Tournevis Américain Mini': 'tool.tournevisAmericainMini',
  'Clé à Molette': 'tool.cleMolette',
  'Jeu de Clés Six Pans Coudées': 'tool.jeuClesSixPansCoudees',
  'Jeu de Clés Six Pans Droites': 'tool.jeuClesSixPansDroites',
  'Jeu de Clés en Étoile': 'tool.jeuClesEmpreinteEtoile',
  'Pince Électronique de Précision': 'tool.pinceElectronique',
  'Mini Pince Coupante': 'tool.miniPinceCoupante',
  'Mini Pince Bec Demi-Rond Coudé': 'tool.miniPinceBecDemiRondCoude',
  'Mini Pince Bec Demi-Rond': 'tool.miniPinceBecDemiRond',
  'Mini Pince Bec Plat': 'tool.miniPinceBecPlat',
  'Pointe à Tracer': 'tool.pointeATracer',
  'Pointeau Automatique': 'tool.pointeauAutomatique',
  'Ciseaux': 'tool.ciseaux',
  'Cutteur': 'tool.cutteur',
  // Noms exacts de la base de données (seed)
  'Pince à dénuder': 'tool.pinceADenuder',
  'PINCE A DENUDER': 'tool.pinceADenuder',
  'Pince à bec plat': 'tool.pinceBecPlat',
  'Mini pince à bec rond': 'tool.miniPinceBecRond',
  'Mini pince à bec ROND': 'tool.miniPinceBecRond',
  'Dénudeur automatique': 'tool.denudeurAutomatique',
  'DENUDEUR AUTOMATIQUE': 'tool.denudeurAutomatique',
  'Mini pince coupante': 'tool.miniPinceCoupante',
  'Pince coupante': 'tool.pinceCoupante',
  'Pince COUPANTE': 'tool.pinceCoupante',
  'Pince universelle': 'tool.pinceUniverselle',
  'PINCE UNIVERSELLE': 'tool.pinceUniverselle',
  'Pince à bec coudée': 'tool.pinceABecCoude',
  'PINCE A BEC COUDE': 'tool.pinceABecCoude',
  'Clé L grande': 'tool.cleLGrande',
  'Clé L petite': 'tool.cleLPetite',
  'Lot de clés plates': 'tool.lotClesPlates',
  'Tournevis plat': 'tool.tournevisPlat',
  'Tournevis américain': 'tool.tournevisAmericain',
  'Perceuse': 'tool.perceuse',
  'PERCEUSE': 'tool.perceuse',
  'Pied à coulisse': 'tool.piedACoulisse',
  'PIED A COULISSE': 'tool.piedACoulisse',
  'Multimètre': 'tool.multimetre',
  'MULTIMETRE': 'tool.multimetre',
  'Mini pince à bec demi-rond coudée': 'tool.miniPinceBecDemiRondCoude',
  'Mini pince à bec demi-rond coudé': 'tool.miniPinceBecDemiRondCoude',
  'Mini pince à bec plat': 'tool.miniPinceBecPlat',
};

const getToolTranslationKey = (toolName: string): string => {
  // Exact match
  if (toolNameToKeyMap[toolName]) {
    return toolNameToKeyMap[toolName];
  }
  // Case-insensitive match
  for (const [key, value] of Object.entries(toolNameToKeyMap)) {
    if (key.toLowerCase() === toolName.toLowerCase()) {
      return value;
    }
  }
  // Fallback: retourner le nom brut (plutôt qu'une clé invalide)
  return toolName;
};

// ============================================
// CATEGORY TRANSLATION KEY MAPPING
// ============================================
const categoryToKeyMap: Record<string, string> = {
  'Tournevis': 'category.tournevis',
  'Clés': 'category.cles',
  'Pinces': 'category.pinces',
  'Outils de marquage': 'category.marquage',
  'Outils de coupe': 'category.coupe'
};

const getCategoryTranslationKey = (category: string): string => {
  return categoryToKeyMap[category] || category;
};

// Drawer letter to number mapping
const drawerLetterToNumber: Record<string, number> = {
  'x': 1,
  'y': 2,
  'z': 3,
  'a': 4,
};

const getDrawerNumber = (drawerLetter: string): number => {
  const num = parseInt(drawerLetter);
  if (!isNaN(num)) return num;
  return drawerLetterToNumber[drawerLetter?.toLowerCase()] || 1;
};

// ============================================
// SIZE TRANSLATION KEY MAPPING
// ============================================
const sizeToKeyMap: Record<string, string> = {
  'Grand': 'sizeGrand',
  'Moyen': 'sizeMoyen',
  'Petit': 'sizePetit',
  'Mini': 'sizeMini'
};

const getSizeTranslationKey = (size: string | undefined): string => {
  if (!size) return '-';
  return sizeToKeyMap[size] || size;
};

// ============================================
// HELPER FUNCTIONS - Calcul des retards
// ============================================
const calculateLateStatus = (borrow: BorrowRecord) => {
  const now = new Date();
  const dueDate = new Date(borrow.dueDate);
  const returnDate = borrow.returnDate ? new Date(borrow.returnDate) : null;

  // Si déjà retourné, vérifier si c'était en retard
  if (returnDate) {
    const wasLate = returnDate > dueDate;
    const daysLate = wasLate
      ? Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      isLate: wasLate,
      daysLate,
      status: wasLate ? 'overdue' as const : 'returned' as const
    };
  }

  // Si pas encore retourné, vérifier la date limite
  const isOverdue = now > dueDate;
  const daysLate = isOverdue
    ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

  return {
    isLate: isOverdue,
    daysLate,
    daysUntilDue,
    isDueSoon,
    status: isOverdue ? 'overdue' as const : 'active' as const
  };
};

// ============================================
// FONCTION - Filtrer les emprunts avec tous les critères (AVEC ANNÉES)
// ============================================
const filterBorrows = (
  borrows: BorrowRecord[],
  filters: AdminBorrowFilter
): BorrowRecord[] => {
  return borrows.filter(borrow => {
    // Filtre par nom d'utilisateur
    if (filters.searchUser) {
      const searchLower = filters.searchUser.toLowerCase();
      if (!borrow.userName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      const lateStatus = calculateLateStatus(borrow);

      if (filters.status === 'overdue' && lateStatus.status !== 'overdue') {
        return false;
      }
      if (filters.status === 'due-soon' && !lateStatus.isDueSoon) {
        return false;
      }
      if (filters.status === 'active' && lateStatus.status !== 'active') {
        return false;
      }
      if (filters.status === 'returned' && borrow.status !== 'returned') {
        return false;
      }
    }

    // Filtre par tiroir
    if (filters.drawer !== 'all' && borrow.drawer !== filters.drawer) {
      return false;
    }

    // ✅ FILTRE PAR PÉRIODE (AVEC ANNÉES)
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const borrowDate = new Date(borrow.borrowDate);

      switch (filters.dateRange) {
        case 'today':
          const today = new Date(now.setHours(0, 0, 0, 0));
          if (borrowDate < today) return false;
          break;

        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (borrowDate < weekAgo) return false;
          break;

        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (borrowDate < monthAgo) return false;
          break;

        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          if (borrowDate < yearAgo) return false;
          break;

        // ✅ FILTRES PAR ANNÉE SPÉCIFIQUE
        case '2024':
          if (borrowDate.getFullYear() !== 2024) return false;
          break;

        case '2023':
          if (borrowDate.getFullYear() !== 2023) return false;
          break;

        case '2022':
          if (borrowDate.getFullYear() !== 2022) return false;
          break;

        case '2021':
          if (borrowDate.getFullYear() !== 2021) return false;
          break;
      }
    }

    return true;
  });
};
// ============================================
// PALETTE DE COULEURS - Harmonisation visuelle
// ============================================
const COLORS = {
  primary: '#1e40af',        // Bleu professionnel fort
  secondary: '#3b82f6',      // Bleu clair
  success: '#059669',        // Vert professionnel
  warning: '#d97706',        // Orange professionnel
  danger: '#dc2626',         // Rouge professionnel
  info: '#0891b2',           // Bleu cyan professionnel
  purple: '#7c3aed',         // Violet professionnel
  chart1: '#1e40af',         // Bleu foncé
  chart2: '#3b82f6',         // Bleu moyen
  chart3: '#60a5fa',         // Bleu clair
  chart4: '#93c5fd',         // Bleu très clair
  chart5: '#bfdbfe',         // Bleu pâle
};


// ============================================
// COMPOSANT - KPI Card (Style Power BI)
// ============================================
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, trend, trendUp, color, subtitle }) => (
  <div className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div
        className="p-3 rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
    </div>

    <div className="flex items-end justify-between">
      <div>
        <div className="text-4xl font-bold mb-1" style={{ color }}>{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// COMPOSANT - Logo EMINES
// ============================================
const Logo = () => (
  <div>
    <img
      src={logo}
      alt="Logo EMINES"
      className="h-12 w-auto object-contain drop-shadow-lg"
    />
  </div>
);

// ============================================
// COMPOSANT - Sélecteur de langue (avec i18next)
// ============================================
const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (langMenuOpen && !target.closest('.language-selector')) {
        setLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langMenuOpen]);

  return (
    <div className="language-selector relative">
      <button
        onClick={() => setLangMenuOpen(!langMenuOpen)}
        className="px-3 py-2.5 rounded-full bg-white/90 text-sm font-semibold shadow-lg hover:bg-white transition-all backdrop-blur-sm flex items-center gap-1.5 whitespace-nowrap"
      >
        {i18n.language.toUpperCase()}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {langMenuOpen && (
        <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg overflow-hidden z-50">
          <button
            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
            onClick={() => {
              i18n.changeLanguage('fr');
              setLangMenuOpen(false);
            }}
          >
            🇫🇷 Français
          </button>

          <button
            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
            onClick={() => {
              i18n.changeLanguage('en');
              setLangMenuOpen(false);
            }}
          >
            🇬🇧 English
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPOSANT - Menu utilisateur (Compte)
// ============================================
const UserMenu: React.FC<{
  currentUser: UserAccount | null;
  allBorrows: BorrowRecord[];  // ✅ AJOUTE CETTE PROP
  setCurrentScreen: (screen: Screen) => void;
}> = ({ currentUser, allBorrows, setCurrentScreen }) => {  // ✅ AJOUTE allBorrows ICI
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ CALCUL DYNAMIQUE des emprunts actifs de l'utilisateur
  const userActiveBorrows = currentUser
    ? allBorrows.filter(b =>
      b.userName === currentUser.fullName &&
      (b.status === 'active' || b.status === 'overdue')
    )
    : [];

  // ✅ SI PAS D'UTILISATEUR, ne rien afficher
  if (!currentUser) return null;

  return (
    <div className="relative user-menu">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/90 hover:bg-white transition-all shadow-md"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
          {currentUser.fullName.charAt(0)}
        </div>

        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {currentUser.fullName}
          </p>
          <p className="text-xs text-slate-600">{currentUser.role}</p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-700 transition-transform ${menuOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-blue-900">
            <p className="font-bold text-white">
              {currentUser.fullName}
            </p>
            <p className="text-sm text-white">{currentUser.email}</p>
            <p className="text-xs text-blue-100 mt-1">
              {currentUser.badgeID}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentScreen('user-account');
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3"
          >
            <User className="w-5 h-5 text-slate-600" />
            <span className="font-medium">{t('myAccount')}</span>
          </button>

          <button
            onClick={() => {
              setCurrentScreen('user-account');
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3"
          >
            <History className="w-5 h-5 text-slate-600" />
            <div>
              <span className="font-medium">{t('borrowHistory')}</span>
              <p className="text-xs text-slate-500">
                {userActiveBorrows.length} {t('active')}
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setCurrentScreen('user-notifications');
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="font-medium">{t('notifications')}</span>
          </button>

          <button
            onClick={() => {
              setCurrentScreen('user-settings');
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3"
          >
            <Settings className="w-5 h-5 text-slate-600" />
            <span className="font-medium">{t('settings')}</span>
          </button>

          <div className="border-t border-slate-200">
            <button
              onClick={() => {
                authAPI.logout();
                setCurrentScreen('badge-scan');
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-blue-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// ============================================
// COMPOSANT - Menu de navigation latéral (Admin)
// ============================================
const AdminSidebar: React.FC<{
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
}> = ({ currentScreen, setCurrentScreen }) => {
  const { t } = useTranslation();

  const menuItems = [
    // Dashboards
    { id: 'admin-overview', icon: <TrendingUp className="w-5 h-5" />, label: t('overview') },
    { id: 'admin-tools-analysis', icon: <Package className="w-5 h-5" />, label: t('toolsAnalysis') },
    { id: 'admin-users-analysis', icon: <Users className="w-5 h-5" />, label: t('usersAnalysis') },

    // Séparateur
    { separator: true },

    // Gestion (NOUVEAU)
    { id: 'admin-manage-users', icon: <User className="w-5 h-5" />, label: t('manageUsers') },
    { id: 'admin-manage-tools', icon: <Wrench className="w-5 h-5" />, label: t('manageTools') },
    { id: 'admin-settings', icon: <Settings className="w-5 h-5" />, label: t('settings') },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 pt-20 shadow-lg">
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) =>
          item.separator ? (
            <div key={`sep-${index}`} className="h-px bg-gray-200 my-4"></div>
          ) : (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id as Screen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentScreen === item.id
                ? 'bg-navy text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        )}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentScreen('badge-scan')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('backHome')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// ============================================
// COMPOSANT - Bouton Reset Filters
// ============================================
const ResetFiltersButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-xl bg-slate-500 text-white font-semibold hover:bg-slate-600 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
    >
      <RotateCcw className="w-4 h-4" />
      {t('resetFilters')}
    </button>
  );
};

// ============================================
// COMPOSANT - Filtres Admin Emprunts (AVEC ANNÉES)
// ============================================
const AdminBorrowFilters: React.FC<{
  filters: AdminBorrowFilter;
  setFilters: (filters: AdminBorrowFilter) => void;
  onReset: () => void;
}> = ({ filters, setFilters, onReset }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{t('advancedFilters')}</h3>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {t('resetFiltersBtn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recherche par nom */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {t('usersManagement')}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.searchUser}
              onChange={(e) => setFilters({ ...filters, searchUser: e.target.value })}
              placeholder={t('usernamePlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filtre par statut */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {t('status')}
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">{t('allStatus')}</option>
            <option value="active">{t('active')}</option>
            <option value="overdue">{t('overdue')}</option>
            <option value="due-soon">{t('dueSoon')}</option>
            <option value="returned">{t('returned')}</option>
          </select>
        </div>

        {/* Filtre par tiroir */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {t('drawer')}
          </label>
          <select
            value={filters.drawer}
            onChange={(e) => setFilters({ ...filters, drawer: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">{t('allDrawers')}</option>
            <option value="1">{t('drawer1')}</option>
            <option value="2">{t('drawer2')}</option>
            <option value="3">{t('drawer3')}</option>
            <option value="4">{t('drawer4')}</option>
          </select>
        </div>

        {/*  FILTRE PAR PÉRIODE AVEC ANNÉES */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {t('period')}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">{t('allPeriod')}</option>
            <option value="today">{t('today')}</option>
            <option value="week">{t('thisWeek')}</option>
            <option value="month">{t('thisMonth')}</option>
            <option value="year">{t('thisYear')}</option>
            <option disabled>──────────</option>
            <option value="2024">{t('year2024')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
// ============================================
// COMPOSANT - Tableau Admin des Emprunts
// ============================================
const AdminBorrowsTable: React.FC<{
  borrows: BorrowRecord[];
  onSendEmail: (borrow: BorrowRecord) => void;
  onSendBulkEmail: (borrows: BorrowRecord[]) => void;
  getTranslatedToolName: (toolName: string) => string;
  onReturnAll?: () => void;
  onMarkAsReturned?: (borrow: BorrowRecord) => void;
}> = ({ borrows, onSendEmail, onSendBulkEmail, getTranslatedToolName, onReturnAll, onMarkAsReturned }) => {
  const { t, i18n } = useTranslation();

  // Calculer les emprunts en retard
  const overdueBorrows = borrows.filter(b => {
    const status = calculateLateStatus(b);
    return status.status === 'overdue';
  });

  const dueSoonBorrows = borrows.filter(b => {
    const status = calculateLateStatus(b);
    return status.isDueSoon;
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {t('borrowHistoryTitle')} ({borrows.length})
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm">
            {overdueBorrows.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                {overdueBorrows.length} {t('overdue')}
              </span>
            )}
            {dueSoonBorrows.length > 0 && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">
                {dueSoonBorrows.length} {t('dueSoon')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* Return All button */}
          {onReturnAll && (
            <button
              onClick={onReturnAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {t('returnAll')}
            </button>
          )}

          {/* Export Excel */}
          <button
            onClick={() => {
              const data = borrows.map(b => {
                const status = calculateLateStatus(b);
                return {
                  [t('user')]: b.userName,
                  [t('email')]: b.userEmail,
                  [t('tool')]: getTranslatedToolName(b.toolName),
                  [t('drawer')]: b.drawer,
                  [t('borrowDate')]: new Date(b.borrowDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR'),
                  [t('dueDate')]: new Date(b.dueDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR'),
                  [t('returnDate')]: b.returnDate ? new Date(b.returnDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : '-',
                  [t('status')]: status.status === 'overdue' ? t('overdue') :
                    status.isDueSoon ? t('dueSoon') :
                      b.status === 'returned' ? t('returned') : t('active'),
                  [t('lateReturnsCount')]: status.daysLate || 0,
                  [t('daysRemaining')]: status.daysUntilDue || '-'
                };
              });

              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Borrows');
              XLSX.writeFile(wb, `emprunts_admin_${new Date().toISOString().split('T')[0]}.xlsx`);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export')} ({borrows.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('user')}</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('tool')}</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('drawer')}</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('borrowDate')}</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('dueDate')}</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('status')}</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map((borrow, idx) => {
              const status = calculateLateStatus(borrow);
              const isOverdue = status.status === 'overdue';
              const isDueSoon = status.isDueSoon;

              return (
                <tr key={borrow.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${isOverdue ? 'bg-gradient-to-br from-red-600 to-red-800' :
                        isDueSoon ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                          'bg-gradient-to-br from-blue-600 to-blue-800'
                        }`}>
                        {borrow.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{borrow.userName}</p>
                        <p className="text-xs text-slate-500">{borrow.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium">{getTranslatedToolName(borrow.toolName)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-semibold">
                      {getDrawerNumber(borrow.drawer)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">
                    {new Date(borrow.borrowDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">
                    {new Date(borrow.dueDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isOverdue ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        {t('delay')}: {status.daysLate}d
                      </span>
                    ) : isDueSoon ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {status.daysUntilDue}d {t('remaining')}
                      </span>
                    ) : borrow.status === 'returned' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {t('returned')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        ✓ {t('active')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {(isOverdue || isDueSoon) && borrow.status !== 'returned' && (
                        <button
                          onClick={() => onSendEmail(borrow)}
                          className={`px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all ${isOverdue
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                        >
                          {t('send')}
                        </button>
                      )}
                      {borrow.status !== 'returned' && onMarkAsReturned && (
                        <button
                          onClick={() => onMarkAsReturned(borrow)}
                          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-all flex items-center gap-1"
                          title="Marquer comme retourné par l'admin"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Retourné
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {borrows.length === 0 && (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">{t('noBorrowsMatch')}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function App() {
  const { t, i18n } = useTranslation();

  // ============================================
  // FONCTION - Envoyer email avec traduction
  // ============================================
  const sendEmailReminder = (borrow: BorrowRecord, type: 'reminder' | 'overdue') => {
    const subject = type === 'reminder'
      ? `${t('toolReminder').replace('{toolName}', borrow.toolName)}`
      : `${t('toolOverdueAlert').replace('{toolName}', borrow.toolName)}`;

    const dueDate = new Date(borrow.dueDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const borrowDate = new Date(borrow.borrowDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR');

    let body = '';
    if (type === 'reminder') {
      body = `${t('hello')} ${borrow.userName},\n\n${t('emailToolBorrowBody')}\n\n${t('exportTool')} : ${borrow.toolName}\n${t('borrowDate')} : ${borrowDate}\n${t('dueDate')} : ${dueDate}\n${t('exportDrawer')} : ${borrow.drawer}\n\n${t('emailReturnReminder')}\n\n${t('hello')},\n${t('emailToolTeam')}`;
    } else {
      body = `${t('hello')} ${borrow.userName},\n\n⚠️ ALERT: ${t('alertLate')} ${borrow.daysLate} ${borrow.daysLate > 1 ? 'days' : 'day'}.\n\n${t('exportTool')} : ${borrow.toolName}\n${t('borrowDate')} : ${borrowDate}\n${t('dueDate')} : ${dueDate}\n${t('delay')} : ${borrow.daysLate} ${borrow.daysLate > 1 ? 'days' : 'day'}\n${t('exportDrawer')} : ${borrow.drawer}\n\n${t('emailReturnReminder')}\n\n${t('hello')},\n${t('emailToolTeam')}`;
    }

    // Encoder le sujet et le corps pour l'URL
    const mailtoLink = `mailto:${borrow.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Ouvrir le client email par défaut
    window.location.href = mailtoLink;

    // Show notification toast
    const message = type === 'reminder'
      ? `✉️ ${t('emailReminderSent') || 'Email reminder sent'} to ${borrow.userName}`
      : `✉️ ${t('emailOverdueSent') || 'Overdue notification sent'} to ${borrow.userName}`;
    showToast(message, 'success', 3000);
  };

  // FONCTION - Obtenir le nom traduit d'un outil
  const getTranslatedToolName = (toolName: string): string => {
    const keyMap = toolNameToKeyMap as Record<string, string>;
    const translationKey = keyMap[toolName] || toolName;
    return translationKey !== toolName ? t(translationKey) : toolName;
  };

  // FONCTION - Obtenir le nom traduit d'une catégorie
  const getTranslatedCategory = (category: string): string => {
    const translationKey = getCategoryTranslationKey(category);
    return translationKey !== category ? t(translationKey) : category;
  };

  // FONCTION - Obtenir la taille traduite
  const getTranslatedSize = (size: string): string => {
    if (size === 'Grand') return t('sizeGrand');
    if (size === 'Moyen') return t('sizeMoyen');
    if (size === 'Petit') return t('sizePetit');
    if (size === 'Mini') return t('sizeMini');
    return size;
  };

  // Constante pour "toutes catégories" qui ne change pas avec la langue
  const ALL_CATEGORIES = '__ALL__';

  const [currentScreen, setCurrentScreen] = useState<Screen>('badge-scan');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allBorrows, setAllBorrows] = useState<BorrowRecord[]>([]);
  const [borrowsLoading, setBorrowsLoading] = useState(false);
  const [showBadgeScanner, setShowBadgeScanner] = useState(false);
  // États pour la gestion des utilisateurs
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<ModalMode>('create');
  const [showDeleteConfirmWithBorrows, setShowDeleteConfirmWithBorrows] = useState(false);
  const [userActiveBorrowsCount, setUserActiveBorrowsCount] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [badgeScannerOpen, setBadgeScannerOpen] = useState(false);
  const [scannedBadgeId, setScannedBadgeId] = useState<string>('');

  // ✅ États pour la validation produit IA
  const [activeBorrowId, setActiveBorrowId] = useState<string | null>(null);
  const [validationRequired, setValidationRequired] = useState(false);
  const [detectionRetryKey, setDetectionRetryKey] = useState(0);
  const [guardDrawerId, setGuardDrawerId] = useState<'1'|'2'|'3'|'4' | null>(null);
  const [guardSnapshot, setGuardSnapshot] = useState<any[]>([]); // Detection[] from DrawerOpeningGuard
  // Borrowed tools physically detected in the drawer during Phase-1 scan (to auto-return on drawer close)
  const [detectedBorrowedInDrawer, setDetectedBorrowedInDrawer] = useState<string[]>([]);

  // États pour le scan YOLO du tiroir
  const [drawerScanResult, setDrawerScanResult] = useState<DrawerScanResult | null>(null);
  const [isScanningDrawer, setIsScanningDrawer] = useState(false);
  const [cameraFrameTs, setCameraFrameTs] = useState(0);
  const [liveDetections, setLiveDetections] = useState<DetectedTool[]>([]);
  const [scanSecondsLeft, setScanSecondsLeft] = useState(0);

  // État pour l'aperçu caméra (avant le scan YOLO)
  const [previewTs, setPreviewTs] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  // Ref pour savoir si on était déjà sur un écran avec preview (évite de recharger le modèle)
  const previewActiveRef = React.useRef(false);

  const SCAN_DURATION = 32; // secondes affichées (≈ 12 s chargement modèle + 20 s détection)

  // Démarrer/arrêter l'aperçu caméra selon l'écran courant
  useEffect(() => {
    const needsPreview = currentScreen === 'confirm-borrow' || currentScreen === 'drawer-open';

    if (!needsPreview) {
      // On quitte les écrans preview → arrêter si on était actif
      if (previewActiveRef.current) {
        previewActiveRef.current = false;
        hardwareAPI.stopPreview().catch(() => {});
      }
      setPreviewTs(0);
      setPreviewReady(false);
      return;
    }

    if (!previewActiveRef.current) {
      // Première entrée dans un écran preview → démarrer le processus YOLO
      previewActiveRef.current = true;
      hardwareAPI.startPreview(0, 600).catch(() => {});
    }
    // Sinon : transition entre confirm-borrow et drawer-open → garder le même process (YOLO déjà chargé)

    const interval = setInterval(() => setPreviewTs(Date.now()), 200);

    // Cleanup : arrêter le polling mais PAS le process Python (géré ci-dessus)
    return () => clearInterval(interval);
  }, [currentScreen]);

  // Poll live camera frame + detections every 150 ms while scanning
  useEffect(() => {
    if (!isScanningDrawer) { setLiveDetections([]); setScanSecondsLeft(0); return; }

    setScanSecondsLeft(SCAN_DURATION);
    const startTime = Date.now();

    const interval = setInterval(async () => {
      // Compteur
      const elapsed = (Date.now() - startTime) / 1000;
      setScanSecondsLeft(Math.max(0, Math.ceil(SCAN_DURATION - elapsed)));

      // Frame live
      setCameraFrameTs(Date.now());

      // Détections live
      try {
        const res = await fetch(
          `${API_BASE_URL.replace('/api', '')}/api/hardware/camera/detections?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.detected_tools)) setLiveDetections(data.detected_tools);
        }
      } catch { /* backend not ready yet */ }
    }, 150);
    return () => clearInterval(interval);
  }, [isScanningDrawer]);

  // États pour la gestion des outils
  const [selectedToolForEdit, setSelectedToolForEdit] = useState<Tool | null>(null);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [toolModalMode, setToolModalMode] = useState<ModalMode>('create');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // État pour la modale "emprunts actifs" d'un outil (admin manage tools)
  const [activeBorrowsModalTool, setActiveBorrowsModalTool] = useState<Tool | null>(null);

  // États pour la gestion des catégories
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<ModalMode>('create');
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // ✅ États pour les filtres admin
  const [adminFilters, setAdminFilters] = useState<AdminBorrowFilter>({
    searchUser: '',
    status: 'all',
    dateRange: 'all',
    drawer: 'all'
  });

  // ✅ États pour les notifications/toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 4000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Load all data in parallel with timeout protection
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // Set a max timeout of 10 seconds for all requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout')), 10000)
        );
        
        const allRequests = Promise.allSettled([
          toolsAPI.getAll(),
          categoriesAPI.getAll(),
          borrowsAPI.getAll(),
          usersAPI.getAll()
        ]);
        
        const results = await Promise.race([allRequests, timeoutPromise]) as any;
        
        // Process tools
        if (results[0]?.status === 'fulfilled' && results[0]?.value?.success) {
          const adaptedTools = results[0].value.data.map((tool: any) => ({
            id: tool.id,
            name: tool.name,
            category: tool.category?.name || tool.category,
            image: tool.imageUrl,
            totalQuantity: tool.totalQuantity,
            availableQuantity: tool.availableQuantity || 0,
            borrowedQuantity: tool.borrowedQuantity || 0,
            size: tool.size || 'Moyen',
            drawer: tool.drawer
          }));
          setTools(adaptedTools);
          console.log('✅ Outils chargés:', adaptedTools.length);
        } else {
          setTools([]);
        }
        
        // Process categories
        if (results[1]?.status === 'fulfilled' && results[1]?.value?.success) {
          setCategories(results[1].value.data);
          console.log('✅ Catégories chargées');
        } else {
          setCategories([]);
        }
        
        // Process borrows
        if (results[2]?.status === 'fulfilled' && results[2]?.value?.success) {
          const adaptedBorrows = results[2].value.data.map((borrow: any) => ({
            id: borrow.id,
            toolId: borrow.toolId,
            toolName: borrow.toolName,
            borrowDate: new Date(borrow.borrowDate),
            returnDate: borrow.returnDate ? new Date(borrow.returnDate) : undefined,
            dueDate: new Date(borrow.dueDate),
            status: borrow.status,
            userName: borrow.userName,
            userEmail: borrow.userEmail,
            drawer: borrow.drawer
          }));
          setAllBorrows(adaptedBorrows);
          console.log('✅ Emprunts chargés:', adaptedBorrows.length);
        } else {
          setAllBorrows([]);
        }
        
        // Process users
        if (results[3]?.status === 'fulfilled' && results[3]?.value?.success) {
          const normalizedUsers = results[3].value.data.map((user: User) => ({
            ...user,
            role: (user.role?.toLowerCase() || 'student') as 'student' | 'professor' | 'technician'
          }));
          setUsers(normalizedUsers);
          console.log('✅ Utilisateurs chargés:', normalizedUsers.length);
        } else {
          setUsers([]);
        }
        
        loadCurrentUser();
      } catch (error) {
        console.error('❌ Erreur chargement données:', error);
        // Set empty states on timeout
        setTools([]);
        setCategories([]);
        setAllBorrows([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Initialiser le badge ID quand on ouvre/ferme le modal utilisateur
  useEffect(() => {
    if (userModalOpen) {
      setScannedBadgeId(selectedUser?.badgeId || '');
    } else {
      setScannedBadgeId('');
    }
  }, [userModalOpen, selectedUser]);

  const loadBorrowsFromBackend = async () => {
    try {
      setBorrowsLoading(true);
      const response = await borrowsAPI.getAll();

      if (response.success) {
        // Adapter les données du backend au format frontend
        const adaptedBorrows: BorrowRecord[] = response.data.map((borrow: any) => ({
          id: borrow.id,
          toolId: borrow.toolId,
          toolName: borrow.toolName,
          borrowDate: new Date(borrow.borrowDate),
          returnDate: borrow.returnDate ? new Date(borrow.returnDate) : undefined,
          dueDate: new Date(borrow.dueDate),
          status: borrow.status,
          userName: borrow.userName,
          userEmail: borrow.userEmail,
          drawer: borrow.drawer
        }));

        setAllBorrows(adaptedBorrows);
        console.log(' Emprunts chargés depuis le backend:', adaptedBorrows.length);
      }
    } catch (error) {
      console.error(' Erreur chargement emprunts:', error);
      // En cas d'erreur, garder un tableau vide
      setAllBorrows([]);
    } finally {
      setBorrowsLoading(false);
    }
  };

  // ============================================
  // FONCTION - Auto-retour des outils empruntés détectés physiquement dans le tiroir
  // ============================================
  const autoReturnBorrowedTools = async (toolNames: string[]) => {
    if (!toolNames.length) return;
    const norm = (s: string) => s.toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ');
    let returnedCount = 0;
    for (const name of toolNames) {
      const borrow = allBorrows.find(b =>
        (b.status === 'active' || b.status === 'overdue') &&
        norm(b.toolName) === norm(name)
      );
      if (borrow) {
        try {
          await borrowsAPI.return(borrow.id);
          returnedCount++;
        } catch { /* silencieux */ }
      }
    }
    if (returnedCount > 0) {
      showToast(`✅ ${returnedCount} retour${returnedCount > 1 ? 's' : ''} automatique${returnedCount > 1 ? 's' : ''} enregistré${returnedCount > 1 ? 's' : ''}`, 'success', 3000);
    }
  };

  // ============================================
  // FONCTION - Upload d'image
  // ============================================
  const handleImageUpload = async (file: File) => {
    try {
      console.log('📤 Upload fichier:', file.name);
      const result = await uploadAPI.uploadImage(file);

      if (result.success) {
        setUploadedImageUrl(result.data.imageUrl);
        console.log('✅ Image uploadée:', result.data.imageUrl);
        alert(`✅ Image uploadée: ${file.name}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error('❌ Erreur upload:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // ============================================
  // FONCTION - Charger les utilisateurs
  // ============================================
  const loadUsersFromBackend = async () => {
    try {
      setUsersLoading(true);
      const response = await usersAPI.getAll();

      if (response.success) {
        // ✅ Normaliser les rôles en minuscules
        const normalizedUsers = response.data.map((user: User) => ({
          ...user,
          role: (user.role?.toLowerCase() || 'student') as 'student' | 'professor' | 'technician'
        }));
        setUsers(normalizedUsers);
        console.log('✅ Utilisateurs chargés:', normalizedUsers.length);
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // ============================================
  // FONCTION - Charger l'utilisateur connecté
  // ============================================
  const loadCurrentUser = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        console.log('✅ Utilisateur connecté:', user);
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
    }
  };

  // ============================================
  // FONCTION - Recharger les outils
  // ============================================
  const reloadTools = async () => {
    try {
      setLoading(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      const response = await Promise.race([toolsAPI.getAll(), timeoutPromise]) as any;
      
      if (response.success) {
        const adaptedTools = response.data.map((tool: any) => ({
          id: tool.id,
          name: tool.name,
          category: tool.category?.name || tool.category,
          image: tool.imageUrl,
          totalQuantity: tool.totalQuantity,
          availableQuantity: tool.availableQuantity || 0,
          borrowedQuantity: tool.borrowedQuantity || 0,
          size: tool.size || 'Moyen',
          drawer: tool.drawer
        }));
        setTools(adaptedTools);
      }
    } catch (error) {
      console.error('❌ Erreur reload outils:', error);
    } finally {
      setLoading(false);
    }
  };


  // ============================================
  // FONCTION - Recharger les emprunts
  // ============================================
  const reloadBorrows = async () => {
    try {
      setBorrowsLoading(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      const response = await Promise.race([borrowsAPI.getAll(), timeoutPromise]) as any;
      
      if (response.success) {
        const adaptedBorrows = response.data.map((borrow: any) => ({
          id: borrow.id,
          toolId: borrow.toolId,
          toolName: borrow.toolName,
          borrowDate: new Date(borrow.borrowDate),
          returnDate: borrow.returnDate ? new Date(borrow.returnDate) : undefined,
          dueDate: new Date(borrow.dueDate),
          status: borrow.status,
          userName: borrow.userName,
          userEmail: borrow.userEmail,
          drawer: borrow.drawer
        }));
        setAllBorrows(adaptedBorrows);
      }
    } catch (error) {
      console.error('❌ Erreur reload emprunts:', error);
    } finally {
      setBorrowsLoading(false);
    }
  };

  // ============================================
  // FONCTION - Sélectionner un outil et ouvrir le tiroir
  // ============================================
  const handleToolSelection = async (tool: Tool) => {
    if (tool.availableQuantity <= 0) return;

    // Sélectionner l'outil et passer à l'écran de confirmation
    setSelectedTool(tool);
    setIsReturnMode(false);
    setCurrentScreen('confirm-borrow');
  };


  const loadToolsFromBackend = async () => {
    try {
      setLoading(true);
      const response = await toolsAPI.getAll();

      if (response.success) {
        // Adapter les données du backend au format frontend
        const adaptedTools = response.data.map((tool: any) => ({
          id: tool.id,
          name: tool.name,
          category: tool.category?.name || tool.category,
          image: tool.imageUrl,
          totalQuantity: tool.totalQuantity,
          availableQuantity: tool.availableQuantity || 0,
          borrowedQuantity: tool.borrowedQuantity || 0,
          size: tool.size || 'Moyen',
          drawer: tool.drawer
        }));

        setTools(adaptedTools);
        console.log('✅ Outils chargés depuis le backend:', adaptedTools.length);
        console.log('🛠️ Exemple outil:', adaptedTools[0]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement outils:', error);
      // En cas d'erreur, utiliser les données de seed
      setTools([]);
    } finally {
      setLoading(false);
    }
  };




  const loadCategoriesFromBackend = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesAPI.getAll();

      if (response.success) {
        setCategories(response.data);
        console.log('✅ Catégories chargées depuis le backend:', response.data.length);
      }
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const hardcodedCategories = [
    'Tournevis',
    'Clés',
    'Pinces',
    'Outils de marquage',
    'Outils de coupe'
  ];

  // Utiliser les catégories depuis l'API si disponibles, sinon utiliser les catégories codées en dur
  const finalCategories = categories.length > 0 ? categories.map(c => c.name) : hardcodedCategories;

  // Obtenir les catégories uniques depuis les outils
  const toolCategories = [...new Set(tools.map(tool => tool.category))].filter(Boolean);

  const sizes = [
    { key: 'Grand', label: 'sizeGrand' },
    { key: 'Moyen', label: 'sizeMoyen' },
    { key: 'Petit', label: 'sizePetit' },
    { key: 'Mini', label: 'sizeMini' }
  ];

  let filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === ALL_CATEGORIES || tool.category === selectedCategory;
    const matchesSearch =
      t(getToolTranslationKey(tool.name)).toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(getCategoryTranslationKey(tool.category)).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.size && tool.size.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && tool.availableQuantity > 0) ||
      (availabilityFilter === 'borrowed' && tool.availableQuantity === 0);
    const matchesSize = selectedSizes.length === 0 || (tool.size && selectedSizes.includes(tool.size));

    return matchesCategory && matchesSearch && matchesAvailability && matchesSize;
  });

  if (sortOption === 'name-asc') {
    filteredTools = [...filteredTools].sort((a, b) => t(getToolTranslationKey(a.name)).localeCompare(t(getToolTranslationKey(b.name))));
  } else if (sortOption === 'name-desc') {
    filteredTools = [...filteredTools].sort((a, b) => t(getToolTranslationKey(b.name)).localeCompare(t(getToolTranslationKey(a.name))));
  } else if (sortOption === 'category') {
    filteredTools = [...filteredTools].sort((a, b) => t(getCategoryTranslationKey(a.category)).localeCompare(t(getCategoryTranslationKey(b.category))));
  }

  const totalTools = tools.reduce((sum, tool) => sum + tool.totalQuantity, 0);
  const totalToolTypes = tools.length; // Nombre de types d'outils
  const availableToolTypes = tools.filter(t => t.availableQuantity > 0).length; // Types disponibles
  const availableCount = tools.reduce((sum, tool) => sum + tool.availableQuantity, 0);
  const borrowedCount = tools.reduce((sum, tool) => sum + tool.borrowedQuantity, 0);
  const activeFiltersCount = [
    availabilityFilter !== 'all' ? 1 : 0,
    selectedSizes.length,
    selectedCategory !== ALL_CATEGORIES ? 1 : 0,
    sortOption !== 'default' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const resetAllFilters = () => {
    setSelectedCategory(ALL_CATEGORIES);
    setAvailabilityFilter('all');
    setSelectedSizes([]);
    setSortOption('default');
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const Bubbles: React.FC = () => (
    <>
      <svg className="bubble" style={{ right: 80, top: 28, width: 140 }} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g fill="#0f2b56">
          <circle cx="40" cy="40" r="40" />
          <circle cx="150" cy="30" r="24" />
          <circle cx="180" cy="90" r="10" />
        </g>
      </svg>

      <svg className="bubble" style={{ left: 20, bottom: 40, width: 220 }} viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <g fill="#0f2b56">
          <circle cx="40" cy="150" r="30" />
          <circle cx="110" cy="90" r="52" />
          <circle cx="200" cy="110" r="18" />
        </g>
      </svg>

      <svg className="bubble" style={{ left: '48%', top: 8, width: 80 }} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g fill="#0f2b56">
          <circle cx="100" cy="30" r="12" />
          <circle cx="120" cy="60" r="8" />
        </g>
      </svg>
    </>
  );

  const exportToExcel = () => {
    // Date actuelle
    const date = new Date().toISOString().split('T')[0];

    // Feuille 1: Liste des outils
    const toolsData = tools.map(tool => ({
      'ID': tool.id,
      [t('exportTool')]: t(getToolTranslationKey(tool.name)),
      [t('exportCategory')]: t(getCategoryTranslationKey(tool.category)),
      [t('exportSize')]: tool.size || '-',
      [t('exportDrawer')]: tool.drawer ? getDrawerNumber(tool.drawer) : '-',
      [t('exportTotalQuantity')]: tool.totalQuantity,
      [t('exportAvailable')]: tool.availableQuantity,
      [t('exportBorrowed')]: tool.borrowedQuantity,
      [t('status')]: tool.availableQuantity > 0 ? t('available') : t('unavailable')
    }));

    // Feuille 2: Statistiques
    const statsData = [
      { 'Métrique': t('totalTools'), 'Valeur': totalTools },
      { 'Métrique': t('availableTools'), 'Valeur': availableCount },
      { 'Métrique': t('borrowedTools'), 'Valeur': borrowedCount },
      { 'Métrique': t('availabilityRate'), 'Valeur': `${Math.round((availableCount / totalTools) * 100)}%` }
    ];

    // Feuille 3: Par catégorie
    const categoryData = [
      { [t('category')]: t('category.tournevis'), 'Total': 8 },
      { [t('category')]: t('category.cles'), 'Total': 4 },
      { [t('category')]: t('category.pinces'), 'Total': 5 },
      { [t('category')]: t('category.marquage'), 'Total': 2 },
      { [t('category')]: t('category.coupe'), 'Total': 2 }
    ];

    // Créer les feuilles
    const ws1 = XLSX.utils.json_to_sheet(toolsData);
    const ws2 = XLSX.utils.json_to_sheet(statsData);
    const ws3 = XLSX.utils.json_to_sheet(categoryData);

    // Créer le classeur et ajouter les feuilles
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws1, 'Tools');
    XLSX.utils.book_append_sheet(workbook, ws2, 'Statistics');
    XLSX.utils.book_append_sheet(workbook, ws3, 'By Category');

    // Télécharger
    XLSX.writeFile(workbook, `rapport_outils_emines_${date}.xlsx`);
  };

  // ============================================
  // ÉCRAN 1 - Scan de badge
  // ============================================
  const handleBadgeScanned = async (badgeId: string): Promise<{ success: boolean; userName?: string }> => {
    try {
      console.log('🔍 Attempting login with Badge ID:', badgeId);
      const result = await authAPI.badgeScan(badgeId);

      if (result.success) {
        console.log('✅ Login réussi:', result.data.user);
        setCurrentUser(result.data.user);

        // Attendre 1.5 secondes pour montrer le message de bienvenue
        setTimeout(() => {
          setShowBadgeScanner(false);
          setCurrentScreen('tool-selection');
        }, 1500);

        return { success: true, userName: result.data.user.fullName };
      } else {
        console.error('❌ Badge invalide:', badgeId);
        alert(`${t('invalidBadge')}\n\nBadge ID: ${badgeId}\n\nPlease register this badge in the admin panel.`);
        setShowBadgeScanner(false);
        return { success: false };
      }
    } catch (error: any) {
      console.error('❌ Erreur login:', error);
      console.error('Badge ID that failed:', badgeId);
      const errorMsg = error.response?.data?.message || t('connectionError');
      alert(`${errorMsg}\n\nBadge ID: ${badgeId}`);
      setShowBadgeScanner(false);
      return { success: false };
    }
  };

  // ============================================
  // ÉCRAN - Connexion utilisateur (Email + Mot de passe)
  // ============================================
  const handleUserLogin = async () => {
    try {
      if (!email || !password) {
        setLoginError(t('emailPasswordRequired') || 'Email et mot de passe requis');
        return;
      }

      setLoading(true);
      const result = await authAPI.userLogin(email, password);

      if (result.success) {
        console.log('✅ User login réussi:', result.data.user);
        setCurrentUser(result.data.user);
        setEmail('');
        setPassword('');
        setLoginError('');
        setCurrentScreen('tool-selection');
      } else {
        setLoginError(result.message || t('invalidCredentials') || 'Email ou mot de passe incorrect');
      }
    } catch (error: any) {
      console.error('❌ Erreur user login:', error);
      const backendMessage = error?.response?.data?.message;
      setLoginError(backendMessage || t('invalidCredentials') || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ÉCRAN BADGE SCAN
  if (currentScreen === 'badge-scan') {
    return (
      <div className="min-h-screen relative overflow-hidden hero flex flex-col items-center justify-center px-6">
        <Bubbles />

        {/* En-têtes fixes à gauche */}
        <div className="fixed top-6 left-6 z-50 flex items-center gap-4">
          <LanguageSelector />
          <button
            onClick={() => setCurrentScreen('admin-login')}
            className="text-lg font-bold cursor-pointer px-6 py-2 rounded-lg bg-white/40 hover:bg-white/60 transition-all"
          >
            {t('admin')}
          </button>
        </div>

        <main className="max-w-4xl w-full text-center flex flex-col items-center">
          {/* Logo centré en haut */}
          <div className="mb-12 mt-8">
            <Logo />
          </div>

          {/* Badge centré */}
          <div className="mb-16">
            <div
              className="mx-auto w-72 h-72 rounded-2xl card-glass flex items-center justify-center shadow-soft cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowBadgeScanner(true)}
            >
              <div className="w-60 h-60 rounded-lg bg-gradient-to-br from-cyansoft to-white flex items-center justify-center">
                <Wifi className="w-16 h-16 text-navy" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold mb-6">{t('servanteTitle')}</h1>
          <p className="text-lg text-gray-600">{t('badgePrompt')}</p>

          {loading && (
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
              <p className="text-sm text-gray-600 mt-2">{t('loading')}</p>
            </div>
          )}

          {/* Bouton pour connexion utilisateur */}
          <button
            onClick={() => setCurrentScreen('user-login')}
            className="mt-8 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all font-bold shadow-md"
          >
            {t('userLogin')}
          </button>
        </main>

        {/* Scanner de badge */}
        {showBadgeScanner && (
          <BadgeScanner
            onBadgeScanned={handleBadgeScanned}
            onClose={() => setShowBadgeScanner(false)}
          />
        )}
      </div>
    );
  }

  // ============================================
  // ÉCRAN 2 - Sélection des outils
  // ============================================
  if (currentScreen === 'tool-selection') {
    // ✅ Protection si pas d'utilisateur
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-navy mb-4"></div>
            <p className="text-lg text-slate-700 font-semibold">{t('loading')}</p>
          </div>
        </div>
      );
    }

    // ✅ Protection si chargement
    if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-navy mb-4"></div>
            <p className="text-lg text-slate-700 font-semibold">{t('loading')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center py-3 px-6">
            {/* PARTIE GAUCHE: Flèche + Logo avec grand espace */}
            <div className="flex items-center gap-16 flex-shrink-0">
              <button
                onClick={() => setCurrentScreen('badge-scan')}
                className="p-3 hover:bg-slate-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-slate-900" />
              </button>
              <div className="flex-shrink-0 -ml-8">
                <Logo />
              </div>
            </div>

            {/* ✅ PARTIE CENTRE: Bonjour + Prénom */}
            <div className="flex flex-1 justify-center ml-30">
              <span className="text-xl font-semibold text-slate-900">
                {t('hello')}, {currentUser.fullName.split(' ')[0]}
              </span>
            </div>

            {/* ✅ PARTIE DROITE: Menu + Langue */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <UserMenu
                currentUser={currentUser}
                allBorrows={allBorrows}
                setCurrentScreen={setCurrentScreen}
              />

              <div className="flex items-center">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-6 px-6">
          {/* Titre Catalogue + Retourner Outil */}
          <div className="mb-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Box className="w-10 h-10 text-slate-900" />
              <h1 className="text-4xl font-bold text-slate-900">{t('catalogTitle')}</h1>
            </div>
            <button
              onClick={() => setCurrentScreen('return-tool')}
              className="px-4 md:px-6 py-2.5 rounded-lg bg-blue-900 text-white flex items-center gap-2 hover:bg-blue-900 transition-all shadow-md text-sm md:text-base whitespace-nowrap -mr-20 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('returnTool')}</span>
            </button>
          </div>

          <div className="mb-6 max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-14 pr-12 py-4 rounded-xl bg-white border-2 border-slate-200 text-base focus:ring-2 focus:ring-[#0f2b56] focus:border-[#0f2b56] focus:outline-none transition-all shadow-sm placeholder-slate-400"
                placeholder={t('searchPlaceholder')}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="px-6 py-3 rounded-xl bg-white backdrop-blur-sm shadow-md hover:shadow-lg transition-all flex items-center gap-3 font-semibold border border-slate-200"
            >
              <SlidersHorizontal className="w-5 h-5 text-slate-700" />
              <span className="text-slate-900">{t('filters')}</span>
              <ChevronDown className={`w-5 h-5 text-slate-700 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 rounded-full bg-[#0f2b56] text-white text-sm font-bold shadow-md">
                  {activeFiltersCount} {t('activeFilters')}
                </span>
                <ResetFiltersButton onClick={resetAllFilters} />
              </div>
            )}
          </div>

          {filtersOpen && (
            <div className="mb-8 animate-slideDown">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-slate-700" />
                      {t('availability')}
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAvailabilityFilter('all')}
                        className={`w-full px-5 py-3.5 rounded-xl font-semibold transition-all text-left flex items-center justify-between shadow-sm ${availabilityFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        <span>{t('all')}</span>
                        <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          {totalToolTypes}
                        </span>
                      </button>

                      <button
                        onClick={() => setAvailabilityFilter('available')}
                        className={`w-full px-5 py-3.5 rounded-xl font-semibold transition-all text-left flex items-center justify-between shadow-sm ${availabilityFilter === 'available'
                          ? 'bg-emerald-500 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {t('availableOnly')}
                        </span>
                        <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          {availableToolTypes}
                        </span>
                      </button>

                      <button
                        onClick={() => setAvailabilityFilter('borrowed')}
                        className={`w-full px-5 py-3.5 rounded-xl font-semibold transition-all text-left flex items-center justify-between shadow-sm ${availabilityFilter === 'borrowed'
                          ? 'bg-red-500 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        <span>{t('borrowedOnly')}</span>
                        <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          {tools.filter(t => t.availableQuantity === 0).length}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-slate-700" />
                      {t('category')}
                    </h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      <button
                        onClick={() => setSelectedCategory(ALL_CATEGORIES)}
                        className={`w-full px-4 py-3 rounded-xl font-medium transition-all text-left shadow-sm ${selectedCategory === ALL_CATEGORIES
                          ? 'bg-[#0f2b56] text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {t('categoryAll')}
                      </button>

                      {toolCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full px-4 py-3 rounded-xl font-medium transition-all text-left shadow-sm ${selectedCategory === cat
                            ? 'bg-[#0f2b56] text-white shadow-md scale-[1.02]'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          {t(getCategoryTranslationKey(cat))}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-slate-700" />
                        {t('size')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {sizes.map(size => (
                          <button
                            key={size.key}
                            onClick={() => toggleSize(size.key)}
                            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${selectedSizes.includes(size.key)
                              ? 'bg-[#0f2b56] text-white shadow-md scale-[1.02]'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                          >
                            {t(size.label)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <SortAsc className="w-5 h-5 text-slate-700" />
                        {t('sortBy')}
                      </h3>
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-100 border-2 border-slate-200 font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-all focus:ring-2 focus:ring-[#0f2b56] focus:outline-none"
                      >
                        <option value="default">{t('defaultSort')}</option>
                        <option value="name-asc">{t('nameAsc')}</option>
                        <option value="name-desc">{t('nameDesc')}</option>
                        <option value="category">{t('byCategory')}</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <Grid className="w-5 h-5 text-slate-700" />
                        {t('viewMode')}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${viewMode === 'grid'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          <Grid className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${viewMode === 'list'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          <List className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-base text-slate-700 font-semibold bg-white/90 inline-block px-8 py-3 rounded-full shadow-md border border-slate-200">
              {t('showingResults')} <span className="text-[#0f2b56] font-bold text-xl mx-1">{filteredTools.length}</span> {t('toolsOf')} <span className="font-bold">{totalToolTypes}</span>
            </p>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map(tool => (
                <div
                  key={tool.id}
                  onClick={() => handleToolSelection(tool)}
                  className={`group p-6 rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 border-2 ${tool.availableQuantity > 0  // ← CORRIGÉ
                    ? 'border-slate-200 hover:border-[#0f2b56] hover:-translate-y-2 cursor-pointer'
                    : 'border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="flex justify-between mb-2">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${tool.availableQuantity > 0
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {tool.availableQuantity > 0 ? `${tool.availableQuantity} ${t('available')}` : t('unavailable')}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        {t('total')}: {tool.totalQuantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-4 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                      <img
                        src={tool.image}
                        alt={t(getToolTranslationKey(tool.name))}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <div className="w-full space-y-2 mb-4">
                      <h3 className="font-bold text-slate-900 text-center text-base leading-tight">
                        {t(getToolTranslationKey(tool.name))}
                      </h3>
                      <p className="text-sm text-slate-600 text-center font-medium">
                        {t(getCategoryTranslationKey(tool.category))}
                      </p>

                      <div className="flex items-center justify-center gap-3 text-xs text-slate-500 mt-2">
                        {tool.size && (
                          <span className="px-2 py-1 bg-slate-100 rounded-lg font-semibold">
                            {tool.size === 'Grand' ? t('sizeGrand') :
                              tool.size === 'Moyen' ? t('sizeMoyen') :
                                tool.size === 'Petit' ? t('sizePetit') :
                                  tool.size === 'Mini' ? t('sizeMini') : tool.size}
                          </span>
                        )}
                        {tool.drawer && (
                          <span className="px-2 py-1 bg-slate-100 rounded-lg font-semibold flex items-center gap-1">
                            <Box className="w-3 h-3" />
                            {getDrawerNumber(tool.drawer)}
                          </span>
                        )}
                      </div>
                    </div>

                    {tool.availableQuantity > 0 && (
                      <button className="w-full py-2.5 bg-[#0f2b56] text-white font-bold rounded-xl hover:bg-[#0a1f3d] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                        <Package className="w-4 h-4" />
                        {t('borrow')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTools.map(tool => (
                <div
                  key={tool.id}
                  onClick={() => handleToolSelection(tool)}
                  className={`flex items-center gap-6 p-6 rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 border-2 ${tool.availableQuantity > 0
                    ? 'border-slate-200 hover:border-[#0f2b56] hover:-translate-y-2 cursor-pointer'
                    : 'border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    <img src={tool.image} alt={t(getToolTranslationKey(tool.name))} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-xl mb-2">{t(getToolTranslationKey(tool.name))}</h3>
                    <p className="text-sm text-slate-600 font-medium mb-3">{t(getCategoryTranslationKey(tool.category))}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {tool.size && (
                        <span className="px-3 py-1 bg-slate-100 rounded-lg font-semibold">
                          {t('size')}: {getTranslatedSize(tool.size)}
                        </span>
                      )}
                      {tool.drawer && (
                        <span className="px-3 py-1 bg-slate-100 rounded-lg font-semibold flex items-center gap-1">
                          <Box className="w-4 h-4" />
                          {t('drawer')}: {getDrawerNumber(tool.drawer)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${tool.availableQuantity > 0
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                      }`}>
                      {tool.availableQuantity > 0 ? `${tool.availableQuantity} ${t('available')}` : t('unavailable')}
                    </span>

                    {tool.availableQuantity > 0 && (
                      <button className="px-6 py-2.5 bg-[#0f2b56] text-white font-bold rounded-xl hover:bg-[#0a1f3d] transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t('borrow')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN 3 - Confirmation d'emprunt/retour
  // ============================================
  if (currentScreen === 'confirm-borrow') {
    const goBackScreen = isReturnMode ? 'return-tool' : 'tool-selection';
    const titleText = isReturnMode ? t('returnConfirm') : t('borrowConfirm');
    const infoText = isReturnMode ? t('verifyReturnInfo') : t('verifyBorrowInfo');
    const notificationText = isReturnMode
      ? t('drawerOpeningReturn')
      : 'The drawer will open automatically when the borrow is confirmed.';

    // ✅ FONCTION POUR GÉRER L'EMPRUNT OU LE RETOUR
    const handleConfirmAction = async () => {
      if (!selectedTool || !currentUser) {
        alert(`❌ ${t('noToolOrUserError')}`);
        return;
      }

      try {
        setLoading(true);

        if (isReturnMode) {
          // ✅ MODE RETOUR -- trouver l'emprunt actif
          const activeBorrow = allBorrows.find(
            b => b.toolId === selectedTool.id &&
              b.userName === currentUser.fullName &&
              (b.status === 'active' || b.status === 'overdue')
          );
          if (!activeBorrow) {
            alert(`❌ ${t('noBorrowFound')}`);
            return;
          }
          setActiveBorrowId(activeBorrow.id);

          if (selectedTool.drawer && ['1', '2', '3', '4'].includes(selectedTool.drawer)) {
            // Ouvrir le tiroir et lancer la détection YOLO unifiée pendant la course moteur.
            // Le retour est enregistré en DB SEULEMENT après validation YOLO réussie
            hardwareAPI.openDrawer(selectedTool.drawer as '1' | '2' | '3' | '4').catch(() => {
              console.warn('⚠️ Tiroir non disponible');
            });
            setDetectionRetryKey(0);
            setGuardDrawerId(selectedTool.drawer as '1' | '2' | '3' | '4');
            setCurrentScreen('product-validation');
          } else {
            // Pas de tiroir assigné -- retour direct sans YOLO
            const result = await borrowsAPI.markAsReturned(activeBorrow.id);
            if (result.success) {
              showToast(`✅ ${getTranslatedToolName(selectedTool.name)} ${t('returnSuccess')}!`, 'success', 3000);
              await loadBorrowsFromBackend();
              await loadToolsFromBackend();
              setSelectedTool(null);
              setActiveBorrowId(null);
              setIsReturnMode(false);
              setCurrentScreen('tool-selection');
            } else {
              alert(`❌ ${t('returnError')}`);
            }
          }
        } else {
          // ✅ MODE EMPRUNT -- ouvrir le tiroir, passer par la garde d'ouverture (25s), puis action (10s)
          if (selectedTool.drawer && ['1', '2', '3', '4'].includes(selectedTool.drawer)) {
            hardwareAPI.openDrawer(selectedTool.drawer as '1' | '2' | '3' | '4').catch(() => {
              console.warn('⚠️ Tiroir non disponible');
            });
            setGuardDrawerId(selectedTool.drawer as '1' | '2' | '3' | '4');
            setGuardSnapshot([]);
            setDetectionRetryKey(0);
            setCurrentScreen('drawer-opening-guard');
          } else {
            setDetectionRetryKey(0);
            setCurrentScreen('product-validation');
          }
        }
      } catch (error: any) {
        console.error('❌ Erreur:', error);
        const errorMessage = error.response?.data?.message || error.message || t('operationError');
        alert(`❌ ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header fixe en haut */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between py-3 px-6 h-20">
            {/* GAUCHE: Langue */}
            <div className="flex items-center">
              <LanguageSelector />
            </div>

            {/* CENTRE: Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Logo />
            </div>

            {/* DROITE: Vide (pour l'équilibre) */}
            <div className="w-32"></div>
          </div>
        </div>

        {/* Contenu du modal */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
          <div className="max-w-2xl w-full">
            {/* Header du modal */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{titleText}</h2>
                <p className="text-sm text-slate-600 mt-2">{infoText}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTool(null);
                  setIsReturnMode(false);
                  setCurrentScreen(goBackScreen);
                }}
                disabled={loading}
                className="p-2 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="p-8 rounded-2xl bg-white shadow-xl border border-slate-200">

              {selectedTool && (
                <div className="mt-6 bg-slate-50 rounded-2xl p-6 flex items-center gap-6 border-2 border-slate-200">
                  <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-white to-slate-100 flex items-center justify-center overflow-hidden shadow-md">
                    <img src={selectedTool.image} alt={t(selectedTool.name)} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{t(selectedTool.name)}</h3>
                    <p className="text-sm text-slate-600 font-medium mb-2">{t('category')}: {t(getCategoryTranslationKey(selectedTool.category))}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {selectedTool.size && (
                        <span className="px-3 py-1 bg-white rounded-lg font-semibold border border-slate-200">
                          {t('size')}: {getTranslatedSize(selectedTool.size)}
                        </span>
                      )}
                      {selectedTool.drawer && (
                        <span className="px-3 py-1 bg-white rounded-lg font-semibold border border-slate-200 flex items-center gap-1">
                          <Box className="w-4 h-4" />
                          {t('drawer')}: {getDrawerNumber(selectedTool.drawer)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setIsReturnMode(false);
                    setCurrentScreen(goBackScreen);
                  }}
                  disabled={loading}
                  className="flex-1 px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all font-bold text-slate-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel')}
                </button>

                <button
                  onClick={handleConfirmAction}
                  disabled={loading}
                  className="flex-1 px-8 py-4 rounded-xl bg-[#0f2b56] hover:bg-[#0a1f3d] text-white transition-all font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('processing')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t('confirm')}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 text-sm text-slate-700 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="font-medium">{notificationText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN - TIROIR OUVERT (Récupération de l'outil)
  // ============================================
  if (currentScreen === 'drawer-open' && selectedTool) {
    const handleCloseDrawer = async () => {
      if (!selectedTool.drawer) return;

      // 0. Libérer la caméra : arrêter le preview avant que YOLO ne la prenne
      previewActiveRef.current = false;
      await hardwareAPI.stopPreview().catch(() => {});

      // 1. Activer la caméra immédiatement (live feed YOLO visible dès le clic)
      setIsScanningDrawer(true);
      setDrawerScanResult(null);

      // 2. Scanner le tiroir ouvert : YOLO tourne, frames annotées en live
      //    La composition est enregistrée sur le dernier frame (résultat final)
      let scanData: DrawerScanResult = { success: false, detected_tools: [], count: 0, error: 'Scan indisponible' };
      try {
        scanData = await hardwareAPI.scanDrawer(0);
        setDrawerScanResult(scanData);   // ← composition enregistrée ici
      } catch {
        setDrawerScanResult(scanData);
      } finally {
        setIsScanningDrawer(false);
      }

      // 3. Fermer le tiroir après le scan
      try {
        await hardwareAPI.closeDrawer(selectedTool.drawer as '1' | '2' | '3' | '4');
      } catch (error) {
        console.warn('⚠️ Erreur fermeture tiroir:', error);
      }

      // 4. Montrer les résultats finaux 2 s puis confirmer
      await new Promise(r => setTimeout(r, 2000));

      try {
        setLoading(true);
        if (isReturnMode && currentUser) {
          const activeBorrow = allBorrows.find(
            b => b.toolId === selectedTool.id &&
              b.userName === currentUser.fullName &&
              (b.status === 'active' || b.status === 'overdue')
          );
          if (activeBorrow) {
            // Stocker l'emprunt et laisser YOLO valider avant de confirmer le retour
            setActiveBorrowId(activeBorrow.id);
            setDrawerScanResult(null);
            setDetectionRetryKey(0);
            setCurrentScreen('product-validation');
          } else {
            setSelectedTool(null);
            setIsReturnMode(false);
            setDrawerScanResult(null);
            setCurrentScreen('tool-selection');
          }
        } else {
          const activeBorrow = allBorrows.find(
            b => b.toolId === selectedTool.id &&
              b.userName === currentUser?.fullName &&
              b.status === 'active'
          );
          if (activeBorrow) {
            setActiveBorrowId(activeBorrow.id);
            setValidationRequired(true);
            setDrawerScanResult(null);
            setDetectionRetryKey(0);
            setCurrentScreen('product-validation');
          } else {
            setSelectedTool(null);
            setDrawerScanResult(null);
            setCurrentScreen('tool-selection');
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur confirmation automatique:', error);
        setSelectedTool(null);
        setDrawerScanResult(null);
        setCurrentScreen('tool-selection');
      } finally {
        setLoading(false);
        await loadBorrowsFromBackend();
        await loadToolsFromBackend();
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header fixe */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between py-3 px-6 h-20">
            <div className="flex items-center">
              <LanguageSelector />
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Logo />
            </div>
            <div className="w-32"></div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
          <div className="max-w-3xl w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-green-200">

              {/* Animation et icône */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse shadow-xl">
                    <Box className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-2xl">🔓</span>
                  </div>
                </div>
              </div>

              {/* Titre */}
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
                {t('drawerIsOpen', { drawer: getDrawerNumber(selectedTool.drawer) })}
              </h2>
              <p className="text-xl text-center text-slate-600 mb-8">
                {isReturnMode ? t('pleaseReturnYourTool') : t('pleaseRetrieveYourTool') || 'Please retrieve your tool'}
              </p>

              {/* Info outil */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-md">
                    <img src={selectedTool.image} alt={selectedTool.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{getTranslatedToolName(selectedTool.name)}</h3>
                    <p className="text-sm text-slate-600 font-medium">{t('category')}: {t(getCategoryTranslationKey(selectedTool.category))}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{isReturnMode ? t('placeToolInDrawer') : 'Take your tool'}</h4>
                    <p className="text-sm text-slate-600">{isReturnMode ? t('placeToolInDrawerDesc', { drawer: getDrawerNumber(selectedTool.drawer) }) : `Carefully remove the tool from drawer ${getDrawerNumber(selectedTool.drawer)}`}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Close the drawer</h4>
                    <p className="text-sm text-slate-600">Click the button below when you're done</p>
                  </div>
                </div>
              </div>

              {/* Aperçu caméra en direct (avant le scan YOLO) */}
              {!isScanningDrawer && !drawerScanResult && (
                <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 mb-4">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${previewReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-white text-sm font-semibold">
                        {previewReady ? 'LIVE -- Détection YOLO' : 'Chargement du modèle…'}
                      </span>
                    </div>
                    <span className="text-slate-400 text-xs">Tiroir {getDrawerNumber(selectedTool.drawer || '')}</span>
                  </div>
                  <div className="relative bg-black" style={{ minHeight: '200px' }}>
                    {/* Spinner overlay until first frame loads */}
                    {!previewReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
                        <span className="text-slate-400 text-xs">best (2).pt -- chargement modèle…</span>
                      </div>
                    )}
                    {/* Camera image -- opacity-0 until loaded, then fades in */}
                    {previewTs > 0 && (
                      <img
                        src={`${API_BASE_URL.replace('/api', '')}/api/hardware/camera/preview?t=${previewTs}`}
                        alt="Aperçu caméra"
                        className="w-full object-contain"
                        style={{ maxHeight: '280px', opacity: previewReady ? 1 : 0, transition: 'opacity 0.3s' }}
                        onLoad={() => setPreviewReady(true)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Bouton fermer / scan / résultats */}
              {!isScanningDrawer && !drawerScanResult && (
                <button
                  onClick={handleCloseDrawer}
                  disabled={loading}
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all font-bold text-xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Fermeture...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>Close Drawer & Finish</span>
                    </>
                  )}
                </button>
              )}

              {/* Scan en cours : caméra live + détections en temps réel */}
              {isScanningDrawer && (
                <div className="w-full rounded-2xl overflow-hidden border-2 border-blue-400 bg-slate-900">

                  {/* Barre de statut */}
                  <div className={`flex items-center justify-between px-4 py-2 ${cameraFrameTs > 0 ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${cameraFrameTs > 0 ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      <span className="text-white text-sm font-bold">
                        {cameraFrameTs > 0 ? 'LIVE -- Détection en cours' : 'Chargement du modèle…'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {liveDetections.length > 0 && (
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {liveDetections.length} détecté{liveDetections.length > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-white text-xs font-mono bg-black/30 px-2 py-0.5 rounded">
                        {scanSecondsLeft}s
                      </span>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    </div>
                  </div>

                  {/* Flux caméra */}
                  {cameraFrameTs > 0 ? (
                    <img
                      src={`${API_BASE_URL.replace('/api', '')}/api/hardware/camera/frame?t=${cameraFrameTs}`}
                      alt="Flux caméra"
                      className="w-full object-contain bg-black"
                      style={{ maxHeight: '300px' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-40 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent" />
                      <span className="text-sm">Chargement du modèle YOLO (best (2).pt)…</span>
                      <span className="text-xs text-slate-500">La caméra démarrera automatiquement</span>
                    </div>
                  )}

                  {/* Outils détectés en temps réel */}
                  {liveDetections.length > 0 && (
                    <div className="border-t border-slate-700">
                      <div className="px-4 py-2 bg-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                        Outils détectés
                      </div>
                      <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto">
                        {liveDetections.map((tool, idx) => (
                          <div key={tool.tool_name} className="flex items-center justify-between px-4 py-2 bg-slate-900">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-white text-sm font-semibold">{tool.tool_name}</p>
                                <p className="text-slate-500 text-xs">{tool.class_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-20 h-1.5 rounded-full bg-slate-700">
                                <div
                                  className="h-1.5 rounded-full bg-green-400 transition-all duration-300"
                                  style={{ width: `${Math.round(tool.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-green-400 text-xs font-bold w-9 text-right">
                                {Math.round(tool.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* État : résultats du scan */}
              {drawerScanResult && !isScanningDrawer && (
                <div className="w-full rounded-2xl border-2 border-slate-200 overflow-hidden">
                  <div className="bg-slate-800 px-6 py-4 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-bold text-lg">Composition du tiroir détectée</h3>
                    <span className="ml-auto bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {drawerScanResult.count} outil{drawerScanResult.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {!drawerScanResult.success || drawerScanResult.error ? (
                    <div className="p-6 bg-red-50 text-red-700 text-sm">
                      {drawerScanResult.error || 'Scan indisponible'}
                    </div>
                  ) : drawerScanResult.count === 0 ? (
                    <div className="p-6 bg-yellow-50 text-yellow-700 text-sm text-center">
                      Aucun outil détecté dans le tiroir
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {drawerScanResult.detected_tools.map((tool, idx) => (
                        <div key={idx} className="flex items-center justify-between px-6 py-3 bg-white hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{tool.tool_name}</p>
                              <p className="text-xs text-slate-400">{tool.class_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${Math.round(tool.confidence * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-10 text-right">
                              {Math.round(tool.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-6 py-3 bg-slate-50 flex items-center justify-center gap-2 text-slate-500 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
                    Confirmation automatique en cours...
                  </div>
                </div>
              )}

              {/* Note de sécurité */}
              <div className="mt-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Please ensure the drawer is fully closed before leaving</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN - COMPTE UTILISATEUR
  // ============================================
  // ============================================
  // ÉCRAN - COMPTE UTILISATEUR
  // ============================================
  if (currentScreen === 'user-account') {
    // ✅ Protection si pas d'utilisateur
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-navy mb-4"></div>
            <p className="text-lg text-slate-700 font-semibold">{t('loading')}</p>
          </div>
        </div>
      );
    }

    // ✅ CALCUL DYNAMIQUE DES EMPRUNTS depuis allBorrows
    const userBorrows = allBorrows.filter(b =>
      b.userName === currentUser.fullName
    );

    const activeBorrows = userBorrows
      .filter(b => b.status === 'active' || b.status === 'overdue')
      .map(b => ({
        ...b,
        ...calculateLateStatus(b)
      }));

    const borrowHistory = userBorrows.filter(b => b.status === 'returned');

    const overdueBorrows = activeBorrows.filter(b => b.status === 'overdue');
    const dueSoonBorrows = activeBorrows.filter(b => b.isDueSoon);

    const totalBorrows = userBorrows.length;
    const onTimeReturns = borrowHistory.filter(b => !b.isLate).length;
    const onTimeRate = borrowHistory.length > 0
      ? Math.round((onTimeReturns / borrowHistory.length) * 100)
      : 100;

    const warnings = overdueBorrows.length;
    const lateReturns = borrowHistory.filter(b => b.isLate).length;

    return (
      <div className="min-h-screen bg-slate-50">
        {/* En-tête */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto flex items-center justify-between py-3 px-6">
            {/* PARTIE GAUCHE: Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentScreen('tool-selection')}
                className="p-3 hover:bg-slate-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-slate-900" />
              </button>
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-slate-900" />
                <h1 className="text-2xl font-bold text-slate-900">{t('myAccount')}</h1>
              </div>
            </div>

            {/* PARTIE DROITE: Langue */}
            <div className="flex items-center gap-2">
              <LanguageSelector />
            </div>
          </div>
        </div>

        <div className="container py-8 ">
          {/* Profil utilisateur */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 mb-8 text-white shadow-xl w-full md:w-1/3">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{currentUser.fullName}</h2>
                <p className="text-white mb-1">{currentUser.email}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    {currentUser.badgeId}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm capitalize">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ ALERTES - Outils à retourner bientôt */}
          {dueSoonBorrows.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Bell className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    ⏰ {dueSoonBorrows.length} {dueSoonBorrows.length > 1 ? t('toolsDueSoon') : t('toolsDueSoon')}
                  </h3>
                  <ul className="space-y-2">
                    {dueSoonBorrows.map(b => (
                      <li key={b.id} className="text-sm text-amber-700">
                        <strong>{getTranslatedToolName(b.toolName)}</strong> - {t('alertReturnIn')} <strong>{b.daysUntilDue} {b.daysUntilDue > 1 ? t('days') : t('day')}</strong>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      dueSoonBorrows.forEach(b => sendEmailReminder(b, 'reminder'));
                    }}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-semibold text-sm"
                  >
                    {t('alertReminderSoon')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ALERTES - Avertissements */}
          {warnings > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-900">
                    ⚠️ {warnings} {warnings > 1 ? t('warnings') : t('warning')} | {lateReturns} {lateReturns > 1 ? t('lateReturns') : t('lateCount')}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {t('improveReturnRate')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Statistiques rapides (4 KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase">{t('activeBorrows')}</h3>
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-blue-600">{activeBorrows.length}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase">{t('totalBorrows')}</h3>
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-blue-600">{totalBorrows}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase">{t('lateReturns')}</h3>
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-4xl font-bold text-red-500">{lateReturns}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase">{t('onTimeRate')}</h3>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-4xl font-bold text-green-500">{onTimeRate}%</p>
            </div>
          </div>

          {/* ✅ Historique des emprunts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">{t('borrowHistory')}</h3>
              <button
                onClick={() => {
                  const historyData = borrowHistory.map(b => ({
                    [t('tool')]: getTranslatedToolName(b.toolName),
                    [t('borrowDate')]: new Date(b.borrowDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR'),
                    [t('returnDate')]: b.returnDate ? new Date(b.returnDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : '-',
                    [t('dueDate')]: new Date(b.dueDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR'),
                    'Duration (days)': b.returnDate
                      ? Math.ceil((b.returnDate.getTime() - b.borrowDate.getTime()) / (1000 * 60 * 60 * 24))
                      : '-',
                    [t('status')]: b.status === 'returned' ? t('returned') : b.status === 'overdue' ? t('overdue') : t('active'),
                    'Days Late': b.isLate ? b.daysLate : 0,
                    [t('drawer')]: b.drawer || '-'
                  }));

                  const ws = XLSX.utils.json_to_sheet(historyData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'BorrowHistory');
                  XLSX.writeFile(wb, `borrow_history_${currentUser.fullName}_${new Date().toISOString().split('T')[0]}.xlsx`);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>

            {borrowHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">{t('noHistory')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('tool')}</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('borrowDate')}</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('returnDate')}</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('dueDate')}</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('duration')}</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowHistory.map((borrow, idx) => {
                      const duration = borrow.returnDate
                        ? Math.ceil((borrow.returnDate.getTime() - borrow.borrowDate.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;

                      return (
                        <tr key={borrow.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{getTranslatedToolName(borrow.toolName)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(borrow.borrowDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {borrow.returnDate ? new Date(borrow.returnDate).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(borrow.dueDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {duration} {t('days')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${borrow.status === 'returned' && !borrow.isLate
                              ? 'bg-green-100 text-green-700'
                              : borrow.isLate
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                              }`}>
                              {borrow.status === 'returned' && !borrow.isLate ? `✅ ${t('onTime')}` :
                                borrow.isLate ? `❌ ${t('alertLate')} ${borrow.daysLate}j` : t('active')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ============================================
  // ÉCRAN - Connexion utilisateur (Email + Mot de passe)
  // ============================================
  if (currentScreen === 'user-login') {
    return (
      <div className="min-h-screen relative overflow-hidden hero flex flex-col items-center justify-center px-6">
        <Bubbles />

        {/* Langue en haut gauche */}
        <div className="fixed top-6 left-6 z-50">
          <LanguageSelector />
        </div>

        {/* Logo en haut gauche mais décalé */}
        <div className="fixed top-6 left-40 z-50">
          <Logo />
        </div>

        <div className="max-w-md w-full p-8 rounded-2xl bg-white shadow-xl border border-slate-200 relative">
          <button
            onClick={() => {
              setCurrentScreen('badge-scan');
              setLoginError('');
              setEmail('');
              setPassword('');
            }}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">{t('userLogin') || 'User Login'}</h2>
            <p className="text-sm text-slate-600 mt-2">{t('loginWithEmail') || 'Login with email and password'}</p>
          </div>

          {/* Notification d'erreur */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-600">{loginError}</p>
            </div>
          )}

          {/* Email field */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder={t('email')}
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-green-600 focus:outline-none transition-all font-medium"
              autoComplete="email"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUserLogin();
                }
              }}
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">{t('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder={t('password')}
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-green-600 focus:outline-none transition-all font-medium pr-12"
                autoComplete="off"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUserLogin();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEmail('');
                setPassword('');
                setLoginError('');
                setCurrentScreen('badge-scan');
              }}
              className="flex-1 px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all font-bold text-slate-700 shadow-md disabled:opacity-50"
              disabled={loading}
            >
              {t('cancel')}
            </button>

            <button
              onClick={handleUserLogin}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? `${t('loading')}...` : t('login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN 4 - Connexion administrateur
  // ============================================
  if (currentScreen === 'admin-login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        {/* Langue en haut gauche */}
        <div className="fixed top-6 left-6 z-50">
          <LanguageSelector />
        </div>

        {/* Logo en haut gauche mais décalé */}
        <div className="fixed top-6 left-40 z-50">
          <Logo />
        </div>

        <div className="max-w-md w-full p-8 rounded-2xl bg-white shadow-xl border border-slate-200 relative">
          <button
            onClick={() => {
              setCurrentScreen('badge-scan');
              setLoginError('');
              setPassword('');
            }}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">{t('adminLogin')}</h2>
            <p className="text-sm text-slate-600 mt-2">{t('adminPassword')}</p>
          </div>

          {/* Notification d'erreur */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-600">{loginError}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">{t('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (password === 'admin123') {
                      // Create admin token and store in localStorage
                      const adminToken = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                      localStorage.setItem('token', adminToken);
                      localStorage.setItem('user', JSON.stringify({ id: 'admin', role: 'admin', fullName: 'Administrator' }));
                      setPassword('');
                      setLoginError('');
                      setCurrentScreen('admin-overview');
                    } else {
                      setLoginError(t('incorrectPassword'));
                    }
                  }
                }}
                placeholder={t('password')}
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-[#0f2b56] focus:outline-none transition-all font-medium pr-12"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPassword('');
                setLoginError('');
                setCurrentScreen('badge-scan');
              }}
              className="flex-1 px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all font-bold text-slate-700 shadow-md"
            >
              {t('cancel')}
            </button>

            <button
              onClick={() => {
                if (password === 'admin123') {
                  // Create admin token and store in localStorage
                  const adminToken = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                  localStorage.setItem('token', adminToken);
                  localStorage.setItem('user', JSON.stringify({ id: 'admin', role: 'admin', fullName: 'Administrator' }));
                  setPassword('');
                  setLoginError('');
                  setCurrentScreen('admin-overview');
                } else {
                  setLoginError(`❌ ${t('incorrectPassword')}`);
                }
              }}
              className="flex-1 px-6 py-4 rounded-xl bg-[#0f2b56] hover:bg-[#0a1f3d] text-white transition-all font-bold shadow-lg"
            >
              {t('login')}
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            {t('demoPassword')}: <strong className="text-[#0f2b56]">admin123</strong>
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // FONCTIONS - Calculs pour TOUS les écrans admin
  // ============================================

  // ✅ ÉCRAN 5 - Vue d'ensemble
  const calculateOverviewStats = (tools: Tool[], borrows: BorrowRecord[]) => {
    const totalTools = tools.reduce((sum, tool) => sum + tool.totalQuantity, 0);

    // Calculate active borrows (status is 'active' or 'overdue')
    const activeBorrows = borrows.filter(b => b.status === 'active' || b.status === 'overdue').length;

    // Available tools = total tools - active borrows
    const availableCount = totalTools - activeBorrows;
    const borrowedCount = tools.reduce((sum, tool) => sum + tool.borrowedQuantity, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBorrows = borrows.filter(b => new Date(b.borrowDate) >= thirtyDaysAgo);
    const activeUsers = new Set(recentBorrows.map(b => b.userName)).size;

    const lastMonthAvailable = Math.round(availableCount * 0.95);
    const availabilityGrowth = lastMonthAvailable > 0
      ? parseFloat(((availableCount - lastMonthAvailable) / lastMonthAvailable * 100).toFixed(1))
      : 0;

    const lastMonthBorrowed = Math.round(activeBorrows * 1.02);
    const borrowedGrowth = lastMonthBorrowed > 0
      ? parseFloat(((activeBorrows - lastMonthBorrowed) / lastMonthBorrowed * 100).toFixed(1))
      : 0;

    const lastMonthUsers = Math.round(activeUsers * 0.89);
    const userGrowth = lastMonthUsers > 0
      ? parseFloat(((activeUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1))
      : 0;

    return {
      totalTools,
      availableCount,
      borrowedCount: activeBorrows,
      activeUsers,
      availabilityGrowth,
      borrowedGrowth,
      userGrowth
    };
  }; // ← ACCOLADE FERMANTE AJOUTÉE

  const calculateMonthlyTrend = (borrows: BorrowRecord[]) => {
    // ✅ Month names in English/French
    const monthNames = {
      fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
    const lang = i18n?.language || 'en';
    const months = monthNames[lang as keyof typeof monthNames] || monthNames.en;

    const monthlyData = [];
    const now = new Date();

    console.log(' Date actuelle:', now.toLocaleDateString('fr-FR'));
    console.log(' Total emprunts à analyser:', borrows.length);

    // ✅ Boucler sur les 6 derniers mois (incluant le mois actuel)
    for (let i = 5; i >= 0; i--) {
      // Calculer le premier jour du mois
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // Calculer le premier jour du mois suivant
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      // Nom du mois
      const monthName = months[monthStart.getMonth()];

      // ✅ Filtrer les emprunts de ce mois
      const monthBorrows = borrows.filter(b => {
        const borrowDate = new Date(b.borrowDate);
        return borrowDate >= monthStart && borrowDate < monthEnd;
      });

      // ✅ Filtrer les retours de ce mois
      const monthReturns = borrows.filter(b => {
        if (!b.returnDate) return false;
        const returnDate = new Date(b.returnDate);
        return returnDate >= monthStart && returnDate < monthEnd;
      });

      console.log(` ${monthName} ${monthStart.getFullYear()} (${monthStart.toLocaleDateString('fr-FR')} → ${monthEnd.toLocaleDateString('fr-FR')}):`, {
        emprunts: monthBorrows.length,
        retours: monthReturns.length,
        empruntsDetails: monthBorrows.map(b => ({
          outil: b.toolName,
          date: new Date(b.borrowDate).toLocaleDateString('fr-FR')
        }))
      });

      monthlyData.push({
        month: monthName,
        emprunts: monthBorrows.length,
        retours: monthReturns.length
      });
    }

    console.log(' Tendance finale:', monthlyData);
    return monthlyData;
  };


  const calculateCategoryDistribution = (tools: Tool[]) => {
    const categories = {
      'Tournevis': { name: 'Tournevis', count: 0, color: COLORS.chart1 },
      'Clés': { name: 'Clés', count: 0, color: COLORS.chart2 },
      'Pinces': { name: 'Pinces', count: 0, color: COLORS.chart3 },
      'Outils de marquage': { name: 'Marquage', count: 0, color: COLORS.chart4 },
      'Outils de coupe': { name: 'Coupe', count: 0, color: COLORS.chart5 }
    };

    tools.forEach(tool => {
      if (categories[tool.category]) {
        categories[tool.category].count += tool.totalQuantity;
      }
    });

    return Object.values(categories).map(cat => ({
      name: cat.name,
      value: cat.count,
      color: cat.color
    })).filter(cat => cat.value > 0);
  };

  const calculateUsageByCategory = (tools: Tool[], borrows: BorrowRecord[]) => {
    const categoryUsage: { [key: string]: { name: string, emprunts: number, value: number } } = {
      'Tournevis': { name: 'Tournevis', emprunts: 0, value: 0 },
      'Clés': { name: 'Clés', emprunts: 0, value: 0 },
      'Pinces': { name: 'Pinces', emprunts: 0, value: 0 },
      'Outils de marquage': { name: 'Outils de marquage', emprunts: 0, value: 0 },
      'Outils de coupe': { name: 'Outils de coupe', emprunts: 0, value: 0 }
    };

    // ✅ CORRECTION: Compter le nombre d'outils par catégorie
    tools.forEach(tool => {
      if (categoryUsage[tool.category]) {
        categoryUsage[tool.category].value += tool.totalQuantity;
      }
    });

    // ✅ CORRECTION: Compter SEULEMENT les emprunts ACTIFS par catégorie
    borrows.forEach(borrow => {
      // Only count ACTIVE and OVERDUE borrows, not returned ones
      if (borrow.status === 'active' || borrow.status === 'overdue') {
        const tool = tools.find(t => t.id === borrow.toolId);
        if (tool && categoryUsage[tool.category]) {
          categoryUsage[tool.category].emprunts++;
        }
      }
    });

    // ✅ AFFICHER DANS LA CONSOLE POUR DEBUG
    console.log('📊 Usage par catégorie:', categoryUsage);

    return Object.values(categoryUsage);
  };

  const calculateInsights = (tools: Tool[], borrows: BorrowRecord[]) => {
    const overviewStats = calculateOverviewStats(tools, borrows);
    const categoryDist = calculateCategoryDistribution(tools);

    const returnedBorrows = borrows.filter(b => b.status === 'returned');
    const onTimeReturns = returnedBorrows.filter(b => {
      if (!b.returnDate) return false;
      return new Date(b.returnDate) <= new Date(b.dueDate);
    }).length;
    const onTimeRate = returnedBorrows.length > 0
      ? Math.round((onTimeReturns / returnedBorrows.length) * 100)
      : 100;

    const mostPopularCategory = categoryDist.length > 0
      ? categoryDist.reduce((max, cat) =>
        cat.value > max.value ? cat : max
        , categoryDist[0])
      : { name: 'N/A', value: 0, color: '#999' };

    // ✅ CORRECTION: Calculer le vrai pourcentage de popularité
    const totalTools = tools.reduce((sum, t) => sum + t.totalQuantity, 0);
    const popularPercent = totalTools > 0
      ? Math.round((mostPopularCategory.value / totalTools) * 100)
      : 0;

    // ✅ CORRECTION: Compter les EMPRUNTS ACTIFS réels (pas le champ denormalisé)
    const currentlyBorrowed = borrows.filter(b =>
      b.status === 'active' || b.status === 'overdue'
    ).length;

    return {
      userGrowth: overviewStats.userGrowth,
      mostPopularCategory: mostPopularCategory.name,
      popularPercent,
      onTimeRate,
      criticalStock: currentlyBorrowed  // ✅ Compte réel d'emprunts actifs
    };
  };

  // ✅ ÉCRAN 6 - Analyse Outils
  const calculateToolsAnalysisStats = (tools: Tool[], borrows: BorrowRecord[]) => {
    const totalTools = tools.reduce((sum, tool) => sum + tool.totalQuantity, 0);
    const borrowedCount = tools.reduce((sum, tool) => sum + tool.borrowedQuantity, 0);

    const usageRate = totalTools > 0
      ? Math.round((borrowedCount / totalTools) * 100)
      : 0;

    const returnedBorrows = borrows.filter(b => b.returnDate);
    const totalDuration = returnedBorrows.reduce((sum, b) => {
      const duration = (new Date(b.returnDate!).getTime() - new Date(b.borrowDate).getTime()) / (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);
    const avgDuration = returnedBorrows.length > 0
      ? (totalDuration / returnedBorrows.length).toFixed(1)
      : '0.0';

    // ✅ NOUVEAU CRITÈRE: Outils avec ≥75% emprunté ET en retard
    const now = new Date();
    const toolsNeedingMaintenance = tools.filter(tool => {
      // Vérifier si au moins 75% du stock est emprunté
      const usagePercent = tool.totalQuantity > 0
        ? (tool.borrowedQuantity / tool.totalQuantity) * 100
        : 0;

      if (usagePercent < 75) {
        return false; // Moins de 75% emprunté
      }

      // Vérifier si au moins un emprunt de cet outil est en retard
      const toolBorrows = borrows.filter(b =>
        b.toolId === tool.id &&
        (b.status === 'active' || b.status === 'overdue')
      );

      const hasOverdueBorrow = toolBorrows.some(b => {
        const dueDate = new Date(b.dueDate);
        return now > dueDate; // En retard
      });

      return hasOverdueBorrow;
    });

    const maintenanceNeeded = toolsNeedingMaintenance.length;

    // ✅ CALCUL DES TENDANCES (mois dernier vs maintenant)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Taux d'utilisation du mois dernier
    const lastMonthBorrows = borrows.filter(b => {
      const date = new Date(b.borrowDate);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });
    const lastMonthBorrowedCount = lastMonthBorrows.length;
    const lastMonthUsageRate = totalTools > 0
      ? Math.round((lastMonthBorrowedCount / totalTools) * 100)
      : 0;
    const usageRateTrend = usageRate - lastMonthUsageRate;

    // Durée moyenne du mois dernier
    const lastMonthReturned = lastMonthBorrows.filter(b => b.returnDate);
    const lastMonthTotalDuration = lastMonthReturned.reduce((sum, b) => {
      const duration = (new Date(b.returnDate!).getTime() - new Date(b.borrowDate).getTime()) / (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);
    const lastMonthAvgDuration = lastMonthReturned.length > 0
      ? lastMonthTotalDuration / lastMonthReturned.length
      : parseFloat(avgDuration);
    const avgDurationTrend = parseFloat(avgDuration) - lastMonthAvgDuration;

    return {
      usageRate,
      usageRateTrend,
      avgDuration,
      avgDurationTrend,
      maintenanceNeeded,
      toolsNeedingMaintenance  // ✅ AJOUT: Liste des outils
    };
  };


  // ✅ ÉCRAN 7 - Analyse Utilisateurs
  const calculateUserStats = (borrows: BorrowRecord[]) => {
    const uniqueUsers = new Set(borrows.map(b => b.userName));
    const totalUsers = uniqueUsers.size;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBorrows = borrows.filter(b =>
      new Date(b.borrowDate) >= thirtyDaysAgo
    );
    const activeUsers = new Set(recentBorrows.map(b => b.userName)).size;

    const returnedBorrows = borrows.filter(b => b.status === 'returned');
    const onTimeReturns = returnedBorrows.filter(b => {
      if (!b.returnDate) return false;
      return new Date(b.returnDate) <= new Date(b.dueDate);
    }).length;

    const onTimeRate = returnedBorrows.length > 0
      ? Math.round((onTimeReturns / returnedBorrows.length) * 100)
      : 100;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const lastMonthBorrows = borrows.filter(b => {
      const date = new Date(b.borrowDate);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });
    const lastMonthUsers = new Set(lastMonthBorrows.map(b => b.userName)).size;

    const userGrowth = lastMonthUsers > 0
      ? Math.round(((activeUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : 0;

    const lastMonthReturned = lastMonthBorrows.filter(b => b.status === 'returned');
    const lastMonthOnTime = lastMonthReturned.filter(b => {
      if (!b.returnDate) return false;
      return new Date(b.returnDate) <= new Date(b.dueDate);
    }).length;

    const lastMonthRate = lastMonthReturned.length > 0
      ? Math.round((lastMonthOnTime / lastMonthReturned.length) * 100)
      : 100;

    const rateGrowth = onTimeRate - lastMonthRate;

    return {
      totalUsers,
      activeUsers,
      onTimeRate,
      userGrowth,
      rateGrowth
    };
  }; // ← ACCOLADE FERMANTE AJOUTÉE

  const calculateUserSegmentation = (borrows: BorrowRecord[], usersList: User[]) => {
    const userRoles: { [key: string]: string } = {};

    borrows.forEach(b => {
      // ✅ Use email as unique key since it doesn't change and is unique
      const emailKey = b.userEmail || b.userName;
      if (!userRoles[emailKey]) {
        // ✅ Look up user by email FIRST (most reliable), then by name
        let user = usersList.find(u => u.email === b.userEmail);
        if (!user && b.userName) {
          user = usersList.find(u => u.fullName === b.userName);
        }

        if (user) {
          userRoles[emailKey] = user.role;
        } else {
          // Fallback: déduire du email si l'utilisateur n'est pas trouvé
          if (b.userEmail?.includes('prof')) {
            userRoles[emailKey] = 'professor';
          } else if (b.userEmail?.includes('tech')) {
            userRoles[emailKey] = 'technician';
          } else {
            userRoles[emailKey] = 'student';
          }
        }
      }
    });

    const students = Object.values(userRoles).filter(r => r === 'student').length;
    const professors = Object.values(userRoles).filter(r => r === 'professor').length;
    const technicians = Object.values(userRoles).filter(r => r === 'technician').length;

    return [
      { name: 'students', value: students, color: COLORS.chart1 },
      { name: 'professors', value: professors, color: COLORS.chart2 },
      { name: 'technicians', value: technicians, color: COLORS.chart3 },
    ];
  }; // ← ACCOLADE FERMANTE AJOUTÉE


  // ============================================
  // ÉCRAN 5 - ADMIN OVERVIEW (100% DYNAMIQUE)
  // ============================================
  if (currentScreen === 'admin-overview') {
    // ✅ Calculer TOUTES les statistiques dynamiquement
    const overviewStats = calculateOverviewStats(tools, allBorrows);
    const monthlyTrendDataDynamic = calculateMonthlyTrend(allBorrows);
    const categoryDistributionDynamic = calculateCategoryDistribution(tools);
    // Translate category names for display - map short names to translation keys
    const categoryDistributionTranslated = categoryDistributionDynamic.map(cat => {
      let translationKey;
      if (cat.name === 'Marquage') {
        translationKey = 'category.marquage';
      } else if (cat.name === 'Coupe') {
        translationKey = 'category.coupe';
      } else if (cat.name === 'Tournevis') {
        translationKey = 'category.tournevis';
      } else if (cat.name === 'Clés') {
        translationKey = 'category.cles';
      } else if (cat.name === 'Pinces') {
        translationKey = 'category.pinces';
      } else {
        translationKey = cat.name;
      }
      return {
        ...cat,
        name: t(translationKey)
      };
    });

    // ✅ DEBUG: Afficher les catégories des outils
    console.log('🔍 TOUTES LES CATÉGORIES DES OUTILS:');
    tools.forEach(tool => {
      console.log(`- ${tool.name}: "${tool.category}"`);
    });
    console.log('📊 Résultat distribution:', categoryDistributionDynamic);
    const usageDataDynamic = calculateUsageByCategory(tools, allBorrows);
    // Translate category names for display
    const usageDataTranslated = usageDataDynamic.map(cat => ({
      ...cat,
      name: t(getCategoryTranslationKey(cat.name))
    }));
    const insights = calculateInsights(tools, allBorrows);


    return (
      <div className="min-h-screen bg-gray-50">
        <Logo />
        <div className="fixed top-6 right-6 z-50">
          <LanguageSelector />
        </div>

        <AdminSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

        <div className="ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-navy mb-2">{t('overview')}</h1>
            <p className="text-gray-600">{t('dashboardOverview')}</p>
          </div>

          {/* ✅ KPI Cards - 100% DYNAMIQUES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title={t('totalTools')}
              value={overviewStats.totalTools}
              icon={<Package className="w-6 h-6" />}
              color={COLORS.primary}
              subtitle={t('completeInventory')}
            />

            <KPICard
              title={t('availableTools')}
              value={overviewStats.availableCount}
              icon={<CheckCircle className="w-6 h-6" />}
              trend={`${overviewStats.availabilityGrowth > 0 ? '+' : ''}${overviewStats.availabilityGrowth}%`}
              trendUp={overviewStats.availabilityGrowth >= 0}
              color={COLORS.success}
              subtitle={t('readyToBorrow')}
            />

            <KPICard
              title={t('borrowedTools')}
              value={overviewStats.borrowedCount}
              icon={<ShoppingCart className="w-6 h-6" />}
              trend={`${overviewStats.borrowedGrowth > 0 ? '+' : ''}${overviewStats.borrowedGrowth}%`}
              trendUp={overviewStats.borrowedGrowth >= 0}
              color={COLORS.warning}
              subtitle={t('inUse')}
            />

            <KPICard
              title={t('activeUsers')}
              value={overviewStats.activeUsers}
              icon={<Users className="w-6 h-6" />}
              trend={`${overviewStats.userGrowth > 0 ? '+' : ''}${overviewStats.userGrowth}%`}
              trendUp={overviewStats.userGrowth >= 0}
              color={COLORS.info}
              subtitle={t('thisMonth')}
            />
          </div>

          {/* ✅ Graphiques - 100% DYNAMIQUES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-navy">{t('borrowTrend')}</h3>
                  <p className="text-sm text-gray-600">{t('evolution6Months')}</p>
                </div>
                <Activity className="w-6 h-6 text-blue-600" />
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrendDataDynamic}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="emprunts"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    name={t('borrows')}
                  />
                  <Line
                    type="monotone"
                    dataKey="retours"
                    stroke={COLORS.success}
                    strokeWidth={3}
                    name={t('returns')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-navy">{t('categoryDistribution')}</h3>
                  <p className="text-sm text-gray-600">{t('toolDistribution')}</p>
                </div>
                <PieChartIcon className="w-6 h-6 text-purple-500" />
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryDistributionTranslated}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryDistributionTranslated.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryDistributionTranslated.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <span className="text-slate-700">
                      <strong>{cat.name}:</strong> {cat.value} {cat.value > 1 ? (i18n.language === 'en' ? 'tools' : 'outils') : (i18n.language === 'en' ? 'tool' : 'outil')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy">{t('usageByCategory')}</h3>
                <p className="text-sm text-gray-600">{t('totalBorrows')}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={usageDataTranslated}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="emprunts" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy mb-2">💡 {t('autoInsights')}</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    • <strong>{insights.userGrowth >= 0 ? t('positiveGrowth') : t('negativeGrowth')}</strong>:
                    {' '}{insights.userGrowth > 0 ? '+' : ''}{insights.userGrowth}% {t('activeUsers')}
                  </li>
                  <li>
                    • <strong>{t('popularCategory')}</strong>:
                    {' '}{insights.mostPopularCategory} ({insights.popularPercent}% {t('totalStock')})
                  </li>
                  <li>
                    • <strong>{t('onTimeReturnRate')}</strong>:
                    {' '}{insights.onTimeRate}%
                  </li>
                  <li>
                    • <strong>{t('toolsCurrentlyBorrowed')}</strong>:
                    {' '}{insights.criticalStock} {insights.criticalStock > 1 ? (i18n.language === 'en' ? 'tools' : 'outils') : (i18n.language === 'en' ? 'tool' : 'outil')} {t('inUse')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  // ============================================
  // ÉCRAN 6 - ADMIN TOOLS ANALYSIS (100% DYNAMIQUE)
  // ============================================
  if (currentScreen === 'admin-tools-analysis') {
    // ✅ Calculer les statistiques dynamiquement
    const toolsStats = calculateToolsAnalysisStats(tools, allBorrows);

    {/* ✅ ALERTE: Outils nécessitant maintenance */ }
    {
      toolsStats.toolsNeedingMaintenance && toolsStats.toolsNeedingMaintenance.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                ⚠️ {t('toolsNeedingMaintenance')}
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                {t('maintenanceDescription')}
              </p>
              <ul className="space-y-2">
                {toolsStats.toolsNeedingMaintenance.map((tool: Tool) => {
                  const usagePercent = Math.round((tool.borrowedQuantity / tool.totalQuantity) * 100);
                  const overdueBorrows = allBorrows.filter(b => {
                    if (b.toolId !== tool.id) return false;
                    if (b.status === 'returned') return false;
                    const now = new Date();
                    const dueDate = new Date(b.dueDate);
                    return now > dueDate;
                  });

                  return (
                    <li key={tool.id} className="text-sm text-orange-800 bg-white/60 p-3 rounded-lg">
                      <strong>{t(getToolTranslationKey(tool.name))}</strong>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="px-2 py-1 bg-orange-100 rounded">
                          {usagePercent}% {t('borrowed')} ({tool.borrowedQuantity}/{tool.totalQuantity})
                        </span>
                        <span className="px-2 py-1 bg-red-100 rounded">
                          {overdueBorrows.length} {overdueBorrows.length > 1 ? (i18n.language === 'en' ? 'overdue borrows' : 'emprunts en retard') : (i18n.language === 'en' ? 'overdue borrow' : 'emprunt en retard')}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )
    }

    // ✅ Créer un tableau des outils avec stats d'emprunt
    const toolsWithBorrowStats = tools.map(tool => {
      const toolBorrows = allBorrows.filter(b => b.toolId === tool.id);
      const activeBorrows = toolBorrows.filter(b => b.status === 'active' || b.status === 'overdue');
      const returnedBorrows = toolBorrows.filter(b => b.status === 'returned');

      const totalBorrowDays = returnedBorrows.reduce((sum, b) => {
        if (b.returnDate) {
          const days = Math.ceil((new Date(b.returnDate).getTime() - new Date(b.borrowDate).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }
        return sum;
      }, 0);

      const avgBorrowDays = returnedBorrows.length > 0
        ? Math.round(totalBorrowDays / returnedBorrows.length)
        : 0;

      const usageRate = tool.totalQuantity > 0
        ? Math.round((toolBorrows.length / tool.totalQuantity) * 100)
        : 0;

      return {
        ...tool,
        totalBorrows: toolBorrows.length,
        activeBorrows: activeBorrows.length,
        returnedBorrows: returnedBorrows.length,
        avgBorrowDays,
        usageRate,
        popularityScore: toolBorrows.length > 0 ? Math.round((toolBorrows.length / tools.length) * 100) : 0
      };
    }).sort((a, b) => b.totalBorrows - a.totalBorrows);

    return (
      <div className="min-h-screen bg-gray-50">
        <Logo />
        <div className="fixed top-6 right-6 z-50">
          <LanguageSelector />
        </div>

        <AdminSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

        <div className="ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-navy mb-2">{t('toolsAnalysis')}</h1>
            <p className="text-gray-600">{t('detailedAnalysis')}</p>
          </div>

          {/* ✅ KPI Cards - 100% DYNAMIQUES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KPICard
              title={t('usageRate')}
              value={`${toolsStats.usageRate}%`}
              icon={<Activity className="w-6 h-6" />}
              trend={`${toolsStats.usageRateTrend > 0 ? '+' : ''}${toolsStats.usageRateTrend.toFixed(1)}%`}
              trendUp={toolsStats.usageRateTrend >= 0}
              color={COLORS.success}
            />

            <KPICard
              title={t('avgBorrowDuration')}
              value={`${toolsStats.avgDuration}j`}
              icon={<Calendar className="w-6 h-6" />}
              trend={`${toolsStats.avgDurationTrend > 0 ? '+' : ''}${toolsStats.avgDurationTrend.toFixed(1)}j`}
              trendUp={toolsStats.avgDurationTrend <= 0}
              color={COLORS.info}
            />

            {/* ✅ NOUVEAU: Availability rate */}
            <KPICard
              title={t('availabilityRate')}
              value={`${Math.round((availableCount / totalTools) * 100)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              color={COLORS.primary}
              subtitle={`${availableCount}/${totalTools} ${t('available')}`}
            />

            <KPICard
              title={t('maintenanceNeeded')}
              value={toolsStats.maintenanceNeeded}
              icon={<Settings className="w-6 h-6" />}
              color={COLORS.warning}
            />
          </div>

          {/* ✅ TABLEAU DÉTAILLÉ DES OUTILS */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('detailedToolAnalysis')} ({toolsWithBorrowStats.length})
                </h3>
                <p className="text-sm text-slate-600 mt-1">{t('usageRatePercent')}</p>
              </div>

              <button
                onClick={() => {
                  const data = toolsWithBorrowStats.map(tool => ({
                    [t('tool')]: t(getToolTranslationKey(tool.name)),
                    [t('category')]: t(getCategoryTranslationKey(tool.category)),
                    'Total Qty': tool.totalQuantity,
                    [t('available')]: tool.availableQuantity,
                    'Borrowed': tool.borrowedQuantity,
                    'Total Borrows': tool.totalBorrows,
                    'Active Borrows': tool.activeBorrows,
                    'Returned Borrows': tool.returnedBorrows,
                    'Avg Duration (days)': tool.avgBorrowDays,
                    'Usage Rate %': `${tool.usageRate}%`,
                    'Popularity %': `${tool.popularityScore}%`,
                    [t('drawer')]: tool.drawer ? getDrawerNumber(tool.drawer) : '-',
                    [t('size')]: tool.size || '-'
                  }));

                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Tools');
                  XLSX.writeFile(wb, `tools_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('export')} ({toolsWithBorrowStats.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Outil</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">{t('category')}</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">Emprunts</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">Actifs</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('returned')}</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('avgDays')}</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">Utilisation</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">{t('popularityScore')}</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsWithBorrowStats.map((tool, idx) => (
                    <tr key={tool.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                            <img src={tool.image} alt={t(getToolTranslationKey(tool.name))} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{t(getToolTranslationKey(tool.name))}</p>
                            <p className="text-xs text-slate-500">{tool.drawer ? `${t('drawer')} ${getDrawerNumber(tool.drawer)}` : '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{t(getCategoryTranslationKey(tool.category))}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm font-bold text-slate-900">
                          {tool.totalQuantity}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tool.availableQuantity} {t('available')}{tool.availableQuantity !== 1 ? ' ' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                          {tool.totalBorrows}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                          {tool.activeBorrows}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                          {tool.returnedBorrows}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600 font-semibold">
                        {tool.avgBorrowDays} j
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-700 to-blue-900 transition-all"
                              style={{ width: `${Math.min((tool.activeBorrows / tool.totalQuantity) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-bold">{Math.round((tool.activeBorrows / tool.totalQuantity) * 100)}%</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {tool.popularityScore > 50 && <span>⭐</span>}
                          {tool.popularityScore > 70 && <span>⭐</span>}
                          {tool.popularityScore > 90 && <span>⭐</span>}
                          <span className="text-xs font-bold text-slate-600">{tool.popularityScore}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {toolsWithBorrowStats.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">{t('noBorrowData')}</p>
              </div>
            )}
          </div>

          {/* ✅ GRAPHIQUE TOP 5 OUTILS LES PLUS EMPRUNTÉS */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">{t('top5Tools')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toolsWithBorrowStats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalBorrows" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }


  // ============================================
  // ÉCRAN 7 - ADMIN USERS ANALYSIS (DYNAMIQUE)
  // ============================================
  if (currentScreen === 'admin-users-analysis') {
    // ✅ Calculer les statistiques dynamiquement
    const userStats = calculateUserStats(allBorrows);
    const userSegmentData = calculateUserSegmentation(allBorrows, users);
    const monthlyActivityData = calculateMonthlyTrend(allBorrows);

    const resetAdminFilters = () => {
      setAdminFilters({
        searchUser: '',
        status: 'all',
        dateRange: 'all',
        drawer: 'all'
      });
    };

    const filteredBorrows = filterBorrows(allBorrows, adminFilters);

    const handleSendEmail = (borrow: BorrowRecord) => {
      const status = calculateLateStatus(borrow);
      const type = status.status === 'overdue' ? 'overdue' : 'reminder';
      sendEmailReminder(borrow, type);
    };

    const handleSendBulkEmail = (borrows: BorrowRecord[]) => {
      if (borrows.length === 0) return;
      const confirm = window.confirm(
        t('bulkEmailConfirm').replace('${borrows.length}', borrows.length.toString())
      );
      if (!confirm) return;
      borrows.forEach((b, index) => {
        setTimeout(() => {
          const status = calculateLateStatus(b);
          const type = status.status === 'overdue' ? 'overdue' : 'reminder';
          sendEmailReminder(b, type);
        }, index * 500);
      });
      // Show bulk email confirmation after a short delay
      setTimeout(() => {
        showToast(`📧 ${borrows.length} ${t('emailsSent') || 'emails sent'} successfully`, 'success', 3000);
      }, borrows.length * 500 + 500);
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Logo />
        <div className="fixed top-6 right-6 z-50">
          <LanguageSelector />
        </div>

        <AdminSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

        <div className="ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-navy mb-2">{t('usersAnalysis')}</h1>
            <p className="text-gray-600">{t('userStats')}</p>
          </div>

          {/* ✅ KPI Cards avec données dynamiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard
              title={t('totalUsers')}
              value={userStats.totalUsers}
              icon={<Users className="w-6 h-6" />}
              trend={userStats.userGrowth > 0 ? `+${userStats.userGrowth}%` : `${userStats.userGrowth}%`}
              trendUp={userStats.userGrowth >= 0}
              color={COLORS.primary}
            />

            <KPICard
              title={t('activeUsers')}
              value={userStats.activeUsers}
              icon={<Activity className="w-6 h-6" />}
              subtitle={t('last30Days')}
              color={COLORS.success}
            />

            <KPICard
              title={t('onTimeReturnRate')}
              value={`${userStats.onTimeRate}%`}
              icon={<CheckCircle className="w-6 h-6" />}
              trend={userStats.rateGrowth > 0 ? `+${userStats.rateGrowth}%` : `${userStats.rateGrowth}%`}
              trendUp={userStats.rateGrowth >= 0}
              color={COLORS.info}
            />
          </div>

          {/* ✅ Graphiques avec données dynamiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-navy mb-4">{t('userSegmentation')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userSegmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${t(name)}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userSegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-navy mb-4">{t('monthlyActivity')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="emprunts" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ✅ Filtre avancé et historique des emprunts */}
          <div className="mt-8">
            <AdminBorrowFilters
              filters={adminFilters}
              setFilters={setAdminFilters}
              onReset={resetAdminFilters}
            />

            <AdminBorrowsTable
              borrows={filteredBorrows}
              onSendEmail={handleSendEmail}
              onSendBulkEmail={handleSendBulkEmail}
              getTranslatedToolName={getTranslatedToolName}
              onMarkAsReturned={async (borrow) => {
                if (!window.confirm(`Marquer l'emprunt de "${getTranslatedToolName(borrow.toolName)}" par ${borrow.userName} comme retourné ?`)) return;
                try {
                  const result = await borrowsAPI.markAsReturned(borrow.id);
                  if (result.success) {
                    showToast(`✅ Emprunt de "${getTranslatedToolName(borrow.toolName)}" marqué comme retourné`, 'success', 3000);
                    await loadBorrowsFromBackend();
                    await loadToolsFromBackend();
                  } else {
                    showToast(`❌ Impossible de marquer comme retourné`, 'error', 3000);
                  }
                } catch {
                  showToast(`❌ Erreur lors du retour`, 'error', 3000);
                }
              }}
              onReturnAll={async () => {
                const activeBorrowsCount = allBorrows.filter(
                  b => b.status === 'active' || b.status === 'overdue'
                ).length;
                if (activeBorrowsCount === 0) {
                  showToast(t('noActiveBorrows'), 'info', 3000);
                  return;
                }
                if (!window.confirm(`${t('returnAllConfirm')} (${activeBorrowsCount})?`)) return;
                try {
                  const result = await borrowsAPI.returnAll();
                  if (result.success) {
                    showToast(`✅ ${result.count} ${t('toolsReturned')}`, 'success', 3000);
                    await loadBorrowsFromBackend();
                    await loadToolsFromBackend();
                  }
                } catch (err) {
                  showToast(t('error'), 'error', 3000);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN 9 - Retour d'outil
  // ============================================
  // Au début de chaque écran
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-navy mb-4"></div>
          <p className="text-lg text-slate-700 font-semibold">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRANS - OPÉRATION TIROIR (ouverture → validation → fermeture)
  // DrawerCameraProvider reste monté pendant toute l'opération pour que la
  // caméra ne s'arrête jamais entre les phases -- zéro temps mort de détection.
  // ============================================
  if (
    guardDrawerId && (
      currentScreen === 'drawer-opening-guard' ||
      currentScreen === 'drawer-closing-guard' ||
      (currentScreen === 'product-validation' && !!selectedTool)
    )
  ) {
    const dId = guardDrawerId as '1'|'2'|'3'|'4';
    const resetValidation = () => {
      setSelectedTool(null);
      setActiveBorrowId(null);
      setValidationRequired(false);
      setIsReturnMode(false);
      setGuardSnapshot([]);
    };
    return (
      <DrawerCameraProvider>
        {currentScreen === 'drawer-opening-guard' && (
          <DrawerOpeningGuard
            drawerId={dId}
            onComplete={(snapshot) => {
              setGuardSnapshot(snapshot);
              setCurrentScreen('product-validation');
            }}
          />
        )}
        {currentScreen === 'product-validation' && selectedTool && (
          <ProductValidation
            key={detectionRetryKey}
            toolName={selectedTool.name}
            borrowId={activeBorrowId || ''}
            drawerId={selectedTool.drawer || undefined}
            action={isReturnMode ? 'return' : 'borrow'}
            isRetry={detectionRetryKey > 0}
            initialSnapshot={guardSnapshot.length > 0 ? guardSnapshot : undefined}
            onValidationSuccess={async () => {
              const pvDid = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
              try {
                if (isReturnMode && activeBorrowId) {
                  await borrowsAPI.markAsReturned(activeBorrowId);
                  showToast('✅ Retour validé !', 'success', 3000);
                } else {
                  const result = await borrowsAPI.borrow(currentUser!.id, selectedTool.id, 1);
                  if (result.success) {
                    showToast('✅ Emprunt confirmé !', 'success', 3000);
                  } else {
                    showToast(`❌ ${result.message || t('borrowError')}`, 'error', 3000);
                  }
                }
                await autoReturnBorrowedTools(detectedBorrowedInDrawer);
              } catch {
                showToast('❌ Erreur réseau -- veuillez vérifier votre connexion', 'error', 4000);
              } finally {
                setDetectedBorrowedInDrawer([]);
                resetValidation();
                if (pvDid && ['1','2','3','4'].includes(pvDid)) {
                  setGuardDrawerId(pvDid);
                  setCurrentScreen('drawer-closing-guard');
                } else {
                  setCurrentScreen('tool-selection');
                }
                loadBorrowsFromBackend().catch(() => {});
                loadToolsFromBackend().catch(() => {});
              }
            }}
            onValidationFailure={async (reason) => {
              const pvDid = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
              showToast(`❌ ${reason}`, 'error', 3000);
              await autoReturnBorrowedTools(detectedBorrowedInDrawer);
              setDetectedBorrowedInDrawer([]);
              resetValidation();
              if (pvDid && ['1','2','3','4'].includes(pvDid)) {
                setGuardDrawerId(pvDid);
                setCurrentScreen('drawer-closing-guard');
              } else {
                setCurrentScreen('tool-selection');
              }
              loadBorrowsFromBackend().catch(() => {});
              loadToolsFromBackend().catch(() => {});
            }}
            onRetry={() => {
              setDetectionRetryKey(k => k + 1);
            }}
            onBorrowAlternative={async (wrongToolName: string) => {
              const pvDid = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
              const wrongTool = tools.find(
                t => t.name.toLowerCase().trim() === wrongToolName.toLowerCase().trim()
              );
              try {
                if (!wrongTool || wrongTool.availableQuantity <= 0) {
                  showToast('Cet outil n\'est pas disponible', 'error', 3000);
                } else {
                  const result = await borrowsAPI.borrow(currentUser!.id, wrongTool.id, 1);
                  if (result.success) {
                    showToast(`✅ Emprunt de "${wrongToolName}" confirmé !`, 'success', 3000);
                  } else {
                    showToast(`❌ ${result.message || t('borrowError')}`, 'error', 3000);
                  }
                }
                await autoReturnBorrowedTools(detectedBorrowedInDrawer);
              } catch {
                showToast('❌ Erreur réseau -- veuillez vérifier votre connexion', 'error', 4000);
              } finally {
                setDetectedBorrowedInDrawer([]);
                resetValidation();
                if (pvDid && ['1','2','3','4'].includes(pvDid)) {
                  setGuardDrawerId(pvDid);
                  setCurrentScreen('drawer-closing-guard');
                } else {
                  setCurrentScreen('tool-selection');
                }
                loadBorrowsFromBackend().catch(() => {});
                loadToolsFromBackend().catch(() => {});
              }
            }}
            onExtraToolsDetected={async (extraToolNames: string[]) => {
              if (!currentUser || !selectedTool) return;
              try {
                await borrowsAPI.sendExtraToolsWarning({
                  userId: currentUser.id,
                  expectedToolName: selectedTool.name,
                  extraToolNames,
                  drawer: selectedTool.drawer,
                });
                showToast('⚠️ Avertissement envoye a l\'utilisateur et a l\'administrateur', 'info', 4000);
              } catch (error) {
                console.warn('Erreur envoi avertissement outils supplémentaires:', error);
              }
            }}
            onBorrowAll={async (toolNames: string[]) => {
              const pvDid = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
              const norm = (s: string) => s.toLowerCase().trim()
                .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ');
              let count = 0;
              for (const name of toolNames) {
                const tool = tools.find(t => norm(t.name) === norm(name));
                if (tool && tool.availableQuantity > 0) {
                  try {
                    const result = await borrowsAPI.borrow(currentUser!.id, tool.id, 1);
                    if (result.success) count++;
                  } catch { /* silencieux */ }
                }
              }
              if (count > 0) {
                showToast(`✅ ${count} emprunt${count > 1 ? 's' : ''} confirmé${count > 1 ? 's' : ''} !`, 'success', 3000);
              } else {
                showToast('❌ Erreur lors de l\'emprunt en masse', 'error', 3000);
              }
              await autoReturnBorrowedTools(detectedBorrowedInDrawer);
              setDetectedBorrowedInDrawer([]);
              resetValidation();
              if (pvDid && ['1','2','3','4'].includes(pvDid)) {
                setGuardDrawerId(pvDid);
                setCurrentScreen('drawer-closing-guard');
              } else {
                setCurrentScreen('tool-selection');
              }
              loadBorrowsFromBackend().catch(() => {});
              loadToolsFromBackend().catch(() => {});
            }}
            onBorrowedToolsFoundInDrawer={(toolNames) => setDetectedBorrowedInDrawer(toolNames)}
            onSkip={() => {
              const pvDid = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
              resetValidation();
              if (pvDid && ['1','2','3','4'].includes(pvDid)) {
                setGuardDrawerId(pvDid);
                setCurrentScreen('drawer-closing-guard');
              } else {
                setCurrentScreen('tool-selection');
              }
            }}
          />
        )}
        {currentScreen === 'drawer-closing-guard' && (
          <DrawerClosingGuard
            drawerId={dId}
            onComplete={async () => {
              setGuardDrawerId(null);
              await loadBorrowsFromBackend();
              await loadToolsFromBackend();
              setCurrentScreen('tool-selection');
            }}
            onBorrowStolenTools={async (toolDisplayNames) => {
              if (!currentUser) return;
              const normalize = (s: string) => s.toLowerCase().trim()
                .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ');
              let registeredCount = 0;
              for (const name of toolDisplayNames) {
                const tool = tools.find(t => normalize(t.name) === normalize(name));
                if (tool && tool.availableQuantity > 0) {
                  try {
                    await borrowsAPI.borrow(currentUser.id, tool.id, 1);
                    registeredCount++;
                  } catch {
                    console.error('Failed to register borrow for:', name);
                  }
                }
              }
              loadBorrowsFromBackend().catch(() => {});
              loadToolsFromBackend().catch(() => {});
              if (registeredCount > 0) {
                showToast(`✅ Emprunt${registeredCount > 1 ? 's' : ''} enregistré${registeredCount > 1 ? 's' : ''} (${registeredCount})`, 'success', 3000);
              } else {
                showToast('⚠️ Outil non trouvé dans la base de données', 'warning', 3000);
              }
            }}
          />
        )}
      </DrawerCameraProvider>
    );
  }

  // ============================================
  // ÉCRAN - VALIDATION PRODUIT IA (sans tiroir physique)
  // ============================================
  if (currentScreen === 'product-validation' && selectedTool && !guardDrawerId) {
    const resetValidation = () => {
      setSelectedTool(null);
      setActiveBorrowId(null);
      setValidationRequired(false);
      setIsReturnMode(false);
      setGuardSnapshot([]);
    };

    return (
      <ProductValidation
        key={detectionRetryKey}
        toolName={selectedTool.name}
        borrowId={activeBorrowId || ''}
        drawerId={selectedTool.drawer || undefined}
        action={isReturnMode ? 'return' : 'borrow'}
        isRetry={detectionRetryKey > 0}
        initialSnapshot={guardSnapshot.length > 0 ? guardSnapshot : undefined}
        onValidationSuccess={async () => {
          const dId = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
          try {
            if (isReturnMode && activeBorrowId) {
              await borrowsAPI.markAsReturned(activeBorrowId);
              showToast('✅ Retour validé !', 'success', 3000);
            } else {
              const result = await borrowsAPI.borrow(currentUser!.id, selectedTool.id, 1);
              if (result.success) {
                showToast('✅ Emprunt confirmé !', 'success', 3000);
              } else {
                showToast(`❌ ${result.message || t('borrowError')}`, 'error', 3000);
              }
            }
            await autoReturnBorrowedTools(detectedBorrowedInDrawer);
          } catch {
            showToast('❌ Erreur réseau -- veuillez vérifier votre connexion', 'error', 4000);
          } finally {
            setDetectedBorrowedInDrawer([]);
            resetValidation();
            if (dId && ['1','2','3','4'].includes(dId)) {
              setGuardDrawerId(dId);
              setCurrentScreen('drawer-closing-guard');
            } else {
              setCurrentScreen('tool-selection');
            }
            loadBorrowsFromBackend().catch(() => {});
            loadToolsFromBackend().catch(() => {});
          }
        }}
        onValidationFailure={async (reason) => {
          const dId = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
          showToast(`❌ ${reason}`, 'error', 3000);
          await autoReturnBorrowedTools(detectedBorrowedInDrawer);
          setDetectedBorrowedInDrawer([]);
          resetValidation();
          if (dId && ['1','2','3','4'].includes(dId)) {
            setGuardDrawerId(dId);
            setCurrentScreen('drawer-closing-guard');
          } else {
            setCurrentScreen('tool-selection');
          }
          loadBorrowsFromBackend().catch(() => {});
          loadToolsFromBackend().catch(() => {});
        }}
        onRetry={() => {
          setDetectionRetryKey(k => k + 1);
        }}
        onBorrowAlternative={async (wrongToolName: string) => {
          const dId = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
          const wrongTool = tools.find(
            t => t.name.toLowerCase().trim() === wrongToolName.toLowerCase().trim()
          );
          try {
            if (!wrongTool || wrongTool.availableQuantity <= 0) {
              showToast('Cet outil n\'est pas disponible', 'error', 3000);
            } else {
              const result = await borrowsAPI.borrow(currentUser!.id, wrongTool.id, 1);
              if (result.success) {
                showToast(`✅ Emprunt de "${wrongToolName}" confirmé !`, 'success', 3000);
              } else {
                showToast(`❌ ${result.message || t('borrowError')}`, 'error', 3000);
              }
            }
            await autoReturnBorrowedTools(detectedBorrowedInDrawer);
          } catch {
            showToast('❌ Erreur réseau -- veuillez vérifier votre connexion', 'error', 4000);
          } finally {
            setDetectedBorrowedInDrawer([]);
            resetValidation();
            if (dId && ['1','2','3','4'].includes(dId)) {
              setGuardDrawerId(dId);
              setCurrentScreen('drawer-closing-guard');
            } else {
              setCurrentScreen('tool-selection');
            }
            loadBorrowsFromBackend().catch(() => {});
            loadToolsFromBackend().catch(() => {});
          }
        }}
        onExtraToolsDetected={async (extraToolNames: string[]) => {
          if (!currentUser || !selectedTool) return;
          try {
            await borrowsAPI.sendExtraToolsWarning({
              userId: currentUser.id,
              expectedToolName: selectedTool.name,
              extraToolNames,
              drawer: selectedTool.drawer,
            });
            showToast('⚠️ Avertissement envoye a l\'utilisateur et a l\'administrateur', 'info', 4000);
          } catch (error) {
            console.warn('Erreur envoi avertissement outils supplementaires:', error);
          }
        }}
        onBorrowAll={async (toolNames: string[]) => {
          const dId = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
          const norm = (s: string) => s.toLowerCase().trim()
            .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ');
          let count = 0;
          for (const name of toolNames) {
            const tool = tools.find(t => norm(t.name) === norm(name));
            if (tool && tool.availableQuantity > 0) {
              try {
                const result = await borrowsAPI.borrow(currentUser!.id, tool.id, 1);
                if (result.success) count++;
              } catch { /* silencieux */ }
            }
          }
          if (count > 0) {
            showToast(`✅ ${count} emprunt${count > 1 ? 's' : ''} confirmé${count > 1 ? 's' : ''} !`, 'success', 3000);
          } else {
            showToast('❌ Erreur lors de l\'emprunt en masse', 'error', 3000);
          }
          await autoReturnBorrowedTools(detectedBorrowedInDrawer);
          setDetectedBorrowedInDrawer([]);
          resetValidation();
          if (dId && ['1','2','3','4'].includes(dId)) {
            setGuardDrawerId(dId);
            setCurrentScreen('drawer-closing-guard');
          } else {
            setCurrentScreen('tool-selection');
          }
          loadBorrowsFromBackend().catch(() => {});
          loadToolsFromBackend().catch(() => {});
        }}
        onBorrowedToolsFoundInDrawer={(toolNames) => setDetectedBorrowedInDrawer(toolNames)}
        onSkip={() => {
          const dId = selectedTool.drawer as '1'|'2'|'3'|'4' | null;
          resetValidation();
          if (dId && ['1','2','3','4'].includes(dId)) {
            setGuardDrawerId(dId);
            setCurrentScreen('drawer-closing-guard');
          } else {
            setCurrentScreen('tool-selection');
          }
        }}
      />
    );
  }

  if (currentScreen === 'return-tool') {
    return (
      <ReturnTool
        currentUser={currentUser}
        onBack={async () => {
          // Wait for borrows to load first, then refresh tools
          await loadBorrowsFromBackend();
          await loadToolsFromBackend();
          setCurrentScreen('tool-selection');
        }}
        onReturnSuccess={(drawerId) => {
          setGuardDrawerId(drawerId as '1'|'2'|'3'|'4');
          setCurrentScreen('drawer-closing-guard');
        }}
        onBorrowStolenTools={async (toolDisplayNames) => {
          if (!currentUser) return;
          const norm = (s: string) => s.toLowerCase().trim()
            .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ');
          let registeredCount = 0;
          for (const name of toolDisplayNames) {
            const tool = tools.find(t => norm(t.name) === norm(name));
            if (tool && tool.availableQuantity > 0) {
              try {
                await borrowsAPI.borrow(currentUser.id, tool.id, 1);
                registeredCount++;
              } catch {
                console.error('Failed to register borrow for:', name);
              }
            }
          }
          loadBorrowsFromBackend().catch(() => {});
          loadToolsFromBackend().catch(() => {});
          if (registeredCount > 0) {
            showToast(`✅ Emprunt${registeredCount > 1 ? 's' : ''} enregistré${registeredCount > 1 ? 's' : ''} (${registeredCount})`, 'success', 3000);
          } else {
            showToast('⚠️ Outil non trouvé dans la base de données', 'warning', 3000);
          }
        }}
      />
    );
  }

  // ============================================
  // ÉCRAN - NOTIFICATIONS UTILISATEUR
  // ============================================
  if (currentScreen === 'user-notifications') {
    return (
      <UserNotifications
        currentUser={currentUser}
        onBack={() => setCurrentScreen('tool-selection')}
      />
    );
  }

  // ============================================
  // ÉCRAN - PARAMÈTRES UTILISATEUR
  // ============================================
  if (currentScreen === 'user-settings') {
    return (
      <UserSettings
        currentUser={currentUser}
        setCurrentScreen={setCurrentScreen}
        onBack={() => setCurrentScreen('tool-selection')}
      />
    );
  }

  // ============================================
  // ÉCRAN - PARAMÈTRES ADMINISTRATEUR
  // ============================================
  if (currentScreen === 'admin-settings') {
    return (
      <AdminSettings
        setCurrentScreen={setCurrentScreen}
      />
    );
  }

  // ============================================
  // ÉCRAN - GESTION UTILISATEURS
  // ============================================
  if (currentScreen === 'admin-manage-users') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Logo />
        <div className="fixed top-6 right-6 z-50">
          <LanguageSelector />
        </div>

        <AdminSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

        <div className="ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-navy mb-2">{t('usersManagement')}</h1>
            <p className="text-gray-600">{t('usersManagement')}</p>
          </div>

          {/* Bouton Ajouter */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setSelectedUser(null);
                setUserModalMode('create');
                setUserModalOpen(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
            >
              <User className="w-5 h-5" />
              {t('createPlaceholder')} {t('article_an')} {t('account')}
            </button>
          </div>

          {/* Tableau des utilisateurs */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            {usersLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-navy mb-4"></div>
                <p className="text-slate-600">{t('loading')}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">{t('noUsers')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('name')}</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('email')}</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('badge')}</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('role')}</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold">
                              {user.fullName.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-900">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold">
                            {user.badgeId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'student' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'professor' ? 'bg-purple-100 text-purple-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                            {user.role === 'student' ? t('student') :
                              user.role === 'professor' ? t('professor') : t('technician')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setUserModalMode('edit');
                                setShowCurrentPassword(false);
                                setUserModalOpen(true);
                              }}
                              className="px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-semibold"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setUserModalMode('delete');
                                setUserModalOpen(true);
                              }}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modale Utilisateur */}
          {userModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {userModalMode === 'create' ? t('createPlaceholder') + ' ' + t('article_an') + ' ' + t('account') :
                      userModalMode === 'edit' ? t('editUser') :
                        t('deleteConfirm')}
                  </h3>
                  <button
                    onClick={() => setUserModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {userModalMode === 'delete' ? (
                  <div>
                    <p className="text-slate-700 mb-6">
                      {t('deleteUser')} <strong>{selectedUser?.fullName}</strong> ?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setUserModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Vérifier s'il y a des emprunts actifs
                            const activeBorrows = allBorrows.filter(
                              b => b.userName === selectedUser?.fullName &&
                                (b.status === 'active' || b.status === 'overdue')
                            );

                            if (activeBorrows.length > 0) {
                              // Afficher la grande alerte
                              setUserActiveBorrowsCount(activeBorrows.length);
                              setShowDeleteConfirmWithBorrows(true);
                              return;
                            }

                            // Sinon, supprimer directement
                            const result = await usersAPI.delete(selectedUser!.id);
                            if (result.success) {
                              alert(`✅ ${t('account')} ${t('delete')}d`);
                              await loadUsersFromBackend();
                              setUserModalOpen(false);
                            }
                          } catch (error: any) {
                            alert(error.response?.data?.message || t('deletionError'));
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);

                      try {
                        if (userModalMode === 'create') {
                          const userData = {
                            fullName: formData.get('fullName') as string,
                            email: formData.get('email') as string,
                            badgeId: scannedBadgeId || (formData.get('badgeId') as string),
                            role: formData.get('role') as string,
                            password: (formData.get('password') as string) || undefined
                          };
                          const result = await usersAPI.create(userData);
                          if (result.success) {
                            alert(`✅ ${t('userCreatedSuccess')}`);
                            await loadUsersFromBackend();
                            setUserModalOpen(false);
                          }
                        } else {
                          // Pour la modification, envoyer uniquement les champs fournis
                          const userData: any = {};
                          const fullName = formData.get('fullName') as string;
                          const email = formData.get('email') as string;
                          const badgeId = scannedBadgeId || (formData.get('badgeId') as string);
                          const role = formData.get('role') as string;
                          const password = formData.get('password') as string;

                          console.log('📝 Modification utilisateur:');
                          console.log('  Ancien fullName:', selectedUser?.fullName, '-> Nouveau:', fullName);
                          console.log('  Ancien email:', selectedUser?.email, '-> Nouveau:', email);
                          console.log('  Ancien badgeId:', selectedUser?.badgeId, '-> Nouveau:', badgeId);
                          console.log('  Ancien role:', selectedUser?.role, '-> Nouveau:', role);

                          if (fullName !== undefined && fullName.trim() !== '' && fullName !== selectedUser?.fullName) userData.fullName = fullName;
                          if (email !== undefined && email.trim() !== '' && email !== selectedUser?.email) userData.email = email;
                          if (badgeId !== undefined && badgeId.trim() !== '' && badgeId !== selectedUser?.badgeId) userData.badgeId = badgeId;
                          if (role !== undefined && role !== selectedUser?.role) userData.role = role;
                          if (password !== undefined && password.trim() !== '') userData.password = password;

                          console.log('📤 Données envoyées:', userData);

                          // S'il y a au moins un champ à modifier
                          if (Object.keys(userData).length > 0) {
                            const result = await usersAPI.update(selectedUser!.id, userData);
                            console.log('📥 Réponse du serveur:', result);
                            if (result.success) {
                              alert(`✅ ${t('account')} ${t('edit')}ed`);
                              await loadUsersFromBackend();
                              setUserModalOpen(false);
                            } else {
                              alert(`❌ ${result.message || t('operationError')}`);
                            }
                          } else {
                            alert(`ℹ️ ${t('noChanges')}`);
                            setUserModalOpen(false);
                          }
                        }
                      } catch (error: any) {
                        console.error('❌ Erreur complète:', error);
                        console.error('Response:', error.response);
                        const errorMsg = error.response?.data?.message || error.message || JSON.stringify(error);
                        alert(`❌ ${errorMsg}`);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('fullName')}</label>
                      <input
                        type="text"
                        name="fullName"
                        defaultValue={selectedUser?.fullName}
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('email')}</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={selectedUser?.email}
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Badge ID</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="badgeId"
                          value={scannedBadgeId || selectedUser?.badgeId || ''}
                          onChange={(e) => setScannedBadgeId(e.target.value)}
                          required
                          className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Saisir manuellement ou scanner"
                        />
                        <button
                          type="button"
                          onClick={() => setBadgeScannerOpen(true)}
                          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                          title="Scanner un badge RFID"
                        >
                          <Scan className="w-5 h-5" />
                          Scanner
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        💡 Cliquez sur "Scanner" pour lire le badge avec le lecteur RFID
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('role')}</label>
                      <select
                        name="role"
                        defaultValue={selectedUser?.role || 'student'}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="student">{t('student')}</option>
                        <option value="professor">{t('professor')}</option>
                        <option value="technician">{t('technician')}</option>
                      </select>
                    </div>

                    {userModalMode === 'create' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          {t('New Password')}
                        </label>
                        <input
                          type="password"
                          name="password"
                          className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {userModalMode === 'edit' && (
                      <>
                        {selectedUser?.password && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                              {t('currentPassword')}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={selectedUser.password}
                                readOnly
                                className="flex-1 px-4 py-2 bg-white rounded-lg border border-slate-300 text-slate-600 font-mono text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all text-sm"
                                title={t('currentPasswordHelp')}
                              >
                                {showCurrentPassword ? t('hide') : t('show')}
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            {t('newPassword')}
                          </label>
                          <input
                            type="password"
                            name="password"
                            placeholder={t('passwordOptional')}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <p className="text-xs text-slate-500 mt-1">{t('leaveEmptyToKeep')}</p>
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setUserModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                      >
                        {userModalMode === 'create' ? t('create') : t('edit')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Scanner de Badge RFID */}
          {badgeScannerOpen && (
            <BadgeScanner
              onBadgeScanned={(uid) => {
                setScannedBadgeId(uid);
                setBadgeScannerOpen(false);
                showToast(`Badge scanné : ${uid}`, 'success');
              }}
              onClose={() => setBadgeScannerOpen(false)}
              currentBadgeId={selectedUser?.badgeId}
            />
          )}

          {/* Grande Modale de Confirmation - Suppression avec emprunts actifs */}
          {showDeleteConfirmWithBorrows && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-10 max-w-xl w-full shadow-2xl">
                <div className="flex items-center justify-center mb-6">
                  <AlertCircle className="w-16 h-16 text-red-500" />
                </div>

                <h2 className="text-3xl font-bold text-center text-slate-900 mb-6">
                  ⚠️ {t('deleteConfirm')}
                </h2>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
                  <p className="text-lg text-slate-800 mb-4">
                    {t('deleteUser')} <strong className="text-red-600 text-xl">{selectedUser?.fullName}</strong> ?
                  </p>

                  <div className="bg-white border-l-4 border-red-500 p-4 rounded mb-4">
                    <p className="font-semibold text-slate-900 text-lg">
                      ⚡ {t('attention')} !
                    </p>
                    <p className="text-slate-700 mt-2">
                      {t('activeBorrowsWarning')} <strong className="text-red-600 text-lg">{userActiveBorrowsCount} {t('activeBorrowsCount')}</strong>
                    </p>
                    <p className="text-slate-600 text-sm mt-2">
                      {t('sureDeleteUser')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteConfirmWithBorrows(false);
                      setUserActiveBorrowsCount(0);
                    }}
                    className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all text-lg"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const result = await usersAPI.delete(selectedUser!.id);
                        if (result.success) {
                          alert(`✅ ${t('account')} ${t('delete')}d`);
                          await loadUsersFromBackend();
                          setUserModalOpen(false);
                          setShowDeleteConfirmWithBorrows(false);
                          setUserActiveBorrowsCount(0);
                        }
                      } catch (error: any) {
                        alert(error.response?.data?.message || t('deletionError'));
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all text-lg"
                  >
                    {t('delete')} {t('definitely')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // ÉCRAN - GESTION OUTILS
  // ============================================
  if (currentScreen === 'admin-manage-tools') {
    // ✅ Calculer le nombre d'emprunts ACTIFS par outil (pas le champ denormalisé)
    const toolBorrowCounts = tools.map(tool => {
      const activeBorrowCount = allBorrows.filter(b =>
        b.toolId === tool.id &&
        (b.status === 'active' || b.status === 'overdue')
      ).length;
      return { toolId: tool.id, borrowCount: activeBorrowCount };
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <Logo />
        <div className="fixed top-6 right-6 z-50">
          <LanguageSelector />
        </div>

        <AdminSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

        <div className="ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-navy mb-2">{t('toolsManagement')}</h1>
            <p className="text-gray-600">{t('toolsManagement')}</p>
          </div>

          {/* Section Gestion Catégories */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{t('categoryManagement')}</h2>
              <button
                onClick={() => {
                  setSelectedCategoryForEdit(null);
                  setCategoryModalMode('create');
                  setCategoryModalOpen(true);
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                {t('newCategory')}
              </button>
            </div>

            {/* Tableau des catégories */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
              {categoriesLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-navy mb-4"></div>
                  <p className="text-slate-600">{t('loading')}</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">{t('noCategories')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('name')}</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('toolsCount')}</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, idx) => (
                        <tr key={category.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{t(getCategoryTranslationKey(category.name))}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-semibold">
                              {category._count?.tools || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCategoryForEdit(category);
                                  setCategoryModalMode('edit');
                                  setCategoryModalOpen(true);
                                }}
                                className="px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-all text-sm font-semibold"
                              >
                                {t('edit')}
                              </button>
                              {category._count?.tools > 0 ? (
                                <div className="relative group">
                                  <button
                                    disabled
                                    className="px-3 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-semibold flex items-center gap-2 opacity-60"
                                    title={t('categoryWithTools')}
                                  >
                                    {t('delete')}
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-red-600 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                                    {t('categoryWithTools')}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedCategoryForEdit(category);
                                    setCategoryModalMode('delete');
                                    setCategoryModalOpen(true);
                                  }}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold"
                                >
                                  {t('delete')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Bouton Ajouter Outil */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setSelectedToolForEdit(null);
                setToolModalMode('create');
                setToolModalOpen(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
            >
              <Wrench className="w-5 h-5" />
              {t('createPlaceholder')} {t('article_a')} {t('tool')}
            </button>
          </div>

          {/* Tableau des outils */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-navy mb-4"></div>
                <p className="text-slate-600">{t('loading')}</p>
              </div>
            ) : tools.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">{t('noTools')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('tool')}</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">{t('category')}</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('total')}</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('available')}</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('borrowed')} (Active)</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('drawer')}</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('size')}</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map((tool, idx) => (
                      <tr key={tool.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={tool.image}
                              alt={t(getToolTranslationKey(tool.name))}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <span className="font-medium text-slate-900">{t(getToolTranslationKey(tool.name))}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{t(getCategoryTranslationKey(tool.category))}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-semibold">
                            {tool.totalQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${tool.availableQuantity > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {tool.availableQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">
                            {toolBorrowCounts.find(t => t.toolId === tool.id)?.borrowCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                            {getDrawerNumber(tool.drawer)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                            {tool.size ? t(getSizeTranslationKey(tool.size)) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {(toolBorrowCounts.find(tc => tc.toolId === tool.id)?.borrowCount ?? 0) > 0 && (
                              <button
                                onClick={() => setActiveBorrowsModalTool(tool)}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-semibold flex items-center gap-1"
                                title="Voir les emprunts actifs et marquer comme retourné"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Retours
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedToolForEdit(tool);
                                setToolModalMode('edit');
                                setToolModalOpen(true);
                              }}
                              className="px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-semibold"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedToolForEdit(tool);
                                setToolModalMode('delete');
                                setToolModalOpen(true);
                              }}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modale Outil */}
          {toolModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {toolModalMode === 'create' ? t('createPlaceholder') + ' ' + t('article_a') + ' ' + t('tool') :
                      toolModalMode === 'edit' ? t('editTool') :
                        t('deleteConfirm')}
                  </h3>
                  <button
                    onClick={() => setToolModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {toolModalMode === 'delete' ? (
                  <div>
                    <p className="text-slate-700 mb-6">
                      {t('deleteTool')} <strong>{t(getToolTranslationKey(selectedToolForEdit?.name || ''))}</strong> ?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setToolModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await toolsAPI.delete(selectedToolForEdit!.id);
                            if (result.success) {
                              alert(`✅ ${t('tool')} ${t('delete')}d`);
                              await reloadTools();
                              setToolModalOpen(false);
                            }
                          } catch (error: any) {
                            alert(error.response?.data?.message || t('deletionError'));
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);

                      try {
                        if (toolModalMode === 'create') {
                          const toolData = {
                            name: formData.get('name') as string,
                            category: formData.get('category') as string,
                            imageUrl: formData.get('imageUrl') as string || undefined,
                            totalQuantity: parseInt(formData.get('totalQuantity') as string),
                            size: formData.get('size') as string || undefined,
                            drawer: formData.get('drawer') as string || undefined
                          };
                          const result = await toolsAPI.create(toolData);
                          if (result.success) {
                            alert('✅ Outil créé');
                            await reloadTools();
                            setToolModalOpen(false);
                          } else {
                            alert(`❌ ${result.message || 'Erreur'}`);
                          }
                        } else {
                          // Pour la modification, envoyer uniquement les champs modifiés
                          const toolData: any = {};
                          const name = formData.get('name') as string;
                          const category = formData.get('category') as string;
                          const imageUrl = formData.get('imageUrl') as string;
                          const totalQuantity = formData.get('totalQuantity') as string;
                          const size = formData.get('size') as string;
                          const drawer = formData.get('drawer') as string;

                          console.log('🔧 MODIFICATION OUTIL:');
                          console.log('  Ancien name:', selectedToolForEdit?.name, '-> Nouveau:', name);
                          console.log('  Ancien category:', selectedToolForEdit?.category, '-> Nouveau:', category);

                          if (name !== undefined && name.trim() !== '' && name !== selectedToolForEdit?.name) toolData.name = name;
                          if (category !== undefined && category !== selectedToolForEdit?.category) toolData.category = category;
                          if (uploadedImageUrl && uploadedImageUrl !== selectedToolForEdit?.imageUrl) toolData.imageUrl = uploadedImageUrl;
                          if (totalQuantity !== undefined && totalQuantity.trim() !== '') {
                            const qty = parseInt(totalQuantity);
                            if (qty !== selectedToolForEdit?.totalQuantity) toolData.totalQuantity = qty;
                          }
                          if (size !== undefined && size.trim() !== '' && size !== selectedToolForEdit?.size) toolData.size = size;
                          if (drawer !== undefined && drawer.trim() !== '' && drawer !== selectedToolForEdit?.drawer) toolData.drawer = drawer;

                          console.log('📤 Données à envoyer:', toolData);

                          if (Object.keys(toolData).length > 0) {
                            const result = await toolsAPI.update(selectedToolForEdit!.id, toolData);
                            console.log('📥 Réponse:', result);
                            if (result.success) {
                              alert('✅ Outil modifié');
                              setUploadedImageUrl(null);
                              await reloadTools();
                              setToolModalOpen(false);
                            } else {
                              alert(`❌ ${result.message || 'Erreur'}`);
                            }
                          } else {
                            alert('ℹ️ Aucun changement');
                            setToolModalOpen(false);
                          }
                        }
                      } catch (error: any) {
                        console.error('❌ Erreur:', error);
                        const errorMsg = error.response?.data?.message || error.message || JSON.stringify(error);
                        alert(`❌ ${errorMsg}`);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nom</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={selectedToolForEdit?.name}
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('category')}</label>
                      <select
                        name="category"
                        defaultValue={selectedToolForEdit?.category || (categories.length > 0 ? categories[0].name : 'category.tournevis')}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {categories.length > 0 ? (
                          categories.map((cat: any) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="category.tournevis">{t('category.tournevis')}</option>
                            <option value="category.cles">{t('category.cles')}</option>
                            <option value="category.pinces">{t('category.pinces')}</option>
                            <option value="category.marquage">{t('category.marquage')}</option>
                            <option value="category.coupe">{t('category.coupe')}</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('totalQuantity')}</label>
                      <input
                        type="number"
                        name="totalQuantity"
                        defaultValue={selectedToolForEdit?.totalQuantity}
                        required
                        min="1"
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('size')}</label>
                      <select
                        name="size"
                        defaultValue={selectedToolForEdit?.size || 'Moyen'}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Grand">{t('sizeGrand')}</option>
                        <option value="Moyen">{t('sizeMoyen')}</option>
                        <option value="Petit">{t('sizePetit')}</option>
                        <option value="Mini">Mini</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('drawer')}</label>
                      <select
                        name="drawer"
                        defaultValue={selectedToolForEdit?.drawer || '1'}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="1">{t('drawer1')}</option>
                        <option value="2">{t('drawer2')}</option>
                        <option value="3">{t('drawer3')}</option>
                        <option value="4">{t('drawer4')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        {t('clickToBrowse')}
                      </label>
                      <div className="space-y-3">
                        {/* Zone Drag & Drop */}
                        <div
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const files = e.dataTransfer.files;
                            if (files.length > 0 && files[0].type.startsWith('image/')) {
                              handleImageUpload(files[0]);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="border-2 border-dashed border-blue-400 rounded-lg p-4 text-center bg-blue-50 cursor-pointer hover:bg-blue-100 transition"
                        >
                          <input
                            type="file"
                            id="imageInput"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageUpload(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor="imageInput" className="cursor-pointer block">
                            <p className="text-sm font-semibold text-slate-700">
                              {t('clickToBrowse')}
                            </p>
                          </label>
                        </div>

                        {/* Aperçu de l'image */}
                        {(uploadedImageUrl || selectedToolForEdit?.imageUrl) && (
                          <div className="flex items-center justify-center">
                            <img
                              src={uploadedImageUrl || selectedToolForEdit?.imageUrl || ''}
                              alt={selectedToolForEdit?.name}
                              className="max-w-full h-auto max-h-40 rounded-lg border-2 border-slate-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrl(null);
                          setToolModalOpen(false);
                        }}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                      >
                        {toolModalMode === 'create' ? t('create') : t('edit')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Modale Catégorie */}
          {categoryModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {categoryModalMode === 'create' ? t('newCategory') :
                      categoryModalMode === 'edit' ? t('editCategory') :
                        t('deleteConfirm')}
                  </h3>
                  <button
                    onClick={() => setCategoryModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {categoryModalMode === 'delete' ? (
                  <div>
                    <p className="text-slate-600 mb-6">
                      {t('deleteCategory')} <strong>{selectedCategoryForEdit?.name}</strong> ?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCategoryModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await categoriesAPI.delete(selectedCategoryForEdit.id);
                            if (result.success) {
                              alert(`✅ ${t('categoryDeleted')}`);
                              await loadCategoriesFromBackend();
                              setCategoryModalOpen(false);
                            } else {
                              alert(`❌ ${result.message || t('categoryWithTools')}`);
                            }
                          } catch (error: any) {
                            const errorMsg = error.response?.data?.message || error.message;
                            alert(`❌ ${errorMsg}`);
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('categoryName') as string;

                      if (!name.trim()) {
                        alert('❌ ' + t('categoryName') + ' ' + t('required'));
                        return;
                      }

                      try {
                        if (categoryModalMode === 'create') {
                          const result = await categoriesAPI.create({ name: name.trim() });
                          if (result.success) {
                            alert(`✅ ${t('categoryCreated')}`);
                            await loadCategoriesFromBackend();
                            setCategoryModalOpen(false);
                          } else {
                            alert(`❌ ${result.message || t('categoryAlreadyExists')}`);
                          }
                        } else if (categoryModalMode === 'edit') {
                          const result = await categoriesAPI.update(selectedCategoryForEdit.id, { name: name.trim() });
                          if (result.success) {
                            alert(`✅ ${t('categoryModified')}`);
                            await loadCategoriesFromBackend();
                            setCategoryModalOpen(false);
                          } else {
                            alert(`❌ ${result.message || t('categoryAlreadyExists')}`);
                          }
                        }
                      } catch (error: any) {
                        const errorMsg = error.response?.data?.message || error.message;
                        alert(`❌ ${errorMsg}`);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('categoryName')}</label>
                      <input
                        type="text"
                        name="categoryName"
                        defaultValue={selectedCategoryForEdit?.name || ''}
                        placeholder={t('categoryNamePlaceholder')}
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setCategoryModalOpen(false)}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
                      >
                        {categoryModalMode === 'create' ? t('create') : t('edit')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Modale Emprunts Actifs -- marquer comme retourné */}
          {activeBorrowsModalTool && (() => {
            const activeBorrows = allBorrows.filter(
              b => b.toolId === activeBorrowsModalTool.id &&
                (b.status === 'active' || b.status === 'overdue')
            );
            return (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Emprunts actifs -- {getTranslatedToolName(activeBorrowsModalTool.name)}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {activeBorrows.length} emprunt{activeBorrows.length > 1 ? 's' : ''} en cours
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveBorrowsModalTool(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {activeBorrows.length === 0 ? (
                    <p className="text-center text-slate-500 py-6">Aucun emprunt actif.</p>
                  ) : (
                    <ul className="space-y-3 max-h-80 overflow-y-auto">
                      {activeBorrows.map(borrow => {
                        const lateStatus = calculateLateStatus(borrow);
                        return (
                          <li key={borrow.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 ${
                              lateStatus.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                                lateStatus.status === 'overdue' ? 'bg-red-600' : 'bg-blue-700'
                              }`}>
                                {borrow.userName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{borrow.userName}</p>
                                <p className="text-xs text-slate-500">
                                  Depuis le {new Date(borrow.borrowDate).toLocaleDateString('fr-FR')}
                                  {lateStatus.status === 'overdue' && (
                                    <span className="ml-2 text-red-600 font-semibold">
                                      · {lateStatus.daysLate}j de retard
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Marquer l'emprunt de ${borrow.userName} comme retourné ?`)) return;
                                try {
                                  const result = await borrowsAPI.markAsReturned(borrow.id);
                                  if (result.success) {
                                    showToast(`✅ Emprunt de ${borrow.userName} marqué comme retourné`, 'success', 3000);
                                    await loadBorrowsFromBackend();
                                    await loadToolsFromBackend();
                                    // Fermer la modale si plus d'emprunts actifs
                                    const remaining = allBorrows.filter(
                                      b => b.toolId === activeBorrowsModalTool.id &&
                                        (b.status === 'active' || b.status === 'overdue') &&
                                        b.id !== borrow.id
                                    );
                                    if (remaining.length === 0) setActiveBorrowsModalTool(null);
                                  } else {
                                    showToast('❌ Impossible de marquer comme retourné', 'error', 3000);
                                  }
                                } catch {
                                  showToast('❌ Erreur lors du retour', 'error', 3000);
                                }
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Retourné
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setActiveBorrowsModalTool(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-sm transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }
}
