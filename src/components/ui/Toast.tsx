import React, { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
  onUndo?: () => void;
}

interface ToastStore {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast) => {
    set((state) => {
      // Never show the same message twice at once
      if (state.toasts.some((t) => t.message === toast.message)) {
        return state;
      }
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      const newToasts = [...state.toasts, { ...toast, duration: toast.duration ?? 4000, id }];
      // Max 3 visible
      return { toasts: newToasts.slice(-3) };
    });
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

export function showToast(
  typeOrToast: 'success' | 'warning' | 'error' | 'info' | Omit<ToastItem, 'id'>,
  message?: string
) {
  if (typeof typeOrToast === 'string') {
    useToastStore.getState().showToast({
      type: typeOrToast,
      message: message || '',
    });
  } else {
    useToastStore.getState().showToast(typeOrToast);
  }
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastMessage: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50/90 text-amber-900',
    error: 'border-red-200 bg-red-50/90 text-red-900',
    info: 'border-sky-200 bg-sky-50/90 text-sky-900',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200 animate-in slide-in-from-bottom-2 ${borders[toast.type]}`}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <div className="flex items-center gap-2 ml-3">
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Undo
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
