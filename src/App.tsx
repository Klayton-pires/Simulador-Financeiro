import React, { useState, useEffect } from 'react';
import { UserSafe, SystemSettings } from './types';
import { SupportedLang } from './i18n/translations';
import { useI18n } from './i18n/I18nContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LocalTradeSimulator } from './components/LocalTradeSimulator';
import { ImportSimulator } from './components/ImportSimulator';
import { ExcelBatchSimulator } from './components/ExcelBatchSimulator';
import { PlansModal } from './components/PlansModal';
import { SupportChatWidget } from './components/SupportChatWidget';

// Advanced Features & Modules
import { BasicPhoneMobileMode } from './components/BasicPhoneMobileMode';
import { ServicesConsultingSimulator } from './components/ServicesConsultingSimulator';
import { IntermediaryBrokerSimulator } from './components/IntermediaryBrokerSimulator';
import { ApiIntegrationsTab } from './components/ApiIntegrationsTab';
import { TicketsManagementTab } from './components/TicketsManagementTab';
import { AdminAdvancedSettingsTab } from './components/admin/AdminAdvancedSettingsTab';
import { LegalTermsModal } from './components/LegalTermsModal';
import { CornerMenu } from './components/CornerMenu';

export default function App() {
  const { language, setLanguage } = useI18n();
  const [currentLang, setCurrentLang] = useState<SupportedLang>(language || 'pt');
  const [activeTab, setActiveTab] = useState<ActiveTab>('local');
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    return localStorage.getItem('nanucloud_sidebar_hidden') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarHidden((prev) => {
      const next = !prev;
      localStorage.setItem('nanucloud_sidebar_hidden', String(next));
      return next;
    });
  };

  // Modals & Chat
  const [isPlansOpen, setIsPlansOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState<boolean>(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Standard safe profile for components that display operator name
  const systemOperator: UserSafe = {
    id: 'operador_sistema',
    name: 'Operador NANUCLOUD',
    email: 'operador@nanucloud.com',
    country: 'Angola',
    role: 'super_admin',
    isActive: true,
    queriesRemaining: 999999,
    totalQueriesUsed: 0,
    activePlanId: 'plan_unlimited',
    activePlanName: 'Acesso Livre Irrestrito',
    planExpiresAt: null,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-01-01T00:00:00Z'
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch('/api/plans/public-config');
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  useEffect(() => {
    // Check saved language
    const savedLang = (localStorage.getItem('nanucloud_user_lang') || localStorage.getItem('nanucloud_lang')) as SupportedLang;
    if (savedLang) {
      setCurrentLang(savedLang);
      setLanguage(savedLang);
    }
  }, [setLanguage]);

  useEffect(() => {
    if (language && language !== currentLang) {
      setCurrentLang(language);
    }
  }, [language, currentLang]);

  const handleLangChange = (lang: SupportedLang) => {
    setCurrentLang(lang);
    setLanguage(lang);
    localStorage.setItem('nanucloud_lang', lang);
    localStorage.setItem('nanucloud_user_lang', lang);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-slate-200 antialiased selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Fixed Header */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={handleLangChange}
        onToggleMenu={() => setIsMenuDrawerOpen((prev) => !prev)}
        onNavigateHome={() => setActiveTab('local')}
      />

      {/* Main Container */}
      <main className={`max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex-1 flex flex-col ${isSidebarHidden ? '' : 'lg:flex-row'} gap-6 transition-all duration-300`}>
        {/* Sidebar Nav */}
        {!isSidebarHidden && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'plans') {
                setIsPlansOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            currentLang={currentLang}
            onOpenTerms={() => setIsTermsOpen(true)}
            onToggleSidebar={toggleSidebar}
          />
        )}

        {/* Content View */}
        <div className="flex-1 min-w-0">
          
          {/* Header Banner when Sidebar is Hidden */}
          {isSidebarHidden && (
            <div className="mb-4 p-2.5 bg-[#1E293B]/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MODO ESPAÇO TOTAL ATIVO</span>
                <span className="text-slate-500 text-[10px] font-normal hidden sm:inline">| Aceda a qualquer módulo pelo menu flutuante no canto inferior direito</span>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] border border-slate-700 transition"
              >
                Restaurar Menu Lateral
              </button>
            </div>
          )}
          
          {/* TAB: Vendas & Comércio (Local) */}
          {activeTab === 'local' && (
            <LocalTradeSimulator
              user={systemOperator}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={() => {}}
              onCalculationDone={() => {}}
            />
          )}

          {/* TAB: Prestação de Serviços & Consultoria */}
          {activeTab === 'services_consulting' && (
            <ServicesConsultingSimulator
              user={systemOperator}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={() => {}}
              onCalculationDone={() => {}}
            />
          )}

          {/* TAB: Intermediários & Corretagem */}
          {activeTab === 'intermediary' && (
            <IntermediaryBrokerSimulator
              user={systemOperator}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={() => {}}
              onCalculationDone={() => {}}
            />
          )}

          {/* TAB: Modo Celular Básico / POS */}
          {activeTab === 'basic_mobile' && (
            <BasicPhoneMobileMode
              user={systemOperator}
              onCalculationDone={() => {}}
            />
          )}

          {/* TAB: Importação Aduaneira */}
          {activeTab === 'import' && (
            <ImportSimulator
              user={systemOperator}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={() => {}}
              onCalculationDone={() => {}}
            />
          )}

          {/* TAB: Lotes Excel (.xlsx) */}
          {activeTab === 'excel' && (
            <ExcelBatchSimulator
              user={systemOperator}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={() => {}}
              onCalculationDone={() => {}}
            />
          )}

          {/* TAB: API REST ERP & Lojas */}
          {activeTab === 'api_integration' && (
            <ApiIntegrationsTab
              user={systemOperator}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={() => {}}
            />
          )}

          {/* TAB: Matriz Fiscal de Taxas */}
          {activeTab === 'fiscal_matrix' && (
            <AdminAdvancedSettingsTab
              currentUser={systemOperator}
              initialSection="fiscal_matrix"
            />
          )}

          {/* TAB: Central de Tickets & Contactos */}
          {activeTab === 'tickets' && (
            <TicketsManagementTab currentUser={systemOperator} />
          )}

          {/* TAB: Definições Avançadas */}
          {activeTab === 'admin_settings' && (
            <AdminAdvancedSettingsTab currentUser={systemOperator} />
          )}

        </div>
      </main>

      {/* Global Footer */}
      <Footer settings={systemSettings} />

      {/* Plans Modal */}
      <PlansModal
        user={systemOperator}
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
        onOpenAuth={() => {}}
        onOpenChat={() => {
          setIsPlansOpen(false);
          setIsChatOpen(true);
        }}
        onPurchaseSuccess={() => {}}
      />

      {/* Legal Terms & Refund Policy Modal */}
      <LegalTermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        currentUser={systemOperator}
      />

      {/* Floating 24/7 Live Support Chat & Bot */}
      <SupportChatWidget
        user={systemOperator}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Floating Corner Menu HUD & Quick Module Launcher */}
      <CornerMenu
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'plans') {
            setIsPlansOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isSidebarHidden={isSidebarHidden}
        onToggleSidebar={toggleSidebar}
        user={systemOperator}
        currentLang={currentLang}
        onLanguageChange={handleLangChange}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenSupport={() => setIsChatOpen(true)}
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onToggle={() => setIsMenuDrawerOpen((prev) => !prev)}
      />
    </div>
  );
}
