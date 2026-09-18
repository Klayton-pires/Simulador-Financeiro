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
  freeQueriesOnRegister: 999999,
  freeQueriesDaily: 999999,
  freeQueriesPerUser: 999999,
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

class DatabaseEngine {
  // In-memory data store with NO database connections and NO users
  private users: User[] = [];
  private plans: Plan[] = [...DEFAULT_PLANS];
  private transactions: Transaction[] = [];
  private queryHistory: QueryHistoryItem[] = [];
  private auditLogs: AuditLog[] = [];
  private settings: SystemSettings = { ...DEFAULT_SETTINGS };
  private supportInquiries: SupportInquiry[] = [];
  private chatMessages: ChatMessage[] = [];
  private fiscalProposals: FiscalProposal[] = [];
  private apiKeys: ApiKeyItem[] = [];
  private botKnowledgeBase: BotKnowledgeItem[] = [...DEFAULT_BOT_KNOWLEDGE];
  private unresolvedBotQuestions: UnresolvedBotQuestion[] = [];
  private smsLogs: SmsLogItem[] = [];
  private trafficCampaigns: TrafficCampaign[] = [];

  constructor() {
    // Zero database, zero users initialized
  }

  // Pure in-memory save stub (no file written, no database connection)
  public save() {}

  // Getters
  public getUsers(): User[] { return []; }
  public getPlans(): Plan[] { return this.plans; }
  public getTransactions(): Transaction[] { return this.transactions; }
  public getQueryHistory(): QueryHistoryItem[] { return this.queryHistory; }
  public getAuditLogs(): AuditLog[] { return this.auditLogs; }
  public getSettings(): SystemSettings { return this.settings; }
  public getSupportInquiries(): SupportInquiry[] { return this.supportInquiries; }
  public addSupportInquiry(item: SupportInquiry): SupportInquiry {
    this.supportInquiries.unshift(item);
    return item;
  }
  public updateSupportInquiry(id: string, updates: Partial<SupportInquiry>): SupportInquiry | undefined {
    const idx = this.supportInquiries.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.supportInquiries[idx] = { ...this.supportInquiries[idx], ...updates };
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

  // Users are completely eliminated
  public findUserById(_id: string): User | undefined { return undefined; }
  public findUserByEmail(_email: string): User | undefined { return undefined; }
  public findUserByIdentifier(_identifier: string): User | undefined { return undefined; }
  public addUser(user: User): User { return user; }
  public updateUser(_id: string, updates: Partial<User>): User | undefined { return undefined; }
  public updateUserPassword(_userIdOrEmail: string, _newPlainTextPassword: string): User | undefined { return undefined; }
  public grantBonusQueries(_userId: string, _bonusCount: number, _reason: string, _admin: any): User | undefined { return undefined; }
  public extendPlanValidity(_userId: string, _additionalDays: number, _admin: any): User | undefined { return undefined; }
  public deleteUser(_id: string): boolean { return false; }
  public verifyUserPassword(_user: User, _pass: string): boolean { return false; }
  public verifyOtpCode(_target: string, _code: string, _type: string): boolean { return false; }
  public createOtpCode(_target: string, _type: string): string { return '123456'; }

  public updatePlan(id: string, updates: Partial<Plan>): Plan | undefined {
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.plans[idx] = { ...this.plans[idx], ...updates };
    return this.plans[idx];
  }

  // Transactions
  public addTransaction(t: Transaction): Transaction {
    this.transactions.push(t);
    return t;
  }
  public findTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }
  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.transactions[idx] = { ...this.transactions[idx], ...updates };
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
    return this.transactions[idx];
  }
  public createTransaction(t: any): Transaction {
    this.transactions.push(t);
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
      id: `log_${Date.now()}`,
      userId: log.userId || 'system',
      userName: log.userName || 'Sistema',
      action: log.action || 'ACTION',
      entityType: log.entityType || 'system',
      details: log.details || '',
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(item);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
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
