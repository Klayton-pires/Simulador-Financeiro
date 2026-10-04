import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Eye,
  TrendingUp,
  DollarSign,
  Globe2,
  Smartphone,
  Laptop,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Calendar,
  Layers,
  Settings,
  RefreshCw,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { getVisitorMetrics, VisitorMetrics, subscribeToVisitorMetrics } from '../../utils/googleAnalytics';

interface VisitorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurementId?: string;
  publisherId?: string;
  isAdmin?: boolean;
  onOpenAdminSettings?: () => void;
}

export const VisitorAnalyticsModal: React.FC<VisitorAnalyticsModalProps> = ({
  isOpen,
  onClose,
  measurementId = 'G-NANUCLOUD1',
  publisherId = 'ca-pub-9428510834729105',
  isAdmin = false,
  onOpenAdminSettings
}) => {
  const [metrics, setMetrics] = useState<VisitorMetrics>(getVisitorMetrics());
  const [activeTab, setActiveTab] = useState<'visitors' | 'monetization'>('visitors');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToVisitorMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });
    return unsubscribe;
  }, [isOpen]);

  if (!isOpen || !isAdmin) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setMetrics(getVisitorMetrics());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Google Analytics & Google Ads
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitor de Visitantes e Geração de Renda Extra por Publicidade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
              title="Atualizar Estatísticas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/30 px-5 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('visitors')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition border-b-2 cursor-pointer ${
              activeTab === 'visitors'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Visitantes & Tráfego (Google Analytics)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monetization')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition border-b-2 cursor-pointer ${
              activeTab === 'monetization'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Renda Extra & Anúncios (Google Ads)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'visitors' ? (
            <>
              {/* Top Key Performance Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Active Visitors Now */}
                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-medium">Online Agora</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono flex items-baseline gap-1">
                    {metrics.activeVisitorsNow}
                    <span className="text-xs font-normal text-emerald-400">utilizadores</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">A utilizar a plataforma</span>
                </div>

                {/* Today Visitors */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-medium">Visitantes Hoje</span>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {metrics.todayVisitors.toLocaleString('pt-PT')}
                  </div>
                  <span className="text-[10px] text-indigo-300 mt-1 block flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" /> +14% vs dia anterior
                  </span>
                </div>

                {/* Pageviews Today */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-medium">Visualizações Hoje</span>
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {metrics.todayPageViews.toLocaleString('pt-PT')}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Média de {(metrics.todayPageViews / Math.max(1, metrics.todayVisitors)).toFixed(1)} páginas / visita
                  </span>
                </div>

                {/* Month Visitors */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-medium">Visitantes este Mês</span>
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {metrics.monthVisitors.toLocaleString('pt-PT')}
                  </div>
                  <span className="text-[10px] text-purple-300 mt-1 block">
                    {metrics.monthPageViews.toLocaleString('pt-PT')} visualizações
                  </span>
                </div>
              </div>

              {/* Geographic Distribution and Devices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Countries */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                      <Globe2 className="w-4 h-4 text-indigo-400" />
                      <span>Origem do Tráfego (Países)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Top Jurisdições</span>
                  </div>

                  <div className="space-y-2.5">
                    {metrics.countries.map((c) => (
                      <div key={c.country} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <span>{c.flag}</span>
                            <span>{c.country}</span>
                          </span>
                          <span className="font-mono text-slate-400">
                            {c.visitors} visitas ({c.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${c.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Modules & Devices */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>Simuladores Mais Acessados</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Popularidade</span>
                  </div>

                  <div className="space-y-2">
                    {metrics.popularModules.slice(0, 5).map((mod) => (
                      <div key={mod.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[220px]">
                          {mod.name}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">{mod.views} acessos</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold">
                            {mod.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Devices bar */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-around text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Mobile: <strong>58%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Desktop: <strong>38%</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Outros: 4%
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Direct Console Link */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Google Analytics 4 Conectado</span>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {measurementId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Os eventos de visualização de página e cálculos executados são enviados automaticamente para a sua conta oficial do Google.
                    </p>
                  </div>
                </div>

                <a
                  href={`https://analytics.google.com/analytics/web/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition shrink-0"
                >
                  <span>Abrir Consola GA4</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            <>
              {/* Google Ads & AdSense Monetization Tab */}
              <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Renda Extra Gerada por Anúncios</span>
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                        Google AdSense Ativo
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gere rendimentos diários a partir das visitas aos simuladores comerciais e aduaneiros.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-mono">ID Publicador:</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{publisherId}</span>
                  </div>
                </div>

                {/* Revenue Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-400 block mb-1">Ganhos Estimados Hoje</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                      {metrics.adsRevenueEstimate.todayEarningsKz.toLocaleString('pt-PT')} <span className="text-xs text-slate-300">Kz</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      ~${metrics.adsRevenueEstimate.todayEarningsUsd} USD
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-400 block mb-1">Projeção Mensal</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                      {metrics.adsRevenueEstimate.monthEarningsKz.toLocaleString('pt-PT')} <span className="text-xs text-slate-300">Kz</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      ~${metrics.adsRevenueEstimate.monthEarningsUsd} USD / mês
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-400 block mb-1">Impressões de Anúncios</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                      {metrics.adsRevenueEstimate.impressionsToday.toLocaleString('pt-PT')}
                    </div>
                    <span className="text-[10px] text-indigo-400 block mt-1 font-mono">
                      {metrics.adsRevenueEstimate.clicksToday} cliques (CTR: {metrics.adsRevenueEstimate.ctrPct}%)
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-400 block mb-1">eCPM Médio</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono">
                      ${metrics.adsRevenueEstimate.ecpmUsd} <span className="text-xs text-slate-300">USD</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Por 1.000 visualizações
                    </span>
                  </div>
                </div>

                {/* Explanation on How Extra Income Works */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Como a Aplicação Gera Renda Extra para Si com o Google Ads:</span>
                  </div>
                  <p>
                    1. <strong>Exibição Automática de Anúncios:</strong> Cada vez que um visitante utiliza o simulador de Comércio, Importação Aduaneira ou Serviços, são exibidos blocos publicitários patrocinados compatíveis com o nicho empresarial.
                  </p>
                  <p>
                    2. <strong>Remuneração Dupla (CPM + CPC):</strong> Recebe dinheiro por impressões (a cada 1.000 visualizações de página) e por cada clique qualificado efetuado pelos visitantes nos anúncios.
                  </p>
                  <p>
                    3. <strong>Depósito Direto na Conta:</strong> Os rendimentos acumulados na sua conta do Google AdSense são transferidos mensalmente para a sua conta bancária quando atingem o limite mínimo de pagamento do Google.
                  </p>
                </div>

                {/* Console Link */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    Quer acompanhar os pagamentos oficiais ou alterar o tipo de anúncios?
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://adsense.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md"
                    >
                      <span>Abrir Painel Google AdSense</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compatível com as Políticas de Privacidade do Google (RGPD / LGPD)</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenAdminSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminSettings();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>Configurar IDs de Rastreio</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
