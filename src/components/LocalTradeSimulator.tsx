import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  Beer,
  GlassWater
} from 'lucide-react';
import {
  exportSimulationDossierPDF,
  exportSimulationDossierExcel
} from '../utils/exportDocumentUtils';
import { useLayoutMode } from '../data/layoutMode';
import { ClientCreditNoticeBanner } from './ClientCreditNoticeBanner';
import { canUserSimulate } from '../utils/accessControl';
import { ConfirmSimulationModal, SimulationSummaryItem } from './ConfirmSimulationModal';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';
import { NumericInput } from './common/NumericInput';
import { parseFormattedNumber, formatPtNumber } from '../utils/numberFormat';
import { showToast } from '../context/NotificationContext';

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
  const [costNet, setCostNet] = useState<string>('');
  const [costGross, setCostGross] = useState<string>('');
  const [marginPct, setMarginPct] = useState<string>('25');
  const [fixedPrice, setFixedPrice] = useState<string>('');
  const [pricingMode, setPricingMode] = useState<'margin' | 'desired_profit' | 'fixed_price'>('margin');
  const [desiredProfit, setDesiredProfit] = useState<string>('');
  const [desiredProfitType, setDesiredProfitType] = useState<'gross' | 'net'>('gross');
  const [fixedPriceType, setFixedPriceType] = useState<'with_vat' | 'without_vat'>('with_vat');
  const [productName, setProductName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationResults, setCalculationResults] = useState<any[] | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-dismiss messages after a delay so notifications disappear
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Optional Logistics & Acquisition Expenses (Custos Reais de Aquisição - NÃO LUCROS)
  const [showExtrasSection, setShowExtrasSection] = useState<boolean>(false);
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
  const [otherExtrasLabel, setOtherExtrasLabel] = useState<string>('');
  const [otherExtrasTaxMode, setOtherExtrasTaxMode] = useState<'without_vat' | 'with_vat' | 'exempt'>('without_vat');
  const [otherExtrasVatRate, setOtherExtrasVatRate] = useState<number>(14);

  // Bulk vs Retail Packaging Simulation (Compra a Grosso vs Venda a Retalho)
  const [enableBulkRetail, setEnableBulkRetail] = useState<boolean>(false);
  const [bulkQuantity, setBulkQuantity] = useState<string>('1');
  const [bulkUnit, setBulkUnit] = useState<string>('Caixas');
  const [retailUnitsPerBulk, setRetailUnitsPerBulk] = useState<string>('24');
  const [retailUnit, setRetailUnit] = useState<string>('Garrafas/Latas');
  const [bulkCostMode, setBulkCostMode] = useState<'lot_total' | 'per_bulk'>('per_bulk');
  const [bulkMarginPct, setBulkMarginPct] = useState<string>('');
  const [retailMarginPct, setRetailMarginPct] = useState<string>('');

  // Draft Beer Keg Special Settings (Barril de Fino / Chopp)
  const [isBeerKegMode, setIsBeerKegMode] = useState<boolean>(false);
  const [kegLiters, setKegLiters] = useState<string>('50'); // 50L, 30L, 20L
  const [glassSizeMl, setGlassSizeMl] = useState<string>('330'); // 330ml, 250ml, 500ml
  const [foamLossPct, setFoamLossPct] = useState<string>('6'); // 6% perda técnica de espuma

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
        recalcGrossFromNet(parseFormattedNumber(costNet), defaultVat);
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
    setCostGross(formatPtNumber(gross, 3, false));
  };

  const handleNetInput = (val: string) => {
    setCostNet(val);
    clearFieldError('costNet');
    clearFieldError('pricing');
    const num = parseFormattedNumber(val);
    if (num <= 0) {
      setCostGross('');
      return;
    }
    recalcGrossFromNet(num, vatRate);
  };

  const handleGrossInput = (val: string) => {
    setCostGross(val);
    clearFieldError('costGross');
    clearFieldError('pricing');
    const num = parseFormattedNumber(val);
    if (num <= 0) {
      setCostNet('');
      return;
    }
    const net = num / (1 + vatRate / 100);
    setCostNet(formatPtNumber(net, 3, false));
  };

  const handleVatChange = (newVat: number) => {
    setVatRate(newVat);
    clearFieldError('vatRate');
    setCalculationResults(null);
    setSuccessMessage(null);
    if (costNet) {
      const net = parseFormattedNumber(costNet);
      recalcGrossFromNet(net, newVat);
    }
  };

  const formatMoney = (val: number) => {
    return (
      new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
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

  // Helper presets for Bulk vs Retail and Draft Beer Kegs
  const applyBeerKegSettings = (liters: string, glassMl: string, foamPct: string) => {
    const l = parseFormattedNumber(liters) || 50;
    const g = parseFormattedNumber(glassMl) || 330;
    const f = Math.max(0, Math.min(30, parseFormattedNumber(foamPct) || 0));
    const usableLiters = l * (1 - f / 100);
    const finosCount = Math.floor((usableLiters * 1000) / Math.max(50, g));

    setIsBeerKegMode(true);
    setKegLiters(liters);
    setGlassSizeMl(glassMl);
    setFoamLossPct(foamPct);
    setBulkUnit(`Barril (${liters}L)`);
    setRetailUnit(`Finos (${glassMl}ml)`);
    setRetailUnitsPerBulk(finosCount.toString());
    if (!bulkQuantity || parseFormattedNumber(bulkQuantity) <= 0) {
      setBulkQuantity('1');
    }
  };

  const applyBeerBoxPreset = () => {
    setIsBeerKegMode(false);
    setEnableBulkRetail(true);
    setBulkQuantity('1');
    setBulkUnit('Caixas');
    setRetailUnitsPerBulk('24');
    setRetailUnit('Garrafas/Latas');
    setBulkCostMode('per_bulk');
    if (!productName || productName === 'Artigo Comercial') {
      setProductName('Caixa de Cerveja (24 Unidades)');
    }
  };

  const applyBeerKegPreset = (liters: '50' | '30' = '50') => {
    setEnableBulkRetail(true);
    setBulkCostMode('per_bulk');
    setBulkQuantity('1');
    if (liters === '50') {
      applyBeerKegSettings('50', '330', '6');
      if (!productName || productName === 'Artigo Comercial') {
        setProductName('Barril de Fino / Chope (50 Litros)');
      }
    } else {
      applyBeerKegSettings('30', '330', '6');
      if (!productName || productName === 'Artigo Comercial') {
        setProductName('Barril de Fino / Chope (30 Litros)');
      }
    }
  };

  const applyPackagePreset = () => {
    setIsBeerKegMode(false);
    setEnableBulkRetail(true);
    setBulkQuantity('1');
    setBulkUnit('Fardos');
    setRetailUnitsPerBulk('12');
    setRetailUnit('Unidades');
    setBulkCostMode('per_bulk');
    if (!productName || productName === 'Artigo Comercial') {
      setProductName('Fardo de Produto (12 Unidades)');
    }
  };

  const applyBulkBagPreset = () => {
    setIsBeerKegMode(false);
    setEnableBulkRetail(true);
    setBulkQuantity('1');
    setBulkUnit('Sacos');
    setRetailUnitsPerBulk('50');
    setRetailUnit('Quilos (Kg)');
    setBulkCostMode('per_bulk');
    if (!productName || productName === 'Artigo Comercial') {
      setProductName('Saco de 50 Kg (Venda a Granel)');
    }
  };

  const applyLogisticsExpensesPreset = () => {
    setShowExtrasSection(true);
    setTransportCost('5.000,000');
    setTransportRoundTrip(true);
    setMealsCost('3.000,000');
    setLodgingCost('12.000,000');
    setLodgingDays('1');
    setOtherExtrasCost('2.000,000');
    setOtherExtrasLabel('Carga, Descarga e Portagens');
  };

  const getEffectiveExtraCosts = () => {
    const tRawUnit = parseFormattedNumber(transportCost);
    const tVal = tRawUnit * (transportRoundTrip ? 2 : 1);
    const mVal = parseFormattedNumber(mealsCost);
    
    const lDaily = parseFormattedNumber(lodgingCost);
    const lDays = Math.max(1, parseInt(lodgingDays) || 1);
    const lVal = lodgingCost ? (lDaily * lDays) : 0;

    const oVal = parseFormattedNumber(otherExtrasCost);

    const transport = computeItemTax(tVal, transportTaxMode, transportVatRate);
    const meals = computeItemTax(mVal, mealsTaxMode, mealsVatRate);
    const lodging = computeItemTax(lVal, lodgingTaxMode, lodgingVatRate);
    const otherExtras = computeItemTax(oVal, otherExtrasTaxMode, otherExtrasVatRate);

    const totalExtraNet = transport.net + meals.net + lodging.net + otherExtras.net;
    const totalExtraVat = transport.vat + meals.vat + lodging.vat + otherExtras.vat;
    const totalExtraPaid = transport.total + meals.total + lodging.total + otherExtras.total;

    // Inclusion / Absorption percentages for price formation
    const tPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFormattedNumber(transportInclusionPct) || 0)) : 100;
    const mPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFormattedNumber(mealsInclusionPct) || 0)) : 100;
    const lPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFormattedNumber(lodgingInclusionPct) || 0)) : 100;
    const oPct = enableCostAbsorption ? Math.max(0, Math.min(100, parseFormattedNumber(otherExtrasInclusionPct) || 0)) : 100;

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
    extraBreakdown?: ReturnType<typeof getEffectiveExtraCosts>,
    options?: {
      mode?: 'margin' | 'desired_profit' | 'fixed_price';
      desiredProfitVal?: number;
      desiredProfitType?: 'gross' | 'net';
      fixedPriceType?: 'with_vat' | 'without_vat';
    }
  ) => {
    const extras = extraBreakdown || getEffectiveExtraCosts();

    // Determine base merchandise cost (handling per-box vs lot-total when bulk is enabled)
    const bQty = Math.max(1, parseFormattedNumber(bulkQuantity) || 1);
    const rUnitsPerB = Math.max(1, parseFormattedNumber(retailUnitsPerBulk) || 1);
    const totalRetailUnits = enableBulkRetail ? (bQty * rUnitsPerB) : 1;

    let baseMerchandiseCostNet = cNet;
    if (enableBulkRetail && bulkCostMode === 'per_bulk') {
      baseMerchandiseCostNet = cNet * bQty;
    }

    // Price base uses passed extra costs (or total if absorption is disabled)
    const priceFormingCostNet = baseMerchandiseCostNet + extras.totalExtraNetPassedToPrice;
    const totalRealAcquisitionCostNet = baseMerchandiseCostNet + extras.totalExtraNet;

    let pvpBase = 0;
    let pvpFinal = 0;
    let vatSale = 0;
    let profitBeforeTax = 0;
    let actualMargin = 0;

    const currentMode = options?.mode || (fixPrice > 0 ? 'fixed_price' : ((options?.desiredProfitVal || 0) > 0 ? 'desired_profit' : 'margin'));

    if (currentMode === 'desired_profit' && (options?.desiredProfitVal || 0) > 0) {
      const dVal = options!.desiredProfitVal!;
      if (options?.desiredProfitType === 'net') {
        const operatingProfitTarget = dVal / Math.max(0.01, 1 - iiRate / 100);
        const tpaFactor = (1 + vRate / 100) * (tRate / 100);
        const denom = Math.max(0.01, 1 - tpaFactor);
        profitBeforeTax = (operatingProfitTarget + (priceFormingCostNet * tpaFactor) + extras.totalExtraNetAbsorbed) / denom;
        pvpBase = priceFormingCostNet + profitBeforeTax;
        vatSale = pvpBase * (vRate / 100);
        pvpFinal = pvpBase + vatSale;
      } else {
        profitBeforeTax = dVal;
        pvpBase = priceFormingCostNet + profitBeforeTax;
        vatSale = pvpBase * (vRate / 100);
        pvpFinal = pvpBase + vatSale;
      }
      actualMargin = priceFormingCostNet > 0 ? (profitBeforeTax / priceFormingCostNet) * 100 : 0;
    } else if (currentMode === 'fixed_price' && fixPrice > 0) {
      if (options?.fixedPriceType === 'without_vat') {
        pvpBase = fixPrice;
        vatSale = pvpBase * (vRate / 100);
        pvpFinal = pvpBase + vatSale;
        profitBeforeTax = pvpBase - priceFormingCostNet;
      } else {
        pvpFinal = fixPrice;
        pvpBase = pvpFinal / (1 + vRate / 100);
        vatSale = pvpFinal - pvpBase;
        profitBeforeTax = pvpBase - priceFormingCostNet;
      }
      actualMargin = priceFormingCostNet > 0 ? (profitBeforeTax / priceFormingCostNet) * 100 : 0;
    } else {
      profitBeforeTax = priceFormingCostNet * (mPct / 100);
      pvpBase = priceFormingCostNet + profitBeforeTax;
      vatSale = pvpBase * (vRate / 100);
      pvpFinal = pvpBase + vatSale;
      actualMargin = mPct;
    }

    const merchandiseVatCost = baseMerchandiseCostNet * (vRate / 100);
    const costGross = baseMerchandiseCostNet + merchandiseVatCost;
    const totalInputVatSupported = merchandiseVatCost + extras.totalExtraVat;
    const effectiveCostGross = totalRealAcquisitionCostNet + totalInputVatSupported;

    const netVatToPay = Math.max(0, vatSale - totalInputVatSupported);
    const tpaCost = pvpFinal * (tRate / 100);
    
    // Operating profit deducts absorbed logistics if any
    const operatingProfit = profitBeforeTax - tpaCost - extras.totalExtraNetAbsorbed;
    const incomeTax = operatingProfit > 0 ? operatingProfit * (iiRate / 100) : 0;
    const netProfit = operatingProfit - incomeTax;

    // Bulk vs Retail Unit decomposition
    const bMargin = bulkMarginPct !== '' ? (parseFormattedNumber(bulkMarginPct) || actualMargin) : actualMargin;
    const rMargin = retailMarginPct !== '' ? (parseFormattedNumber(retailMarginPct) || (actualMargin > 0 ? actualMargin + 10 : 35)) : (actualMargin > 0 ? actualMargin + 10 : 35);

    // Wholesale (Venda a Grosso - por Caixa / Lote)
    const costPerBulkNet = totalRealAcquisitionCostNet / bQty;
    const costPerBulkGross = (totalRealAcquisitionCostNet + totalInputVatSupported) / bQty;
    const bulkProfitBeforeTax = costPerBulkNet * (bMargin / 100);
    const bulkPvpBase = costPerBulkNet + bulkProfitBeforeTax;
    const bulkVat = bulkPvpBase * (vRate / 100);
    const bulkPvpFinal = bulkPvpBase + bulkVat;
    const bulkTpa = bulkPvpFinal * (tRate / 100);
    const bulkOperatingProfit = bulkProfitBeforeTax - bulkTpa;
    const bulkII = bulkOperatingProfit > 0 ? bulkOperatingProfit * (iiRate / 100) : 0;
    const bulkNetProfit = bulkOperatingProfit - bulkII;

    const bulkTotalSalesNet = bulkPvpBase * bQty;
    const bulkTotalSalesGross = bulkPvpFinal * bQty;
    const bulkTotalProfitBeforeTax = bulkProfitBeforeTax * bQty;
    const bulkTotalNetProfit = bulkNetProfit * bQty;

    // Retail (Venda a Retalho - por Unidade individual)
    const costPerRetailUnitNet = totalRealAcquisitionCostNet / totalRetailUnits;
    const costPerRetailUnitGross = (totalRealAcquisitionCostNet + totalInputVatSupported) / totalRetailUnits;
    const retailProfitBeforeTax = costPerRetailUnitNet * (rMargin / 100);
    const retailPvpBase = costPerRetailUnitNet + retailProfitBeforeTax;
    const retailVat = retailPvpBase * (vRate / 100);
    const retailPvpFinal = retailPvpBase + retailVat;
    const retailTpa = retailPvpFinal * (tRate / 100);
    const retailOperatingProfit = retailProfitBeforeTax - retailTpa;
    const retailII = retailOperatingProfit > 0 ? retailOperatingProfit * (iiRate / 100) : 0;
    const retailNetProfit = retailOperatingProfit - retailII;

    const retailTotalSalesNet = retailPvpBase * totalRetailUnits;
    const retailTotalSalesGross = retailPvpFinal * totalRetailUnits;
    const retailTotalProfitBeforeTax = retailProfitBeforeTax * totalRetailUnits;
    const retailTotalNetProfit = retailNetProfit * totalRetailUnits;

    const extraRevenueAtRetail = retailTotalSalesGross - bulkTotalSalesGross;
    const extraProfitAtRetail = retailTotalNetProfit - bulkTotalNetProfit;

    const retailDecomposition = {
      isEnabled: enableBulkRetail,
      isBeerKegMode,
      kegLiters,
      glassSizeMl,
      foamLossPct,
      bulkCostMode,
      bulkQty: bQty,
      bulkUnit: bulkUnit || 'Caixas',
      bulkMargin: bMargin,
      retailUnitsPerBulk: rUnitsPerB,
      retailUnit: retailUnit || 'Unidades',
      retailMargin: rMargin,
      totalRetailUnits,
      // Grosso
      costPerBulkNet,
      costPerBulkGross,
      bulkProfitBeforeTax,
      bulkPvpBase,
      bulkVat,
      bulkPvpFinal,
      bulkNetProfit,
      bulkTotalSalesNet,
      bulkTotalSalesGross,
      bulkTotalProfitBeforeTax,
      bulkTotalNetProfit,
      // Retalho
      costPerRetailUnitNet,
      costPerRetailUnitGross,
      retailProfitBeforeTax,
      retailPvpBase,
      retailVat,
      retailPvpFinal,
      retailNetProfit,
      retailTotalSalesNet,
      retailTotalSalesGross,
      retailTotalProfitBeforeTax,
      retailTotalNetProfit,
      // Comparativo
      extraRevenueAtRetail,
      extraProfitAtRetail
    };

    return {
      costNet: baseMerchandiseCostNet,
      costGross,
      merchandiseCostNet: baseMerchandiseCostNet,
      merchandiseVatCost,
      effectiveCostNet: totalRealAcquisitionCostNet,
      effectiveCostGross,
      totalEffectiveCostNet: priceFormingCostNet,
      totalRealAcquisitionCostNet,
      extras,
      totalInputVatSupported,
      vatCost: totalInputVatSupported,
      profit: profitBeforeTax,
      profitBeforeTax,
      marginApplied: actualMargin,
      pvpBase,
      pvpFinal,
      vatSale,
      netVatToPay,
      tpaCost,
      incomeTax,
      netProfit,
      pricingMode: currentMode,
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

  const handleRequestCalculate = (overrideMargin?: string, overrideFixedPrice?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeMargin = overrideMargin !== undefined ? overrideMargin : marginPct;
    const activeFixedPrice = overrideFixedPrice !== undefined ? overrideFixedPrice : fixedPrice;

    const errors: Record<string, string> = {};
    const net = parseFormattedNumber(costNet);
    const fPrice = parseFormattedNumber(activeFixedPrice);
    const dProfit = parseFormattedNumber(desiredProfit);

    if (!costNet || costNet.trim() === '') {
      errors.costNet = 'Campo obrigatório: introduza o Preço de Custo Base (SEM IVA).';
    } else if (isNaN(net) || net <= 0) {
      errors.costNet = 'O Preço de Custo deve ser um número positivo superior a 0.';
    }

    let finalMargin = activeMargin;
    if (pricingMode === 'desired_profit') {
      if (!desiredProfit || isNaN(dProfit) || dProfit <= 0) {
        errors.pricing = 'Introduza o valor do lucro pretendido (superior a zero).';
      }
    } else if (pricingMode === 'fixed_price') {
      if (!activeFixedPrice || isNaN(fPrice) || fPrice <= 0) {
        errors.pricing = 'Introduza o Preço de Venda Pretendido (PVP superior a zero).';
      }
    } else {
      if (finalMargin === '' && activeFixedPrice === '') {
        finalMargin = '25';
        setMarginPct('25');
      }
    }

    if (isNaN(tpaRate) || tpaRate < 0 || tpaRate > 100) {
      errors.tpaRate = 'A taxa TPA deve situar-se entre 0% e 100%.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Existem campos sem preenchimento ou com valores incorretos.');
      showToast({
        type: 'error',
        title: 'Validação',
        message: 'Existem campos sem preenchimento ou com valores incorretos.'
      });
      return;
    }

    setFieldErrors({});

    // AUTH & RBAC SIMULATION CHECK
    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      showToast({
        type: 'warning',
        title: 'Limite Atingido',
        message: simCheck.message
      });
      setShowExhaustedModal(true);
      return;
    }

    // Execute calculation directly without blocking confirmation modal
    executeCalculation(finalMargin, activeFixedPrice);
  };

  const executeCalculation = async (mPctStr: string, fPriceStr: string) => {
    setIsCalculating(true);
    setErrorMessage(null);

    const net = parseFormattedNumber(costNet);
    const fPrice = parseFormattedNumber(fPriceStr);
    const mPct = parseFormattedNumber(mPctStr);
    const dProfit = parseFormattedNumber(desiredProfit);

    try {
      let remaining = user?.queriesRemaining ?? 0;
      try {
        const res = await fetch('/api/simulator/calculate-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user && user.id !== 'visitante_anonimo' ? user.id : undefined,
            countryCode,
            costNet: net,
            vatRate,
            tpaRate,
            pricingMode,
            marginPct: mPct,
            fixedFinalPrice: fPrice,
            desiredProfit: dProfit,
            desiredProfitType,
            fixedPriceType,
            productName,
            notes,
            transportCost: parseFormattedNumber(transportCost) || 0,
            transportRoundTrip,
            transportTaxMode,
            transportVatRate,
            mealsCost: parseFormattedNumber(mealsCost) || 0,
            mealsTaxMode,
            mealsVatRate,
            lodgingCost: parseFormattedNumber(lodgingCost) || 0,
            lodgingDays: Math.max(1, parseInt(lodgingDays) || 1),
            lodgingTaxMode,
            lodgingVatRate,
            otherExtrasCost: parseFormattedNumber(otherExtrasCost) || 0,
            otherExtrasLabel,
            otherExtrasTaxMode,
            otherExtrasVatRate
          })
        });

        if (res.ok) {
          const data = await res.json();
          remaining = data.queriesRemaining;
        } else if (res.status === 402) {
          const data = await res.json();
          setErrorMessage(data.error);
          showToast({
            type: 'warning',
            title: 'Subscrição',
            message: data.error || 'Saldo de consultas esgotado. Aceda aos Planos.'
          });
          onOpenPlans();
          setIsCalculating(false);
          return;
        } else {
          remaining = Math.max(0, (user?.queriesRemaining || 0) - 1);
        }
      } catch (err) {
        remaining = Math.max(0, (user?.queriesRemaining || 0) - 1);
      }

      const currentExtras = getEffectiveExtraCosts();
      const scenarios = [];

      let customCalc;
      let customTitle = `Cenário Personalizado (${productName || 'Artigo'})`;

      if (pricingMode === 'desired_profit' && dProfit > 0) {
        customCalc = processMathScenario(
          net,
          0,
          0,
          vatRate,
          tpaRate,
          country.ii,
          currentExtras,
          {
            mode: 'desired_profit',
            desiredProfitVal: dProfit,
            desiredProfitType
          }
        );
        customTitle = `Lucro Desejado: ${formatMoney(dProfit)} (${desiredProfitType === 'net' ? 'Líquido COM Imposto' : 'Bruto SEM Imposto'})`;
      } else if (pricingMode === 'fixed_price' && fPrice > 0) {
        customCalc = processMathScenario(
          net,
          0,
          fPrice,
          vatRate,
          tpaRate,
          country.ii,
          currentExtras,
          {
            mode: 'fixed_price',
            fixedPriceType
          }
        );
        customTitle = `Preço Pretendido: ${formatMoney(fPrice)} (${fixedPriceType === 'without_vat' ? 'SEM Imposto' : 'COM Imposto'})`;
      } else {
        const m = mPct > 0 ? mPct : 25;
        customCalc = processMathScenario(
          net,
          m,
          0,
          vatRate,
          tpaRate,
          country.ii,
          currentExtras,
          { mode: 'margin' }
        );
        customTitle = `Margem Personalizada (${m}%)`;
      }

      scenarios.push({
        title: customTitle,
        calc: customCalc,
        isCustom: true
      });

      country.margins.forEach((m) => {
        const stdCalc = processMathScenario(net, m, 0, vatRate, tpaRate, country.ii, currentExtras, { mode: 'margin' });
        scenarios.push({
          title: `Margem Padrão (${m}%)`,
          calc: stdCalc,
          isCustom: false
        });
      });

      setCalculationResults(scenarios);
      setSuccessMessage('Cálculo e simulação de margens concluídos com sucesso!');
      showToast({
        type: 'success',
        title: 'Cálculo Concluído',
        message: 'Cálculo e simulação de margens concluídos com sucesso!'
      });

      if (user && user.id !== 'visitante_anonimo') {
        onCalculationDone(remaining);
      } else {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMessage('Falha ao processar simulação.');
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao processar simulação.'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmAndExecute = async () => {
    setShowConfirmModal(false);
    await executeCalculation(marginPct || '25', fixedPrice);
  };

  // Results are strictly shown ONLY after user clicks the button and confirms the simulation
  const activeResults = calculationResults;
  const currentExtras = getEffectiveExtraCosts();

  const netNum = parseFormattedNumber(costNet);
  const fPriceNum = parseFormattedNumber(fixedPrice);
  const grossNum = parseFormattedNumber(costGross);

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

  if (enableBulkRetail && parseFormattedNumber(bulkQuantity) > 0) {
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
      { label: 'IVA Liquidado na Faturação / Venda', amount: calc.vatSale, rateOrMargin: `${vatRate}%`, fiscalDestiny: country.agency },
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
              <NumericInput
                value={tpaRate}
                onChange={(val) => {
                  setTpaRate(val);
                  clearFieldError('tpaRate');
                }}
                placeholder="0"
                maxDecimals={3}
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
                <NumericInput
                  value={costNet}
                  onChange={(val) => handleNetInput(val)}
                  placeholder={`Ex: 10.000,000 (${country.curr})`}
                  maxDecimals={3}
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
                <NumericInput
                  value={costGross}
                  onChange={(val) => handleGrossInput(val)}
                  placeholder={`Ex: 11.400,000 (${country.curr})`}
                  maxDecimals={3}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            {/* Quadro Dinâmico: Custo com Imposto e sem Imposto */}
            {netNum > 0 && (
              <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    Discriminação do Custo de Compra: SEM Imposto vs COM Imposto
                  </span>
                  <span className="text-slate-400 font-mono">Taxa de IVA: {vatRate}%</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">1. Custo SEM Imposto (Base)</span>
                    <strong className="text-slate-100 text-sm block mt-0.5">{formatMoney(netNum)}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Base líquida real de compra</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-indigo-900/40">
                    <span className="text-indigo-400 block text-[10px] uppercase font-bold">2. IVA Suportado (+{vatRate}%)</span>
                    <strong className="text-indigo-300 text-sm block mt-0.5">+{formatMoney(netNum * (vatRate / 100))}</strong>
                    <span className="text-[9px] text-indigo-400/80 block mt-0.5">IVA pago ao fornecedor (recuperável/dedutível)</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-900/40">
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">3. Custo COM Imposto (Total Pago)</span>
                    <strong className="text-emerald-300 text-sm block mt-0.5">{formatMoney(netNum * (1 + vatRate / 100))}</strong>
                    <span className="text-[9px] text-emerald-400/80 block mt-0.5">Total faturado pelo fornecedor com IVA</span>
                  </div>
                </div>

                {currentExtras.hasExtras && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/30">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        + Despesas Logísticas (Transporte/Estadia/Alim.): <strong>{formatMoney(currentExtras.totalExtraNet)}</strong> SEM IVA | <strong>{formatMoney(currentExtras.totalExtraPaid)}</strong> COM IVA
                      </span>
                    </div>
                    <span className="font-bold text-amber-200 mt-1 sm:mt-0">
                      Custo Total Real de Aquisição: {formatMoney(netNum + currentExtras.totalExtraNet)} (SEM IVA) / {formatMoney((netNum * (1 + vatRate / 100)) + currentExtras.totalExtraPaid)} (COM IVA)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Secção 1: Custos de Transporte, Logística & Despesas de Aquisição (100% CUSTOS - NÃO LUCROS) */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3.5">
              <div className="p-3.5 bg-[#0B132B] rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200 font-mono uppercase tracking-wider">
                      Custos de Transporte, Logística & Despesas de Aquisição
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded font-bold w-fit flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-amber-400" />
                    100% CUSTOS - NÃO É LUCRO (Recuperação de Capital)
                  </span>
                </div>

                {/* Clarification alert: Expenses are purely costs, not profit */}
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-200/90 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="text-amber-300">Regra de Gestão Comercial:</strong> Transporte (Ida + Volta), Alimentação / Diárias, Estadia / Hospedaria (1 dia ou mais) e Outras Despesas de Aquisição são <strong>CUSTOS DE AQUISIÇÃO</strong> e <strong>NÃO LUCRO</strong>. O simulador soma-os integralmente ao preço da mercadoria para formar o Custo Efetivo Total; o seu lucro comercial só é apurado após recuperar 100% destas despesas.
                  </div>
                </div>

                {/* Quick preset button for logistics costs */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={applyLogisticsExpensesPreset}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Preencher Exemplo: Transporte Ida+Volta (5.000) + Alimentação (3.000) + Estadia 1 dia (12.000)</span>
                  </button>
                  {currentExtras.hasExtras && (
                    <button
                      type="button"
                      onClick={() => {
                        setTransportCost('');
                        setTransportRoundTrip(false);
                        setMealsCost('');
                        setLodgingCost('');
                        setLodgingDays('1');
                        setOtherExtrasCost('');
                        setOtherExtrasLabel('');
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-mono transition cursor-pointer"
                    >
                      Limpar Custos Logísticos
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* 1. Transporte */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Bus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Transporte (Ida + Volta)</span>
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
                          Valor {transportRoundTrip ? '(Por Viagem de Ida)' : ''}
                        </label>
                        <NumericInput
                          value={transportCost}
                          onChange={(val) => setTransportCost(val)}
                          placeholder={`0,000 (${country.curr})`}
                          maxDecimals={3}
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
                        <span>Alíquota IVA Transporte:</span>
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

                  {/* 2. Alimentação / Diárias */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span>Alimentação / Diárias</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Custo de Deslocação</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Valor Alimentação</label>
                        <NumericInput
                          value={mealsCost}
                          onChange={(val) => setMealsCost(val)}
                          placeholder={`0,000 (${country.curr})`}
                          maxDecimals={3}
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
                        <span>Alíquota IVA Alimentação:</span>
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

                  {/* 3. Estadia / Hospedaria (1 dia ou mais) */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Hotel className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Estadia / Hospedaria</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Total: {formatMoney((parseFormattedNumber(lodgingCost)) * Math.max(1, parseInt(lodgingDays) || 1))}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Preço / Noite</label>
                        <NumericInput
                          value={lodgingCost}
                          onChange={(val) => setLodgingCost(val)}
                          placeholder={`0,000 (${country.curr})`}
                          maxDecimals={3}
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
                        <span>Alíquota IVA Estadia:</span>
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

                  {/* 4. Outras Despesas de Aquisição */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                        <Package className="w-3.5 h-3.5 text-purple-400" />
                        <span>Outras Despesas de Aquisição</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Despesas Acessórias</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Valor</label>
                        <NumericInput
                          value={otherExtrasCost}
                          onChange={(val) => setOtherExtrasCost(val)}
                          placeholder={`0,000 (${country.curr})`}
                          maxDecimals={3}
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
                  <div className="bg-slate-950 border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                        Consolidação Efetiva dos Custos de Aquisição:
                      </span>
                      <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Mercadoria: <strong className="text-slate-100 font-bold">{formatMoney(parseFormattedNumber(costNet))}</strong></span>
                        <span>+ Logística/Extras: <strong className="text-amber-300 font-bold">{formatMoney(currentExtras.totalExtraNet)}</strong></span>
                        <span>(=) CUSTO EFETIVO TOTAL: <strong className="text-emerald-400 font-bold">{formatMoney(parseFormattedNumber(costNet) + currentExtras.totalExtraNet)}</strong></span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        (Recuperação integral de custos de transporte, estadia e alimentação antes do apuramento de lucro)
                      </span>
                    </div>
                    <div className="text-right sm:self-center bg-indigo-500/10 px-3 py-1.5 rounded border border-indigo-500/20">
                      <span className="text-[10px] text-slate-400 block">IVA Dedutível Suportado:</span>
                      <span className="text-xs font-bold text-indigo-300 font-mono">
                        {formatMoney((parseFormattedNumber(costNet) * (vatRate / 100)) + currentExtras.totalExtraVat)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Secção 2: Simular Compra a Grosso vs Venda a Retalho & Unidades de Medida */}
              <div className="p-3.5 bg-[#0B132B] rounded-xl border border-indigo-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableBulkRetail}
                      onChange={(e) => setEnableBulkRetail(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-100 font-mono flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Simular Compra a Grosso vs Venda a Retalho & Unidades de Medida
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded font-bold w-fit">
                    {enableBulkRetail ? 'Módulo Ativado' : 'Clique para Ativar'}
                  </span>
                </div>

                {/* Quick Selection Presets: Beer Box, Draft Beer Keg, Packages, Bulk Bags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Predefinições Rápidas:
                  </span>
                  <button
                    type="button"
                    onClick={applyBeerBoxPreset}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      !isBeerKegMode && enableBulkRetail && bulkUnit === 'Caixas'
                        ? 'bg-amber-500/30 text-amber-200 border-amber-500/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>🍺</span>
                    <span>Caixa de Cerveja (24 Garrafas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyBeerKegPreset('50')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isBeerKegMode && kegLiters === '50'
                        ? 'bg-amber-500/30 text-amber-200 border-amber-500/60 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>🍻</span>
                    <span>Barril de Fino (50L / 330ml)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyBeerKegPreset('30')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isBeerKegMode && kegLiters === '30'
                        ? 'bg-amber-500/30 text-amber-200 border-amber-500/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>🍻</span>
                    <span>Barril de Fino (30L / 330ml)</span>
                  </button>

                  <button
                    type="button"
                    onClick={applyPackagePreset}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      !isBeerKegMode && bulkUnit === 'Fardos'
                        ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>📦</span>
                    <span>Fardo (12 Unid.)</span>
                  </button>

                  <button
                    type="button"
                    onClick={applyBulkBagPreset}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      !isBeerKegMode && bulkUnit === 'Sacos'
                        ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>🌾</span>
                    <span>Saco 50 Kg (ao Granel)</span>
                  </button>
                </div>

                {enableBulkRetail && (
                  <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                    <p className="text-[11px] text-slate-300 font-mono">
                      Defina as quantidades de compra no lote a grosso (ex: caixa de cerveja, fardo ou barril de fino) e o desdobramento por unidades de venda a retalho para calcular o preço unitário, o lucro por unidade a retalho e o lucro geral do lote.
                    </p>

                    {/* Specialized Draft Beer / Barril de Fino Configuration Panel */}
                    {isBeerKegMode && (
                      <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-200 font-mono uppercase flex items-center gap-1.5">
                            <Beer className="w-4 h-4 text-amber-400" />
                            Configuração Especial de Barril de Fino / Chope
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsBeerKegMode(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 underline font-mono cursor-pointer"
                          >
                            Voltar para Embalagem Padrão
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Capacidade do Barril</label>
                            <div className="flex gap-1.5">
                              {['20', '30', '50'].map((liters) => (
                                <button
                                  key={liters}
                                  type="button"
                                  onClick={() => applyBeerKegSettings(liters, glassSizeMl, foamLossPct)}
                                  className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition ${
                                    kegLiters === liters
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                                  }`}
                                >
                                  {liters} Litros
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Tamanho do Copo de Fino</label>
                            <div className="flex gap-1.5">
                              {[
                                { ml: '250', label: '250 ml' },
                                { ml: '330', label: '330 ml' },
                                { ml: '500', label: '500 ml' }
                              ].map((glass) => (
                                <button
                                  key={glass.ml}
                                  type="button"
                                  onClick={() => applyBeerKegSettings(kegLiters, glass.ml, foamLossPct)}
                                  className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition ${
                                    glassSizeMl === glass.ml
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                                  }`}
                                >
                                  {glass.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Perda Técnica / Espuma</label>
                            <div className="flex gap-1.5">
                              {['0', '5', '6', '10'].map((foam) => (
                                <button
                                  key={foam}
                                  type="button"
                                  onClick={() => applyBeerKegSettings(kegLiters, glassSizeMl, foam)}
                                  className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition ${
                                    foamLossPct === foam
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                                  }`}
                                >
                                  {foam}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Real-time yield notification */}
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-mono text-amber-200 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <GlassWater className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              <strong>Rendimento Líquido:</strong> 1 Barril de {kegLiters}L ({((parseFormattedNumber(kegLiters) || 50) * (1 - (parseFormattedNumber(foamLossPct) || 6) / 100)).toFixed(1)}L úteis) = <strong>{retailUnitsPerBulk} copos de fino ({glassSizeMl}ml)</strong> servidos!
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mode selector: Is the costNet the total lot cost or the cost per bulk unit? */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2">
                      <label className="text-[11px] font-bold text-slate-200 font-mono block">
                        O Preço de Custo Base introduzido no Campo 1 refere-se a:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${bulkCostMode === 'per_bulk' ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-100' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                          <input
                            type="radio"
                            name="bulkCostMode"
                            value="per_bulk"
                            checked={bulkCostMode === 'per_bulk'}
                            onChange={() => setBulkCostMode('per_bulk')}
                            className="text-indigo-600 focus:ring-0"
                          />
                          <span className="text-xs font-mono font-medium">Custo UNITÁRIO por {bulkUnit || 'Lote/Caixa'} (ex: valor de 1 caixa ou 1 barril)</span>
                        </label>
                        <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${bulkCostMode === 'lot_total' ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-100' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                          <input
                            type="radio"
                            name="bulkCostMode"
                            value="lot_total"
                            checked={bulkCostMode === 'lot_total'}
                            onChange={() => setBulkCostMode('lot_total')}
                            className="text-indigo-600 focus:ring-0"
                          />
                          <span className="text-xs font-mono font-medium">Custo TOTAL de todo o Lote (ex: valor da compra inteira de várias caixas)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Qtd. Compra a Grosso</label>
                        <NumericInput
                          value={bulkQuantity}
                          onChange={(val) => setBulkQuantity(val)}
                          placeholder="Ex: 1"
                          maxDecimals={3}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Unidade do Lote (Grosso)</label>
                        <select
                          value={bulkUnit}
                          onChange={(e) => {
                            setBulkUnit(e.target.value);
                            if (e.target.value.includes('Barril')) {
                              setIsBeerKegMode(true);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        >
                          <option value="Caixas">Caixas (ex: 24 garrafas/latas)</option>
                          <option value="Barril (50L)">Barril (50 Litros)</option>
                          <option value="Barril (30L)">Barril (30 Litros)</option>
                          <option value="Barril (20L)">Barril (20 Litros)</option>
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
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Unidades por Lote / Caixa</label>
                        <NumericInput
                          value={retailUnitsPerBulk}
                          onChange={(val) => setRetailUnitsPerBulk(val)}
                          placeholder="Ex: 24"
                          maxDecimals={3}
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
                          <option value="Garrafas/Latas">Garrafas / Latas</option>
                          <option value="Garrafas (330ml)">Garrafas (330ml)</option>
                          <option value="Finos (330ml)">Finos (330ml)</option>
                          <option value="Finos (250ml)">Finos (250ml)</option>
                          <option value="Finos (500ml)">Canecas de Fino (500ml)</option>
                          <option value="Unidades">Unidades / Peças</option>
                          <option value="Quilos (Kg)">Quilos (Kg)</option>
                          <option value="Litros">Litros</option>
                          <option value="Metros">Metros</option>
                          <option value="Pacotes">Pacotes</option>
                        </select>
                      </div>
                    </div>

                    {/* Margens diferenciadas para Grosso vs Retalho */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <div>
                        <label className="text-[10px] text-indigo-300 font-mono block mb-1 font-bold">
                          Margem de Venda a Grosso (%) <span className="text-slate-500 font-normal">(Opcional - se vender a caixa fechada)</span>
                        </label>
                        <NumericInput
                          value={bulkMarginPct}
                          onChange={(val) => setBulkMarginPct(val)}
                          placeholder="Ex: 15 (Margem por Caixa/Barril)"
                          maxDecimals={3}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-300 font-mono block mb-1 font-bold">
                          Margem de Venda a Retalho (%) <span className="text-slate-500 font-normal">(Opcional - se vender garrafa a garrafa / fino a fino)</span>
                        </label>
                        <NumericInput
                          value={retailMarginPct}
                          onChange={(val) => setRetailMarginPct(val)}
                          placeholder="Ex: 40 (Margem a Retalho)"
                          maxDecimals={3}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-indigo-500/30 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
                      <span>
                        Total de Artigos a Retalho: <strong className="text-indigo-400">{(parseFormattedNumber(bulkQuantity)) * (parseFormattedNumber(retailUnitsPerBulk))} {retailUnit}</strong> ({bulkQuantity || '0'} {bulkUnit} × {retailUnitsPerBulk || '0'} {retailUnit}/{bulkUnit})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estratégia de Preço & Formação de Lucro (3 Modos: Margem %, Lucro Desejado em Moeda, Preço de Venda Pretendido) */}
          <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 pb-3">
              <div>
                <label className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-400" />
                  2. Estratégia de Preço & Formação de Lucro
                </label>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  Escolha como deseja formar o seu preço e calcular a sua rentabilidade
                </span>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPricingMode('margin');
                    clearFieldError('pricing');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pricingMode === 'margin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Por Margem (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPricingMode('desired_profit');
                    clearFieldError('pricing');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pricingMode === 'desired_profit'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Valor do Lucro Desejado ({country.curr})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPricingMode('fixed_price');
                    clearFieldError('pricing');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pricingMode === 'fixed_price'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Preço de Venda (PVP)</span>
                </button>
              </div>
            </div>

            {/* TAB 1: MARGEM PERCENTUAL (%) */}
            {pricingMode === 'margin' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Margens Rápidas:
                  </span>
                  {[10, 15, 20, 25, 30, 35, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const presetStr = preset.toString();
                        setMarginPct(presetStr);
                        clearFieldError('pricing');
                        if (calculationResults && costNet && parseFormattedNumber(costNet) > 0) {
                          handleRequestCalculate(presetStr, '');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        marginPct === preset.toString()
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      +{preset}%
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider">
                      Margem Comercial Desejada (%)
                    </label>
                    <div className="relative">
                      <NumericInput
                        value={marginPct}
                        onChange={(val) => {
                          setMarginPct(val);
                          clearFieldError('pricing');
                        }}
                        placeholder="Ex: 25 (%)"
                        maxDecimals={3}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>Taxa TPA / Encargo Bancário (%)</span>
                      <span className="text-[9px] text-indigo-400 font-mono">Dedução na Venda</span>
                    </label>
                    <div className="relative">
                      <NumericInput
                        value={tpaRate}
                        onChange={(val) => {
                          setTpaRate(val);
                          clearFieldError('tpaRate');
                        }}
                        placeholder="Ex: 1,0"
                        maxDecimals={3}
                        className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VALOR DO LUCRO DESEJADO (MOEDA) - SOLICITADO PELO UTILIZADOR */}
            {pricingMode === 'desired_profit' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-emerald-300 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>Valor do Lucro Desejado ({country.curr}) *</span>
                      <span className="text-[9px] text-emerald-400 font-mono">Em Moeda Real</span>
                    </label>
                    <div className="relative">
                      <NumericInput
                        value={desiredProfit}
                        onChange={(val) => {
                          setDesiredProfit(val);
                          clearFieldError('pricing');
                        }}
                        placeholder={`Ex: 5.000,000 (${country.curr})`}
                        maxDecimals={3}
                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-xs font-mono font-bold focus:border-emerald-500 outline-none transition ${
                          fieldErrors.pricing ? 'border-rose-500 bg-rose-950/20 text-rose-100' : 'border-emerald-600/60 text-emerald-300'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-emerald-400 font-mono">{country.curr}</span>
                    </div>
                    {fieldErrors.pricing && (
                      <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.pricing}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>Taxa TPA / Encargo Bancário (%)</span>
                      <span className="text-[9px] text-indigo-400 font-mono">Dedução na Venda</span>
                    </label>
                    <div className="relative">
                      <NumericInput
                        value={tpaRate}
                        onChange={(val) => {
                          setTpaRate(val);
                          clearFieldError('tpaRate');
                        }}
                        placeholder="Ex: 1,0"
                        maxDecimals={3}
                        className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                </div>

                {/* Sub-opção: Lucro COM Imposto vs SEM Imposto */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider block">
                    Como define este Lucro Desejado?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                        desiredProfitType === 'gross'
                          ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="desiredProfitType"
                        value="gross"
                        checked={desiredProfitType === 'gross'}
                        onChange={() => setDesiredProfitType('gross')}
                        className="text-amber-500 focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <strong className="text-xs font-mono block text-slate-200">
                          Lucro SEM Imposto (Comercial / Bruto)
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Margem antes de dedução de TPA e Imposto Industrial ({country.ii}%).
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                        desiredProfitType === 'net'
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="desiredProfitType"
                        value="net"
                        checked={desiredProfitType === 'net'}
                        onChange={() => setDesiredProfitType('net')}
                        className="text-emerald-500 focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <strong className="text-xs font-mono block text-emerald-300">
                          Lucro COM Imposto (LÍQUIDO REAL NO BOLSO)
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Calcula o preço necessário para sobrar exatamente este valor líquido após TPA e Imposto Industrial.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PREÇO DE VENDA PRETENDIDO (PVP) */}
            {pricingMode === 'fixed_price' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>Preço de Venda Pretendido ({country.curr}) *</span>
                      <span className="text-[9px] text-cyan-400 font-mono">PVP Alvo</span>
                    </label>
                    <div className="relative">
                      <NumericInput
                        value={fixedPrice}
                        onChange={(val) => {
                          setFixedPrice(val);
                          clearFieldError('pricing');
                        }}
                        placeholder={`Ex: 15.000,000 (${country.curr})`}
                        maxDecimals={3}
                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-xs font-mono font-bold focus:border-cyan-500 outline-none transition ${
                          fieldErrors.pricing ? 'border-rose-500 bg-rose-950/20 text-rose-100' : 'border-cyan-600/60 text-cyan-200'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-cyan-400 font-mono">{country.curr}</span>
                    </div>
                    {fieldErrors.pricing && (
                      <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.pricing}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>Taxa TPA / Encargo Bancário (%)</span>
                      <span className="text-[9px] text-indigo-400 font-mono">Dedução na Venda</span>
                    </label>
                    <div className="relative">
                      <NumericInput
                        value={tpaRate}
                        onChange={(val) => {
                          setTpaRate(val);
                          clearFieldError('tpaRate');
                        }}
                        placeholder="Ex: 1,0"
                        maxDecimals={3}
                        className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded-lg px-3 py-2.5 text-xs font-mono focus:border-indigo-500 outline-none transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                </div>

                {/* Sub-opção: Preço de Venda COM Imposto vs SEM Imposto */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider block">
                    Este Preço Pretendido é COM ou SEM Imposto?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                        fixedPriceType === 'with_vat'
                          ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fixedPriceType"
                        value="with_vat"
                        checked={fixedPriceType === 'with_vat'}
                        onChange={() => setFixedPriceType('with_vat')}
                        className="text-cyan-500 focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <strong className="text-xs font-mono block text-cyan-200">
                          Preço COM Imposto (PVP Final com IVA)
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Preço final de prateleira cobrado ao cliente final (o sistema deduz o IVA para apurar a receita líquida).
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                        fixedPriceType === 'without_vat'
                          ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fixedPriceType"
                        value="without_vat"
                        checked={fixedPriceType === 'without_vat'}
                        onChange={() => setFixedPriceType('without_vat')}
                        className="text-indigo-500 focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <strong className="text-xs font-mono block text-indigo-200">
                          Preço SEM Imposto (Base Tributável Líquida)
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Faturação líquida da empresa (o sistema somará automaticamente o IVA de {vatRate}% no PVP final).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

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
                        <NumericInput
                          value={transportInclusionPct}
                          onChange={(val) => setTransportInclusionPct(val)}
                          placeholder="100"
                          maxDecimals={3}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Alimentação (%)</label>
                        <NumericInput
                          value={mealsInclusionPct}
                          onChange={(val) => setMealsInclusionPct(val)}
                          placeholder="100"
                          maxDecimals={3}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Estadia (%)</label>
                        <NumericInput
                          value={lodgingInclusionPct}
                          onChange={(val) => setLodgingInclusionPct(val)}
                          placeholder="100"
                          maxDecimals={3}
                          className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Outros Extras (%)</label>
                        <NumericInput
                          value={otherExtrasInclusionPct}
                          onChange={(val) => setOtherExtrasInclusionPct(val)}
                          placeholder="100"
                          maxDecimals={3}
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

        {/* Calculate Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => handleRequestCalculate()}
            disabled={isCalculating}
            className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{isCalculating ? 'A PROCESSAR SIMULAÇÃO...' : 'CALCULAR MARGENS & PREÇOS'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-4 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono border border-slate-700/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Rever ficha detalhada dos parâmetros da simulação"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Rever Parâmetros</span>
          </button>
        </div>
      </div>

      {/* Results Scenarios */}
      <div ref={resultsRef}>
        {!activeResults ? (
          <div className="bg-[#1E293B]/70 border border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wide">
              Pronto para Simular Formação de Preço
            </h3>
            <p className="text-xs text-slate-400 font-mono max-w-md mx-auto leading-relaxed">
              Introduza o Preço de Custo de Compra da mercadoria e clique no botão{' '}
              <strong className="text-indigo-300 font-bold">"CALCULAR MARGENS & PREÇOS"</strong> para visualizar os cenários oficiais de formação de preço de venda e margens líquidas.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => {
                  setCostNet('10.000,000');
                  setCostGross('11.400,000');
                  setMarginPct('25');
                  setProductName('Artigo Comercial Demonstração');
                  executeCalculation('25', '');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Exemplo Padrão</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCostNet('7.200,000');
                  setCostGross('8.208,000');
                  setProductName('Caixa de Cerveja Cuca / Sagres (24 Garrafas)');
                  setMarginPct('20');
                  applyBeerBoxPreset();
                  setRetailMarginPct('40');
                  executeCalculation('20', '');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition cursor-pointer"
              >
                <span>🍺</span>
                <span>Caixa de Cerveja (24x Retalho)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCostNet('45.000,000');
                  setCostGross('51.300,000');
                  setProductName('Barril de Fino / Chopp Cuca (50 Litros)');
                  setMarginPct('20');
                  applyBeerKegPreset('50');
                  setRetailMarginPct('60');
                  applyLogisticsExpensesPreset();
                  executeCalculation('20', '');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition cursor-pointer"
              >
                <span>🍻</span>
                <span>Barril de Fino (50L + Transporte/Estadia)</span>
              </button>
            </div>
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

          {/* PAINEL CENTRAL DE ESCLARECIMENTO: CUSTO, VENDA E LUCRO (COM vs SEM IMPOSTO) */}
          {activeResults.length > 0 && activeResults[0]?.calc && (
            <div className="bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 border-2 border-indigo-500/40 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                    Visão Geral dos Três Pilares da Formação de Preço
                  </span>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    Quadro Comparativo: Custo, Valor de Venda & Lucro (COM vs SEM Imposto)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
                  Cenário Ativo: {activeResults[0]?.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PILAR 1: CUSTO */}
                <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      1. Custo de Aquisição
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">
                      Desembolso
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-mono text-slate-400">SEM IMPOSTO (Líquido):</span>
                      <strong className="text-sm font-mono font-bold text-slate-200">
                        {formatMoney(activeResults[0].calc.effectiveCostNet)}
                      </strong>
                    </div>
                    <div className="flex items-baseline justify-between text-xs font-mono text-indigo-400/90 pt-1 border-t border-slate-800/80">
                      <span>+ IVA Suportado ({vatRate}%):</span>
                      <span className="font-bold">+{formatMoney(activeResults[0].calc.totalInputVatSupported)}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-700">
                      <span className="text-xs font-mono font-bold text-emerald-400">COM IMPOSTO (Total Pago):</span>
                      <strong className="text-base font-mono font-bold text-emerald-300">
                        {formatMoney(activeResults[0].calc.effectiveCostGross)}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-2">
                    * Custo total de compra e logística. O IVA suportado é crédito dedutível no apuramento fiscal.
                  </p>
                </div>

                {/* PILAR 2: VALOR DE VENDA */}
                <div className="bg-slate-950/80 border border-cyan-500/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      2. Valor de Venda (PVP)
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded font-bold">
                      Faturação
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-mono text-slate-400">SEM IMPOSTO (Base Líquida):</span>
                      <strong className="text-sm font-mono font-bold text-cyan-200">
                        {formatMoney(activeResults[0].calc.pvpBase)}
                      </strong>
                    </div>
                    <div className="flex items-baseline justify-between text-xs font-mono text-indigo-400/90 pt-1 border-t border-slate-800/80">
                      <span>+ IVA Liquidado ({vatRate}%):</span>
                      <span className="font-bold">+{formatMoney(activeResults[0].calc.vatSale)}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-700">
                      <span className="text-xs font-mono font-bold text-emerald-400">COM IMPOSTO (PVP Final):</span>
                      <strong className="text-base font-mono font-bold text-emerald-400">
                        {formatMoney(activeResults[0].calc.pvpFinal)}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-2">
                    * Preço final cobrado na fatura / prateleira. O IVA cobrado é entregue ao Estado.
                  </p>
                </div>

                {/* PILAR 3: LUCRO */}
                <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      3. Lucro do Comerciante
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded font-bold">
                      Ganho Real
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-mono text-slate-400">SEM IMPOSTO (Comercial / Bruto):</span>
                      <strong className="text-sm font-mono font-bold text-amber-300">
                        {formatMoney(activeResults[0].calc.profitBeforeTax)}
                      </strong>
                    </div>
                    <div className="flex items-baseline justify-between text-xs font-mono text-rose-400/90 pt-1 border-t border-slate-800/80">
                      <span>- TPA ({tpaRate}%) + II ({country.ii}%):</span>
                      <span className="font-bold">-{formatMoney(activeResults[0].calc.tpaCost + activeResults[0].calc.incomeTax)}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-700">
                      <span className="text-xs font-mono font-bold text-emerald-300">COM IMPOSTO (LÍQUIDO REAL):</span>
                      <strong className="text-base font-mono font-bold text-emerald-400">
                        {formatMoney(activeResults[0].calc.netProfit)}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-400/80 font-mono border-t border-slate-800/60 pt-2 font-bold">
                    * Ganho líquido final no bolso após dedução de todas as taxas bancárias e impostos.
                  </p>
                </div>
              </div>
            </div>
          )}

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

                  {/* Prominent 3-Pillar Badges: Custo, Venda e Lucro (Com e Sem Imposto) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-3">
                    {/* 1. Custo de Aquisição */}
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 space-y-1 shadow-sm">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        Custo Aquisição
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 text-[10px]">SEM IVA:</span>
                          <strong className="text-slate-200 font-bold">{formatMoney(calc.effectiveCostNet)}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800">
                          <span className="text-emerald-400 font-bold text-[10px]">COM IVA:</span>
                          <strong className="text-emerald-400 font-bold">{formatMoney(calc.effectiveCostGross)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 2. Total da Venda / Faturação */}
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 space-y-1 shadow-sm">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-cyan-400" />
                        Preço Venda (PVP)
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 text-[10px]">SEM IVA:</span>
                          <strong className="text-cyan-300 font-bold">{formatMoney(calc.pvpBase)}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800">
                          <span className="text-emerald-400 font-bold text-[10px]">COM IVA:</span>
                          <strong className="text-emerald-400 font-bold">{formatMoney(calc.pvpFinal)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. Lucro do Comerciante */}
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 space-y-1 shadow-sm">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Lucro Real
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 text-[10px]">BRUTO:</span>
                          <strong className="text-amber-300 font-bold">{formatMoney(calc.profitBeforeTax)}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800">
                          <span className="text-emerald-300 font-bold text-[10px]">LÍQUIDO:</span>
                          <strong className="text-emerald-400 font-bold">{formatMoney(calc.netProfit)}</strong>
                        </div>
                      </div>
                    </div>
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
                              <span>• Transporte {calc.extras.transport.isRoundTrip ? '(Ida + Volta)' : ''}</span>
                              <span className="font-mono text-amber-300">+ {formatMoney(calc.extras.transport.net)}</span>
                            </div>
                          )}

                          {calc.extras.meals.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• Alimentação / Diárias</span>
                              <span className="font-mono text-amber-300">+ {formatMoney(calc.extras.meals.net)}</span>
                            </div>
                          )}

                          {calc.extras.lodging.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• Estadia / Hospedaria ({calc.extras.lodging.days} {calc.extras.lodging.days > 1 ? 'dias' : 'dia'})</span>
                              <span className="font-mono text-amber-300">+ {formatMoney(calc.extras.lodging.net)}</span>
                            </div>
                          )}

                          {calc.extras.otherExtras.raw > 0 && (
                            <div className="flex justify-between text-slate-400 text-[11px] pl-2">
                              <span>• {calc.extras.otherExtras.label || 'Outras Despesas de Aquisição'}</span>
                              <span className="font-mono text-amber-300">+ {formatMoney(calc.extras.otherExtras.net)}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-slate-800/60">
                            <span>(=) Custo Efetivo de Aquisição (SEM IVA)</span>
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
                        <span>(+) Margem de Lucro ({calc.marginApplied.toFixed(1)}%)</span>
                        <strong className="font-mono">+ {formatMoney(calc.profitBeforeTax)}</strong>
                      </div>

                      {/* Total SEM IVA */}
                      <div className="flex justify-between items-center py-1.5 px-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200">
                        <span className="text-cyan-300 font-bold">(=) SUB-TOTAL / VENDA (SEM IMPOSTOS):</span>
                        <strong className="font-mono text-cyan-300 text-xs">{formatMoney(calc.pvpBase)}</strong>
                      </div>

                      <div className="flex justify-between text-indigo-300">
                        <span>(+) IVA Liquidado na Venda ({vatRate}%)</span>
                        <strong className="font-mono">+ {formatMoney(calc.vatSale)}</strong>
                      </div>

                      {/* Total COM IVA */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-slate-100 text-xs bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                        <span className="text-emerald-300">(=) PREÇO TOTAL FATURADO (COM IMPOSTOS):</span>
                        <span className="text-emerald-400 font-bold font-mono text-sm">{formatMoney(calc.pvpFinal)}</span>
                      </div>
                    </div>

                    {/* Módulo Especial: Decomposição Grosso vs Retalho */}
                    {calc.retailDecomposition?.isEnabled && (
                      <div className="bg-[#0B132B] p-3.5 rounded-lg border border-indigo-500/40 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-indigo-500/20">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                            {calc.retailDecomposition.isBeerKegMode ? (
                              <Beer className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            <span>
                              {calc.retailDecomposition.isBeerKegMode
                                ? 'Simulação Especial: Barril de Fino vs Venda ao Copo'
                                : 'Simulação Comparativa: Compra a Grosso vs Venda a Retalho'}
                            </span>
                          </p>
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                            {calc.retailDecomposition.bulkQty} {calc.retailDecomposition.bulkUnit} = {calc.retailDecomposition.totalRetailUnits} {calc.retailDecomposition.retailUnit}
                          </span>
                        </div>

                        {/* Special Beer Keg banner if keg mode is active */}
                        {calc.retailDecomposition.isBeerKegMode && (
                          <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded text-[11px] font-mono text-amber-200 flex items-start gap-2">
                            <Beer className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong>Rendimento Oficial do Barril ({calc.retailDecomposition.kegLiters} Litros):</strong> Descontando {calc.retailDecomposition.foamLossPct}% de espuma/sangria, obtém-se <strong>{calc.retailDecomposition.totalRetailUnits} copos de fino ({calc.retailDecomposition.glassSizeMl}ml)</strong>. Veja abaixo o lucro por fino individual e o lucro líquido geral de todo o barril.
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {/* Coluna 1: Venda a Grosso */}
                          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-300 pb-1 border-b border-slate-800">
                              <span>Venda a Grosso (Por {calc.retailDecomposition.bulkUnit})</span>
                              <span className="text-[9px] text-slate-400 font-mono">Margem: {calc.retailDecomposition.bulkMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Custo por {calc.retailDecomposition.bulkUnit} (SEM IVA)</span>
                              <strong className="font-mono text-slate-200">{formatMoney(calc.retailDecomposition.costPerBulkNet)}</strong>
                            </div>
                            <div className="flex justify-between text-cyan-300 text-[11px]">
                              <span>PVP por {calc.retailDecomposition.bulkUnit} (SEM IMPOSTOS)</span>
                              <strong className="font-mono">{formatMoney(calc.retailDecomposition.bulkPvpBase)}</strong>
                            </div>
                            <div className="flex justify-between text-emerald-400 text-xs font-bold pt-0.5">
                              <span>PVP por {calc.retailDecomposition.bulkUnit} (COM IMPOSTOS)</span>
                              <strong className="font-mono text-sm">{formatMoney(calc.retailDecomposition.bulkPvpFinal)}</strong>
                            </div>
                            <div className="flex justify-between text-emerald-300 text-[11px] pt-1 border-t border-slate-800">
                              <span className="font-bold">Lucro Líquido por {calc.retailDecomposition.bulkUnit}</span>
                              <strong className="font-mono text-emerald-300">{formatMoney(calc.retailDecomposition.bulkNetProfit)}</strong>
                            </div>
                            <div className="pt-1.5 border-t border-indigo-500/30 text-[10px] space-y-0.5 bg-indigo-950/20 p-1.5 rounded">
                              <div className="flex justify-between text-slate-300">
                                <span>Faturação Lote ({calc.retailDecomposition.bulkQty} {calc.retailDecomposition.bulkUnit}):</span>
                                <strong className="font-mono text-cyan-300">{formatMoney(calc.retailDecomposition.bulkTotalSalesNet)}</strong>
                              </div>
                              <div className="flex justify-between text-emerald-300 font-bold">
                                <span>Total a Cobrar COM IMPOSTOS:</span>
                                <strong className="font-mono">{formatMoney(calc.retailDecomposition.bulkTotalSalesGross)}</strong>
                              </div>
                              <div className="flex justify-between text-emerald-400 font-bold pt-0.5 border-t border-indigo-500/20">
                                <span>LUCRO LÍQUIDO GERAL (Grosso):</span>
                                <strong className="font-mono text-xs">{formatMoney(calc.retailDecomposition.bulkTotalNetProfit)}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Coluna 2: Venda a Retalho */}
                          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-500/40 space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-300 pb-1 border-b border-emerald-500/30">
                              <span>Venda a Retalho (Por {calc.retailDecomposition.retailUnit})</span>
                              <span className="text-[9px] text-emerald-400 font-mono font-bold">Margem: {calc.retailDecomposition.retailMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Custo Unitário (SEM IVA)</span>
                              <strong className="font-mono text-slate-200">{formatMoney(calc.retailDecomposition.costPerRetailUnitNet)}</strong>
                            </div>
                            <div className="flex justify-between text-cyan-300 text-[11px]">
                              <span>PVP Unitário (SEM IMPOSTOS)</span>
                              <strong className="font-mono">{formatMoney(calc.retailDecomposition.retailPvpBase)}</strong>
                            </div>
                            <div className="flex justify-between text-emerald-400 text-xs font-bold pt-0.5">
                              <span>PVP Unitário (COM IMPOSTOS)</span>
                              <strong className="font-mono text-sm text-emerald-300">{formatMoney(calc.retailDecomposition.retailPvpFinal)}</strong>
                            </div>
                            <div className="flex justify-between text-emerald-300 text-[11px] pt-1 border-t border-emerald-500/30 bg-emerald-950/30 px-1 py-0.5 rounded">
                              <span className="font-bold">LUCRO LÍQUIDO POR {calc.retailDecomposition.retailUnit.toUpperCase()}:</span>
                              <strong className="font-mono text-emerald-300 font-bold text-xs">{formatMoney(calc.retailDecomposition.retailNetProfit)}</strong>
                            </div>
                            <div className="pt-1.5 border-t border-emerald-500/30 text-[10px] space-y-0.5 bg-emerald-950/20 p-1.5 rounded">
                              <div className="flex justify-between text-slate-300">
                                <span>Faturação Total ({calc.retailDecomposition.totalRetailUnits} {calc.retailDecomposition.retailUnit}):</span>
                                <strong className="font-mono text-cyan-300">{formatMoney(calc.retailDecomposition.retailTotalSalesNet)}</strong>
                              </div>
                              <div className="flex justify-between text-emerald-300 font-bold">
                                <span>Total a Cobrar COM IMPOSTOS:</span>
                                <strong className="font-mono">{formatMoney(calc.retailDecomposition.retailTotalSalesGross)}</strong>
                              </div>
                              <div className="flex justify-between text-emerald-400 font-bold pt-0.5 border-t border-emerald-500/20">
                                <span>LUCRO LÍQUIDO GERAL (Retalho):</span>
                                <strong className="font-mono text-xs">{formatMoney(calc.retailDecomposition.retailTotalNetProfit)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Comparativo de Ganho Adicional */}
                        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded p-2.5 text-center text-xs font-mono text-emerald-300">
                          <span>Ganho Adicional na Venda a Retalho:</span>{' '}
                          <strong className="text-emerald-200">+{formatMoney(calc.retailDecomposition.extraRevenueAtRetail)}</strong> de Faturação e{' '}
                          <strong className="text-emerald-200 font-bold">+{formatMoney(calc.retailDecomposition.extraProfitAtRetail)}</strong> de Lucro Líquido Real comparado com a venda a grosso!
                        </div>

                        {/* Clear reminder that logistics expenses are 100% costs and not profits */}
                        {calc.extraCostsApplied?.hasExtras && (
                          <div className="p-2 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                              <CheckCircle className="w-3 h-3 text-amber-400" />
                              Custos de Viagem Amortizados:
                            </span>
                            <span>
                              Transporte, Alimentação e Estadia ({formatMoney(calc.extraCostsApplied.totalExtraNet)}) foram 100% amortizados antes de calcular este lucro líquido.
                            </span>
                          </div>
                        )}
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
                          <span>[i] Crédito IVA Suportado (Compras + Extras)</span>
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
                        LUCRO LÍQUIDO REAL (COM IMPOSTOS DESCONTADOS)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Livre de mercadoria, despesas de aquisição, taxas e impostos fiscais
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
      </div>

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
