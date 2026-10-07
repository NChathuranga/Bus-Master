import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
    error: 'bg-rose-900/90 border-rose-500/50 text-rose-100',
    info: 'bg-blue-900/90 border-blue-500/50 text-blue-100',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] animate-bounce-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl min-w-[280px] max-w-md ${bgColors[type] || bgColors.success}`}>
        {icons[type] || icons.success}
        <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug">{message}</span>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
