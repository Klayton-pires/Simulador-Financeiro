import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Send,
  Search,
  Filter,
  History,
  X,
  UserCheck,
  RefreshCw,
  Radio,
  ExternalLink,
  Shield,
  Bot,
  Bell,
  Sparkles
} from 'lucide-react';
import { UserSafe, SupportTicket, ChatMessage } from '../types';
import { INITIAL_TICKETS } from '../data/mockDatabase';

interface TicketsManagementTabProps {
  currentUser: UserSafe;
}

interface ChatSessionSummary {
  sessionId: string;
  userName: string;
  userEmail?: string;
  isOnline: boolean;
  lastMessage: string;
  lastTime: string;
  count: number;
  unreadCount: number;
  lastSenderType: 'user' | 'admin' | 'bot';
}

export const TicketsManagementTab: React.FC<TicketsManagementTabProps> = ({ currentUser }) => {
  // Navigation between Live Multi-Chat and Pending Tickets
  const [activeSubTab, setActiveSubTab] = useState<'live_chat' | 'tickets'>('live_chat');

  // --- 1. Live Multi-Chat State ---
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSessionMessages, setActiveSessionMessages] = useState<ChatMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [chatSearch, setChatSearch] = useState<string>('');
  const [chatFilter, setChatFilter] = useState<'all' | 'online' | 'unread'>('all');
  const [onlineClientsCount, setOnlineClientsCount] = useState<number>(0);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 2. Tickets State ---
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('nanucloud_tickets_db');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [ticketReplyText, setTicketReplyText] = useState<string>('');
  const [transferUserId, setTransferUserId] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);

  // Available staff members for ticket assignment
  const staffMembers = [
    { id: currentUser.id, name: `${currentUser.name} (Eu)` },
    { id: 'usr_admin_1', name: 'Super Administrador NANUCLOUD' },
    { id: 'usr_admin_2', name: 'Gestor Fiscal Carlos' },
    { id: 'usr_admin_3', name: 'Consultora Aduaneira Maria' },
    { id: 'usr_admin_4', name: 'Suporte Técnico Engenharia' }
  ];

  // Fetch live chat sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setOnlineClientsCount(data.onlineClientsCount || 0);

        // Auto-select first session if none selected
        if (!selectedSessionId && data.sessions && data.sessions.length > 0) {
          setSelectedSessionId(data.sessions[0].sessionId);
        }
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    }
  };

  // Fetch backend support tickets (offline inquiries) and merge
  const fetchBackendTickets = async () => {
    try {
      const res = await fetch('/api/chat/admin/tickets');
      if (res.ok) {
        const data = await res.json();
        const serverInquiries: any[] = data.tickets || [];

        // Convert server inquiries to SupportTickets format if needed
        const converted = serverInquiries.map((inq: any) => ({
          id: inq.id,
          ticketNumber: inq.subject?.includes('TKT-')
            ? inq.subject.match(/TKT-\d+-\d+/)?.[0] || `TKT-${inq.id.substring(4, 9)}`
            : `TKT-${inq.id.substring(4, 9)}`,
          userId: inq.userId || 'guest',
          userName: inq.name,
          userEmail: inq.email,
          userPhone: inq.phone || '',
          subject: inq.subject || 'Atendimento de Suporte',
          message: inq.message || '',
          priority: (inq.priority || 'normal') as any,
          status: (inq.status === 'open' ? 'aberto' : inq.status === 'in_progress' ? 'em_analise' : 'resolvido') as any,
          department: 'Suporte & Atendimento',
          history: inq.repliedAt
            ? [
                {
                  timestamp: inq.createdAt,
                  action: 'Ticket Registado via Chat Offline',
                  actorName: inq.name,
                  notes: 'Mensagem enviada enquanto o staff estava offline'
                },
                {
                  timestamp: inq.repliedAt,
                  action: 'Seguimento Registado pelo Staff',
                  actorName: 'Operador NANUCLOUD',
                  notes: inq.adminReply
                }
              ]
            : [
                {
                  timestamp: inq.createdAt,
                  action: 'Ticket Criado (Staff Offline)',
                  actorName: inq.name,
                  notes: 'Mensagem enviada pelo cliente aguardando seguimento'
                }
              ],
          createdAt: inq.createdAt,
          updatedAt: inq.repliedAt || inq.createdAt
        }));

        // Merge with local tickets avoiding duplicates
        setTickets((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          const newOnes = converted.filter((c: any) => !ids.has(c.id));
          const merged = [...newOnes, ...prev];
          localStorage.setItem('nanucloud_tickets_db', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Error fetching backend tickets:', err);
    }
  };

  // Fetch messages for selected session
  const fetchActiveMessages = async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sid}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSessionMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching active session messages:', err);
    }
  };

  // Periodic polling for real-time multi-chat
  useEffect(() => {
    fetchSessions();
    fetchBackendTickets();

    const interval = setInterval(() => {
      fetchSessions();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Poll active session messages
  useEffect(() => {
    if (selectedSessionId) {
      fetchActiveMessages(selectedSessionId);
      const interval = setInterval(() => {
        fetchActiveMessages(selectedSessionId);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  // Scroll messages to bottom on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSessionMessages]);

  // Handle staff sending reply to a client in live chat
  const handleSendChatReply = async (presetText?: string) => {
    const text = (presetText || replyMessage).trim();
    if (!text || !selectedSessionId || isSendingReply) return;

    setIsSendingReply(true);
    if (!presetText) setReplyMessage('');

    try {
      const res = await fetch('/api/chat/admin-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          text
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSessionMessages(data.messages || []);
        fetchSessions();
      }
    } catch (err) {
      console.error('Error sending staff reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Handle saving updated tickets
  const handleSaveTickets = (updated: SupportTicket[]) => {
    setTickets(updated);
    localStorage.setItem('nanucloud_tickets_db', JSON.stringify(updated));
    if (selectedTicket) {
      const refreshed = updated.find((t) => t.id === selectedTicket.id);
      if (refreshed) setSelectedTicket(refreshed);
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket['status']) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          history: [
            ...t.history,
            {
              timestamp: new Date().toISOString(),
              action: `Estado alterado para ${newStatus.toUpperCase()}`,
              actorName: currentUser.name
            }
          ]
        };
      }
      return t;
    });
    handleSaveTickets(updated);
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;

    const reply = ticketReplyText.trim();
    setTicketReplyText('');

    try {
      // Send reply to backend API
      await fetch(`/api/chat/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply,
          status: 'resolvido',
          sessionId: selectedTicket.userId ? `usr_${selectedTicket.userId}` : undefined
        })
      });
    } catch (err) {
      console.error('Error sending ticket reply to API:', err);
    }

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'resolvido' as const,
          updatedAt: new Date().toISOString(),
          history: [
            ...t.history,
            {
              timestamp: new Date().toISOString(),
              action: 'Resposta e Seguimento Enviados pelo Operador',
              actorName: currentUser.name,
              notes: reply
            }
          ]
        };
      }
      return t;
    });

    handleSaveTickets(updated);
  };

  const handleTransferTicket = () => {
    if (!selectedTicket || !transferUserId) return;
    const targetStaff = staffMembers.find((s) => s.id === transferUserId);
    const targetName = targetStaff ? targetStaff.name : 'Outro Operador';

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'transferido' as const,
          assignedToUserId: transferUserId,
          assignedToUserName: targetName,
          updatedAt: new Date().toISOString(),
          history: [
            ...t.history,
            {
              timestamp: new Date().toISOString(),
              action: `Ticket Transferido para ${targetName}`,
              actorName: currentUser.name,
              notes: transferNotes || 'Transferência interna de atendimento'
            }
          ]
        };
      }
      return t;
    });

    handleSaveTickets(updated);
    setIsTransferModalOpen(false);
    setTransferNotes('');
  };

  // Filtered live chat sessions
  const filteredSessions = sessions.filter((s) => {
    if (chatFilter === 'online' && !s.isOnline) return false;
    if (chatFilter === 'unread' && s.unreadCount === 0) return false;
    if (!chatSearch.trim()) return true;
    const q = chatSearch.toLowerCase();
    return (
      s.userName.toLowerCase().includes(q) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
      s.lastMessage.toLowerCase().includes(q)
    );
  });

  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (!ticketSearch.trim()) return true;
    const q = ticketSearch.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.userName.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
  });

  const pendingTicketsCount = tickets.filter(
    (t) => t.status === 'aberto' || t.status === 'em_analise'
  ).length;

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'aberto':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">Pendente</span>;
      case 'em_analise':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">Em Análise</span>;
      case 'aguardando_cliente':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">Aguardando Cliente</span>;
      case 'transferido':
        return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">Transferido</span>;
      case 'resolvido':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">Resolvido</span>;
      case 'fechado':
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Fechado</span>;
    }
  };

  const quickReplies = [
    'Olá! Como posso ajudar na simulação aduaneira ou cálculo fiscal?',
    'A verificar as taxas e a pauta aduaneira em tempo real...',
    'Para serviços sujeitos a retenção na fonte em Angola, a taxa aplicável é de 6.5%.',
    'O seu comprovativo de transferência para validação do plano foi registado com sucesso.',
    'As consultas grátis são restauradas diariamente às 00:00!'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Main Navigation & Operator Status */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono">CENTRAL DE SUPORTE & TICKETS</h1>
              <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                STAFF ONLINE ({currentUser.name})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Atendimento em direto com múltiplos clientes simultâneos ou seguimento de tickets de mensagens pendentes
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('live_chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubTab === 'live_chat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Chat em Direto</span>
            {onlineClientsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/30 text-emerald-200 text-[10px]">
                {onlineClientsCount} online
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Tickets Pendentes</span>
            {pendingTicketsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 text-[10px]">
                {pendingTicketsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW: CHAT EM DIRETO COM MÚLTIPLOS CLIENTES (MULTI-CLIENT ONLINE)      */}
      {/* ========================================================================= */}
      {activeSubTab === 'live_chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
          
          {/* Left Column: Client Sessions List (Conversas) */}
          <div className="lg:col-span-4 bg-[#1E293B] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-md">
            
            {/* Search & Filters Header */}
            <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  CLIENTES ATIVOS ({sessions.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineClientsCount} online agora
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Filtrar por nome, email..."
                  className="w-full bg-[#0F172A] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => setChatFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border transition ${
                    chatFilter === 'all'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({sessions.length})
                </button>
                <button
                  onClick={() => setChatFilter('online')}
                  className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                    chatFilter === 'online'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online ({sessions.filter((s) => s.isOnline).length})
                </button>
                <button
                  onClick={() => setChatFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                    chatFilter === 'unread'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Não lidas ({sessions.filter((s) => s.unreadCount > 0).length})
                </button>
              </div>
            </div>

            {/* Sessions Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  Nenhuma sessão de chat encontrada.
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isSelected = selectedSessionId === s.sessionId;
                  return (
                    <button
                      key={s.sessionId}
                      onClick={() => setSelectedSessionId(s.sessionId)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-mono relative ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 shrink-0 ${
                              s.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            }`}
                            title={s.isOnline ? 'Cliente Online' : 'Cliente Offline'}
                          />
                          <span className="font-bold text-slate-100 truncate max-w-[150px]">
                            {s.userName}
                          </span>
                        </div>

                        <span className="text-[9px] text-slate-400 shrink-0">
                          {new Date(s.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {s.userEmail && (
                        <div className="text-[10px] text-slate-400 truncate mb-1">
                          {s.userEmail}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
                        <span className="truncate max-w-[210px] text-slate-400 font-sans">
                          {s.lastSenderType === 'admin' ? '👤 Você: ' : ''}
                          {s.lastMessage}
                        </span>

                        {s.unreadCount > 0 && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                            {s.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Active Conversation with Selected Client */}
          <div className="lg:col-span-8 bg-[#1E293B] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-md">
            {selectedSession ? (
              <>
                {/* Conversation Top Header */}
                <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-mono font-bold">
                        {selectedSession.userName.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          selectedSession.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100 font-mono">
                          {selectedSession.userName}
                        </h3>
                        {selectedSession.isOnline ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                            🟢 Online Agora
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                            ⚪ Offline
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{selectedSession.userEmail || 'Visitante sem email'}</span>
                        <span>•</span>
                        <span className="text-slate-500">ID: {selectedSession.sessionId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchActiveMessages(selectedSession.sessionId)}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
                      title="Atualizar mensagens"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F172A]/70 text-xs font-mono">
                  {activeSessionMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">
                      Nenhuma mensagem registada nesta sessão.
                    </div>
                  ) : (
                    activeSessionMessages.map((msg) => {
                      const isUser = msg.senderType === 'user';
                      const isAdmin = msg.senderType === 'admin';
                      const isBot = msg.senderType === 'bot';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                            {isAdmin && <Shield className="w-3 h-3 text-emerald-400" />}
                            {isBot && <Bot className="w-3 h-3 text-amber-400" />}
                            {isUser && <User className="w-3 h-3 text-indigo-400" />}
                            <span className="font-semibold">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                                : isBot
                                ? 'bg-slate-800/90 text-amber-200 border border-amber-500/20 rounded-bl-none'
                                : 'bg-[#1E293B] text-slate-100 border border-slate-700 rounded-bl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies Strip */}
                <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendChatReply(qr)}
                      className="whitespace-nowrap bg-[#1E293B] hover:bg-indigo-950/60 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-mono border border-slate-700 transition shrink-0 cursor-pointer"
                    >
                      {qr}
                    </button>
                  ))}
                </div>

                {/* Reply Input Form */}
                <div className="p-3 bg-[#0F172A] border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatReply();
                      }
                    }}
                    placeholder={`Responder diretamente a ${selectedSession.userName}... (Pressione Enter)`}
                    className="flex-1 bg-[#1E293B] border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendChatReply()}
                    disabled={!replyMessage.trim() || isSendingReply}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-200 font-mono">SELECIONE UMA CONVERSA</h3>
                <p className="text-xs max-w-sm text-center">
                  Escolha um cliente da lista à esquerda para iniciar o atendimento em direto ou responder às suas mensagens.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW: TICKETS & MENSAGENS PENDENTES (SEGUIMENTO OFFLINE)               */}
      {/* ========================================================================= */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Pesquisar por número, assunto ou cliente..."
                className="bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 py-2 px-3 focus:outline-none focus:border-indigo-500 w-full sm:w-72"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 py-2 px-3 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todos os Estados</option>
                <option value="aberto">Abertos / Pendentes</option>
                <option value="em_analise">Em Análise</option>
                <option value="transferido">Transferidos</option>
                <option value="resolvido">Resolvidos</option>
                <option value="fechado">Fechados</option>
              </select>
            </div>
          </div>

          {/* Tickets Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Tickets List */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 space-y-3 max-h-[700px] overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider px-2">
                FILA DE TICKETS ({filteredTickets.length})
              </h3>

              <div className="space-y-2">
                {filteredTickets.map((ticket) => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  const isFromChat = ticket.subject?.includes('[Chat Offline]') || ticket.history?.some((h) => h.notes?.includes('offline'));

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-mono ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-indigo-300 text-[11px]">{ticket.ticketNumber}</span>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <h4 className="font-bold text-slate-100 text-xs line-clamp-1 mb-1">{ticket.subject}</h4>
                      
                      {isFromChat && (
                        <div className="mb-1.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Origem: Chat Offline
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>{ticket.userName}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Ticket Detail & Transfer Controls */}
            <div className="lg:col-span-2 space-y-6">
              {selectedTicket ? (
                <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6">
                  
                  {/* Ticket Top Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-indigo-400">{selectedTicket.ticketNumber}</span>
                        {getStatusBadge(selectedTicket.status)}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {selectedTicket.department || 'Geral'}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-100 font-mono">{selectedTicket.subject}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Button to Switch to Live Chat if client is online */}
                      {sessions.some((s) => s.userName === selectedTicket.userName || s.userEmail === selectedTicket.userEmail) && (
                        <button
                          onClick={() => {
                            const found = sessions.find((s) => s.userName === selectedTicket.userName || s.userEmail === selectedTicket.userEmail);
                            if (found) {
                              setSelectedSessionId(found.sessionId);
                              setActiveSubTab('live_chat');
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <Radio className="w-3.5 h-3.5" /> Abrir Chat em Direto
                        </button>
                      )}

                      {/* Transfer Button */}
                      <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir
                      </button>
                    </div>
                  </div>

                  {/* Client Info Banner */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">CLIENTE:</span>
                      <span className="text-slate-200 font-bold">{selectedTicket.userName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">EMAIL / CONTACTO:</span>
                      <span className="text-slate-300">{selectedTicket.userEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">OPERADOR RESPONSÁVEL:</span>
                      <span className="text-purple-300 font-bold">{selectedTicket.assignedToUserName || currentUser.name}</span>
                    </div>
                  </div>

                  {/* Client Message */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      MENSAGEM REGISTADA PELO CLIENTE:
                    </span>
                    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Ticket History & Transfers Timeline */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-indigo-400" /> HISTÓRICO & AUDITORIA DE SEGUIMENTO
                    </span>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedTicket.history.map((h, idx) => (
                        <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-xs font-mono flex items-start justify-between gap-4">
                          <div>
                            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              {h.action}
                            </div>
                            {h.notes && <p className="text-slate-300 mt-1 text-[11px] whitespace-pre-wrap">{h.notes}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block">{h.actorName}</span>
                            <span className="text-[10px] text-slate-500 block">{new Date(h.timestamp).toLocaleTimeString('pt-PT')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Actions & Follow-up Reply Form */}
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">ATUALIZAR ESTADO:</span>
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'em_analise')}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/30 transition-colors"
                      >
                        Em Análise
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'aguardando_cliente')}
                        className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-mono font-bold hover:bg-blue-500/30 transition-colors"
                      >
                        Aguardando Cliente
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'resolvido')}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold hover:bg-emerald-500/30 transition-colors"
                      >
                        Marcar como Resolvido
                      </button>
                    </div>

                    <form onSubmit={handleSendTicketReply} className="space-y-2">
                      <label className="block text-xs font-mono font-bold text-slate-300">
                        DAR SEGUIMENTO (RESPOSTA AO CLIENTE):
                      </label>
                      <textarea
                        rows={3}
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                        placeholder="Escreva a resposta de seguimento oficial ao cliente..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!ticketReplyText.trim()}
                          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-mono font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar Resposta de Seguimento
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              ) : (
                <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                  <LifeBuoy className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-200 font-mono">NENHUM TICKET SELECIONADO</h3>
                  <p className="text-xs">Selecione um ticket pendente da lista à esquerda para dar seguimento.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal: Transferir Ticket */}
      {isTransferModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">TRANSFERIR ATENDIMENTO</h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="font-bold text-slate-300 block mb-1">TRANSFERIR PARA QUAL OPERADOR?</label>
                <select
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Selecione o operador ou departamento...</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">MOTIVO / NOTAS DA TRANSFERÊNCIA</label>
                <textarea
                  rows={3}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Ex: Encaminhado para análise especializada de pauta aduaneira..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleTransferTicket}
                  disabled={!transferUserId}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold"
                >
                  Confirmar Transferência
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
