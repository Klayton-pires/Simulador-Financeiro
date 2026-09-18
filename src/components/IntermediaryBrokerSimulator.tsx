import React, { useState, useEffect } from 'react';
import { UserSafe } from '../types';
import { COUNTRIES_DB, getAvailableCountryList, getEffectiveCountryFiscal } from '../data/countries';
import { SupportedLang } from '../i18n/translations';
import {
  Users,
  Building2,
  UserCheck,
  Calculator,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Info,
  Scale,
  ShieldAlert,
  Percent,
  CheckCircle2,
  DollarSign,
  Receipt,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { canUserSimulate } from '../utils/accessControl';
import { ClientCreditNoticeBanner } from './ClientCreditNoticeBanner';
import { ConfirmSimulationModal, SimulationSummaryItem } from './ConfirmSimulationModal';
import { saveSimulationToFirestore } from '../services/firebase';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';

interface IntermediaryBrokerSimulatorProps {
  user: UserSafe | null;
  currentLang: SupportedLang;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onCalculationDone: (newCredits: number) => void;
}

export const IntermediaryBrokerSimulator: React.FC<IntermediaryBrokerSimulatorProps> = ({
  user,
  currentLang,
  onOpenPlans,
  onOpenAuth,
  onCalculationDone
}) => {
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);

  const [countryCode, setCountryCode] = useState<string>('AO');
  const [intermediaryType, setIntermediaryType] = useState<'company' | 'individual'>('company');
  
  // Deal values
  const [dealTitle, setDealTitle] = useState<string>('');
  const [productsTotal, setProductsTotal] = useState<string>('50000000');
  const [servicesTotal, setServicesTotal] = useState<string>('15000000');
  
  // Intermediary details
  const [intermediaryName, setIntermediaryName] = useState<string>('');
  const [intermediaryNif, setIntermediaryNif] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerNif, setOwnerNif] = useState<string>('');

  // Commission Scope & Mode
  const [commissionScope, setCommissionScope] = useState<'products_only' | 'services_only' | 'total_deal' | 'fixed_amount'>('total_deal');
  const [commissionPct, setCommissionPct] = useState<string>('7.5');
  const [fixedCommissionAmount, setFixedCommissionAmount] = useState<string>('');
  
  // Fiscal parameters
  const [includeVatOnCommission, setIncludeVatOnCommission] = useState<boolean>(false);
  const [commissionVatRate, setCommissionVatRate] = useState<number>(14);
  const [retentionRate, setRetentionRate] = useState<string>('6.5');
  const [tpaRate, setTpaRate] = useState<string>('0');
  const [tpaMode, setTpaMode] = useState<'pct' | 'fixed'>('pct');
  const [notes, setNotes] = useState<string>('');

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [results, setResults] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  // Update default legal recommendations when country or intermediary type changes
  useEffect(() => {
    if (countryCode === 'AO') {
      setCommissionVatRate(14);
      if (intermediaryType === 'company') {
        setRetentionRate('6.5'); // Lei 19/14 e Decreto Legislativo Presidencial 2/14
      } else {
        setRetentionRate('6.5'); // Particular / Categoria B
      }
    } else if (countryCode === 'PT') {
      setCommissionVatRate(23);
      if (intermediaryType === 'company') {
        setRetentionRate('0'); // IRC dispensa geral entre empresas
      } else {
        setRetentionRate('11.5'); // CIRS Artigo 101
      }
    } else if (countryCode === 'BR') {
      setCommissionVatRate(0);
      setRetentionRate(intermediaryType === 'company' ? '1.5' : '15.0');
    } else {
      setCommissionVatRate(country?.vatOptions[0]?.r || 0);
      setRetentionRate('5.0');
    }
  }, [countryCode, intermediaryType]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const formatMoney = (val: number) => {
    return (
      new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val) + ` ${country.curr}`
    );
  };

  // Reset results if user changes inputs to enforce explicit confirmation
  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setResults(null);
  }, [countryCode, intermediaryType, commissionScope, productsTotal, servicesTotal, commissionPct, fixedCommissionAmount, includeVatOnCommission, commissionVatRate, retentionRate, tpaRate, tpaMode]);

  const calculateIntermediation = () => {
    const prodVal = parseFloat(productsTotal) || 0;
    const servVal = parseFloat(servicesTotal) || 0;
    const totalDealVal = prodVal + servVal;
    const commPct = parseFloat(commissionPct) || 0;
    const fixCommVal = parseFloat(fixedCommissionAmount) || 0;
    const retPct = parseFloat(retentionRate) || 0;
    const vatRate = includeVatOnCommission ? commissionVatRate : 0;
    const tpaVal = parseFloat(tpaRate) || 0;

    // 1. Determine the commission calculation base
    let commissionBaseTarget = 0;
    let grossCommission = 0;

    if (commissionScope === 'fixed_amount') {
      grossCommission = fixCommVal;
      commissionBaseTarget = totalDealVal;
    } else if (commissionScope === 'products_only') {
      commissionBaseTarget = prodVal;
      grossCommission = prodVal * (commPct / 100);
    } else if (commissionScope === 'services_only') {
      commissionBaseTarget = servVal;
      grossCommission = servVal * (commPct / 100);
    } else {
      // total_deal
      commissionBaseTarget = totalDealVal;
      grossCommission = totalDealVal * (commPct / 100);
    }

    // 2. VAT on commission (if invoice contains VAT)
    const commissionVatAmount = grossCommission * (vatRate / 100);
    const invoiceTotalFromIntermediary = grossCommission + commissionVatAmount;

    // 3. Withholding Tax (Retenção na Fonte por Lei)
    // The withholding tax is calculated on the gross taxable base (grossCommission)
    const withholdingTaxAmount = grossCommission * (retPct / 100);

    // 4. Banking / Transfer / POS fee (TPA) if applicable (Manual & Optional)
    const tpaCost = tpaVal <= 0
      ? 0
      : tpaMode === 'fixed'
        ? tpaVal
        : (grossCommission + commissionVatAmount) * (tpaVal / 100);

    // 5. Net amount that the owner must transfer to the intermediary
    // Owner pays: Invoice - Withholding Tax - TPA
    const netPayableToIntermediary = grossCommission + commissionVatAmount - withholdingTaxAmount - tpaCost;

    // 6. Tax that the owner MUST deliver to the State / Fisco (DAR/Guia)
    const taxToDeliverToState = withholdingTaxAmount;

    // 7. Total cash outlay by the owner for intermediation
    const totalOwnerIntermediationCost = netPayableToIntermediary + taxToDeliverToState + tpaCost;

    // 8. Remaining balance for the business owner
    const ownerRemainingDealBalance = totalDealVal - totalOwnerIntermediationCost;

    return {
      dealTitle: dealTitle || 'Intermediação Comercial',
      productsTotal: prodVal,
      servicesTotal: servVal,
      totalDealVal,
      commissionScope,
      commissionScopeLabel:
        commissionScope === 'products_only'
          ? 'Exclusivamente sobre os Produtos'
          : commissionScope === 'services_only'
          ? 'Exclusivamente sobre os Serviços'
          : commissionScope === 'total_deal'
          ? 'Sobre o Negócio Global (Produtos + Serviços)'
          : 'Honorário / Comissão Fixa Acordada',
      commissionPct: commPct,
      commissionBaseTarget,
      grossCommission,
      includeVatOnCommission,
      commissionVatRate: vatRate,
      commissionVatAmount,
      invoiceTotalFromIntermediary,
      retentionRate: retPct,
      withholdingTaxAmount,
      tpaRate: tpaVal,
      tpaMode,
      tpaCost,
      netPayableToIntermediary,
      taxToDeliverToState,
      totalOwnerIntermediationCost,
      ownerRemainingDealBalance,
      intermediaryType,
      intermediaryName: intermediaryName || (intermediaryType === 'company' ? 'Empresa Intermediária Lda' : 'Consultor Intermediário'),
      intermediaryNif: intermediaryNif || '999999999',
      ownerName: ownerName || 'Proprietário / Vendedor Principal',
      ownerNif: ownerNif || '555555555',
      date: new Date().toLocaleDateString('pt-PT')
    };
  };

  const handleSimulate = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const errors: Record<string, string> = {};
    const prodVal = parseFloat(productsTotal) || 0;
    const servVal = parseFloat(servicesTotal) || 0;
    const totalDeal = prodVal + servVal;
    const commPct = parseFloat(commissionPct) || 0;
    const fixVal = parseFloat(fixedCommissionAmount) || 0;

    if (totalDeal <= 0) {
      errors.deal = 'Indique o valor de Produtos e/ou Serviços do negócio a intermediar.';
    }

    if (commissionScope === 'fixed_amount') {
      if (fixVal <= 0) {
        errors.fixedCommissionAmount = 'Introduza o valor fixo da comissão do intermediário.';
      }
    } else {
      if (commPct <= 0 || commPct > 100) {
        errors.commissionPct = 'Indique uma percentagem de comissão válida entre 0.1% e 100%.';
      }
    }

    if (commissionScope === 'products_only' && prodVal <= 0) {
      errors.productsTotal = 'Para calcular comissão sobre produtos, o valor dos produtos deve ser superior a zero.';
    }

    if (commissionScope === 'services_only' && servVal <= 0) {
      errors.servicesTotal = 'Para calcular comissão sobre serviços, o valor dos serviços deve ser superior a zero.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Por favor, verifique os campos assinalados com erro.');
      return;
    }

    setFieldErrors({});

    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmAndExecute = async () => {
    setIsCalculating(true);
    try {
      const calc = calculateIntermediation();
      setResults(calc);
      setShowConfirmModal(false);
      setSuccessMessage('Simulação de intermediação confirmada e calculada com sucesso!');

      if (user && user.queriesRemaining > 0 && user.role !== 'staff' && user.role !== 'admin' && user.role !== 'admin_level1' && user.role !== 'super_admin') {
        onCalculationDone(Math.max(0, user.queriesRemaining - 1));
      } else if (!user) {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }

      // Save to Cloud Firestore
      if (user) {
        saveSimulationToFirestore(user.id, 'broker_intermediary', {
          country: countryCode,
          dealTitle: calc.dealTitle,
          totalDealVal: calc.totalDealVal,
          grossCommission: calc.grossCommission,
          netPayableToIntermediary: calc.netPayableToIntermediary,
          taxToDeliverToState: calc.taxToDeliverToState,
          retentionRate: calc.retentionRate
        }).catch(() => {});
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const prodVal = parseFloat(productsTotal) || 0;
  const servVal = parseFloat(servicesTotal) || 0;
  const totalDealVal = prodVal + servVal;
  const commPct = parseFloat(commissionPct) || 0;

  const simulationSummaryItems: SimulationSummaryItem[] = [
    {
      label: 'Valor Global da Transação',
      value: formatMoney(totalDealVal),
      detail: `Produtos: ${formatMoney(prodVal)} | Serviços: ${formatMoney(servVal)}`,
      isHighlight: true
    },
    {
      label: 'Comissão Negociada',
      value: commissionScope === 'fixed_amount' 
        ? formatMoney(parseFloat(fixedCommissionAmount) || 0)
        : `${commPct}% (${commissionScope === 'products_only' ? 'Produtos' : commissionScope === 'services_only' ? 'Serviços' : 'Negócio Global'})`
    },
    {
      label: 'País & Enquadramento Fiscal',
      value: `${country.name} (${country.curr})`,
      detail: `Retenção na Fonte: ${retentionRate}% | IVA Intermediação: ${includeVatOnCommission ? `${commissionVatRate}%` : 'Isento'}`
    }
  ];

  const activeResults = results;

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!activeResults) return;

    const wb = XLSX.utils.book_new();

    const data = [
      ['Nanucloud - Simulação de Intermediação Comercial & Comissões'],
      ['Data:', activeResults.date],
      ['País:', country.name],
      [''],
      ['1. DADOS DO NEGÓCIO & INTERVENIENTES'],
      ['Descrição do Negócio:', activeResults.dealTitle || 'Intermediação Comercial'],
      ['Proprietário / Vendedor Principal:', `${activeResults.ownerName || 'Não especificado'} (NIF: ${activeResults.ownerNif || '---'})`],
      ['Intermediário / Corretor:', `${activeResults.intermediaryName || 'Não especificado'} (NIF: ${activeResults.intermediaryNif || '---'})`],
      ['Tipo de Intermediário:', activeResults.intermediaryType === 'company' ? 'Empresa (Pessoa Coletiva)' : 'Particular / Consultor Independente'],
      [''],
      ['2. VALOR GLOBAL DO NEGÓCIO INTERMEDIADO'],
      ['Valor de Produtos / Mercadorias:', activeResults.productsTotal, country.curr],
      ['Valor de Prestação de Serviços:', activeResults.servicesTotal, country.curr],
      ['Valor Total Global da Transação:', activeResults.totalDealVal, country.curr],
      [''],
      ['3. ESTRATÉGIA DE COMISSÃO'],
      ['Incidência da Comissão:', activeResults.commissionScopeLabel],
      ['Base de Incidência de Cálculo:', activeResults.commissionBaseTarget, country.curr],
      ['Percentagem / Taxa de Comissão:', `${activeResults.commissionPct}%`],
      ['Comissão Bruta Acordada:', activeResults.grossCommission, country.curr],
      ['IVA sobre a Comissão:', activeResults.commissionVatAmount, country.curr],
      ['Total da Fatura do Intermediário:', activeResults.invoiceTotalFromIntermediary, country.curr],
      [''],
      ['4. OBRIGAÇÕES LEGAIS & RETENÇÃO NA FONTE (FISCO / TRIBUTAÇÃO)'],
      ['Taxa de Retenção na Fonte:', `${activeResults.retentionRate}%`],
      ['Valor de Retenção Retido pelo Proprietário:', activeResults.withholdingTaxAmount, country.curr],
      ['Entidade Responsável pela Retenção:', 'Proprietário (desconta e entrega ao Estado via Guia/DAR)'],
      ['Taxa Bancária / TPA (Opcional):', activeResults.tpaCost, country.curr],
      [''],
      ['5. APURAMENTO FINAL DE DESEMBOLSOS'],
      ['VALOR LÍQUIDO A PAGAR AO INTERMEDIÁRIO (BANCÁRIO):', activeResults.netPayableToIntermediary, country.curr],
      ['IMPOSTO A ENTREGAR AO ESTADO PELO PROPRIETÁRIO:', activeResults.taxToDeliverToState, country.curr],
      ['CUSTO TOTAL DE INTERMEDIAÇÃO PARA O PROPRIETÁRIO:', activeResults.totalOwnerIntermediationCost, country.curr],
      ['VALOR LÍQUIDO REMANESCENTE PARA O PROPRIETÁRIO:', activeResults.ownerRemainingDealBalance, country.curr],
      [''],
      ['Aviso Legal Nanucloud:', 'A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Intermediacao_Fiscal');
    XLSX.writeFile(wb, `Nanucloud_Intermediacao_${(activeResults.dealTitle || 'Negocio').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!activeResults) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Banner (Fundo Branco com Logo Oficial Nanucloud)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Linha de acento verde oficial
    doc.setDrawColor(0, 168, 89);
    doc.setLineWidth(0.8);
    doc.line(14, 26, pageWidth - 14, 26);

    // Logo Nanucloud
    doc.setDrawColor(0, 168, 89);
    doc.setFillColor(0, 168, 89);
    doc.roundedRect(14, 7, 7, 7, 1.5, 1.5, 'FD');
    doc.setFillColor(255, 255, 255);
    doc.circle(17.5, 10.5, 2, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text('Nanu', 24, 14);
    const nanuWidth = doc.getTextWidth('Nanu');
    doc.setTextColor(0, 168, 89);
    doc.text('cloud', 24 + nanuWidth, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Data: ${activeResults.date} | Ref: INT-${Date.now().toString().slice(-6)}`, pageWidth - 14, 14, { align: 'right' });

    // Business Summary Info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Informação do Negócio e Intervenientes', 14, 35);

    autoTable(doc, {
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      head: [['Campo', 'Discriminação']],
      body: [
        ['Negócio Intermediado', activeResults.dealTitle || 'Intermediação Comercial'],
        ['Proprietário / Vendedor Principal', `${activeResults.ownerName || 'Não especificado'} (NIF: ${activeResults.ownerNif || '---'})`],
        ['Intermediário / Corretor', `${activeResults.intermediaryName || 'Não especificado'} (NIF: ${activeResults.intermediaryNif || '---'}) - ${activeResults.intermediaryType === 'company' ? 'Empresa' : 'Particular'}`],
        ['Valor de Produtos / Mercadorias', formatMoney(activeResults.productsTotal)],
        ['Valor de Serviços', formatMoney(activeResults.servicesTotal)],
        ['Valor Global da Operação', formatMoney(activeResults.totalDealVal)],
        ['Incidência da Comissão', activeResults.commissionScopeLabel],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    const finalY1 = (doc as any).lastAutoTable.finalY || 95;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. Liquidação de Comissão, Impostos e Retenções na Fonte', 14, finalY1 + 8);

    autoTable(doc, {
      startY: finalY1 + 11,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      head: [['Rubrica de Cálculo', 'Percentual', 'Montante', 'Enquadramento / Destinatário']],
      body: [
        ['Comissão Bruta Acordada', `${activeResults.commissionPct}%`, formatMoney(activeResults.grossCommission), 'Base de incidência do intermediário'],
        ['IVA s/ Comissão (se aplicável)', `${activeResults.commissionVatRate}%`, formatMoney(activeResults.commissionVatAmount), 'Liquidado na fatura do intermediário'],
        ['Retenção na Fonte por Lei', `${activeResults.retentionRate}%`, `- ${formatMoney(activeResults.withholdingTaxAmount)}`, 'Descontado pelo Proprietário e entregue ao Fisco'],
        ['Taxas Bancárias / TPA (Opcional)', activeResults.tpaCost > 0 ? (activeResults.tpaMode === 'fixed' ? `${formatMoney(activeResults.tpaRate)}` : `${activeResults.tpaRate}%`) : '0% (Isento)', `- ${formatMoney(activeResults.tpaCost)}`, 'Encargo de processamento'],
        ['LÍQUIDO A PAGAR AO INTERMEDIÁRIO', '---', formatMoney(activeResults.netPayableToIntermediary), 'Transferência Bancária / Pagamento Líquido'],
        ['IMPOSTO A ENTREGAR AO ESTADO (GUIA / DAR)', '---', formatMoney(activeResults.taxToDeliverToState), 'Obrigação tributária do Proprietário'],
        ['VALOR REMANESCENTE PROPRIETÁRIO', '---', formatMoney(activeResults.ownerRemainingDealBalance), 'Saldo Líquido final da venda'],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    const finalY2 = (doc as any).lastAutoTable.finalY || 180;

    // Rodapé com Aviso Legal Oficial
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 281, pageWidth - 14, 281);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Aviso Legal Nanucloud: A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.',
      14,
      286,
      { maxWidth: 180 }
    );

    doc.save(`Nanucloud_Intermediacao_${(activeResults.dealTitle || 'Negocio').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Aviso de Créditos e Estado de Acesso RBAC */}
      <ClientCreditNoticeBanner
        user={user}
        onOpenPlans={onOpenPlans}
        onOpenAuth={onOpenAuth}
      />

      {/* Header Banner */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-tight">
                  Módulo de Intermediários & Corretagem de Negócios
                </h2>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                  B2B & B2C
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulação financeira e fiscal de comissões, incidência sobre produtos/serviços, apuramento da retenção na fonte legal e obrigações do proprietário perante as autoridades fiscais.
              </p>
            </div>
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
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Section 1: Intermediary Profile (Empresa vs Particular) */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              1. Perfil & Função do Intermediário
            </label>
            <span className="text-[11px] text-slate-400 font-mono">Selecione o enquadramento jurídico</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setIntermediaryType('company');
                clearFieldError('intermediaryType');
              }}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                intermediaryType === 'company'
                  ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 ring-1 ring-indigo-500/30'
                  : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${intermediaryType === 'company' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-mono uppercase text-slate-100">Empresa / Pessoa Coletiva</strong>
                  {intermediaryType === 'company' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Sociedade comercial, agência de mediação ou consultoria constituída com NIF empresarial e emissão de fatura/recibo formal.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIntermediaryType('individual');
                clearFieldError('intermediaryType');
              }}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                intermediaryType === 'individual'
                  ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 ring-1 ring-indigo-500/30'
                  : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${intermediaryType === 'individual' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-mono uppercase text-slate-100">Particular / Pessoa Singular</strong>
                  {intermediaryType === 'individual' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Consultor independente, corretor pessoa singular ou intermediário ocasional atuando a título individual.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Country & Business Deal Values */}
        <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-800/80 space-y-4 mb-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              2. Valores do Negócio Intermediado
            </label>
            <span className="text-xs font-mono font-bold text-indigo-400">{country.curr}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                País / Jurisdição Fiscal
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
              >
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.curr})
                  </option>
                ))}
              </select>
            </div>

            {/* Products Total */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Valor de Produtos (Bens)</span>
                <span className="text-[10px] text-slate-500">Mercadoria</span>
              </label>
              <input
                type="number"
                value={productsTotal}
                onChange={(e) => {
                  setProductsTotal(e.target.value);
                  clearFieldError('deal');
                  clearFieldError('productsTotal');
                }}
                placeholder="Ex: 50000000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition font-bold"
              />
            </div>

            {/* Services Total */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Valor de Serviços</span>
                <span className="text-[10px] text-slate-500">Mão de Obra</span>
              </label>
              <input
                type="number"
                value={servicesTotal}
                onChange={(e) => {
                  setServicesTotal(e.target.value);
                  clearFieldError('deal');
                  clearFieldError('servicesTotal');
                }}
                placeholder="Ex: 15000000"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition font-bold"
              />
            </div>
          </div>

          {/* Total Deal Preview Pill */}
          <div className="flex flex-wrap items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">
              Valor Total do Negócio a Intermediar (Produtos + Serviços):
            </span>
            <strong className="text-emerald-400 text-sm">
              {formatMoney((parseFloat(productsTotal) || 0) + (parseFloat(servicesTotal) || 0))}
            </strong>
          </div>
          {fieldErrors.deal && (
            <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{fieldErrors.deal}</span>
            </p>
          )}
        </div>

        {/* Section 3: Commission Scope & Percentage */}
        <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-800/80 space-y-4 mb-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-400" />
              3. Opção de Incidência da Comissão do Intermediário
            </label>
            <span className="text-[11px] text-slate-400 font-mono">Defina a regra contratual</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setCommissionScope('total_deal');
                clearFieldError('productsTotal');
                clearFieldError('servicesTotal');
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                commissionScope === 'total_deal'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-mono uppercase">Negócio Global</div>
              <div className="text-[10px] opacity-80 font-sans">Produtos + Serviços</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCommissionScope('products_only');
                clearFieldError('productsTotal');
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                commissionScope === 'products_only'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-mono uppercase">Somente Produtos</div>
              <div className="text-[10px] opacity-80 font-sans">Apenas s/ venda de bens</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCommissionScope('services_only');
                clearFieldError('servicesTotal');
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                commissionScope === 'services_only'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-mono uppercase">Somente Serviços</div>
              <div className="text-[10px] opacity-80 font-sans">Apenas s/ prestação serv.</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCommissionScope('fixed_amount');
                clearFieldError('fixedCommissionAmount');
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                commissionScope === 'fixed_amount'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-mono uppercase">Valor Fixo</div>
              <div className="text-[10px] opacity-80 font-sans">Honorário em dinheiro</div>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {commissionScope === 'fixed_amount' ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Valor Fixo da Comissão / Corretagem ({country.curr}) *
                </label>
                <input
                  type="number"
                  value={fixedCommissionAmount}
                  onChange={(e) => {
                    setFixedCommissionAmount(e.target.value);
                    clearFieldError('fixedCommissionAmount');
                  }}
                  placeholder={`Ex: 2500000 (${country.curr})`}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition font-bold"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                  <span>Percentagem da Comissão (%) *</span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    Incidência: {commissionScope === 'products_only' ? 'Produtos' : commissionScope === 'services_only' ? 'Serviços' : 'Total'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={commissionPct}
                    onChange={(e) => {
                      setCommissionPct(e.target.value);
                      clearFieldError('commissionPct');
                    }}
                    step="0.1"
                    placeholder="Ex: 7.5"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">%</span>
                </div>
              </div>
            )}

            {/* Quick Commission Percentage Presets */}
            {commissionScope !== 'fixed_amount' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Atalhos de Comissão Habitual no Mercado
                </label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['3.0', '5.0', '7.5', '10.0', '15.0'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setCommissionPct(p);
                        clearFieldError('commissionPct');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                        commissionPct === p
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Legal Framework, Decree Notice & Withholding Tax Settings */}
        <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-800/80 space-y-4 mb-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                4. Enquadramento Legal & Taxas de Retenção na Fonte (Fisco / Tributação)
              </label>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-mono font-bold">
              Recomendação Legal Flexível
            </span>
          </div>

          {/* Legal Notice & Decree Recommendation Callout */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-mono">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {countryCode === 'AO'
                  ? 'Aviso Legal Fiscal • República de Angola (Decreto Legislativo Presidencial n.º 2/14 & Código II Lei 19/14 / Lei 26/20)'
                  : countryCode === 'PT'
                  ? 'Aviso Legal Fiscal • Portugal (Código do IRS Artigo 101.º & CIRC)'
                  : 'Aviso de Enquadramento Legal & Fiscal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              {countryCode === 'AO' ? (
                <>
                  Pela lei fiscal angolana, a intermediação de negócios e comissões sujeita-se à <strong>Retenção na Fonte de 6.5%</strong>. A obrigação legal de entrega do imposto ao Estado é do <strong>Proprietário do Negócio / Entidade Adquirente</strong>, que desconta este valor no ato do pagamento ao intermediário e entrega ao Estado via <strong>DAR (Documento de Arrecadação de Receitas)</strong>.
                  <br />
                  <span className="text-amber-200 text-[10px]">
                    * As taxas abaixo são recomendações baseadas no decreto. O utilizador pode alterar livremente conforme o contrato ou acordos de isenção.
                  </span>
                </>
              ) : (
                <>
                  A entidade contratante/proprietária deve efetuar a retenção na fonte sobre as comissões pagas aos intermediários nos termos dos decretos e normas fiscais em vigor, transferindo o valor líquido ao intermediário e o imposto ao fisco.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Retenção na Fonte Editable */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Taxa de Retenção na Fonte (%)</span>
                <span className="text-[10px] text-amber-400 font-mono">Recomendado: 6.5%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={retentionRate}
                  onChange={(e) => setRetentionRate(e.target.value)}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition font-bold"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">%</span>
              </div>
            </div>

            {/* IVA on Commission Toggle & Rate */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>IVA s/ Fatura da Comissão</span>
                <span className="text-[10px] text-indigo-400 font-mono">{country.curr}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeVatOnCommission(!includeVatOnCommission)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    includeVatOnCommission
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span>{includeVatOnCommission ? `Com IVA (${commissionVatRate}%)` : 'Isento / Sem IVA'}</span>
                </button>
              </div>
            </div>

            {/* TPA / Banking Transfer Fee - Optional & Manual */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Taxa TPA / Multicaixa (Opcional)
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md p-0.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setTpaMode('pct')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      tpaMode === 'pct' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setTpaMode('fixed')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      tpaMode === 'fixed' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {country.curr}
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={tpaRate}
                  onChange={(e) => setTpaRate(e.target.value)}
                  step={tpaMode === 'pct' ? '0.1' : '100'}
                  min="0"
                  placeholder="0 (Isento)"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                  {tpaMode === 'pct' ? '%' : country.curr}
                </span>
              </div>

              {/* Quick Presets for TPA */}
              <div className="flex items-center gap-1 pt-1">
                {[
                  { label: '0% (Isento)', val: '0', mode: 'pct' as const },
                  { label: '1.0%', val: '1.0', mode: 'pct' as const },
                  { label: '1.5%', val: '1.5', mode: 'pct' as const },
                  { label: '2.5%', val: '2.5', mode: 'pct' as const }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setTpaMode(item.mode);
                      setTpaRate(item.val);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                      tpaRate === item.val && tpaMode === item.mode
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Stakeholders Identifiers (Optional for Official Reports) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-3.5 bg-[#0F172A] rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-400 block">
              Dados do Proprietário / Empresa Vendedora (Opcional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nome da Empresa / Vendedor"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={ownerNif}
                onChange={(e) => setOwnerNif(e.target.value)}
                placeholder="NIF do Proprietário"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#0F172A] rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-400 block">
              Dados do Intermediário / Corretor (Opcional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={intermediaryName}
                onChange={(e) => setIntermediaryName(e.target.value)}
                placeholder="Nome do Intermediário"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={intermediaryNif}
                onChange={(e) => setIntermediaryNif(e.target.value)}
                placeholder="NIF do Intermediário"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Calculate Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleSimulate}
            disabled={isCalculating}
            className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{isCalculating ? 'A PROCESSAR SIMULAÇÃO...' : 'CALCULAR & CONFIRMAR COMISSÕES'}</span>
          </button>
        </div>
      </div>

      {/* Results Breakdown (Gated behind Calculate button) */}
      {activeResults ? (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          {/* Action Bar with Export Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E293B] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-100 font-mono uppercase">
                    Demonstração da Intermediação & Liquidação Fiscal
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    SIMULAÇÃO CONFIRMADA
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Base de Cálculo: {activeResults.commissionScopeLabel} ({formatMoney(activeResults.commissionBaseTarget)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportExcel}
                className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Emitir Relatório PDF</span>
              </button>
            </div>
          </div>

          {/* Two-Column Dual Perspective Comparison (Lado do Intermediário vs Lado do Proprietário) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: LADO DO INTERMEDIÁRIO (O QUE TEM A RECEBER) */}
            <div className="bg-[#1E293B] border border-indigo-500/40 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-indigo-300 uppercase">
                      1. Visão do Intermediário ({activeResults.intermediaryType === 'company' ? 'Empresa' : 'Particular'})
                    </h4>
                    <p className="text-[10px] text-slate-400">Montante líquido creditado na conta bancária</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                  Comissão: {activeResults.commissionPct}%
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300 bg-[#0F172A] p-2.5 rounded-lg border border-slate-800">
                  <span>Base de Incidência ({activeResults.commissionScopeLabel})</span>
                  <strong className="text-slate-100">{formatMoney(activeResults.commissionBaseTarget)}</strong>
                </div>

                {/* Subtotal Sem IVA da Comissão */}
                <div className="flex justify-between items-center text-cyan-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold">(=) COMISSÃO BRUTA ACORDADA (SEM IVA)</span>
                  <strong className="text-cyan-300 font-bold font-mono">{formatMoney(activeResults.grossCommission)}</strong>
                </div>

                {activeResults.includeVatOnCommission ? (
                  <>
                    <div className="flex justify-between text-indigo-300 bg-[#0F172A] p-2.5 rounded-lg border border-slate-800">
                      <span>(+) IVA s/ Comissão ({activeResults.commissionVatRate}%)</span>
                      <strong className="font-mono">+ {formatMoney(activeResults.commissionVatAmount)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-emerald-300 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                      <span className="font-bold">(=) TOTAL DA FATURA DA COMISSÃO (COM IVA)</span>
                      <strong className="text-emerald-300 font-bold font-mono">{formatMoney(activeResults.invoiceTotalFromIntermediary)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-400 bg-[#0F172A] p-2.5 rounded-lg border border-slate-800 text-[11px]">
                    <span>Regime de IVA da Comissão</span>
                    <span className="text-slate-300">Operação Isenta de IVA</span>
                  </div>
                )}

                {/* Deductions from Intermediary */}
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Deduções Obrigatórias Descontadas no Pagamento:
                  </p>

                  <div className="flex justify-between text-rose-300 font-bold">
                    <span>(-) Retenção na Fonte por Lei ({activeResults.retentionRate}%)</span>
                    <span>- {formatMoney(activeResults.withholdingTaxAmount)}</span>
                  </div>

                  {activeResults.tpaCost > 0 && (
                    <div className="flex justify-between text-rose-300">
                      <span>(-) Encargo Bancário / TPA ({activeResults.tpaRate}%)</span>
                      <span>- {formatMoney(activeResults.tpaCost)}</span>
                    </div>
                  )}
                </div>

                {/* Net Payment Highlight */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-indigo-900/30 border border-indigo-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 block font-bold">
                      VALOR LÍQUIDO A RECEBER
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Transferência direta para a conta do intermediário
                    </span>
                  </div>
                  <strong className="text-lg font-bold font-mono text-emerald-400">
                    {formatMoney(activeResults.netPayableToIntermediary)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Right Card: LADO DO PROPRIETÁRIO DO NEGÓCIO (O QUE DEVE PAGAR E RECOLHER) */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase">
                      2. Visão do Proprietário / Vendedor Principal
                    </h4>
                    <p className="text-[10px] text-slate-400">Desembolsos financeiros e obrigações com o Estado</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  Substituto Tributário
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300 bg-[#0F172A] p-2.5 rounded-lg border border-slate-800">
                  <span>Faturação Total Bruta do Negócio</span>
                  <strong className="text-slate-100">{formatMoney(activeResults.totalDealVal)}</strong>
                </div>

                <div className="flex justify-between text-amber-300 bg-[#0F172A] p-2.5 rounded-lg border border-slate-800">
                  <span>(-) Pagamento Líquido ao Intermediário</span>
                  <strong>- {formatMoney(activeResults.netPayableToIntermediary)}</strong>
                </div>

                {/* Tax Duty to the State */}
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>(-) Imposto Retido a Entregar ao Estado / DAR</span>
                    <span>- {formatMoney(activeResults.taxToDeliverToState)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    O proprietário deve recolher este imposto ao Estado até ao final do mês subsequente.
                  </p>
                </div>

                <div className="flex justify-between text-slate-400 bg-[#0F172A] p-2.5 rounded-lg border border-slate-800">
                  <span>Custo Total de Intermediação (Intermediário + Imposto)</span>
                  <strong className="text-rose-400 font-bold">{formatMoney(activeResults.totalOwnerIntermediationCost)}</strong>
                </div>

                {/* Net Remaining Balance for Owner */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block font-bold">
                      SALDO LÍQUIDO DO PROPRIETÁRIO
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Montante remanescente da venda após corretagem e retenção
                    </span>
                  </div>
                  <strong className="text-lg font-bold font-mono text-emerald-400">
                    {formatMoney(activeResults.ownerRemainingDealBalance)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Compliance Banner & Professional Disclaimer */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Scale className="w-4 h-4" />
              <span>Resumo Fiscal da Operação de Intermediação</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Esta simulação discrimina com precisão a separação de obrigações: o <strong>Intermediário</strong> recebe o seu rendimento líquido na conta ({formatMoney(activeResults.netPayableToIntermediary)}), enquanto o <strong>Proprietário</strong> retém a taxa por lei ({formatMoney(activeResults.taxToDeliverToState)}) e assume a responsabilidade formal de liquidar a guia de retenção junto das autoridades fiscais.
            </p>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-[11px] text-amber-300 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Aviso Legal Nanucloud:</strong> A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1E293B]/60 border border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 font-mono">Aguardando Confirmação da Simulação</h3>
          <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
            Preencha os valores da transação e parâmetros da comissão e clique no botão <strong className="text-indigo-300">"CALCULAR & CONFIRMAR COMISSÕES"</strong> para apurar os montantes e retenções fiscais.
          </p>
        </div>
      )}

      {/* Confirmation Modal before calculating results */}
      <ConfirmSimulationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndExecute}
        moduleName="Intermediação Comercial & Broker"
        title="Confirmar Simulação de Comissões"
        subtitle="Reveja os valores da transação, taxa de comissão e retenção fiscal na fonte antes de apurar os valores finais."
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
    </div>
  );
};
