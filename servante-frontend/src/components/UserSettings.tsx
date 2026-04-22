import React, { useState } from 'react';
import { ArrowLeft, Settings, Bell, Mail, Moon, Globe, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../images/emines_logo.png';

interface UserSettingsProps {
  currentUser: any;
  setCurrentScreen: (screen: any) => void;
  onBack: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser, setCurrentScreen, onBack }) => {
  const { t, i18n } = useTranslation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const Logo = () => (
    <img 
      src={logo} 
      alt="Logo" 
      className="h-14 object-contain"
    />
  );

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Logo />
      
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-md z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              <Settings className="w-6 h-6 inline mr-2" />
              {t('settings')}
            </h1>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {currentUser?.fullName?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-lg">{currentUser?.fullName}</p>
              <p className="text-blue-100 text-sm">{currentUser?.email}</p>
              <p className="text-blue-200 text-xs mt-1">{currentUser?.badgeID}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl mx-auto px-6 pb-8 space-y-6">
        
        {/* Notifications Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('notifications')}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{t('emailNotifications') || 'Email Notifications'}</p>
                <p className="text-sm text-slate-600">{t('receiveEmailAlerts') || 'Receive email alerts for due dates'}</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  emailNotifications ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{t('pushNotifications') || 'Push Notifications'}</p>
                <p className="text-sm text-slate-600">{t('receivePushAlerts') || 'Receive push notifications'}</p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  pushNotifications ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    pushNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Moon className="w-5 h-5" />
              {t('appearance') || 'Appearance'}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{t('darkMode') || 'Dark Mode'}</p>
                <p className="text-sm text-slate-600">{t('darkModeDesc') || 'Switch to dark theme'}</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  darkMode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('language')}
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => changeLanguage('fr')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                i18n.language === 'fr' 
                  ? 'border-blue-600 bg-blue-50 text-blue-900' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold">Français</p>
              <p className="text-sm text-slate-600">French</p>
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                i18n.language === 'en' 
                  ? 'border-blue-600 bg-blue-50 text-blue-900' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold">English</p>
              <p className="text-sm text-slate-600">Anglais</p>
            </button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('account')}
            </h2>
          </div>
          <div className="p-6">
            <button
              onClick={() => setCurrentScreen('user-account')}
              className="w-full p-4 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100 transition-all"
            >
              {t('manageAccount') || 'Manage My Account'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserSettings;
