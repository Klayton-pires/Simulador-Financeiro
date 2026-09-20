import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthRequest } from '../auth.js';
import { ChatMessage, SupportInquiry } from '../types.js';

const router = Router();

// Helper to identify if user is staff or admin
const isStaffOrAdmin = (user?: any): boolean => {
  if (!user || !user.role) return false;
  return ['super_admin', 'superadmin', 'admin_level1', 'admin_level2', 'admin', 'manager', 'staff'].includes(user.role);
};

// In-Memory Presence Registries for Staff and Clients
interface StaffPresence {
  userId: string;
  name: string;
  role: string;
  lastSeen: number;
}

interface ClientPresence {
  sessionId: string;
  userId?: string;
  name: string;
  email?: string;
  lastSeen: number;
}

const activeStaff = new Map<string, StaffPresence>();
const activeClients = new Map<string, ClientPresence>();

function cleanPresences() {
  const now = Date.now();
  for (const [k, v] of activeStaff.entries()) {
    if (now - v.lastSeen > 45000) activeStaff.delete(k);
  }
  for (const [k, v] of activeClients.entries()) {
    if (now - v.lastSeen > 45000) activeClients.delete(k);
  }
}

// 1. PRESENCE HEARTBEAT (STAFF & CLIENTS)
router.post('/ping', (req: AuthRequest, res: Response) => {
  cleanPresences();
  const { sessionId, userName, userEmail } = req.body;
  const user = req.user;

  if (user && isStaffOrAdmin(user)) {
    activeStaff.set(user.id, {
      userId: user.id,
      name: user.name,
      role: user.role,
      lastSeen: Date.now()
    });
  } else if (sessionId) {
    activeClients.set(sessionId, {
      sessionId,
      userId: user?.id,
      name: userName || user?.name || 'Utilizador',
      email: userEmail || user?.email,
      lastSeen: Date.now()
    });
  }

  const isStaffOnline = activeStaff.size > 0 || db.isAnyAdminOnline();
  const onlineStaffList = Array.from(activeStaff.values()).map(s => ({
    name: s.name,
    role: s.role
  }));

  return res.json({
    adminOnline: isStaffOnline,
    onlineStaff: onlineStaffList,
    onlineClientsCount: activeClients.size
  });
});

// 2. OBTER ESTADO DO SUPORTE (STAFF ONLINE VS OFFLINE)
router.get('/status', (req: AuthRequest, res: Response) => {
  cleanPresences();
  const isStaffOnline = activeStaff.size > 0 || db.isAnyAdminOnline();
  const staffArray = Array.from(activeStaff.values());
  const primaryName = staffArray.length > 0 ? staffArray[0].name : undefined;

  return res.json({
    adminOnline: isStaffOnline,
    onlineAdminName: primaryName,
    onlineStaffCount: activeStaff.size,
    onlineClientsCount: activeClients.size,
    mode: isStaffOnline ? 'live_direct' : 'offline_ticket',
    message: isStaffOnline 
      ? `Operador NANUCLOUD Online${primaryName ? ` (${primaryName})` : ''}. Atendimento em direto ativo.`
      : 'Equipa de suporte offline de momento. As mensagens serão registadas como Tickets Pendentes para seguimento.'
  });
});

// 3. OBTER HISTÓRICO DE MENSAGENS DE UMA SESSÃO
router.get('/messages', (req: AuthRequest, res: Response) => {
  const sessionId = (req.query.sessionId as string) || (req.user ? `usr_${req.user.id}` : 'anonymous');
  const messages = db.getChatMessages(sessionId);
  return res.json({ messages });
});

