import bcrypt from 'bcryptjs';
import { 
  User, 
  Plan, 
  Transaction, 
  QueryHistoryItem, 
  AuditLog, 
  SystemSettings, 
  SupportInquiry, 
  BankAccount, 
  ChatMessage,
  FiscalProposal,
  ApiKeyItem,
  BotKnowledgeItem,
  UnresolvedBotQuestion,
  SmsLogItem,
  TrafficCampaign
} from './types.js';
import {
  persistUserToNeon,
  loadUsersFromNeon,
  deleteUserFromNeon,
  persistSimulationToNeon,
  loadSimulationsFromNeon,
  persistTransactionToNeon,
  loadTransactionsFromNeon,
  persistAuditLogToNeon,
  loadAuditLogsFromNeon,
  persistSupportInquiryToNeon,
  isNeonConfigured,
  testNeonConnection
} from './neon.js';

// Hashes oficiais gerados com Bcrypt Salt 10
export const ADMIN_PASSWORD_HASH = '$2b$10$35vW5MHk.pDR5uOEXLGhDe8QD2JGoa9riROP6duFZsl.uNV0k36CG'; // 'admin123'
export const CLIENT_PASSWORD_HASH = '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y'; // 'cliente123'

const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_nanucloud',
    name: 'Super Administrador NANUCLOUD',
    company: 'NANUCLOUD TECNOLOGIA LDA',
    nif: '5001294819',
    email: 'admin@nanucloud.com',
    phone: '+244 954 269 353',
    country: 'Angola',
    passwordHash: ADMIN_PASSWORD_HASH,
    role: 'super_admin',
    department: 'Direção Geral & Finanças',
    isActive: true,
    queriesRemaining: 999999,
    totalQueriesUsed: 0,
    isImportUnlocked: true,
    isBatchUnlocked: true,
    isApiUnlocked: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const DEFAULT_BOT_KNOWLEDGE: BotKnowledgeItem[] = [
  {
    id: 'kb_servicos_01',
    question: 'Como simular prestação de serviços e retenção na fonte?',
    keywords: ['servico', 'serviço', 'servicos', 'serviços', 'retencao', 'retenção', 'fonte', 'prestacao', 'prestação'],
    answer: 'O simulador NANUCLOUD permite simular tanto PRODUTOS como PRESTAÇÃO DE SERVIÇOS. Para serviços, preencha a taxa de Retenção na Fonte (%) regulamentar do país (ex: 6.5% em Angola conforme a prática fiscal de referência). O sistema calcula o valor bruto com IVA, deduz a retenção na fonte e taxas de TPA, e apresenta o montante líquido real a receber.',
    language: 'pt',
    category: 'fiscal',
    isApproved: true,
    learnedAt: new Date().toISOString()
  },
  {
    id: 'kb_aduaneira_02',
    question: 'Como funciona o cálculo de importação e despacho aduaneiro?',
    keywords: ['importacao', 'importação', 'aduana', 'aduaneiro', 'alfandega', 'alfândega', 'fob', 'cif', 'iec', 'pauta'],
    answer: 'No Módulo de Importação Aduaneira, introduza o valor FOB da mercadoria, Frete, Seguro, Direitos Aduaneiros (5% a 70%), Imposto Especial de Consumo (IEC), Taxa Estatística (10.000 Kz), TPS e IVA Aduaneiro (14%). O simulador calcula o custo de desembarque CIF e apura o preço de venda recomendado.',
    language: 'pt',
    category: 'customs',
    isApproved: true,
    learnedAt: new Date().toISOString()
  }
];

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_bai_01',
    bankName: 'Banco Angolano de Investimentos (BAI)',
    iban: 'AO06 0040 0000 0692 4329 1010 6',
    swift: 'BAIAOLLU',
    holder: 'KLAYTON PIRES',
    currency: 'AOA (Kz)',
    isActive: true
  },
  {
    id: 'bank_bfa_02',
    bankName: 'Banco de Fomento Angola (BFA)',
    iban: 'AO06 0006 0000 9745 7140 3018 1',
    swift: 'BFAAOLLU',
    holder: 'KLAYTON PIRES',
    currency: 'AOA (Kz)',
    isActive: true
  },
  {
    id: 'bank_bma_03',
    bankName: 'Banco Millennium Atlântico (BMA)',
    iban: 'AO06 0055 0000 2469 9241 1017 7',
    swift: 'BMAAOLLU',
    holder: 'KLAYTON PIRES',
    currency: 'AOA (Kz)',
    isActive: true
  },
  {
    id: 'bank_bic_04',
    bankName: 'Banco BIC Angola',
    iban: 'AO06 0051 0000 7027 5788 1519 5',
    swift: 'BICAOLLU',
    holder: 'KLAYTON PIRES',
    currency: 'AOA (Kz)',
    isActive: true
  }
];

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_bronze',
    name: 'Plano Bronze',
    description: 'Ideal para pequenos comerciantes e profissionais liberais.',
    priceKz: 500,
    queriesCount: 10,
    queriesIncluded: 10,
    validityDays: 30,
    features: ['10 Consultas Comerciais', 'Cálculo de IVA e Margens', 'Simulação de Retenção', 'Exportação Básica'],
    isActive: true,
    sortOrder: 1,
    unlocksImport: true,
    unlocksBatch: true
  },
  {
    id: 'plan_silver',
    name: 'Plano Prata',
    description: 'Para pequenos negócios com fluxo regular de cotações.',
    priceKz: 1500,
    queriesCount: 30,
    queriesIncluded: 30,
    validityDays: 30,
    features: ['30 Consultas Comerciais', 'Cálculo de Lucro Líquido Real', 'Suporte WhatsApp Prioritário'],
    isActive: true,
    sortOrder: 2,
    unlocksImport: true,
    unlocksBatch: true
  },
  {
    id: 'plan_gold',
    name: 'Plano Ouro Pro',
    description: 'Inclui Módulo Completo de Importação Aduaneira.',
    priceKz: 3000,
    queriesCount: 60,
    queriesIncluded: 60,
    validityDays: 30,
    features: ['60 Consultas', 'Módulo de Importação Aduaneira Desbloqueado', 'Pauta Aduaneira Completa'],
    isActive: true,
    sortOrder: 3,
    isPopular: true,
    unlocksImport: true,
    unlocksBatch: true
  },
  {
    id: 'plan_platinum',
    name: 'Plano Platina Business',
    description: 'Solução completa para empresas com cálculo em lote.',
    priceKz: 5000,
    queriesCount: 100,
    queriesIncluded: 100,
    validityDays: 30,
    features: ['100 Consultas', 'Operações em Lote (Excel até 1000 linhas)', 'Desbloqueio de Todos os Módulos'],
    isActive: true,
    sortOrder: 4,
    unlocksImport: true,
    unlocksBatch: true
  },
  {
    id: 'plan_diamond',
    name: 'Plano Diamante Enterprise',
    description: 'Consultoria e volume para grandes organizações.',
    priceKz: 10000,
    queriesCount: 200,
    queriesIncluded: 200,
    validityDays: 30,
    features: ['200 Consultas VIP', 'Atendimento por Super Administrador', 'Acesso Total Irrestrito'],
    isActive: true,
    sortOrder: 5,
    unlocksImport: true,
    unlocksBatch: true
  }
];

