export type UserRole =
  | 'super_admin'
  | 'superadmin'
  | 'admin_level1'
  | 'admin_level2'
  | 'admin'
  | 'manager'
  | 'staff'
  | 'user'
  | 'client';

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // List of permission keys
  isSystemDefault?: boolean;
  assignedUserIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type PermissionKey =
  | 'calc_local'
  | 'calc_services'
  | 'calc_import_sea'
  | 'calc_import_land'
  | 'calc_import_air'
  | 'batch_excel'
  | 'api_integration'
  | 'view_clients'
  | 'create_clients'
  | 'edit_clients'
  | 'manage_tickets'
  | 'transfer_tickets'
  | 'fiscal_matrix_edit'
  | 'manual_payment_validate'
  | 'export_reports'
  | 'sms_email_marketing'
  | 'db_engines_config'
  | 'backup_system'
  | 'docs_deploy'
  | 'metrics_view'
  | 'system_settings_edit'
  | 'can_simulate_sales'
  | 'can_simulate_services'
  | 'can_simulate_import'
  | 'can_export_excel'
  | 'can_access_api'
  | 'can_manage_clients'
  | 'can_manage_tickets'
  | 'can_manage_marketing'
  | 'can_view_metrics'
  | 'can_edit_fiscal_matrix'
  | 'can_manage_db_engines'
  | 'can_view_docs_deploy';

export type SystemPermissionKey = PermissionKey;

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  category: 'Simulação e Cálculos' | 'Clientes e Atendimento' | 'Fiscal e Auditoria' | 'Integrações e APIs' | 'Marketing e Comunicação' | 'Administração e Sistema' | 'simulacao' | 'administracao' | 'avancado' | 'fiscal' | 'marketing' | 'suporte';
  description: string;
}

export type ServiceBillingMode = 'fixed' | 'hourly' | 'distance';

export interface ServiceCalculationParams {
  billingMode: ServiceBillingMode;
  basePrice: number; // Used for fixed project base price
  hourlyRate?: number;
  totalHours?: number;
  ratePerKm?: number;
  distanceKm?: number;
  clientPaysTransport?: boolean;
  transportCostPerPerson?: number;
  techniciansCount?: number;
  clientPaysMeals?: boolean;
  mealAllowancePerPerson?: number;
  daysDuration?: number;
  vatRate: number;
  retentionRate: number;
  tpaRate: number;
  marginPercent: number;
  serviceDescription?: string;
  clientName?: string;
}

export interface UserSafe {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  nif?: string;
  country: string;
  role: UserRole;
  department?: string;
  permissionGroupId?: string;
  customPermissions?: string[];
  isActive: boolean;
  queriesRemaining: number;
  totalQueriesUsed: number;
  activePlanId: string | null;
  activePlanName: string | null;
  planExpiresAt: string | null;
  isImportUnlocked: boolean;
  isBatchUnlocked: boolean;
  isApiUnlocked?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorPhone?: string;
  loginSmsEnabled?: boolean;
  birthDate?: string;
  clientCategory?: 'comercio' | 'servicos' | 'importacao' | 'industria' | 'liberal' | 'outro';
  assignedManagerId?: string;
  assignedManagerName?: string;
  commercialNotes?: string;
  lastDailyCreditDate?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

// Entidade Dedicada para Clientes e Empresas Externas
export interface ClientProfile {
  id: string;
  name: string; // Nome do titular / responsável
  companyName: string; // Razão Social da Empresa
  email: string;
  phone: string;
  nif: string; // Identificação Fiscal
  address?: string;
  country: string; // Código do País (Ex: AO, PT, BR, etc)
  clientCategory: 'comercio' | 'servicos' | 'importacao' | 'industria' | 'liberal' | 'outro';
  isActive: boolean;
  
  // Subscrição & Saldo
  activePlanId: string;
  activePlanName: string;
  planExpiresAt: string | null;
  queriesRemaining: number;
  totalQueriesUsed: number;
  
  // Desbloqueio de Módulos Específicos
  isImportUnlocked: boolean;
  isBatchUnlocked: boolean;
  isApiUnlocked: boolean;
  
