import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { 
  User, 
  QueryHistoryItem, 
  Transaction, 
  BankAccount, 
  Plan, 
  AuditLog, 
  SupportInquiry 
} from './types.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Obtém a connection string do Neon / PostgreSQL a partir das variáveis de ambiente.
 * Suporta DATABASE_URL, POSTGRES_URL ou NEON_DATABASE_URL.
 */
export function getNeonConnectionString(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    null
  );
}

export function isNeonConfigured(): boolean {
  return !!getNeonConnectionString();
}

/**
 * Cria ou devolve a pool de ligações com suporte nativo a SSL para o Neon.
 */
export function getNeonPool(customUrl?: string): pg.Pool | null {
  const connString = customUrl || getNeonConnectionString();
  if (!connString) {
    return null;
  }

  if (customUrl) {
    return new Pool({
      connectionString: customUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      connectionTimeoutMillis: 10000
    });
  }

  if (!pool) {
    pool = new Pool({
      connectionString: connString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.warn('⚠️ [Neon DB] Aviso na pool de conexões:', err.message);
    });
  }

  return pool;
}

/**
 * Executa uma consulta SQL parametrizada no Neon PostgreSQL.
 */
export async function queryNeon<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T> | null> {
  const p = getNeonPool();
  if (!p) return null;
  try {
    return await p.query<T>(text, params);
  } catch (err: any) {
    console.error('⚠️ [Neon DB Query Error]:', err.message);
    throw err;
  }
}

export interface NeonConnectionStatus {
  connected: boolean;
  configured: boolean;
  latencyMs?: number;
  database?: string;
  version?: string;
  tableCount?: number;
  tablesList?: string[];
  error?: string;
  checkedAt: string;
}

/**
 * Testa a ligação ao Neon DB e devolve o estado da base de dados.
 */
export async function testNeonConnection(customUrl?: string): Promise<NeonConnectionStatus> {
  const startTime = Date.now();
  const connString = customUrl || getNeonConnectionString();

  if (!connString) {
    return {
      connected: false,
      configured: false,
      error: 'Variável DATABASE_URL não definida nas variáveis de ambiente.',
      checkedAt: new Date().toISOString()
    };
  }

  let testPool: pg.Pool | null = null;
  let client: pg.PoolClient | null = null;

  try {
    testPool = getNeonPool(customUrl);
    if (!testPool) {
      throw new Error('Falha ao instanciar o driver de conexão PostgreSQL.');
    }

    client = await testPool.connect();
    
    // Consulta de handshake e contagem de tabelas públicas
    const res = await client.query(`
      SELECT 
        NOW() as current_time,
        version() as pg_version,
        current_database() as current_db;
    `);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const latencyMs = Date.now() - startTime;
    const dbName = res.rows[0]?.current_db || 'desconhecido';
    const pgVersion = res.rows[0]?.pg_version || 'PostgreSQL';
    const tablesList = tablesRes.rows.map((r: { table_name: string }) => r.table_name);

    return {
      connected: true,
      configured: true,
      latencyMs,
      database: dbName,
      version: pgVersion.split(' ')[0] + ' ' + (pgVersion.split(' ')[1] || ''),
      tableCount: tablesList.length,
      tablesList,
      checkedAt: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      error: err.message || 'Erro de rede ou autenticação ao ligar ao Neon PostgreSQL.',
      checkedAt: new Date().toISOString()
    };
  } finally {
    if (client) {
      client.release();
    }
    if (customUrl && testPool) {
      await testPool.end().catch(() => {});
    }
  }
}

/**
 * Inicializa e cria o esquema do ficheiro database.sql diretamente no Neon DB.
 */