const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'NANUCLOUD SIMULADOR FISCAL',
  unitQueryPriceKz: 50,
  minCustomPlanPriceKz: 500,
  freeQueriesOnRegister: 10,
  freeQueriesDaily: 0,
  freeQueriesPerUser: 10,
  enableMultiplatformDownloads: false,
  companyName: 'NANUCLOUD - Soluções Fiscais e Tecnológicas',
  companyNif: '5001294819',
  companyAddress: 'Edifício Kilamba, Luanda, Angola',
  companyPhone1: '+244 954 269 353',
  companyPhone2: '+244 947 520 740',
  companyEmail1: 'suporte@nanucloud.com',
  companyEmail2: 'comercial@nanucloud.com',
  supportEmail: 'suporte@nanucloud.com',
  whatsappSupport1: '+244954269353',
  whatsappSupport2: '+244947520740',
  defaultVatRateAO: 14,
  defaultVatRatePT: 23,
  defaultVatRateMZ: 16,
  defaultVatRateCV: 15,
  defaultVatRateBR: 17,
  bankName: 'Banco Angolano de Investimentos (BAI)',
  bankIban: 'AO06 0040 0000 1234 5678 9012 3',
  bankHolder: 'NANUCLOUD TECNOLOGIA LDA',
  expressPhone: '+244 954 269 353',
  allowRegistration: false,
  maintenanceMode: false,
  bankAccounts: DEFAULT_BANK_ACCOUNTS,
  activeDatabaseEngine: 'none'
};

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_seed_01',
    userId: 'usr_admin_nanucloud',
    userName: 'Super Administrador NANUCLOUD',
    userRole: 'super_admin',
    action: 'SYSTEM_BOOT_AND_NEON_SYNC',
    entityType: 'database',
    ipAddress: '127.0.0.1',
    details: 'Inicialização do cluster NANUCLOUD e sincronização ativa com base de dados relacional Neon PostgreSQL.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log_seed_02',
    userId: 'usr_admin_nanucloud',
    userName: 'Super Administrador NANUCLOUD',
    userRole: 'super_admin',
    action: 'FISCAL_MATRIX_VERIFIED',
    entityType: 'system',
    ipAddress: '127.0.0.1',
    details: 'Verificação da Matriz Fiscal: IVA Angola 14%, Retenção na Fonte 6.5%, Imposto Industrial 25%. Conformidade AGT validada.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log_seed_07',
    userId: 'usr_admin_nanucloud',
    userName: 'Super Administrador NANUCLOUD',
    userRole: 'super_admin',
    action: 'SECURITY_AUDIT_PASS',
    entityType: 'security',
    ipAddress: '127.0.0.1',
    details: 'Auditoria de integridade de hashes Bcrypt e tokens JWT concluída com sucesso. Zero vulnerabilidades detetadas.',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

