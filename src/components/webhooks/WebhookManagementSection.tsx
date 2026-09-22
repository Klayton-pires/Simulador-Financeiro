import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Plus,
  Play,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Trash2,
  Edit2,
  RefreshCw,
  Send,
  Code,
  CheckCircle,
  XCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Server,
  Zap,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserSafe } from '../../types';

export interface WebhookItem {
  id: string;
  userId: string;
  name: string;
  url: string;
  secret: string;
  isActive: boolean;
  events: string[];
  customHeaders?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  lastStatus?: number;
  totalDeliveries?: number;
  successfulDeliveries?: number;
}

export interface DeliveryLogItem {
  id: string;
  webhookId: string;
  webhookName: string;
  url: string;
  event: string;
  status: 'success' | 'failed';
  httpStatusCode: number;
  durationMs: number;
  payload: any;
  responseBody?: string;
  errorMessage?: string;
  timestamp: string;
}

interface WebhookManagementSectionProps {
  user: UserSafe | null;
}

export const WebhookManagementSection: React.FC<WebhookManagementSectionProps> = ({ user }) => {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [logs, setLogs] = useState<DeliveryLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubView, setActiveSubView] = useState<'endpoints' | 'logs' | 'docs'>('endpoints');

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    isActive: true,
    events: ['simulation.completed'],
    customHeaders: ''
  });
  const [saving, setSaving] = useState<boolean>(false);

  // Test state
  const [testModalWebhook, setTestModalWebhook] = useState<WebhookItem | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<DeliveryLogItem | null>(null);

  // Clipboard tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});

  // Code sample language
  const [codeLang, setCodeLang] = useState<'nodejs' | 'php' | 'python' | 'csharp'>('nodejs');

  const fetchWebhooksAndLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const [whRes, logsRes] = await Promise.all([
        fetch(`/api/simulator/webhooks?userId=${user?.id || 'default_system'}`, { headers }),
        fetch('/api/simulator/webhooks/logs', { headers })
      ]);

      if (whRes.ok) {
        const whData = await whRes.json();
        setWebhooks(whData.webhooks || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao carregar webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooksAndLogs();
  }, [user?.id]);

  const handleOpenCreateModal = () => {
    setEditingWebhook(null);
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setFormData({
      name: '',
      url: '',
      secret: newSecret,
      isActive: true,
      events: ['simulation.completed'],
      customHeaders: ''
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (wh: WebhookItem) => {
    setEditingWebhook(wh);
    setFormData({
      name: wh.name,
      url: wh.url,
      secret: wh.secret,
      isActive: wh.isActive,
      events: wh.events || ['simulation.completed'],
      customHeaders: wh.customHeaders ? JSON.stringify(wh.customHeaders, null, 2) : ''
    });
    setShowFormModal(true);
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim().startsWith('http')) {
      alert('Por favor insira um URL válido iniciado por https:// ou http://');
      return;
    }
    if (!formData.name.trim()) {
      alert('Por favor insira um nome identificador.');
      return;
    }

    let parsedHeaders = {};
    if (formData.customHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(formData.customHeaders);
      } catch (err) {
        alert('Os cabeçalhos personalizados devem estar em formato JSON válido.');
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/simulator/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: editingWebhook ? editingWebhook.id : undefined,
          userId: user?.id || 'default_system',
          name: formData.name.trim(),
          url: formData.url.trim(),
          secret: formData.secret.trim(),
          isActive: formData.isActive,
          events: formData.events,
          customHeaders: parsedHeaders
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao guardar webhook.');
      }

      setShowFormModal(false);
      fetchWebhooksAndLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao guardar webhook.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Tem a certeza que deseja remover este endpoint de webhook? Notificações automáticas deixarão de ser enviadas para este endereço.')) {
      return;
    }

    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch(`/api/simulator/webhooks/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      alert('Erro ao eliminar webhook.');
    }
  };

  const handleToggleActive = async (wh: WebhookItem) => {
    try {
      const token = localStorage.getItem('nanucloud_token');
      await fetch('/api/simulator/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...wh,
          isActive: !wh.isActive
        })
      });

      setWebhooks(prev => prev.map(item => item.id === wh.id ? { ...item, isActive: !item.isActive } : item));
    } catch (err) {
      console.warn('Erro ao alternar status do webhook:', err);
    }
  };

  const handleTriggerTestPing = async (wh: WebhookItem) => {
    setTestModalWebhook(wh);
    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/simulator/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          url: wh.url,
          secret: wh.secret,
          name: wh.name,
          events: wh.events,
          customHeaders: wh.customHeaders
        })
      });

      const data = await res.json();
      if (data.log) {
        setTestResult(data.log);
        setLogs(prev => [data.log, ...prev]);
        // Atualizar lista de webhooks
        setWebhooks(prev => prev.map(item => item.id === wh.id ? {
          ...item,
          lastTriggeredAt: data.log.timestamp,
          lastStatus: data.log.httpStatusCode,
          totalDeliveries: (item.totalDeliveries || 0) + 1,
          successfulDeliveries: (item.successfulDeliveries || 0) + (data.log.status === 'success' ? 1 : 0)
        } : item));
      }
    } catch (err: any) {
      alert('Erro ao enviar teste: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowSecret = (id: string) => {
    setShowSecretMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Webhooks de Simulação em Tempo Real
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                Disparo Automático Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
              Notifique automaticamente o seu ERP (<strong>XD Software, Primavera, PHC, SAP, Sage</strong>), e-commerce ou servidor próprio sempre que qualquer cálculo fiscal de margem e PVP for finalizado no NANUCLOUD.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchWebhooksAndLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Atualizar lista e logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Endpoint</span>
          </button>
        </div>
      </div>

      {/* Internal Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubView('endpoints')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            activeSubView === 'endpoints'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Endpoints Configurados ({webhooks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('logs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            activeSubView === 'logs'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Histórico de Disparos ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('docs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            activeSubView === 'docs'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Manual de Assinatura HMAC & Código</span>
        </button>
      </div>

      {/* VIEW 1: ENDPOINTS LIST */}
      {activeSubView === 'endpoints' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center bg-[#1E293B] border border-slate-800 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono text-slate-400">A carregar endpoints de webhook...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="py-16 text-center bg-[#1E293B] border border-slate-800 rounded-2xl p-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-4">
                <Webhook className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">
                Nenhum webhook cadastrado ainda
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                Configure a URL de destino da sua aplicação para receber o payload completo de margem, PVP, IVA e retenções assim que a simulação for concluída.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Configurar Primeiro Webhook</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {webhooks.map((wh) => {
                const isSecretVisible = !!showSecretMap[wh.id];
                return (
                  <div
                    key={wh.id}
                    className={`bg-[#1E293B] border rounded-2xl p-5 transition-all shadow-md ${
                      wh.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <span>{wh.name}</span>
                          </h3>

                          {wh.isActive ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                              ATIVO
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 border border-slate-700 font-mono font-bold">
                              PAUSADO
                            </span>
                          )}

                          {wh.lastStatus !== undefined && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                                wh.lastStatus >= 200 && wh.lastStatus < 300
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              Último Status: HTTP {wh.lastStatus}
                            </span>
                          )}
                        </div>

                        {/* URL */}
                        <div className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                          <span className="text-indigo-400 font-bold shrink-0">POST</span>
                          <span className="text-slate-200 truncate flex-1">{wh.url}</span>
                          <button
                            type="button"
                            onClick={() => copyText(wh.url, `url_${wh.id}`)}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copiar URL"
                          >
                            {copiedId === `url_${wh.id}` ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Secret Token & Events */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Chave Secreta:</span>
                            <span className="text-amber-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {isSecretVisible ? wh.secret : `${wh.secret.substring(0, 8)}••••••••••••`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowSecret(wh.id)}
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                              title={isSecretVisible ? 'Ocultar segredo' : 'Revelar segredo'}
                            >
                              {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyText(wh.secret, `sec_${wh.id}`)}
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                              title="Copiar Chave Secreta"
                            >
                              {copiedId === `sec_${wh.id}` ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Eventos:</span>
                            {wh.events.map((ev) => (
                              <span key={ev} className="text-[10px] bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                {ev}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-500 tabular-nums">
                            <span>Disparos:</span>
                            <strong className="text-slate-300">{wh.totalDeliveries || 0}</strong>
                            <span>({wh.successfulDeliveries || 0} entregues)</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 lg:self-center shrink-0 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                        <button
                          type="button"
                          onClick={() => handleTriggerTestPing(wh)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                          title="Enviar payload de teste imediato"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Testar Disparo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(wh)}
                          className={`p-2 rounded-xl border text-xs font-mono transition cursor-pointer ${
                            wh.isActive
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                          }`}
                          title={wh.isActive ? 'Pausar este webhook' : 'Ativar este webhook'}
                        >
                          {wh.isActive ? 'Pausar' : 'Ativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(wh)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                          title="Editar configurações do webhook"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                          title="Eliminar este webhook"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LOGS LIST */}
      {activeSubView === 'logs' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Trilha de Entregas & Respostas HTTP em Tempo Real
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {logs.length} disparo(s) registado(s)
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-mono text-slate-400">Nenhum evento de webhook disparado recentemente.</p>
              <p className="text-[11px] font-sans text-slate-500 mt-1">
                Realize uma simulação no NANUCLOUD ou clique em "Testar Disparo" para ver a entrega aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Webhook / Destino</th>
                    <th className="py-3 px-3">Evento</th>
                    <th className="py-3 px-3">Latência</th>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4 text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {log.status === 'success' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          HTTP {log.httpStatusCode || 'ERR'}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="font-bold text-white truncate">{log.webhookName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{log.url}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-indigo-300">
                          {log.event}
                        </span>
                      </td>

                      <td className="py-3 px-3 tabular-nums">
                        <span className="text-slate-300">{log.durationMs} ms</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 tabular-nums">
                        {new Date(log.timestamp).toLocaleString('pt-PT')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setTestResult(log)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          Inspecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DOCS & INTEGRATION GUIDE */}
      {activeSubView === 'docs' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Validação de Segurança com Assinatura HMAC SHA-256
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Para garantir que a notificação recebida no seu servidor veio autenticamente do NANUCLOUD e não foi interceptada ou forjada, calculamos uma assinatura HMAC baseada no corpo exato da requisição (`raw body`) usando a sua chave secreta privada (`secret`).
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
              <div className="text-amber-300 font-bold">Cabeçalhos HTTP Transmitidos em Cada Disparo:</div>
              <ul className="space-y-1 text-slate-400 pl-2">
                <li><strong className="text-indigo-300">X-NanuCloud-Event:</strong> <span className="text-slate-200">simulation.completed</span></li>
                <li><strong className="text-indigo-300">X-NanuCloud-Delivery:</strong> <span className="text-slate-200">del_1726000000_abc123</span> (ID único de entrega)</li>
                <li><strong className="text-indigo-300">X-NanuCloud-Timestamp:</strong> <span className="text-slate-200">2026-09-22T20:55:00.000Z</span></li>
                <li><strong className="text-indigo-300">X-NanuCloud-Signature:</strong> <span className="text-emerald-400">sha256=4f53c89b2...</span> (HMAC-SHA256 do corpo)</li>
              </ul>
            </div>
          </div>

          {/* Code Samples */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                Exemplo de Implementação no Seu Backend
              </h3>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['nodejs', 'php', 'python', 'csharp'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      codeLang === lang ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'nodejs' ? 'Node.js (Express)' : lang === 'php' ? 'PHP' : lang === 'python' ? 'Python (FastAPI)' : 'C# (.NET)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Display */}
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                {codeLang === 'nodejs' && `// Node.js + Express (Receptor de Webhooks NANUCLOUD)
const express = require('express');
const crypto = require('crypto');

const app = express();
// Importante: capture o corpo bruto (raw body) para cálculo do HMAC
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

const WEBHOOK_SECRET = 'whsec_sua_chave_secreta_aqui';

app.post('/api/nanucloud-webhook', (req, res) => {
  const signatureHeader = req.headers['x-nanucloud-signature'];
  const event = req.headers['x-nanucloud-event'];

  // Validar assinatura criptográfica HMAC SHA-256
  const computedHash = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  if (signatureHeader !== computedHash) {
    return res.status(401).json({ error: 'Assinatura HMAC inválida' });
  }

  // Se a assinatura for válida, processe a simulação fiscal finalizada:
  if (event === 'simulation.completed') {
    const { productName, costNet, marginPct, pvpFinal, netProfit, currency } = req.body.data;
    console.log(\`✅ Simulação Recebida: \${productName} | PVP: \${pvpFinal} \${currency}\`);
    
    // Atualize o seu ERP (PHC, Primavera, XD Software, etc.):
    // await sincronizarArtigoNoErp(productName, pvpFinal);
  }

  return res.status(200).json({ received: true });
});

app.listen(8080, () => console.log('Receptor de Webhooks ativo na porta 8080'));`}

                {codeLang === 'php' && `<?php
// Receptor de Webhooks NANUCLOUD em PHP
\$secret = 'whsec_sua_chave_secreta_aqui';

// Ler o corpo bruto da requisição
\$rawPayload = file_get_contents('php://input');
\$signatureHeader = \$_SERVER['HTTP_X_NANUCLOUD_SIGNATURE'] ?? '';
\$event = \$_SERVER['HTTP_X_NANUCLOUD_EVENT'] ?? '';

// Calcular HMAC SHA-256
\$expectedSignature = 'sha256=' . hash_hmac('sha256', \$rawPayload, \$secret);

if (!hash_equals(\$expectedSignature, \$signatureHeader)) {
    http_response_code(401);
    echo json_encode(['error' => 'Assinatura de webhook não coincide.']);
    exit;
}

\$data = json_decode(\$rawPayload, true);

if (\$event === 'simulation.completed') {
    \$sim = \$data['data'];
    // Registo ou atualização automática na base de dados do ERP
    error_log("Simulação concluída: " . \$sim['productName'] . " - PVP: " . \$sim['pvpFinal']);
}

http_response_code(200);
echo json_encode(['status' => 'success']);`}

                {codeLang === 'python' && `# Receptor de Webhooks NANUCLOUD com Python FastAPI
from fastapi import FastAPI, Request, HTTPException
import hmac
import hashlib

app = FastAPI()
WEBHOOK_SECRET = "whsec_sua_chave_secreta_aqui".encode('utf-8')

@app.post("/api/nanucloud-webhook")
async def receive_webhook(request: Request):
    raw_body = await request.body()
    signature_header = request.headers.get("x-nanucloud-signature", "")
    event = request.headers.get("x-nanucloud-event", "")

    expected_signature = "sha256=" + hmac.new(WEBHOOK_SECRET, raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_signature, signature_header):
        raise HTTPException(status_code=401, detail="Assinatura HMAC inválida")

    payload = await request.json()
    if event == "simulation.completed":
        sim_data = payload.get("data", {})
        print(f"✅ Artigo Calculado: {sim_data.get('productName')} | PVP: {sim_data.get('pvpFinal')}")
        # Executar trigger no ERP / CRM

    return {"received": True}`}

                {codeLang === 'csharp' && `// C# ASP.NET Core - Endpoint Receptor de Webhooks NANUCLOUD
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class NanucloudWebhookController : ControllerBase
{
    private const string Secret = "whsec_sua_chave_secreta_aqui";

    [HttpPost]
    public async Task<IActionResult> ReceiveWebhook()
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var rawBody = await reader.ReadToEndAsync();

        var signature = Request.Headers["X-NanuCloud-Signature"].ToString();
        var ev = Request.Headers["X-NanuCloud-Event"].ToString();

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(Secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody));
        var computedSignature = "sha256=" + Convert.ToHexString(hash).ToLower();

        if (signature != computedSignature)
        {
            return Unauthorized("Assinatura inválida");
        }

        // Processar simulação finalizada no ERP Primavera / SAP / XD
        return Ok(new { success = true });
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar / Editar Webhook */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl font-mono text-xs space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Webhook className="w-4 h-4 text-indigo-400" />
                {editingWebhook ? 'Editar Endpoint de Webhook' : 'Novo Endpoint de Webhook'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nome Identificador / Sistema de Destino
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: ERP Primavera - Sincronizador de PVP"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  URL de Destino (Endpoint HTTP POST)
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://seu-sistema.ao/api/webhooks/nanucloud"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                  Deve aceitar requisições POST com corpo em JSON e responder com código HTTP 2xx.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">Chave Secreta HMAC (Secret Token)</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, secret: `whsec_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}` })}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    Gerar Nova Chave
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Eventos Notificados
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.events.includes('simulation.completed')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, events: [...formData.events, 'simulation.completed'] });
                        } else {
                          setFormData({ ...formData, events: formData.events.filter(x => x !== 'simulation.completed') });
                        }
                      }}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">simulation.completed</div>
                      <div className="text-[10px] text-slate-400 font-sans">Dispara sempre que uma simulação de margem/PVP/IVA for concluída.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.events.includes('simulation.batch_processed')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, events: [...formData.events, 'simulation.batch_processed'] });
                        } else {
                          setFormData({ ...formData, events: formData.events.filter(x => x !== 'simulation.batch_processed') });
                        }
                      }}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">simulation.batch_processed</div>
                      <div className="text-[10px] text-slate-400 font-sans">Dispara quando um arquivo Excel/lote de artigos for processado.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Estado do Webhook</div>
                  <div className="text-[10px] text-slate-400 font-sans">Habilitar envio automático imediato</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  {saving ? 'A Guardar...' : 'Guardar Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resultado do Teste / Inspeção */}
      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl font-mono text-xs space-y-4 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    testResult.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  HTTP {testResult.httpStatusCode || 'ERRO'}
                </span>
                <h3 className="font-bold text-white text-sm">
                  Diagnóstico de Entrega de Webhook
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Tempo de Resposta:</span>
                <strong className="text-white tabular-nums">{testResult.durationMs} ms</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Evento:</span>
                <strong className="text-indigo-300 truncate block">{testResult.event}</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Identificador:</span>
                <strong className="text-slate-300 truncate block">{testResult.id}</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Timestamp:</span>
                <strong className="text-slate-300 tabular-nums">
                  {new Date(testResult.timestamp).toLocaleTimeString('pt-PT')}
                </strong>
              </div>
            </div>

            {testResult.errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                <strong>Erro Registado:</strong> {testResult.errorMessage}
              </div>
            )}

            {/* Payload Sent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold uppercase text-[10px]">Payload JSON Transmitido (POST Body):</span>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(testResult.payload, null, 2), 'payload_modal')}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold"
                >
                  {copiedId === 'payload_modal' ? 'Copiado!' : 'Copiar JSON'}
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                {JSON.stringify(testResult.payload, null, 2)}
              </pre>
            </div>

            {/* Response from remote */}
            {testResult.responseBody && (
              <div className="space-y-1">
                <span className="font-bold uppercase text-[10px] text-slate-400">
                  Resposta Recebida do Servidor Remoto:
                </span>
                <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-32">
                  {testResult.responseBody}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
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
