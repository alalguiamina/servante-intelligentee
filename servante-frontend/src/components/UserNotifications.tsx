import React from 'react';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../images/emines_logo.png';

interface UserNotificationsProps {
  currentUser: any;
  onBack: () => void;
}

const UserNotifications: React.FC<UserNotificationsProps> = ({ currentUser, onBack }) => {
  const { t } = useTranslation();

  // Sample notifications - in real app, these would come from backend
  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: t('dueDate') || 'Due Date Approaching',
      message: t('returnReminder') || 'Please return your borrowed tools soon',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: t('returnSuccess') || 'Return Confirmed',
      message: t('itemReturned') || 'Your tool has been successfully returned',
      time: '1 day ago',
      read: true
    },
    {
      id: 3,
      type: 'info',
      title: t('newTools') || 'New Tools Available',
      message: t('checkNewItems') || 'Check out the new tools added to inventory',
      time: '3 days ago',
      read: true
    }
  ];

  const Logo = () => (
    <img 
      src={logo} 
      alt="Logo" 
      className="h-14 object-contain"
    />
  );

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
              <Bell className="w-6 h-6 inline mr-2" />
              {t('notifications')}
            </h1>
          </div>
</div>
      </div>

      {/* User Info */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-lg">
          <p className="font-semibold text-lg">{currentUser?.fullName}</p>
          <p className="text-blue-100 text-sm">{currentUser?.email}</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">{t('noNotifications') || 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const Icon = notif.type === 'warning' ? AlertTriangle :
                          notif.type === 'success' ? CheckCircle : Bell;
              const bgColor = notif.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                             notif.type === 'success' ? 'bg-green-50 border-green-200' : 
                             'bg-blue-50 border-blue-200';
              const iconColor = notif.type === 'warning' ? 'text-yellow-600' :
                               notif.type === 'success' ? 'text-green-600' : 'text-blue-600';

              return (
                <div
                  key={notif.id}
                  className={`${
                    notif.read ? 'bg-white' : bgColor
                  } border rounded-xl p-6 shadow-sm transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <h3 className={`font-bold text-slate-900 mb-1 ${
                        !notif.read ? 'text-lg' : ''
                      }`}>
                        {notif.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">{notif.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {notif.time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;