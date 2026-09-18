import React, { useState } from 'react';
import {
  Users,
  Shield,
  Package,
  CreditCard,
  Table,
  MessageSquare,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { UserSafe } from '../../types';
import { ClientsManagementSection } from './ClientsManagementSection';
import { StaffUsersManagementSection } from './StaffUsersManagementSection';
import { PlansManagementSection } from './PlansManagementSection';
import { PaymentMethodsSection } from './PaymentMethodsSection';
import { ManualFiscalMatrixTab } from '../ManualFiscalMatrixTab';
import { TicketsManagementTab } from '../TicketsManagementTab';

export type AdminSettingsSection =
  | 'clients'
  | 'users'
  | 'plans'
  | 'payments'
  | 'fiscal_matrix'
  | 'tickets';

interface AdminAdvancedSettingsTabProps {
  currentUser: UserSafe;
  initialSection?: AdminSettingsSection;
}

export const AdminAdvancedSettingsTab: React.FC<AdminAdvancedSettingsTabProps> = ({
  currentUser,
  initialSection = 'clients'
}) => {
  const [activeSection, setActiveSection] = useState<AdminSettingsSection>(initialSection);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showSaveNotice = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
  };

  const navItems: { id: AdminSettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'clients',
      label: 'Clientes',
      icon: <Users className="w-4 h-4" />,
      desc: 'Empresas, subscrições e saldos'
    },
    {
      id: 'users',
      label: 'Utilizadores',
      icon: <Shield className="w-4 h-4" />,
      desc: 'Equipa staff e administradores'
    },
    {
      id: 'plans',
      label: 'Planos & Preços',
      icon: <Package className="w-4 h-4" />,
      desc: 'Pacotes, preços Kz e créditos'
    },
    {
      id: 'payments',
      label: 'Formas de Pagamento',
      icon: <CreditCard className="w-4 h-4" />,
      desc: 'Contas bancárias e gateways'
    },
    {
      id: 'fiscal_matrix',
      label: 'Configuração Manual de Taxas',
      icon: <Table className="w-4 h-4" />,
      desc: 'Matriz e alíquotas por país'
    },
    {
      id: 'tickets',
      label: 'Chat com Ticket',
      icon: <MessageSquare className="w-4 h-4" />,
      desc: 'Suporte, tickets e chat ao vivo'
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`p-3 rounded-xl font-mono text-left transition flex flex-col justify-between gap-1.5 cursor-pointer border ${
                isActive
                  ? 'bg-[#1E293B] text-slate-100 border-indigo-500/60 shadow-lg'
                  : 'bg-slate-950/40 text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span className="font-bold text-xs truncate">{item.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="space-y-6">
        {activeSection === 'clients' && (
          <ClientsManagementSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'users' && (
          <StaffUsersManagementSection
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

        {activeSection === 'payments' && (
          <PaymentMethodsSection
            currentUser={currentUser}
            showSaveNotice={showSaveNotice}
          />
        )}

        {activeSection === 'fiscal_matrix' && (
          <ManualFiscalMatrixTab currentUser={currentUser} />
        )}

        {activeSection === 'tickets' && (
          <TicketsManagementTab currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};
