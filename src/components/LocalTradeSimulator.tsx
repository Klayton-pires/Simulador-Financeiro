import React, { useState, useEffect } from 'react';
import { UserSafe } from '../types';
import { COUNTRIES_DB, getAvailableCountryList, getEffectiveCountryFiscal } from '../data/countries';
import { SupportedLang, TRANSLATIONS } from '../i18n/translations';
import {
  Calculator,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  Package,
  Download,
  FileText,
  FileSpreadsheet,
  Zap,
  SlidersHorizontal,
  Sparkles,
  Layers,
  HelpCircle,
  Percent,
  Truck,
  Bus,
  Utensils,
  Hotel,
  RotateCcw,
  Receipt,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  exportSimulationDossierPDF,
  exportSimulationDossierExcel
} from '../utils/exportDocumentUtils';
import { useLayoutMode } from '../data/layoutMode';
import { ClientCreditNoticeBanner } from './ClientCreditNoticeBanner';
import { canUserSimulate } from '../utils/accessControl';
import { ConfirmSimulationModal, SimulationSummaryItem } from './ConfirmSimulationModal';
import { saveSimulationToFirestore } from '../services/firebase';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';

interface LocalTradeSimulatorProps {
  user: UserSafe | null;
  currentLang: SupportedLang;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onCalculationDone: (newCredits: number) => void;
}

