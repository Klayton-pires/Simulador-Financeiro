import React from 'react';
import { SupportedLang } from '../i18n/translations';
import { Menu, Zap, SlidersHorizontal } from 'lucide-react';
import { NanuCloudLogo } from './NanuCloudLogo';
import { useLayoutMode } from '../data/layoutMode';

interface NavbarProps {
  currentLang: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
  onToggleMenu?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  onToggleMenu,
  onNavigateHome
}) => {
  const [layoutMode, setLayoutMode] = useLayoutMode();

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 md:px-6 bg-[#1E293B] sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Top-Left Menu Trigger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMenu && (
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500/50 transition cursor-pointer shadow-sm active:scale-95 text-xs font-mono font-bold"
              title="Menu de Módulos (Ctrl + M)"
              aria-label="Abrir Menu de Módulos"
            >
              <Menu className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Menu</span>
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
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-tight">
              CONSOLE
            </span>
            <span className="text-emerald-400 text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
              MODO LIVRE / SEM LOGIN
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dynamic Layout Mode Switcher (Friendly vs Advanced) */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'friendly' ? 'advanced' : 'friendly')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
              layoutMode === 'friendly'
                ? 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10'
            }`}
            title={`Layout Atual: Modo ${layoutMode === 'friendly' ? 'Amigável' : 'Avançado'}. Clique para alternar.`}
          >
            {layoutMode === 'friendly' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="hidden sm:inline">Modo</span>
                <span className="text-indigo-200">Amigável</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Modo</span>
                <span className="text-amber-200">Avançado</span>
              </>
            )}
          </button>

          {/* Language Selector */}
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLang)}
            className="bg-[#0F172A] text-slate-200 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-500 transition cursor-pointer"
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
