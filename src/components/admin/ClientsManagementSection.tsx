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

function mapUserToClientRecord(u: any): ClientRecord {
  return {
    id: u.id,
    name: u.name,
    companyName: u.company || u.name,
    nif: u.nif || 'Consumidor Final',
    email: u.email,
    phone: u.phone || '',
    country: u.country || 'Angola',
    category: u.clientCategory || 'comercio',
    activePlanId: u.activePlanId || 'plan_starter',
    activePlanName: u.activePlanName || 'Plano Comercial',
    queriesRemaining: typeof u.queriesRemaining === 'number' ? u.queriesRemaining : 0,
    totalQueriesUsed: typeof u.totalQueriesUsed === 'number' ? u.totalQueriesUsed : 0,
    isActive: u.isActive !== false,
    isImportUnlocked: !!u.isImportUnlocked,
    isBatchUnlocked: !!u.isBatchUnlocked,
    isApiUnlocked: !!u.isApiUnlocked,
    createdAt: u.createdAt || new Date().toISOString(),
    lastLoginAt: u.lastLoginAt || null
  };
}

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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('connected');
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

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('nanucloud_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const loadClientsFromDb = async (showToast = false) => {
    setIsLoading(true);
    setDbStatus('syncing');
    try {
      const res = await fetch('/api/admin/users?role=client', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          const mapped = data.users.map(mapUserToClientRecord);
          setClients(mapped);
          localStorage.setItem('nanucloud_clients_db', JSON.stringify(mapped));
          setDbStatus('connected');
          if (showToast) {
            showSaveNotice(`Base de dados sincronizada: ${mapped.length} clientes carregados do Neon.`);
          }
        }
      } else {
        setDbStatus('error');
      }
    } catch (err) {
      console.error('Falha ao comunicar com o banco de dados:', err);
      setDbStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientsFromDb();
  }, []);

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

  const handleSaveClient = async (e: React.FormEvent) => {
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

    setIsSaving(true);

    try {
      if (editingClient) {
        // Atualizar no banco de dados Neon
        const payload = {
          name: formName.trim() || formCompanyName.trim(),
          companyName: formCompanyName.trim(),
          company: formCompanyName.trim(),
          nif: formNif.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          country: formCountry,
          clientCategory: formCategory,
          category: formCategory,
          activePlanId: formPlan,
          activePlanName: planNames[formPlan] || 'Plano Personalizado',
          queriesRemaining: Number(formQueries) || 0,
          isActive: formIsActive,
          isImportUnlocked: formUnlockImport,
          isBatchUnlocked: formUnlockBatch,
          isApiUnlocked: formUnlockApi
        };

        const res = await fetch(`/api/admin/users/${editingClient.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao atualizar cliente no banco de dados.');
        }

        const data = await res.json();
        const updatedRecord = data.user ? mapUserToClientRecord(data.user) : {
          ...editingClient,
          ...payload
        };

        const updatedList = clients.map(c => c.id === editingClient.id ? updatedRecord : c);
        setClients(updatedList);
        localStorage.setItem('nanucloud_clients_db', JSON.stringify(updatedList));
        setEditingClient(null);
        showSaveNotice(`Cliente "${formCompanyName}" sincronizado no Neon PostgreSQL com sucesso!`);
      } else {
        // Criar novo cliente no banco de dados Neon
        const payload = {
          name: formName.trim() || formCompanyName.trim(),
          companyName: formCompanyName.trim(),
          company: formCompanyName.trim(),
          nif: formNif.trim() || 'Consumidor Final',
          email: formEmail.trim(),
          phone: formPhone.trim() || '+244 923 000 000',
          country: formCountry,
          role: 'client',
          clientCategory: formCategory,
          category: formCategory,
          activePlanId: formPlan,
          activePlanName: planNames[formPlan] || 'Plano Personalizado',
          queriesRemaining: Number(formQueries) || 100,
          isActive: formIsActive,
          isImportUnlocked: formUnlockImport,
          isBatchUnlocked: formUnlockBatch,
          isApiUnlocked: formUnlockApi
        };

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao criar cliente no banco de dados.');
        }

        const data = await res.json();
        const newRecord = data.user ? mapUserToClientRecord(data.user) : {
          ...payload,
          id: `cli_${Date.now()}`,
          totalQueriesUsed: 0,
          createdAt: new Date().toISOString(),
          lastLoginAt: null
        };

        const updatedList = [newRecord, ...clients];
        setClients(updatedList);
        localStorage.setItem('nanucloud_clients_db', JSON.stringify(updatedList));
        setIsCreateModalOpen(false);
        showSaveNotice(`Novo cliente "${formCompanyName}" gravado no Neon PostgreSQL com sucesso!`);
      }
    } catch (err: any) {
      alert(`Falha na operação: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBlock = async (client: ClientRecord) => {
    try {
      const nextStatus = !client.isActive;
      const res = await fetch(`/api/admin/users/${client.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: nextStatus })
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar estado no banco de dados.');
      }

      const updatedList = clients.map((c) => (c.id === client.id ? { ...c, isActive: nextStatus } : c));
      setClients(updatedList);
      localStorage.setItem('nanucloud_clients_db', JSON.stringify(updatedList));
      showSaveNotice(
        nextStatus
          ? `Cliente "${client.companyName}" reativado na base de dados Neon!`
          : `Cliente "${client.companyName}" suspenso no sistema.`
      );
    } catch (err: any) {
      alert(`Erro ao alterar estado do cliente: ${err.message}`);
    }
  };

  const handleDeleteClient = async (client: ClientRecord) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar permanentemente o cliente "${client.companyName}" do banco de dados Neon? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${client.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao eliminar do banco de dados.');
      }

      const updatedList = clients.filter((c) => c.id !== client.id);
      setClients(updatedList);
      localStorage.setItem('nanucloud_clients_db', JSON.stringify(updatedList));
      showSaveNotice(`Cliente "${client.companyName}" eliminado permanentemente da base de dados.`);
    } catch (err: any) {
      alert(`Erro ao eliminar cliente: ${err.message}`);
    }
  };

  const handleAddCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModalClient) return;

    const amount = Number(creditsToAdd) || 0;
    if (amount === 0) return;

    try {
      const res = await fetch(`/api/admin/users/${creditModalClient.id}/credits`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          reason: `Adição manual de ${amount} créditos pela Gestão de Clientes`
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao creditar consultas no banco de dados.');
      }

      const data = await res.json();
      const newBalance = data.user ? data.user.queriesRemaining : Math.max(0, creditModalClient.queriesRemaining + amount);

      const updatedList = clients.map((c) => {
        if (c.id === creditModalClient.id) {
          return {
            ...c,
            queriesRemaining: newBalance
          };
        }
        return c;
      });

      setClients(updatedList);
      localStorage.setItem('nanucloud_clients_db', JSON.stringify(updatedList));
      showSaveNotice(
        amount > 0
          ? `+${amount} consultas creditadas e gravadas no Neon para ${creditModalClient.companyName}.`
          : `${amount} consultas deduzidas no Neon para ${creditModalClient.companyName}.`
      );
      setCreditModalClient(null);
    } catch (err: any) {
      alert(`Erro ao atualizar consultas: ${err.message}`);
    }
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> GESTÃO DE CLIENTES & EMPRESAS
            </h3>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono font-bold">
              Base de Contas Externas
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 ${
              dbStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : dbStatus === 'syncing'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : dbStatus === 'syncing' ? 'bg-amber-400' : 'bg-rose-400'
              }`} />
              Neon PostgreSQL {dbStatus === 'syncing' ? 'Sincronizando...' : dbStatus === 'connected' ? 'Ativo' : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Controlo de subscrições, saldo de consultas, dados fiscais (NIF) e acesso a módulos em sincronização direta com o Neon PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadClientsFromDb(true)}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 px-3 rounded-xl text-xs font-mono flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Recarregar dados diretamente do Neon PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Recarregar Banco</span>
          </button>
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
