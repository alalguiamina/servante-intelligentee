import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { borrowsAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

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
}

const ReturnTool: React.FC<ReturnToolProps> = ({ onBack, currentUser }) => {
  const { t } = useTranslation();
  const [activeBorrows, setActiveBorrows] = useState<Borrow[]>([]);
  const [selectedBorrow, setSelectedBorrow] = useState<Borrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const [status, setStatus] = useState<'list' | 'opening-drawer' | 'returning' | 'closing' | 'success' | 'error'>('list');
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
    const key = toolNameToKeyMap[toolName];
    return key ? t(key) : toolName;
  };

  // Translate category
  const getTranslatedCategoryName = (category: any): string => {
    const categoryName = typeof category === 'string' ? category : (category?.name || 'Category');
    const key = categoryToKeyMap[categoryName];
    return key ? t(key) : categoryName;
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

  const handleSelectBorrow = async (borrow: Borrow) => {
    setSelectedBorrow(borrow);
    setStatus('opening-drawer');
    
    // Open the drawer
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/hardware/drawer/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drawerNumber: borrow.tool.drawer?.toString(),
        }),
      });
      
      if (response.ok) {
        console.log(`✅ Drawer ${borrow.tool.drawer} opened`);
      } else {
        console.error('Failed to open drawer');
      }
    } catch (error) {
      console.error('Error opening drawer:', error);
    }
  };

  const handleCompleteReturn = async () => {
    if (!selectedBorrow) return;

    try {
      setReturning(true);
      setStatus('closing');

      // Close the drawer first
      if (selectedBorrow.tool.drawer) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/hardware/drawer/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drawerNumber: selectedBorrow.tool.drawer.toString() }),
          });
          console.log(`✅ Drawer ${selectedBorrow.tool.drawer} closing`);
        } catch (error) {
          console.error('Error closing drawer:', error);
        }
      }

      const result = await borrowsAPI.return(selectedBorrow.id);

      if (result.success) {
        setStatus('success');
        setActiveBorrows(activeBorrows.filter(b => b.id !== selectedBorrow.id));

        setTimeout(() => {
          setSelectedBorrow(null);
          setStatus('list');
          onBack();
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Error returning tool');
      }
    } catch (error) {
      console.error('Error returning tool:', error);
      setStatus('error');
      setErrorMessage('Error returning tool');
    } finally {
      setReturning(false);
    }
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

  // DRAWER OPENED - RETURNING TOOL
  if ((status === 'opening-drawer' || status === 'returning' || status === 'closing') && selectedBorrow) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12 space-y-2">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 via-emerald-400 to-green-600 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Package className="w-16 h-16 text-white" />
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              {t('drawerIsOpen', { drawer: selectedBorrow.tool.drawer })}
            </h1>
            <p className="text-2xl text-gray-600 font-medium">{t('pleaseReturnYourTool')}</p>
          </div>

          {/* Tool Info */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg mb-8 border border-blue-100 card-glass">
            <div className="flex gap-6 items-start">
              {selectedBorrow.tool.image && (
                <img 
                  src={selectedBorrow.tool.image} 
                  alt={selectedBorrow.tool.name}
                  className="w-28 h-28 object-cover rounded-xl shadow-md border-2 border-white hover:scale-105 transition-transform"
                />
              )}
              <div className="flex-1 space-y-3">
                <h3 className="text-3xl font-bold text-gray-900">{getTranslatedToolName(selectedBorrow.tool.name)}</h3>
                <div className="space-y-2">
                  <p className="text-lg text-gray-600">
                    <span className="text-gray-500">{t('category')}:</span> <span className="font-semibold text-gray-900">{getTranslatedCategoryName(selectedBorrow.tool.category)}</span>
                  </p>
                  <p className="text-lg text-gray-600">
                    <span className="text-gray-500">{t('drawer')}:</span> <span className="font-bold text-blue-600 text-xl">{selectedBorrow.tool.drawer}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-600 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-lg shadow-lg">
                  1
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{t('placeToolInDrawer')}</h4>
                  <p className="text-gray-600">{t('placeToolInDrawerDesc', { drawer: selectedBorrow.tool.drawer })}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-600 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-lg shadow-lg">
                  2
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{t('closeTheDrawer')}</h4>
                  <p className="text-gray-600">{t('clickButtonWhenDone')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleCompleteReturn}
            disabled={returning}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white font-bold text-lg hover:from-green-600 hover:via-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
          >
            {returning ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                <span>{t('closingDrawer')}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>{t('closeDrawerFinish')}</span>
              </>
            )}
          </button>
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
                      {t('toolDrawer', { drawer: borrow.tool.drawer })}
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