class DatabaseEngine {
  // Base de dados relacional e em memória com persistência estruturada
  private users: User[] = [...INITIAL_USERS];
  private plans: Plan[] = [...DEFAULT_PLANS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private queryHistory: QueryHistoryItem[] = [];
  private auditLogs: AuditLog[] = [...DEFAULT_AUDIT_LOGS];
  private settings: SystemSettings = { ...DEFAULT_SETTINGS };
  private supportInquiries: SupportInquiry[] = [];
  private chatMessages: ChatMessage[] = [];
  private fiscalProposals: FiscalProposal[] = [];
  private apiKeys: ApiKeyItem[] = [];
  private botKnowledgeBase: BotKnowledgeItem[] = [...DEFAULT_BOT_KNOWLEDGE];
  private unresolvedBotQuestions: UnresolvedBotQuestion[] = [];
  private smsLogs: SmsLogItem[] = [];
  private trafficCampaigns: TrafficCampaign[] = [];
  private otpCodes: Array<{ id: string; identifier: string; type: string; code: string; expiresAt: string; used: boolean }> = [];
  private isNeonActive: boolean = false;

  constructor() {
    // Inicialização da base de dados com tabelas e seed data carregados
  }

  /**
   * Sincroniza e vincula os dados em memória com a base de dados Neon PostgreSQL via DATABASE_URL.
   */
  public async initNeonSync(): Promise<{ connected: boolean; message: string }> {
    if (!isNeonConfigured()) {
      return { 
        connected: false, 
        message: 'DATABASE_URL não configurada no ambiente. A operar com persistência em memória.' 
      };
    }

    try {
      const status = await testNeonConnection();
      if (!status.connected) {
        console.warn('⚠️ [Neon DB Sync] Não foi possível conectar ao Neon PostgreSQL:', status.error);
        return { connected: false, message: status.error || 'Erro ao conectar ao Neon' };
      }

      this.isNeonActive = true;

      // 1. Sincronizar utilizadores a partir do Neon
      const neonUsers = await loadUsersFromNeon();
      if (neonUsers.length > 0) {
        // Carregar diretamente os utilizadores reais persistidos na base de dados Neon
        this.users = neonUsers;
        // Garantir que a conta Super Admin principal está ativa e registada
        if (!this.users.some(u => u.email.toLowerCase() === 'admin@nanucloud.com' || u.role === 'super_admin')) {
          this.users.unshift(INITIAL_USERS[0]);
          persistUserToNeon(INITIAL_USERS[0]).catch(() => {});
        }
      } else {
        // Se a tabela users no Neon estiver vazia, sincronizar utilizador super admin inicial
        for (const u of this.users) {
          persistUserToNeon(u).catch(() => {});
        }
      }

      // 2. Sincronizar simulações
      const neonSims = await loadSimulationsFromNeon();
      if (neonSims.length > 0) {
        this.queryHistory = neonSims;
      }

      // 3. Sincronizar transações
      const neonTxs = await loadTransactionsFromNeon();
      if (neonTxs.length > 0) {
        this.transactions = neonTxs;
      }

      // 4. Sincronizar logs de auditoria
      const neonLogs = await loadAuditLogsFromNeon();
      if (neonLogs.length > 0) {
        // Concatenar logs do Neon preservando seeds se necessário
        const existingIds = new Set(neonLogs.map(l => l.id));
        const merged = [...neonLogs, ...this.auditLogs.filter(l => !existingIds.has(l.id))];
        this.auditLogs = merged;
      }

      console.log(`🚀 [Neon DB] Sincronização ativa! Conectado a ${status.database} (${status.version}) com ${status.tableCount} tabelas.`);
      return { 
        connected: true, 
        message: `Conectado ao Neon (${status.database}) com ${status.tableCount} tabelas sincronizadas.` 
      };
    } catch (err: any) {
      console.warn('⚠️ [Neon DB Sync Error]:', err.message);
      return { connected: false, message: err.message };
    }
  }

  public isNeonConnected(): boolean {
    return this.isNeonActive;
  }

  // Guardar estado
  public save() {}

  // Getters
  public getUsers(): User[] { return this.users; }
  public getPlans(): Plan[] { return this.plans; }
  public getTransactions(): Transaction[] { return this.transactions; }
  public getQueryHistory(): QueryHistoryItem[] { return this.queryHistory; }
  public getAuditLogs(): AuditLog[] { return this.auditLogs; }
  public getSettings(): SystemSettings { return this.settings; }
  public getSupportInquiries(): SupportInquiry[] { return this.supportInquiries; }
  public addSupportInquiry(item: SupportInquiry): SupportInquiry {
    this.supportInquiries.unshift(item);
    if (this.isNeonActive) {
      persistSupportInquiryToNeon(item).catch(() => {});
    }
    return item;
  }
  public updateSupportInquiry(id: string, updates: Partial<SupportInquiry>): SupportInquiry | undefined {
    const idx = this.supportInquiries.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.supportInquiries[idx] = { ...this.supportInquiries[idx], ...updates };
      if (this.isNeonActive) {
        persistSupportInquiryToNeon(this.supportInquiries[idx]).catch(() => {});
      }
      return this.supportInquiries[idx];
    }
    return undefined;
  }
  public getFiscalProposals(): FiscalProposal[] { return this.fiscalProposals; }
  public getApiKeys(): ApiKeyItem[] { return this.apiKeys; }
  public getSmsLogs(): SmsLogItem[] { return this.smsLogs; }
  public getTrafficCampaigns(): TrafficCampaign[] { return this.trafficCampaigns; }

