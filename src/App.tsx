import React, { useState, useEffect } from 'react';
import { UserSafe, SystemSettings } from './types';
import { SupportedLang } from './i18n/translations';
import { useI18n } from './i18n/I18nContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LocalTradeSimulator } from './components/LocalTradeSimulator';
import { ImportSimulator } from './components/ImportSimulator';
import { ExcelBatchSimulator } from './components/ExcelBatchSimulator';
import { PlansModal } from './components/PlansModal';
import { SupportChatWidget } from './components/SupportChatWidget';
import { AuthModal } from './components/AuthModal';
import { ClientProfileModal } from './components/ClientProfileModal';
import { SignupBonusPresentationNotification } from './components/SignupBonusPresentationNotification';

// Advanced Features & Modules
import { BasicPhoneMobileMode } from './components/BasicPhoneMobileMode';
import { ServicesConsultingSimulator } from './components/ServicesConsultingSimulator';
import { IntermediaryBrokerSimulator } from './components/IntermediaryBrokerSimulator';
import { ApiIntegrationsTab } from './components/ApiIntegrationsTab';
import { TicketsManagementTab } from './components/TicketsManagementTab';
import { AdminAdvancedSettingsTab } from './components/admin/AdminAdvancedSettingsTab';
import { FinancialAnalyticsDashboard } from './components/FinancialAnalyticsDashboard';
import { LegalTermsModal } from './components/LegalTermsModal';
import { CornerMenu } from './components/CornerMenu';