export async function applySqlSchemaToNeon(customUrl?: string): Promise<{ success: boolean; message: string; tablesFound?: number }> {
  const connString = customUrl || getNeonConnectionString();
  if (!connString) {
    throw new Error('DATABASE_URL é obrigatória para executar o script de migração no Neon.');
  }

  const sqlFilePath = path.join(process.cwd(), 'database.sql');
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error('Ficheiro database.sql não encontrado na raiz do projeto.');
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
  let targetPool = getNeonPool(customUrl);
  if (!targetPool) {
    throw new Error('Não foi possível obter a pool de conexões.');
  }

  const client = await targetPool.connect();
  try {
    await client.query(sqlContent);

    // Contar tabelas criadas
    const countRes = await client.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    const count = parseInt(countRes.rows[0]?.count || '0', 10);

    return {
      success: true,
      message: `Esquema NANUCLOUD v2.4.0 aplicado com sucesso no Neon PostgreSQL!`,
      tablesFound: count
    };
  } finally {
    client.release();
    if (customUrl) {
      await targetPool.end().catch(() => {});
    }
  }
}

// ============================================================================
// MAPEAMENTO E SINCRONIZAÇÃO EM TEMPO REAL COM O NEON POSTGRESQL
// ============================================================================

function mapRowToUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company || '',
    nif: r.nif || '',
    phone: r.phone || '',
    address: r.address || '',
    country: r.country || 'Angola',
    passwordHash: r.password_hash,
    role: r.role || 'client',
    clientCategory: r.client_category || 'comercio',
    department: r.department || '',
    isActive: r.is_active !== false,
    queriesRemaining: parseInt(r.queries_remaining || '0', 10),
    totalQueriesUsed: parseInt(r.total_queries_used || '0', 10),
    activePlanId: r.active_plan_id || null,
    activePlanName: r.active_plan_name || null,
    planExpiresAt: r.plan_expires_at ? new Date(r.plan_expires_at).toISOString() : null,
    isImportUnlocked: !!r.is_import_unlocked,
    isBatchUnlocked: !!r.is_batch_unlocked,
    isApiUnlocked: !!r.is_api_unlocked,
    twoFactorEnabled: !!r.two_factor_enabled,
    lastDailyCreditDate: r.last_daily_credit_date || undefined,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null
  };
}

export async function loadUsersFromNeon(): Promise<User[]> {
  try {
    const res = await queryNeon<any>(`
      SELECT * FROM users ORDER BY created_at ASC;
    `);
    if (!res || !res.rows) return [];
    return res.rows.map(mapRowToUser);
  } catch (err: any) {
    console.warn('⚠️ [Neon DB] Falha ao carregar utilizadores do Neon:', err.message);
    return [];
  }
}

export async function persistUserToNeon(user: User): Promise<void> {
  const sql = `
    INSERT INTO users (
      id, name, company, nif, email, phone, address, country,
      password_hash, role, client_category, department, is_active,
      queries_remaining, total_queries_used, active_plan_id, active_plan_name,
      plan_expires_at, is_import_unlocked, is_batch_unlocked, is_api_unlocked,
      two_factor_enabled, last_daily_credit_date, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19, $20, $21,
      $22, $23, $24, $25
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      company = EXCLUDED.company,
      nif = EXCLUDED.nif,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      country = EXCLUDED.country,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      client_category = EXCLUDED.client_category,
      department = EXCLUDED.department,
      is_active = EXCLUDED.is_active,
      queries_remaining = EXCLUDED.queries_remaining,
      total_queries_used = EXCLUDED.total_queries_used,
      active_plan_id = EXCLUDED.active_plan_id,
      active_plan_name = EXCLUDED.active_plan_name,
      plan_expires_at = EXCLUDED.plan_expires_at,
      is_import_unlocked = EXCLUDED.is_import_unlocked,
      is_batch_unlocked = EXCLUDED.is_batch_unlocked,
      is_api_unlocked = EXCLUDED.is_api_unlocked,
      two_factor_enabled = EXCLUDED.two_factor_enabled,
      last_daily_credit_date = EXCLUDED.last_daily_credit_date,
      updated_at = NOW();
  `;

  const params = [
    user.id,
    user.name,
    user.company || '',
    user.nif || '',
    user.email,
    user.phone || '+244 923 000 000',
    user.address || '',
    user.country || 'Angola',
    user.passwordHash,
    user.role || 'client',
    user.clientCategory || 'comercio',
    user.department || '',
    user.isActive !== false,
    user.queriesRemaining || 0,
    user.totalQueriesUsed || 0,
    user.activePlanId || null,
    user.activePlanName || null,
    user.planExpiresAt ? new Date(user.planExpiresAt) : null,
    !!user.isImportUnlocked,
    !!user.isBatchUnlocked,
    !!user.isApiUnlocked,
    !!user.twoFactorEnabled,
    user.lastDailyCreditDate || null,
    user.createdAt ? new Date(user.createdAt) : new Date(),
    user.updatedAt ? new Date(user.updatedAt) : new Date()
  ];

  try {
    await queryNeon(sql, params);
  } catch (err: any) {
    console.warn(`⚠️ [Neon DB] Falha ao persistir utilizador ${user.email}:`, err.message);
  }
}

