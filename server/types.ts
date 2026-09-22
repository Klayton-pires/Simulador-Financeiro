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

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  nif?: string;
  country: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  department?: string;
  clientCategory?: string;
  isApiUnlocked?: boolean;
  queriesRemaining: number;
  totalQueriesUsed: number;
  activePlanId?: string | null;
  activePlanName?: string | null;
  planExpiresAt?: string | null; // ISO string
  isImportUnlocked: boolean;
  isBatchUnlocked: boolean;
  twoFactorEnabled?: boolean;
  lastDailyCreditDate?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  swift?: string;
  holder: string;
  currency?: string;
  isActive: boolean;
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

export interface AdsenseSlotConfig {
  id: string;
  slotName: string;
  position: 'header' | 'sidebar' | 'footer' | 'interstitial';
  adClient: string;
  adSlot: string;
  adFormat: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  isEnabled: boolean;
  displayMode: 'free_only' | 'all';
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  priceKz: number;
  queriesCount: number;
  queriesIncluded?: number;
  validityDays: number;
  unitPriceKz?: number;
  features: string[];
  unlocksImport: boolean;
  unlocksBatch: boolean;
  isCustom?: boolean;
  minPriceKz?: number;
  badge?: string;
  sortOrder: number;
  isActive?: boolean;
  isPopular?: boolean;
}

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName?: string;
  nif?: string;
  planId: string;
  planName: string;
  amountKz: number;
  queriesGranted: number;
  validityDays: number;
  paymentMethod: string; // 'multicaixa_express' | 'bank_transfer' | 'express_ref' | 'express_phone'
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
  details: Record<string, any>;
  createdAt: string;
}

export interface BotKnowledgeItem {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  language: string;
  category?: string;
  isApproved: boolean;
  learnedFromAdminId?: string;
  learnedFromAdminName?: string;
  learnedAt: string;
}

export interface UnresolvedBotQuestion {
  id: string;
  sessionId: string;
  userName: string;
  userEmail?: string;
  question: string;
  detectedLanguage: string;
  importance: 'low' | 'normal' | 'high';
  status: 'pending' | 'ignored' | 'answered';
  adminAnswer?: string;
  answeredByAdminId?: string;
  answeredByAdminName?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string; // e.g. 'USER_LOGIN', 'PLAN_PURCHASE_REQUEST', 'PAYMENT_APPROVED', 'SETTINGS_UPDATED'
  entityType: 'auth' | 'simulator' | 'plan' | 'payment' | 'user' | 'system' | 'support' | 'chat' | 'security' | 'database' | 'marketing';
  entityId?: string;
  ipAddress?: string;
  details: string;
  createdAt: string;
}

export interface FiscalProposal {
  id: string;
  countryCode: string;
  countryName: string;
  taxType: 'IVA' | 'II' | 'DU' | 'PautaAduaneira';
  currentValue: number | string;
  proposedValue: number | string;
  sourceLaw: string;
  reason: string;
  detectedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  system: 'xd' | 'winrest' | 'primavera' | 'sap' | 'phc' | 'sage' | 'custom';
  permissions: string[];
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt?: string;
}

export interface SystemSettings {
  appName?: string;
  unitQueryPriceKz: number; // default 50 Kz
  minCustomPlanPriceKz: number; // default 500 Kz
  freeQueriesOnRegister: number; // default 3
  freeQueriesDaily: number; // default 3 daily
  freeQueriesPerUser?: number;
  enableMultiplatformDownloads: boolean; // default false
  defaultVatRateAO?: number;
  defaultVatRatePT?: number;
  defaultVatRateMZ?: number;
  defaultVatRateCV?: number;
  defaultVatRateBR?: number;
  moduleMinCredits?: Record<string, number>; // Minimum credit required per simulator module
  moduleQueryPrices?: Record<string, number>; // Price in Kz per query for each module, default 50 Kz
  whatsappSupport1: string;
  whatsappSupport2: string;
  supportEmail: string;
  companyName: string;
  companyAddress: string;
  companyNif?: string;
  companyPhone1?: string;
  companyPhone2?: string;
  companyEmail1?: string;
  companyEmail2?: string;
  companyLogoUrl?: string;
  footerCopyrightText?: string;
  
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
  wiseEnabled?: boolean;
  stripeEnabled?: boolean;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  proxyPayEnabled?: boolean;
  payPayEnabled?: boolean;
  alipayEnabled?: boolean;

  // Support & Chat
  chatBotEnabled?: boolean;
  chatAdminHoursStart?: string;
  chatAdminHoursEnd?: string;
  chatWelcomeMessage?: string;
  chatOfflineMessage?: string;
  chatMaxInactivityMinutes?: number;

  // Security & 2FA
  twoFactorAuthEnabled?: boolean;
  cyberSecurityAiEnabled?: boolean;
  blockedIps?: string[];

  // Social & Marketing
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitterX?: string;
  socialLinkedIn?: string;
  socialMessenger?: string;
  socialTikTok?: string;
  socialSnapchat?: string;
  socialWhatsApp?: string;
  socialYouTube?: string;

  // Themes
  activeThemeId?: string;
  autoHolidayThemeEnabled?: boolean;

  // Fiscal AI
  fiscalAiAutoCheckEnabled?: boolean;

  // Marketing & Google AdSense
  googleAdsenseEnabled?: boolean;
  googleAdsensePublisherId?: string;
  googleAdsenseSlotId?: string;
  googleAdsenseSlots?: AdsenseSlotConfig[];

  // Database Engines & Themes
  dbEngines?: DatabaseEngineConfig[];
  activeDatabaseEngine?: string;
  defaultTheme?: string;
  allowedDomains?: string[];
  paypalSecret?: string;
  paypalReceiverEmail?: string;

  bankName: string;
  bankIban: string;
  bankHolder: string;
  expressPhone: string;
  bankAccounts?: BankAccount[];
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
  senderEmail?: string;
  senderType: 'user' | 'admin' | 'bot';
  senderName: string;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface SmsLogItem {
  id: string;
  phoneNumber: string;
  countryCode?: string;
  messageType: 'welcome' | 'otp_verification' | 'password_reset' | 'low_balance' | 'marketing_broadcast' | 'custom';
  messageContent: string;
  recipientName?: string;
  sentByUserId?: string;
  sentByUserName?: string;
  status: 'delivered' | 'sent' | 'failed' | 'simulated';
  gatewayResponse?: string;
  sentAt: string;
}

export interface TrafficCampaign {
  id: string;
  name: string;
  source: 'facebook_ads' | 'google_ads' | 'tiktok_ads' | 'whatsapp' | 'instagram' | 'direct' | 'organic_seo' | 'referral';
  medium: 'cpc' | 'social' | 'influencer' | 'organic' | 'banner' | 'direct';
  utmCampaign: string;
  budgetKz: number;
  clicks: number;
  impressions: number;
  leads: number;
  registrations: number;
  paidConversions: number;
  revenueKz: number;
  startDate: string;
  status: 'active' | 'paused' | 'completed';
}

export interface OtpVerificationCode {
  id: string;
  identifier: string; // phone or email
  type: 'phone_verification' | 'password_reset' | 'login_otp';
  code: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}
