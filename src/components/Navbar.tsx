import React from 'react';
import { SupportedLang } from '../i18n/translations';
import {
  Menu,
  Zap,
  SlidersHorizontal,
  User,
  Shield,
  Coins,
  Plus,
  LogOut,
  Building,
  BarChart3
} from 'lucide-react';
import { NanuCloudLogo } from './NanuCloudLogo';
import { useLayoutMode } from '../data/layoutMode';
import { useAuth } from '../context/AuthContext';
import { isManagerOrAdmin } from '../utils/accessControl';

interface NavbarProps {
  currentLang: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
  onToggleMenu?: () => void;
  onNavigateHome?: () => void;
  onOpenClientLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenClientProfile?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenPlans?: () => void;
  onOpenAnalytics?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  onToggleMenu,
  onNavigateHome,
  onOpenClientLogin,
  onOpenAdminLogin,
  onOpenClientProfile,
  onOpenAdminDashboard,
  onOpenPlans,
  onOpenAnalytics
}) => {
  const [layoutMode, setLayoutMode] = useLayoutMode();
  const { currentUser, isClient, isAdmin, logout, transactions } = useAuth();

  const pendingPaymentsCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-3 sm:px-4 md:px-6 bg-[#0B101D]/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Top-Left Menu Trigger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMenu && (
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] hover:border-indigo-500/40 transition cursor-pointer shadow-sm active:scale-95 text-xs font-medium"
              title="Menu de Módulos (Ctrl + M)"
              aria-label="Abrir Menu de Módulos"
            >
              <Menu className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Módulos</span>
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className="cursor-pointer transition hover:opacity-90 active:scale-98 flex items-center"
            title="Ir para a Página Inicial do Simulador"
            role="button"
            tabIndex={0}
          >
            <NanuCloudLogo className="h-8 sm:h-9" isDarkTheme={true} />
          </div>
        </div>

        {/* Center / User Status Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* If Logged in as Client: Show Client Reserved Area badge, balance & logout */}
          {currentUser && isClient && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenClientProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-xs transition cursor-pointer shadow-sm active:scale-95 group"
                title="Abrir Área Reservada do Utilizador (Perfil, Saldo Comprado e Pedidos)"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <User className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-white group-hover:text-indigo-200">
                      Área do Utilizador
                    </span>
                    <span className="text-[10px] font-mono font-medium text-amber-400 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400 inline" />
                      {currentUser.queriesRemaining.toLocaleString('pt-PT')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px] hidden sm:block">
                    {currentUser.company || currentUser.name}
                  </span>
                </div>
              </button>

              {onOpenPlans && (
                <button
                  type="button"
                  onClick={onOpenPlans}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                  title="Comprar mais créditos ou alterar plano"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Recarregar</span>
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-white/[0.06] text-xs transition cursor-pointer"
                title="Terminar Sessão em Segurança"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Sair</span>
              </button>
            </div>
          )}

          {/* If Logged in as Admin / Gestor: Show Manager Reserved Area & Logout */}
          {currentUser && isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-xs font-medium text-cyan-300 transition cursor-pointer shadow-sm active:scale-95 group"
                title="Área Reservada dos Gestores (Painel Administrativo & Aprovações)"
              >
                <Shield className="w-4 h-4 text-cyan-400 group-hover:rotate-6 transition-transform shrink-0" />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white font-semibold">Painel Gestão</span>
                    {pendingPaymentsCount > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                        {pendingPaymentsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-normal hidden sm:block">
                    Administração & Finanças
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-white/[0.06] text-xs transition cursor-pointer"
                title="Terminar Sessão Administrativa"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Sair</span>
              </button>
            </div>
          )}

          {/* If NOT Logged in: Show Clear Separate Access Buttons for Client & Gestor */}
          {!currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onOpenClientLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm active:scale-95 cursor-pointer border border-indigo-500/40"
                title="Área Reservada do Utilizador: Iniciar Sessão ou Registar Empresa"
              >
                <User className="w-3.5 h-3.5 text-indigo-200" />
                <span>Área do Utilizador</span>
              </button>

              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-medium transition active:scale-95 cursor-pointer shadow-sm"
                title="Área Reservada dos Gestores: Painel Administrativo e Aprovações"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Área dos</span>
                <span>Gestores</span>
              </button>
            </div>
          )}

          {/* Dynamic Layout Mode Switcher (Friendly vs Advanced) */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'friendly' ? 'advanced' : 'friendly')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${
              layoutMode === 'friendly'
                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
            title={`Layout Atual: Modo ${layoutMode === 'friendly' ? 'Amigável' : 'Avançado'}. Clique para alternar.`}
          >
            {layoutMode === 'friendly' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-slate-400">Modo</span>
                <span className="text-indigo-200 font-semibold">Amigável</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-slate-400">Modo</span>
                <span className="text-amber-200 font-semibold">Avançado</span>
              </>
            )}
          </button>

          {/* Dashboard Financeiro Button - Exclusivo para Gestores */}
          {onOpenAnalytics && (isAdmin || isManagerOrAdmin(currentUser?.role)) && (
            <button
              type="button"
              onClick={onOpenAnalytics}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-white/[0.08] hover:border-indigo-500/40 text-xs font-medium transition cursor-pointer shadow-sm"
              title="Abrir Dashboard de Análise Financeira (Exclusivo para Gestores)"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Analytics</span>
            </button>
          )}

          {/* Language Selector */}
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLang)}
            className="bg-slate-900/90 text-slate-200 border border-white/[0.08] hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="pt">🇵🇹 PT</option>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ar">🇦🇪 AR</option>
            <option value="ja">🇯🇵 JA</option>
            <option value="it">🇮🇹 IT</option>
            <option value="ko">🇰🇷 KO</option>
            <option value="hi">🇮🇳 HI</option>
          </select>
        </div>
      </div>
    </header>
  );
};
