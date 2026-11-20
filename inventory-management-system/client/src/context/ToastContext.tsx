import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface ToastContextValue {
  showToast: (type: 'success' | 'error', message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-4 z-50 flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 bg-white border border-[#E5E7EB] rounded-xl shadow-card px-4 py-3"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <p className="text-sm text-[#111827] flex-1 min-w-0 break-words leading-snug">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="w-9 h-9 sm:w-auto sm:h-auto -mr-1.5 -mt-1 sm:m-0 flex items-center justify-center shrink-0 text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
