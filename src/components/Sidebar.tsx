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
    { id: 'local', label: t.mLocal || 'Vendas & Comércio (PVP)', icon: Store },
    {
      id: 'services_consulting',
      label: t.mServices || 'Prestação de Serviços',
      icon: Briefcase
    },
    {
      id: 'intermediary',
      label: t.mIntermediary || 'Intermediação & Corretagem',
      icon: Handshake
    },
    {
      id: 'basic_mobile',
      label: t.mBasicMobile || 'Modo Celular / POS',
      icon: Smartphone
    },
    {
      id: 'import',
      label: t.mImport || 'Importação Aduaneira',
      icon: Ship
    },
    {
      id: 'excel',
      label: t.mExcel || 'Lotes Excel (.xlsx)',
      icon: FileSpreadsheet
    },
    {
      id: 'api_integration',
      label: t.mApi || 'API REST & Webhooks',
      icon: Code
    }
  ];

  const toolsItems = [
    ...(isAdmin
      ? [
          { id: 'fiscal_matrix', label: 'Matriz Fiscal de Taxas', icon: Scale },
          { id: 'tickets', label: 'Suporte & Tickets', icon: LifeBuoy },
          { id: 'admin_settings', label: 'Definições do Sistema', icon: Settings }
        ]
      : [])
  ];

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-3.5 shrink-0 select-none">
      {/* Portais de Acesso: Área do Utilizador & Área dos Gestores */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg border border-white/[0.08]">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold px-1">
          Acesso & Contas
        </div>

        {/* Portal 1: Área do Utilizador */}
        {currentUser && isClient ? (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/25 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white text-xs block leading-tight">Área do Cliente</span>
                  <span className="text-[10px] text-slate-400 truncate block max-w-[110px]">
                    {currentUser.company || currentUser.name}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                {currentUser.queriesRemaining.toLocaleString('pt-PT')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={onOpenClientProfile}
                className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <span>Painel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Terminar Sessão"
                className="p-1.5 bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 rounded-lg transition cursor-pointer border border-white/[0.05]"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenClientLogin}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/25 transition cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/25 text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-indigo-200 text-xs">
                  Área do Utilizador
                </div>
                <div className="text-[10px] text-slate-400">
                  Entrar ou Registar Empresa
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Portal 2: Área dos Gestores */}
        {currentUser && isAdmin ? (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/25 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 text-cyan-300 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white text-xs block leading-tight">Painel Gestores</span>
                  <span className="text-[10px] text-cyan-400/80">Administração Geral</span>
                </div>
              </div>
              {pendingPaymentsCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                  {pendingPaymentsCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onTabChange('admin_settings')}
                className="flex-1 py-1.5 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <span>Administração</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Terminar Sessão"
                className="p-1.5 bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 rounded-lg transition cursor-pointer border border-white/[0.05]"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.06] hover:border-cyan-500/30 transition cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 group-hover:text-cyan-300 text-xs">
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
      <div className="glass-panel rounded-2xl p-2.5 shadow-lg border border-white/[0.08]">
        <button
          type="button"
          onClick={() => onTabChange('analytics_dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
            activeTab === 'analytics_dashboard' || activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'analytics_dashboard' || activeTab === 'history' ? 'text-white' : 'text-indigo-400'}`} />
            <span className="font-medium truncate">Dashboard Financeiro</span>
          </div>
          <span className="text-[10px] text-slate-400 opacity-80">Gráficos</span>
        </button>
      </div>

      {/* Main Section */}
      <div className="glass-panel rounded-2xl p-2.5 shadow-lg border border-white/[0.08] flex flex-col gap-0.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold py-1.5 px-3">
          Simuladores Fiscais
        </div>

        {simItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                isActive
                  ? 'bg-indigo-600/20 text-white border-l-2 border-indigo-500 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}

        {toolsItems.length > 0 && (
          <>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-3 py-1.5 px-3">
              Gestão & Apoio
            </div>

            {toolsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as ActiveTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-200 border-l-2 border-cyan-400 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-panel-subtle rounded-2xl p-3 text-[11px] text-slate-400 space-y-1.5 border border-white/[0.05]">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-semibold text-xs">Infraestrutura</span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Neon PostgreSQL
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Base de dados relacional ativa com redundância na nuvem e auditoria em tempo real.
        </p>
        {onOpenTerms && (
          <button
            onClick={onOpenTerms}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline block pt-0.5"
          >
            Termos & Conformidade Legal
          </button>
        )}
      </div>
    </aside>
  );
};