export async function loadSimulationsFromNeon(): Promise<QueryHistoryItem[]> {
  try {
    const res = await queryNeon<any>(`
      SELECT * FROM simulations ORDER BY created_at DESC LIMIT 500;
    `);
    if (!res || !res.rows) return [];
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      type: r.type || 'local',
      itemType: r.item_type || 'product',
      title: r.title,
      description: r.description || '',
      countryCode: r.country_code || 'AO',
      costBase: parseFloat(r.cost_base || '0'),
      vatRate: parseFloat(r.vat_rate || '14'),
      marginApplied: parseFloat(r.margin_applied || '0'),
      finalPrice: parseFloat(r.final_price || '0'),
      netProfit: parseFloat(r.net_profit || '0'),
      retentionRate: r.retention_rate ? parseFloat(r.retention_rate) : undefined,
      retentionAmount: r.retention_amount ? parseFloat(r.retention_amount) : undefined,
      netReceived: r.net_received ? parseFloat(r.net_received) : undefined,
      currency: r.currency || 'AOA',
      details: r.details_json ? (typeof r.details_json === 'string' ? JSON.parse(r.details_json) : r.details_json) : {},
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.warn('⚠️ [Neon DB] Falha ao carregar simulações:', err.message);
    return [];
  }
}

export async function persistSimulationToNeon(sim: QueryHistoryItem): Promise<void> {
  const sql = `
    INSERT INTO simulations (
      id, user_id, type, item_type, title, description,
      country_code, currency, cost_base, vat_rate, margin_applied,
      final_price, net_profit, retention_rate, retention_amount,
      net_received, details_json, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  const params = [
    sim.id,
    sim.userId,
    sim.type || 'local',
    sim.itemType || 'product',
    sim.title,
    sim.description || '',
    sim.countryCode || 'AO',
    sim.currency || 'AOA',
    sim.costBase || 0,
    sim.vatRate || 14,
    sim.marginApplied || 0,
    sim.finalPrice || 0,
    sim.netProfit || 0,
    sim.retentionRate || 0,
    sim.retentionAmount || 0,
    sim.netReceived || 0,
    JSON.stringify(sim.details || {}),
    sim.createdAt ? new Date(sim.createdAt) : new Date()
  ];

  try {
    await queryNeon(sql, params);
  } catch (err: any) {
    console.warn(`⚠️ [Neon DB] Falha ao persistir simulação ${sim.id}:`, err.message);
  }
}

export async function loadTransactionsFromNeon(): Promise<Transaction[]> {
  try {
    const res = await queryNeon<any>(`
      SELECT * FROM transactions ORDER BY created_at DESC;
    `);
    if (!res || !res.rows) return [];
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      companyName: r.company_name || '',
      nif: r.nif || '',
      planId: r.plan_id,
      planName: r.plan_name,
      amountKz: parseFloat(r.amount_kz || '0'),
      queriesGranted: parseInt(r.queries_granted || '0', 10),
      validityDays: parseInt(r.validity_days || '30', 10),
      paymentMethod: r.payment_method || 'bank_transfer',
      paymentReference: r.payment_reference || '',
      paymentProofUrl: r.payment_proof_url || undefined,
      paymentProofName: r.payment_proof_name || undefined,
      status: r.status || 'pending',
      notes: r.notes || '',
      reviewedByAdminId: r.reviewed_by_admin_id || undefined,
      reviewedByAdminName: r.reviewed_by_admin_name || undefined,
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.warn('⚠️ [Neon DB] Falha ao carregar transações:', err.message);
    return [];
  }
}

export async function persistTransactionToNeon(tx: Transaction): Promise<void> {
  const sql = `
    INSERT INTO transactions (
      id, user_id, user_name, user_email, company_name, nif,
      plan_id, plan_name, amount_kz, queries_granted, validity_days,
      payment_method, payment_reference, payment_proof_name, payment_proof_url,
      status, notes, reviewed_by_admin_id, reviewed_by_admin_name,
      reviewed_at, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21
    )
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      reviewed_by_admin_id = EXCLUDED.reviewed_by_admin_id,
      reviewed_by_admin_name = EXCLUDED.reviewed_by_admin_name,
      reviewed_at = EXCLUDED.reviewed_at,
      updated_at = NOW();
  `;

  const params = [
    tx.id,
    tx.userId,
    tx.userName,
    tx.userEmail,
    tx.companyName || '',
    tx.nif || '',
    tx.planId,
    tx.planName,
    tx.amountKz || 0,
    tx.queriesGranted || 0,
    tx.validityDays || 30,
    tx.paymentMethod || 'bank_transfer',
    tx.paymentReference || '',
    tx.paymentProofName || null,
    tx.paymentProofUrl || null,
    tx.status || 'pending',
    tx.notes || '',
    tx.reviewedByAdminId || null,
    tx.reviewedByAdminName || null,
    tx.reviewedAt ? new Date(tx.reviewedAt) : null,
    tx.createdAt ? new Date(tx.createdAt) : new Date()
  ];

  try {
    await queryNeon(sql, params);
  } catch (err: any) {
    console.warn(`⚠️ [Neon DB] Falha ao persistir transação ${tx.id}:`, err.message);
  }
}

export async function persistAuditLogToNeon(log: AuditLog): Promise<void> {
  const sql = `
    INSERT INTO audit_logs (
      id, user_id, user_name, user_role, action,
      entity_type, entity_id, ip_address, details, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO NOTHING;
  `;

  const params = [
    log.id,
    log.userId || null,
    log.userName || null,
    log.userRole || null,
    log.action,
    log.entityType,
    log.entityId || null,
    log.ipAddress || null,
    log.details,
    log.createdAt ? new Date(log.createdAt) : new Date()
  ];

  try {
    await queryNeon(sql, params);
  } catch (err: any) {
    console.warn('⚠️ [Neon DB] Falha ao persistir audit log:', err.message);
  }
}

export async function loadAuditLogsFromNeon(): Promise<AuditLog[]> {
  try {
    const res = await queryNeon<any>(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500;
    `);
    if (!res || !res.rows) return [];
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id || undefined,
      userName: r.user_name || undefined,
      userRole: r.user_role || undefined,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id || undefined,
      ipAddress: r.ip_address || undefined,
      details: r.details,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.warn('⚠️ [Neon DB] Falha ao carregar audit logs do Neon:', err.message);
    return [];
  }
}

export async function persistSupportInquiryToNeon(inq: SupportInquiry): Promise<void> {
  const sql = `
    INSERT INTO support_tickets (
      id, user_id, user_name, user_email, user_phone,
      subject, message, attachment_url, status, admin_reply,
      replied_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      admin_reply = EXCLUDED.admin_reply,
      replied_at = EXCLUDED.replied_at,
      updated_at = NOW();
  `;

  const params = [
    inq.id,
    inq.userId || null,
    inq.name,
    inq.email,
    inq.phone || null,
    inq.subject,
    inq.message,
    inq.attachmentUrl || null,
    inq.status || 'open',
    inq.adminReply || null,
    inq.repliedAt ? new Date(inq.repliedAt) : null,
    inq.createdAt ? new Date(inq.createdAt) : new Date()
  ];

  try {
    await queryNeon(sql, params);
  } catch (err: any) {
    console.warn(`⚠️ [Neon DB] Falha ao persistir ticket ${inq.id}:`, err.message);
  }
}
