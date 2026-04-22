import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const bgColor = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-lg shadow-green-100/50',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 shadow-lg shadow-red-100/50',
    info: 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-lg shadow-blue-100/50'
  }[type];

  const textColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    info: 'text-blue-900'
  }[type];

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  }[type];

  const accentColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  }[type];

  return (
    <div className={`${bgColor} rounded-xl p-4 shadow-xl flex items-center gap-4 transition-all duration-300 ease-out transform hover:scale-105 backdrop-blur-sm border-l-4 ${accentColor.replace('bg-', 'border-')}`}>
      <div className={`${accentColor} rounded-full p-2 flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className={`${textColor} flex-1 font-semibold text-sm`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`${textColor} hover:opacity-50 transition-opacity flex-shrink-0 p-1 hover:bg-white/30 rounded-lg`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-6 left-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification
            {...toast}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};