// 4. ENVIAR MENSAGEM DO UTILIZADOR (DIRETO SE ONLINE, OU CRIA TICKET SE OFFLINE)
router.post('/send', (req: AuthRequest, res: Response) => {
  try {
    cleanPresences();
    const { sessionId, senderName, senderEmail, text, language } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
    }

    const cleanSessionId = sessionId || (req.user ? `usr_${req.user.id}` : `sess_${Date.now()}`);
    const name = senderName || (req.user ? req.user.name : 'Visitante');
    const email = senderEmail || (req.user ? req.user.email : undefined);

    // Record client presence
    activeClients.set(cleanSessionId, {
      sessionId: cleanSessionId,
      userId: req.user?.id,
      name,
      email,
      lastSeen: Date.now()
    });

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: cleanSessionId,
      userId: req.user?.id,
      senderType: 'user',
      senderName: name,
      userEmail: email,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    db.addChatMessage(userMessage);

    const isStaffOnline = activeStaff.size > 0 || db.isAnyAdminOnline();
    let botMessage: ChatMessage | null = null;
    let ticketCreated: any = null;

    if (isStaffOnline) {
      // Direct live chat with staff: no automated interception, staff handles directly!
    } else {
      // Staff is OFFLINE: Automatic conversion to pending support ticket!
      const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket: SupportInquiry = {
        id: `tkt_offline_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        userId: req.user?.id,
        name,
        email: email || 'utilizador.chat@nanucloud.com',
        phone: req.user?.phone || '',
        subject: `[Chat Offline] Atendimento #${ticketNumber} - ${name}`,
        message: text.trim(),
        status: 'open',
        createdAt: new Date().toISOString()
      };
      db.addSupportInquiry(newTicket);
      ticketCreated = { ticketNumber, id: newTicket.id };

      botMessage = {
        id: `msg_sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sessionId: cleanSessionId,
        senderType: 'bot',
        senderName: 'Atendimento NANUCLOUD',
        text: `A equipa de suporte NANUCLOUD encontra-se offline no momento.\n\nA sua mensagem foi automaticamente registada como **Ticket de Suporte Pendente #${ticketNumber}**.\n\nAssim que um operador entrar online, daremos seguimento ao seu atendimento!`,
        timestamp: new Date(Date.now() + 300).toISOString()
      };
      db.addChatMessage(botMessage);
    }

    return res.status(201).json({
      userMessage,
      botMessage,
      adminOnline: isStaffOnline,
      mode: isStaffOnline ? 'live_direct' : 'offline_ticket',
      ticket: ticketCreated,
      messages: db.getChatMessages(cleanSessionId)
    });
  } catch (err: any) {
    console.error('Error on chat send:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem no chat.' });
  }
});

