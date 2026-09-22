import React from 'react';
import { SupportedLang, TRANSLATIONS } from '../i18n/translations';
import {
  Store,
  Ship,
  FileSpreadsheet,
  Smartphone,
  Code,
  LifeBuoy,
  Scale,
  Briefcase,
  Handshake,
  Settings,
  User,
  Shield,
  Coins,
  LogOut,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'local'
  | 'services_consulting'
  | 'intermediary'
  | 'basic_mobile'
  | 'import'
  | 'excel'
  | 'api_integration'
  | 'fiscal_matrix'
  | 'tickets'
  | 'admin_settings'
  | 'plans'
  | 'history'
  | 'analytics_dashboard'
  | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentLang: SupportedLang;
  onOpenTerms?: () => void;
  onToggleSidebar?: () => void;
  user?: any;
  onOpenClientLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenClientProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentLang,
  onOpenTerms,
  onOpenClientLogin,
  onOpenAdminLogin,
  onOpenClientProfile
}) => {
  const { currentUser, isClient, isAdmin, logout, transactions } = useAuth();
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;

  const pendingPaymentsCount = transactions.filter((t) => t.status === 'pending').length;

  const simItems = [
    { id: 'local', label: t.mLocal || 'Vendas & Comércio (PVP)', icon: Store, badge: 'LIVRE' },
    {
      id: 'services_consulting',
      label: t.mServices || 'Prestação de Serviços & Consultoria',
      icon: Briefcase,
      badge: 'LIVRE'
    },
    {
      id: 'intermediary',
      label: t.mIntermediary || 'Intermediários & Corretagem',
      icon: Handshake,
      badge: 'LIVRE'
    },
    {
      id: 'basic_mobile',
      label: t.mBasicMobile || 'Modo Celular Básico / POS',
      icon: Smartphone,
      badge: 'LIVRE'
    },
    {
      id: 'import',
      label: t.mImport || 'Importação Aduaneira',
      icon: Ship,
      badge: 'LIVRE'
    },
    {
      id: 'excel',
      label: t.mExcel || 'Lotes Excel (.xlsx)',
      icon: FileSpreadsheet,
      badge: 'LIVRE'
    },
    {
      id: 'api_integration',
      label: t.mApi || 'API REST ERP & Lojas',
      icon: Code,
      badge: 'LIVRE'
    }
  ];

  const toolsItems = [
    ...(isAdmin
      ? [
          { id: 'fiscal_matrix', label: 'Configuração de Taxas', icon: Scale },
          { id: 'tickets', label: 'Chat com Ticket', icon: LifeBuoy },
          { id: 'admin_settings', label: 'Definições do Sistema', icon: Settings }
        ]
      : [])
  ];

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
      {/* Portais de Acesso: Área do Utilizador & Área dos Gestores */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
        <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold px-1 font-mono">
          Portais de Acesso
        </div>

        {/* Portal 1: Área do Utilizador */}
        {currentUser && isClient ? (
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white text-[11px]">Área do Utilizador</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400 inline" />
                {currentUser.queriesRemaining.toLocaleString('pt-PT')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentUser.company || currentUser.name}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={onOpenClientProfile}
                className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Aceder à Área</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Terminar Sessão"
                className="p-1.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 rounded-md transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenClientLogin}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/30 text-xs font-mono transition cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-indigo-200 text-[11px]">
                  Área do Utilizador
                </div>
                <div className="text-[10px] text-slate-400">
                  Login & Registo Empresa
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Portal 2: Área dos Gestores */}
        {currentUser && isAdmin ? (
          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-600/30 text-cyan-400 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white text-[11px]">Área dos Gestores</span>
              </div>
              {pendingPaymentsCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                  {pendingPaymentsCount} pendentes
                </span>
              )}
            </div>
            <div className="text-[10px] text-cyan-300">
              Gestão, Finanças & Taxas
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onTabChange('admin_settings')}
                className="flex-1 py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Painel de Gestão</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Terminar Sessão"
                className="p-1.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 rounded-md transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700 hover:border-cyan-500/40 text-xs font-mono transition cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200 group-hover:text-cyan-300 text-[11px]">
                  Área dos Gestores
                </div>
                <div className="text-[10px] text-slate-400">
                  Acesso Administrativo
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Secção de Inteligência & Dashboard */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
        <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1 px-1 font-mono flex items-center justify-between">
          <span>Inteligência & Gráficos</span>
          <span className="text-indigo-400 font-bold text-[9px] bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">NOVO</span>
        </div>
        <button
          type="button"
          onClick={() => onTabChange('analytics_dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer text-left ${
            activeTab === 'analytics_dashboard' || activeTab === 'history'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 bg-slate-900/50 border border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'analytics_dashboard' || activeTab === 'history' ? 'text-white' : 'text-indigo-400'}`} />
            <span className="font-semibold truncate">Dashboard Financeiro</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 font-mono ${
            activeTab === 'analytics_dashboard' || activeTab === 'history' ? 'bg-indigo-700/50 text-white' : 'bg-indigo-400/20 text-indigo-300'
          }`}>
            Recharts
          </span>
        </button>
      </div>

      {/* Main Section */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1 shadow-sm">
        <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2 px-3 font-mono flex items-center justify-between">
          <span>Simuladores Fiscais</span>
          <span className="text-emerald-400 font-bold text-[9px] bg-emerald-500/10 px-1.5 py-0.2 rounded">LIVRE</span>
        </div>

        {simItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 font-mono ${
                  isActive ? 'bg-indigo-500/50 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {toolsItems.length > 0 && (
          <>
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-4 mb-2 px-3 font-mono">
              Gestão & Apoio
            </div>

            {toolsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as ActiveTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-[#0F172A]/80 border border-slate-800/80 rounded-xl p-3 text-[11px] font-mono text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-bold">Estado do Sistema</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Sem base de dados ativa. Cálculos efetuados instantaneamente em memória de forma autónoma.
        </p>
        {onOpenTerms && (
          <button
            onClick={onOpenTerms}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline block pt-1"
          >
            Termos & Conformidade
          </button>
        )}
      </div>
    </aside>
  );
};
