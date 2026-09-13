import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/useUiStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useUiStore();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-emerald-950/80',
    error: 'border-rose-500/30 bg-rose-950/80',
    info: 'border-indigo-500/30 bg-indigo-950/80',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl text-sm text-white ${
              borderColors[toast.type] || borderColors.info
            }`}
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type] || icons.info}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
