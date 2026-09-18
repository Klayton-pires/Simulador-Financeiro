import React from 'react';
import { Sparkles, X, ArrowRight, ShieldCheck, CreditCard, LogIn, UserPlus } from 'lucide-react';

interface ExhaustedCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  isGuest?: boolean;
}

export const ExhaustedCreditsModal: React.FC<ExhaustedCreditsModalProps> = ({
  isOpen,
  onClose,
  onOpenPlans,
  onOpenAuth,
  isGuest = true
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="exhausted-credits-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="exhausted-credits-modal-container"
        className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 font-mono relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          id="exhausted-credits-close-btn"
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {isGuest ? 'Demonstração Concluída' : 'Saldo Esgotado'}
              </span>
              <span className="text-[10px] text-slate-400">Saldo: 0 consultas</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Consultas Gratuitas Esgotadas
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Aproveitou todas as suas simulações gratuitas de demonstração! Para continuar a simular nos módulos sem limitações, escolha um plano de créditos.
            </p>
          </div>
        </div>

        {/* Step Guide Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
            Como Continuar a Simular
          </span>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 border border-emerald-500/30">
                1
              </div>
              <div className="leading-snug">
                <strong className="text-slate-100 block">Escolha o seu Plano de Créditos</strong>
                <span className="text-[11px] text-slate-400">
                  Consulte os nossos planos pré-definidos (Bronze, Prata, Ouro, Platina, Diamante) ou personalize a sua recarga a partir de 50 Kz por consulta.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 border border-indigo-500/30">
                2
              </div>
              <div className="leading-snug">
                <strong className="text-slate-100 block">Inicie Sessão ou Crie a sua Conta</strong>
                <span className="text-[11px] text-slate-400">
                  Ao escolher o plano, vincule a sua conta de cliente para receber o saldo e guardar todo o histórico das suas simulações em nuvem.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            id="exhausted-credits-buy-plan-btn"
            type="button"
            onClick={() => {
              onClose();
              onOpenPlans();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            <span>Ver e Escolher Plano de Créditos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="exhausted-credits-login-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Já Tenho Conta</span>
            </button>

            <button
              id="exhausted-credits-register-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Criar Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
