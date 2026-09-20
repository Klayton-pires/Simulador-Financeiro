import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Building,
  Mail,
  Phone,
  Coins,
  Shield,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Save,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import { UserSafe } from '../../types';

export interface ClientRecord {
  id: string;
  name: string;
  companyName: string;
  nif: string;
  email: string;
  phone: string;
  country: string;
  category: 'comercio' | 'servicos' | 'importacao' | 'industria' | 'liberal' | 'outro';
  activePlanId: string;
  activePlanName: string;
  queriesRemaining: number;
  totalQueriesUsed: number;
  isActive: boolean;
  isImportUnlocked: boolean;
  isBatchUnlocked: boolean;
  isApiUnlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const DEFAULT_CLIENTS: ClientRecord[] = [
  {
    id: 'cli_001',
    name: 'António Gaspar Ferreira',
    companyName: 'Ferreira & Filhos Comércio Geral Lda',
    nif: '5412093847',
    email: 'comercial@ferreirafilhos.ao',
    phone: '+244 923 456 789',
    country: 'Angola',
    category: 'comercio',
    activePlanId: 'plan_pro',
    activePlanName: 'Profissional Mensal',
    queriesRemaining: 184,
    totalQueriesUsed: 116,
    isActive: true,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: false,
    createdAt: '2026-01-15T10:30:00Z',
    lastLoginAt: '2026-09-17T14:20:00Z'
  },
  {
    id: 'cli_002',
    name: 'Dra. Maria Eunice Santos',
    companyName: 'Santos & Associados Consultoria',
    nif: '5409281742',
    email: 'maria.santos@santosconsultoria.co.ao',
    phone: '+244 945 112 233',
    country: 'Angola',
    category: 'servicos',
    activePlanId: 'plan_enterprise',
    activePlanName: 'Empresarial Anual',
    queriesRemaining: 742,
    totalQueriesUsed: 258,
    isActive: true,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: true,
    createdAt: '2026-02-01T09:15:00Z',
    lastLoginAt: '2026-09-18T08:10:00Z'
  },
  {
    id: 'cli_003',
    name: 'Eng. Carlos Alberto Mendes',
    companyName: 'Mendes Import & Export Transitários',
    nif: '5418829103',
    email: 'carlos.mendes@mendesimport.ao',
    phone: '+244 912 887 766',
    country: 'Angola',
    category: 'importacao',
    activePlanId: 'plan_pro',
    activePlanName: 'Profissional Mensal',
    queriesRemaining: 45,
    totalQueriesUsed: 255,
    isActive: true,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: false,
    createdAt: '2026-03-10T11:00:00Z',
    lastLoginAt: '2026-09-16T17:45:00Z'
  },
  {
    id: 'cli_004',
    name: 'Teresa Cristina Neto',
    companyName: 'Boutique & Cosméticos Luanda',
    nif: '5420194831',
    email: 'loja@boutiqueluanda.com',
    phone: '+244 933 654 321',
    country: 'Angola',
    category: 'comercio',
    activePlanId: 'plan_starter',
    activePlanName: 'Básico Starter',
    queriesRemaining: 8,
    totalQueriesUsed: 42,
    isActive: false,
    isImportUnlocked: false,
    isBatchUnlocked: false,
    isApiUnlocked: false,
    createdAt: '2026-04-22T14:40:00Z',
    lastLoginAt: '2026-08-30T10:05:00Z'
  },
  {
    id: 'cli_005',
    name: 'João Pedro Valente',
    companyName: 'Valente Logística e Transportes',
    nif: '5401928374',
    email: 'operacoes@valentelog.pt',
    phone: '+351 912 345 678',
    country: 'Portugal',
    category: 'servicos',
    activePlanId: 'plan_pro',
    activePlanName: 'Profissional Internacional',
    queriesRemaining: 120,
    totalQueriesUsed: 80,
    isActive: true,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: false,
    createdAt: '2026-05-05T08:20:00Z',
    lastLoginAt: '2026-09-15T11:30:00Z'
  }
];

interface ClientsManagementSectionProps {
  currentUser: UserSafe;
  showSaveNotice: (msg: string) => void;
}

export const ClientsManagementSection: React.FC<ClientsManagementSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    const saved = localStorage.getItem('nanucloud_clients_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_CLIENTS;
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [creditModalClient, setCreditModalClient] = useState<ClientRecord | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(50);

  // Form State for Create / Edit
  const [formName, setFormName] = useState<string>('');
  const [formCompanyName, setFormCompanyName] = useState<string>('');
  const [formNif, setFormNif] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formCountry, setFormCountry] = useState<string>('Angola');
  const [formCategory, setFormCategory] = useState<ClientRecord['category']>('comercio');
  const [formPlan, setFormPlan] = useState<string>('plan_pro');
  const [formQueries, setFormQueries] = useState<number>(100);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formUnlockImport, setFormUnlockImport] = useState<boolean>(true);
  const [formUnlockBatch, setFormUnlockBatch] = useState<boolean>(true);
  const [formUnlockApi, setFormUnlockApi] = useState<boolean>(false);

  const persistClients = (updated: ClientRecord[]) => {
    setClients(updated);
    localStorage.setItem('nanucloud_clients_db', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nanucloud_clients_updated'));
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormCompanyName('');
    setFormNif('');
    setFormEmail('');
    setFormPhone('');
    setFormCountry('Angola');
    setFormCategory('comercio');
    setFormPlan('plan_pro');
    setFormQueries(100);
    setFormIsActive(true);
    setFormUnlockImport(true);
    setFormUnlockBatch(true);
    setFormUnlockApi(false);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (client: ClientRecord) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompanyName(client.companyName);
    setFormNif(client.nif);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormCountry(client.country);
    setFormCategory(client.category);
    setFormPlan(client.activePlanId);
    setFormQueries(client.queriesRemaining);
    setFormIsActive(client.isActive);
    setFormUnlockImport(client.isImportUnlocked);
    setFormUnlockBatch(client.isBatchUnlocked);
    setFormUnlockApi(client.isApiUnlocked);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyName.trim() || !formEmail.trim()) {
      alert('Nome da Empresa e Email são obrigatórios.');
      return;
    }

    const planNames: Record<string, string> = {
      plan_free: 'Gratuito',
      plan_starter: 'Básico Starter',
      plan_pro: 'Profissional Mensal',
      plan_enterprise: 'Empresarial Anual'
    };

    if (editingClient) {
      const updated = clients.map((c) => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            name: formName.trim() || formCompanyName.trim(),
            companyName: formCompanyName.trim(),
            nif: formNif.trim(),
            email: formEmail.trim(),
            phone: formPhone.trim(),
            country: formCountry,
            category: formCategory,
            activePlanId: formPlan,
            activePlanName: planNames[formPlan] || 'Plano Personalizado',
            queriesRemaining: Number(formQueries) || 0,
            isActive: formIsActive,
            isImportUnlocked: formUnlockImport,
            isBatchUnlocked: formUnlockBatch,
            isApiUnlocked: formUnlockApi
          };
        }
        return c;
      });
      persistClients(updated);
      setEditingClient(null);
      showSaveNotice(`Cliente "${formCompanyName}" atualizado com sucesso!`);
    } else {
      const newClient: ClientRecord = {
        id: `cli_${Date.now()}`,
        name: formName.trim() || formCompanyName.trim(),
        companyName: formCompanyName.trim(),
        nif: formNif.trim() || 'Consumidor Final',
        email: formEmail.trim(),
        phone: formPhone.trim(),
        country: formCountry,
        category: formCategory,
        activePlanId: formPlan,
        activePlanName: planNames[formPlan] || 'Plano Personalizado',
        queriesRemaining: Number(formQueries) || 100,
        totalQueriesUsed: 0,
        isActive: formIsActive,
        isImportUnlocked: formUnlockImport,
        isBatchUnlocked: formUnlockBatch,
        isApiUnlocked: formUnlockApi,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      persistClients([newClient, ...clients]);
      setIsCreateModalOpen(false);
      showSaveNotice(`Novo cliente "${newClient.companyName}" cadastrado com sucesso!`);
    }
  };

  const handleToggleBlock = (client: ClientRecord) => {
    const updated = clients.map((c) => (c.id === client.id ? { ...c, isActive: !c.isActive } : c));
    persistClients(updated);
    showSaveNotice(
      client.isActive
        ? `Cliente "${client.companyName}" suspenso temporariamente.`
        : `Cliente "${client.companyName}" reativado com sucesso!`
    );
  };

  const handleDeleteClient = (client: ClientRecord) => {
    if (window.confirm(`Tem a certeza que deseja eliminar o cliente "${client.companyName}"? Esta ação não pode ser desfeita.`)) {
      const updated = clients.filter((c) => c.id !== client.id);
      persistClients(updated);
      showSaveNotice(`Cliente "${client.companyName}" eliminado.`);
    }
  };

  const handleAddCreditsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModalClient) return;

    const amount = Number(creditsToAdd) || 0;
    if (amount === 0) return;

    const updated = clients.map((c) => {
      if (c.id === creditModalClient.id) {
        return {
          ...c,
          queriesRemaining: Math.max(0, c.queriesRemaining + amount)
        };
      }
      return c;
    });

    persistClients(updated);
    showSaveNotice(
      amount > 0
        ? `Creditadas +${amount} consultas ao cliente ${creditModalClient.companyName}.`
        : `Deduzidas ${Math.abs(amount)} consultas do cliente ${creditModalClient.companyName}.`
    );
    setCreditModalClient(null);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && c.isActive) ||
      (filterStatus === 'blocked' && !c.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalClients = clients.length;
  const activeClientsCount = clients.filter((c) => c.isActive).length;
  const totalQueriesInMarket = clients.reduce((acc, c) => acc + c.queriesRemaining, 0);

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> GESTÃO DE CLIENTES & EMPRESAS
            </h3>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono font-bold">
              Base de Contas Externas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Controlo de subscrições, saldo de consultas, dados fiscais (NIF) e acesso a módulos para clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl text-xs font-mono flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Registar Novo Cliente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Total de Clientes</span>
            <strong className="text-lg text-slate-100 font-bold">{totalClients}</strong>
          </div>
          <Building className="w-6 h-6 text-slate-500" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Clientes Ativos</span>
            <strong className="text-lg text-emerald-400 font-bold">{activeClientsCount}</strong>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Consultas Disponíveis</span>
            <strong className="text-lg text-cyan-400 font-bold">{totalQueriesInMarket.toLocaleString('pt-PT')}</strong>
          </div>
          <Coins className="w-6 h-6 text-cyan-500" />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por empresa, NIF ou email..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            <option value="comercio">Comércio Geral</option>
            <option value="servicos">Prestação de Serviços</option>
            <option value="importacao">Importação & Logística</option>
            <option value="industria">Indústria / Fabril</option>
            <option value="liberal">Profissionais Liberais</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Todos os Estados</option>
            <option value="active">Apenas Ativos</option>
            <option value="blocked">Apenas Suspensos</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <th className="p-3">Empresa / Titular</th>
              <th className="p-3">NIF / Identificação</th>
              <th className="p-3">Contactos</th>
              <th className="p-3">Plano Subscrito</th>
              <th className="p-3">Consultas</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                  Nenhum cliente encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-900/60 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{client.companyName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Resp: {client.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{client.country} • {client.category}</div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                      {client.nif}
                    </span>
                  </td>

                  <td className="p-3 text-slate-300">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {client.activePlanName}
                    </span>
                    <div className="flex gap-1 mt-1 text-[9px] text-slate-500">
                      {client.isImportUnlocked && <span className="text-emerald-400">Imp</span>}
                      {client.isBatchUnlocked && <span className="text-indigo-400">Excel</span>}
                      {client.isApiUnlocked && <span className="text-amber-400">API</span>}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-400 text-sm">{client.queriesRemaining}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCreditModalClient(client);
                          setCreditsToAdd(50);
                        }}
                        className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition cursor-pointer"
                        title="Adicionar ou Deduzir Consultas"
                      >
                        <Coins className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Usadas: {client.totalQueriesUsed}</span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        client.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {client.isActive ? 'Ativo' : 'Suspenso'}
                    </span>
                  </td>

                  <td className="p-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(client)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleBlock(client)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        client.isActive
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      }`}
                      title={client.isActive ? 'Suspender Cliente' : 'Reativar Cliente'}
                    >
                      {client.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClient(client)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create or Edit Client */}
      {(isCreateModalOpen || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <h4 className="font-bold text-slate-200 uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                {editingClient ? `Editar Cliente: ${editingClient.companyName}` : 'Registar Novo Cliente / Empresa'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingClient(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Razão Social / Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="Ex: Luanda Comércio Geral Lda"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nome do Titular / Contacto</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Eng. Manuel Silva"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">NIF da Empresa *</label>
                  <input
                    type="text"
                    value={formNif}
                    onChange={(e) => setFormNif(e.target.value)}
                    placeholder="Ex: 5412345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">E-mail Principal *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="financeiro@empresa.ao"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">País da Sede</label>
                  <select
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Angola">Angola</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Moçambique">Moçambique</option>
                    <option value="Cabo Verde">Cabo Verde</option>
                    <option value="China">China</option>
                    <option value="Internacional">Outro País</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Categoria de Atividade</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="comercio">Comércio Geral / Retalho</option>
                    <option value="servicos">Prestação de Serviços</option>
                    <option value="importacao">Importação & Despacho</option>
                    <option value="industria">Indústria e Fabrico</option>
                    <option value="liberal">Profissionais Liberais</option>
                    <option value="outro">Outro Setor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Plano Inicial</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="plan_free">Gratuito (Período de Teste)</option>
                    <option value="plan_starter">Básico Starter</option>
                    <option value="plan_pro">Profissional Mensal</option>
                    <option value="plan_enterprise">Empresarial Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Saldo de Consultas / Pesquisas</label>
                  <input
                    type="number"
                    min="0"
                    value={formQueries}
                    onChange={(e) => setFormQueries(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Module Unlocks */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-300 font-bold block text-[11px]">Desbloqueio de Módulos Especiais:</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUnlockImport}
                      onChange={(e) => setFormUnlockImport(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Importação</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUnlockBatch}
                      onChange={(e) => setFormUnlockBatch(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Lotes Excel</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUnlockApi}
                      onChange={(e) => setFormUnlockApi(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>API REST</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Conta Ativa e Desbloqueada</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingClient(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Guardar Cliente
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Credits / Queries */}
      {creditModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-cyan-400" /> Ajustar Consultas do Cliente
              </h4>
              <button
                type="button"
                onClick={() => setCreditModalClient(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Cliente: <strong className="text-slate-200">{creditModalClient.companyName}</strong></div>
              <div className="text-slate-400">Saldo Atual: <strong className="text-cyan-400">{creditModalClient.queriesRemaining} consultas</strong></div>
            </div>

            <form onSubmit={handleAddCreditsSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  Quantidade a adicionar (use valor negativo para deduzir):
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[25, 50, 100, 500].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCreditsToAdd(v)}
                      className={`p-1.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                        creditsToAdd === v
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 text-center font-bold text-base"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreditModalClient(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                >
                  Confirmar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