// 5. STAFF RESPONDE AO CHAT DE UM UTILIZADOR ESPECÍFICO (DIRETO)
router.post('/admin-reply', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ error: 'Acesso restrito ao staff e administradores.' });
    }

    // Refresh staff presence
    activeStaff.set(req.user.id, {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role,
      lastSeen: Date.now()
    });

    const { sessionId, text } = req.body;
    if (!sessionId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Sessão e mensagem são obrigatórias.' });
    }

    const adminRoleLabel = req.user.role === 'staff' 
      ? 'Operador de Atendimento' 
      : req.user.role === 'manager' 
      ? 'Gestor Fiscal' 
      : 'Administrador';

    const adminMsg: ChatMessage = {
      id: `msg_adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      senderType: 'admin',
      senderName: `${req.user.name} (${adminRoleLabel})`,
      userEmail: req.user.email,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    db.addChatMessage(adminMsg);

    // If there's an open ticket matching this session or email, mark it in progress / replied
    const inquiries = db.getSupportInquiries();
    const related = inquiries.find(inq => 
      inq.status === 'open' && 
      (inq.subject.includes(sessionId) || (inq.message && text.includes(inq.message.substring(0, 15))))
    );
    if (related) {
      db.updateSupportInquiry(related.id, {
        status: 'in_progress',
        adminReply: text.trim(),
        repliedAt: new Date().toISOString()
      });
    }

    return res.status(201).json({ message: adminMsg, messages: db.getChatMessages(sessionId) });
  } catch (err: any) {
    console.error('Error on admin reply:', err);
    return res.status(500).json({ error: 'Erro ao enviar resposta de suporte.' });
  }
});

// 6. LISTAR TODAS AS SESSÕES DE CHAT PARA STAFF (MULTI-CLIENT MANAGEMENT)
router.get('/admin/sessions', (req: AuthRequest, res: Response) => {
  cleanPresences();
  if (!req.user || !isStaffOrAdmin(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito ao staff e administradores.' });
  }

  // Refresh staff presence
  activeStaff.set(req.user.id, {
    userId: req.user.id,
    name: req.user.name,
    role: req.user.role,
    lastSeen: Date.now()
  });

  const allMsgs = db.getChatMessages();
  const sessionMap: { 
    [key: string]: { 
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
  } = {};

  for (const m of allMsgs) {
    const isClientOnline = activeClients.has(m.sessionId);
    if (!sessionMap[m.sessionId]) {
      sessionMap[m.sessionId] = {
        sessionId: m.sessionId,
        userName: m.senderType === 'user' ? m.senderName : 'Utilizador',
        userEmail: m.userEmail,
        isOnline: isClientOnline,
        lastMessage: m.text,
        lastTime: m.timestamp,
        count: 1,
        unreadCount: m.senderType === 'user' ? 1 : 0,
        lastSenderType: m.senderType
      };
    } else {
      sessionMap[m.sessionId].lastMessage = m.text;
      sessionMap[m.sessionId].lastTime = m.timestamp;
      sessionMap[m.sessionId].count += 1;
      sessionMap[m.sessionId].isOnline = isClientOnline;
      sessionMap[m.sessionId].lastSenderType = m.senderType;

      if (m.senderType === 'user') {
        sessionMap[m.sessionId].userName = m.senderName;
        if (m.userEmail) sessionMap[m.sessionId].userEmail = m.userEmail;
        sessionMap[m.sessionId].unreadCount += 1;
      } else if (m.senderType === 'admin') {
        // Admin has answered, reset unread count
        sessionMap[m.sessionId].unreadCount = 0;
      }
    }
  }

  // Also include any online clients who haven't sent a message yet
  for (const [sid, pres] of activeClients.entries()) {
    if (!sessionMap[sid]) {
      sessionMap[sid] = {
        sessionId: sid,
        userName: pres.name,
        userEmail: pres.email,
        isOnline: true,
        lastMessage: '(Utilizador online no chat)',
        lastTime: new Date(pres.lastSeen).toISOString(),
        count: 0,
        unreadCount: 0,
        lastSenderType: 'user'
      };
    } else {
      sessionMap[sid].isOnline = true;
    }
  }

  // Sort: online clients first, then most recent messages
  const sessions = Object.values(sessionMap).sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
  });

  return res.json({ 
    sessions,
    totalSessions: sessions.length,
    onlineClientsCount: activeClients.size,
    onlineStaffCount: activeStaff.size
  });
});

// 7. LISTAR TICKETS / MENSAGENS PENDENTES (PARA SEGUIMENTO QUANDO STAFF ESTEVE OFFLINE)
router.get('/admin/tickets', (req: AuthRequest, res: Response) => {
  if (!req.user || !isStaffOrAdmin(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito ao staff e administradores.' });
  }

  const inquiries = db.getSupportInquiries();
  return res.json({ tickets: inquiries });
});

// 8. STAFF RESPONDE A UM TICKET PENDENTE (DÁ SEGUIMENTO)
router.post('/admin/tickets/:id/reply', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ error: 'Acesso restrito ao staff e administradores.' });
    }

    const { id } = req.params;
    const { reply, status, sessionId } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'A resposta é obrigatória.' });
    }

    const inquiry = db.getSupportInquiries().find(s => s.id === id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Ticket de suporte não encontrado.' });
    }

    const updated = db.updateSupportInquiry(id, {
      adminReply: reply.trim(),
      status: status || 'resolved',
      repliedAt: new Date().toISOString()
    });

    // If there is an associated chat session, push message to chatMessages too
    const targetSessionId = sessionId || (inquiry.userId ? `usr_${inquiry.userId}` : undefined);
    if (targetSessionId) {
      const chatReply: ChatMessage = {
        id: `msg_adm_${Date.now()}`,
        sessionId: targetSessionId,
        senderType: 'admin',
        senderName: `${req.user.name} (Resposta ao Ticket de Suporte)`,
        userEmail: req.user.email,
        text: `[Seguimento do Ticket]: ${reply.trim()}`,
        timestamp: new Date().toISOString()
      };
      db.addChatMessage(chatReply);
    }

    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TICKET_FOLLOW_UP_REPLIED',
      entityType: 'support',
      entityId: id,
      details: `Staff ${req.user.name} deu seguimento ao ticket de ${inquiry.name} (${inquiry.email}).`
    });

    return res.json({ message: 'Resposta ao ticket registada com sucesso!', ticket: updated });
  } catch (err: any) {
    console.error('Error replying to ticket:', err);
    return res.status(500).json({ error: 'Erro ao registar resposta ao ticket.' });
  }
});

// 9. PERGUNTAS NÃO RESPONDIDAS DO ROBÔ
router.get('/admin/unresolved', (req: AuthRequest, res: Response) => {
  if (!req.user || !isStaffOrAdmin(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito.' });
  }

  const list = db.getUnresolvedBotQuestions();
  const pendingCount = list.filter(q => q.status === 'pending').length;
  return res.json({ unresolved: list, pendingCount });
});

// 10. ADMIN ENSINA AO ROBÔ
router.post('/admin/answer-learn', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    const { id, answer } = req.body;
    if (!id || !answer || !answer.trim()) {
      return res.status(400).json({ error: 'ID da pergunta e resposta são obrigatórios.' });
    }

    const updated = db.answerBotQuestion(id, answer.trim(), req.user);
    if (!updated) {
      return res.status(404).json({ error: 'Pergunta não encontrada.' });
    }

    return res.json({ success: true, question: updated });
  } catch (err: any) {
    console.error('Error on answer-learn:', err);
    return res.status(500).json({ error: 'Erro ao ensinar resposta ao robô.' });
  }
});

// 11. BASE DE CONHECIMENTO DO ROBÔ
router.get('/admin/knowledge', (req: AuthRequest, res: Response) => {
  if (!req.user || !isStaffOrAdmin(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito.' });
  }
  const knowledge = db.getBotKnowledgeBase();
  return res.json({ knowledge });
});

router.post('/admin/knowledge', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    const { question, answer, keywords, language, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Pergunta e resposta são obrigatórias.' });
    }

    const kwArray = Array.isArray(keywords) 
      ? keywords 
      : (typeof keywords === 'string' ? keywords.split(',').map((s: string) => s.trim().toLowerCase()) : []);

    const newItem = db.addBotKnowledge({
      question: question.trim(),
      answer: answer.trim(),
      keywords: kwArray.length > 0 ? kwArray : question.toLowerCase().split(' ').filter((w: string) => w.length > 2),
      language: language || 'pt',
      category: category || 'general',
      isApproved: true,
      learnedFromAdminId: req.user.id,
      learnedFromAdminName: req.user.name
    });

    return res.status(201).json({ success: true, item: newItem });
  } catch (err: any) {
    console.error('Error on add knowledge:', err);
    return res.status(500).json({ error: 'Erro ao adicionar item de conhecimento.' });
  }
});

router.delete('/admin/knowledge/:id', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }
    const deleted = db.deleteBotKnowledge(req.params.id);
    return res.json({ success: deleted });
  } catch (err: any) {
    console.error('Error on delete knowledge:', err);
    return res.status(500).json({ error: 'Erro ao eliminar conhecimento.' });
  }
});

export default router;