export const LocalTradeSimulator: React.FC<LocalTradeSimulatorProps> = ({
  user,
  currentLang,
  onOpenPlans,
  onOpenAuth,
  onCalculationDone
}) => {
  const [layoutMode, setLayoutMode] = useLayoutMode();
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);

  const [countryCode, setCountryCode] = useState<string>('AO');
  const [vatRate, setVatRate] = useState<number>(14);
  const [tpaRate, setTpaRate] = useState<number>(0);
  const [costNet, setCostNet] = useState<string>('10000');
  const [costGross, setCostGross] = useState<string>('11400');
  const [marginPct, setMarginPct] = useState<string>('25');
  const [fixedPrice, setFixedPrice] = useState<string>('');
  const [productName, setProductName] = useState<string>('Mercadoria / Artigo Comercial');
  const [notes, setNotes] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationResults, setCalculationResults] = useState<any[] | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Optional Logistics & Acquisition Expenses (Available in Advanced Mode)
  const [transportCost, setTransportCost] = useState<string>('');
  const [transportRoundTrip, setTransportRoundTrip] = useState<boolean>(false);
  const [transportTaxMode, setTransportTaxMode] = useState<'without_vat' | 'with_vat' | 'exempt'>('without_vat');
  const [transportVatRate, setTransportVatRate] = useState<number>(14);

  const [mealsCost, setMealsCost] = useState<string>('');
  const [mealsTaxMode, setMealsTaxMode] = useState<'without_vat' | 'with_vat' | 'exempt'>('without_vat');
  const [mealsVatRate, setMealsVatRate] = useState<number>(14);

  const [lodgingCost, setLodgingCost] = useState<string>('');
  const [lodgingDays, setLodgingDays] = useState<string>('1');
  const [lodgingTaxMode, setLodgingTaxMode] = useState<'without_vat' | 'with_vat' | 'exempt'>('without_vat');
  const [lodgingVatRate, setLodgingVatRate] = useState<number>(14);

  const [otherExtrasCost, setOtherExtrasCost] = useState<string>('');
  const [otherExtrasLabel, setOtherExtrasLabel] = useState<string>('Embalagens / Carga / Taxas diversas');
  const [otherExtrasTaxMode, setOtherExtrasTaxMode] = useState<'without_vat' | 'with_vat' | 'exempt'>('without_vat');
  const [otherExtrasVatRate, setOtherExtrasVatRate] = useState<number>(14);

  // Bulk vs Retail Packaging Simulation (Available in Advanced Mode)
  const [enableBulkRetail, setEnableBulkRetail] = useState<boolean>(false);
  const [bulkQuantity, setBulkQuantity] = useState<string>('10');
  const [bulkUnit, setBulkUnit] = useState<string>('Caixas');
  const [retailUnitsPerBulk, setRetailUnitsPerBulk] = useState<string>('24');
  const [retailUnit, setRetailUnit] = useState<string>('Unidades');

  // Allocation / Inclusion Percentages for Extra Costs (Available in Advanced Mode)
  const [enableCostAbsorption, setEnableCostAbsorption] = useState<boolean>(false);
  const [transportInclusionPct, setTransportInclusionPct] = useState<string>('100');
  const [mealsInclusionPct, setMealsInclusionPct] = useState<string>('100');
  const [lodgingInclusionPct, setLodgingInclusionPct] = useState<string>('100');
  const [otherExtrasInclusionPct, setOtherExtrasInclusionPct] = useState<string>('100');

  // Dual View Selector for Simulation Results
  const [resultsDisplayView, setResultsDisplayView] = useState<'both' | 'simple' | 'advanced'>('both');

  const [countryVersion, setCountryVersion] = useState<number>(0);
  const country = getEffectiveCountryFiscal(countryCode);

  useEffect(() => {
    const handleMatrixUpdate = () => {
      setCountryVersion((v) => v + 1);
    };
    window.addEventListener('nanucloud_custom_fiscal_matrix_updated', handleMatrixUpdate);
    window.addEventListener('nanucloud_countries_updated', handleMatrixUpdate);
    return () => {
      window.removeEventListener('nanucloud_custom_fiscal_matrix_updated', handleMatrixUpdate);
      window.removeEventListener('nanucloud_countries_updated', handleMatrixUpdate);
    };
  }, []);

  useEffect(() => {
    if (country) {
      const defaultVat = country.vatOptions[0]?.r ?? 14;
      setVatRate(defaultVat);
      setTransportVatRate(defaultVat);
      setMealsVatRate(defaultVat);
      setLodgingVatRate(defaultVat);
      setOtherExtrasVatRate(defaultVat);
      setTpaRate(country.tpa || 0);
      if (costNet) {
        recalcGrossFromNet(parseFloat(costNet) || 0, defaultVat);
      }
    }
  }, [countryCode, countryVersion]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const recalcGrossFromNet = (net: number, vRate: number) => {
    if (!net || net <= 0) {
      setCostGross('');
      return;
    }
    const gross = net * (1 + vRate / 100);
    setCostGross(gross.toFixed(2));
  };

  const handleNetInput = (val: string) => {
    setCostNet(val);
    clearFieldError('costNet');
    clearFieldError('pricing');
    setCalculationResults(null);
    setSuccessMessage(null);
    if (!val || parseFloat(val) <= 0) {
      setCostGross('');
      return;
    }
    const num = parseFloat(val) || 0;
    recalcGrossFromNet(num, vatRate);
  };

  const handleGrossInput = (val: string) => {
    setCostGross(val);
    clearFieldError('costGross');
    clearFieldError('pricing');
    setCalculationResults(null);
    setSuccessMessage(null);
    if (!val || parseFloat(val) <= 0) {
      setCostNet('');
      return;
    }
    const num = parseFloat(val) || 0;
    const net = num / (1 + vatRate / 100);
    setCostNet(net.toFixed(2));
  };

  const handleVatChange = (newVat: number) => {
    setVatRate(newVat);
    clearFieldError('vatRate');
    setCalculationResults(null);
    setSuccessMessage(null);
    if (costNet) {
      const net = parseFloat(costNet) || 0;
      recalcGrossFromNet(net, newVat);
    }
  };

  const formatMoney = (val: number) => {
    return (
      new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val) + ` ${country.curr}`
    );
  };

  // Helper for computing individual extra acquisition expense taxes
  const computeItemTax = (amount: number, mode: 'without_vat' | 'with_vat' | 'exempt', rate: number) => {
    if (!amount || amount <= 0) return { net: 0, vat: 0, total: 0 };
    if (mode === 'exempt' || rate === 0) {
      return { net: amount, vat: 0, total: amount };
    }
    if (mode === 'with_vat') {
      const net = amount / (1 + rate / 100);
      const vat = amount - net;
      return { net, vat, total: amount };
    }
    const net = amount;
    const vat = net * (rate / 100);
    return { net, vat, total: net + vat };
  };

  const getEffectiveExtraCosts = () => {
    // If in friendly mode, extra costs are not applied to maintain a purely simple mode
    if (layoutMode === 'friendly') {
      return {
        hasExtras: false,
        totalExtraNet: 0,
        totalExtraVat: 0,
        totalExtraPaid: 0,
        totalExtraNetPassedToPrice: 0,
        totalExtraNetAbsorbed: 0,
        transport: { net: 0, vat: 0, total: 0, raw: 0, unit: 0, isRoundTrip: false, mode: 'without_vat' as const, rate: vatRate, inclusionPct: 100, passedNet: 0 },
        meals: { net: 0, vat: 0, total: 0, raw: 0, mode: 'without_vat' as const, rate: vatRate, inclusionPct: 100, passedNet: 0 },
        lodging: { net: 0, vat: 0, total: 0, raw: 0, days: 1, dailyRate: 0, mode: 'without_vat' as const, rate: vatRate, inclusionPct: 100, passedNet: 0 },
        otherExtras: { net: 0, vat: 0, total: 0, raw: 0, label: '', mode: 'without_vat' as const, rate: vatRate, inclusionPct: 100, passedNet: 0 }
      };
    }

    const tRawUnit = parseFloat(transportCost) || 0;
    const tVal = tRawUnit * (transportRoundTrip ? 2 : 1);
    const mVal = parseFloat(mealsCost) || 0;
    
    const lDaily = parseFloat(lodgingCost) || 0;
    const lDays = Math.max(1, parseInt(lodgingDays) || 1);
    const lVal = lDaily * lDays;

    const oVal = parseFloat(otherExtrasCost) || 0;

    const transport = computeItemTax(tVal, transportTaxMode, transportVatRate);
    const meals = computeItemTax(mVal, mealsTaxMode, mealsVatRate);
    const lodging = computeItemTax(lVal, lodgingTaxMode, lodgingVatRate);
    const otherExtras = computeItemTax(oVal, otherExtrasTaxMode, otherExtrasVatRate);

    const totalExtraNet = transport.net + meals.net + lodging.net + otherExtras.net;
    const totalExtraVat = transport.vat + meals.vat + lodging.vat + otherExtras.vat;
    const totalExtraPaid = transport.total + meals.total + lodging.total + otherExtras.total;

    // Inclusion / Absorption percentages for price formation
    const tPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFloat(transportInclusionPct) || 0)) : 100;
    const mPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFloat(mealsInclusionPct) || 0)) : 100;
    const lPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFloat(lodgingInclusionPct) || 0)) : 100;
    const oPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFloat(otherExtrasInclusionPct) || 0)) : 100;

    const transportPassedNet = transport.net * (tPct / 100);
    const mealsPassedNet = meals.net * (mPct / 100);
    const lodgingPassedNet = lodging.net * (lPct / 100);
    const otherExtrasPassedNet = otherExtras.net * (oPct / 100);

    const totalExtraNetPassedToPrice = transportPassedNet + mealsPassedNet + lodgingPassedNet + otherExtrasPassedNet;
    const totalExtraNetAbsorbed = totalExtraNet - totalExtraNetPassedToPrice;

    return {
      hasExtras: tVal > 0 || mVal > 0 || lVal > 0 || oVal > 0,
      transport: { ...transport, raw: tVal, unit: tRawUnit, isRoundTrip: transportRoundTrip, mode: transportTaxMode, rate: transportVatRate, inclusionPct: tPct, passedNet: transportPassedNet },
      meals: { ...meals, raw: mVal, mode: mealsTaxMode, rate: mealsVatRate, inclusionPct: mPct, passedNet: mealsPassedNet },
      lodging: { ...lodging, raw: lVal, days: lDays, dailyRate: lDaily, mode: lodgingTaxMode, rate: lodgingVatRate, inclusionPct: lPct, passedNet: lodgingPassedNet },
      otherExtras: { ...otherExtras, raw: oVal, label: otherExtrasLabel, mode: otherExtrasTaxMode, rate: otherExtrasVatRate, inclusionPct: oPct, passedNet: otherExtrasPassedNet },
      totalExtraNet,
      totalExtraVat,
      totalExtraPaid,
      totalExtraNetPassedToPrice,
      totalExtraNetAbsorbed
    };
  };

  const processMathScenario = (
    cNet: number,
    mPct: number,
    fixPrice: number,
    vRate: number,
    tRate: number,
    iiRate: number,
    extraBreakdown?: ReturnType<typeof getEffectiveExtraCosts>
  ) => {
    const extras = extraBreakdown || getEffectiveExtraCosts();
    // Price base uses passed extra costs (or total if absorption is disabled)
    const priceFormingCostNet = cNet + extras.totalExtraNetPassedToPrice;
    const totalRealAcquisitionCostNet = cNet + extras.totalExtraNet;

    let pvpBase = 0;
    let pvpFinal = 0;
    let vatSale = 0;
    let profit = 0;
    let actualMargin = 0;

    if (fixPrice > 0) {
      pvpFinal = fixPrice;
      pvpBase = pvpFinal / (1 + vRate / 100);
      vatSale = pvpFinal - pvpBase;
      profit = pvpBase - priceFormingCostNet;
      actualMargin = priceFormingCostNet > 0 ? (profit / priceFormingCostNet) * 100 : 0;
    } else {
      profit = priceFormingCostNet * (mPct / 100);
      pvpBase = priceFormingCostNet + profit;
      vatSale = pvpBase * (vRate / 100);
      pvpFinal = pvpBase + vatSale;
      actualMargin = mPct;
    }

    const merchandiseVatCost = cNet * (vRate / 100);
    const totalInputVatSupported = merchandiseVatCost + extras.totalExtraVat;
    const netVatToPay = Math.max(0, vatSale - totalInputVatSupported);
    const tpaCost = pvpFinal * (tRate / 100);
    
    // Operating profit deducts absorbed logistics if any
    const operatingProfit = profit - tpaCost - extras.totalExtraNetAbsorbed;
    const incomeTax = operatingProfit > 0 ? operatingProfit * (iiRate / 100) : 0;
    const netProfit = operatingProfit - incomeTax;

    // Bulk vs Retail Unit decomposition
    const bQty = Math.max(1, parseFloat(bulkQuantity) || 1);
    const rUnitsPerB = Math.max(1, parseFloat(retailUnitsPerBulk) || 1);
    const totalRetailUnits = enableBulkRetail ? (bQty * rUnitsPerB) : 1;

    const retailDecomposition = {
      isEnabled: enableBulkRetail,
      bulkQty: bQty,
      bulkUnit: bulkUnit || 'Lotes',
      retailUnitsPerBulk: rUnitsPerB,
      retailUnit: retailUnit || 'Unidades',
      totalRetailUnits,
      costPerBulkNet: totalRealAcquisitionCostNet / bQty,
      costPerRetailUnitNet: totalRealAcquisitionCostNet / totalRetailUnits,
      merchandiseCostPerRetailUnitNet: cNet / totalRetailUnits,
      extrasCostPerRetailUnitNet: extras.totalExtraNet / totalRetailUnits,
      pvpFinalPerRetailUnit: pvpFinal / totalRetailUnits,
      pvpBasePerRetailUnit: pvpBase / totalRetailUnits,
      vatPerRetailUnit: vatSale / totalRetailUnits,
      netProfitPerRetailUnit: netProfit / totalRetailUnits
    };

    return {
      costNet: priceFormingCostNet,
      merchandiseCostNet: cNet,
      merchandiseVatCost,
      totalEffectiveCostNet: priceFormingCostNet,
      totalRealAcquisitionCostNet,
      extras,
      totalInputVatSupported,
      vatCost: totalInputVatSupported,
      profit,
      marginApplied: actualMargin,
      pvpBase,
      pvpFinal,
      vatSale,
      netVatToPay,
      tpaCost,
      incomeTax,
      netProfit,
      retailDecomposition
    };
  };

  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);
  const [guestQueriesLeft, setGuestQueriesLeft] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('nanucloud_daily_reset_date');
    if (savedDate !== today) {
      localStorage.setItem('nanucloud_daily_reset_date', today);
      localStorage.setItem('nanucloud_guest_queries_left', '3');
      return 3;
    }
    const saved = localStorage.getItem('nanucloud_guest_queries_left');
    return saved !== null ? parseInt(saved, 10) : 3;
  });

  const handleRequestCalculate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const errors: Record<string, string> = {};
    const net = parseFloat(costNet) || 0;
    const fPrice = parseFloat(fixedPrice) || 0;

    if (!costNet || costNet.trim() === '') {
      errors.costNet = 'Campo obrigatório: introduza o Preço de Custo Base (SEM IVA).';
    } else if (isNaN(net) || net <= 0) {
      errors.costNet = 'O Preço de Custo deve ser um número positivo superior a 0.';
    }

    if (marginPct === '' && fixedPrice === '') {
      errors.pricing = 'Defina a Margem Desejada (%) ou o Preço de Venda Fixo (PVP).';
    }

    if (isNaN(tpaRate) || tpaRate < 0 || tpaRate > 100) {
      errors.tpaRate = 'A taxa TPA deve situar-se entre 0% e 100%.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Existem campos sem preenchimento ou com valores incorretos.');
      return;
    }

    setFieldErrors({});

    // AUTH & RBAC SIMULATION CHECK - Allows free demo credits without login
    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    // Open confirmation modal to confirm simulation before processing results
    setShowConfirmModal(true);
  };

  const handleConfirmAndExecute = async () => {
    setShowConfirmModal(false);
    setIsCalculating(true);
    setErrorMessage(null);

    const net = parseFloat(costNet) || 0;
    const fPrice = parseFloat(fixedPrice) || 0;
    const mPct = parseFloat(marginPct) || 0;

    try {
      let remaining = user?.queriesRemaining ?? 0;
      try {
        const res = await fetch('/api/simulator/calculate-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryCode,
            costNet: net,
            vatRate,
            tpaRate,
            marginPct: mPct,
            fixedFinalPrice: fPrice,
            productName,
            notes,
            // Optional logistics and acquisition costs (Advanced Mode)
            transportCost: layoutMode === 'advanced' ? parseFloat(transportCost) || 0 : 0,
            transportRoundTrip: layoutMode === 'advanced' ? transportRoundTrip : false,
            transportTaxMode: layoutMode === 'advanced' ? transportTaxMode : 'without_vat',
            transportVatRate: layoutMode === 'advanced' ? transportVatRate : vatRate,
            mealsCost: layoutMode === 'advanced' ? parseFloat(mealsCost) || 0 : 0,
            mealsTaxMode: layoutMode === 'advanced' ? mealsTaxMode : 'without_vat',
            mealsVatRate: layoutMode === 'advanced' ? mealsVatRate : vatRate,
            lodgingCost: layoutMode === 'advanced' ? parseFloat(lodgingCost) || 0 : 0,
            lodgingTaxMode: layoutMode === 'advanced' ? lodgingTaxMode : 'without_vat',
            lodgingVatRate: layoutMode === 'advanced' ? lodgingVatRate : vatRate,
            otherExtrasCost: layoutMode === 'advanced' ? parseFloat(otherExtrasCost) || 0 : 0,
            otherExtrasLabel: layoutMode === 'advanced' ? otherExtrasLabel : '',
            otherExtrasTaxMode: layoutMode === 'advanced' ? otherExtrasTaxMode : 'without_vat',
            otherExtrasVatRate: layoutMode === 'advanced' ? otherExtrasVatRate : vatRate
          })
        });

        if (res.ok) {
          const data = await res.json();
          remaining = data.queriesRemaining;
        } else if (res.status === 402) {
          const data = await res.json();
          setErrorMessage(data.error);
          onOpenPlans();
          setIsCalculating(false);
          return;
        } else {
          remaining = Math.max(0, (user?.queriesRemaining || 0) - 1);
        }
      } catch (err) {
        remaining = Math.max(0, (user?.queriesRemaining || 0) - 1);
      }

      const scenarios = [];
      if (marginPct !== '' || fPrice > 0) {
        const customCalc = processMathScenario(
          net,
          mPct,
          fPrice,
          vatRate,
          tpaRate,
          country.ii
        );
        scenarios.push({
          title: `Cenário Personalizado (${productName || 'Artigo'})`,
          calc: customCalc,
          isCustom: true
        });
      } else {
        const defaultCustom = processMathScenario(net, 25, 0, vatRate, tpaRate, country.ii);
        scenarios.push({
          title: `Cenário Recomendado (Margem 25%)`,
          calc: defaultCustom,
          isCustom: true
        });
      }

      country.margins.forEach((m) => {
        const stdCalc = processMathScenario(net, m, 0, vatRate, tpaRate, country.ii);
        scenarios.push({
          title: `Margem Padrão (${m}%)`,
          calc: stdCalc,
          isCustom: false
        });
      });

      setCalculationResults(scenarios);
      setSuccessMessage('Simulação confirmada e calculada com sucesso!');

      if (user) {
        onCalculationDone(remaining);
        // Persist simulation to Cloud Firestore
        saveSimulationToFirestore(user.id, 'local_trade', {
          country: countryCode,
          productName: productName || 'Artigo Comercial',
          costNet: net,
          marginPct: mPct,
          fixedFinalPrice: fPrice,
          vatRate,
          tpaRate,
          scenariosCount: scenarios.length
        }).catch(() => {});
      } else {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Falha ao processar simulação.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Results are strictly shown ONLY after user clicks the button and confirms the simulation
  const activeResults = calculationResults;
  const currentExtras = getEffectiveExtraCosts();

  const netNum = parseFloat(costNet) || 0;
  const fPriceNum = parseFloat(fixedPrice) || 0;
  const grossNum = parseFloat(costGross) || 0;

  const simulationSummaryItems: SimulationSummaryItem[] = [
    {
      label: 'Artigo / Mercadoria',
      value: productName || 'Artigo Comercial'
    },
    {
      label: 'Preço de Custo Líquido (Base)',
      value: formatMoney(netNum),
      detail: `Com IVA (${vatRate}%): ${formatMoney(grossNum)}`
    },
    {
      label: fPriceNum > 0 ? 'Preço de Venda Fixo (PVP pretendido)' : 'Margem de Lucro Desejada',
      value: fPriceNum > 0 ? formatMoney(fPriceNum) : `+${marginPct}%`,
      isHighlight: true
    },
    {
      label: 'País & Enquadramento Fiscal',
      value: `${country.name} (${country.curr})`,
      detail: `IVA: ${vatRate}% | TPA: ${tpaRate}% | Imposto Industrial: ${country.ii}%`
    }
  ];

  if (currentExtras.hasExtras && currentExtras.totalExtraPaid > 0) {
    simulationSummaryItems.push({
      label: 'Custos Adicionais (Transporte/Refeições/Extras)',
      value: formatMoney(currentExtras.totalExtraPaid),
      detail: 'Custos logísticos incorporados na formação de preço'
    });
  }

  if (enableBulkRetail && parseFloat(bulkQuantity) > 0) {
    simulationSummaryItems.push({
      label: 'Desdobramento Grosso vs Retalho',
      value: `${bulkQuantity} ${bulkUnit} (${retailUnitsPerBulk} ${retailUnit}/lote)`
    });
  }

  const handleExportPDF = () => {
    if (!activeResults || activeResults.length === 0) return;
    const mainScenario = activeResults[0];
    const calc = mainScenario.calc;

    const inputFields: any[] = [
      { label: 'Produto / Mercadoria', value: productName || 'Artigo Comercial', description: 'Designação do item' },
      { label: 'Custo Mercadoria (Sem IVA)', value: calc.merchandiseCostNet, description: 'Custo de compra líquida da mercadoria' }
    ];

    if (calc.extras?.hasExtras) {
      if (calc.extras.transport.raw > 0) {
        inputFields.push({
          label: `Transporte ${calc.extras.transport.isRoundTrip ? '(Ida e Volta)' : ''}`,
          value: formatMoney(calc.extras.transport.total),
          description: `Líquido: ${formatMoney(calc.extras.transport.net)} | Regime: ${calc.extras.transport.mode === 'exempt' ? 'Isento' : `${calc.extras.transport.rate}% IVA`}`
        });
      }
      if (calc.extras.meals.raw > 0) {
        inputFields.push({
          label: 'Alimentação / Refeições',
          value: formatMoney(calc.extras.meals.total),
          description: `Líquido: ${formatMoney(calc.extras.meals.net)} | Regime: ${calc.extras.meals.mode === 'exempt' ? 'Isento' : `${calc.extras.meals.rate}% IVA`}`
        });
      }
      if (calc.extras.lodging.raw > 0) {
        inputFields.push({
          label: 'Estadia / Hospedaria / Hotel',
          value: formatMoney(calc.extras.lodging.total),
          description: `Líquido: ${formatMoney(calc.extras.lodging.net)} | Regime: ${calc.extras.lodging.mode === 'exempt' ? 'Isento' : `${calc.extras.lodging.rate}% IVA`}`
        });
      }
      if (calc.extras.otherExtras.raw > 0) {
        inputFields.push({
          label: calc.extras.otherExtras.label || 'Outros Custos Extras',
          value: formatMoney(calc.extras.otherExtras.total),
          description: `Líquido: ${formatMoney(calc.extras.otherExtras.net)} | Regime: ${calc.extras.otherExtras.mode === 'exempt' ? 'Isento' : `${calc.extras.otherExtras.rate}% IVA`}`
        });
      }
      inputFields.push({
        label: 'Custo Efetivo Total de Aquisição (Sem IVA)',
        value: calc.totalEffectiveCostNet,
        description: 'Base total de formação de preço de venda'
      });
    }

    inputFields.push(
      { label: 'Margem de Lucro Desejada', value: `${calc.marginApplied.toFixed(2)}%`, description: 'Margem comercial pretendida' },
      { label: 'Taxa de IVA Aplicada na Venda', value: `${vatRate}%`, description: `Taxa geral ${country.agency}` },
      { label: 'Taxa Multicaixa / TPA', value: `${tpaRate}%`, description: 'Encargo de processamento bancário' }
    );

    const calculatedFields: any[] = [
      { label: 'Custo Base de Mercadoria', amount: calc.merchandiseCostNet, rateOrMargin: 'Mercadoria', fiscalDestiny: 'Fornecedor' }
    ];

    if (calc.extras?.hasExtras) {
      calculatedFields.push({
        label: 'Despesas Acessórias & Logística',
        amount: calc.extras.totalExtraNet,
        rateOrMargin: 'Logística',
        fiscalDestiny: 'Transporte/Estadia/Alim.'
      });
      calculatedFields.push({
        label: 'CUSTO EFETIVO TOTAL DE AQUISIÇÃO',
        amount: calc.totalEffectiveCostNet,
        rateOrMargin: '100% Custo',
        fiscalDestiny: 'Base Efetiva Comercial'
      });
    }

    calculatedFields.push(
      { label: 'Margem / Lucro Bruto Comercial', amount: calc.profit, rateOrMargin: `${calc.marginApplied.toFixed(1)}%`, fiscalDestiny: 'Margem Comercial' },
      { label: 'PREÇO BASE DE VENDA (SEM IVA)', amount: calc.pvpBase, rateOrMargin: 'Subtotal Líquido', isFinalHighlight: false, fiscalDestiny: 'Receita Líquida da Empresa' },
      { label: 'IVA Cobrado na Venda', amount: calc.vatSale, rateOrMargin: `${vatRate}% IVA`, fiscalDestiny: `Repercussão (${country.agency})` },
      { label: 'PREÇO TOTAL FATURADO (PVP COM IVA)', amount: calc.pvpFinal, rateOrMargin: 'PVP Total', isFinalHighlight: true, fiscalDestiny: 'Preço de Prateleira' },
      { label: 'Dedução Taxa TPA / Multicaixa', amount: calc.tpaCost, rateOrMargin: `${tpaRate}%`, isDeduction: true, fiscalDestiny: 'Bancos / Operador POS' },
      { label: 'Crédito IVA Suportado nas Compras (Dedutível)', amount: calc.totalInputVatSupported, rateOrMargin: 'IVA Suportado', isDeduction: false, fiscalDestiny: 'Crédito Fiscal' },
      { label: 'IVA Líquido a Entregar ao Estado', amount: calc.netVatToPay, rateOrMargin: 'IVA Líquido', isDeduction: true, fiscalDestiny: country.agency },
      { label: 'Provisão Imposto Industrial', amount: calc.incomeTax, rateOrMargin: `${country.ii}%`, isDeduction: true, fiscalDestiny: 'Tributação de Lucros' },
      { label: 'LUCRO LÍQUIDO REAL EFETIVO', amount: calc.netProfit, rateOrMargin: 'Líquido', isFinalHighlight: true, fiscalDestiny: 'Empresa / Caixa Livre' }
    );

    exportSimulationDossierPDF({
      title: `Dossiê de Formação de Preço - ${productName || 'Mercadoria Geral'}`,
      moduleName: 'Vendas & Comércio Local (PVP)',
      user: user,
      country: country,
      inputFields,
      calculatedFields,
      summaryCards: [
        { label: 'PVP Final com IVA', value: formatMoney(calc.pvpFinal), subtext: 'Preço Recomendado ao Consumidor' },
        { label: 'Lucro Líquido Real', value: formatMoney(calc.netProfit), subtext: 'Livre de impostos e taxas' },
        { label: 'Margem Aplicada', value: `${calc.marginApplied.toFixed(1)}%`, subtext: 'Sobre o Custo Base Efetivo' }
      ],
      legalNotes: [
        `Cálculo em conformidade com o Código Geral Tributário e Código do IVA (${country.name} - ${country.agency}).`,
        `Este documento reflete valores finais computados e calculados. Todas as regras de arredondamento e retenção seguem a regulamentação do Fisco.`
      ],
      notes: notes
    });
  };

  const handleExportExcel = () => {
    if (!activeResults || activeResults.length === 0) return;
    const mainScenario = activeResults[0];
    const calc = mainScenario.calc;

    const inputFields: any[] = [
      { label: 'Designação do Produto', value: productName || 'Artigo Comercial', description: 'Item comercializado' },
      { label: 'Preço de Custo Mercadoria (Sem IVA)', value: calc.merchandiseCostNet, description: 'Custo inicial' }
    ];

    if (calc.extras?.hasExtras) {
      if (calc.extras.transport.raw > 0) {
        inputFields.push({
          label: `Transporte ${calc.extras.transport.isRoundTrip ? '(Ida e Volta)' : ''}`,
          value: calc.extras.transport.total,
          description: `Líquido: ${calc.extras.transport.net} | Regime: ${calc.extras.transport.mode}`
        });
      }
      if (calc.extras.meals.raw > 0) {
        inputFields.push({
          label: 'Alimentação / Refeições',
          value: calc.extras.meals.total,
          description: `Líquido: ${calc.extras.meals.net} | Regime: ${calc.extras.meals.mode}`
        });
      }
      if (calc.extras.lodging.raw > 0) {
        inputFields.push({
          label: 'Estadia / Hospedaria / Hotel',
          value: calc.extras.lodging.total,
          description: `Líquido: ${calc.extras.lodging.net} | Regime: ${calc.extras.lodging.mode}`
        });
      }
      if (calc.extras.otherExtras.raw > 0) {
        inputFields.push({
          label: calc.extras.otherExtras.label || 'Outros Custos Extras',
          value: calc.extras.otherExtras.total,
          description: `Líquido: ${calc.extras.otherExtras.net} | Regime: ${calc.extras.otherExtras.mode}`
        });
      }
      inputFields.push({
        label: 'Custo Total Efetivo de Aquisição',
        value: calc.totalEffectiveCostNet,
        description: 'Mercadoria + Logística'
      });
    }

    inputFields.push(
      { label: 'Margem Comercial Aplicada', value: `${calc.marginApplied.toFixed(2)}%`, description: 'Margem de lucro' },
      { label: 'Taxa de IVA', value: `${vatRate}%`, description: 'Imposto sobre o Valor Acrescentado' },
      { label: 'Taxa TPA / Cartão', value: `${tpaRate}%`, description: 'Encargo bancário' }
    );

    const calculatedFields: any[] = [
      { label: 'Custo Base de Compra Mercadoria', amount: calc.merchandiseCostNet, rateOrMargin: 'Mercadoria', fiscalDestiny: 'Fornecedor' }
    ];

    if (calc.extras?.hasExtras) {
      calculatedFields.push({
        label: 'Despesas Acessórias & Logística',
        amount: calc.extras.totalExtraNet,
        rateOrMargin: 'Logística',
        fiscalDestiny: 'Transporte/Estadia/Alim.'
      });
      calculatedFields.push({
        label: 'CUSTO EFETIVO TOTAL DE AQUISIÇÃO',
        amount: calc.totalEffectiveCostNet,
        rateOrMargin: '100% Custo',
        fiscalDestiny: 'Base Efetiva Comercial'
      });
    }

    calculatedFields.push(
      { label: 'Lucro Bruto Comercial', amount: calc.profit, rateOrMargin: `${calc.marginApplied.toFixed(1)}%`, fiscalDestiny: 'Margem Comercial' },
      { label: 'PREÇO BASE DE VENDA (SEM IVA)', amount: calc.pvpBase, rateOrMargin: 'Subtotal Líquido', fiscalDestiny: 'Receita Líquida Comercial' },
      { label: 'IVA Cobrado ao Cliente', amount: calc.vatSale, rateOrMargin: `${vatRate}%`, fiscalDestiny: country.agency },
      { label: 'PREÇO TOTAL FATURADO (PVP COM IVA)', amount: calc.pvpFinal, rateOrMargin: 'PVP Final', fiscalDestiny: 'Venda ao Público' },
      { label: 'Taxa Bancária TPA', amount: calc.tpaCost, rateOrMargin: `${tpaRate}%`, fiscalDestiny: 'Dedução Bancária' },
      { label: 'Crédito IVA Suportado (Dedutível)', amount: calc.totalInputVatSupported, rateOrMargin: 'IVA Suportado', fiscalDestiny: 'Crédito Fiscal' },
      { label: 'IVA a Entregar ao Fisco', amount: calc.netVatToPay, rateOrMargin: 'Líquido', fiscalDestiny: country.agency },
      { label: 'Imposto Industrial / Lucros', amount: calc.incomeTax, rateOrMargin: `${country.ii}%`, fiscalDestiny: 'Provisão Fiscal' },
      { label: 'LUCRO LÍQUIDO REAL', amount: calc.netProfit, rateOrMargin: 'Líquido', fiscalDestiny: 'Resultado Líquido' }
    );

    exportSimulationDossierExcel({
      title: `Simulacao_PVP_${(productName || 'Artigo').replace(/\s+/g, '_')}`,
      moduleName: 'Vendas & Comércio Local',
      user: user,
      country: country,
      inputFields,
      calculatedFields,
      notes: notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Exhausted Free Queries Modal */}
      {showExhaustedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase">Consultas Gratuitas Esgotadas</h3>
                <p className="text-xs text-slate-400">Atingiu o limite de consultas de demonstração</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Para continuar a realizar simulações fiscais, histórico detalhado e exportações, adira a um dos planos <strong>NANUCLOUD</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExhaustedModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExhaustedModal(false);
                  onOpenAuth();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer uppercase"
              >
                Aderir a um Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso e Estado de Crédito / Acesso RBAC */}
      <ClientCreditNoticeBanner
        user={user}
        onOpenPlans={onOpenPlans}
        onOpenAuth={onOpenAuth}
      />

      {/* Main Form Box */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-tight">
                  Simulador de Comércio Local & Venda de Produtos
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  layoutMode === 'friendly'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {layoutMode === 'friendly' ? 'Modo Básico / Friendly' : 'Modo Avançado Pro'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {layoutMode === 'friendly'
                  ? 'Interface amigável e simplificada: ajuste margens com um clique e visualize o preço final instantaneamente.'
                  : 'Formação matemática completa: múltiplos cenários comparativos, pauta fiscal, TPA e apuramento do lucro líquido.'}
              </p>
            </div>
          </div>

          {/* Layout Mode Local Switcher */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLayoutMode('friendly')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition ${
                layoutMode === 'friendly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Básico / Amigável</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('advanced')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition ${
                layoutMode === 'advanced'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Avançado Pro</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Country Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              {t.lblCountry}
            </label>
            <select
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                clearFieldError('countryCode');
              }}
              className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
            >
              {availableCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.curr})
                </option>
              ))}
            </select>
          </div>

          {/* VAT Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              {t.lblVat}
            </label>
            <select
              value={vatRate}
              onChange={(e) => handleVatChange(parseFloat(e.target.value))}
              className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
            >
              {country.vatOptions.map((v, idx) => (
                <option key={idx} value={v.r}>
                  {v.n}
                </option>
              ))}
            </select>
          </div>

          {/* TPA Card Fee */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              {t.lblTpa} {layoutMode === 'friendly' ? '(Opcional)' : '(Padrão 0%)'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={tpaRate}
                onChange={(e) => {
                  setTpaRate(parseFloat(e.target.value) || 0);
                  clearFieldError('tpaRate');
                }}
                step="0.1"
                min="0"
                className={`w-full bg-[#0F172A] border rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition ${
                  fieldErrors.tpaRate ? 'border-rose-500 bg-rose-950/20 text-rose-100 ring-2 ring-rose-500/20' : 'border-slate-800 text-slate-100'
                }`}
              />
              <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-mono">%</span>
            </div>
          </div>
        </div>

        {/* Cost & Margins Box */}
        <div className="space-y-4 mb-5">
          {/* Purchase Cost */}
          <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                1. Preço de Custo de Compra da Mercadoria
              </label>
              <span className="text-xs font-mono font-bold text-indigo-400">{country.curr}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>{t.lblCostNet} (SEM IVA) *</span>
                </label>
                <input
                  type="number"
                  value={costNet}
                  onChange={(e) => handleNetInput(e.target.value)}
                  placeholder={`Ex: 10000 (${country.curr})`}
                  step="any"
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition ${
                    fieldErrors.costNet ? 'border-rose-500 bg-rose-950/20 text-rose-100 ring-2 ring-rose-500/20' : 'border-slate-700 text-slate-100'
                  }`}
                />
                {fieldErrors.costNet && (
                  <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.costNet}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono">{t.lblCostGross} (COM IVA)</label>
                <input
                  type="number"
                  value={costGross}
                  onChange={(e) => handleGrossInput(e.target.value)}
                  placeholder={`Ex: 11400 (${country.curr})`}
                  step="any"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            {/* Optional Logistics & Additional Acquisition Expenses (Exclusively in Advanced Mode) */}
            {layoutMode === 'advanced' && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-bold text-slate-200 font-mono uppercase tracking-wider">
                      Custos de Transporte, Logística & Despesas de Aquisição (Opcional)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded w-fit">
                    Disponível no Modo Avançado
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. Transporte */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Bus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Custo de Transporte</span>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-2 py-1 rounded border border-slate-700/60 transition">
                        <input
                          type="checkbox"
                          checked={transportRoundTrip}
                          onChange={(e) => setTransportRoundTrip(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-0 focus:outline-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-indigo-300 font-bold flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-indigo-400" />
                          Ida e Volta (2x)
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">
                          Valor {transportRoundTrip ? '(Por Viagem)' : ''}
                        </label>
                        <input
                          type="number"
                          value={transportCost}
                          onChange={(e) => setTransportCost(e.target.value)}
                          placeholder={`0.00 (${country.curr})`}
                          step="any"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Regime Fiscal</label>
                        <select
                          value={transportTaxMode}
                          onChange={(e: any) => setTransportTaxMode(e.target.value)}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        >
                          <option value="without_vat">SEM IVA (Acresce {transportVatRate}%)</option>
                          <option value="with_vat">COM IVA (Já inclui {transportVatRate}%)</option>
                          <option value="exempt">Sem Imposto / Isento (0%)</option>
                        </select>
                      </div>
                    </div>

                    {transportTaxMode !== 'exempt' && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>Alíquota de IVA Transporte:</span>
                        <select
                          value={transportVatRate}
                          onChange={(e) => setTransportVatRate(parseFloat(e.target.value) || 0)}
                          className="bg-[#0F172A] border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-[10px] font-mono outline-none"
                        >
                          {country.vatOptions.map((v, i) => (
                            <option key={i} value={v.r}>{v.n} ({v.r}%)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 2. Alimentação */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span>Alimentação / Refeições</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Diárias / Viagem</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Valor Total</label>
                        <input
                          type="number"
                          value={mealsCost}
                          onChange={(e) => setMealsCost(e.target.value)}
                          placeholder={`0.00 (${country.curr})`}
                          step="any"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Regime Fiscal</label>
                        <select
                          value={mealsTaxMode}
                          onChange={(e: any) => setMealsTaxMode(e.target.value)}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        >
                          <option value="without_vat">SEM IVA (Acresce {mealsVatRate}%)</option>
                          <option value="with_vat">COM IVA (Já inclui {mealsVatRate}%)</option>
                          <option value="exempt">Sem Imposto / Isento (0%)</option>
                        </select>
                      </div>
                    </div>

                    {mealsTaxMode !== 'exempt' && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>Alíquota de IVA Alimentação:</span>
                        <select
                          value={mealsVatRate}
                          onChange={(e) => setMealsVatRate(parseFloat(e.target.value) || 0)}
                          className="bg-[#0F172A] border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-[10px] font-mono outline-none"
                        >
                          {country.vatOptions.map((v, i) => (
                            <option key={i} value={v.r}>{v.n} ({v.r}%)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 3. Estadia / Hospedaria / Hotel */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Hotel className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Estadia / Hospedaria / Hotel</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Total: {formatMoney((parseFloat(lodgingCost) || 0) * Math.max(1, parseInt(lodgingDays) || 1))}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Preço / Noite</label>
                        <input
                          type="number"
                          value={lodgingCost}
                          onChange={(e) => setLodgingCost(e.target.value)}
                          placeholder={`0.00 (${country.curr})`}
                          step="any"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Nº Dias / Noites</label>
                        <input
                          type="number"
                          value={lodgingDays}
                          onChange={(e) => setLodgingDays(e.target.value)}
                          placeholder="1"
                          min="1"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Regime Fiscal</label>
                        <select
                          value={lodgingTaxMode}
                          onChange={(e: any) => setLodgingTaxMode(e.target.value)}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        >
                          <option value="without_vat">SEM IVA (Acresce {lodgingVatRate}%)</option>
                          <option value="with_vat">COM IVA (Já inclui {lodgingVatRate}%)</option>
                          <option value="exempt">Sem Imposto / Isento (0%)</option>
                        </select>
                      </div>
                    </div>

                    {lodgingTaxMode !== 'exempt' && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>Alíquota de IVA Estadia:</span>
                        <select
                          value={lodgingVatRate}
                          onChange={(e) => setLodgingVatRate(parseFloat(e.target.value) || 0)}
                          className="bg-[#0F172A] border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-[10px] font-mono outline-none"
                        >
                          {country.vatOptions.map((v, i) => (
                            <option key={i} value={v.r}>{v.n} ({v.r}%)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 4. Outros Custos Extras */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Package className="w-3.5 h-3.5 text-purple-400" />
                        <span>Outros Custos Extras</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Despesas Diversas</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Valor</label>
                        <input
                          type="number"
                          value={otherExtrasCost}
                          onChange={(e) => setOtherExtrasCost(e.target.value)}
                          placeholder={`0.00 (${country.curr})`}
                          step="any"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Regime Fiscal</label>
                        <select
                          value={otherExtrasTaxMode}
                          onChange={(e: any) => setOtherExtrasTaxMode(e.target.value)}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        >
                          <option value="without_vat">SEM IVA (Acresce {otherExtrasVatRate}%)</option>
                          <option value="with_vat">COM IVA (Já inclui {otherExtrasVatRate}%)</option>
                          <option value="exempt">Sem Imposto / Isento (0%)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        value={otherExtrasLabel}
                        onChange={(e) => setOtherExtrasLabel(e.target.value)}
                        placeholder="Descrição (ex: Carga/Descarga, Embalagem, Portagens)"
                        className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded px-2.5 py-1.5 text-[11px] font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time consolidation card of extra logistics expenses */}
                {currentExtras.hasExtras && (
                  <div className="bg-slate-900/95 border border-indigo-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                        Consolidação Efetiva dos Custos de Aquisição:
                      </span>
                      <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Mercadoria: <strong className="text-slate-100 font-bold">{formatMoney(parseFloat(costNet) || 0)}</strong></span>
                        <span>+ Logística/Extras: <strong className="text-amber-300 font-bold">{formatMoney(currentExtras.totalExtraNet)}</strong></span>
                        <span>(=) Base Efetiva: <strong className="text-emerald-400 font-bold">{formatMoney((parseFloat(costNet) || 0) + currentExtras.totalExtraNet)}</strong></span>
                      </div>
                    </div>
                    <div className="text-right sm:self-center bg-indigo-500/10 px-3 py-1.5 rounded border border-indigo-500/20">
                      <span className="text-[10px] text-slate-400 block">IVA Dedutível Suportado:</span>
                      <span className="text-xs font-bold text-indigo-300 font-mono">
                        {formatMoney(((parseFloat(costNet) || 0) * (vatRate / 100)) + currentExtras.totalExtraVat)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bulk vs Retail Packaging & Unit of Measure Breakdown (Optional in Advanced Mode) */}
                <div className="p-3.5 bg-[#0B132B] rounded-lg border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableBulkRetail}
                        onChange={(e) => setEnableBulkRetail(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Simular Compra a Grosso vs Venda a Retalho & Unidades de Medida
                      </span>
                    </label>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      {enableBulkRetail ? 'Ativo' : 'Opcional'}
                    </span>
                  </div>

                  {enableBulkRetail && (
                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                      <p className="text-[11px] text-slate-400 font-mono">
                        Defina as quantidades de compra no lote a grosso e o desdobramento por unidades de venda a retalho para calcular o preço unitário e o lucro por artigo individual.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Qtd. Compra a Grosso</label>
                          <input
                            type="number"
                            value={bulkQuantity}
                            onChange={(e) => setBulkQuantity(e.target.value)}
                            placeholder="Ex: 10"
                            min="1"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Unidade do Lote (Grosso)</label>
                          <select
                            value={bulkUnit}
                            onChange={(e) => setBulkUnit(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                          >
                            <option value="Caixas">Caixas</option>
                            <option value="Fardos">Fardos</option>
                            <option value="Sacos">Sacos</option>
                            <option value="Paletes">Paletes</option>
                            <option value="Lotes">Lotes</option>
                            <option value="Dúzias">Dúzias</option>
                            <option value="Quilos (Kg)">Quilos (Kg)</option>
                            <option value="Toneladas">Toneladas</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Unidades por Lote</label>
                          <input
                            type="number"
                            value={retailUnitsPerBulk}
                            onChange={(e) => setRetailUnitsPerBulk(e.target.value)}
                            placeholder="Ex: 24"
                            min="1"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">Unidade a Retalho</label>
                          <select
                            value={retailUnit}
                            onChange={(e) => setRetailUnit(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                          >
                            <option value="Unidades">Unidades / Peças</option>
                            <option value="Latas">Latas</option>
                            <option value="Garrafas">Garrafas</option>
                            <option value="Quilos (Kg)">Quilos (Kg)</option>
                            <option value="Litros">Litros</option>
                            <option value="Metros">Metros</option>
                            <option value="Pares">Pares</option>
                            <option value="Pacotes">Pacotes</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Total de Artigos a Retalho: <strong className="text-indigo-400">{Math.max(1, parseFloat(bulkQuantity) || 1) * Math.max(1, parseFloat(retailUnitsPerBulk) || 1)} {retailUnit}</strong> ({bulkQuantity} {bulkUnit} × {retailUnitsPerBulk} {retailUnit}/{bulkUnit})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Margins Selection & Presets */}
          <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-400" />
                2. Estratégia de Preço: Margem Desejada (%) {layoutMode === 'advanced' && 'OU Preço Fixo (PVP)'}
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {layoutMode === 'friendly' ? 'Escolha rápida ou digite a sua margem' : 'Preencha uma das opções'}
              </span>
            </div>

            {/* Quick Preset Buttons (Friendly & Dynamic) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Margens Rápidas:
              </span>
              {[10, 15, 20, 25, 30, 35, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMarginPct(preset.toString());
                    setFixedPrice('');
                    clearFieldError('pricing');
                    setCalculationResults(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    marginPct === preset.toString() && !fixedPrice
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  +{preset}%
                </button>
              ))}
            </div>

            <div className={`grid gap-4 ${layoutMode === 'friendly' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  {t.lblMargin} (Personalizada)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={marginPct}
                    onChange={(e) => {
                      setMarginPct(e.target.value);
                      setFixedPrice('');
                      clearFieldError('pricing');
                      setCalculationResults(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="Ex: 25 (%)"
                    step="any"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">%</span>
                </div>
              </div>

              {/* TPA / Bank Fee Manual Percentage Input alongside Margins */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                  <span>{t.lblTpa || 'Taxa TPA / Banco'}</span>
                  <span className="text-[9px] text-indigo-400 font-mono">Manual %</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tpaRate}
                    onChange={(e) => {
                      setTpaRate(parseFloat(e.target.value) || 0);
                      clearFieldError('tpaRate');
                      setCalculationResults(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="Ex: 1.0 (%)"
                    step="0.1"
                    min="0"
                    max="30"
                    className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">%</span>
                </div>
              </div>

              {layoutMode === 'advanced' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">{t.lblFixed}</label>
                  <input
                    type="number"
                    value={fixedPrice}
                    onChange={(e) => {
                      setFixedPrice(e.target.value);
                      setMarginPct('');
                      clearFieldError('pricing');
                      setCalculationResults(null);
                      setSuccessMessage(null);
                    }}
                    placeholder={`Ex: 15000 (${country.curr})`}
                    step="any"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* Optional Rateio / Absorption of Extra Costs into Final Price (Advanced Mode) */}
            {layoutMode === 'advanced' && currentExtras.hasExtras && (
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableCostAbsorption}
                      onChange={(e) => setEnableCostAbsorption(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-600 text-amber-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-amber-300 font-mono flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      Rateio / % de Inclusão dos Custos Extras no Preço de Venda
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {enableCostAbsorption ? 'Personalizado' : '100% Repassado ao PVP'}
                  </span>
                </div>

                {enableCostAbsorption && (
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2 animate-in fade-in">
                    <p className="text-[10px] text-slate-400 font-mono">
                      Indique que percentagem (0% a 100%) de cada despesa logística deseja incluir no custo base de formação do PVP (o restante é suportado pela margem interna):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Transporte (%)</label>
                        <input
                          type="number"
                          value={transportInclusionPct}
                          onChange={(e) => setTransportInclusionPct(e.target.value)}
                          placeholder="100"
                          min="0"
                          max="100"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Alimentação (%)</label>
                        <input
                          type="number"
                          value={mealsInclusionPct}
                          onChange={(e) => setMealsInclusionPct(e.target.value)}
                          placeholder="100"
                          min="0"
                          max="100"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Estadia (%)</label>
                        <input
                          type="number"
                          value={lodgingInclusionPct}
                          onChange={(e) => setLodgingInclusionPct(e.target.value)}
                          placeholder="100"
                          min="0"
                          max="100"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Outros Extras (%)</label>
                        <input
                          type="number"
                          value={otherExtrasInclusionPct}
                          onChange={(e) => setOtherExtrasInclusionPct(e.target.value)}
                          placeholder="100"
                          min="0"
                          max="100"
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {fieldErrors.pricing && (
              <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.pricing}</span>
              </p>
            )}
          </div>
        </div>

        {/* Optional Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-mono">{t.lblProductName}</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Smartphone Galaxy / Arroz 25kg / Óleo de Palma"
              className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-mono">{t.lblNotes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Preço de campanha promocional ou lote especial"
              className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
            />
          </div>
        </div>

        {/* Calculate & Confirm Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRequestCalculate}
            disabled={isCalculating}
            className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{isCalculating ? 'A PROCESSAR SIMULAÇÃO...' : 'CALCULAR & CONFIRMAR SIMULAÇÃO'}</span>
          </button>
        </div>
      </div>

      {/* Results Scenarios (Strictly rendered ONLY after clicking button and confirming) */}
      {!activeResults ? (
        <div className="bg-[#1E293B]/70 border border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wide">
            Aguardando Confirmação da Simulação
          </h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto leading-relaxed">
            Preencha os valores de custo e margem comercial da mercadoria e clique no botão{' '}
            <strong className="text-indigo-300 font-bold">"CALCULAR & CONFIRMAR SIMULAÇÃO"</strong> acima para visualizar os cenários oficiais de formação de preço de venda e margens líquidas.
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1E293B] border border-slate-800 p-4 rounded-xl">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  {t.resultsTitle || 'Cenários de Formação de Preço e Lucratividade (Produtos)'}
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  SIMULAÇÃO CONFIRMADA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                IVA: {vatRate}% | TPA: {tpaRate}% | Imposto Industrial: {country.ii}%
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Exportar Dossiê Oficial em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.exportPdf || 'Dossiê PDF'}</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Exportar Dossiê em Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.exportExcel || 'Exportar Excel'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeResults.map((scenario, index) => {
              const calc = scenario.calc;
              return (
                <div
                  key={index}
                  className={`bg-[#1E293B] border rounded-xl p-5 shadow-sm transition-all ${
                    scenario.isCustom
                      ? 'border-indigo-500/50'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Scenario Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <h4 className="font-bold text-slate-100 text-xs uppercase font-mono">
                      {scenario.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Margem: {calc.marginApplied.toFixed(1)}%
                    </span>
                  </div>

                  {/* Visual Distribution Progress Bar (Auto-adjusting & dynamic) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Distribuição do PVP:</span>
                      <span className="text-emerald-400 font-bold">
                        {((calc.netProfit / (calc.pvpFinal || 1)) * 100).toFixed(0)}% Lucro Líquido
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, (calc.costNet / (calc.pvpFinal || 1)) * 100))}%` }}
                        className="bg-slate-500 h-full transition-all"
                        title={`Custo: ${formatMoney(calc.costNet)}`}
                      />
                      <div
                        style={{ width: `${Math.min(100, Math.max(3, (calc.vatSale / (calc.pvpFinal || 1)) * 100))}%` }}
                        className="bg-indigo-500 h-full transition-all"
                        title={`IVA: ${formatMoney(calc.vatSale)}`}
                      />
                      {calc.tpaCost > 0 && (
                        <div
                          style={{ width: `${Math.min(100, Math.max(2, (calc.tpaCost / (calc.pvpFinal || 1)) * 100))}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`TPA: ${formatMoney(calc.tpaCost)}`}
                        />
                      )}
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, (calc.netProfit / (calc.pvpFinal || 1)) * 100))}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Lucro Líquido: ${formatMoney(calc.netProfit)}`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-500" /> Custo
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> IVA
                      </span>
                      {calc.tpaCost > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> TPA
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Lucro Líquido
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Breakdown Table */}
                  <div className="space-y-2 text-xs font-mono">
                    {/* Section 1: Price Formation */}
                    <div className="bg-[#0F172A] p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        1. Formação do Preço / Faturação Bruta
                      </p>

                      {calc.extras?.hasExtras ? (
                        <>
                          <div className="flex justify-between text-slate-300">
                            <span>Custo Mercadoria Base</span>
                            <strong className="text-slate-100 font-mono">{formatMoney(calc.merchandiseCostNet)}</strong>
                          </div>

                          {calc.extras.transport.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• Transporte {calc.extras.transport.isRoundTrip ? '(Ida+Volta)' : ''}</span>
                              <span className="font-mono">+ {formatMoney(calc.extras.transport.net)}</span>
                            </div>
                          )}

                          {calc.extras.meals.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• Alimentação / Diárias</span>
                              <span className="font-mono">+ {formatMoney(calc.extras.meals.net)}</span>
                            </div>
                          )}

                          {calc.extras.lodging.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• Estadia / Hospedaria</span>
                              <span className="font-mono">+ {formatMoney(calc.extras.lodging.net)}</span>
                            </div>
                          )}

                          {calc.extras.otherExtras.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• {calc.extras.otherExtras.label || 'Outros Custos Extras'}</span>
                              <span className="font-mono">+ {formatMoney(calc.extras.otherExtras.net)}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-slate-800/60">
                            <span>(=) Custo Efetivo de Aquisição</span>
                            <strong className="font-mono">{formatMoney(calc.totalEffectiveCostNet)}</strong>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-slate-300">
                          <span>Custo Base (SEM IVA)</span>
                          <strong className="text-slate-100 font-mono">{formatMoney(calc.costNet)}</strong>
                        </div>
                      )}

                      <div className="flex justify-between text-indigo-300">
                        <span>(+) Margem de Lucro Bruto ({calc.marginApplied.toFixed(1)}%)</span>
                        <strong className="font-mono">+ {formatMoney(calc.profit)}</strong>
                      </div>

                      {/* Total SEM IVA */}
                      <div className="flex justify-between items-center py-1 px-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200">
                        <span className="text-cyan-300 font-bold">(=) SUB-TOTAL / VENDA LÍQUIDA (SEM IVA):</span>
                        <strong className="font-mono text-cyan-300 text-xs">{formatMoney(calc.pvpBase)}</strong>
                      </div>

                      <div className="flex justify-between text-indigo-300">
                        <span>(+) IVA Liquidado na Venda ({vatRate}%)</span>
                        <strong className="font-mono">+ {formatMoney(calc.vatSale)}</strong>
                      </div>

                      {/* Total COM IVA */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-slate-100 text-xs bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                        <span className="text-emerald-300">(=) PREÇO TOTAL FATURADO (COM IVA):</span>
                        <span className="text-emerald-400 font-bold font-mono text-sm">{formatMoney(calc.pvpFinal)}</span>
                      </div>
                    </div>

                    {/* Decomposição por Unidade a Retalho (quando ativada) */}
                    {calc.retailDecomposition?.isEnabled && (
                      <div className="bg-[#0F172A] p-3 rounded-lg border border-indigo-500/30 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                          <span>Decomposição por Unidade a Retalho ({calc.retailDecomposition.retailUnit})</span>
                          <span className="text-slate-400 font-normal">{calc.retailDecomposition.totalRetailUnits} unid. no lote</span>
                        </p>
                        <div className="flex justify-between text-slate-300 text-[11px]">
                          <span>Custo Unitário (SEM IVA)</span>
                          <strong className="font-mono">{formatMoney(calc.retailDecomposition.costPerRetailUnitNet)}</strong>
                        </div>
                        <div className="flex justify-between text-cyan-300 text-[11px] font-bold">
                          <span>Preço Unitário de Venda (SEM IVA)</span>
                          <strong className="font-mono">{formatMoney(calc.retailDecomposition.pvpBasePerRetailUnit)}</strong>
                        </div>
                        <div className="flex justify-between text-indigo-300 text-[11px]">
                          <span>(+) IVA Unitário ({vatRate}%)</span>
                          <strong className="font-mono">+{formatMoney(calc.retailDecomposition.vatPerRetailUnit)}</strong>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400 text-xs font-bold pt-1 border-t border-slate-800">
                          <span>(=) PVP Unitário a Retalho (COM IVA)</span>
                          <strong className="font-mono text-sm">{formatMoney(calc.retailDecomposition.pvpFinalPerRetailUnit)}</strong>
                        </div>
                        <div className="flex justify-between text-emerald-300 text-[11px] pt-0.5">
                          <span>Lucro Líquido Real Unitário</span>
                          <strong className="font-mono">{formatMoney(calc.retailDecomposition.netProfitPerRetailUnit)}</strong>
                        </div>
                      </div>
                    )}

                    {/* Section 2: Deductions and Net Received */}
                    <div className="bg-[#0F172A] p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        2. Deduções Diretas & Impostos ({country.agency})
                      </p>
                      {calc.tpaCost > 0 && (
                        <div className="flex justify-between text-rose-400">
                          <span>(-) Taxa Multicaixa / TPA ({tpaRate}%)</span>
                          <strong className="font-mono">- {formatMoney(calc.tpaCost)}</strong>
                        </div>
                      )}
                      {calc.extras?.hasExtras && calc.totalInputVatSupported > 0 && (
                        <div className="flex justify-between text-emerald-400/90 text-[11px]">
                          <span>[i] Crédito IVA Suportado (Compras+Extras)</span>
                          <span className="font-mono">({formatMoney(calc.totalInputVatSupported)})</span>
                        </div>
                      )}
                      <div className="flex justify-between text-rose-400">
                        <span>(-) IVA Líquido a Pagar ao Fisco</span>
                        <strong className="font-mono">- {formatMoney(calc.netVatToPay)}</strong>
                      </div>
                      <div className="flex justify-between text-rose-400">
                        <span>(-) Imposto Industrial ({country.ii}%)</span>
                        <strong className="font-mono">- {formatMoney(calc.incomeTax)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit Banner */}
                  <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-emerald-400 block">
                        LUCRO LÍQUIDO REAL
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Livre de mercadoria, taxas e impostos
                      </span>
                    </div>
                    <strong className="text-base font-bold font-mono text-emerald-400">
                      {formatMoney(calc.netProfit)}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mandatory Accountant Disclaimer */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Aviso Legal Nanucloud:</strong> A utilização deste simulador tem caráter informativo e estimativo, <strong>não dispensando a consulta de um profissional de contas</strong> ou contabilista certificado.
        </span>
      </div>

      {/* Google AdSense Monetization Banner (Only displayed in Free/Guest Mode) */}
      {(!user || user.queriesRemaining <= 3) && (
        <div className="bg-[#0F172A] border border-dashed border-slate-800 rounded-xl p-4 text-center space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>PUBLICIDADE PATROCINADA</span>
            <span>GOOGLE ADSENSE (MODO GRATUITO)</span>
          </div>
          <div className="h-20 bg-slate-900/50 rounded-lg flex flex-col items-center justify-center border border-slate-800/40 text-slate-500 text-xs font-mono">
            <span className="text-slate-400 font-bold">NANUCLOUD</span>
            <span className="text-[11px] text-slate-600">Espaço publicitário reservado • Desativação automática para contas com planos ativos</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal before calculating results */}
      <ConfirmSimulationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndExecute}
        moduleName="Comércio Local / Venda de Bens"
        title="Confirmar Simulação de Preços"
        subtitle="Reveja a composição de custo, taxas e margem antes de processar os cenários oficiais."
        summaryItems={simulationSummaryItems}
        userQueriesRemaining={user ? (user.queriesRemaining || 0) : getGuestCredits()}
        isStaffOrAdmin={user?.role === 'staff' || user?.role === 'admin' || user?.role === 'admin_level1' || user?.role === 'admin_level2' || user?.role === 'super_admin'}
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
    </div>
  );
};
