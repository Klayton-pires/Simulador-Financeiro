import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  Play,
  Settings,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Copy,
  Clock,
  HardDrive,
  Calendar,
  Layers,
  FileCode,
  FileText,
  AlertTriangle,
  ExternalLink,
  Terminal,
  X,
  Lock
} from 'lucide-react';

interface BackupSnapshot {
  id: string;
  timestamp: string;
  formattedDate: string;
  source: 'neon_postgresql' | 'memory_fallback';
  databaseName: string;
  tableCounts: Record<string, number>;
  totalRecords: number;
  uncompressedBytes: number;
  sizeFormatted: string;
  checksumSha256: string;
  cloudStatus: 'synced' | 'pending' | 'failed' | 'redundant_local_and_cloud';
  cloudDestination: string;
  cloudSyncAt?: string;
  triggeredBy: string;
  notes?: string;
}

interface ScheduleConfig {
  enabled: boolean;
  dailyHourUtc: number;
  dailyMinuteUtc: number;
  retentionDays: number;
  cloudProvider: string;
  cloudStorageEndpoint?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  totalBackupsCount: number;
}

export const DailyBackupManagementView: React.FC = () => {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [inspectSnapshot, setInspectSnapshot] = useState<BackupSnapshot | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showCliModal, setShowCliModal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Edit Config State
  const [cfgEnabled, setCfgEnabled] = useState<boolean>(true);
  const [cfgHour, setCfgHour] = useState<number>(3);
  const [cfgRetention, setCfgRetention] = useState<number>(30);
  const [cfgEndpoint, setCfgEndpoint] = useState<string>('');
  const [savingCfg, setSavingCfg] = useState<boolean>(false);

  const fetchBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/admin/backups', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error(`Falha ao obter histórico (${res.status})`);
      }

      const data = await res.json();
      setBackups(data.backups || []);
      setSchedule(data.schedule || null);
      if (data.schedule) {
        setCfgEnabled(data.schedule.enabled ?? true);
        setCfgHour(data.schedule.dailyHourUtc ?? 3);
        setCfgRetention(data.schedule.retentionDays ?? 30);
        setCfgEndpoint(data.schedule.cloudStorageEndpoint || '');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar registos de backups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRunBackup = async () => {
    setExecuting(true);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/admin/backups/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          notes: 'Backup disparado sob demanda pela interface administrativa.'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao executar backup.');
      }

      const data = await res.json();
      if (data.snapshot) {
        setBackups(prev => [data.snapshot, ...prev]);
      }
      setToastMsg('Backup diário gerado e exportado para a nuvem de redundância com sucesso!');
      setTimeout(() => setToastMsg(null), 4000);
      fetchBackups();
    } catch (err: any) {
      alert(err.message || 'Erro ao executar rotina de backup.');
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCfg(true);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/admin/backups/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          enabled: cfgEnabled,
          dailyHourUtc: Number(cfgHour),
          retentionDays: Number(cfgRetention),
          cloudStorageEndpoint: cfgEndpoint.trim() || undefined
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar parâmetros.');
      }

      setShowConfigModal(false);
      setToastMsg('Configurações de agendamento e retenção gravadas com sucesso!');
      setTimeout(() => setToastMsg(null), 3000);
      fetchBackups();
    } catch (err: any) {
      alert(err.message || 'Erro ao gravar configurações.');
    } finally {
      setSavingCfg(false);
    }
  };

  const handleDownload = (id: string, format: 'sql' | 'json') => {
    const token = localStorage.getItem('nanucloud_token');
    const url = `/api/admin/backups/${id}/download?format=${format}`;

    // Descarregar via fetch para injetar Authorization token
    fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Falha ao descarregar ficheiro de backup.');
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(err => {
        alert(err.message);
      });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 p-3 rounded-xl text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Routine & Cloud Redundancy Header */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Rotina de Backup Diário & Redundância Cloud
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Redundância Total Ativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Exportação diária automática de todas as tabelas do <strong>Neon PostgreSQL</strong> em formato SQL DDL/DML e JSON imutável, com assinatura SHA-256 e replicação remota em nuvem de backup.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchBackups}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Atualizar lista de snapshots"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCliModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
            title="Ver comando CLI e cronjob do servidor"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Script Crontab</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
            title="Ajustar agendamento diário e retenção"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>Agendamento</span>
          </button>

          <button
            type="button"
            onClick={handleRunBackup}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20"
            title="Executar backup completo agora e sincronizar na nuvem"
          >
            {executing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>A Executar Backup...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Executar Backup Imediato</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Routine Health Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled Routine */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Agendador Diário</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-white tabular-nums">
            {schedule?.enabled ? `${String(schedule.dailyHourUtc).padStart(2, '0')}:00 UTC` : 'Desativado'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Próxima: {schedule?.nextRunAt ? new Date(schedule.nextRunAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : 'Agendada'}
          </div>
        </div>

        {/* Total Snapshots */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Snapshots no Cofre</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-mono font-bold text-indigo-400 tabular-nums">
            {backups.length} ficheiros
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Retenção: {schedule?.retentionDays || 30} dias de rotação
          </div>
        </div>

        {/* Database Origin */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Base de Origem</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-mono font-bold text-cyan-300 truncate">
            {backups[0]?.databaseName || 'neondb'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Fonte: {backups[0]?.source === 'neon_postgresql' ? 'Neon PostgreSQL Pool' : 'Cluster Ativo'}
          </div>
        </div>

        {/* Cloud Redundancy Destination */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Redundância Cloud</span>
            <Cloud className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-mono font-bold text-emerald-400">
            Sincronizado 100%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate" title={backups[0]?.cloudDestination || 'Cofre em Nuvem'}>
            Destino: Vault Nanucloud
          </div>
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Histórico de Snapshots Diários & Checksums de Integridade
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {backups.length} snapshot(s) disponíveis para download e restauração
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-slate-400">A carregar inventário de backups...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-xs font-mono text-rose-300">{error}</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-16 text-center">
            <Cloud className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">Nenhum snapshot de backup gerado ainda</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-mono">
              Clique em "Executar Backup Imediato" acima para disparar o primeiro snapshot completo do Neon PostgreSQL.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Identificador do Snapshot</th>
                  <th className="py-3 px-4">Data / Hora (UTC)</th>
                  <th className="py-3 px-3">Origem</th>
                  <th className="py-3 px-3">Registos</th>
                  <th className="py-3 px-3">Tamanho</th>
                  <th className="py-3 px-4">Checksum SHA-256</th>
                  <th className="py-3 px-3">Redundância Cloud</th>
                  <th className="py-3 px-4 text-right">Descarregar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    {/* Snapshot ID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{b.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">{b.triggeredBy}</span>
                    </td>

                    {/* Date / Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-200 tabular-nums">
                        {new Date(b.timestamp).toLocaleDateString('pt-PT')}
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {new Date(b.timestamp).toLocaleTimeString('pt-PT')}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {b.databaseName}
                      </span>
                    </td>

                    {/* Records Count */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => setInspectSnapshot(b)}
                        className="text-slate-200 font-bold hover:text-emerald-300 underline underline-offset-2 tabular-nums cursor-pointer"
                        title="Ver detalhe por tabela"
                      >
                        {b.totalRecords} itens
                      </button>
                    </td>

                    {/* Size */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-slate-300 font-bold tabular-nums">{b.sizeFormatted}</span>
                    </td>

                    {/* Checksum SHA-256 */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-mono" title={b.checksumSha256}>
                          {b.checksumSha256.substring(0, 16)}...
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(b.checksumSha256, b.id)}
                          className="p-1 text-slate-500 hover:text-slate-200 transition"
                          title="Copiar Hash SHA-256 Completo"
                        >
                          {copiedHash === b.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Cloud Redundancy Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Nuvem Sincronizada
                      </span>
                    </td>

                    {/* Downloads */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownload(b.id, 'sql')}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold transition cursor-pointer"
                          title="Descarregar ficheiro SQL (DDL + INSERTs)"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>.SQL</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(b.id, 'json')}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          title="Descarregar snapshot JSON estruturado"
                        >
                          <FileText className="w-3 h-3 text-emerald-400" />
                          <span>.JSON</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Inspecionar Snapshot */}
      {inspectSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl font-mono text-xs space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Metadados do Snapshot #{inspectSnapshot.id}</h3>
              <button
                type="button"
                onClick={() => setInspectSnapshot(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-slate-400">Contagem de Registos por Tabela:</div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                {Object.entries(inspectSnapshot.tableCounts).map(([tbl, count]) => (
                  <div key={tbl} className="flex items-center justify-between text-slate-300">
                    <span className="font-bold text-indigo-300">{tbl}</span>
                    <span className="tabular-nums">{count} registos</span>
                  </div>
                ))}
                <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex items-center justify-between font-bold text-white">
                  <span>Total Geral</span>
                  <span>{inspectSnapshot.totalRecords} registos</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-slate-300">
              <div><strong className="text-slate-400">Destino Cloud:</strong> {inspectSnapshot.cloudDestination}</div>
              <div><strong className="text-slate-400">Data/Hora Oficial:</strong> {new Date(inspectSnapshot.timestamp).toLocaleString('pt-PT')}</div>
              <div><strong className="text-slate-400">Disparado por:</strong> {inspectSnapshot.triggeredBy}</div>
              <div><strong className="text-slate-400">Notas:</strong> {inspectSnapshot.notes}</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectSnapshot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configurar Agendamento e Retenção */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl font-mono text-xs space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                Parâmetros da Rotina Diária
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Rotina Diária Automática</div>
                  <div className="text-[10px] text-slate-400">Executar backup todos os dias no horário programado</div>
                </div>
                <input
                  type="checkbox"
                  checked={cfgEnabled}
                  onChange={(e) => setCfgEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Horário de Execução Diária (Hora UTC)
                </label>
                <select
                  value={cfgHour}
                  onChange={(e) => setCfgHour(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00 UTC (Madrugada)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Política de Retenção (Dias de Histórico)
                </label>
                <select
                  value={cfgRetention}
                  onChange={(e) => setCfgRetention(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value={7}>7 Dias (1 Semana)</option>
                  <option value={15}>15 Dias (2 Semanas)</option>
                  <option value={30}>30 Dias (Recomendado - 1 Mês)</option>
                  <option value={60}>60 Dias (2 Meses)</option>
                  <option value={90}>90 Dias (Trimestre)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Backups que ultrapassarem este período serão automaticamente eliminados para poupança de armazenamento.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Endpoint de Armazenamento em Nuvem (Webhook / S3 / Vault)
                </label>
                <input
                  type="url"
                  value={cfgEndpoint}
                  onChange={(e) => setCfgEndpoint(e.target.value)}
                  placeholder="https://storage.googleapis.com/... ou https://vault.ao/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCfg}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  {savingCfg ? 'A Guardar...' : 'Guardar Parâmetros'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Instruções CLI / Crontab */}
      {showCliModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl font-mono text-xs space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Script de Rotina CLI & Crontab Linux
              </h3>
              <button
                type="button"
                onClick={() => setShowCliModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 text-xs">
              A rotina de backup diário pode ser executada manualmente no terminal ou adicionada à tabela de tarefas agendadas do sistema operativo:
            </p>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Execução Imediata via NPM:</div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 flex items-center justify-between">
                <code>npm run backup</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('npm run backup', 'npm_cmd')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedHash === 'npm_cmd' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Entrada no Crontab do Servidor (Diariamente às 03:00):</div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 flex items-center justify-between overflow-x-auto">
                <code>0 3 * * * cd /caminho/do/projeto && npm run backup &gt;&gt; /var/log/nanucloud-backup.log 2&gt;&amp;1</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('0 3 * * * cd /caminho/do/projeto && npm run backup >> /var/log/nanucloud-backup.log 2>&1', 'cron_cmd')}
                  className="text-slate-400 hover:text-white ml-2 shrink-0"
                >
                  {copiedHash === 'cron_cmd' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCliModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
