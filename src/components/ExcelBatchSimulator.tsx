import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UserSafe } from '../types';
import { COUNTRIES_DB, getEffectiveCountryFiscal, getAvailableCountryList } from '../data/countries';
import { SupportedLang, TRANSLATIONS } from '../i18n/translations';
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  CheckCircle,
  Lock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Columns,
  RefreshCw,
  AlertTriangle,
  Calculator,
  Layers,
  DollarSign,
  TrendingUp,
  Info
} from 'lucide-react';
import { downloadOfficialExcelTemplate } from '../utils/excelTemplate';
import { exportSimulationDossierPDF } from '../utils/exportDocumentUtils';
import { isStaffOrAdmin, canUserSimulate } from '../utils/accessControl';
import { ClientCreditNoticeBanner } from './ClientCreditNoticeBanner';
import { consumeGuestCredit, getGuestCredits } from '../utils/guestCredits';
import { ExhaustedCreditsModal } from './ExhaustedCreditsModal';

interface ExcelBatchSimulatorProps {
  user: UserSafe | null;
  currentLang: SupportedLang;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onCalculationDone: (newCredits: number) => void;
}

const MAX_SAFE_ROWS = 2000;
const RECOMMENDED_ROWS = 1000;

export const ExcelBatchSimulator: React.FC<ExcelBatchSimulatorProps> = ({
  user,
  currentLang,
  onOpenPlans,
  onOpenAuth,
  onCalculationDone
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);

  const isStaff = isStaffOrAdmin(user?.role);
  const isUnlocked = isStaff || !user || Boolean(user?.isBatchUnlocked || user?.activePlanId || (user?.queriesRemaining && user.queriesRemaining > 0));

  const [countryCode, setCountryCode] = useState<string>('AO');
  const [vatRate, setVatRate] = useState<number>(14);
  const [marginPct, setMarginPct] = useState<string>('25');
  const [listName, setListName] = useState<string>('');

  // Raw file state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<any[] | null>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedCostColumn, setSelectedCostColumn] = useState<string>('');
  const [selectedNameColumn, setSelectedNameColumn] = useState<string>('');

  // Processing state
  const [processedData, setProcessedData] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin' || user?.role === 'admin_level1' || user?.role === 'admin';
  const availableCountries = getAvailableCountryList(isSuperAdmin);
  const country = getEffectiveCountryFiscal(countryCode);

  // Helper para detetar automaticamente a coluna provável de custo
  const detectCostColumn = (cols: string[]): string => {
    const costKeywords = [
      'custo', 'preço', 'preco', 'compra', 'p. custo', 'p.custo',
      'price', 'cost', 'valor', 'unit cost', 'vlr custo', 'vlr base',
      'preço de custo', 'preco de custo', 'custo unitario', 'custo unitário'
    ];
    for (const kw of costKeywords) {
      const found = cols.find(c => c.toLowerCase().trim().includes(kw));
      if (found) return found;
    }
    return cols[1] || cols[0] || '';
  };

  // Helper para detetar a coluna de nome/descrição
  const detectNameColumn = (cols: string[]): string => {
    const nameKeywords = [
      'produto', 'nome', 'descricao', 'descrição', 'item', 'designacao',
      'designação', 'artigo', 'product', 'name', 'desc', 'referencia', 'referência'
    ];
    for (const kw of nameKeywords) {
      const found = cols.find(c => c.toLowerCase().trim().includes(kw));
      if (found) return found;
    }
    return cols[0] || '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setWarningMessage(null);
    setSuccessMessage(null);
    setProcessedData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    if (!isUnlocked) {
      onOpenPlans();
      return;
    }

    setUploadedFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const rawJson: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

        if (!rawJson || rawJson.length === 0) {
          setErrorMessage('O ficheiro Excel carregado está vazio ou não possui linhas válidas.');
          setIsProcessing(false);
          return;
        }

        // 1. Verificação de Limite de Linhas (Alerta de Segurança)
        if (rawJson.length > MAX_SAFE_ROWS) {
          setErrorMessage(
            `O ficheiro carregado contém ${rawJson.length} linhas e ultrapassa o limite máximo seguro de ${MAX_SAFE_ROWS} linhas por lote. Para garantir a precisão e integridade dos cálculos, divida o ficheiro em lotes de até ${RECOMMENDED_ROWS} linhas ou utilize o modelo oficial.`
          );
          setRawRows(null);
          setAvailableColumns([]);
          setIsProcessing(false);
          return;
        }

        if (rawJson.length > RECOMMENDED_ROWS) {
          setWarningMessage(
            `Atenção: O ficheiro possui ${rawJson.length} linhas (acima de ${RECOMMENDED_ROWS}). O processamento pode demorar alguns segundos.`
          );
        }

        // Extrair colunas
        const cols = Object.keys(rawJson[0] || {});
        setAvailableColumns(cols);
        setRawRows(rawJson);

        // Identificação automática inteligente da coluna de preço e descrição
        const autoCostCol = detectCostColumn(cols);
        const autoNameCol = detectNameColumn(cols);
        setSelectedCostColumn(autoCostCol);
        setSelectedNameColumn(autoNameCol);

        setSuccessMessage(`Ficheiro carregado com sucesso: ${rawJson.length} linhas e ${cols.length} colunas detetadas.`);
      } catch (err) {
        console.error(err);
        setErrorMessage('Erro ao ler a estrutura do ficheiro Excel. Verifique se o formato é .xlsx ou .csv válido.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExecuteBatchCalculation = async () => {
    if (!rawRows || rawRows.length === 0) {
      setErrorMessage('Por favor, carregue um ficheiro Excel primeiro.');
      return;
    }

    const margin = parseFloat(marginPct);
    if (isNaN(margin) || margin < 0) {
      setErrorMessage('Por favor, defina uma Margem Global (%) válida antes de calcular.');
      return;
    }

    if (!selectedCostColumn) {
      setErrorMessage('Por favor, selecione a coluna correspondente ao Preço de Custo.');
      return;
    }

    const simCheck = canUserSimulate(user);
    if (!simCheck.allowed) {
      setErrorMessage(simCheck.message);
      setShowExhaustedModal(true);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/simulator/calculate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: rawRows,
          countryCode,
          vatRate,
          marginPct: margin,
          costColumnKey: selectedCostColumn,
          nameColumnKey: selectedNameColumn,
          listName: listName || uploadedFileName?.replace(/\.[^/.]+$/, '') || 'Lote Excel'
        })
      });

      const resData = await res.json();

      if (!res.ok) {
        if (res.status === 403 || res.status === 402) {
          setErrorMessage(resData.error);
          setShowExhaustedModal(true);
        } else {
          setErrorMessage(resData.error || 'Erro ao processar o cálculo em lote.');
        }
        setIsProcessing(false);
        return;
      }

      setProcessedData(resData.processedItems);
      setSuccessMessage(
        `Cálculo concluído com sucesso! ${resData.processedItems.length} linhas processadas com as colunas NANUCLOUD aplicadas.`
      );

      if (user) {
        onCalculationDone(resData.queriesRemaining);
      } else {
        const left = consumeGuestCredit();
        if (left === 0) {
          setTimeout(() => setShowExhaustedModal(true), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Ocorreu uma falha de comunicação com o servidor ao calcular o lote.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = () => {
    if (!processedData || processedData.length === 0) return;

    const workbook = XLSX.utils.book_new();

    // 1. Folha de Resumo Executivo e Identificação (Sem Fórmulas)
    const dossierRows: (string | number)[][] = [
      ['Nanucloud - Dossiê de Simulação em Lote'],
      [`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}`],
      [`Moeda: ${country.curr}`],
      [''],
      ['1. IDENTIFICAÇÃO DO UTILIZADOR & CONTA'],
      ['Utilizador / Responsável:', user?.name || 'Utilizador Nanucloud'],
      ['Empresa / Organização:', user?.company || 'Nanucloud Workspace'],
      ['Email de Contacto:', user?.email || 'N/A'],
      ['Plano de Subscrição:', user?.activePlanName || 'Plano Profissional'],
      [''],
      ['2. PARÂMETROS GLOBAIS DO LOTE'],
      ['Total de Artigos Processados:', processedData.length],
      ['Margem Global Aplicada:', `${marginPct}%`],
      ['Taxa de IVA Aplicada:', `${vatRate}%`],
      ['Ficheiro de Origem:', uploadedFileName || 'Lote_Importado.xlsx'],
      [''],
      ['3. TOTAIS FINANCEIROS CONSOLIDADOS (VALORES APURADOS)'],
      ['Total Custo Base (Sem IVA):', totalCostCalculated, country.curr],
      ['Total Facturação Prevista (PVP com IVA):', totalPvpFinalCalculated, country.curr],
      ['Total Lucro Líquido Real Estimado:', totalNetProfitCalculated, country.curr],
      [''],
      ['Aviso Legal Nanucloud:', 'A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(dossierRows);
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumo_Executivo');

    // 2. Folha com os Dados Processados (Valores Finais Limpos)
    const worksheetData = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(workbook, worksheetData, 'Artigos_Calculados');

    XLSX.writeFile(workbook, `Nanucloud_Lote_Calculado_${countryCode}_${Date.now()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!processedData || processedData.length === 0) return;

    exportSimulationDossierPDF({
      title: `Dossiê Executivo de Processamento em Lote (${processedData.length} Produtos)`,
      moduleName: 'Processamento em Lote Excel (.xlsx)',
      user: user,
      country: country,
      inputFields: [
        { label: 'Ficheiro de Origem', value: uploadedFileName || 'Lote.xlsx', description: 'Planilha carregada' },
        { label: 'Total de Itens Processados', value: `${processedData.length} artigos`, description: 'Volume total de linhas' },
        { label: 'Margem Comercial Aplicada', value: `${marginPct}%`, description: 'Margem de lucro sobre o custo' },
        { label: 'Taxa de IVA Aplicada', value: `${vatRate}%`, description: 'Imposto sobre o Valor Acrescentado' },
        { label: 'Coluna de Custo Base Mapeada', value: selectedCostColumn || 'Auto', description: 'Campo de referência' }
      ],
      calculatedFields: [
        { label: 'Volume Total Custo Base', amount: totalCostCalculated, rateOrMargin: 'Custo', fiscalDestiny: 'Fornecedores' },
        { label: 'Facturação Total Prevista (PVP com IVA)', amount: totalPvpFinalCalculated, rateOrMargin: `${vatRate}% IVA`, isFinalHighlight: true, fiscalDestiny: 'Clientes / Venda' },
        { label: 'Lucro Líquido Real Consolidado', amount: totalNetProfitCalculated, rateOrMargin: `${marginPct}%`, isFinalHighlight: true, fiscalDestiny: 'Empresa / Caixa' }
      ],
      summaryCards: [
        { label: 'Artigos Processados', value: `${processedData.length}`, subtext: 'Total de linhas' },
        { label: 'Total Custo Base', value: `${totalCostCalculated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} ${country.curr}`, subtext: 'Sem IVA' },
        { label: 'PVP Total com IVA', value: `${totalPvpFinalCalculated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} ${country.curr}`, subtext: 'Facturação Global' },
        { label: 'Lucro Líquido Real', value: `${totalNetProfitCalculated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} ${country.curr}`, subtext: 'Após Impostos' }
      ],
      legalNotes: [
        `Preços finais e tributos computados em estrita conformidade com a legislação fiscal de ${country.name} (${country.agency}).`,
        `O ficheiro Excel complementar contém o detalhamento linha a linha de todos os ${processedData.length} artigos com valores finais apurados sem fórmulas expostas.`
      ]
    });
  };

  // Resumo executivo dos dados processados
  const totalCostCalculated = processedData
    ? processedData.reduce((acc, r) => acc + (parseFloat(r['[NANUCLOUD] Custo Base (S/ IVA)']) || 0), 0)
    : 0;

  const totalPvpFinalCalculated = processedData
    ? processedData.reduce((acc, r) => acc + (parseFloat(r['[NANUCLOUD] PVP Final Recomendado (C/ IVA)']) || 0), 0)
    : 0;

  const totalNetProfitCalculated = processedData
    ? processedData.reduce((acc, r) => acc + (parseFloat(r['[NANUCLOUD] Lucro Líquido Real']) || 0), 0)
    : 0;

  if (!isUnlocked) {
    return (
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-8 text-center max-w-2xl mx-auto my-8 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl md:text-2xl font-black text-slate-100 mb-2">
          {t.lockedModule}: {t.excelTitle}
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {t.lockedModuleDesc} O processamento automático de planilhas e exportação em massa está incluído no <strong>Plano Platina</strong>, <strong>Diamante</strong> ou <strong>Plano Personalizado</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Processamento seguro de até 2.000 produtos por lote</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Reconhecimento inteligente de colunas e organização flexível</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cálculo automático de PVP, IVA, TPA e Lucro Líquido Real</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Exportação com colunas NANUCLOUD coloridas e destacadas</span>
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

      {/* Header & Template Download Bar */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-slate-100">{t.excelTitle}</h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Módulo Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Organize o Excel ao seu gosto • Detetor inteligente de colunas • Limite seguro de até {MAX_SAFE_ROWS} linhas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => downloadOfficialExcelTemplate('xlsx')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descarregar Modelo Oficial (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Alerts & Notifications */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <span className="font-bold text-sm">Alerta de Validação:</span>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {warningMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <span className="font-bold">Aviso de Performance:</span>
              <p>{warningMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Fiscal Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <span>{t.lblExCountry}</span>
            </label>
            <select
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                const c = getEffectiveCountryFiscal(e.target.value);
                if (c) setVatRate(c.vatOptions[0]?.r ?? 14);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-emerald-500 outline-none"
            >
              {availableCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.curr})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t.lblExVat}</label>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-emerald-500 outline-none"
            >
              {country.vatOptions.map((v, idx) => (
                <option key={idx} value={v.r}>
                  {v.n}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Margem Global Desejada (%)</label>
            <div className="relative">
              <input
                type="number"
                value={marginPct}
                onChange={(e) => setMarginPct(e.target.value)}
                placeholder="25"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-emerald-500 outline-none pr-8"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Identificador / Título do Lote</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Ex: Tabela Geral de Produtos"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Dropzone Upload */}
        <label
          htmlFor="excel-file-input"
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/60 hover:bg-emerald-950/10 rounded-3xl p-7 text-center cursor-pointer block transition-all group shadow-inner mb-6"
        >
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-slate-100 font-extrabold text-base mb-1">
            {uploadedFileName ? uploadedFileName : t.btnBrowse}
          </h3>
          <p className="text-xs text-slate-400">
            {isProcessing
              ? 'A analisar planilha e detetar colunas...'
              : 'Clique ou arraste um ficheiro .xlsx ou .csv com a sua lista de artigos (máx. 2.000 linhas)'}
          </p>
        </label>

        {/* Column Mapping Panel (Shows when file is uploaded) */}
        {availableColumns.length > 0 && (
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 mb-6 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Columns className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-100">
                Mapeamento Inteligente de Colunas da Sua Planilha
              </h4>
              <span className="text-[10px] text-slate-400 ml-auto font-mono">
                {rawRows?.length || 0} linhas identificadas
              </span>
            </div>

            <p className="text-xs text-slate-300">
              O sistema detetou as colunas abaixo automaticamente. Se a sua planilha estiver estruturada de outra forma, ajuste os campos conforme o seu gosto:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Coluna do Preço de Custo (Obrigatório):</span>
                </label>
                <select
                  value={selectedCostColumn}
                  onChange={(e) => setSelectedCostColumn(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-amber-400 outline-none"
                >
                  {availableColumns.map((col, idx) => (
                    <option key={idx} value={col}>
                      Coluna: "{col}"
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Coluna de Nome / Descrição do Artigo:</span>
                </label>
                <select
                  value={selectedNameColumn}
                  onChange={(e) => setSelectedNameColumn(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-500/40 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-indigo-400 outline-none"
                >
                  {availableColumns.map((col, idx) => (
                    <option key={idx} value={col}>
                      Coluna: "{col}"
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>As suas colunas originais serão 100% preservadas e as novas colunas NANUCLOUD serão anexadas à direita com destaque colorido.</span>
              </div>

              <button
                onClick={handleExecuteBatchCalculation}
                disabled={isProcessing}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/50 cursor-pointer shrink-0"
              >
                <Calculator className="w-4 h-4" />
                <span>{isProcessing ? 'A Calcular Lote...' : 'Executar Cálculo com Regras Fiscais'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards (When Processed) */}
      {processedData && processedData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in">
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total de Produtos</span>
            <div className="text-xl font-black text-slate-100">{processedData.length} Itens</div>
            <div className="text-[11px] text-slate-400">100% calculados</div>
          </div>

          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Custo Total de Compra</span>
            <div className="text-xl font-black text-slate-100">
              {totalCostCalculated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {country.curr}
            </div>
            <div className="text-[11px] text-slate-400">Base sem IVA</div>
          </div>

          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Faturação Prevista (PVP)</span>
            <div className="text-xl font-black text-indigo-300">
              {totalPvpFinalCalculated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {country.curr}
            </div>
            <div className="text-[11px] text-slate-400">Com IVA ({vatRate}%)</div>
          </div>

          <div className="bg-slate-850 border border-emerald-500/40 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-emerald-950/20 to-slate-850">
            <span className="text-[10px] font-bold uppercase text-emerald-400">Lucro Líquido Real Total</span>
            <div className="text-xl font-black text-emerald-400">
              {totalNetProfitCalculated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {country.curr}
            </div>
            <div className="text-[11px] text-emerald-300/80">Após TPA e Impostos</div>
          </div>
        </div>
      )}

      {/* Results Table with Differentiated Colors */}
      {processedData && processedData.length > 0 && (
        <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-5 md:p-8 shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-700/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100">
                  Tabela de Resultados do Lote ({processedData.length} Artigos)
                </h3>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  Margem: {marginPct}% | IVA: {vatRate}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                As colunas cinzentas são os dados originais do seu ficheiro; as colunas com <strong className="text-emerald-400">cabeçalho esmeralda/azul</strong> são os cálculos oficiais da NANUCLOUD.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportPDF}
                className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                title="Exportar Dossiê do Lote em PDF"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Dossiê PDF</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.btnExport} (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  {Object.keys(processedData[0]).map((k, i) => {
                    const isNanuCol = k.startsWith('[NANUCLOUD]');
                    return (
                      <th
                        key={i}
                        className={`p-3 whitespace-nowrap border-b border-slate-700 ${
                          isNanuCol
                            ? 'bg-indigo-950 text-indigo-200 border-x border-indigo-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isNanuCol ? (
                          <span className="flex items-center gap-1">
                            <span className="text-emerald-400 font-black">★</span>
                            <span>{k.replace('[NANUCLOUD] ', '')}</span>
                          </span>
                        ) : (
                          k
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {processedData.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    {Object.keys(row).map((k, j) => {
                      const isNanuCol = k.startsWith('[NANUCLOUD]');
                      const isProfitCol = k.includes('Lucro Líquido Real');
                      const isPvpCol = k.includes('PVP Final Recomendado');
                      return (
                        <td
                          key={j}
                          className={`p-3 whitespace-nowrap ${
                            isNanuCol
                              ? isProfitCol
                                ? 'bg-emerald-950/30 text-emerald-300 font-bold border-x border-emerald-900/30'
                                : isPvpCol
                                ? 'bg-indigo-950/30 text-indigo-200 font-bold border-x border-indigo-900/30'
                                : 'bg-slate-900/40 text-indigo-100 border-x border-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {row[k]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processedData.length > 20 && (
            <p className="text-center text-xs text-slate-400 pt-2">
              A mostrar as primeiras 20 linhas na interface web. Descarregue o ficheiro Excel (.xlsx) completo para aceder à totalidade dos {processedData.length} registos.
            </p>
          )}
        </div>
      )}

      {/* Mandatory Accountant Disclaimer */}
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Aviso Legal Nanucloud:</strong> A utilização deste simulador em lotes Excel tem caráter estimativo e informativo, <strong>não dispensando a consulta de um profissional de contas</strong> ou contabilista certificado.
        </span>
      </div>

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
