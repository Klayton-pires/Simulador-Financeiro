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
  ChevronDown,
  ShieldCheck,
  Building2,
  FileCheck2
} from 'lucide-react';
import { UserSafe } from '../types';
import { getEffectiveCountryFiscal, getAvailableCountryList } from '../data/countries';
import { canUserSimulate } from '../utils/accessControl';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';
import { ConfirmSimulationModal, SimulationSummaryItem } from './ConfirmSimulationModal';
import { showToast } from '../context/NotificationContext';
import { parseFormattedNumber, formatPtNumber } from '../utils/numberFormat';

export type VatRegimeType = 'geral' | 'simplificado' | 'cesta_basica' | 'isento';
export type IndustrialTaxRegimeType = 'geral' | 'simplificado' | 'agro' | 'isento';

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
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('AO');
  
  // Numeric string currently typed in keypad
  const [costDigits, setCostDigits] = useState<string>('1500');
  const [marginPct, setMarginPct] = useState<number>(25);
  const [customMarginVal, setCustomMarginVal] = useState<string>('25');
  
  // Regimes de IVA (Angola e Fiscais)
  const [vatRegime, setVatRegime] = useState<VatRegimeType>('geral');
  
  // Regimes de Imposto Industrial (Angola: Geral 25%, Simplificado 6.5%, Agro 10%, Isento 0%)
  const [iiRegime, setIiRegime] = useState<IndustrialTaxRegimeType>('geral');
  
  // TPA Terminal Pagamento Automático (Multicaixa / Cartão) - Taxa Personalizável
  const [tpaEnabled, setTpaEnabled] = useState<boolean>(false);
  const [tpaRate, setTpaRate] = useState<string>('1.0');
  
  const [activeInput, setActiveInput] = useState<'cost' | 'margin'>('cost');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state - ONLY the exact simulation requested by the client
  const [result, setResult] = useState<{
    cost: number;
    margin: number;
    grossSale: number;
    vatRate: number;
    vatRegimeLabel: string;
    vatAmount: number;
    tpaRate: number;
    tpaAmount: number;
    operatingProfit: number;
    iiRate: number;
    iiRegimeLabel: string;
    iiAmount: number;
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

  const getEffectiveVatRate = (regime: VatRegimeType): number => {
    switch (regime) {
      case 'geral':
        return selectedCountry === 'PT' ? 23 : 14;
      case 'simplificado':
        return 7;
      case 'cesta_basica':
        return 5;
      case 'isento':
      default:
        return 0;
    }
  };

  const getEffectiveIiRate = (regime: IndustrialTaxRegimeType): number => {
    switch (regime) {
      case 'geral':
        return selectedCountry === 'PT' ? 21 : 25;
      case 'simplificado':
        return 6.5;
      case 'agro':
        return 10;
      case 'isento':
      default:
        return 0;
    }
  };

  const getVatLabel = (regime: VatRegimeType): string => {
    switch (regime) {
      case 'geral':
        return `Geral (${getEffectiveVatRate('geral')}%)`;
      case 'simplificado':
        return 'Simplificado (7%)';
      case 'cesta_basica':
        return 'Cesta Básica (5%)';
      case 'isento':
        return 'Isento (0%)';
    }
  };

  const getIiLabel = (regime: IndustrialTaxRegimeType): string => {
    switch (regime) {
      case 'geral':
        return `II Geral (${getEffectiveIiRate('geral')}%)`;
      case 'simplificado':
        return 'II Retenção / Simpl. (6.5%)';
      case 'agro':
        return 'II Agro (10%)';
      case 'isento':
        return 'II Isento (0%)';
    }
  };

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
      if (key === ',' || key === '.') {
        if (!costDigits.includes(',') && !costDigits.includes('.')) {
          setCostDigits((prev) => (prev === '0' || !prev ? '0,' : prev + ','));
          setHasCalculated(false);
        }
        return;
      }
      if (costDigits === '0') {
        setCostDigits(key);
      } else if (costDigits.length < 12) {
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
        setMarginPct(Math.min(99.9, Math.max(0, parseFormattedNumber(next) || 0)));
        setHasCalculated(false);
        return;
      }
      if (key === '00') return;
      if (key === ',' || key === '.') {
        if (!customMarginVal.includes(',') && !customMarginVal.includes('.')) {
          const next = (customMarginVal === '0' || !customMarginVal) ? '0,' : customMarginVal + ',';
          setCustomMarginVal(next);
          setMarginPct(parseFormattedNumber(next));
          setHasCalculated(false);
        }
        return;
      }
      const next = customMarginVal === '0' ? key : (customMarginVal + key);
      const valNum = parseFormattedNumber(next);
      if (valNum < 100) {
        setCustomMarginVal(next);
        setMarginPct(valNum);
        setHasCalculated(false);
      }
    }
  };

  // Step 1: User requests simulation -> validates & checks credits -> opens confirmation modal
  const handleRequestCalculate = () => {
    setErrorMessage(null);
    const cost = parseFormattedNumber(costDigits);
    const margin = marginPct;

    if (cost <= 0) {
      setErrorMessage('Introduza o preço de custo superior a zero.');
      setActiveInput('cost');
      return;
    }

    if (margin < 0 || margin >= 100) {
      setErrorMessage('Margem de lucro deve situar-se entre 0% e 99%.');
      return;
    }

    // STRICT CREDIT CHECK: não se faz simulação sem credito
    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      showToast({
        type: 'warning',
        title: 'Sem Créditos',
        message: simCheck.message
      });
      setShowExhaustedModal(true);
      return;
    }

    // Open Confirmation Dialog
    setShowConfirmModal(true);
  };

  // Step 2: User confirms in the modal -> executes and displays ONLY the requested simulation
  const handleConfirmAndProcess = async () => {
    setShowConfirmModal(false);
    setIsCalculating(true);
    setErrorMessage(null);

    const cost = parseFormattedNumber(costDigits);
    const margin = marginPct;
    const effectiveVat = getEffectiveVatRate(vatRegime);
    const effectiveIi = getEffectiveIiRate(iiRegime);
    const tpaPercent = tpaEnabled ? parseFormattedNumber(tpaRate) : 0;

    try {
      let remaining = user?.queriesRemaining ?? 0;
      if (user && user.id !== 'visitante_anonimo') {
        try {
          const res = await fetch('/api/simulator/calculate-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              countryCode: selectedCountry,
              costNet: cost,
              vatRate: effectiveVat,
              tpaRate: tpaPercent,
              marginPct: margin,
              fixedFinalPrice: 0,
              productName: `POS Venda (${country.curr})`
            })
          });
          if (res.ok) {
            const data = await res.json();
            remaining = data.queriesRemaining;
          } else if (res.status === 402) {
            setErrorMessage('Créditos esgotados. Por favor adquira um plano.');
            setShowExhaustedModal(true);
            setIsCalculating(false);
            return;
          } else {
            remaining = Math.max(0, (user.queriesRemaining || 1) - 1);
          }
        } catch {
          remaining = Math.max(0, (user.queriesRemaining || 1) - 1);
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

      // Mathematical logic for retail commerce
      const grossSale = margin < 100 ? cost / (1 - margin / 100) : cost;
      const vatAmount = grossSale * (effectiveVat / 100);
      const pvpFinal = grossSale + vatAmount;
      const tpaAmount = pvpFinal * (tpaPercent / 100);

      // Lucro Operacional (Margem Comercial após encargos de pagamento)
      const operatingProfit = grossSale - cost - tpaAmount;

      // Imposto Industrial (II): 25% sobre o lucro operacional, ou 6.5% sobre vendas no simplificado
      let iiAmount = 0;
      if (iiRegime === 'simplificado') {
        iiAmount = grossSale * (effectiveIi / 100);
      } else if (iiRegime !== 'isento' && operatingProfit > 0) {
        iiAmount = operatingProfit * (effectiveIi / 100);
      }

      // Lucro Líquido Real Final no Bolso
      const netProfit = operatingProfit - iiAmount;
      const netMarginPct = pvpFinal > 0 ? (netProfit / pvpFinal) * 100 : 0;

      // Store ONLY the requested simulation result
      setResult({
        cost,
        margin,
        grossSale,
        vatRate: effectiveVat,
        vatRegimeLabel: getVatLabel(vatRegime),
        vatAmount,
        tpaRate: tpaPercent,
        tpaAmount,
        operatingProfit,
        iiRate: effectiveIi,
        iiRegimeLabel: getIiLabel(iiRegime),
        iiAmount,
        pvpFinal,
        netProfit,
        netMarginPct,
        currency: country.curr
      });

      setHasCalculated(true);
      showToast({
        type: 'success',
        title: 'Venda Apurada com Sucesso',
        message: `PVP Final: ${formatCurrency(pvpFinal)} | Lucro Líquido: ${formatCurrency(netProfit)}`
      });
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

  const currentCostNum = parseFormattedNumber(costDigits);
  const simulationSummaryItems: SimulationSummaryItem[] = [
    {
      label: 'Preço de Custo (Mercadoria)',
      value: formatCurrency(currentCostNum),
      detail: 'Base de aquisição direta'
    },
    {
      label: 'Margem Comercial Desejada',
      value: `+${marginPct}%`,
      isHighlight: true
    },
    {
      label: 'Enquadramento IVA (Angola)',
      value: getVatLabel(vatRegime),
      detail: vatRegime === 'isento' ? 'Isenção de IVA' : `Taxa de ${getEffectiveVatRate(vatRegime)}%`
    },
    {
      label: 'Regime Imposto Industrial (II)',
      value: getIiLabel(iiRegime),
      detail: iiRegime === 'simplificado' ? '6.5% sobre faturação' : iiRegime === 'isento' ? 'Isenção de II' : `${getEffectiveIiRate(iiRegime)}% sobre o lucro`
    },
    {
      label: 'Taxa Terminal TPA / Multicaixa',
      value: tpaEnabled ? `${tpaRate}% (Personalizado)` : 'Desativado (0%)'
    }
  ];

  return (
    <div className="w-full max-w-[390px] sm:max-w-[420px] mx-auto pb-10 select-none animate-in fade-in duration-200">
      
      {/* Outer POS Hardware Casing */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-[32px] p-3.5 sm:p-4 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        
        {/* POS Status Bar Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200">POS NANUCLOUD FISCAL</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              {user ? (user.queriesRemaining || 0) : getGuestCredits()} créditos
            </span>
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
                {costDigits || '0'} {country.curr}
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

          {/* 1. REGIMES DE IVA DE ANGOLA (0%, 5%, 7% e 14%) */}
          <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="uppercase tracking-wider text-slate-400 font-bold">
                Regimes de IVA (Angola):
              </span>
              <span className="text-indigo-400 font-bold">
                {getEffectiveVatRate(vatRegime)}% selecionado
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
              {/* Regime 0% (Isento / Exclusão) */}
              <button
                type="button"
                onClick={() => {
                  setVatRegime('isento');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition cursor-pointer ${
                  vatRegime === 'isento'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Regime de Isenção / Exclusão (0% - Art. 12º CIVA)"
              >
                Isento 0%
              </button>

              {/* Regime 5% (Cesta Básica) */}
              <button
                type="button"
                onClick={() => {
                  setVatRegime('cesta_basica');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition cursor-pointer ${
                  vatRegime === 'cesta_basica'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Taxa Reduzida Cesta Básica (5% - Lei 17/23)"
              >
                Básica 5%
              </button>

              {/* Regime 7% (Simplificado) */}
              <button
                type="button"
                onClick={() => {
                  setVatRegime('simplificado');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition cursor-pointer ${
                  vatRegime === 'simplificado'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Regime Simplificado de IVA (7% - Art. 53º CIVA)"
              >
                Simpl. 7%
              </button>

              {/* Regime 14% (Geral) */}
              <button
                type="button"
                onClick={() => {
                  setVatRegime('geral');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition cursor-pointer ${
                  vatRegime === 'geral'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Regime Geral de IVA (14% - Art. 12º CIVA)"
              >
                Geral 14%
              </button>
            </div>
          </div>

          {/* 2. REGIMES DE IMPOSTO INDUSTRIAL (II Geral 25%, Simplificado 6.5%, Agro 10%, Isento) */}
          <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Imposto Industrial (II):
            </span>
            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setIiRegime('geral');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition ${
                  iiRegime === 'geral'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Regime Geral do Imposto Industrial (25% sobre o lucro)"
              >
                II 25%
              </button>

              <button
                type="button"
                onClick={() => {
                  setIiRegime('simplificado');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition ${
                  iiRegime === 'simplificado'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Regime Simplificado / Retenção (6.5% s/ vendas)"
              >
                II 6.5%
              </button>

              <button
                type="button"
                onClick={() => {
                  setIiRegime('agro');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition ${
                  iiRegime === 'agro'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Setor Agro-pecuário (10%)"
              >
                Agro 10%
              </button>

              <button
                type="button"
                onClick={() => {
                  setIiRegime('isento');
                  setHasCalculated(false);
                }}
                className={`py-1 px-1 rounded text-center truncate border transition ${
                  iiRegime === 'isento'
                    ? 'bg-slate-700 text-white border-slate-600 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Isento de Imposto Industrial (0%)"
              >
                Isento
              </button>
            </div>
          </div>

          {/* 3. TPA Multicaixa / Taxa de Cartão - Taxa Totalmente Personalizável */}
          <div className="pt-1.5 border-t border-slate-800 space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setTpaEnabled(!tpaEnabled);
                  setHasCalculated(false);
                }}
                className={`p-1.5 rounded-lg border flex items-center justify-between transition cursor-pointer flex-1 mr-2 ${
                  tpaEnabled
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>Terminal TPA Multicaixa</span>
                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-xs font-bold ${tpaEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-transparent'}`}>
                  ✓
                </span>
              </button>

              {/* Taxa Personalizada do TPA */}
              {tpaEnabled && (
                <div className="flex items-center gap-1 bg-slate-950 border border-amber-500/30 rounded-lg px-2 py-1">
                  <span className="text-[9px] text-amber-400 font-bold uppercase">Taxa:</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="20"
                    value={tpaRate}
                    onChange={(e) => {
                      setTpaRate(e.target.value);
                      setHasCalculated(false);
                    }}
                    className="w-12 bg-transparent text-amber-300 font-bold text-center outline-none text-xs"
                    title="Defina a taxa negociada com o banco / EMIS (Ex: 1.0%, 1.2%, 1.5%)"
                  />
                  <span className="text-amber-400 font-bold">%</span>
                </div>
              )}
            </div>

            {/* Quick TPA presets if enabled */}
            {tpaEnabled && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Predefinições:</span>
                {['0.5', '1.0', '1.2', '1.5', '2.0'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTpaRate(preset);
                      setHasCalculated(false);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 transition cursor-pointer ${
                      tpaRate === preset
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error notice if present */}
          {errorMessage && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] font-mono flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          {/* Result Block: Only shown after confirmed calculation - Shows ONLY the requested simulation */}
          {hasCalculated && result ? (
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-emerald-500/60 rounded-xl p-3 space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PVP Final de Venda
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

              {/* Big PVP Display */}
              <div className="text-center py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/40">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono tracking-tight">
                  {formatCurrency(result.pvpFinal)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Preço Base (Sem IVA): {formatCurrency(result.grossSale)}
                </div>
              </div>

              {/* Breakdown: IVA and Industrial Tax */}
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">IVA ({result.vatRegimeLabel}):</span>
                  <span className="text-indigo-300 font-bold">+{formatCurrency(result.vatAmount)}</span>
                </div>
                {result.tpaAmount > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">TPA ({result.tpaRate}%):</span>
                    <span className="text-amber-400 font-bold">-{formatCurrency(result.tpaAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300 pt-0.5 border-t border-slate-800">
                  <span className="text-slate-400">Imposto Industrial ({result.iiRegimeLabel}):</span>
                  <span className="text-rose-400 font-bold">-{formatCurrency(result.iiAmount)}</span>
                </div>
              </div>

              {/* Profit & Net Margin (LUCRO LÍQUIDO REAL) */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1 border-t border-slate-800">
                <div className="bg-slate-950/90 p-1.5 rounded border border-emerald-500/30">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Lucro Líquido Real:</span>
                  <span className="text-emerald-400 font-extrabold text-xs block truncate">
                    +{formatCurrency(result.netProfit)}
                  </span>
                </div>
                <div className="bg-slate-950/90 p-1.5 rounded border border-indigo-500/30">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Margem Real:</span>
                  <span className="text-indigo-300 font-extrabold text-xs block">
                    {result.netMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
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
              className="h-12 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 active:scale-95 transition flex items-center justify-center cursor-pointer"
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
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 active:scale-95 transition cursor-pointer"
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
              className="h-12 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-700/40 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
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
              onClick={() => handleKeyPadPress(',')}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-amber-400 text-xl font-bold border border-slate-800 active:scale-95 transition flex items-center justify-center cursor-pointer"
              title="Separador Decimal (,)"
            >
              ,
            </button>
            
            {/* CALCULATE & CONFIRM BUTTON */}
            <button
              type="button"
              onClick={handleRequestCalculate}
              disabled={isCalculating}
              className="col-span-2 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-extrabold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Receipt className="w-4 h-4" />
              <span>{isCalculating ? 'A CALCULAR...' : '= CONFIRMAR & CALCULAR'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Notes */}
      <footer className="mt-4 px-3 text-center text-[10px] text-slate-500 font-mono leading-tight space-y-1">
        <p>📱 Terminal POS Fiscal Nanucloud — Regimes de IVA e Imposto Industrial de Angola</p>
        <p>Aviso: Cálculos de caráter estimativo e de formação de preço.</p>
      </footer>

      {/* Confirmation Modal before executing simulation in POS */}
      <ConfirmSimulationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndProcess}
        moduleName="POS / Ponto de Venda & Caixa"
        title="Confirmar Simulação de Venda POS"
        subtitle="Verifique os parâmetros fiscais e custo antes de processar a simulação."
        summaryItems={simulationSummaryItems}
        userQueriesRemaining={user ? (user.queriesRemaining || 0) : getGuestCredits()}
        isStaffOrAdmin={isSuperAdmin}
        isGuest={!user}
        isProcessing={isCalculating}
        confirmButtonText="Confirmar Simulação POS"
      />

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
