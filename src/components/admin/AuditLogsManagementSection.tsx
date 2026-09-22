import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  CreditCard,
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowUpDown,
  Eye,
  X,
  CheckCircle2,
  Copy,
  PlusCircle,
  FileSpreadsheet,
  Globe,
  Database,
  Terminal,
  Activity,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserSafe, AuditLog } from '../../types';

interface AuditLogsManagementSectionProps {
  currentUser: UserSafe;
  showSaveNotice?: (msg: string) => void;
}

export const AuditLogsManagementSection: React.FC<AuditLogsManagementSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [limit, setLimit] = useState<number>(200);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Inspection modal
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual compliance entry modal
  const [isAddLogOpen, setIsAddLogOpen] = useState<boolean>(false);
  const [newActionName, setNewActionName] = useState<string>('AUDIT_COMPLIANCE_REVIEW');
  const [newEntityType, setNewEntityType] = useState<string>('security');
  const [newDetails, setNewDetails] = useState<string>('');
  const [newEntityId, setNewEntityId] = useState<string>('');
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25;

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedEntityType !== 'all') params.append('entityType', selectedEntityType);
      if (selectedRole !== 'all') params.append('role', selectedRole);
      if (selectedAction !== 'all') params.append('action', selectedAction);
      params.append('limit', limit.toString());

      if (timeRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append('startDate', today.toISOString());
      } else if (timeRange === '7d') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.append('startDate', d.toISOString());
      } else if (timeRange === '30d') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.append('startDate', d.toISOString());
      }

      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error(`Erro ${res.status}: Não foi possível carregar os registos de auditoria.`);
      }

      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Falha ao obter logs:', err);
      setError(err.message || 'Falha ao carregar trilha de auditoria.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [timeRange, limit]);

  // Handle manual compliance log submission
  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionName || !newDetails.trim()) return;

    setIsSubmittingLog(true);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/admin/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: newActionName,
          entityType: newEntityType,
          details: newDetails.trim(),
          entityId: newEntityId.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao gravar log de conformidade.');
      }

      const data = await res.json();
      if (data.log) {
        setLogs(prev => [data.log, ...prev]);
      }
      setIsAddLogOpen(false);
      setNewDetails('');
      setNewEntityId('');
      if (showSaveNotice) {
        showSaveNotice('Registo de auditoria adicionado à trilha com sucesso!');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao submeter log.');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Client-side filtering & sorting for smooth UX
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(l => 
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.userName && l.userName.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.entityId && l.entityId.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q)) ||
        (l.userRole && l.userRole.toLowerCase().includes(q))
      );
    }

    if (selectedEntityType !== 'all') {
      result = result.filter(l => l.entityType === selectedEntityType);
    }

    if (selectedRole !== 'all') {
      result = result.filter(l => l.userRole === selectedRole);
    }

    if (selectedAction !== 'all') {
      result = result.filter(l => l.action === selectedAction);
    }

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [logs, searchTerm, selectedEntityType, selectedRole, selectedAction, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogsSlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Aggregate KPI stats
  const stats = useMemo(() => {
    const total = logs.length;
    const authCount = logs.filter(l => l.entityType === 'auth').length;
    const paymentCount = logs.filter(l => l.entityType === 'payment' || l.entityType === 'plan').length;
    const securityCount = logs.filter(l => l.entityType === 'security' || l.entityType === 'system' || l.entityType === 'database').length;
    const simCount = logs.filter(l => l.entityType === 'simulator').length;

    return { total, authCount, paymentCount, securityCount, simCount };
  }, [logs]);

  // Available actions list for select filter
  const uniqueActions = useMemo(() => {
    const acts = new Set<string>();
    logs.forEach(l => {
      if (l.action) acts.add(l.action);
    });
    return Array.from(acts).sort();
  }, [logs]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredLogs.map((log, index) => ({
      '#': index + 1,
      'ID Registo': log.id,
      'Data / Hora (UTC)': log.createdAt || log.timestamp,
      'Data Formatada': new Date(log.createdAt || log.timestamp || '').toLocaleString('pt-PT'),
      'Evento / Ação': log.action || log.operationType || 'N/A',
      'Entidade': log.entityType || 'system',
      'Operador': log.userName || log.operatorName || 'Sistema',
      'Papel': log.userRole || 'N/A',
      'ID Operador': log.userId || '',
      'Endereço IP': log.ipAddress || 'Interno',
      'ID Entidade Afetada': log.entityId || '',
      'Detalhes da Operação': log.details || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trilha de Auditoria');

    const fileName = `nanucloud_audit_logs_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    if (showSaveNotice) {
      showSaveNotice(`Trilha de auditoria exportada (${filteredLogs.length} registos) para Excel.`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Acao', 'TipoEntidade', 'Operador', 'Papel', 'IP', 'Detalhes'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${new Date(l.createdAt || l.timestamp || '').toLocaleString('pt-PT')}"`,
      `"${l.action || l.operationType || ''}"`,
      `"${l.entityType || 'system'}"`,
      `"${l.userName || l.operatorName || 'Sistema'}"`,
      `"${l.userRole || ''}"`,
      `"${l.ipAddress || 'Interno'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nanucloud_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEntityBadge = (type?: string) => {
    switch (type) {
      case 'auth':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Auth
          </span>
        );
      case 'payment':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Pagamento
          </span>
        );
      case 'plan':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Plano
          </span>
        );
      case 'simulator':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Simulador
          </span>
        );
      case 'security':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            Segurança
          </span>
        );
      case 'database':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Postgres/Neon
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {type || 'Sistema'}
          </span>
        );
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="text-[10px] text-rose-400 font-mono font-bold">SUPER ADMIN</span>;
      case 'admin_level1':
      case 'admin':
        return <span className="text-[10px] text-cyan-400 font-mono font-bold">ADMIN N1</span>;
      case 'admin_level2':
      case 'manager':
        return <span className="text-[10px] text-amber-400 font-mono font-bold">GESTOR N2</span>;
      case 'client':
        return <span className="text-[10px] text-slate-400 font-mono">CLIENTE</span>;
      default:
        return <span className="text-[10px] text-slate-500 font-mono">{role || 'SISTEMA'}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header Banner & Compliance Scope */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Trilha de Auditoria & Conformidade Fiscal
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Conforme AGT & RGPD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Registo cronológico imutável de todas as ações operacionais, alterações de taxas fiscais, aprovações financeiras, sessões de utilizadores e acessos aos simuladores.
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Atualizar trilha de auditoria em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/40 text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Descarregar relatório de auditoria em Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Exportar para formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddLogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/20"
            title="Inserir nota manual ou relatório de revisão de conformidade"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white" />
            <span>Registar Ação Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Total de Registos</div>
            <div className="text-2xl font-mono font-bold text-white tabular-nums mt-1">
              {stats.total.toLocaleString('pt-PT')}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Trilha ativa no Neon Postgres</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Acessos & Sessões</div>
            <div className="text-2xl font-mono font-bold text-indigo-400 tabular-nums mt-1">
              {stats.authCount.toLocaleString('pt-PT')}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Logins e tokens emitidos</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Operações Financeiras</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-1">
              {stats.paymentCount.toLocaleString('pt-PT')}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Pagamentos & Planos validados</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Segurança & Sistema</div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums mt-1">
              {stats.securityCount.toLocaleString('pt-PT')}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Matriz, Backups e Integridade</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar por utilizador, ação (ex: PAYMENT_APPROVED), texto nos detalhes, IP ou ID..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
            {(['today', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {range === 'today' ? 'Hoje' : range === '7d' ? '7 Dias' : range === '30d' ? '30 Dias' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row of Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Entity Type Filter */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Módulo / Entidade</label>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Todas as Entidades</option>
              <option value="auth">Autenticação (Auth)</option>
              <option value="payment">Pagamentos (Payment)</option>
              <option value="plan">Planos & Saldos</option>
              <option value="simulator">Simuladores</option>
              <option value="security">Segurança & Hashes</option>
              <option value="system">Sistema & Taxas</option>
              <option value="database">Base de Dados Neon</option>
              <option value="user">Utilizadores</option>
              <option value="support">Suporte & Tickets</option>
            </select>
          </div>

          {/* User Role Filter */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Papel do Operador</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Todos os Papéis</option>
              <option value="super_admin">Super Administrador</option>
              <option value="admin_level1">Administrador Nível 1</option>
              <option value="admin_level2">Gestor Nível 2</option>
              <option value="client">Cliente</option>
            </select>
          </div>

          {/* Action Code Filter */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Tipo de Ação</label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500 cursor-pointer truncate"
            >
              <option value="all">Todas as Ações ({uniqueActions.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Ordenação</label>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 hover:border-slate-600 transition cursor-pointer"
            >
              <span>{sortOrder === 'desc' ? 'Mais Recentes ⬇' : 'Mais Antigos ⬆'}</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Result Count and Clear Filters */}
          <div className="flex items-end justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedEntityType('all');
                setSelectedRole('all');
                setSelectedAction('all');
                setTimeRange('all');
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition border border-slate-700 cursor-pointer text-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table Header & Status */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <div>
          Mostrando <span className="text-white font-bold tabular-nums">{filteredLogs.length}</span> registos correspondentes
          {filteredLogs.length !== logs.length && (
            <span className="text-slate-500 ml-1">de {logs.length} totais</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Página <strong className="text-slate-200">{currentPage}</strong> de {totalPages}</span>
        </div>
      </div>

      {/* Main High-Density Audit Trail Table */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-slate-400">A consultar trilha de auditoria no Neon PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-rose-300 mb-1">{error}</p>
            <button
              type="button"
              onClick={fetchLogs}
              className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono"
            >
              Tentar Novamente
            </button>
          </div>
        ) : currentLogsSlice.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">Nenhum registo de auditoria encontrado</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhuma ação registada corresponde aos filtros aplicados. Tente ajustar os termos de pesquisa ou selecionar um período mais alargado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-44">Data / Hora</th>
                  <th className="py-3 px-4 w-48">Ação / Evento</th>
                  <th className="py-3 px-4 w-52">Operador & Papel</th>
                  <th className="py-3 px-3 w-28">Entidade</th>
                  <th className="py-3 px-3 w-32">Endereço IP</th>
                  <th className="py-3 px-4 min-w-[280px]">Detalhes & Impacto</th>
                  <th className="py-3 px-3 text-right w-20">Inspecionar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {currentLogsSlice.map((log) => {
                  const dateObj = new Date(log.createdAt || log.timestamp || '');
                  const isValidDate = !isNaN(dateObj.getTime());
                  const formattedDate = isValidDate ? dateObj.toLocaleDateString('pt-PT') : 'N/A';
                  const formattedTime = isValidDate ? dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setInspectingLog(log)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-200 font-bold tabular-nums text-xs">
                          {formattedDate}
                        </div>
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          {formattedTime}
                        </div>
                      </td>

                      {/* Action Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition text-[11px] break-all">
                          {log.action || log.operationType || 'OPERACAO'}
                        </div>
                        {log.entityId && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px]" title={log.entityId}>
                            Ref: {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Operator & Role */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200 text-xs truncate max-w-[190px]">
                          {log.userName || log.operatorName || 'Sistema'}
                        </div>
                        <div className="mt-0.5">
                          {getRoleBadge(log.userRole)}
                        </div>
                      </td>

                      {/* Entity Type Badge */}
                      <td className="py-3 px-3">
                        {getEntityBadge(log.entityType)}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {log.ipAddress || 'Interno'}
                        </span>
                      </td>

                      {/* Details Text */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                          {log.details || 'Sem detalhes adicionais.'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600/30 text-slate-400 group-hover:text-indigo-200 transition cursor-pointer"
                          title="Inspecionar metadados completos do log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition"
            >
              Anterior
            </button>
            <div className="text-slate-400">
              Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition"
            >
              Seguinte
            </button>
          </div>
        )}
      </div>

      {/* Modal: Inspecionar Registo de Auditoria */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl font-mono overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">Registo de Auditoria #{inspectingLog.id}</h3>
                  <p className="text-[10px] text-slate-400">Metadados imutáveis da trilha de conformidade</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Código da Ação</span>
                  <span className="font-bold text-indigo-300 text-sm">{inspectingLog.action || inspectingLog.operationType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tipo de Módulo</span>
                  <div className="mt-0.5">{getEntityBadge(inspectingLog.entityType)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Timestamp Oficial</span>
                  <span className="text-slate-200 tabular-nums">
                    {new Date(inspectingLog.createdAt || inspectingLog.timestamp || '').toLocaleString('pt-PT')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Endereço IP Origem</span>
                  <span className="text-slate-200 tabular-nums font-mono">{inspectingLog.ipAddress || 'Interno / Cluster'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Operador Responsável</span>
                  <span className="text-slate-200 font-bold">{inspectingLog.userName || inspectingLog.operatorName || 'Sistema'}</span>
                  <span className="text-[10px] text-slate-400 block">{inspectingLog.userId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Papel do Operador</span>
                  <div className="mt-0.5">{getRoleBadge(inspectingLog.userRole)}</div>
                </div>
              </div>

              {inspectingLog.entityId && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">ID da Entidade Afetada</label>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center justify-between">
                    <span className="font-mono text-xs">{inspectingLog.entityId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inspectingLog.entityId!, 'entityId')}
                      className="text-slate-400 hover:text-white"
                      title="Copiar ID"
                    >
                      {copiedId === 'entityId' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Descrição / Detalhes do Evento</label>
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 leading-relaxed font-sans text-xs">
                  {inspectingLog.details}
                </div>
              </div>

              {/* Raw JSON Inspector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Payload JSON Estruturado</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(inspectingLog, null, 2), 'rawJson')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedId === 'rawJson' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 overflow-x-auto max-h-48 font-mono">
                  {JSON.stringify(inspectingLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registar Ação Manual de Auditoria */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl font-mono overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase">Registar Evento Manual de Auditoria</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLogOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Código da Ação / Procedimento
                </label>
                <select
                  value={newActionName}
                  onChange={(e) => setNewActionName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="AUDIT_COMPLIANCE_REVIEW">AUDIT_COMPLIANCE_REVIEW (Revisão Periódica AGT)</option>
                  <option value="FISCAL_MATRIX_VERIFIED">FISCAL_MATRIX_VERIFIED (Conferência de Pautas e Taxas)</option>
                  <option value="BACKUP_INTEGRITY_CHECK">BACKUP_INTEGRITY_CHECK (Verificação de Integridade SQL)</option>
                  <option value="SECURITY_POLICY_UPDATE">SECURITY_POLICY_UPDATE (Atualização de Políticas de Acesso)</option>
                  <option value="MANUAL_CLIENT_RECONCILIATION">MANUAL_CLIENT_RECONCILIATION (Reconciliação de Saldos)</option>
                  <option value="CUSTOM_AUDIT_NOTE">CUSTOM_AUDIT_NOTE (Outra Nota de Auditoria)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Tipo de Módulo
                  </label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="security">Segurança</option>
                    <option value="system">Sistema Fiscal</option>
                    <option value="payment">Finanças & Faturação</option>
                    <option value="database">Base de Dados Neon</option>
                    <option value="user">Utilizadores</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    ID Entidade (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newEntityId}
                    onChange={(e) => setNewEntityId(e.target.value)}
                    placeholder="Ex: usr_123 ou tx_001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Justificação & Detalhes da Ação *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Descreva o procedimento executado, conformidade com a legislação tributária ou despacho emitido..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 font-sans text-xs focus:border-indigo-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-300">
                Operador autenticado: <strong>{currentUser.name}</strong> ({currentUser.role}). Este registo será assinado com o seu IP e persistido imutavelmente no Neon PostgreSQL.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLogOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog || !newDetails.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isSubmittingLog ? 'A Registar...' : 'Gravar na Trilha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
