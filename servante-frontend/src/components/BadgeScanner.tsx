import React, { useState, useEffect, useRef } from 'react';
import { Scan, X, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../services/api';

interface BadgeScannerProps {
    onBadgeScanned: (uid: string) => Promise<{ success: boolean; userName?: string }>;
    onClose: () => void;
    currentBadgeId?: string;
}

const BadgeScanner: React.FC<BadgeScannerProps> = ({ onBadgeScanned, onClose, currentBadgeId }) => {
    const { t } = useTranslation();
    const [scanId, setScanId] = useState<string | null>(null);
    const [status, setStatus] = useState<'init' | 'waiting' | 'success' | 'error'>('init');
    const [message, setMessage] = useState('');
    const [scannedUid, setScannedUid] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const isPollingRef = useRef(false);

    // Initialize message on mount
    useEffect(() => {
        setMessage(t('initializing'));
    }, [t]);

    // Démarrer le scan au montage du composant
    useEffect(() => {
        startScan();

        return () => {
            // Arrêter le polling et annuler le scan
            isPollingRef.current = false;
            if (scanId) {
                cancelScan(scanId);
            }
        };
    }, []);

    // Démarrer un nouveau scan
    const startScan = async () => {
        try {
            console.log('🚀 Starting badge scan...');
            const response = await fetch(`${API_BASE_URL}/hardware/badge-scan/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('📡 Scan start response status:', response.status);
            const data = await response.json();
            console.log('📡 Scan start response data:', data);

            if (data.success) {
                setScanId(data.scanId);
                setStatus('waiting');
                setMessage(t('placeBadgeNear'));

                // Commencer à poller pour le résultat
                pollForResult(data.scanId);
            } else {
                console.error('❌ Failed to start scan:', data);
                setStatus('error');
                setMessage(data.message || t('scanStartError'));
            }
        } catch (error) {
            console.error('❌ Erreur startScan:', error);
            setStatus('error');
            setMessage(t('serverConnectionError'));
        }
    };

    // Poller le serveur pour vérifier si un badge a été scanné
    const pollForResult = async (id: string) => {
        const maxAttempts = 60; // 60 secondes max
        let attempts = 0;
        isPollingRef.current = true;

        const poll = async () => {
            // Arrêter si le polling a été annulé
            if (!isPollingRef.current) {
                return;
            }

            if (attempts >= maxAttempts) {
                setStatus('error');
                setMessage(t('scanTimeoutError'));
                isPollingRef.current = false;
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/hardware/badge-scan/${id}`);
                const data = await response.json();

                console.log(`📡 Poll attempt ${attempts}/${maxAttempts}:`, data);

                if (data.success && data.uid) {
                    // Badge détecté !
                    console.log('✅ Badge detected! UID:', data.uid);
                    setScannedUid(data.uid);
                    setStatus('success');
                    setMessage(t('badgeDetectedSuccess'));
                    isPollingRef.current = false;

                    try {
                        console.log('🔐 Attempting authentication with UID:', data.uid);
                        const authResult = await onBadgeScanned(data.uid);
                        console.log('🔐 Authentication result:', authResult);
                        if (authResult.success && authResult.userName) {
                            setUserName(authResult.userName);
                            setMessage(t('welcome', { userName: authResult.userName }));
                        }
                    } catch (error) {
                        console.error('❌ Erreur authentification:', error);
                    }
                } else if (data.success && !data.uid) {
                    // Toujours en attente
                    attempts++;
                    if (isPollingRef.current) {
                        setTimeout(poll, 1000);
                    }
                } else {
                    console.error('❌ Poll error:', data);
                    setStatus('error');
                    setMessage(data.message || t('scanError'));
                    isPollingRef.current = false;
                }
            } catch (error) {
                console.error('❌ Erreur poll:', error);
                setStatus('error');
                setMessage(t('serverConnectionError'));
                isPollingRef.current = false;
            }
        };

        poll();
    };

    // Annuler un scan
    const cancelScan = async (id: string) => {
        try {
            await fetch(`${API_BASE_URL}/hardware/badge-scan/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Erreur cancelScan:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 card-glass">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Scan className="w-6 h-6 text-blue-600" />
                        </div>
                        {t('scanBadgeTitle')}
                    </h3>
                    <button
                        onClick={() => {
                            isPollingRef.current = false;
                            if (scanId) cancelScan(scanId);
                            onClose();
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Animation et statut */}
                    <div className="flex flex-col items-center justify-center py-10">
                        {status === 'waiting' && (
                            <div className="relative">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="absolute inset-4 border-4 border-blue-300 rounded-full animate-spin opacity-30"></div>
                                    <Scan className="w-16 h-16 text-blue-600 animate-pulse" />
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-rose-50 rounded-full flex items-center justify-center shadow-lg">
                                <X className="w-16 h-16 text-red-600" />
                            </div>
                        )}

                        {status === 'init' && (
                            <Loader className="w-16 h-16 text-blue-400 animate-spin" />
                        )}
                    </div>

                    {/* Message */}
                    <div className="text-center">
                        <p className={`text-lg font-semibold mb-2 ${status === 'success' ? 'text-green-600' :
                                status === 'error' ? 'text-red-600' :
                                    'text-gray-900'
                            }`}>
                            {message}
                        </p>
                        {userName && status === 'success' && (
                            <p className="text-2xl text-green-600 font-bold mt-3 animate-pulse">
                                {userName}
                            </p>
                        )}
                        {currentBadgeId && status === 'waiting' && (
                            <p className="text-xs text-gray-500 mt-4 bg-gray-50 rounded-lg p-2 font-mono">
                                {currentBadgeId}
                            </p>
                        )}
                    </div>

                    {/* Instructions */}
                    {status === 'waiting' && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-blue-900">💡 {t('instructions')}</p>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>{t('bringBadgeNear')}</li>
                                <li>{t('waitForBeep')}</li>
                                <li>{t('automaticRegistration')}</li>
                            </ol>
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                        {status === 'error' && (
                            <button
                                onClick={() => {
                                    setStatus('init');
                                    startScan();
                                }}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                            >
                                {t('retry')}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (scanId) cancelScan(scanId);
                                onClose();
                            }}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${status === 'success'
                                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-md hover:shadow-lg'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                }`}
                        >
                            {status === 'success' ? `✓ ${t('close')}` : t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeScanner;
