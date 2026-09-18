import React, { useState } from 'react';
import { Smartphone, Calculator, RotateCcw, Check, Sparkles, AlertCircle, ArrowDownRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { UserSafe } from '../types';
import { COUNTRIES_DB, getEffectiveCountryFiscal, getAvailableCountryList } from '../data/countries';
import { canUserSimulate } from '../utils/accessControl';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';

interface BasicPhoneMobileModeProps {
  user: UserSafe | null;
  onCalculationDone?: (newCredits: number) => void;
  onOpenPlans?: () => void;
  onOpenAuth?: () => void;
}

export const BasicPhoneMobileMode: React.FC<BasicPhoneMobileModeProps> = ({
  user,
  onCalculationDone,
  onOpenPlans,
  onOpenAuth
}) => {
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('AO');
  const [costInput, setCostInput] = useState<string>('1000');
  const [marginInput, setMarginInput] = useState<string>('20');
  const [vatRate, setVatRate] = useState<number>(14);
  const [useTpa, setUseTpa] = useState<boolean>(true);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculated snapshot state (only updated on click)
  const [calculatedState, setCalculatedState] = useState<{
    cost: number;
    margin: number;
    vatRate: number;
    tpaPercent: number;
    grossSale: number;
    vatAmount: number;
    tpaAmount: number;
    totalDeductions: number;
    pvpFinal: number;
    netProfit: number;
    netMarginPct: number;
    currency: string;
  } | null>(null);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin' || user?.role === 'admin_level1' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);
  const country = getEffectiveCountryFiscal(selectedCountry);

  const formatMoney = (val: number, curr: string = country.curr) => {
    return (
      new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val) + ` ${curr}`
    );
  };

  const handleKeyPadNumber = (num: string) => {
    setCostInput((prev) => (prev === '0' ? num : prev + num));
    setHasCalculated(false);
  };

  const handleKeyPadClear = () => {
    setCostInput('');
    setHasCalculated(false);
  };

  const handleCalculate = async () => {
    setErrorMessage(null);
    const cost = parseFloat(costInput) || 0;
    const margin = parseFloat(marginInput) || 0;
    const vat = vatRate || 0;
    const tpaPercent = useTpa ? (country.tpa || 1.0) : 0;

    if (cost <= 0) {
      setErrorMessage('Por favor introduza um Preço de Custo válido superior a zero.');
      return;
    }

    if (margin < 0 || margin >= 100) {
      setErrorMessage('A Margem de Lucro deve ser entre 0% e 99%.');
      return;
    }

    // AUTH & RBAC SIMULATION CHECK - Allows free demo credits without login
    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    setIsCalculating(true);

    try {
      let remaining = user?.queriesRemaining ?? 5;

      if (user) {
        try {
          const res = await fetch('/api/simulator/calculate-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              countryCode: selectedCountry,
              costNet: cost,
              vatRate: vat,
              tpaRate: tpaPercent,
              marginPct: margin,
              fixedFinalPrice: 0,
              productName: 'Simulação Modo Celular Básico'
            })
          });
          if (res.ok) {
            const data = await res.json();
            remaining = data.queriesRemaining;
          } else {
            remaining = Math.max(0, user.queriesRemaining - 1);
          }
        } catch {
          remaining = Math.max(0, user.queriesRemaining - 1);
        }

        if (onCalculationDone) {
          onCalculationDone(remaining);
        }
      } else {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }

      // Mathematical formulas
      const grossSale = margin < 100 ? cost / (1 - margin / 100) : cost;
      const vatAmount = grossSale * (vat / 100);
      const pvpFinal = grossSale + vatAmount;
      const tpaAmount = pvpFinal * (tpaPercent / 100);
      const totalDeductions = vatAmount + tpaAmount;
      const netProfit = pvpFinal - vatAmount - tpaAmount - cost;
      const netMarginPct = pvpFinal > 0 ? (netProfit / pvpFinal) * 100 : 0;

      setCalculatedState({
        cost,
        margin,
        vatRate: vat,
        tpaPercent,
        grossSale,
        vatAmount,
        tpaAmount,
        totalDeductions,
        pvpFinal,
        netProfit,
        netMarginPct,
        currency: country.curr
      });

      setHasCalculated(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('Ocorreu um erro ao processar o cálculo.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
      
      {/* Header Compacto */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight flex items-center gap-2">
              MODO CELULAR BÁSICO & POS
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans">
                Ultra-Rápido
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Ideal para teclados físicos, touch rápido e ecrãs pequenos</p>
          </div>
        </div>

        <select
          value={selectedCountry}
          onChange={(e) => {
            const code = e.target.value;
            setSelectedCountry(code);
            const c = getEffectiveCountryFiscal(code);
            setVatRate(c.vatOptions[0]?.r || 14);
            setHasCalculated(false);
          }}
          className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 py-1 px-2 focus:outline-none focus:border-indigo-500"
        >
          {availableCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Painel de Resultados: EXCLUSIVO APÓS CLICAR EM CALCULAR */}
      {hasCalculated && calculatedState ? (
        <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-indigo-950/70 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Resultado Apurado
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              1 Crédito Utilizado
            </span>
          </div>

          {/* PVP Final Recomendado */}
          <div className="text-center my-3 bg-slate-900/60 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
              PVP FINAL RECOMENDADO (COM IVA)
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {formatMoney(calculatedState.pvpFinal, calculatedState.currency)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Base de Incidência Comercial: {formatMoney(calculatedState.grossSale, calculatedState.currency)}
            </div>
          </div>

          {/* DEDUÇÃO & LUCRO LÍQUIDO (Conforme Solicitado pelo Usuário) */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            
            {/* Bloco 1: Deduções Fiscais e Operacionais */}
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-bold mb-2">
                <ArrowDownRight className="w-4 h-4" />
                <span>DEDUÇÕES TOTAIS</span>
              </div>
              <div className="text-lg font-bold text-rose-300 font-mono">
                - {formatMoney(calculatedState.totalDeductions, calculatedState.currency)}
              </div>
              <div className="mt-2 space-y-1 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span>Dedução IVA ({calculatedState.vatRate}%):</span>
                  <span className="text-slate-300 font-bold">{formatMoney(calculatedState.vatAmount, calculatedState.currency)}</span>
                </div>
                {calculatedState.tpaPercent > 0 && (
                  <div className="flex justify-between">
                    <span>Dedução TPA ({calculatedState.tpaPercent}%):</span>
                    <span className="text-slate-300 font-bold">{formatMoney(calculatedState.tpaAmount, calculatedState.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Lucro Líquido Real */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>LUCRO LÍQUIDO</span>
              </div>
              <div className="text-lg font-bold text-emerald-300 font-mono">
                + {formatMoney(calculatedState.netProfit, calculatedState.currency)}
              </div>
              <div className="mt-2 space-y-1 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span>Margem Líquida Real:</span>
                  <span className="text-emerald-400 font-bold">{calculatedState.netMarginPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo Base:</span>
                  <span className="text-slate-300 font-bold">{formatMoney(calculatedState.cost, calculatedState.currency)}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Simulação apurada com sucesso</span>
            <button
              type="button"
              onClick={() => setHasCalculated(false)}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-bold underline"
            >
              Ajustar Parâmetros
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#1E293B]/60 border border-dashed border-slate-700 rounded-2xl p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 font-mono">Simulador Aguardando Cálculo</h3>
          <p className="text-xs text-slate-400 font-mono max-w-xs mx-auto">
            Defina o custo e a margem abaixo e clique em <strong>"Calcular Simulação"</strong> para apurar o PVP, as deduções e o lucro líquido.
          </p>
        </div>
      )}

      {/* Quick Input Controls */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 space-y-4">
        
        {/* Preço de Custo */}
        <div>
          <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5 flex justify-between">
            <span>PREÇO DE CUSTO BASE ({country.curr})</span>
            <span className="text-[10px] text-indigo-400">Insira ou use o teclado</span>
          </label>
          <input
            type="number"
            value={costInput}
            onChange={(e) => {
              setCostInput(e.target.value);
              setHasCalculated(false);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white text-center focus:border-emerald-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>

        {/* Quick Margin Selector Buttons */}
        <div>
          <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5">
            MARGEM DE LUCRO DESEJADA (%)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 30, 40].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMarginInput(String(m));
                  setHasCalculated(false);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  marginInput === String(m)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                {m}%
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tax & TPA Toggle */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">REGIME DE IVA</label>
            <select
              value={vatRate}
              onChange={(e) => {
                setVatRate(Number(e.target.value));
                setHasCalculated(false);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 py-2 px-2 focus:outline-none focus:border-indigo-500"
            >
              {country.vatOptions.map((opt, i) => (
                <option key={i} value={opt.r}>
                  {opt.n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">TAXA TPA ({country.tpa}%)</label>
            <button
              type="button"
              onClick={() => {
                setUseTpa(!useTpa);
                setHasCalculated(false);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                useTpa
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {useTpa ? <Check className="w-3.5 h-3.5" /> : null}
              {useTpa ? 'Ativo (1%)' : 'Sem TPA'}
            </button>
          </div>
        </div>

        {/* Virtual On-Screen Numpad for Touch / Analog simulation */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400">TECLADO NUMÉRICO RÁPIDO</span>
            <button
              type="button"
              onClick={handleKeyPadClear}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 font-mono">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '000'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPadNumber(digit)}
                className="h-11 bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-base font-bold rounded-xl border border-slate-700/80 active:scale-95 transition-all flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
          </div>
        </div>

        {/* BOTÃO PRINCIPAL DE CALCULAR (OBRIGATÓRIO PARA DEBITAR CRÉDITO & APRESENTAR RESULTADOS) */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-xl text-sm font-mono font-bold transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" />
          <span>{isCalculating ? 'A Calcular Simulação...' : 'CALCULAR SIMULAÇÃO'}</span>
        </button>

      </div>

      {/* Lembrete de Apoio & Aviso Legal Oficial */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-[10px] text-slate-400 font-mono leading-relaxed">
        <strong>Aviso Legal Nanucloud:</strong> A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.
      </div>

      {/* Exhausted Credits Modal - Prompts user to buy plan, then login */}
      <ExhaustedCreditsModal
        isOpen={showExhaustedModal}
        onClose={() => setShowExhaustedModal(false)}
        onOpenPlans={onOpenPlans || (() => {})}
        onOpenAuth={onOpenAuth || (() => {})}
        isGuest={!user}
      />
    </div>
  );
};
