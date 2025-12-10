import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg shadow-gray-200/50 dark:shadow-none animate-slide-up max-w-sm w-full ${styles[type]}`}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-semibold flex-1">{message}</p>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
};