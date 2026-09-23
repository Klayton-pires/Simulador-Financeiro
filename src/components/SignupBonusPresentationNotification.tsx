import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, ArrowRight, X } from 'lucide-react';
import { UserSafe } from '../types';

interface SignupBonusPresentationNotificationProps {
  currentUser?: UserSafe | null;
  user?: UserSafe | null;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  autoDismissSeconds?: number;
}

export const SignupBonusPresentationNotification: React.FC<SignupBonusPresentationNotificationProps> = ({
  currentUser,
  user,
  onOpenRegister,
  onOpenLogin,
  autoDismissSeconds = 12
}) => {
  const activeUser = currentUser || user;

  const [bonusCredits, setBonusCredits] = useState<number>(() => {
    const saved = localStorage.getItem('nanucloud_free_reg_credits');
    return saved ? Number(saved) : 10;
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('nanucloud_welcome_dismissed') === 'true';
  });

  // Countdown timer for automatic dismissal
  const totalDuration = autoDismissSeconds * 1000;
  const [remainingTime, setRemainingTime] = useState<number>(totalDuration);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const syncBonusCredits = async () => {
    const local = localStorage.getItem('nanucloud_free_reg_credits');
    if (local && !isNaN(Number(local))) {
      setBonusCredits(Number(local));
    }

    try {
      const res = await fetch('/api/plans/public-config');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.freeQueriesOnRegister === 'number') {
          setBonusCredits(data.freeQueriesOnRegister);
          localStorage.setItem('nanucloud_free_reg_credits', String(data.freeQueriesOnRegister));
        }
      }
    } catch {
      // fallback silencioso
    }
  };

  useEffect(() => {
    syncBonusCredits();

    const handlePlansUpdated = () => {
      syncBonusCredits();
    };

    window.addEventListener('nanucloud_plans_updated', handlePlansUpdated);
    window.addEventListener('storage', handlePlansUpdated);

    return () => {
      window.removeEventListener('nanucloud_plans_updated', handlePlansUpdated);
      window.removeEventListener('storage', handlePlansUpdated);
    };
  }, []);

  // Timer loop: decrement every 100ms and disappear when 0 is reached
  useEffect(() => {
    if (activeUser || isDismissed || isPaused) return;

    const interval = 100;
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= interval) {
          clearInterval(timer);
          setIsDismissed(true);
          sessionStorage.setItem('nanucloud_welcome_dismissed', 'true');
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeUser, isDismissed, isPaused]);

  // Se já tiver utilizador autenticado ou se tiver sido minimizado na sessão
  if (activeUser || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('nanucloud_welcome_dismissed', 'true');
  };

  const progressPercent = Math.max(0, Math.min(100, (remainingTime / totalDuration) * 100));
  const secondsLeft = Math.ceil(remainingTime / 1000);

  return (
    <aside
      aria-label="Aviso de Boas-Vindas e Bónus de Registo"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed bottom-6 right-6 z-40 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-[420px] rounded-2xl bg-gradient-to-br from-slate-900 via-[#131d36] to-slate-950 border border-indigo-500/50 p-4 sm:p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-300"
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer z-10"
        title="Ocultar notificação"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 space-y-3 pr-4">
        {/* Header line */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-indigo-400 font-semibold tracking-wide">NANUCLOUD</span>
          <span className="text-slate-500">·</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" />
            +{bonusCredits} Consultas Grátis
          </span>
        </div>

        {/* Title & Body */}
        <div>
          <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
            Plataforma de Simulação & Formação de Preços
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Cálculo de PVP a grosso e retalho, absorção logística, IVA e regimes fiscais. Crie a sua conta e ganhe <strong className="text-emerald-400 font-semibold">+{bonusCredits} consultas grátis</strong> de bónus de boas-vindas!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              handleDismiss();
              onOpenRegister();
            }}
            className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-3.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ganhar Bónus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              handleDismiss();
              onOpenLogin();
            }}
            className="w-full sm:w-auto text-xs text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition cursor-pointer text-center font-medium"
          >
            Entrar
          </button>
        </div>

        {/* Auto-disappear status info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>{isPaused ? 'Em pausa' : `Fecha em ${secondsLeft}s`}</span>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      </div>

      {/* Progress Bar (Auto-disappear indicator) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/70 overflow-hidden rounded-b-2xl">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </aside>
  );
};
