import React from 'react';
import { Calculator, X, ShieldCheck, AlertCircle } from 'lucide-react';

export interface SimulationSummaryItem {
  label: string;
  value: string;
  detail?: string;
  isHighlight?: boolean;
}

interface ConfirmSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  moduleName: string;
  summaryItems: SimulationSummaryItem[];
  userQueriesRemaining?: number;
  isStaffOrAdmin?: boolean;
  isGuest?: boolean;
  isProcessing?: boolean;
  confirmButtonText?: string;
}

export const ConfirmSimulationModal: React.FC<ConfirmSimulationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Simulação Financeira & Fiscal',
  subtitle = 'Reveja os parâmetros da operação antes de confirmar a execução do cálculo.',
  moduleName,
  summaryItems,
  userQueriesRemaining = 0,
  isStaffOrAdmin = false,
  isGuest = false,
  isProcessing = false,
  confirmButtonText = 'Confirmar & Processar Simulação'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 font-mono relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                {moduleName}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
          </div>
        </div>

        {/* Parameters Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
            Parâmetros da Simulação
          </span>
          <div className="space-y-2 divide-y divide-slate-800/60">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between gap-3 pt-2 ${
                  item.isHighlight ? 'bg-indigo-950/30 -mx-2 px-2 py-1.5 rounded-lg' : ''
                }`}
              >
                <div className="space-y-0.5">
                  <span className={`block ${item.isHighlight ? 'text-indigo-200 font-bold' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  {item.detail && (
                    <span className="text-[10px] text-slate-500 block">{item.detail}</span>
                  )}
                </div>
                <span
                  className={`text-right font-bold ${
                    item.isHighlight ? 'text-emerald-400 text-sm' : 'text-slate-200'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation Notice & Credit Requirement */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Custo desta Simulação:</span>
              <span className="font-bold text-emerald-400">1 Crédito</span>
            </div>
            <div className="text-[11px]">
              {isStaffOrAdmin ? (
                <span className="text-indigo-300 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                  Admin Ilimitado
                </span>
              ) : (
                <span className="text-slate-400">
                  Saldo Disponível: <strong className="text-emerald-300 font-bold font-mono">{userQueriesRemaining}</strong> créditos
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-indigo-300/90 text-[11px] pt-1 border-t border-slate-800/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Ao clicar no botão de confirmação, será gerado e apresentado <strong>exclusivamente o resultado solicitado</strong>.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            Cancelar / Rever Dados
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>A processar...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
