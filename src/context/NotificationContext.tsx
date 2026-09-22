import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // ms, default 4500
  createdAt: number;
}

interface NotificationContextType {
  toasts: ToastNotification[];
  showNotification: (notification: Omit<ToastNotification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper function to dispatch global toast events from anywhere in the codebase
export function showToast(params: {
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nanucloud_toast', { detail: params }));
  }
}

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    showToast({ type: 'success', message, title, duration }),
  error: (message: string, title?: string, duration?: number) =>
    showToast({ type: 'error', message, title, duration }),
  warning: (message: string, title?: string, duration?: number) =>
    showToast({ type: 'warning', message, title, duration }),
  info: (message: string, title?: string, duration?: number) =>
    showToast({ type: 'info', message, title, duration }),
};

interface ToastItemProps {
  toast: ToastNotification;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const duration = toast.duration ?? 4500;
  const [remaining, setRemaining] = useState<number>(duration);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused || remaining <= 0) return;

    const interval = 50;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= interval) {
          clearInterval(timer);
          onClose(toast.id);
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, remaining, toast.id, onClose]);

  const progressPercent = Math.max(0, Math.min(100, (remaining / duration) * 100));

  const config = {
    success: {
      bg: 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-950/40 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      bar: 'bg-emerald-400',
      defaultTitle: 'Sucesso',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    error: {
      bg: 'bg-slate-900/95 border-rose-500/50 shadow-rose-950/40 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
      bar: 'bg-rose-500',
      defaultTitle: 'Atenção / Erro',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    warning: {
      bg: 'bg-slate-900/95 border-amber-500/50 shadow-amber-950/40 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      bar: 'bg-amber-400',
      defaultTitle: 'Aviso',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    info: {
      bg: 'bg-slate-900/95 border-indigo-500/50 shadow-indigo-950/40 text-indigo-200',
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />,
      bar: 'bg-indigo-400',
      defaultTitle: 'Informação',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    }
  }[toast.type];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-right-8 ${config.bg}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 pr-2 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
              {toast.title || config.defaultTitle}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-200 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer shrink-0 -mr-1 -mt-1"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar (Auto-disappear indicator) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60">
        <div
          className={`h-full transition-all duration-75 ease-linear ${config.bar}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastNotification, 'id' | 'createdAt'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      const newToast: ToastNotification = {
        id,
        type,
        title,
        message,
        duration,
        createdAt: Date.now()
      };

      setToasts((prev) => {
        // Limit to max 4 concurrent toasts to avoid clutter
        const next = [newToast, ...prev];
        return next.slice(0, 4);
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      showNotification({ type: 'success', message, title, duration }),
    [showNotification]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      showNotification({ type: 'error', message, title, duration }),
    [showNotification]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      showNotification({ type: 'warning', message, title, duration }),
    [showNotification]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      showNotification({ type: 'info', message, title, duration }),
    [showNotification]
  );

  // Global event listener for custom events
  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: NotificationType;
        message: string;
        title?: string;
        duration?: number;
      }>;
      if (customEvent.detail && customEvent.detail.message) {
        showNotification(customEvent.detail);
      }
    };

    window.addEventListener('nanucloud_toast', handleCustomToast);
    return () => {
      window.removeEventListener('nanucloud_toast', handleCustomToast);
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showNotification,
        removeNotification,
        success,
        error,
        warning,
        info
      }}
    >
      {children}

      {/* Floating Corner Container for Notifications (Fixed Top-Right Corner) */}
      <aside
        aria-label="Notificações do Sistema"
        className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onClose={removeNotification} />
        ))}
      </aside>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const useToast = useNotification;
