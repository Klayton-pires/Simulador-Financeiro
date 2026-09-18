import React from 'react';
import { UserSafe } from '../types';
import { canUserSimulate, isStaffOrAdmin, isClientUser } from '../utils/accessControl';
import { useGuestCredits } from '../utils/guestCredits';
import { AlertCircle, Sparkles, Lock, ArrowRight, UserPlus, LogIn, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ClientCreditNoticeBannerProps {
  user: UserSafe | null;
  moduleName?: string;
  onOpenPlans: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const ClientCreditNoticeBanner: React.FC<ClientCreditNoticeBannerProps> = ({
  user,
  moduleName = 'este simulador',
  onOpenPlans,
  onOpenAuth
}) => {
  const guestCredits = useGuestCredits();
  const check = canUserSimulate(user);

  // If user is Staff or Admin, show subtle staff badge
  if (user && isStaffOrAdmin(user.role)) {
    return (
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Sessão ativa como <strong className="text-emerald-300">{user.name}</strong> ({user.role}) — Acesso Staff / Administrador
          </span>
        </div>
        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
          Simulação Livre
        </span>
      </div>
    );
  }

  // If user is not logged in:
  if (!user) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-slate-900 to-indigo-500/15 border border-emerald-500/30 text-xs font-sans text-slate-200 mb-4 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <span>Simulador Fiscal em Tempo Real</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-bold">
                Acesso Imediato
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
              Simulações e cálculos fiscais instantâneos sem restrições. Preencha os campos e calcule em tempo real.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">Motor Fiscal Ativo</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is a client with 0 credits:
  if (isClientUser(user.role) && check.reason === 'no_credits') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-sans text-rose-200 mb-4 shadow-sm animate-in fade-in duration-150">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="font-bold text-rose-300 flex items-center gap-2 font-mono">
              <span>SEM CRÉDITOS NA CONTA (SALDO: 0)</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-200 rounded border border-rose-500/40">
                Cliente Front-End
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
              Como utilizador cliente, é obrigatório ter créditos ativos na conta para processar qualquer simulação nos módulos. Carregue o seu saldo ou subscreva um plano para desbloquear cálculos imediatos.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPlans}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-mono font-bold text-xs transition shadow-md cursor-pointer shrink-0 active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Adquirir Créditos / Planos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // If client has active credits: show positive summary pill
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 mb-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Conta de Cliente: <strong className="text-slate-200">{user.name}</strong></span>
      </div>
      <div className="flex items-center gap-2">
        <span>Saldo: <strong className="text-amber-400 font-bold">{user.queriesRemaining}</strong> consultas</span>
        <button
          type="button"
          onClick={onOpenPlans}
          className="text-indigo-400 hover:text-indigo-300 underline font-bold"
        >
          +Recarregar
        </button>
      </div>
    </div>
  );
};
