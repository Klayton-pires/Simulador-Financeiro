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
  Settings
} from 'lucide-react';

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
  | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentLang: SupportedLang;
  onOpenTerms?: () => void;
  onToggleSidebar?: () => void;
  user?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentLang,
  onOpenTerms
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;

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
    { id: 'fiscal_matrix', label: 'Configuração de Taxas', icon: Scale },
    { id: 'tickets', label: 'Chat com Ticket', icon: LifeBuoy },
    { id: 'admin_settings', label: 'Definições do Sistema', icon: Settings }
  ];

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
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

        <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-4 mb-2 px-3 font-mono">
          Ferramentas & Apoio
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
