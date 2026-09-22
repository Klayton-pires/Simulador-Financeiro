import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  Wallet,
  ArrowUpRight,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  Store,
  Briefcase,
  Handshake,
  Ship,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserSafe, QueryHistoryItem } from '../types';

interface FinancialAnalyticsDashboardProps {
  currentUser: UserSafe;
  onNavigateToSimulator?: (simulatorType: string) => void;
}

type PeriodFilter = '7d' | '30d' | '90d' | '12m' | 'all';
type ModuleFilter = 'all' | 'local' | 'services' | 'intermediary' | 'import' | 'batch';
type GroupByMode = 'day' | 'week' | 'month';

// Cores temáticas para gráficos
const PALETTE = {
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  success: '#10B981', // Emerald
  successLight: '#34D399',
  accent: '#F59E0B',  // Amber
  accentLight: '#FBBF24',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  rose: '#F43F5E',
  slateText: '#94A3B8',
  gridBorder: '#334155'
};

const MODULE_COLORS: Record<string, string> = {
  local: '#6366F1',
  services: '#10B981',
  intermediary: '#F59E0B',
  import: '#06B6D4',
  batch: '#8B5CF6'
};

// Dados de demonstração realistas para inicialização imediata caso o utilizador ainda não tenha histórico
const SAMPLE_SIMULATIONS: QueryHistoryItem[] = [
  {
    id: 'sim_demo_01',
    userId: 'demo_user',
    type: 'local',
    itemType: 'product',
    title: 'Arroz Agulha 25kg - Fardo Comercial',
    description: 'Comércio grossista Luanda',
    countryCode: 'AO',
    costBase: 185000,
    vatRate: 14,
    marginApplied: 22,
    finalPrice: 257300,
    netProfit: 40700,
    retentionRate: 0,
    retentionAmount: 0,
    netReceived: 257300,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_02',
    userId: 'demo_user',
    type: 'local',
    itemType: 'product',
    title: 'Óleo Alimentar Soja 5L (Caixa x4)',
    description: 'Distribuição Retalho',
    countryCode: 'AO',
    costBase: 95000,
    vatRate: 14,
    marginApplied: 25,
    finalPrice: 135375,
    netProfit: 23750,
    retentionRate: 0,
    retentionAmount: 0,
    netReceived: 135375,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_03',
    userId: 'demo_user',
    type: 'services',
    itemType: 'service',
    title: 'Auditoria e Consultoria Fiscal Trimestral',
    description: 'Serviço prestado a entidade B2B',
    countryCode: 'AO',
    costBase: 420000,
    vatRate: 14,
    marginApplied: 40,
    finalPrice: 670320,
    netProfit: 168000,
    retentionRate: 6.5,
    retentionAmount: 38220,
    netReceived: 632100,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_04',
    userId: 'demo_user',
    type: 'intermediary',
    itemType: 'service',
    title: 'Comissão de Mediação Imobiliária Industrial',
    description: 'Intermediação e corretagem com retenção na fonte',
    countryCode: 'AO',
    costBase: 310000,
    vatRate: 14,
    marginApplied: 50,
    finalPrice: 530100,
    netProfit: 155000,
    retentionRate: 6.5,
    retentionAmount: 30225,
    netReceived: 499875,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_05',
    userId: 'demo_user',
    type: 'import',
    itemType: 'product',
    title: 'Contentor 20ft Equipamentos Industriais',
    description: 'Importação marítima via Porto de Luanda',
    countryCode: 'AO',
    costBase: 12500000,
    vatRate: 14,
    marginApplied: 30,
    finalPrice: 18525000,
    netProfit: 3750000,
    currency: 'AOA',
    transportMode: 'sea',
    details: {},
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_06',
    userId: 'demo_user',
    type: 'local',
    itemType: 'product',
    title: 'Cimento Portland Tipo II (Lote 500 sacos)',
    description: 'Materiais de Construção Civil',
    countryCode: 'AO',
    costBase: 2400000,
    vatRate: 14,
    marginApplied: 18,
    finalPrice: 3228480,
    netProfit: 432000,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_07',
    userId: 'demo_user',
    type: 'batch',
    itemType: 'product',
    title: 'Importação em Lote Excel - Peças Automóveis (42 itens)',
    description: 'Processamento multi-itens',
    countryCode: 'AO',
    costBase: 5800000,
    vatRate: 14,
    marginApplied: 35,
    finalPrice: 8926200,
    netProfit: 2030000,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_08',
    userId: 'demo_user',
    type: 'services',
    itemType: 'service',
    title: 'Implementação de Software ERP e Formação',
    description: 'Consultoria técnica e apoio a sistemas',
    countryCode: 'AO',
    costBase: 850000,
    vatRate: 14,
    marginApplied: 45,
    finalPrice: 1405050,
    netProfit: 382500,
    retentionRate: 6.5,
    retentionAmount: 80112,
    netReceived: 1324938,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_09',
    userId: 'demo_user',
    type: 'local',
    itemType: 'product',
    title: 'Açúcar Branco Granulado 50kg (100 sacos)',
    description: 'Produtos de Grande Consumo',
    countryCode: 'AO',
    costBase: 3600000,
    vatRate: 14,
    marginApplied: 15,
    finalPrice: 4719600,
    netProfit: 540000,
    currency: 'AOA',
    details: {},
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sim_demo_10',
    userId: 'demo_user',
    type: 'import',
    itemType: 'product',
    title: 'Carregamento Aéreo Peças Hospitalares',
    description: 'Carga urgente via Aeroporto Internacional',
    countryCode: 'AO',
    costBase: 4900000,
    vatRate: 14,
    marginApplied: 28,
    finalPrice: 7149840,
    netProfit: 1372000,
    currency: 'AOA',
    transportMode: 'air',
    details: {},
    createdAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const FinancialAnalyticsDashboard: React.FC<FinancialAnalyticsDashboardProps> = ({
  currentUser,
  onNavigateToSimulator
}) => {
  const [simulations, setSimulations] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all');
  const [groupBy, setGroupBy] = useState<GroupByMode>('day');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [useSampleDataIfEmpty, setUseSampleDataIfEmpty] = useState<boolean>(true);

  // Carregar dados de simulações do backend (sincronizado com Neon PostgreSQL)
  const fetchSimulations = async () => {
    setIsRefreshing(true);
    try {
      const endpoint = currentUser?.id && currentUser.id !== 'visitante_anonimo'
        ? `/api/simulator/history?userId=${currentUser.id}`
        : '/api/simulator/history';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const historyList: QueryHistoryItem[] = data.history || [];
        
        // Se a lista estiver vazia e o modo de amostra estiver ativo, utilizar dados simulados representativos
        if (historyList.length === 0 && useSampleDataIfEmpty) {
          setSimulations(SAMPLE_SIMULATIONS);
        } else {
          setSimulations(historyList);
        }
      } else {
        if (useSampleDataIfEmpty) {
          setSimulations(SAMPLE_SIMULATIONS);
        }
      }
    } catch {
      if (useSampleDataIfEmpty) {
        setSimulations(SAMPLE_SIMULATIONS);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [currentUser?.id, useSampleDataIfEmpty]);

  // Formatação monetária rigorosa em Kwanzas
  const formatKz = (val: number): string => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0) + ' Kz';
  };

  // Filtragem de dados com base no período e módulo
  const filteredSimulations = useMemo(() => {
    const now = Date.now();
    let minTimestamp = 0;

    if (period === '7d') minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    else if (period === '30d') minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    else if (period === '90d') minTimestamp = now - 90 * 24 * 60 * 60 * 1000;
    else if (period === '12m') minTimestamp = now - 365 * 24 * 60 * 60 * 1000;
    else minTimestamp = 0;

    return simulations.filter(item => {
      const itemTime = new Date(item.createdAt).getTime();
      if (itemTime < minTimestamp) return false;

      if (moduleFilter !== 'all') {
        if (moduleFilter === 'local' && item.type !== 'local') return false;
        if (moduleFilter === 'services' && item.type !== 'services') return false;
        if (moduleFilter === 'intermediary' && item.type !== 'intermediary') return false;
        if (moduleFilter === 'import' && item.type !== 'import') return false;
        if (moduleFilter === 'batch' && item.type !== 'batch') return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchCountry = item.countryCode?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCountry) return false;
      }

      return true;
    });
  }, [simulations, period, moduleFilter, searchQuery]);

  // Indicadores de Desempenho Globais (KPIs)
  const kpis = useMemo(() => {
    let totalSalesVolume = 0;
    let totalCostBase = 0;
    let totalNetProfit = 0;
    let totalTaxVolume = 0;

    filteredSimulations.forEach(item => {
      const pvp = Number(item.finalPrice) || 0;
      const cost = Number(item.costBase) || 0;
      const profit = Number(item.netProfit) || 0;
      const vat = pvp * ((Number(item.vatRate) || 14) / 100);
      const retention = Number(item.retentionAmount) || 0;

      totalSalesVolume += pvp;
      totalCostBase += cost;
      totalNetProfit += profit;
      totalTaxVolume += (vat + retention);
    });

    const averageMargin = totalCostBase > 0 ? (totalNetProfit / totalCostBase) * 100 : 0;
    const profitRatio = totalSalesVolume > 0 ? (totalNetProfit / totalSalesVolume) * 100 : 0;

    return {
      totalSalesVolume,
      totalCostBase,
      totalNetProfit,
      totalTaxVolume,
      averageMargin,
      profitRatio,
      count: filteredSimulations.length
    };
  }, [filteredSimulations]);

  // Agrupamento temporal para gráficos de volume de vendas
  const salesVolumeTimeData = useMemo(() => {
    const buckets: Record<string, {
      dateKey: string;
      label: string;
      rawDate: number;
      volumeVendas: number;
      custoTotal: number;
      lucroLiquido: number;
      simulacoesCount: number;
    }> = {};

    filteredSimulations.forEach(item => {
      const d = new Date(item.createdAt);
      let dateKey = '';
      let label = '';

      if (groupBy === 'day') {
        dateKey = d.toISOString().split('T')[0];
        label = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
      } else if (groupBy === 'week') {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        dateKey = startOfWeek.toISOString().split('T')[0];
        label = `Sem. ${d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
      } else {
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
      }

      if (!buckets[dateKey]) {
        buckets[dateKey] = {
          dateKey,
          label,
          rawDate: d.getTime(),
          volumeVendas: 0,
          custoTotal: 0,
          lucroLiquido: 0,
          simulacoesCount: 0
        };
      }

      buckets[dateKey].volumeVendas += Number(item.finalPrice) || 0;
      buckets[dateKey].custoTotal += Number(item.costBase) || 0;
      buckets[dateKey].lucroLiquido += Number(item.netProfit) || 0;
      buckets[dateKey].simulacoesCount += 1;
    });

    return Object.values(buckets).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [filteredSimulations, groupBy]);

  // Distribuição por Módulo
  const moduleDistributionData = useMemo(() => {
    const counts: Record<string, { name: string; volume: number; count: number; color: string }> = {
      local: { name: 'Comércio Local & Retalho', volume: 0, count: 0, color: MODULE_COLORS.local },
      services: { name: 'Serviços & Consultoria', volume: 0, count: 0, color: MODULE_COLORS.services },
      intermediary: { name: 'Intermediação & Corretagem', volume: 0, count: 0, color: MODULE_COLORS.intermediary },
      import: { name: 'Importação Aduaneira', volume: 0, count: 0, color: MODULE_COLORS.import },
      batch: { name: 'Lotes Excel (.xlsx)', volume: 0, count: 0, color: MODULE_COLORS.batch }
    };

    filteredSimulations.forEach(item => {
      const type = item.type || 'local';
      if (counts[type]) {
        counts[type].volume += Number(item.finalPrice) || 0;
        counts[type].count += 1;
      }
    });

    return Object.values(counts).filter(item => item.count > 0);
  }, [filteredSimulations]);

  // Exportar dados para Excel (.xlsx)
  const handleExportExcel = () => {
    const rows = filteredSimulations.map(item => ({
      'ID Simulação': item.id,
      'Data Registo': new Date(item.createdAt).toLocaleString('pt-PT'),
      'Título / Descrição': item.title,
      'Módulo Fiscal': item.type?.toUpperCase() || 'LOCAL',
      'Tipo Item': item.itemType === 'service' ? 'Serviço' : 'Produto',
      'País': item.countryCode,
      'Custo Base (Kz)': Number(item.costBase) || 0,
      'Taxa IVA (%)': Number(item.vatRate) || 14,
      'Margem Aplicada (%)': Number(item.marginApplied) || 0,
      'PVP / Faturação Final (Kz)': Number(item.finalPrice) || 0,
      'Lucro Líquido Real (Kz)': Number(item.netProfit) || 0,
      'Retenção Fonte (Kz)': Number(item.retentionAmount) || 0,
      'Valor Líquido Recebido (Kz)': Number(item.netReceived) || Number(item.finalPrice) || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Simulações Financeiras');
    XLSX.writeFile(workbook, `NANUCLOUD_Relatorio_Financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Contextual & Actions */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <span>NANUCLOUD</span>
            <span aria-hidden="true">·</span>
            <span>Inteligência & Auditoria Fiscal</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-400 font-semibold">Dashboard de Dados Financeiros</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Análise de Volume de Vendas & Simulações</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitorização agregada de transações simuladas, faturação projetada, lucros líquidos e encargos fiscais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSimulations}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Atualizar dados a partir do Neon DB"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          {onNavigateToSimulator && (
            <button
              type="button"
              onClick={() => onNavigateToSimulator('local')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Simulação</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Filters, Period & Search */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs font-mono">
        {/* Period Selector (Segmented Controls) */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 shrink-0">
          <span className="text-slate-500 px-2 text-[11px] font-semibold uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Período:
          </span>
          {(['7d', '30d', '90d', '12m', 'all'] as PeriodFilter[]).map(p => {
            const labels: Record<PeriodFilter, string> = {
              '7d': '7D',
              '30d': '30D',
              '90d': '90D (3M)',
              '12m': '12M (1A)',
              'all': 'Tudo'
            };
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Module Filter */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          <span className="text-slate-500 px-2 text-[11px] font-semibold uppercase flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-slate-400" />
            Módulo:
          </span>
          {([
            { id: 'all', label: 'Todos' },
            { id: 'local', label: 'Comércio' },
            { id: 'services', label: 'Serviços' },
            { id: 'intermediary', label: 'Intermediação' },
            { id: 'import', label: 'Importação' },
            { id: 'batch', label: 'Lotes' }
          ] as { id: ModuleFilter; label: string }[]).map(m => {
            const isActive = moduleFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setModuleFilter(m.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Group By Granularity & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 shrink-0">
            {(['day', 'week', 'month'] as GroupByMode[]).map(g => {
              const labels: Record<GroupByMode, string> = {
                day: 'Diário',
                week: 'Semanal',
                month: 'Mensal'
              };
              const isActive = groupBy === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupBy(g)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labels[g]}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar simulação..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Tabular Numerals & High Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Volume de Vendas Projetado */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>VOLUME TOTAL DE VENDAS</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {formatKz(kpis.totalSalesVolume)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
              <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                {kpis.profitRatio.toFixed(1)}%
              </span>
              <span>taxa retorno s/ faturação</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Lucro Líquido Real Projetado */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>LUCRO LÍQUIDO SIMULADO</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums tracking-tight">
              {formatKz(kpis.totalNetProfit)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
              <span className="text-emerald-400 font-semibold">
                Margem Média: {kpis.averageMargin.toFixed(1)}%
              </span>
              <span>s/ custo</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Custo Base de Mercadorias / Serviços */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>CUSTO BASE TOTAL</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-200 tabular-nums tracking-tight">
              {formatKz(kpis.totalCostBase)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
              <span>Aquisição, fretes e extras</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Simulações Realizadas & Carga Fiscal */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>OPERAÇÕES & FISCALIDADE</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 tabular-nums tracking-tight">
              {kpis.count} <span className="text-xs font-normal text-slate-400">simulações</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
              <span>IVA/Retenção:</span>
              <span className="text-amber-400 font-semibold tabular-nums">{formatKz(kpis.totalTaxVolume)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Volume de Vendas & Lucro por Período (Area Chart - 2 Cols) */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-indigo-400 font-bold uppercase">Volume de Negócios</div>
              <h2 className="text-base font-bold text-white">Evolução do Volume de Vendas & Lucro Líquido</h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span>Volume Vendas (PVP)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Lucro Líquido</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {salesVolumeTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesVolumeTimeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE.success} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={PALETTE.success} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridBorder} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={PALETTE.slateText}
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                  />
                  <YAxis
                    stroke={PALETTE.slateText}
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const vendas = payload.find(p => p.dataKey === 'volumeVendas')?.value as number || 0;
                        const lucro = payload.find(p => p.dataKey === 'lucroLiquido')?.value as number || 0;
                        const custos = payload.find(p => p.dataKey === 'custoTotal')?.value as number || 0;
                        return (
                          <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-3 text-xs font-mono shadow-xl space-y-1.5">
                            <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                              {label}
                            </div>
                            <div className="text-indigo-400 flex items-center justify-between gap-4">
                              <span>Volume Vendas:</span>
                              <span className="font-bold text-white tabular-nums">{formatKz(vendas)}</span>
                            </div>
                            <div className="text-slate-400 flex items-center justify-between gap-4">
                              <span>Custo Base:</span>
                              <span className="text-slate-300 tabular-nums">{formatKz(custos)}</span>
                            </div>
                            <div className="text-emerald-400 flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                              <span>Lucro Líquido:</span>
                              <span className="font-bold text-emerald-400 tabular-nums">{formatKz(lucro)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volumeVendas"
                    name="Volume de Vendas"
                    stroke={PALETTE.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVendas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lucroLiquido"
                    name="Lucro Líquido"
                    stroke={PALETTE.success}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLucro)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                <span>Sem dados para o período selecionado</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Distribuição de Volume por Módulo (Donut Chart - 1 Col) */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="mb-4 pb-3 border-b border-slate-800">
            <div className="text-xs font-mono text-indigo-400 font-bold uppercase">Categorização</div>
            <h2 className="text-base font-bold text-white">Volume por Módulo Fiscal</h2>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {moduleDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moduleDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="volume"
                  >
                    {moduleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = kpis.totalSalesVolume > 0
                          ? ((data.volume / kpis.totalSalesVolume) * 100).toFixed(1)
                          : '0';
                        return (
                          <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-xs font-mono shadow-xl">
                            <div className="font-bold text-white mb-1">{data.name}</div>
                            <div className="text-slate-300">Volume: <span className="font-bold text-indigo-400 tabular-nums">{formatKz(data.volume)}</span></div>
                            <div className="text-slate-400 text-[11px] mt-0.5">Operações: {data.count} ({percentage}%)</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 font-mono text-xs">Sem distribuição disponível</div>
            )}
          </div>

          {/* Legend Items */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs font-mono">
            {moduleDistributionData.map(item => {
              const pct = kpis.totalSalesVolume > 0 ? ((item.volume / kpis.totalSalesVolume) * 100).toFixed(0) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-400 tabular-nums shrink-0 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Secondary Charts: Frequência de Simulações & Comparação de Custos vs Lucros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Frequency of simulations per period (BarChart) */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5">
          <div className="mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-indigo-400 font-bold uppercase">Atividade do Utilizador</div>
              <h3 className="text-base font-bold text-white">Número de Simulações Executadas</h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Total: <span className="text-white font-bold tabular-nums">{kpis.count}</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesVolumeTimeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridBorder} vertical={false} />
                <XAxis dataKey="label" stroke={PALETTE.slateText} fontSize={11} fontFamily="monospace" tickLine={false} />
                <YAxis stroke={PALETTE.slateText} fontSize={11} fontFamily="monospace" tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const count = payload[0].value;
                      return (
                        <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl">
                          <div className="font-bold text-white">{label}</div>
                          <div className="text-cyan-400 font-bold mt-1">{count} simulações realizadas</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="simulacoesCount" name="Simulações" fill={PALETTE.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown: Custo vs Lucro vs Impostos (Composed Line/Bar) */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5">
          <div className="mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-indigo-400 font-bold uppercase">Eficiência & Rentabilidade</div>
              <h3 className="text-base font-bold text-white">Estrutura de Custos vs Lucro Líquido</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">Margem: {kpis.averageMargin.toFixed(1)}%</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesVolumeTimeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridBorder} vertical={false} />
                <XAxis dataKey="label" stroke={PALETTE.slateText} fontSize={11} fontFamily="monospace" tickLine={false} />
                <YAxis
                  stroke={PALETTE.slateText}
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const custos = payload.find(p => p.dataKey === 'custoTotal')?.value as number || 0;
                      const lucro = payload.find(p => p.dataKey === 'lucroLiquido')?.value as number || 0;
                      return (
                        <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-3 text-xs font-mono shadow-xl space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                          <div className="text-slate-300">Custo Total: <span className="font-bold tabular-nums text-white">{formatKz(custos)}</span></div>
                          <div className="text-emerald-400">Lucro Líquido: <span className="font-bold tabular-nums">{formatKz(lucro)}</span></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="custoTotal" name="Custo Base" stroke={PALETTE.accent} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="lucroLiquido" name="Lucro Líquido" stroke={PALETTE.success} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* High-Density Data Grid: Recent Simulations Ledger */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Livro de Simulações Financeiras</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Registos detalhados de cálculos de preços com valores de custo, retenção e lucro final.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Mostrando <span className="text-white font-bold tabular-nums">{filteredSimulations.length}</span> registos
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Operação / Produto</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4 text-right">Custo Base</th>
                <th className="py-3 px-4 text-right">Margem</th>
                <th className="py-3 px-4 text-right">PVP Final (Venda)</th>
                <th className="py-3 px-4 text-right">Lucro Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSimulations.length > 0 ? (
                filteredSimulations.map((sim) => {
                  const moduleColor = MODULE_COLORS[sim.type] || '#6366F1';
                  return (
                    <tr key={sim.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(sim.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-xs">{sim.title}</div>
                        {sim.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{sim.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border"
                          style={{
                            color: moduleColor,
                            borderColor: `${moduleColor}40`,
                            backgroundColor: `${moduleColor}15`
                          }}
                        >
                          {sim.type?.toUpperCase() || 'LOCAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                        {formatKz(Number(sim.costBase))}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-indigo-400 font-semibold">
                        +{Number(sim.marginApplied || 0).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-white">
                        {formatKz(Number(sim.finalPrice))}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-400">
                        +{formatKz(Number(sim.netProfit))}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    Nenhum registo encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