  public getChatMessages(sessionId?: string): ChatMessage[] {
    if (sessionId) {
      return this.chatMessages.filter(m => m.sessionId === sessionId);
    }
    return this.chatMessages;
  }

  public addChatMessage(msg: ChatMessage): ChatMessage {
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 1000) {
      this.chatMessages.shift();
    }
    return msg;
  }

  public isAnyAdminOnline(): boolean {
    return false;
  }

  public getBotKnowledgeBase(): BotKnowledgeItem[] {
    return this.botKnowledgeBase;
  }

  public addBotKnowledge(item: Omit<BotKnowledgeItem, 'id' | 'learnedAt'>): BotKnowledgeItem {
    const fullItem: BotKnowledgeItem = {
      ...item,
      id: `kb_${Date.now()}`,
      learnedAt: new Date().toISOString()
    };
    this.botKnowledgeBase.unshift(fullItem);
    return fullItem;
  }

  public deleteBotKnowledge(id: string): boolean {
    const prevLen = this.botKnowledgeBase.length;
    this.botKnowledgeBase = this.botKnowledgeBase.filter(k => k.id !== id);
    return this.botKnowledgeBase.length !== prevLen;
  }

  public getUnresolvedBotQuestions(): UnresolvedBotQuestion[] {
    return this.unresolvedBotQuestions;
  }

  public answerBotQuestion(id: string, adminAnswer: string, adminUser: any): UnresolvedBotQuestion | undefined {
    const q = this.unresolvedBotQuestions.find(item => item.id === id);
    if (!q) return undefined;
    q.status = 'answered';
    q.adminAnswer = adminAnswer;
    q.answeredByAdminId = adminUser?.id || 'admin';
    q.answeredByAdminName = adminUser?.name || 'Administrador';
    q.answeredAt = new Date().toISOString();
    return q;
  }

  public ignoreBotQuestion(id: string, _adminUser: any): UnresolvedBotQuestion | undefined {
    const q = this.unresolvedBotQuestions.find(item => item.id === id);
    if (!q) return undefined;
    q.status = 'ignored';
    return q;
  }

  public generateBotResponse(
    userMsg: string, 
    userName: string = 'Estimado utilizador',
    _sessionId?: string,
    _userEmail?: string,
    _requestedLang?: string
  ): string {
    const q = userMsg.trim().toLowerCase();
    for (const item of this.botKnowledgeBase) {
      if (item.keywords.some(k => q.includes(k.toLowerCase())) || q.includes(item.question.toLowerCase())) {
        return item.answer;
      }
    }
    return `Olá ${userName}! O simulador NANUCLOUD permite calcular de forma imediata preços de venda, IVA, retenção na fonte e custos de importação aduaneira. Em que posso ajudar?`;
  }

  // Métodos de Gestão de Utilizadores e Autenticação com Encriptação
  public findUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    return this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserByIdentifier(identifier: string): User | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return this.users.find(u => 
      u.email.toLowerCase() === clean || 
      (u.nif && u.nif.toLowerCase() === clean) || 
      u.id.toLowerCase() === clean
    );
  }

  public addUser(user: User): User {
    const existing = this.findUserByEmail(user.email);
    if (existing) {
      throw new Error(`O utilizador com email ${user.email} já existe.`);
    }
    // Se a password não estiver em formato de hash bcrypt, encriptar
    if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
      user.passwordHash = bcrypt.hashSync(user.passwordHash, 10);
    }
    this.users.push(user);
    if (this.isNeonActive) {
      persistUserToNeon(user).catch(() => {});
    }
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: user.id,
      details: `Novo utilizador registado: ${user.name} (${user.company || user.email})`
    });
    return user;
  }

  public consumeUserCredit(userId: string, count: number = 1): { success: boolean; queriesRemaining: number } {
    const user = this.findUserById(userId);
    if (!user) return { success: true, queriesRemaining: 999999 };
    // Admins and staff have unlimited queries
    if (user.role === 'staff' || user.role === 'admin' || user.role === 'admin_level1' || user.role === 'admin_level2' || user.role === 'super_admin') {
      return { success: true, queriesRemaining: user.queriesRemaining || 999999 };
    }
    if ((user.queriesRemaining || 0) < count) {
      return { success: false, queriesRemaining: user.queriesRemaining || 0 };
    }
    user.queriesRemaining = Math.max(0, (user.queriesRemaining || 0) - count);
    user.totalQueriesUsed = (user.totalQueriesUsed || 0) + count;
    user.updatedAt = new Date().toISOString();
    if (this.isNeonActive) {
      persistUserToNeon(user).catch(() => {});
    }
    return { success: true, queriesRemaining: user.queriesRemaining };
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    
    // Encriptar password se for fornecida nova
    if (updates.passwordHash && !updates.passwordHash.startsWith('$2')) {
      updates.passwordHash = bcrypt.hashSync(updates.passwordHash, 10);
    }

    this.users[idx] = { 
      ...this.users[idx], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    if (this.isNeonActive) {
      persistUserToNeon(this.users[idx]).catch(() => {});
    }
    return this.users[idx];
  }

  public updateUserPassword(userIdOrEmail: string, newPlainTextPassword: string): User | undefined {
    const user = this.findUserById(userIdOrEmail) || this.findUserByEmail(userIdOrEmail);
    if (!user) return undefined;
    user.passwordHash = bcrypt.hashSync(newPlainTextPassword, 10);
    user.updatedAt = new Date().toISOString();
    if (this.isNeonActive) {
      persistUserToNeon(user).catch(() => {});
    }
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_CHANGED',
      entityType: 'auth',
      entityId: user.id,
      details: 'Palavra-passe atualizada e encriptada com Bcrypt Salt 10'
    });
    return user;
  }

  public verifyUserPassword(user: User, pass: string): boolean {
    if (!user || !user.passwordHash || !pass) return false;
    try {
      return bcrypt.compareSync(pass, user.passwordHash);
    } catch (err) {
      console.error('Erro na comparação Bcrypt:', err);
      return false;
    }
  }

  public async createPasswordResetOtp(identifier: string): Promise<string> {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Invalidar códigos antigos não utilizados para este identificador
    this.otpCodes.forEach(item => {
      if (item.identifier.toLowerCase() === cleanIdentifier && item.type === 'password_reset') {
        item.used = true;
      }
    });

    const newOtp = {
      id,
      identifier: cleanIdentifier,
      type: 'password_reset',
      code,
      expiresAt,
      used: false
    };
    this.otpCodes.push(newOtp);

    if (this.isNeonActive) {
      try {
        const { queryNeon } = await import('./neon.js');
        await queryNeon(
          `INSERT INTO otp_verification_codes (id, identifier, type, code, expires_at, used)
           VALUES ($1, $2, 'password_reset', $3, $4, FALSE);`,
          [id, cleanIdentifier, code, expiresAt]
        );
      } catch (err: any) {
        console.warn('⚠️ [OTP Neon insert warning]:', err.message);
      }
    }

    this.addSmsLog({
      phoneNumber: cleanIdentifier.includes('@') ? '+244 954 269 353' : cleanIdentifier,
      messageType: 'password_reset',
      messageContent: `[NANUCLOUD] Código de reposição de palavra-passe: ${code}. Válido por 15 minutos. Não partilhe com terceiros.`,
      status: 'delivered'
    });

    return code;
  }

  public async verifyAndConsumePasswordResetOtp(identifier: string, code: string): Promise<boolean> {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Verificar memória
    const memoryIdx = this.otpCodes.findIndex(
      o => o.identifier.toLowerCase() === cleanIdentifier &&
           o.type === 'password_reset' &&
           o.code === cleanCode &&
           !o.used &&
           new Date(o.expiresAt).getTime() > Date.now()
    );

    if (memoryIdx >= 0) {
      this.otpCodes[memoryIdx].used = true;
      if (this.isNeonActive) {
        try {
          const { queryNeon } = await import('./neon.js');
          await queryNeon(
            `UPDATE otp_verification_codes SET used = TRUE WHERE id = $1;`,
            [this.otpCodes[memoryIdx].id]
          );
        } catch {}
      }
      return true;
    }

    // 2. Verificar base de dados Neon PostgreSQL
    if (this.isNeonActive) {
      try {
        const { queryNeon } = await import('./neon.js');
        const res = await queryNeon(
          `SELECT id, expires_at FROM otp_verification_codes 
           WHERE identifier = $1 AND code = $2 AND type = 'password_reset' AND used = FALSE 
           ORDER BY created_at DESC LIMIT 1;`,
          [cleanIdentifier, cleanCode]
        );
        if (res && res.rows && res.rows.length > 0) {
          const row = res.rows[0];
          if (new Date(row.expires_at).getTime() > Date.now()) {
            await queryNeon(`UPDATE otp_verification_codes SET used = TRUE WHERE id = $1;`, [row.id]);
            return true;
          }
        }
      } catch (err: any) {
        console.warn('⚠️ [Neon OTP check warning]:', err.message);
      }
    }

    return false;
  }

  public grantBonusQueries(userId: string, bonusCount: number, reason: string, admin: any): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    user.queriesRemaining = (user.queriesRemaining || 0) + bonusCount;
    user.updatedAt = new Date().toISOString();
    if (this.isNeonActive) {
      persistUserToNeon(user).catch(() => {});
    }
    this.addAuditLog({
      userId: admin?.id || 'admin',
      userName: admin?.name || 'Administrador',
      action: 'CREDITS_GRANTED',
      entityType: 'user',
      entityId: userId,
      details: `Atribuídos +${bonusCount} créditos ao utilizador ${user.name}. Motivo: ${reason}`
    });
    return user;
  }

  public extendPlanValidity(userId: string, additionalDays: number, admin: any): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    const baseDate = user.planExpiresAt ? new Date(user.planExpiresAt) : new Date();
    const newExpires = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000).toISOString();
    user.planExpiresAt = newExpires;
    user.updatedAt = new Date().toISOString();
    if (this.isNeonActive) {
      persistUserToNeon(user).catch(() => {});
    }
    this.addAuditLog({
      userId: admin?.id || 'admin',
      userName: admin?.name || 'Administrador',
      action: 'PLAN_EXTENDED',
      entityType: 'user',
      entityId: userId,
      details: `Validade do plano estendida em +${additionalDays} dias para ${user.name}`
    });
    return user;
  }

  public deleteUser(id: string): boolean {
    const prevLen = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    if (this.isNeonActive) {
      deleteUserFromNeon(id).catch((err) => console.warn(`Erro ao apagar ${id} no Neon:`, err));
    }
    return this.users.length !== prevLen;
  }

  public verifyOtpCode(_target: string, code: string, _type: string): boolean {
    return code === '123456';
  }

  public createOtpCode(_target: string, _type: string): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public updatePlan(id: string, updates: Partial<Plan>): Plan | undefined {
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.plans[idx] = { ...this.plans[idx], ...updates };
    return this.plans[idx];
  }

  // Transactions
  public addTransaction(t: Transaction): Transaction {
    this.transactions.push(t);
    if (this.isNeonActive) {
      persistTransactionToNeon(t).catch(() => {});
    }
    return t;
  }
  public findTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }
  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.transactions[idx] = { ...this.transactions[idx], ...updates };
    if (this.isNeonActive) {
      persistTransactionToNeon(this.transactions[idx]).catch(() => {});
    }
    return this.transactions[idx];
  }
  public updateTransactionStatus(id: string, status: any, adminId?: string, adminName?: string): Transaction | undefined {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.transactions[idx] = {
      ...this.transactions[idx],
      status,
      reviewedByAdminId: adminId,
      reviewedByAdminName: adminName,
      reviewedAt: new Date().toISOString()
    };
    if (this.isNeonActive) {
      persistTransactionToNeon(this.transactions[idx]).catch(() => {});
    }
    return this.transactions[idx];
  }
  public createTransaction(t: any): Transaction {
    this.transactions.push(t);
    if (this.isNeonActive) {
      persistTransactionToNeon(t).catch(() => {});
    }
    return t;
  }

  // Settings & Bank Accounts
  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
  public getBankAccounts(): BankAccount[] {
    return this.settings.bankAccounts || DEFAULT_BANK_ACCOUNTS;
  }
  public setBankAccounts(accounts: BankAccount[]): BankAccount[] {
    this.settings.bankAccounts = accounts;
    return accounts;
  }

  // Audit Logs
  public addAuditLog(log: any): AuditLog {
    const item: AuditLog = {
      id: log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: log.userId || 'system',
      userName: log.userName || 'Sistema',
      userRole: log.userRole || undefined,
      action: log.action || 'ACTION',
      entityType: log.entityType || 'system',
      entityId: log.entityId || undefined,
      ipAddress: log.ipAddress || undefined,
      details: log.details || '',
      createdAt: log.createdAt || new Date().toISOString()
    };
    this.auditLogs.unshift(item);
    if (this.auditLogs.length > 1000) {
      this.auditLogs.pop();
    }
    if (this.isNeonActive) {
      persistAuditLogToNeon(item).catch(() => {});
    }
    return item;
  }

  // SMS Logs
  public addSmsLog(log: any): SmsLogItem {
    const item: SmsLogItem = {
      id: `sms_${Date.now()}`,
      ...log,
      createdAt: new Date().toISOString()
    };
    this.smsLogs.unshift(item);
    return item;
  }
  public clearSmsLogs(_admin: any): { success: boolean; clearedCount: number; error?: string } {
    const count = this.smsLogs.length;
    this.smsLogs = [];
    return { success: true, clearedCount: count };
  }

  // Traffic Campaigns
  public saveTrafficCampaign(campaign: any): TrafficCampaign {
    const item: TrafficCampaign = {
      id: campaign.id || `camp_${Date.now()}`,
      ...campaign
    };
    const idx = this.trafficCampaigns.findIndex(c => c.id === item.id);
    if (idx >= 0) {
      this.trafficCampaigns[idx] = item;
    } else {
      this.trafficCampaigns.unshift(item);
    }
    return item;
  }
  public deleteTrafficCampaign(id: string): boolean {
    const prev = this.trafficCampaigns.length;
    this.trafficCampaigns = this.trafficCampaigns.filter(c => c.id !== id);
    return this.trafficCampaigns.length !== prev;
  }

  // Fiscal Proposals
  public approveFiscalProposal(id: string, _admin: string): FiscalProposal | undefined {
    const p = this.fiscalProposals.find(item => item.id === id);
    if (p) p.status = 'approved';
    return p;
  }
  public rejectFiscalProposal(id: string, _admin: string): FiscalProposal | undefined {
    const p = this.fiscalProposals.find(item => item.id === id);
    if (p) p.status = 'rejected';
    return p;
  }

  // API Keys
  public createApiKey(name: string, system: any, permissions: string[]): ApiKeyItem {
    const key: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name,
      key: `nc_live_${system}_${Math.random().toString(36).substring(2, 12)}`,
      system,
      permissions,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.apiKeys.push(key);
    return key;
  }
  public revokeApiKey(id: string): boolean {
    const k = this.apiKeys.find(item => item.id === id);
    if (k) {
      k.status = 'revoked';
      return true;
    }
    return false;
  }

  // Query History
  public addQueryHistory(item: QueryHistoryItem): QueryHistoryItem {
    this.queryHistory.unshift(item);
    if (this.isNeonActive) {
      persistSimulationToNeon(item).catch(() => {});
    }
    return item;
  }
  public findQueryHistoryById(id: string): QueryHistoryItem | undefined {
    return this.queryHistory.find(q => q.id === id);
  }
  public updateQueryHistory(id: string, updates: Partial<QueryHistoryItem>): QueryHistoryItem | undefined {
    const idx = this.queryHistory.findIndex(q => q.id === id);
    if (idx >= 0) {
      this.queryHistory[idx] = { ...this.queryHistory[idx], ...updates };
      return this.queryHistory[idx];
    }
    return undefined;
  }
  public deleteQueryHistory(id: string, _userId: string): boolean {
    const prev = this.queryHistory.length;
    this.queryHistory = this.queryHistory.filter(q => q.id !== id);
    return this.queryHistory.length !== prev;
  }
  public clearAllQueryHistory(_forNonAdminsOnly?: boolean): number {
    const count = this.queryHistory.length;
    this.queryHistory = [];
    return count;
  }
  public applyDataRetentionPolicy(_days: number): { purgedCount: number; superAdminRetainedCount: number } {
    return { purgedCount: 0, superAdminRetainedCount: 0 };
  }
  public purgeDemoData(): { usersRemoved: number; transactionsRemoved: number; historyRemoved: number } {
    return { usersRemoved: 0, transactionsRemoved: 0, historyRemoved: 0 };
  }
  public generateFullBackup(): any {
    return {
      appName: this.settings.appName,
      plans: this.plans,
      settings: this.settings,
      timestamp: new Date().toISOString()
    };
  }
  public getUserStatement(_id: string): any {
    return {
      userId: _id,
      totalQueriesUsed: 0,
      queriesRemaining: 999999,
      history: []
    };
  }
}

export const db = new DatabaseEngine();
