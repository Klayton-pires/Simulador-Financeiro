import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Maximize2,
  Minimize2,
  Search,
  Store,
  Briefcase,
  Handshake,
  Smartphone,
  Ship,
  FileSpreadsheet,
  Code,
  Table,
  Sparkles,
  Building,
  ShieldCheck,
  LifeBuoy,
  MessageSquare,
  BarChart3,
  Settings,
  Download,
  BookOpen,
  Gem,
  History,
  Layers,
  Check,
  ChevronRight,
  Globe,
  Sliders,
  User,
  Shield
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { UserSafe } from '../types';
import { SupportedLang } from '../i18n/translations';
import { isStaffOrAdmin } from '../utils/accessControl';

interface CornerMenuProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isSidebarHidden: boolean;
  onToggleSidebar: () => void;
  user: UserSafe | null;
  currentLang: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
  onOpenPlans: () => void;
  onOpenSupport: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onOpenClientLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenClientProfile?: () => void;
}

interface CornerMenuItem {
  id: string;
  label: string;
  category: string;
  icon: any;
  unlocked: boolean;
  badge?: string;
}

export const CornerMenu: React.FC<CornerMenuProps> = ({
  activeTab,
  onTabChange,
  isSidebarHidden,
  onToggleSidebar,
  user,
  currentLang,
  onLanguageChange,
  onOpenPlans,
  onOpenSupport,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onToggle: controlledOnToggle,
  onOpenClientLogin,
  onOpenAdminLogin,
  onOpenClientProfile
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleMenu = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else if (controlledOnClose && controlledIsOpen !== undefined) {
      if (controlledIsOpen) controlledOnClose();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const closeMenu = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const isStaff = isStaffOrAdmin(user?.role);
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin_level1';
  const isAdmin = isSuperAdmin || user?.role === 'admin' || user?.role === 'admin_level2';
  const isManager = isAdmin || user?.role === 'manager';

  // Keyboard shortcut listener (Ctrl + M or Alt + M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMenu();
      }
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const allModules: CornerMenuItem[] = [
    // Análise Financeira & Gráficos (Exclusivo para Gestores)
    ...(isManager ? [
      { id: 'analytics_dashboard', label: 'Dashboard Financeiro (Gestores)', category: 'Inteligência & Análise', icon: BarChart3, unlocked: true }
    ] : []),

    // Simuladores & Motor
    { id: 'local', label: 'Vendas & Comércio (PVP)', category: 'Simuladores', icon: Store, unlocked: true },
    { id: 'services_consulting', label: 'Prestação de Serviços', category: 'Simuladores', icon: Briefcase, unlocked: true },
    { id: 'intermediary', label: 'Intermediários & Corretagem', category: 'Simuladores', icon: Handshake, unlocked: true },
    { id: 'basic_mobile', label: 'Modo Celular Básico / POS', category: 'Simuladores', icon: Smartphone, unlocked: true },
    { id: 'import', label: 'Importação Aduaneira', category: 'Simuladores', icon: Ship, unlocked: !!(user?.isImportUnlocked || isManager) },
    { id: 'excel', label: 'Lotes Excel (.xlsx)', category: 'Simuladores', icon: FileSpreadsheet, unlocked: !!(user?.isBatchUnlocked || isManager) },
    { id: 'api_integration', label: 'API REST ERP & Lojas', category: 'Simuladores', icon: Code, unlocked: !!(user?.isApiUnlocked || isManager) },

    // Gestão CRM, Definições & Governança (Acesso Exclusivo Staff & Administradores)
    ...(isStaff ? [
      { id: 'admin_settings', label: 'Definições do Sistema', category: 'Backoffice & Staff', icon: Settings, unlocked: true },
      { id: 'fiscal_matrix', label: 'Configuração Manual de Taxas', category: 'Backoffice & Staff', icon: Table, unlocked: true },
      { id: 'tickets', label: 'Chat com Ticket & Atendimento', category: 'Backoffice & Staff', icon: LifeBuoy, unlocked: true }
    ] : []),

    // Minha Conta
    { id: 'history', label: 'Histórico & Faturas', category: 'Minha Conta', icon: History, unlocked: true }
  ];

  const categories = Array.from(new Set(allModules.map((m) => m.category)));

  const handleSelectModule = (id: string) => {
    if (id === 'history') {
      if (user?.role === 'client' && onOpenClientProfile) {
        onOpenClientProfile();
      } else if (isManager) {
        onTabChange('analytics_dashboard');
      } else if (onOpenClientProfile) {
        onOpenClientProfile();
      } else {
        onTabChange('local');
      }
    } else {
      onTabChange(id as ActiveTab);
    }
    closeMenu();
  };

  return (
    <>
      {/* Floating Top-Left Quick Launcher (Aparece quando a barra lateral está recolhida para acesso imediato) */}
      {isSidebarHidden && !isOpen && (
        <div className="fixed top-20 left-4 z-40 flex items-center gap-2 font-mono animate-in fade-in slide-in-from-left duration-200">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl shadow-xl border border-indigo-400/40 transition active:scale-95 cursor-pointer text-xs font-bold"
            title="Menu de Módulos & Opções (Ctrl + M)"
          >
            <Menu className="w-4 h-4 text-white" />
            <span>Menu de Módulos</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </button>
        </div>
      )}

      {/* Floating Modal / Drawer Launcher do Lado Superior Esquerdo */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-start p-3 sm:p-6 sm:pt-16 sm:pl-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeMenu}
        >
          <div
            className="bg-[#0F172A] border border-slate-700 w-full sm:w-[460px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 sm:slide-in-from-left-6 duration-250 mt-12 sm:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    MENU DE MÓDULOS & OPÇÕES
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Acesso rápido a todas as funções da plataforma
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 flex items-center justify-center gap-1.5 transition"
              >
                {isSidebarHidden ? <Minimize2 className="w-3 h-3 text-indigo-400" /> : <Maximize2 className="w-3 h-3 text-emerald-400" />}
                <span className="text-[11px]">{isSidebarHidden ? 'Mostrar Barra Lateral' : 'Ocultar Barra Lateral'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenPlans();
                  closeMenu();
                }}
                className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1 transition"
              >
                <Gem className="w-3 h-3 text-amber-400" />
                <span className="text-[11px]">Planos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSupport();
                  closeMenu();
                }}
                className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1 transition"
              >
                <LifeBuoy className="w-3 h-3" />
                <span className="text-[11px]">Suporte</span>
              </button>
            </div>

            {/* Portais de Acesso Reservado: Utilizador & Gestores */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  if (user?.role === 'client' && onOpenClientProfile) {
                    onOpenClientProfile();
                  } else if (onOpenClientLogin) {
                    onOpenClientLogin();
                  }
                  closeMenu();
                }}
                className="p-2 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Área do Utilizador</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.role === 'client' ? (
                    <span className="text-amber-300 font-bold">{user.queriesRemaining} créditos</span>
                  ) : (
                    'Login & Perfil'
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isStaff && onTabChange) {
                    onTabChange('admin_settings');
                  } else if (onOpenAdminLogin) {
                    onOpenAdminLogin();
                  }
                  closeMenu();
                }}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Área Gestores</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {isStaff ? 'Painel de Gestão' : 'Acesso Admin'}
                </div>
              </button>
            </div>

            {/* Modules List Categorized */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs max-h-[60vh]">
              {categories.map((cat) => {
                const catModules = allModules.filter((m) => m.category === cat);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2">
                      {cat}
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {catModules.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectModule(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition ${
                              isActive
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold shadow'
                                : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive ? 'text-indigo-400' : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.badge && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                                  {item.badge}
                                </span>
                              )}
                              {isActive ? (
                                <Check className="w-3.5 h-3.5 text-indigo-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#1E293B] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Idioma:</span>
                <select
                  value={currentLang}
                  onChange={(e) => onLanguageChange(e.target.value as SupportedLang)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="pt">PT (Português)</option>
                  <option value="en">EN (English)</option>
                  <option value="es">ES (Español)</option>
                  <option value="fr">FR (Français)</option>
                  <option value="zh">ZH (中文)</option>
                </select>
              </div>

              <span className="text-[10px] text-slate-500">Atalho: Ctrl + M</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
