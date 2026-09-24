import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserSafe } from '../types';
import { MessageSquare, X, Send, Bot, Shield, User, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SupportChatWidgetProps {
  user: UserSafe | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  user,
  isOpen,
  onToggle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAdminOnline, setIsAdminOnline] = useState<boolean>(false);
  const [onlineAdminName, setOnlineAdminName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showIdentityPrompt, setShowIdentityPrompt] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let storedSession = localStorage.getItem('nanucloud_chat_session_id');
    if (user && user.id) {
      storedSession = `usr_${user.id}`;
      localStorage.setItem('nanucloud_chat_session_id', storedSession);
    } else if (!storedSession) {
      storedSession = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('nanucloud_chat_session_id', storedSession);
    }
    setSessionId(storedSession);
  }, [user]);

  // Presence Heartbeat: Notify server that this client is currently active/online
  useEffect(() => {
    if (!sessionId) return;
    const sendPing = async () => {
      try {
        const effectiveName = user ? user.name : (guestName.trim() || localStorage.getItem('nanucloud_chat_guest_name') || 'Visitante');
        const effectiveEmail = user ? user.email : (guestEmail.trim() || localStorage.getItem('nanucloud_chat_guest_email') || undefined);
        const res = await fetch('/api/chat/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userName: effectiveName,
            userEmail: effectiveEmail
          })
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdminOnline(data.adminOnline);
          if (data.onlineStaff && data.onlineStaff.length > 0) {
            setOnlineAdminName(data.onlineStaff[0].name);
          } else {
            setOnlineAdminName(undefined);
          }
        }
      } catch (err) {
        // silent ping failure catch
      }
    };

    sendPing();
    const pingInterval = setInterval(sendPing, 10000);
    return () => clearInterval(pingInterval);
  }, [sessionId, user, guestName, guestEmail]);

  // Polling for new messages while chat is open
  useEffect(() => {
    if (isOpen && sessionId) {
      checkStatusAndFetchMessages();
      const interval = setInterval(() => {
        fetchMessages(sessionId);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkStatusAndFetchMessages = async () => {
    setIsLoading(true);
    try {
      const statusRes = await fetch('/api/chat/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsAdminOnline(statusData.adminOnline);
        setOnlineAdminName(statusData.onlineAdminName);
      }

      if (sessionId) {
        await fetchMessages(sessionId);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (sid: string) => {
    try {
      const userParam = user?.id ? `&userId=${user.id}` : '';
      const res = await fetch(`/api/chat/messages?sessionId=${sid}${userParam}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !sessionId || isSending) return;

    // Check if guest info is needed
    if (!user && !guestName.trim()) {
      const storedName = localStorage.getItem('nanucloud_chat_guest_name');
      if (!storedName) {
        setShowIdentityPrompt(true);
        return;
      } else {
        setGuestName(storedName);
      }
    }

    setIsSending(true);
    setInputText('');

    const effectiveName = user ? user.name : (guestName.trim() || localStorage.getItem('nanucloud_chat_guest_name') || 'Visitante');
    const effectiveEmail = user ? user.email : (guestEmail.trim() || localStorage.getItem('nanucloud_chat_guest_email') || undefined);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text,
          senderName: effectiveName,
          senderEmail: effectiveEmail,
          userId: user?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setIsAdminOnline(data.adminOnline);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveGuestIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    localStorage.setItem('nanucloud_chat_guest_name', guestName.trim());
    if (guestEmail.trim()) {
      localStorage.setItem('nanucloud_chat_guest_email', guestEmail.trim());
    }
    setShowIdentityPrompt(false);
    handleSendMessage();
  };

  const quickQuestions = [
    'O simulador serve para serviços e produtos?',
    'Como calcular retenção na fonte em serviços (6.5%)?',
    'Quais são os IBANs para transferência?',
    'Qual o preço dos planos de recarga?',
    'As consultas grátis restauram amanhã?',
    'Como validar o meu plano pendente?'
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            onClick={onToggle}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 md:px-4 md:py-3 rounded-full shadow-2xl transition duration-200 transform hover:scale-105 border border-indigo-400/30 cursor-pointer group"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#0F172A] ${
                  isAdminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
            <span className="hidden md:inline font-mono text-xs font-bold uppercase tracking-tight">
              {isAdminOnline ? 'Suporte em Direto (Staff Online)' : 'Suporte NANUCLOUD'}
            </span>
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[390px] md:w-[430px] h-[600px] max-h-[86vh] bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono">
          {/* Header */}
          <div className="bg-[#0F172A] border-b border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                    isAdminOnline
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {isAdminOnline ? <Shield className="w-5 h-5 text-emerald-400" /> : <Bot className="w-5 h-5 text-amber-400" />}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F172A] ${
                    isAdminOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                  title={isAdminOnline ? 'Staff Online em Direto' : 'Staff Offline (Modo Ticket Pendente)'}
                />
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Chat de Suporte & Atendimento</span>
                </h3>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  {isAdminOnline ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Operador em Direto {onlineAdminName ? `(${onlineAdminName})` : ''} • Histórico Ativo
                    </span>
                  ) : (
                    <span className="text-slate-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Troca de Mensagens & Histórico Guardado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => checkStatusAndFetchMessages()}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                title="Atualizar mensagens"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner Status */}
          <div
            className={`px-3 py-2 border-b text-[10px] flex items-center gap-2 ${
              isAdminOnline
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
            }`}
          >
            {isAdminOnline ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>Atendimento Direto Ativo:</strong> Você e a equipa de suporte estão online em simultâneo.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>
                  <strong>Staff Offline:</strong> A sua mensagem será convertida em <strong>Ticket Pendente</strong> para seguimento prioritário assim que um operador estiver disponível.
                </span>
              </>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F172A]/70 text-xs">
            {messages.length === 0 && (
              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3 text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-400">
                  <Bot className="w-4 h-4" />
                  <span>Bem-vindo ao Atendimento NANUCLOUD</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {isAdminOnline
                    ? 'O nosso operador de suporte está online e pronto para responder às suas questões fiscais ou técnicas em direto.'
                    : 'A nossa equipa está temporariamente offline. Pode deixar a sua dúvida aqui — criaremos automaticamente um Ticket Pendente e daremos seguimento imediato.'}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  💡 <em>Dica: As consultas gratuitas diárias renovam-se automaticamente todos os dias às 00:00!</em>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.senderType === 'user';
              const isAdmin = msg.senderType === 'admin';
              const isBot = msg.senderType === 'bot';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
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
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none shadow'
                        : isAdmin
                        ? 'bg-[#1E293B] text-slate-100 border border-emerald-500/40 rounded-bl-none shadow'
                        : 'bg-[#1E293B] text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-[#0F172A] border-t border-slate-800/80 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full text-[10px] border border-slate-700 transition shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Prompt for guest identity if needed */}
          {showIdentityPrompt && (
            <div className="p-3 bg-[#1E293B] border-t border-slate-700 text-xs">
              <form onSubmit={handleSaveGuestIdentity} className="space-y-2">
                <div className="text-[11px] font-bold text-slate-200">
                  Identifique-se para iniciar o atendimento:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome *"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="bg-[#0F172A] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="E-mail *"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="bg-[#0F172A] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1.5 rounded text-xs transition"
                >
                  Entrar no Chat & Enviar Mensagem
                </button>
              </form>
            </div>
          )}

          {/* Input Area */}
          {!showIdentityPrompt && (
            <div className="p-3 bg-[#0F172A] border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isAdminOnline
                    ? 'Escreva a sua mensagem (Staff online em direto)...'
                    : 'Escreva a sua mensagem (Criará um ticket pendente)...'
                }
                className="flex-1 bg-[#1E293B] border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isSending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
