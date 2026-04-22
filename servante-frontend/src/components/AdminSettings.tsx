import React, { useState } from 'react';
import { Settings, Save, Mail, Database, Shield, Globe, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../images/emines_logo.png';

interface AdminSettingsProps {
setCurrentScreen: (screen: any) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ setCurrentScreen }) => {
  const { t } = useTranslation();
  const [smtpServer, setSmtpServer] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpEmail, setSmtpEmail] = useState('admin@servante.local');
  const [dueDays, setDueDays] = useState('7');
  const [reminderDays, setReminderDays] = useState('2');
  const [autoBackup, setAutoBackup] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const Logo = () => (
    <img 
      src={logo} 
      alt="Logo" 
      className="h-14 object-contain"
    />
  );

  const handleSave = () => {
    // In real app, save to backend
    alert('✅ ' + (t('settingsSaved') || 'Settings saved successfully!'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Logo />
      
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-md z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('admin-overview')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              <Settings className="w-6 h-6 inline mr-2" />
              {t('adminSettings') || 'Admin Settings'}
            </h1>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t('save')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* Email Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t('emailConfiguration') || 'Email Configuration'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t('emailConfigDesc') || 'Configure SMTP settings for sending email notifications'}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('smtpServer') || 'SMTP Server'}
              </label>
              <input
                type="text"
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('smtpPort') || 'SMTP Port'}
                </label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('senderEmail') || 'Sender Email'}
                </label>
                <input
                  type="email"
                  value={smtpEmail}
                  onChange={(e) => setSmtpEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="admin@servante.local"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 {t('emailTestTip') || 'Test email functionality by sending reminders from the Users Analysis page'}
              </p>
            </div>
          </div>
        </div>

        {/* Borrowing Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('borrowingRules') || 'Borrowing Rules'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t('borrowingRulesDesc') || 'Configure default borrowing periods and reminder settings'}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('defaultDueDays') || 'Default Due Days'}
                </label>
                <input
                  type="number"
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  min="1"
                  max="30"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {t('daysToReturn') || 'Days until tool must be returned'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('reminderBeforeDue') || 'Reminder Before Due'}
                </label>
                <input
                  type="number"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  min="1"
                  max="7"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {t('daysBeforeReminder') || 'Days before due date to send reminder'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              {t('systemSettings') || 'System Settings'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t('systemSettingsDesc') || 'Manage system-wide settings and maintenance'}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{t('autoBackup') || 'Automatic Backup'}</p>
                <p className="text-sm text-slate-600">{t('autoBackupDesc') || 'Daily database backup at midnight'}</p>
              </div>
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  autoBackup ? 'bg-green-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    autoBackup ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{t('maintenanceMode') || 'Maintenance Mode'}</p>
                <p className="text-sm text-slate-600">{t('maintenanceModeDesc') || 'Disable user access for system maintenance'}</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  maintenanceMode ? 'bg-red-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    maintenanceMode ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('security') || 'Security'}
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => alert(t('changePasswordPrompt') || 'Change admin password functionality')}
              className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-left font-semibold"
            >
              {t('changeAdminPassword') || 'Change Admin Password'}
            </button>
            <button
              onClick={() => alert(t('viewLogsPrompt') || 'View system logs functionality')}
              className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-left font-semibold"
            >
              {t('viewSecurityLogs') || 'View Security Logs'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
