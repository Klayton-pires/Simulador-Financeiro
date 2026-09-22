import React, { useState } from 'react';
import {
  Users,
  Shield,
  Package,
  CreditCard,
  Table,
  MessageSquare,
  CheckCircle2,
  Settings,
  Clock,
  Check
} from 'lucide-react';
import { UserSafe } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PendingPaymentsSection } from './PendingPaymentsSection';
import { ClientsManagementSection } from './ClientsManagementSection';
import { StaffUsersManagementSection } from './StaffUsersManagementSection';
import { PlansManagementSection } from './PlansManagementSection';
import { PaymentMethodsSection } from './PaymentMethodsSection';
import { ManualFiscalMatrixTab } from '../ManualFiscalMatrixTab';
import { TicketsManagementTab } from '../TicketsManagementTab';
import { DatabaseSqlManagementSection } from './DatabaseSqlManagementSection';
import { AuditLogsManagementSection } from './AuditLogsManagementSection';
import { Database, FileText } from 'lucide-react';

export type AdminSettingsSection =
  | 'pending_payments'
  | 'clients'
  | 'plans'
  | 'tickets'
  | 'payments'
  | 'database_sql'
  | 'audit_logs'
  | 'fiscal_matrix'
  | 'users';

interface AdminAdvancedSettingsTabProps {
  currentUser: UserSafe;
  initialSection?: AdminSettingsSection;
}

export const AdminAdvancedSettingsTab: React.FC<AdminAdvancedSettingsTabProps> = ({
  currentUser,
  initialSection = 'pending_payments'
}) => {
  const { transactions, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSettingsSection>(initialSection);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Security Guard: Deny access if not an administrator/staff
  if (!isAdmin && currentUser.role === 'client') {
    return (
      <div className="bg-[#1E293B] border border-rose-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 font-mono">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">Acesso Reservado à Administração</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Esta área de configurações e aprovações é restrita à equipa de gestão e suporte da NANUCLOUD. O seu perfil empresarial está ativo e tem acesso aos simuladores fiscais.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
        >
          Voltar aos Simuladores
        </button>
      </div>
    );
  }

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  const showSaveNotice = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
  };

  const navItems: { id: AdminSettingsSection; label: string; icon: React.ReactNode; desc: string; badge?: number }[] = [
    {
      id: 'pending_payments',
      label: 'Aprovação de Pagamentos',
      icon: <CreditCard className="w-4 h-4" />,
      desc: 'Validação e atribuição de créditos',
      badge: pendingCount
    },
    {
      id: 'clients',
      label: 'Clientes & Saldos',
      icon: <Users className="w-4 h-4" />,
      desc: 'Empresas e créditos manuais'
    },
    {
      id: 'plans',
      label: 'Planos & Preços',
      icon: <Package className="w-4 h-4" />,
      desc: 'Preços Kz e créditos por plano'
    },
    {
      id: 'tickets',
      label: 'Chat Suporte & Tickets',
      icon: <MessageSquare className="w-4 h-4" />,
      desc: 'Atendimento aos clientes'
    },
    {
      id: 'payments',
      label: 'Formas de Pagamento',
      icon: <Check className="w-4 h-4" />,
      desc: 'Contas bancárias e gateways'
    },
    {
      id: 'database_sql',
      label: 'Base de Dados & SQL',
      icon: <Database className="w-4 h-4 text-indigo-400" />,
      desc: 'Esquema SQL e criptografia Bcrypt'
    },
    {
      id: 'audit_logs',
      label: 'Logs de Auditoria',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      desc: 'Trilha de auditoria e conformidade'
    },
    {
      id: 'fiscal_matrix',
      label: 'Configuração de Taxas',
      icon: <Table className="w-4 h-4" />,
      desc: 'Taxas manuais por jurisdição'
    },
    {
      id: 'users',
      label: 'Equipa & Permissões',
      icon: <Shield className="w-4 h-4" />,
      desc: 'Utilizadores administrativos'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast notification */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Settings Header */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono">DEFINIÇÕES & BACKOFFICE</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Painel Essencial
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Gestão centralizada de Clientes, Utilizadores, Planos, Formas de Pagamento, Taxas Manuais e Chat de Suporte.
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-slate-400 hidden sm:block">
          <div>Operador: <span className="text-slate-200 font-bold">{currentUser.name}</span></div>
          <div className="text-[10px] text-slate-500 uppercase">Perfil: {currentUser.role}</div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`p-3 rounded-xl font-mono text-left transition flex flex-col justify-between gap-1.5 cursor-pointer border relative ${
                isActive
                  ? 'bg-[#1E293B] text-slate-100 border-indigo-500/60 shadow-lg'
                  : 'bg-slate-950/40 text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-xs truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="space-y-6">
        {activeSection === 'pending_payments' && (
          <PendingPaymentsSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'clients' && (
          <ClientsManagementSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'plans' && (
          <PlansManagementSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'tickets' && (
          <TicketsManagementTab currentUser={currentUser} />
        )}

        {activeSection === 'payments' && (
          <PaymentMethodsSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'database_sql' && (
          <DatabaseSqlManagementSection />
        )}

        {activeSection === 'audit_logs' && (
          <AuditLogsManagementSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'fiscal_matrix' && (
          <ManualFiscalMatrixTab currentUser={currentUser} />
        )}

        {activeSection === 'users' && (
          <StaffUsersManagementSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}
      </div>
    </div>
  );
};
