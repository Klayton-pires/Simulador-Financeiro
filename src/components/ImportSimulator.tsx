import React, { useState } from 'react';
import { UserSafe } from '../types';
import { COUNTRIES_DB, getEffectiveCountryFiscal, getAvailableCountryList } from '../data/countries';
import { SupportedLang, TRANSLATIONS } from '../i18n/translations';
import {
  Ship,
  Lock,
  Sparkles,
  Anchor,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Download,
  FileText,
  FileSpreadsheet,
  SlidersHorizontal
} from 'lucide-react';
import {
  exportSimulationDossierPDF,
  exportSimulationDossierExcel
} from '../utils/exportDocumentUtils';
import { isStaffOrAdmin, canUserSimulate } from '../utils/accessControl';
import { ClientCreditNoticeBanner } from './ClientCreditNoticeBanner';
import { ConfirmSimulationModal, SimulationSummaryItem } from './ConfirmSimulationModal';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';
import { NumericInput } from './common/NumericInput';
import { parseFormattedNumber } from '../utils/numberFormat';

interface ImportSimulatorProps {
  user: UserSafe | null;
  currentLang: SupportedLang;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onCalculationDone: (newCredits: number) => void;
}

export const ImportSimulator: React.FC<ImportSimulatorProps> = ({
  user,
  currentLang,
  onOpenPlans,
  onOpenAuth,
  onCalculationDone
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);

  const isStaff = isStaffOrAdmin(user?.role);
  const isUnlocked = isStaff || !user || user?.id === 'visitante_anonimo' || Boolean(user?.isImportUnlocked || user?.activePlanId || (user?.queriesRemaining && user.queriesRemaining > 0));

  const [originCountry, setOriginCountry] = useState<string>('CN');
  const [destCountry, setDestCountry] = useState<string>('AO');
  const [vatRate, setVatRate] = useState<number>(14);

  const [fob, setFob] = useState<string>('');
  const [freight, setFreight] = useState<string>('');
  const [insurance, setInsurance] = useState<string>('');
  const [customsRate, setCustomsRate] = useState<string>('');
  const [iecRate, setIecRate] = useState<string>('');
  const [otherFees, setOtherFees] = useState<string>('');
  const [marginPct, setMarginPct] = useState<string>('25');
  const [tpaRate, setTpaRate] = useState<string>('0');
  const [productName, setProductName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [results, setResults] = useState<any | null>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin' || user?.role === 'admin_level1' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);
  const destFiscal = getEffectiveCountryFiscal(destCountry);

  const formatMoney = (val: number) => {
    return (
      new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val) + ` ${destFiscal.curr}`
    );
  };

  const handleRequestCalculate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cFob = parseFormattedNumber(fob);
    if (cFob <= 0) {
      setErrorMessage('O valor FOB (Mercadoria) deve ser superior a zero.');
      return;
    }

    if (!isUnlocked) {
      setErrorMessage('O módulo de importação requer um plano compatível ou desbloqueio de créditos.');
      onOpenPlans();
      return;
    }

    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    // Direct calculation without blocking confirmation modal
    handleConfirmAndExecute();
  };

  const handleConfirmAndExecute = async () => {
    setIsCalculating(true);

    try {
      const cFob = parseFormattedNumber(fob);
      let remaining = user?.queriesRemaining || 0;
      let calcData = null;

      try {
        const res = await fetch('/api/simulator/calculate-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originCountry,
            destCountry,
            fob: cFob,
            freight: parseFormattedNumber(freight),
            insurance: parseFormattedNumber(insurance),
            customsRate: parseFormattedNumber(customsRate),
            iecRate: parseFormattedNumber(iecRate),
            otherFees: parseFormattedNumber(otherFees),
            vatRate,
            marginPct: parseFormattedNumber(marginPct),
            productName,
            notes
          })
        });

        if (res.ok) {
          const data = await res.json();
          calcData = data.calculation;
          remaining = data.queriesRemaining;
        } else if (res.status === 403 || res.status === 402) {
          const data = await res.json();
          setErrorMessage(data.error);
          onOpenPlans();
          setIsCalculating(false);
          setShowConfirmModal(false);
          return;
        }
      } catch (apiErr) {
        console.warn('Modo offline/estático ativado para cálculo de importação...');
      }

      if (!calcData) {
        const cFreight = parseFormattedNumber(freight);
        const cIns = parseFormattedNumber(insurance);
        const cCustRate = parseFormattedNumber(customsRate);
        const cIecRate = parseFormattedNumber(iecRate);
        const cOther = parseFormattedNumber(otherFees);
        const cMargin = parseFormattedNumber(marginPct);

        const cif = cFob + cFreight + cIns;
        const customsDuty = cif * (cCustRate / 100);
        const iecTax = cif * (cIecRate / 100);
        const nationalizedCostNet = cif + customsDuty + iecTax + cOther;

        const profit = nationalizedCostNet * (cMargin / 100);
        const pvpBase = nationalizedCostNet + profit;
        const vatSale = pvpBase * (vatRate / 100);
        const pvpFinal = pvpBase + vatSale;

        const vatCost = nationalizedCostNet * (vatRate / 100);
        const netVatToPay = Math.max(0, vatSale - vatCost);
        const cTpa = parseFormattedNumber(tpaRate);
        const tpaCost = pvpFinal * (cTpa / 100);
        const industrialTaxRate = destFiscal.ii || 25;
        const operatingProfit = profit - tpaCost;
        const incomeTax = operatingProfit > 0 ? operatingProfit * (industrialTaxRate / 100) : 0;
        const netProfit = operatingProfit - incomeTax;

        calcData = {
          originCountry,
          destCountry,
          productName,
          fob: cFob,
          freight: cFreight,
          insurance: cIns,
          cif,
          customsRate: cCustRate,
          customsDuty,
          iecRate: cIecRate,
          iecTax,
          otherFees: cOther,
          nationalizedCostNet,
          marginPct: cMargin,
          profit,
          pvpBase,
          vatSale,
          pvpFinal,
          netVatToPay,
          tpaCost,
          incomeTax,
          netProfit,
          landedCost: nationalizedCostNet,
          recommendedPVP: pvpFinal,
          estimatedProfit: netProfit,
          currency: destFiscal.curr
        };
        remaining = Math.max(0, (user?.queriesRemaining || 1) - 1);
      }

      setResults(calcData);
      setShowConfirmModal(false);
      setSuccessMessage('Cálculo de importação e despacho aduaneiro apurado com sucesso!');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      if (user && user.id !== 'visitante_anonimo') {
        onCalculationDone(remaining);
      } else {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Falha ao calcular importação.');
    } finally {
      setIsCalculating(false);
    }
  };

  const cFob = parseFormattedNumber(fob);
  const cFreight = parseFormattedNumber(freight);
  const cIns = parseFormattedNumber(insurance);
  const cOther = parseFormattedNumber(otherFees);

  const simulationSummaryItems: SimulationSummaryItem[] = [
    {
      label: 'Valor FOB Mercadoria',
      value: formatMoney(cFob),
      detail: `Origem: ${originCountry} → Destino: ${destFiscal.name}`,
      isHighlight: true
    },
    {
      label: 'Logística Internacional CIF',
      value: formatMoney(cFob + cFreight + cIns),
      detail: `Frete: ${formatMoney(cFreight)} | Seguro: ${formatMoney(cIns)}`
    },
    {
      label: 'Taxas & Direitos Aduaneiros',
      value: `Tarifa: ${customsRate}% | IEC: ${iecRate}%`,
      detail: `Outras Despesas: ${formatMoney(cOther)} | IVA: ${vatRate}%`
    },
    {
      label: 'Margem Pretendida',
      value: `${marginPct}%`,
      detail: `Taxa TPA/Banco: ${tpaRate}%`
    }
  ];

  const handleExportPDF = () => {
    if (!results) return;

    exportSimulationDossierPDF({
      title: `Dossiê de Importação & Despacho - ${productName || 'Mercadoria Internacional'}`,
      moduleName: 'Comércio Internacional & Importação',
      user: user,
      country: destFiscal,
      inputFields: [
        { label: 'País de Origem', value: originCountry, description: 'Procedência da carga' },
        { label: 'País de Destino / Alfândega', value: `${destFiscal.name} (${destFiscal.agency})`, description: 'Desembaraço aduaneiro' },
        { label: 'Valor da Carga (FOB)', value: formatMoney(results.fob || 0), description: 'Preço no porto de embarque' },
        { label: 'Frete Internacional', value: formatMoney(results.freight || 0), description: 'Transporte marítimo/aéreo' },
        { label: 'Seguro da Carga', value: formatMoney(results.insurance || 0), description: 'Apólice de seguro CIF' },
        { label: 'Direitos Aduaneiros (Tarifa)', value: `${customsRate || 0}%`, description: 'Pauta Aduaneira' },
        { label: 'Imposto Especial de Consumo (IEC)', value: `${iecRate || 0}%`, description: 'Incidência de consumo' }
      ],
      calculatedFields: [
        { label: 'Valor Aduaneiro Internacional (CIF)', amount: results.cif || 0, rateOrMargin: 'CIF', fiscalDestiny: 'Origem + Frete + Seguro' },
        { label: 'Direitos Aduaneiros Liquidados', amount: results.customsDuty || 0, rateOrMargin: `${customsRate}%`, isDeduction: false, fiscalDestiny: 'Alfândega / Fisco' },
        { label: 'Imposto Especial de Consumo (IEC)', amount: results.iec || results.iecTax || 0, rateOrMargin: `${iecRate}%`, isDeduction: false, fiscalDestiny: 'Tributos Aduaneiros' },
        { label: 'CUSTO BASE NACIONALIZADO (Sem IVA)', amount: results.nationalizedCostNet || results.landedCost || 0, rateOrMargin: 'Nacionalizado', isFinalHighlight: false, fiscalDestiny: 'Custo de Entrada em Armazém' },
        { label: 'PREÇO BASE DE VENDA (SEM IVA)', amount: results.pvpBase || 0, rateOrMargin: 'Subtotal Líquido', isFinalHighlight: false, fiscalDestiny: 'Receita Líquida' },
        { label: 'IVA Aduaneiro e de Venda', amount: results.vatSale || results.vat || 0, rateOrMargin: `${vatRate}%`, fiscalDestiny: destFiscal.agency },
        { label: 'PREÇO TOTAL FATURADO (PVP COM IVA)', amount: results.pvpFinal || results.recommendedPVP || 0, rateOrMargin: 'PVP Mercado', isFinalHighlight: true, fiscalDestiny: 'Consumidor Final' },
        { label: 'LUCRO LÍQUIDO APÓS IMPOSTOS', amount: results.netProfit || results.estimatedProfit || 0, rateOrMargin: 'Líquido', isFinalHighlight: true, fiscalDestiny: 'Empresa / Caixa' }
      ],
      summaryCards: [
        { label: 'Custo Nacionalizado', value: formatMoney(results.nationalizedCostNet || results.landedCost || 0), subtext: 'Sem IVA' },
        { label: 'PVP Final Recomendado', value: formatMoney(results.pvpFinal || results.recommendedPVP || 0), subtext: 'Com IVA incluído' },
        { label: 'Lucro Líquido Real', value: formatMoney(results.netProfit || results.estimatedProfit || 0), subtext: 'Após desembaraço' }
      ],
      legalNotes: [
        `Desembaraço aduaneiro em conformidade com as Normas Internacionais de Comércio e Pauta Aduaneira (${destFiscal.agency}).`,
        `Este documento não substitui o Documento Único (DU) emitido pelo Despachante Oficial, destinando-se a orçamentação e auditoria prévia.`
      ],
      notes: notes
    });
  };

  const handleExportExcel = () => {
    if (!results) return;

    exportSimulationDossierExcel({
      title: `Importacao_${(productName || 'Carga').replace(/\s+/g, '_')}`,
      moduleName: 'Comércio Internacional & Importação',
      user: user,
      country: destFiscal,
      inputFields: [
        { label: 'Mercadoria', value: productName || 'Carga Importada', description: 'Item' },
        { label: 'Origem', value: originCountry, description: 'País de Origem' },
        { label: 'Destino', value: destFiscal.name, description: 'País de Destino' },
        { label: 'Valor FOB', value: results.fob || 0, description: 'FOB' },
        { label: 'Frete', value: results.freight || 0, description: 'Frete' },
        { label: 'Seguro', value: results.insurance || 0, description: 'Seguro' },
        { label: 'Direitos (%)', value: `${customsRate || 0}%`, description: 'Tarifa' }
      ],
      calculatedFields: [
        { label: 'Valor CIF', amount: results.cif || 0, rateOrMargin: 'CIF', fiscalDestiny: 'Base Aduaneira' },
        { label: 'Direitos Aduaneiros', amount: results.customsDuty || 0, rateOrMargin: `${customsRate}%`, fiscalDestiny: 'Alfândega' },
        { label: 'IEC Aduaneiro', amount: results.iec || results.iecTax || 0, rateOrMargin: `${iecRate}%`, fiscalDestiny: 'Imposto Especial' },
        { label: 'Custo Nacionalizado (Sem IVA)', amount: results.nationalizedCostNet || results.landedCost || 0, rateOrMargin: 'Custo', fiscalDestiny: 'Armazém' },
        { label: 'Preço Base de Venda (Sem IVA)', amount: results.pvpBase || 0, rateOrMargin: 'Subtotal Líquido', fiscalDestiny: 'Receita Líquida' },
        { label: 'IVA Cobrado na Venda', amount: results.vatSale || results.vat || 0, rateOrMargin: `${vatRate}%`, fiscalDestiny: destFiscal.agency },
        { label: 'PVP Final com IVA', amount: results.pvpFinal || results.recommendedPVP || 0, rateOrMargin: 'PVP', fiscalDestiny: 'Mercado' },
        { label: 'Lucro Líquido Real', amount: results.netProfit || results.estimatedProfit || 0, rateOrMargin: 'Líquido', fiscalDestiny: 'Lucro Real' }
      ],
      notes: notes
    });
  };

  // If locked, render lock banner
  if (!isUnlocked) {
    return (
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-8 text-center max-w-2xl mx-auto my-8 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl md:text-2xl font-black text-slate-100 mb-2">
          {t.lockedModule}: {t.importTitle}
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {t.lockedModuleDesc} O cálculo de CIF, Direitos Aduaneiros, IEC e Custo Nacionalizado está disponível a partir do <strong>Plano Ouro (3.000 Kz)</strong>, <strong>Platina</strong>, <strong>Diamante</strong> ou <strong>Plano Personalizado</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cálculo CIF (FOB + Frete + Seguro)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tarifas Aduaneiras & Taxas Portuárias</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Imposto Especial de Consumo (IEC)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Formação do Preço Nacionalizado & Lucro</span>
          </div>
        </div>

        <button
          onClick={onOpenPlans}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.btnUpgrade}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Créditos e Estado de Acesso RBAC */}
      <ClientCreditNoticeBanner
        user={user}
        onOpenPlans={onOpenPlans}
        onOpenAuth={onOpenAuth}
      />

      {/* Import Form Card */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-5 md:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-100">{t.importTitle}</h2>
              <p className="text-xs text-slate-400">Desembaraço aduaneiro, CIF, Direitos e Custo Nacionalizado</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Módulo Ativo
          </span>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Origin / Dest / VAT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t.lblOrigin}</label>
            <select
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none"
            >
              {availableCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t.lblDest}</label>
            <select
              value={destCountry}
              onChange={(e) => {
                setDestCountry(e.target.value);
                const c = getEffectiveCountryFiscal(e.target.value);
                if (c) setVatRate(c.vatOptions[0]?.r ?? 14);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none"
            >
              {availableCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.curr})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t.lblImpVat}</label>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none"
            >
              {destFiscal.vatOptions.map((v, idx) => (
                <option key={idx} value={v.r}>
                  {v.n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CIF Group: FOB, Freight, Insurance */}
        <div className="bg-sky-950/20 border border-sky-500/20 rounded-2xl p-4 md:p-5 mb-6">
          <p className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5" /> 1. Valores Internacionais de Transporte (CIF)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">{t.lblFob}</label>
              <NumericInput
                value={fob}
                onChange={setFob}
                placeholder="0,000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-sky-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">{t.lblFreight}</label>
              <NumericInput
                value={freight}
                onChange={setFreight}
                placeholder="0,000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-sky-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">{t.lblInsurance}</label>
              <NumericInput
                value={insurance}
                onChange={setInsurance}
                placeholder="0,000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Customs Taxes Group */}
        <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 md:p-5 mb-6">
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
            2. Direitos e Taxas Aduaneiras na Entrada ({destFiscal.agency})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">{t.lblCustoms}</label>
              <NumericInput
                value={customsRate}
                onChange={setCustomsRate}
                placeholder="0,000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">{t.lblIec}</label>
              <NumericInput
                value={iecRate}
                onChange={setIecRate}
                placeholder="0,000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">{t.lblFees}</label>
              <NumericInput
                value={otherFees}
                onChange={setOtherFees}
                placeholder="0,000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Margin, TPA & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t.lblImpMargin} (%)</label>
            <NumericInput
              value={marginPct}
              onChange={setMarginPct}
              placeholder="0,000"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Taxa TPA / Banco (%)</label>
            <NumericInput
              value={tpaRate}
              onChange={setTpaRate}
              placeholder="0,000"
              className="w-full bg-slate-900 border border-slate-700 text-indigo-300 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">{t.lblProductName}</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Contentor Equipamento Médico"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">{t.lblNotes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Despacho marítimo via Porto de Luanda"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRequestCalculate}
            disabled={isCalculating}
            className="w-full sm:flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold py-3.5 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-sky-950/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Ship className="w-4 h-4" />
            <span>{isCalculating ? 'A Processar Simulação...' : 'CALCULAR IMPORTAÇÃO & DESPACHO'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-4 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-mono border border-slate-700/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Rever ficha detalhada dos parâmetros de importação"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Rever Parâmetros</span>
          </button>
        </div>
      </div>

      {/* Results View */}
      <div ref={resultsRef}>
        {results ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Summary Card */}
            <div className="bg-slate-850 border border-sky-500/40 rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-sky-400" />
                  Resumo do Custo Base Nacionalizado
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    SIMULAÇÃO APURADA
                  </span>

                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Exportar Dossiê de Importação em PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>Dossiê PDF</span>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Exportar Dossiê de Importação em Excel (Sem Fórmulas)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400">Valor CIF (Total Internacional)</p>
                <p className="text-base font-extrabold text-slate-100 mt-1">{formatMoney(results.cif)}</p>
                <p className="text-[10px] text-slate-500">FOB: {formatMoney(results.fob)}</p>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400">Total Direitos & Taxas</p>
                <p className="text-base font-extrabold text-rose-400 mt-1">
                  + {formatMoney(results.customsDuty + results.iecTax + results.otherFees)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Tarifa: {results.customsRate}% | IEC: {results.iecRate}%
                </p>
              </div>

              <div className="bg-sky-950/40 p-3.5 rounded-2xl border border-sky-500/30">
                <p className="text-xs text-sky-300 font-bold">Custo Base Nacionalizado (S/ IVA)</p>
                <p className="text-lg font-black text-sky-400 mt-1">
                  {formatMoney(results.nationalizedCostNet)}
                </p>
                <p className="text-[10px] text-sky-400/80">Base para aplicação de margem</p>
              </div>
            </div>
          </div>

          {/* Sales Scenarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
                <h4 className="font-extrabold text-slate-100 text-base">Venda Nacionalizada ({results.marginPct}%)</h4>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-1 rounded-full">
                  Margem: {results.marginPct}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Custo Nacionalizado (SEM IVA)</span>
                    <strong className="text-slate-100">{formatMoney(results.nationalizedCostNet)}</strong>
                  </div>
                  <div className="flex justify-between text-sky-400 font-semibold">
                    <span>(+) Lucro Bruto / Margem ({results.marginPct}%)</span>
                    <strong>+ {formatMoney(results.profit)}</strong>
                  </div>

                  {/* Subtotal Sem IVA */}
                  <div className="flex justify-between items-center py-1 px-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200">
                    <span className="text-cyan-300 font-bold">(=) PREÇO BASE DE VENDA (SEM IVA):</span>
                    <strong className="font-mono text-cyan-300 text-xs">{formatMoney(results.pvpBase)}</strong>
                  </div>

                  <div className="flex justify-between text-sky-400 font-semibold">
                    <span>(+) IVA Cobrado na Venda ({vatRate}%)</span>
                    <strong>+ {formatMoney(results.vatSale)}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700 font-extrabold text-slate-100 text-sm bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                    <span className="text-emerald-300">(=) PREÇO TOTAL FATURADO (PVP COM IVA):</span>
                    <span className="text-emerald-400 font-black">{formatMoney(results.pvpFinal)}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-rose-400">
                    <span>(-) IVA a Pagar ao Fisco ({destFiscal.agency})</span>
                    <strong>- {formatMoney(results.netVatToPay)}</strong>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>(-) Imposto Industrial ({destFiscal.ii}%)</span>
                    <strong>- {formatMoney(results.incomeTax)}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 block">
                    LUCRO LÍQUIDO FINAL
                  </span>
                  <span className="text-[11px] text-slate-400">Após desembaraço e impostos</span>
                </div>
                <strong className="text-xl font-black text-emerald-400">
                  {formatMoney(results.netProfit)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1E293B]/60 border border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
            <Anchor className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wide">Pronto para Simular Importação Aduaneira</h3>
          <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
            Preencha os valores da mercadoria CIF e encargos aduaneiros e clique em <strong className="text-sky-300">"CALCULAR IMPORTAÇÃO & DESPACHO"</strong> para apurar o custo nacionalizado e PVP sugerido.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setFob('5.000,00');
                setFreight('1.200,00');
                setInsurance('150,00');
                setCustomsRate('10');
                setIecRate('0');
                setOtherFees('250,00');
                setMarginPct('25');
                setProductName('Lote Eletrónicos Importação');
                setTimeout(() => {
                  handleConfirmAndExecute();
                }, 50);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-mono font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Carregar Exemplo (FOB $5.000) e Calcular Imediatamente
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Confirmation Modal before calculating results */}
      <ConfirmSimulationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndExecute}
        moduleName="Comércio Internacional & Importação"
        title="Confirmar Simulação de Importação"
        subtitle="Reveja os valores da carga FOB, frete marítimo/aéreo, taxas aduaneiras e margem comercial antes de apurar os custos."
        summaryItems={simulationSummaryItems}
        userQueriesRemaining={user ? (user.queriesRemaining || 0) : getGuestCredits()}
        isStaffOrAdmin={user?.role === 'staff' || user?.role === 'admin' || user?.role === 'admin_level1' || user?.role === 'super_admin'}
        isGuest={!user}
        isProcessing={isCalculating}
      />

      {/* Exhausted Credits Modal - Prompts user to buy plan, then login */}
      <ExhaustedCreditsModal
        isOpen={showExhaustedModal}
        onClose={() => setShowExhaustedModal(false)}
        onOpenPlans={onOpenPlans}
        onOpenAuth={onOpenAuth}
        isGuest={!user}
      />

      {/* Mandatory Accountant Disclaimer */}
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Aviso Legal Nanucloud:</strong> A utilização deste simulador tem caráter estimativo e informativo, <strong>não dispensando a consulta de um profissional de contas</strong> ou despachante aduaneiro certificado.
        </span>
      </div>
    </div>
  );
};