function AppContent() {
  const { language, setLanguage } = useI18n();
  const [currentLang, setCurrentLang] = useState<SupportedLang>(language || 'pt');
  const [activeTab, setActiveTab] = useState<ActiveTab>('local');
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    return localStorage.getItem('nanucloud_sidebar_hidden') === 'true';
  });

  const { currentUser, isClient, isAdmin, consumeCredit } = useAuth();

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'client' | 'admin'>('client');
  const [isClientProfileOpen, setIsClientProfileOpen] = useState<boolean>(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Fallback guest profile if unauthenticated (Standard User / Visitor role - Free demonstration queries)
  const guestOperator: UserSafe = {
    id: 'visitante_anonimo',
    name: 'Visitante Comercial',
    company: 'Empresa Visitante',
    email: 'visitante@nanucloud.com',
    country: 'Angola',
    role: 'client',
    isActive: true,
    queriesRemaining: 50,
    totalQueriesUsed: 0,
    activePlanId: 'plan_starter',
    activePlanName: 'Acesso Livre Simuladores',
    planExpiresAt: null,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-01-01T00:00:00Z'
  };

  const effectiveUser: UserSafe = currentUser || guestOperator;

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

  const handleOpenClientLogin = () => {
    setAuthInitialTab('client');
    setIsAuthModalOpen(true);
  };

  const handleOpenAdminLogin = () => {
    setAuthInitialTab('admin');
    setIsAuthModalOpen(true);
  };

  const handleSimulationDone = () => {
    if (currentUser && isClient) {
      consumeCredit(1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Subtle Ambient Lighting Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.12),rgba(0,0,0,0))]"></div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_35%_at_90%_25%,rgba(56,189,248,0.06),rgba(0,0,0,0))]"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Fixed Header with Client/Admin Auth Buttons & Balance Badge */}
        <Navbar
          currentLang={currentLang}
          onLanguageChange={handleLangChange}
          onToggleMenu={() => setIsMenuDrawerOpen((prev) => !prev)}
          onNavigateHome={() => setActiveTab('local')}
          onOpenClientLogin={handleOpenClientLogin}
          onOpenAdminLogin={handleOpenAdminLogin}
          onOpenClientProfile={() => setIsClientProfileOpen(true)}
          onOpenAdminDashboard={() => setActiveTab('admin_settings')}
          onOpenPlans={() => setIsPlansOpen(true)}
          onOpenAnalytics={() => setActiveTab('analytics_dashboard')}
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
            onOpenClientLogin={handleOpenClientLogin}
            onOpenAdminLogin={handleOpenAdminLogin}
            onOpenClientProfile={() => setIsClientProfileOpen(true)}
          />
        )}

        {/* Content View */}
        <div className="flex-1 min-w-0">
          
          {/* Header Banner when Sidebar is Hidden */}
          {isSidebarHidden && (
            <div className="mb-4 p-3 glass-panel rounded-2xl flex items-center justify-between text-xs border border-white/[0.08]">
              <div className="flex items-center gap-2 text-indigo-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Modo Espaço Total</span>
                <span className="text-slate-500 text-xs hidden sm:inline">· Aceda aos módulos pelo menu de navegação</span>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs border border-white/[0.08] hover:border-slate-600 transition"
              >
                Restaurar Menu Lateral
              </button>
            </div>
          )}

          {/* Marketing & Signup Bonus Presentation Notification Banner */}
          <SignupBonusPresentationNotification
            user={currentUser}
            onOpenRegister={handleOpenClientLogin}
            onOpenLogin={handleOpenClientLogin}
          />
          
          {/* TAB: Vendas & Comércio (Local) */}
          {activeTab === 'local' && (
            <LocalTradeSimulator
              user={effectiveUser}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={handleOpenClientLogin}
              onCalculationDone={handleSimulationDone}
            />
          )}

          {/* TAB: Prestação de Serviços & Consultoria */}
          {activeTab === 'services_consulting' && (
            <ServicesConsultingSimulator
              user={effectiveUser}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={handleOpenClientLogin}
              onCalculationDone={handleSimulationDone}
            />
          )}

          {/* TAB: Intermediários & Corretagem */}
          {activeTab === 'intermediary' && (
            <IntermediaryBrokerSimulator
              user={effectiveUser}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={handleOpenClientLogin}
              onCalculationDone={handleSimulationDone}
            />
          )}

          {/* TAB: Modo Celular Básico / POS */}
          {activeTab === 'basic_mobile' && (
            <BasicPhoneMobileMode
              user={effectiveUser}
              onCalculationDone={handleSimulationDone}
            />
          )}

          {/* TAB: Importação Aduaneira */}
          {activeTab === 'import' && (
            <ImportSimulator
              user={effectiveUser}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={handleOpenClientLogin}
              onCalculationDone={handleSimulationDone}
            />
          )}

          {/* TAB: Lotes Excel (.xlsx) */}
          {activeTab === 'excel' && (
            <ExcelBatchSimulator
              user={effectiveUser}
              currentLang={currentLang}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={handleOpenClientLogin}
              onCalculationDone={handleSimulationDone}
            />
          )}

          {/* TAB: API REST ERP & Lojas */}
          {activeTab === 'api_integration' && (
            <ApiIntegrationsTab
              user={effectiveUser}
              onOpenPlans={() => setIsPlansOpen(true)}
              onOpenAuth={handleOpenClientLogin}
            />
          )}

          {/* TAB: Matriz Fiscal de Taxas */}
          {activeTab === 'fiscal_matrix' && (
            <AdminAdvancedSettingsTab
              currentUser={effectiveUser}
              initialSection="fiscal_matrix"
            />
          )}

          {/* TAB: Central de Tickets & Contactos */}
          {activeTab === 'tickets' && (
            <TicketsManagementTab currentUser={effectiveUser} />
          )}

          {/* TAB: Definições & Gestão Administrativa */}
          {activeTab === 'admin_settings' && (
            <AdminAdvancedSettingsTab currentUser={effectiveUser} />
          )}

          {/* TAB: Dashboard de Análise de Dados Financeiros (Recharts) */}
          {(activeTab === 'analytics_dashboard' || activeTab === 'history') && (
            <FinancialAnalyticsDashboard
              currentUser={effectiveUser}
              onNavigateToSimulator={(simType) => setActiveTab(simType as ActiveTab)}
            />
          )}

        </div>
      </main>

      {/* Global Footer */}
      <Footer settings={systemSettings} />

      {/* Auth Modal (Client Login/Register & Admin Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authInitialTab}
        onLoginSuccess={(role) => {
          if (role === 'admin') {
            setActiveTab('admin_settings');
          }
        }}
      />

      {/* Client Profile Modal (Profile, Purchased Balance, Payment Orders) */}
      <ClientProfileModal
        isOpen={isClientProfileOpen}
        onClose={() => setIsClientProfileOpen(false)}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenSupportChat={() => setIsChatOpen(true)}
      />

      {/* Plans Modal */}
      <PlansModal
        user={effectiveUser}
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
        onOpenAuth={handleOpenClientLogin}
        onOpenSupportChat={() => {
          setIsPlansOpen(false);
          setIsChatOpen(true);
        }}
        onPurchaseSuccess={() => {}}
      />

      {/* Legal Terms & Refund Policy Modal */}
      <LegalTermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        currentUser={effectiveUser}
      />

      {/* Floating 24/7 Live Support Chat & Bot */}
      <SupportChatWidget
        user={effectiveUser}
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
        user={effectiveUser}
        currentLang={currentLang}
        onLanguageChange={handleLangChange}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenSupport={() => setIsChatOpen(true)}
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onToggle={() => setIsMenuDrawerOpen((prev) => !prev)}
        onOpenClientLogin={handleOpenClientLogin}
        onOpenAdminLogin={handleOpenAdminLogin}
        onOpenClientProfile={() => setIsClientProfileOpen(true)}
      />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