  // Gestão Comercial
  assignedManager?: string;
  commercialNotes?: string;
  
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

// Entidade Dedicada para Utilizadores Internos / Colaboradores (Staff)
export interface StaffUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin_level1' | 'admin_level2' | 'manager' | 'user';
  department: 'Direção Geral' | 'Consultoria Fiscal' | 'Comercial & Vendas' | 'Suporte Técnico' | 'Auditoria & TI';
  permissionGroupId: string;
  permissionGroupName?: string;
  customPermissions?: string[];
  isActive: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber?: string;
  iban: string;
  swift?: string;
  holder: string;
  currency?: string;
  isActive: boolean;
  isVisible: boolean; // Checkbox to show/hide to clients
}

export interface VatOption {
  n: string;
  r: number;
}

export interface CountryFiscal {
  code: string;
  name: string;
  curr: string;
  agency: string;
  vatOptions: VatOption[];
  ii: number; // Industrial / corporate tax %
  tpa: number; // Default card fee %
  retentionServiceRate?: number; // Withholding tax rate (e.g. 6.5% Angola, 11.5% Portugal)
  statisticalTax?: number; // Statistical customs fee %
  margins: number[];
  defaultCustomsRate?: number;
}

export interface Plan {
  id: string;
  name: string;
  priceKz: number;
  queriesCount: number;
  validityDays: number;
  unitPriceKz?: number;
  features: string[];
  unlocksImport: boolean;
  unlocksBatch: boolean;
  unlocksApi?: boolean;
  isCustom?: boolean;
  minPriceKz?: number;
  moduleMinPrices?: {
    importMultimodal: number;
    batchExcel: number;
    apiIntegration: number;
    extraQueriesUnit: number;
  };
  badge?: string;
  sortOrder: number;
}

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  amountKz: number;
  queriesGranted: number;
  validityDays: number;
  paymentMethod: string;
  paymentProofUrl?: string;
  paymentProofName?: string;
  paymentProofSize?: number;
  paymentReference?: string;
  notes?: string;
  status: TransactionStatus;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ManualPaymentValidation {
  id: string;
  transactionId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  planId: string;
  planName: string;
  amountKz: number;
  paymentMethod: string;
  proofDocumentName?: string;
  validatedByUserId: string;
  validatedByUserName: string;
  validationNotes: string;
  status: 'approved' | 'rejected';
  validatedAt: string;
}

export interface QueryHistoryItem {
  id: string;
  userId: string;
  type: 'local' | 'services' | 'intermediary' | 'import' | 'batch' | 'api';
  itemType?: 'product' | 'service';
  title: string;
  description: string;
  countryCode: string;
  costBase: number;
  vatRate: number;
  marginApplied: number;
  finalPrice: number;
  netProfit: number;
  retentionRate?: number;
  retentionAmount?: number;
  netReceived?: number;
  currency: string;
  transportMode?: 'sea' | 'land' | 'air';
  details: Record<string, any>;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: 'aberto' | 'em_analise' | 'aguardando_cliente' | 'transferido' | 'resolvido' | 'fechado';
  assignedToUserId?: string;
  assignedToUserName?: string;
  department?: string;
  history: {
    timestamp: string;
    action: string;
    actorName: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FiscalNotification {
  id: string;
  countryCode: string;
  countryName: string;
  agencyName: string;
  title: string;
  summary: string;
  taxType: 'IVA' | 'Imposto Industrial' | 'Retenção Fonte' | 'Pauta Aduaneira' | 'Taxa Estatística';
  oldRate?: number | string;
  newRate?: number | string;
  effectiveDate: string;
  sourceUrl: string;
  lawReference: string;
  isCritical: boolean;
  readByManagers: {
    managerId: string;
    managerName: string;
    readAt: string;
  }[];
  createdAt: string;
}

export interface DatabaseEngineConfig {
  id: string;
  type: 'mysql' | 'mssql' | 'postgres' | 'sqlite' | 'json';
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl: boolean;
  isActive: boolean;
  connectionStatus: 'connected' | 'error' | 'disconnected' | 'testing';
  lastTestedAt?: string;
  errorMessage?: string;
}

export interface ApiIntegrationConfig {
  id: string;
  systemName: 'PHC' | 'Primavera' | 'SAP' | 'Sage' | 'Odoo' | 'Moloni' | 'WooCommerce' | 'Shopify' | 'Magento' | 'PrestaShop' | 'Excel / Power Query' | 'Custom REST';
  systemCategory: 'ERP Gestão' | 'E-commerce' | 'Planilhas & BI' | 'Personalizado';
  apiKey: string;
  apiSecret?: string;
  webhookUrl?: string;
  syncPriceFieldOnly: boolean; // Systems with single sales price field
  recommendedFields: string[];
  isActive: boolean;
  queriesHandled: number;
  lastCallAt?: string;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  type: 'sms' | 'email' | 'both';
  category?: 'promocao' | 'alerta_saldo' | 'atualizacao_fiscal' | 'comemorativa_feriado' | 'personalizada' | string;
  targetAudience: string;
  subject?: string;
  messageTemplate?: string; // Supports variables: {nome}, {empresa}, {saldo}, {plano}
  message?: string;
  sentCount?: number;
  recipientCount?: number;
  status: 'draft' | 'scheduled' | 'sent';
  sentAt?: string;
  createdAt?: string;
}

export interface ConsultingAuditEntry {
  id: string;
  operationType: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  clientAffectedId?: string;
  clientAffectedName?: string;
  ipAddress: string;
  details: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  timestamp: string;
}

export interface SystemTheme {
  id: string;
  name: string;
  accent: string;
  bodyBg: string;
  cardBg: string;
  fontFamily: string;
  description: string;
}

export interface AdsenseSlotConfig {
  id: string;
  slotNumber: 1 | 2 | 3;
  title: string;
  position: 'topo_banner' | 'lateral_banner' | 'rodape_banner';
  slotId: string;
  format: 'auto' | 'horizontal' | 'rectangle';
  isActive: boolean;
}

export interface CentralServerConfig {
  serverUrl: string;
  clusterId: string;
  syncIntervalMinutes: number;
  autoSync: boolean;
  status: 'online' | 'offline' | 'syncing';
  lastSyncedAt?: string;
}

export interface SystemSettings {
  unitQueryPriceKz: number;
  minCustomPlanPriceKz: number;
  freeQueriesOnRegister: number;
  freeQueriesDaily: number;
  enableMultiplatformDownloads?: boolean;
  moduleMinCredits?: Record<string, number>;
  moduleQueryPrices?: Record<string, number>;
  whatsappSupport1: string;
  whatsappSupport2: string;
  whatsappSupport3?: string;
  whatsappSupport4?: string;
  supportEmail: string;
  companyName: string;
  companyAddress: string;
  companyNif?: string;
  companyPhone1?: string;
  companyPhone2?: string;
  companyPhone3?: string;
  companyPhone4?: string;
  companyEmail1?: string;
  companyEmail2?: string;
  companyLogoUrl?: string;
  footerCopyrightText?: string;
  
  // Bank Accounts (up to 6 coordinates with checkbox)
  bankAccounts: BankAccount[];

  // Database Engines
  dbEngines?: DatabaseEngineConfig[];

  // Central Server Link
  centralServer?: CentralServerConfig;

  // Google AdSense (Up to 3 slots in free mode)
  googleAdsenseEnabled?: boolean;
  googleAdsensePublisherId?: string;
  googleAdsenseSlots?: AdsenseSlotConfig[];

  // Themes & Fonts
  activeThemeId?: string;
  activeFontFamily?: string;
  holidayCelebrationEnabled?: boolean;
  birthdayGreetingEnabled?: boolean;

  // Security & SMS Login
  loginSmsEnabled?: boolean;
  twoFactorAuthEnabled?: boolean;
  cyberSecurityAiEnabled?: boolean;
  maxUploadSizeBytes?: number; // File upload limits

  // Fiscal AI
  fiscalAiAutoCheckEnabled?: boolean;

  // Electronic payments & EMIS
  emisEnabled?: boolean;
  emisEntityId?: string;
  emisTerminalId?: string;
  emisApiKey?: string;
  emisWebhookUrl?: string;
  emisAutoActivate?: boolean;
  bankTransferEnabled?: boolean;
  visaMastercardEnabled?: boolean;
  paypalEnabled?: boolean;
  paypalClientId?: string;
  paypalSecret?: string;
  paypalReceiverEmail?: string;
  defaultTheme?: string;
  allowedDomains?: string[];
  wiseEnabled?: boolean;
  stripeEnabled?: boolean;
  stripePublicKey?: string;
  stripeSecretKey?: string;

  // Reserved Future Gateways: ProxyPay, PayPay África, Alipay
  proxyPayEnabled?: boolean;
  proxyPayApiKey?: string;
  proxyPayEntityId?: string;
  proxyPaySandboxMode?: boolean;
  proxyPayAutoActivate?: boolean;

  payPayEnabled?: boolean;
  payPayMerchantId?: string;
  payPayApiKey?: string;
  payPaySandboxMode?: boolean;
  payPayAutoActivate?: boolean;

  alipayEnabled?: boolean;
  alipayAppId?: string;
  alipayMerchantPrivateKey?: string;
  alipayPublicKey?: string;
  alipaySandboxMode?: boolean;
  alipayAutoActivate?: boolean;

  // Chat & Support
  chatBotEnabled?: boolean;
  chatAdminHoursStart?: string;
  chatAdminHoursEnd?: string;
  chatWelcomeMessage?: string;
  chatOfflineMessage?: string;

  allowRegistration: boolean;
  maintenanceMode: boolean;
}

export interface SupportInquiry {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  senderType: 'user' | 'admin' | 'bot';
  senderName: string;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: 'auth' | 'simulator' | 'plan' | 'payment' | 'user' | 'system' | 'support' | 'chat' | 'security' | 'database' | 'marketing' | string;
  entityId?: string;
  ipAddress?: string;
  details: string;
  createdAt: string;
  operationType?: string;
  operatorName?: string;
  timestamp?: string;
}

export interface FiscalProposal {
  id: string;
  countryCode: string;
  countryName: string;
  taxType: string;
  currentRate: number | string;
  proposedRate: number | string;
  rationale: string;
  sourceUrl: string;
  effectiveDate: string;
  status: 'pending' | 'applied' | 'rejected';
  appliedByManagerId?: string;
  appliedByManagerName?: string;
  appliedAt?: string;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  clientName: string;
  clientEmail: string;
  role: string;
  rateLimitPerMinute: number;
  totalCalls: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface EmisReferencePaymentConfig {
  entityCode: string; // Entidade EMIS (e.g. 00123)
  subEntityCode?: string; // Sub-entidade
  terminalId?: string;
  apiKey?: string;
  webhookSecret?: string;
  autoActivate: boolean;
  minAmountKz?: number;
}

export interface PaypalPaymentConfig {
  clientId: string;
  clientSecret?: string;
  receiverEmail: string;
  mode: 'sandbox' | 'live';
  currency: string;
  autoActivate: boolean;
}

export interface ProxyPayConfig {
  apiKey?: string;
  entityId?: string;
  sandboxMode?: boolean;
  autoActivate?: boolean;
}

export interface PayPayAfricaConfig {
  merchantId?: string;
  apiKey?: string;
  sandboxMode?: boolean;
  autoActivate?: boolean;
}

export interface AlipayConfig {
  appId?: string;
  merchantPrivateKey?: string;
  alipayPublicKey?: string;
  sandboxMode?: boolean;
  autoActivate?: boolean;
}

export interface FreeTrialCreditsConfig {
  freeQueriesOnRegister: number; // For new registered users
  freeQueriesForVisitors: number; // For anonymous visitors on the page
  allowUnlimitedSimulationInTestMode: boolean;
}

export interface ConfigSnapshot {
  id: string;
  section: string;
  sectionName: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  summary: string;
  payload: any;
}

export interface AppThemeConfig {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  bgDark: string;
  cardDark: string;
  accentColor: string;
  textColor: string;
}

export interface MarketingNotification {
  id: string;
  type: 'text' | 'image' | 'video';
  title: string;
  message: string;
  mediaUrl?: string;
  actionUrl?: string;
  actionText?: string;
  badge?: string;
  category: 'comunicacao' | 'publicidade' | 'aviso' | 'promocao' | 'outro';
  recommendedDimensions: string;
  maxSizeMb?: number;
  targetAudience: 'all' | 'clients' | 'visitors' | 'admins';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}
