import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  RotateCcw, 
  Check, 
  Sparkles, 
  AlertCircle, 
  ArrowDownRight, 
  TrendingUp, 
  Copy, 
  Delete,
  CreditCard,
  Receipt,
  Percent,
  ChevronDown
} from 'lucide-react';
import { UserSafe } from '../types';
import { getEffectiveCountryFiscal, getAvailableCountryList } from '../data/countries';
import { canUserSimulate } from '../utils/accessControl';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';
import { parseFormattedNumber } from '../utils/numberFormat';
import { showToast } from '../context/NotificationContext';

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
  
  // Numeric string currently typed in keypad
  const [costDigits, setCostDigits] = useState<string>('1500');
  const [marginPct, setMarginPct] = useState<number>(25);
  const [customMarginOpen, setCustomMarginOpen] = useState<boolean>(false);
  const [customMarginVal, setCustomMarginVal] = useState<string>('25');
  
  const [vatEnabled, setVatEnabled] = useState<boolean>(true);
  const [vatRate, setVatRate] = useState<number>(14);
  const [tpaEnabled, setTpaEnabled] = useState<boolean>(false);
  
  const [activeInput, setActiveInput] = useState<'cost' | 'margin'>('cost');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<{
    cost: number;
    margin: number;
    grossSale: number;
    vatAmount: number;
    tpaAmount: number;
    pvpFinal: number;
    netProfit: number;
    netMarginPct: number;
    currency: string;
  } | null>(null);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin' || user?.role === 'admin_level1' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);
  const country = getEffectiveCountryFiscal(selectedCountry);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Sync default VAT on country change
  useEffect(() => {
    const c = getEffectiveCountryFiscal(selectedCountry);
    setVatRate(c.vatOptions[0]?.r || 14);
    setHasCalculated(false);
  }, [selectedCountry]);

  const formatCurrency = (val: number) => {
    return (
      new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val) + ` ${country.curr}`
    );
  };

  const handleKeyPadPress = (key: string) => {
    setErrorMessage(null);
    if (activeInput === 'cost') {
      if (key === 'C') {
        setCostDigits('0');
        setHasCalculated(false);
        return;
      }
      if (key === 'BACKSPACE') {
        setCostDigits((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
        setHasCalculated(false);
        return;
      }
      if (key === '00') {
        if (costDigits !== '0' && costDigits.length < 10) {
          setCostDigits((prev) => prev + '00');
          setHasCalculated(false);
        }
        return;
      }
      if (costDigits === '0') {
        setCostDigits(key);
      } else if (costDigits.length < 11) {
        setCostDigits((prev) => prev + key);
      }
      setHasCalculated(false);
    } else {
      // Margin edit
      if (key === 'C') {
        setCustomMarginVal('0');
        setMarginPct(0);
        setHasCalculated(false);
        return;
      }
      if (key === 'BACKSPACE') {
        const next = customMarginVal.length > 1 ? customMarginVal.slice(0, -1) : '0';
        setCustomMarginVal(next);
        setMarginPct(Math.min(99, Math.max(0, parseInt(next) || 0)));
        setHasCalculated(false);
        return;
      }
      if (key === '00') return;
      const next = customMarginVal === '0' ? key : (customMarginVal + key).slice(0, 2);
      const valNum = parseInt(next) || 0;
      if (valNum < 100) {
        setCustomMarginVal(next);
        setMarginPct(valNum);
        setHasCalculated(false);
      }
    }
  };

  const handleCalculate = async () => {
    setErrorMessage(null);
    const cost = parseFloat(costDigits) || 0;
    const margin = marginPct;
    const effectiveVat = vatEnabled ? vatRate : 0;
    const tpaPercent = tpaEnabled ? (country.tpa || 1.0) : 0;

    if (cost <= 0) {
      setErrorMessage('Introduza o preço de custo superior a zero.');
      setActiveInput('cost');
      return;
    }

    if (margin < 0 || margin >= 100) {
      setErrorMessage('Margem de lucro deve ser entre 0% e 99%.');
      return;
    }

    // Auth & credits verification
    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    setIsCalculating(true);
    try {
      let remaining = user?.queriesRemaining ?? 5;
      if (user && user.id !== 'visitante_anonimo') {
        try {
          const res = await fetch('/api/simulator/calculate-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              countryCode: selectedCountry,
              costNet: cost,
              vatRate: effectiveVat,
              tpaRate: tpaPercent,
              marginPct: margin,
              fixedFinalPrice: 0,
              productName: 'POS Mobile Calculator'
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

      // Mathematical logic
      const grossSale = margin < 100 ? cost / (1 - margin / 100) : cost;
      const vatAmount = grossSale * (effectiveVat / 100);
      const pvpFinal = grossSale + vatAmount;
      const tpaAmount = pvpFinal * (tpaPercent / 100);
      const netProfit = pvpFinal - vatAmount - tpaAmount - cost;
      const netMarginPct = pvpFinal > 0 ? (netProfit / pvpFinal) * 100 : 0;

      setResult({
        cost,
        margin,
        grossSale,
        vatAmount,
        tpaAmount,
        pvpFinal,
        netProfit,
        netMarginPct,
        currency: country.curr
      });
      setHasCalculated(true);
    } catch (e) {
      console.error(e);
      setErrorMessage('Erro ao calcular. Tente novamente.');
    } finally {
      setIsCalculating(false);
    }
  };

  const copyPvp = () => {
    if (!result) return;
    navigator.clipboard.writeText(formatCurrency(result.pvpFinal));
    showToast({
      type: 'success',
      title: 'PVP Copiado',
      message: `${formatCurrency(result.pvpFinal)} copiado para a área de transferência!`
    });
  };

  const quickMargins = [10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="w-full max-w-[360px] sm:max-w-[390px] mx-auto pb-10 select-none animate-in fade-in duration-200">
      
      {/* Outer POS Hardware Casing */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-[32px] p-3.5 sm:p-4 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        
        {/* POS Status Bar Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200">POS NANUCLOUD</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500"
            >
              {availableCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.curr})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* POS Digital LCD Screen */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-inner space-y-2.5">
          
          {/* Main Display: Custo vs Margem Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveInput('cost')}
              className={`p-2 rounded-xl text-left transition border ${
                activeInput === 'cost'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[9px] font-mono uppercase block text-slate-400">Preço de Custo</span>
              <span className="text-base sm:text-lg font-mono font-bold block truncate text-slate-100">
                {new Intl.NumberFormat('pt-PT').format(parseFloat(costDigits) || 0)} {country.curr}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInput('margin')}
              className={`p-2 rounded-xl text-left transition border ${
                activeInput === 'margin'
                  ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[9px] font-mono uppercase block text-slate-400">Margem Lucro</span>
              <span className="text-base sm:text-lg font-mono font-bold block text-indigo-400">
                {marginPct}%
              </span>
            </button>
          </div>

          {/* Quick Margin Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {quickMargins.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMarginPct(m);
                  setCustomMarginVal(String(m));
                  setHasCalculated(false);
                }}
                className={`py-1 px-2 rounded-lg text-[10px] font-mono font-bold shrink-0 transition ${
                  marginPct === m
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {m}%
              </button>
            ))}
          </div>

          {/* Quick Toggles: IVA and TPA Card Fee */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => {
                setVatEnabled(!vatEnabled);
                setHasCalculated(false);
              }}
              className={`p-1.5 rounded-lg border flex items-center justify-between transition ${
                vatEnabled
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span>IVA ({vatRate}%)</span>
              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center ${vatEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-transparent'}`}>
                ✓
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTpaEnabled(!tpaEnabled);
                setHasCalculated(false);
              }}
              className={`p-1.5 rounded-lg border flex items-center justify-between transition ${
                tpaEnabled
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span>TPA ({country.tpa || 1}%)</span>
              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center ${tpaEnabled ? 'bg-amber-500 text-white' : 'bg-slate-800 text-transparent'}`}>
                ✓
              </span>
            </button>
          </div>

          {/* Error notice if present */}
          {errorMessage && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] font-mono flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          {/* Result Block: Only shown after calculation */}
          {hasCalculated && result ? (
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-emerald-500/50 rounded-xl p-3 space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PVP Final Venda
                </span>
                <button
                  type="button"
                  onClick={copyPvp}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
                  title="Copiar PVP"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>

              <div className="text-center py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono tracking-tight">
                  {formatCurrency(result.pvpFinal)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1 border-t border-slate-800">
                <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Lucro Líquido:</span>
                  <span className="text-emerald-400 font-bold text-xs">
                    +{formatCurrency(result.netProfit)}
                  </span>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Margem Real:</span>
                  <span className="text-indigo-300 font-bold text-xs">
                    {result.netMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Only show tax deduction if active */}
              {(result.vatAmount > 0 || result.tpaAmount > 0) && (
                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5 px-1">
                  {result.vatAmount > 0 && (
                    <span>IVA ({vatRate}%): {formatCurrency(result.vatAmount)}</span>
                  )}
                  {result.tpaAmount > 0 && (
                    <span>TPA: {formatCurrency(result.tpaAmount)}</span>
                  )}
                </div>
              )}
            </div>
          ) : null}

        </div>

        {/* POS Tactile Numpad */}
        <div className="pt-3">
          <div className="grid grid-cols-4 gap-2 font-mono">
            {/* Row 1 */}
            <button
              type="button"
              onClick={() => handleKeyPadPress('7')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('8')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('9')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('BACKSPACE')}
              className="h-12 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 active:scale-95 transition flex items-center justify-center"
              title="Apagar"
            >
              <Delete className="w-5 h-5" />
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => handleKeyPadPress('4')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('5')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('6')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('C')}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 active:scale-95 transition"
            >
              LIMPAR
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => handleKeyPadPress('1')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('2')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('3')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => setActiveInput(activeInput === 'cost' ? 'margin' : 'cost')}
              className="h-12 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-700/40 active:scale-95 transition flex items-center justify-center gap-1"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>{activeInput === 'cost' ? 'MARGEM' : 'CUSTO'}</span>
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => handleKeyPadPress('0')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-lg font-bold border border-slate-800 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyPadPress('00')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-slate-100 text-sm font-bold border border-slate-800 active:scale-95 transition"
            >
              00
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={isCalculating}
              className="col-span-2 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-sm font-extrabold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isCalculating ? 'A CALCULAR...' : '= CALCULAR'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Discretely placed footer notes & legal disclaimer outside the calculator screen */}
      <footer className="mt-4 px-3 text-center text-[10px] text-slate-500 font-mono leading-tight space-y-1">
        <p>📱 Calculadora POS Otimizada para Teclado Táctil de Smartphones</p>
        <p>Aviso: Cálculos de caráter estimativo, não substituem consultoria contabilística.</p>
      </footer>

      {/* Modal for exhausted credits */}
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
