import React, { useState, useEffect } from 'react';
import { UserSafe, ServiceBillingMode } from '../types';
import { COUNTRIES_DB, getEffectiveCountryFiscal, getAvailableCountryList } from '../data/countries';
import { SupportedLang, TRANSLATIONS } from '../i18n/translations';
import {
  Briefcase,
  Clock,
  Navigation,
  DollarSign,
  Users,
  Utensils,
  Car,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Receipt,
  Building2,
  Calendar,
  Save,
  RotateCcw,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { showToast } from '../context/NotificationContext';
import { ClientCreditNoticeBanner } from './ClientCreditNoticeBanner';
import { canUserSimulate } from '../utils/accessControl';
import { ConfirmSimulationModal, SimulationSummaryItem } from './ConfirmSimulationModal';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';
import { NumericInput } from './common/NumericInput';
import { parseFormattedNumber } from '../utils/numberFormat';

interface ServicesConsultingSimulatorProps {
  user: UserSafe | null;
  currentLang: SupportedLang;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onCalculationDone: (newCredits: number) => void;
}

export const ServicesConsultingSimulator: React.FC<ServicesConsultingSimulatorProps> = ({
  user,
  currentLang,
  onOpenPlans,
  onOpenAuth,
  onCalculationDone
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;

  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);

  // Configuration and inputs
  const [countryCode, setCountryCode] = useState<string>('AO');
  const [serviceTitle, setServiceTitle] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [billingMode, setBillingMode] = useState<ServiceBillingMode>('hourly');

  // Pricing inputs
  const [fixedAmount, setFixedAmount] = useState<string>('');
  
  // Hourly Mode
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [totalHours, setTotalHours] = useState<string>('');

  // Distance / KM Mode
  const [ratePerKm, setRatePerKm] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true);

  // Optional Logistics paid by client
  const [clientPaysTransport, setClientPaysTransport] = useState<boolean>(false);
  const [transportCostPerPerson, setTransportCostPerPerson] = useState<string>('');
  const [techniciansCount, setTechniciansCount] = useState<number>(1);

  const [clientPaysMeals, setClientPaysMeals] = useState<boolean>(false);
  const [mealAllowancePerPerson, setMealAllowancePerPerson] = useState<string>('');
  const [daysDuration, setDaysDuration] = useState<number>(1);

  // Fiscal Parameters
  const [vatRate, setVatRate] = useState<number>(14);
  const [retentionRate, setRetentionRate] = useState<string>('6,500');
  const [marginPercent, setMarginPercent] = useState<string>('');
  const [tpaRate, setTpaRate] = useState<string>('');
  const [applyRetention, setApplyRetention] = useState<boolean>(true);

  // UI state
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const [countryVersion, setCountryVersion] = useState<number>(0);
  const country = getEffectiveCountryFiscal(countryCode);
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin' || user?.role === 'admin_level1' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);

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

  // Initialize fiscal defaults on country change
  useEffect(() => {
    if (country) {
      setVatRate(country.vatOptions[0]?.r ?? 14);
      setTpaRate(country.tpa ? String(country.tpa).replace('.', ',') : '');
      const defRet = country.retentionServiceRate ?? (countryCode === 'AO' ? 6.5 : countryCode === 'PT' ? 11.5 : 5.0);
      setRetentionRate(String(defRet).replace('.', ','));
      setHasCalculated(false);
    }
  }, [countryCode, countryVersion]);

  // Calculations
  const calcBaseLabor = () => {
    if (billingMode === 'fixed') {
      return parseFormattedNumber(fixedAmount);
    }
    if (billingMode === 'hourly') {
      const rate = parseFormattedNumber(hourlyRate);
      const hours = parseFormattedNumber(totalHours);
      return rate * hours;
    }
    if (billingMode === 'distance') {
      const kmRate = parseFormattedNumber(ratePerKm);
      const km = parseFormattedNumber(distanceKm);
      const multiplier = isRoundTrip ? 2 : 1;
      return kmRate * km * multiplier;
    }
    return 0;
  };

  const baseLabor = calcBaseLabor();

  // Transport calculation
  const totalTransport = clientPaysTransport
    ? parseFormattedNumber(transportCostPerPerson) * (techniciansCount || 1)
    : 0;

  // Meals calculation
  const totalMeals = clientPaysMeals
    ? parseFormattedNumber(mealAllowancePerPerson) * (techniciansCount || 1) * (daysDuration || 1)
    : 0;

  // Total Logistics expenses
  const totalLogistics = totalTransport + totalMeals;

  // Subtotal before margin
  const subtotalDirectCost = baseLabor + totalLogistics;

  // Profit Margin / Markup
  const marginPct = parseFormattedNumber(marginPercent);
  const markupAmount = baseLabor * (marginPct / 100);

  // Taxable Base (Subtotal of service + markup + reimbursable logistics if applicable)
  const taxableBase = baseLabor + markupAmount + totalLogistics;

  // VAT (IVA)
  const vatAmount = taxableBase * (vatRate / 100);

  // Gross Total Invoiced (Valor Bruto Faturado com IVA)
  const grossInvoiceTotal = taxableBase + vatAmount;

  // Withholding Tax (Retenção na Fonte)
  const effectiveRetentionRate = applyRetention ? parseFormattedNumber(retentionRate) : 0;
  const withholdingTaxAmount = taxableBase * (effectiveRetentionRate / 100);

  // TPA fee (if client pays by card/Multicaixa)
  const tpaFeeRate = parseFormattedNumber(tpaRate);
  const tpaFeeAmount = grossInvoiceTotal * (tpaFeeRate / 100);

  // Net Cash Received by Service Provider
  const netReceivedFromClient = grossInvoiceTotal - withholdingTaxAmount;
  const netBankReceived = netReceivedFromClient - tpaFeeAmount;

  // Net Operational Profit for Provider (Lucro Líquido Real)
  const netOperationalProfit = (baseLabor + markupAmount) - withholdingTaxAmount - tpaFeeAmount;

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${country.curr}`;
  };

  const handleRequestCalculate = () => {
    setErrorMessage(null);

    if (baseLabor <= 0) {
      setErrorMessage('Por favor introduza o valor dos honorários de serviço (Ex: 150.000 Kz).');
      showToast({
        type: 'error',
        title: 'Validação',
        message: 'Por favor introduza o valor dos honorários de serviço (Ex: 150.000 Kz).'
      });
      return;
    }

    // AUTH & RBAC SIMULATION CHECK - Allows free demo credits without login
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

    // Direct execution without blocking modal
    handleConfirmAndExecute();
  };

  const handleConfirmAndExecute = async () => {
    setIsCalculating(true);
    try {
      if (user && user.id !== 'visitante_anonimo' && user.queriesRemaining > 0 && user.role !== 'staff' && user.role !== 'admin' && user.role !== 'admin_level1' && user.role !== 'super_admin') {
        const newQueries = Math.max(0, user.queriesRemaining - 1);
        onCalculationDone(newQueries);
      } else if (!user || user.id === 'visitante_anonimo') {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }
      setHasCalculated(true);
      setShowConfirmModal(false);
      showToast({
        type: 'success',
        title: 'Honorários Calculados',
        message: 'Orçamento e honorários de consultoria apurados com sucesso!'
      });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } finally {
      setIsCalculating(false);
    }
  };

  const simulationSummaryItems: SimulationSummaryItem[] = [
    {
      label: 'Honorários Base de Serviço',
      value: formatCurrency(baseLabor),
      detail: billingMode === 'fixed' ? 'Valor Fixo Fechado' : billingMode === 'hourly' ? `${totalHours}h a ${formatCurrency(parseFormattedNumber(hourlyRate) || 0)}/h` : `${distanceKm} km`,
      isHighlight: true
    },
    {
      label: 'Margem de Consultoria / Sobrecusto',
      value: `${marginPct}% (+${formatCurrency(markupAmount)})`
    },
    {
      label: 'País & Enquadramento Fiscal',
      value: `${country.name} (${country.curr})`,
      detail: `IVA: ${vatRate}% | Retenção: ${applyRetention ? `${effectiveRetentionRate}%` : 'Isento'} | TPA: ${tpaRate}%`
    }
  ];

  if (totalLogistics > 0) {
    simulationSummaryItems.push({
      label: 'Despesas de Logística (Transporte / Diárias)',
      value: formatCurrency(totalLogistics),
      detail: `${techniciansCount} técnicos × ${daysDuration} dias`
    });
  }

  // Export to PDF
  const handleExportPDF = () => {
    setPdfGenerating(true);
    try {
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
      doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')} | Ref: SERV-${Date.now().toString().slice(-6)}`, pageWidth - 14, 14, { align: 'right' });

      // Client & Service Info Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DA PROPOSTA DE SERVIÇOS', 14, 38);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Serviço / Projeto: ${serviceTitle || 'Não especificado'}`, 14, 45);
      doc.text(`Cliente: ${clientName || 'Consumidor Final / Não informado'}`, 14, 51);
      doc.text(
        `Modalidade de Cobrança: ${
          billingMode === 'fixed'
            ? 'Valor Fixo Global'
            : billingMode === 'hourly'
            ? `Por Hora (${totalHours}h a ${formatCurrency(parseFormattedNumber(hourlyRate) || 0)}/h)`
            : `Por Distância (${distanceKm} km ${isRoundTrip ? 'Ida e Volta' : 'Só Ida'} a ${formatCurrency(parseFormattedNumber(ratePerKm) || 0)}/km)`
        }`,
        14,
        57
      );

      // Breakdown Table
      const tableRows = [
        ['Honorários Base do Serviço / Mão de Obra', formatCurrency(baseLabor)],
        [`Margem de Consultoria / Sobrecusto (${marginPct}%)`, formatCurrency(markupAmount)],
        [
          `Transporte (${techniciansCount} técnicos${clientPaysTransport ? ' - Pago p/ Cliente' : ' - N/A'})`,
          formatCurrency(totalTransport)
        ],
        [
          `Alimentação / Diárias (${techniciansCount} téc. × ${daysDuration} dias)`,
          formatCurrency(totalMeals)
        ],
        ['TOTAL DO SERVIÇO / BASE TRIBUTÁVEL (SEM IVA)', formatCurrency(taxableBase)],
        [`(+) IVA Liquidado (${vatRate}% - Se Aplicável)`, `+ ${formatCurrency(vatAmount)}`],
        ['(=) VALOR BRUTO TOTAL FATURADO (COM IVA)', formatCurrency(grossInvoiceTotal)],
        [
          `Retenção na Fonte Suportada (${effectiveRetentionRate}% - Deduzida pelo Cliente)`,
          `- ${formatCurrency(withholdingTaxAmount)}`
        ],
        [`Taxa TPA / Multicaixa (${tpaRate}%)`, `- ${formatCurrency(tpaFeeAmount)}`],
        ['VALOR LÍQUIDO A RECEBER EM CONTA BANCÁRIA', formatCurrency(netBankReceived)]
      ];

      autoTable(doc, {
        startY: 65,
        head: [['Item / Discriminação Financeira', 'Valor']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3.5 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
        }
      });

      // Notes & Legal Disclaimer
      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('NOTAS E ENQUADRAMENTO DA PROPOSTA:', 14, finalY + 8);
      doc.text(country.importantNotes?.services || 'Valores calculados em conformidade com as taxas fiscais aplicáveis.', 14, finalY + 14, { maxWidth: 180 });

      // Rodapé com Aviso Legal Oficial
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 281, pageWidth - 14, 281);
      doc.setFontSize(6.5);
      doc.text(
        'Aviso Legal Nanucloud: A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.',
        14,
        286,
        { maxWidth: 180 }
      );

      doc.save(`Nanucloud_Proposta_Servicos_${(serviceTitle || 'Servico').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      setExportNotice('Proposta comercial em PDF exportada com sucesso!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const data = [
        ['Nanucloud - Proposta de Prestação de Serviços'],
        ['Data', new Date().toLocaleDateString('pt-PT')],
        ['Serviço', serviceTitle],
        ['Cliente', clientName || 'Não especificado'],
        ['Moeda', country.curr],
        [],
        ['PARÂMETRO', 'VALOR / QUANTIDADE', 'TOTAL'],
        ['Modalidade de Cobrança', billingMode === 'fixed' ? 'Fixo' : billingMode === 'hourly' ? 'Por Hora' : 'Por KM', ''],
        ['Base dos Honorários', baseLabor, country.curr],
        ['Margem de Consultoria (%)', `${marginPct}%`, markupAmount],
        ['Transporte Pessoas', `${techniciansCount} técnicos`, totalTransport],
        ['Alimentação / Diárias', `${techniciansCount} téc. x ${daysDuration} dias`, totalMeals],
        ['TOTAL DO SERVIÇO / BASE TRIBUTÁVEL (SEM IVA)', '', taxableBase],
        ['IVA Liquidado (%)', `${vatRate}%`, vatAmount],
        ['TOTAL BRUTO FATURADO (COM IVA)', '', grossInvoiceTotal],
        ['Retenção na Fonte (%)', `${effectiveRetentionRate}%`, withholdingTaxAmount],
        ['Taxa TPA (%)', `${tpaRate}%`, tpaFeeAmount],
        ['Valor Líquido a Receber', '', netBankReceived],
        ['Lucro Operacional Líquido', '', netOperationalProfit],
        [],
        ['Aviso Legal Nanucloud:', 'A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.']
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Simulacao_Servicos');
      XLSX.writeFile(wb, `Nanucloud_Servicos_${Date.now()}.xlsx`);

      setExportNotice('Ficheiro Excel (.xlsx) exportado com sucesso!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveToHistory = () => {
    const historyItem = {
      id: `sim_${Date.now()}`,
      title: serviceTitle || 'Prestação de Serviços',
      clientName: clientName || 'Consumidor',
      countryCode,
      currency: country.curr,
      billingMode,
      taxableBase,
      vatAmount,
      grossTotal: grossInvoiceTotal,
      withholdingTax: withholdingTaxAmount,
      netReceived: netBankReceived,
      createdAt: new Date().toISOString()
    };

    const currentHistory = JSON.parse(localStorage.getItem('nanucloud_service_sim_history') || '[]');
    localStorage.setItem('nanucloud_service_sim_history', JSON.stringify([historyItem, ...currentHistory]));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono">PRESTAÇÃO DE SERVIÇOS & CONSULTORIA</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Módulo Especializado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo por Valor Fixo, Horas de Trabalho ou Deslocação em KM com despesas de equipe, Retenção na Fonte e IVA
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={pdfGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            {pdfGenerating ? 'A GERAR PDF...' : 'PROPOSTA EM PDF'}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            EXCEL (.XLSX)
          </button>

          <button
            type="button"
            onClick={handleSaveToHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            GUARDAR
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {exportNotice}
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Simulação guardada com sucesso no histórico local!
        </div>
      )}

      {/* Aviso de Créditos e Estado de Acesso RBAC */}
      <ClientCreditNoticeBanner
        user={user}
        onOpenPlans={onOpenPlans}
        onOpenAuth={onOpenAuth}
      />

      {/* Main Grid: Form Inputs (Left 7 cols) & Live Results (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Simulation Inputs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Identification & Country */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> IDENTIFICAÇÃO DO SERVIÇO & JURISDIÇÃO FISCAL
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">PAÍS DE TRIBUTAÇÃO:</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {availableCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.curr}) - {c.agency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">NOME DO UTILIZADOR / ENTIDADE CONTRATANTE:</label>
                <input
                  type="text"
                  placeholder="Ex: Sonangol E.P. / Utilizador Particular"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">DESCRIÇÃO DO SERVIÇO / CONSULTORIA:</label>
                <input
                  type="text"
                  placeholder="Ex: Consultoria em TI, Auditoria Contábil, Manutenção Técnica"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Billing Mode Selection */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> MODALIDADE DE COBRANÇA DO SERVIÇO
            </h3>

            {/* Mode Selectors */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBillingMode('fixed');
                  setHasCalculated(false);
                }}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billingMode === 'fixed'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">Por Projeto Fixo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBillingMode('hourly');
                  setHasCalculated(false);
                }}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billingMode === 'hourly'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">Por Hora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBillingMode('distance');
                  setHasCalculated(false);
                }}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billingMode === 'distance'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">Por KM / Distância</span>
              </button>
            </div>

            {/* Sub-inputs according to mode */}
            {billingMode === 'fixed' && (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <label className="text-[11px] font-mono text-slate-300 block">VALOR FIXO TOTAL DO PROJETO ({country.curr}):</label>
                <div className="relative">
                  <NumericInput
                    value={fixedAmount}
                    onChange={(val) => {
                      setFixedAmount(val);
                      setHasCalculated(false);
                    }}
                    placeholder="0,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-12 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">{country.curr}</span>
                </div>
              </div>
            )}

            {billingMode === 'hourly' && (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">TARIFA POR HORA ({country.curr}/h):</label>
                  <NumericInput
                    value={hourlyRate}
                    onChange={(val) => {
                      setHourlyRate(val);
                      setHasCalculated(false);
                    }}
                    placeholder="0,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">TOTAL DE HORAS PREVISTAS:</label>
                  <NumericInput
                    value={totalHours}
                    onChange={(val) => {
                      setTotalHours(val);
                      setHasCalculated(false);
                    }}
                    placeholder="0,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 text-right">
                  <span className="text-[11px] font-mono text-slate-400">
                    Subtotal Horas: <strong className="text-indigo-300">{formatCurrency(baseLabor)}</strong>
                  </span>
                </div>
              </div>
            )}

            {billingMode === 'distance' && (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono text-slate-300 block mb-1">PREÇO POR KM ({country.curr}/km):</label>
                    <NumericInput
                      value={ratePerKm}
                      onChange={(val) => {
                        setRatePerKm(val);
                        setHasCalculated(false);
                      }}
                      placeholder="0,000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-300 block mb-1">DISTÂNCIA ENTRE PRESTADOR E UTILIZADOR (KM):</label>
                    <NumericInput
                      value={distanceKm}
                      onChange={(val) => {
                        setDistanceKm(val);
                        setHasCalculated(false);
                      }}
                      placeholder="0,000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                    <input
                      type="checkbox"
                      checked={isRoundTrip}
                      onChange={(e) => {
                        setIsRoundTrip(e.target.checked);
                        setHasCalculated(false);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    Cobrar Deslocação de Ida e Volta (×2)
                  </label>
                  <span className="text-[11px] font-mono text-indigo-300">
                    Subtotal Distância ({isRoundTrip ? parseFormattedNumber(distanceKm) * 2 : parseFormattedNumber(distanceKm)} km): <strong>{formatCurrency(baseLabor)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Logistics & Team Expenses (User Paid) */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400" /> CUSTOS LOGÍSTICOS OPCIONAIS A CARGO DO UTILIZADOR
            </h3>

            {/* Transport Checkbox & Inputs */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={clientPaysTransport}
                  onChange={(e) => setClientPaysTransport(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                UTILIZADOR PAGA O TRANSPORTE DA EQUIPE / TÉCNICOS
              </label>

              {clientPaysTransport && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">CUSTO TRANSPORTE POR PESSOA ({country.curr}):</label>
                    <NumericInput
                      value={transportCostPerPerson}
                      onChange={setTransportCostPerPerson}
                      placeholder="0,000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Nº DE TÉCNICOS DESIGNADOS:</label>
                    <input
                      type="number"
                      min="1"
                      value={techniciansCount}
                      onChange={(e) => setTechniciansCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 text-right">
                    <span className="text-[10px] font-mono text-slate-400">
                      Total Transporte: <strong className="text-amber-300">{formatCurrency(totalTransport)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Meals Checkbox & Inputs */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={clientPaysMeals}
                  onChange={(e) => setClientPaysMeals(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                UTILIZADOR PAGA A ALIMENTAÇÃO / DIÁRIAS DA EQUIPE
              </label>

              {clientPaysMeals && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">DIÁRIA POR PESSOA ({country.curr}):</label>
                    <NumericInput
                      value={mealAllowancePerPerson}
                      onChange={setMealAllowancePerPerson}
                      placeholder="0,000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Nº DE DIAS DE TRABALHO:</label>
                    <input
                      type="number"
                      min="1"
                      value={daysDuration}
                      onChange={(e) => setDaysDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">TÉCNICOS A ALIMENTAR:</label>
                    <input
                      type="number"
                      min="1"
                      value={techniciansCount}
                      disabled
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3 text-right">
                    <span className="text-[10px] font-mono text-slate-400">
                      Total Diárias ({techniciansCount} téc. × {daysDuration} dias): <strong className="text-amber-300">{formatCurrency(totalMeals)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Margins & Fiscal Matrix Parameters */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> MARGEM DE LUCRO & ENQUADRAMENTO FISCAL
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">MARGEM DE LUCRO (%):</label>
                <div className="flex items-center gap-1">
                  <NumericInput
                    value={marginPercent}
                    onChange={setMarginPercent}
                    placeholder="0,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">TAXA DE IVA (%):</label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  {country.vatOptions.map((opt, i) => (
                    <option key={i} value={opt.r}>
                      {opt.n} ({opt.r}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">RETENÇÃO NA FONTE (%):</label>
                <div className="flex items-center gap-1">
                  <NumericInput
                    value={retentionRate}
                    onChange={setRetentionRate}
                    placeholder="0,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">TAXA TPA / MULTICAIXA (%):</label>
                <div className="flex items-center gap-1">
                  <NumericInput
                    value={tpaRate}
                    onChange={setTpaRate}
                    placeholder="0,000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono text-xs">%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                <input
                  type="checkbox"
                  checked={applyRetention}
                  onChange={(e) => {
                    setApplyRetention(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                />
                Aplicar Dedução de Retenção na Fonte (Utilizador Corporativo)
              </label>
            </div>

            {/* Error notice */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botão de Calcular */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleRequestCalculate}
                disabled={isCalculating}
                className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 active:scale-[0.98] text-white rounded-xl text-sm font-mono font-bold transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{isCalculating ? 'A Processar Simulação...' : 'CALCULAR PRESTAÇÃO DE SERVIÇO'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto px-4 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono border border-slate-700/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Rever ficha detalhada dos parâmetros"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Rever Parâmetros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Fiscal & Financial Breakdown */}
        <div className="lg:col-span-5 space-y-6" ref={resultsRef}>
          
          {hasCalculated ? (
            /* Main Financial Summary Card */
            <div className="bg-[#1E293B] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-5 sticky top-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100 font-mono">FICHA DE PRESTAÇÃO DE SERVIÇOS</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  SIMULAÇÃO CONFIRMADA
                </span>
              </div>

              {/* Line Items */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Honorários Base do Trabalho:</span>
                  <span className="font-bold">{formatCurrency(baseLabor)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Margem de Consultoria ({marginPct}%):</span>
                  <span className="text-indigo-300 font-bold">+{formatCurrency(markupAmount)}</span>
                </div>

                {(clientPaysTransport || clientPaysMeals) && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Logística (Transporte + Refeições):</span>
                    <span className="text-amber-300 font-bold">+{formatCurrency(totalLogistics)}</span>
                  </div>
                )}

                {/* Subtotal Sem IVA */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center p-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200">
                  <span className="text-cyan-300 font-bold">(=) VALOR LÍQUIDO DO SERVIÇO (SEM IVA):</span>
                  <span className="text-cyan-300 font-bold font-mono">{formatCurrency(taxableBase)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>(+) IVA Liquidado na Fatura ({vatRate}%):</span>
                  <span className="text-indigo-300 font-bold font-mono">+{formatCurrency(vatAmount)}</span>
                </div>

                {/* Total Faturado Com IVA */}
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-emerald-400 block font-mono font-bold">(=) TOTAL BRUTO FATURADO (COM IVA):</span>
                    <span className="text-base font-bold text-emerald-300 font-mono">{formatCurrency(grossInvoiceTotal)}</span>
                  </div>
                </div>

                {/* Deductions: Retention & TPA */}
                <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-1.5">
                  <div className="flex justify-between items-center text-rose-300">
                    <span>Retenção na Fonte ({effectiveRetentionRate}%):</span>
                    <span className="font-bold">-{formatCurrency(withholdingTaxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400/80 text-[11px]">
                    <span>Taxa TPA / Multicaixa ({tpaRate}%):</span>
                    <span>-{formatCurrency(tpaFeeAmount)}</span>
                  </div>
                </div>

                {/* Net Cash Received */}
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-400 block font-mono font-bold uppercase tracking-wider">
                    VALOR LÍQUIDO A RECEBER EM CONTA
                  </span>
                  <div className="text-xl font-bold text-emerald-300 font-mono">
                    {formatCurrency(netBankReceived)}
                  </div>
                  <p className="text-[10px] text-emerald-400/70 font-mono">
                    Montante creditado em banco após retenção obrigatória do utilizador e tarifa POS.
                  </p>
                </div>

                {/* Real Operational Profit */}
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-cyan-400 block font-mono font-bold uppercase">
                      LUCRO OPERACIONAL ESTIMADO
                    </span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">{formatCurrency(netOperationalProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Official Legal Notes */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold font-mono text-[10px] uppercase">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Regime Fiscal de Serviços
                </div>
                <p className="leading-relaxed">
                  {country.importantNotes?.services || 'Cálculo de prestação de serviços conforme as alíquotas fiscais aplicáveis.'}
                </p>
              </div>

              {/* Mandatory Legal Disclaimer */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Aviso Legal Nanucloud:</strong> A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#1E293B]/60 border border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-4 sticky top-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wide">Pronto para Simular Serviços</h3>
              <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
                Preencha os honorários do serviço e despesas logísticas e clique no botão <strong className="text-indigo-300">"CALCULAR PRESTAÇÃO DE SERVIÇO"</strong> para apurar o total bruto, retenções e valor líquido.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setBillingMode('fixed');
                    setFixedAmount('150.000,00');
                    setMarginPercent('20');
                    setClientPaysTransport(true);
                    setTransportCostPerPerson('15.000,00');
                    setTimeout(() => {
                      handleConfirmAndExecute();
                    }, 50);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Carregar Exemplo (150.000 Kz) e Calcular
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal before calculating results */}
      <ConfirmSimulationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndExecute}
        moduleName="Prestação de Serviços & Consultoria"
        title="Confirmar Simulação de Serviços"
        subtitle="Reveja a composição de honorários, logística e retenções na fonte antes de apurar os valores finais."
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
