import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { UserSafe } from '../types';

interface SignupBonusPresentationNotificationProps {
  currentUser: UserSafe | null;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const SignupBonusPresentationNotification: React.FC<SignupBonusPresentationNotificationProps> = ({
  currentUser,
  onOpenRegister,
  onOpenLogin
}) => {
  const [bonusCredits, setBonusCredits] = useState<number>(() => {
    const saved = localStorage.getItem('nanucloud_free_reg_credits');
    return saved ? Number(saved) : 10;
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('nanucloud_welcome_dismissed') === 'true';
  });

  const syncBonusCredits = async () => {
    // 1. Ler de localStorage (se admin alterou localmente)
    const local = localStorage.getItem('nanucloud_free_reg_credits');
    if (local && !isNaN(Number(local))) {
      setBonusCredits(Number(local));
    }

    // 2. Sincronizar com o servidor
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

  // Se já tiver utilizador autenticado ou se tiver sido minimizado na sessão
  if (currentUser || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('nanucloud_welcome_dismissed', 'true');
  };

  return (
    <div className="relative overflow-hidden mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
        title="Ocultar notificação"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10 pr-6">
        {/* Left: Presentation & Tool Overview */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Apresentação da Ferramenta NANUCLOUD
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              BÓNUS DE INSCRIÇÃO ATIVO
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Plataforma Oficial de Simulação Fiscal, Comércio Local & Despacho Aduaneiro
          </h3>

          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            Formação precisa de preços de venda a grosso e a retalho com absorção de custos logísticos, cálculo de IVA, retenção na fonte, TPA e Imposto Industrial.
            <strong className="text-amber-300 block mt-1">
              Nota: As consultas exigem registo na plataforma. Registe-se agora para receber o seu bónus exclusivo!
            </strong>
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Preço com e sem impostos
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cálculo Grosso vs Retalho
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Encriptação e Segurança de Dados
            </span>
          </div>
        </div>

        {/* Right: Marketing Signup Bonus Call-to-Action */}
        <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 shrink-0 lg:w-72">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Bónus de Boas-Vindas</span>
          </div>

          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
              +{bonusCredits}
            </span>
            <span className="text-xs text-slate-300 font-bold uppercase">
              Consultas Grátis
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Ao criar a sua conta de utilizador hoje, obtém automaticamente <strong className="text-slate-100 font-bold">{bonusCredits} consultas de bónus</strong> pré-definidas para simulações completas.
          </p>

          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inscrever & Ganhar Bónus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full text-[11px] font-mono text-slate-400 hover:text-slate-200 py-1 transition cursor-pointer"
            >
              Já tenho conta? <span className="text-indigo-400 underline">Iniciar Sessão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
