import { Router, Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db.js';

const router = Router();

// 1. SIMULAÇÃO COMÉRCIO LOCAL & SERVIÇOS (Livre, sem gravação em tabelas no banco de dados)
router.post('/calculate-local', (req: Request, res: Response) => {
  try {
    const {
      userId,
      countryCode,
      costNet,
      vatRate,
      tpaRate,
      marginPct,
      fixedFinalPrice,
      pricingMode,
      desiredProfit,
      desiredProfitType,
      fixedPriceType,
      productName,
      itemType,
      retentionRate,
      notes,
      transportCost,
      transportRoundTrip,
      transportTaxMode,
      transportVatRate,
      mealsCost,
      mealsTaxMode,
      mealsVatRate,
      lodgingCost,
      lodgingDays,
      lodgingTaxMode,
      lodgingVatRate,
      otherExtrasCost,
      otherExtrasLabel,
      otherExtrasTaxMode,
      otherExtrasVatRate
    } = req.body;

    const cCostNet = Number(costNet) || 0;
    const cVatRate = Number(vatRate) || 0;
    const cTpaRate = Number(tpaRate) || 0;
    const cMargin = Number(marginPct) || 0;
    const cFixedPrice = Number(fixedFinalPrice) || 0;
    const cDesiredProfit = Number(desiredProfit) || 0;
    const sPricingMode = pricingMode || (cDesiredProfit > 0 ? 'desired_profit' : (cFixedPrice > 0 ? 'fixed_price' : 'margin'));
    const sDesiredProfitType = desiredProfitType === 'net' ? 'net' : 'gross';
    const sFixedPriceType = fixedPriceType === 'without_vat' ? 'without_vat' : 'with_vat';
    const cRetentionRate = Number(retentionRate) || 0;
    const isService = itemType === 'service' || cRetentionRate > 0;

    const computeExtraCostTax = (amount: number, mode: string = 'without_vat', rate: number = cVatRate) => {
      if (amount <= 0) return { net: 0, vat: 0, total: 0 };
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

    const cTransportCost = Number(transportCost) || 0;
    const cTransportRoundTrip = Boolean(transportRoundTrip);
    const transportVal = cTransportCost * (cTransportRoundTrip ? 2 : 1);
    const transportCalc = computeExtraCostTax(transportVal, transportTaxMode, Number(transportVatRate) || cVatRate);

    const cMealsCost = Number(mealsCost) || 0;
    const mealsCalc = computeExtraCostTax(cMealsCost, mealsTaxMode, Number(mealsVatRate) || cVatRate);

    const cLodgingCost = Number(lodgingCost) || 0;
    const cLodgingDays = Math.max(1, Number(lodgingDays) || 1);
    const lodgingVal = cLodgingCost * cLodgingDays;
    const lodgingCalc = computeExtraCostTax(lodgingVal, lodgingTaxMode, Number(lodgingVatRate) || cVatRate);

    const cOtherExtrasCost = Number(otherExtrasCost) || 0;
    const otherExtrasCalc = computeExtraCostTax(cOtherExtrasCost, otherExtrasTaxMode, Number(otherExtrasVatRate) || cVatRate);

    const totalExtraCostsNet = transportCalc.net + mealsCalc.net + lodgingCalc.net + otherExtrasCalc.net;
    const totalExtraCostsVat = transportCalc.vat + mealsCalc.vat + lodgingCalc.vat + otherExtrasCalc.vat;
    const totalExtraCostsPaid = transportCalc.total + mealsCalc.total + lodgingCalc.total + otherExtrasCalc.total;

    const effectiveCostNet = cCostNet + totalExtraCostsNet;

    if (isService) {
      if (cFixedPrice <= 0 && cCostNet <= 0 && cDesiredProfit <= 0) {
        return res.status(400).json({
          error: 'Na prestação de serviços indique o Valor do Serviço / PVP Pretendido, Lucro Desejado ou Custo Operacional.'
        });
      }
    } else {
      if (cCostNet <= 0 && effectiveCostNet <= 0) {
        return res.status(400).json({
          error: 'Para comércio de produtos, o Preço de Custo Base (SEM IVA) deve ser superior a zero.'
        });
      }
    }

    const industrialTaxRate = countryCode === 'PT' ? 21 : 25;

    let pvpBase = 0;
    let pvpFinal = 0;
    let vatSale = 0;
    let profit = 0;
    let actualMarginApplied = 0;

    if (sPricingMode === 'desired_profit' && cDesiredProfit > 0) {
      if (sDesiredProfitType === 'net') {
        // Target net profit after Industrial Tax (incomeTax) and TPA
        const operatingProfitTarget = cDesiredProfit / (1 - industrialTaxRate / 100);
        const tpaFactor = (1 + cVatRate / 100) * (cTpaRate / 100);
        // profit - (effectiveCostNet + profit) * tpaFactor = operatingProfitTarget
        // profit * (1 - tpaFactor) = operatingProfitTarget + effectiveCostNet * tpaFactor
        const denom = Math.max(0.01, 1 - tpaFactor);
        profit = (operatingProfitTarget + effectiveCostNet * tpaFactor) / denom;
        pvpBase = effectiveCostNet + profit;
        vatSale = pvpBase * (cVatRate / 100);
        pvpFinal = pvpBase + vatSale;
      } else {
        // Desired profit before taxes (SEM IMPOSTO)
        profit = cDesiredProfit;
        pvpBase = effectiveCostNet + profit;
        vatSale = pvpBase * (cVatRate / 100);
        pvpFinal = pvpBase + vatSale;
      }
      actualMarginApplied = effectiveCostNet > 0 ? (profit / effectiveCostNet) * 100 : 0;
    } else if (sPricingMode === 'fixed_price' || cFixedPrice > 0) {
      if (sFixedPriceType === 'without_vat') {
        pvpBase = cFixedPrice;
        vatSale = pvpBase * (cVatRate / 100);
        pvpFinal = pvpBase + vatSale;
        profit = pvpBase - effectiveCostNet;
      } else {
        pvpFinal = cFixedPrice;
        pvpBase = pvpFinal / (1 + cVatRate / 100);
        vatSale = pvpFinal - pvpBase;
        profit = pvpBase - effectiveCostNet;
      }
      actualMarginApplied = effectiveCostNet > 0 ? (profit / effectiveCostNet) * 100 : 0;
    } else {
      // Standard percentage margin
      profit = effectiveCostNet * (cMargin / 100);
      pvpBase = effectiveCostNet + profit;
      vatSale = pvpBase * (cVatRate / 100);
      pvpFinal = pvpBase + vatSale;
      actualMarginApplied = cMargin;
    }

    const merchandiseVatCost = cCostNet * (cVatRate / 100);
    const costGross = cCostNet + merchandiseVatCost;
    const totalInputVatSupported = merchandiseVatCost + totalExtraCostsVat;
    const effectiveCostGross = effectiveCostNet + totalInputVatSupported;

    const netVatToPay = Math.max(0, vatSale - totalInputVatSupported);
    const tpaCost = pvpFinal * (cTpaRate / 100);
    
    const retentionAmount = pvpBase * (cRetentionRate / 100);
    const netReceived = pvpFinal - retentionAmount - tpaCost;

    const operatingProfit = profit - tpaCost;
    const incomeTax = operatingProfit > 0 ? operatingProfit * (industrialTaxRate / 100) : 0;
    const netProfit = operatingProfit - incomeTax;

    const calcDetails = {
      countryCode,
      productName,
      costNet: cCostNet,
      costGross,
      merchandiseVatCost,
      effectiveCostNet,
      effectiveCostGross,
      totalExtraCostsNet,
      totalExtraCostsVat,
      totalExtraCostsPaid,
      extraCostsBreakdown: {
        transport: transportCalc,
        meals: mealsCalc,
        lodging: lodgingCalc,
        otherExtras: { ...otherExtrasCalc, label: otherExtrasLabel }
      },
      vatRate: cVatRate,
      tpaRate: cTpaRate,
      marginPct: actualMarginApplied,
      pricingMode: sPricingMode,
      desiredProfit: cDesiredProfit,
      desiredProfitType: sDesiredProfitType,
      fixedPriceType: sFixedPriceType,
      profit,
      profitBeforeTax: profit,
      pvpBase,
      vatSale,
      totalInputVatSupported,
      netVatToPay,
      pvpFinal,
      retentionRate: cRetentionRate,
      retentionAmount,
      netReceived,
      tpaCost,
      operatingProfit,
      incomeTax,
      netProfit,
      industrialTaxRate,
      itemType: isService ? 'service' : 'product',
      fixedPriceUsed: sPricingMode === 'fixed_price' || cFixedPrice > 0
    };

    let userQueriesRemaining: number | undefined = undefined;
    if (userId && userId !== 'visitante_anonimo') {
      const creditResult = db.consumeUserCredit(userId, 1);
      if (!creditResult.success) {
        return res.status(402).json({
          error: 'Créditos de consulta esgotados. Por favor adquira um plano para continuar a efetuar simulações.',
          queriesRemaining: 0
        });
      }
      userQueriesRemaining = creditResult.queriesRemaining;
    }

    return res.json({
      success: true,
      calculation: calcDetails,
      queriesRemaining: userQueriesRemaining !== undefined ? userQueriesRemaining : 999999
    });
  } catch (err: any) {
    console.error('Error on calculate-local:', err);
    return res.status(500).json({ error: 'Erro ao calcular simulação local.' });
  }
});

// 2. SIMULAÇÃO IMPORTAÇÃO ADUANEIRA
router.post('/calculate-import', (req: Request, res: Response) => {
  try {
    const {
      originCountry,
      destCountry,
      fob,
      freight,
      insurance,
      customsRate,
      iecRate,
      otherFees,
      vatRate,
      marginPct,
      productName
    } = req.body;

    const cFob = Number(fob) || 0;
    const cFreight = Number(freight) || 0;
    const cInsurance = Number(insurance) || 0;
    const cCustomsRate = Number(customsRate) || 0;
    const cIecRate = Number(iecRate) || 0;
    const cOtherFees = Number(otherFees) || 0;
    const cVatRate = Number(vatRate) || 0;
    const cMargin = Number(marginPct) || 0;

    if (cFob <= 0) {
      return res.status(400).json({ error: 'O valor FOB (Mercadoria) deve ser superior a zero.' });
    }

    const cif = cFob + cFreight + cInsurance;
    const customsDuty = cif * (cCustomsRate / 100);
    const iecTax = cif * (cIecRate / 100);
    const nationalizedCostNet = cif + customsDuty + iecTax + cOtherFees;

    const profit = nationalizedCostNet * (cMargin / 100);
    const pvpBase = nationalizedCostNet + profit;
    const vatSale = pvpBase * (cVatRate / 100);
    const pvpFinal = pvpBase + vatSale;

    const vatCost = nationalizedCostNet * (cVatRate / 100);
    const netVatToPay = Math.max(0, vatSale - vatCost);
    const tpaCost = pvpFinal * 0.01;
    const industrialTaxRate = 25;
    const operatingProfit = profit - tpaCost;
    const incomeTax = operatingProfit > 0 ? operatingProfit * (industrialTaxRate / 100) : 0;
    const netProfit = operatingProfit - incomeTax;

    const calcDetails = {
      originCountry,
      destCountry,
      productName,
      fob: cFob,
      freight: cFreight,
      insurance: cInsurance,
      cif,
      customsRate: cCustomsRate,
      customsDuty,
      iecRate: cIecRate,
      iecTax,
      otherFees: cOtherFees,
      nationalizedCostNet,
      marginPct: cMargin,
      profit,
      pvpBase,
      vatSale,
      pvpFinal,
      netVatToPay,
      tpaCost,
      incomeTax,
      netProfit
    };

    return res.json({
      success: true,
      calculation: calcDetails,
      queriesRemaining: 999999
    });
  } catch (err: any) {
    console.error('Error on calculate-import:', err);
    return res.status(500).json({ error: 'Erro ao calcular custos de importação aduaneira.' });
  }
});

// 3. SIMULAÇÃO EM LOTE EXCEL
router.post('/calculate-batch', (req: Request, res: Response) => {
  try {
    const { items, countryCode, vatRate, marginPct, costColumnKey } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item fornecido para processamento em lote.' });
    }

    const MAX_BATCH_ROWS = 5000;
    if (items.length > MAX_BATCH_ROWS) {
      return res.status(400).json({
        error: `O ficheiro contém ${items.length} linhas, ultrapassando o limite seguro de ${MAX_BATCH_ROWS}.`,
        code: 'ROW_LIMIT_EXCEEDED'
      });
    }

    const cVatRate = Number(vatRate) || 0;
    const cMargin = Number(marginPct) || 0;
    const industrialTaxRate = countryCode === 'PT' ? 21 : 25;

    const cleanCostValue = (rawVal: any): number => {
      if (typeof rawVal === 'number') return isNaN(rawVal) ? 0 : rawVal;
      if (!rawVal) return 0;
      let str = String(rawVal).trim().replace(/[^\d.,-]/g, '');
      if (str.includes(',') && str.includes('.')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
          str = str.replace(/\./g, '').replace(',', '.');
        } else {
          str = str.replace(/,/g, '');
        }
      } else if (str.includes(',')) {
        str = str.replace(',', '.');
      }
      const num = parseFloat(str);
      return isNaN(num) ? 0 : Math.max(0, num);
    };

    const processed = items.map((row: any) => {
      const keys = Object.keys(row);
      let effectiveCostKey = costColumnKey;
      if (!effectiveCostKey || !keys.includes(effectiveCostKey)) {
        const potentialKeys = ['custo', 'preço', 'preco', 'compra', 'p. custo', 'p.custo', 'price', 'cost', 'valor', 'unit cost', 'vlr custo'];
        effectiveCostKey = keys.find(k => potentialKeys.includes(k.toLowerCase().trim())) || keys[1] || keys[0];
      }

      const costNet = cleanCostValue(row[effectiveCostKey]);
      const profit = costNet * (cMargin / 100);
      const pvpBase = costNet + profit;
      const vatSale = pvpBase * (cVatRate / 100);
      const pvpFinal = pvpBase + vatSale;
      const vatCost = costNet * (cVatRate / 100);
      const netVatToPay = Math.max(0, vatSale - vatCost);
      const tpaCost = pvpFinal * 0.01;
      const operatingProfit = profit - tpaCost;
      const incomeTax = operatingProfit > 0 ? operatingProfit * (industrialTaxRate / 100) : 0;
      const netProfit = operatingProfit - incomeTax;

      return {
        ...row,
        '[NANUCLOUD] Custo Base (S/ IVA)': costNet.toFixed(2),
        '[NANUCLOUD] Margem Lucro (%)': `${cMargin}%`,
        '[NANUCLOUD] Lucro Bruto': profit.toFixed(2),
        '[NANUCLOUD] PVP Base (S/ IVA)': pvpBase.toFixed(2),
        '[NANUCLOUD] IVA Venda': vatSale.toFixed(2),
        '[NANUCLOUD] PVP Final Recomendado (C/ IVA)': pvpFinal.toFixed(2),
        '[NANUCLOUD] Taxa TPA': tpaCost.toFixed(2),
        '[NANUCLOUD] IVA a Entregar': netVatToPay.toFixed(2),
        '[NANUCLOUD] Lucro Líquido Real': netProfit.toFixed(2)
      };
    });

    return res.json({
      success: true,
      processedItems: processed,
      queriesRemaining: 999999
    });
  } catch (err: any) {
    console.error('Error on calculate-batch:', err);
    return res.status(500).json({ error: 'Erro ao processar ficheiro em lote.' });
  }
});

// 4. HISTÓRICO
router.get('/history', (_req: Request, res: Response) => {
  return res.json({ history: [] });
});

router.put('/history/:id', (_req: Request, res: Response) => {
  return res.json({ message: 'OK' });
});

router.delete('/history/:id', (_req: Request, res: Response) => {
  return res.json({ message: 'Removido com sucesso' });
});

router.get('/history-export', (_req: Request, res: Response) => {
  const worksheet = XLSX.utils.json_to_sheet([{ 'Aviso': 'Histórico mantido localmente na sessão do navegador' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=Historico_Simulacoes.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buffer);
});

export default router;
