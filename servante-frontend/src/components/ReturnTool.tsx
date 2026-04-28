import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { borrowsAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import ProductValidation from './ProductValidation';

interface Borrow {
  id: string;
  toolId: string;
  userId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ACTIVE' | 'OVERDUE' | 'RETURNED';
  tool: {
    id: string;
    name: string;
    image?: string;
    category: string | { name: string; [key: string]: any };
    drawer?: string;
  };
  user: {
    fullName: string;
    email: string;
  };
}

interface ReturnToolProps {
  onBack: () => void;
  currentUser: any;
  onReturnSuccess?: (drawerId: string) => void;
  onBorrowStolenTools?: (toolNames: string[]) => Promise<void>;
}

const ReturnTool: React.FC<ReturnToolProps> = ({ onBack, currentUser, onReturnSuccess, onBorrowStolenTools }) => {
  const { t } = useTranslation();
  const [activeBorrows, setActiveBorrows] = useState<Borrow[]>([]);
  const [selectedBorrow, setSelectedBorrow] = useState<Borrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'list' | 'validating' | 'closing' | 'success' | 'error'>('list');
  const [errorMessage, setErrorMessage] = useState('');

  // Tool name translation map
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
    'PINCE A DENUDER': 'tool.pinceADenuder',
    'Pince à bec plat': 'tool.pinceBecPlat',
    'Mini pince à bec ROND': 'tool.miniPinceBecRond',
    'DENUDEUR AUTOMATIQUE': 'tool.denudeurAutomatique',
    'Pince COUPANTE': 'tool.pinceCoupante',
    'PINCE UNIVERSELLE': 'tool.pinceUniverselle',
    'PINCE A BEC COUDE': 'tool.pinceABecCoude',
    'Clé L grande': 'tool.cleLGrande',
    'Clé L petite': 'tool.cleLPetite',
    'Lot de clés plates': 'tool.lotClesPlates',
    'PERCEUSE': 'tool.perceuse',
    'PIED A COULISSE': 'tool.piedACoulisse',
    'MULTIMETRE': 'tool.multimetre',
    // Noms exacts de la base de données (seed) avec accents
    'Pince à dénuder': 'tool.pinceADenuder',
    'Dénudeur automatique': 'tool.denudeurAutomatique',
    'Mini pince coupante': 'tool.miniPinceCoupante',
    'Mini pince à bec rond': 'tool.miniPinceBecRond',
    'Pince coupante': 'tool.pinceCoupante',
    'Pince universelle': 'tool.pinceUniverselle',
    'Pince à bec coudée': 'tool.pinceABecCoude',
    'Tournevis plat': 'tool.tournevisPlat',
    'Tournevis américain': 'tool.tournevisAmericain',
    'Pied à coulisse': 'tool.piedACoulisse',
    'Multimètre': 'tool.multimetre',
    'Mini pince à bec demi-rond coudée': 'tool.miniPinceBecDemiRondCoude',
    'Mini pince à bec demi-rond coudé': 'tool.miniPinceBecDemiRondCoude',
    'Mini pince à bec plat': 'tool.miniPinceBecPlat',
  };

  const categoryToKeyMap: Record<string, string> = {
    'Tournevis': 'category.tournevis',
    'Clés': 'category.cles',
    'Pinces': 'category.pinces',
    'Outils de marquage': 'category.marquage',
    'Outils de coupe': 'category.coupe'
  };

  // Translate tool name
  const getTranslatedToolName = (toolName: string): string => {
    // First try exact match
    if (toolNameToKeyMap[toolName]) {
      return t(toolNameToKeyMap[toolName]);
    }

    // Try case-insensitive match
    for (const [key, value] of Object.entries(toolNameToKeyMap)) {
      if (key.toLowerCase() === toolName.toLowerCase()) {
        return t(value);
      }
    }

    // Fallback: return original name
    return toolName;
  };

  // Translate category
  const getTranslatedCategoryName = (category: any): string => {
    const categoryName = typeof category === 'string' ? category : (category?.name || 'Category');
    const key = categoryToKeyMap[categoryName];
    return key ? t(key) : categoryName;
  };

  // Drawer letter to number mapping
  const getDrawerNumber = (drawerLetter: string): number => {
    const drawerMap: Record<string, number> = { 'x': 1, 'y': 2, 'z': 3, 'a': 4 };
    return drawerMap[drawerLetter?.toLowerCase()] || 1;
  };

  useEffect(() => {
    const loadBorrows = async () => {
      try {
        setLoading(true);
        const result = await borrowsAPI.getUserBorrows(currentUser.id);
        if (result.success && Array.isArray(result.data)) {
          const active = result.data.filter((b: Borrow) => b.status === 'ACTIVE' || b.status === 'OVERDUE');
          setActiveBorrows(active);
        }
      } catch (error) {
        console.error('Error loading borrows:', error);
        setErrorMessage('Error loading borrows');
      } finally {
        setLoading(false);
      }
    };

    loadBorrows();
  }, [currentUser]);

  const handleSelectBorrow = (borrow: Borrow) => {
    setSelectedBorrow(borrow);

    // Open drawer fire-and-forget, go straight to YOLO validation
    if (borrow.tool.drawer && ['1', '2', '3', '4'].includes(borrow.tool.drawer)) {
      fetch(`${import.meta.env.VITE_API_URL}/hardware/drawer/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawerNumber: borrow.tool.drawer }),
      }).catch(() => console.warn('⚠️ Tiroir non disponible'));
    }

    setStatus('validating');
  };

  const handleValidationSuccess = async () => {
    if (!selectedBorrow) return;
    try {
      setStatus('closing');

      // Confirm return in database FIRST
      const result = await borrowsAPI.return(selectedBorrow.id);
      if (result.success) {
        setActiveBorrows(prev => prev.filter(b => b.id !== selectedBorrow.id));

        // ✅ NEW: Trigger DrawerClosingGuard in parent for hand detection monitoring during closing
        if (selectedBorrow.tool.drawer && onReturnSuccess) {
          onReturnSuccess(selectedBorrow.tool.drawer);
          // Parent will show DrawerClosingGuard which will handle closing + monitoring
          setSelectedBorrow(null);
          setStatus('list');
        } else {
          // Fallback: close drawer manually if no parent callback
          try {
            await fetch(`${import.meta.env.VITE_API_URL}/hardware/drawer/close`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ drawerNumber: selectedBorrow.tool.drawer?.toString() }),
            });
          } catch (error) {
            console.error('Error closing drawer:', error);
          }
          setStatus('success');
          setTimeout(() => {
            setSelectedBorrow(null);
            setStatus('list');
            onBack();
          }, 2000);
        }
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Error returning tool');
      }
    } catch (error) {
      console.error('Error returning tool:', error);
      setStatus('error');
      setErrorMessage('Error returning tool');
    }
  };

  const handleValidationFailure = async (reason: string) => {
    // Annuler = fermer le tiroir et revenir à la liste
    if (selectedBorrow?.tool.drawer) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/hardware/drawer/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drawerNumber: selectedBorrow.tool.drawer.toString() }),
        });
      } catch { /* silencieux si le matériel est indisponible */ }
    }
    setErrorMessage(reason);
    setSelectedBorrow(null);
    setStatus('list');
  };

  const handleRetry = () => {
    setStatus('validating');
  };

  // LOADING
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mx-auto flex items-center justify-center shadow-lg">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-lg text-gray-700 font-semibold">{t('loadingBorrows')}</p>
        </div>
      </div>
    );
  }

  // SUCCESS
  if (status === 'success' && selectedBorrow) {
    return (
      <div className="h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{t('returnSuccessful')}</h2>
            <p className="text-xl text-gray-700 font-semibold mb-1">{getTranslatedToolName(selectedBorrow.tool.name)}</p>
            <p className="text-gray-600">{t('returnSuccessMessage')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ERROR
  if (status === 'error') {
    return (
      <div className="h-screen bg-gradient-to-b from-red-50 to-rose-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-14 h-14 text-red-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('error')}</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setStatus('list');
              setSelectedBorrow(null);
              setErrorMessage('');
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  // YOLO VALIDATION
  if (status === 'validating' && selectedBorrow) {
    return (
      <ProductValidation
        toolName={selectedBorrow.tool.name}
        borrowId={selectedBorrow.id}
        drawerId={selectedBorrow.tool.drawer || undefined}
        action="return"
        onValidationSuccess={handleValidationSuccess}
        onValidationFailure={handleValidationFailure}
        onRetry={handleRetry}
        onBorrowStolenTools={onBorrowStolenTools}
      />
    );
  }

  // CLOSING - waiting after validation
  if (status === 'closing') {
    return (
      <div className="h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-lg text-gray-700 font-semibold">{t('closingDrawer')}</p>
        </div>
      </div>
    );
  }


  // NO ITEMS
  if (activeBorrows.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('noToolsToReturn')}</h2>
            <p className="text-lg text-gray-600 mb-8">{t('noToolsToReturnDesc')}</p>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-semibold text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backButton')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('returnATool')}</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('myActiveBorrows')}</h2>
          <p className="text-lg text-gray-600 font-medium">{t('selectToolToReturn')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBorrows.map((borrow) => (
            <button
              key={borrow.id}
              onClick={() => handleSelectBorrow(borrow)}
              className="text-left transition-all duration-300 transform hover:scale-105 focus:outline-none group"
            >
              <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-200 border border-gray-100 hover:border-blue-400 overflow-hidden h-full hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50">
                {/* Image */}
                {borrow.tool.image && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 h-40">
                    <img 
                      src={borrow.tool.image} 
                      alt={borrow.tool.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {borrow.status === 'OVERDUE' && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-full shadow-md">
                          ⚠️ Overdue
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Title and Category */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">{getTranslatedToolName(borrow.tool.name)}</h3>
                    <p className="text-sm text-gray-600 font-medium">{getTranslatedCategoryName(borrow.tool.category)}</p>
                  </div>
                  
                  {/* Drawer Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                      {t('toolDrawer', { drawer: getDrawerNumber(borrow.tool.drawer) })}
                    </span>
                  </div>

                  {/* Border */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-gray-500 font-medium">{t('clickToContinue')}</span>
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg group-hover:from-blue-700 group-hover:to-blue-600 transition-all shadow-md group-hover:shadow-lg">
                      {t('returnNow')}
                      <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReturnTool;
