import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface WebhookConfig {
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

export interface WebhookDeliveryLog {
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

const STORAGE_DIR = path.join(process.cwd(), 'backups');
const WEBHOOKS_FILE = path.join(STORAGE_DIR, 'webhooks-registry.json');
const LOGS_FILE = path.join(STORAGE_DIR, 'webhooks-delivery-logs.json');

// Garantir diretório de armazenamento
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function loadWebhooks(): WebhookConfig[] {
  try {
    if (fs.existsSync(WEBHOOKS_FILE)) {
      const data = fs.readFileSync(WEBHOOKS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('⚠️ [Webhook Service] Erro ao ler webhooks-registry.json:', err);
  }
  return [];
}

function saveWebhooks(list: WebhookConfig[]): void {
  try {
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ [Webhook Service] Erro ao gravar webhooks-registry.json:', err);
  }
}

function loadLogs(): WebhookDeliveryLog[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('⚠️ [Webhook Service] Erro ao ler logs de webhooks:', err);
  }
  return [];
}

function saveLogs(logs: WebhookDeliveryLog[]): void {
  try {
    // Manter no máximo os últimos 200 logs
    const trimmed = logs.slice(0, 200);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ [Webhook Service] Erro ao gravar logs de webhooks:', err);
  }
}

/**
 * Gera assinatura criptográfica HMAC-SHA256 para verificação no receptor externo.
 */
export function generateHmacSignature(secret: string, bodyString: string): string {
  if (!secret) return '';
  return 'sha256=' + crypto.createHmac('sha256', secret).update(bodyString, 'utf-8').digest('hex');
}

/**
 * Obtém todos os webhooks de um utilizador (ou todos se for admin).
 */
export function getWebhooksForUser(userId: string): WebhookConfig[] {
  const all = loadWebhooks();
  if (!userId || userId === 'all') return all;
  return all.filter(w => w.userId === userId || w.userId === 'default_system');
}

/**
 * Cria ou atualiza um webhook.
 */
export function saveWebhookConfig(
  userId: string,
  data: Partial<WebhookConfig> & { url: string; name: string }
): WebhookConfig {
  const all = loadWebhooks();
  const existingIdx = all.findIndex(w => w.id === data.id);

  const now = new Date().toISOString();
  const secret = data.secret?.trim() || `whsec_${crypto.randomBytes(18).toString('hex')}`;

  const config: WebhookConfig = {
    id: data.id || `whk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || 'default_system',
    name: data.name.trim(),
    url: data.url.trim(),
    secret,
    isActive: data.isActive !== undefined ? data.isActive : true,
    events: data.events && data.events.length > 0 ? data.events : ['simulation.completed'],
    customHeaders: data.customHeaders || {},
    createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : now,
    updatedAt: now,
    lastTriggeredAt: existingIdx >= 0 ? all[existingIdx].lastTriggeredAt : undefined,
    lastStatus: existingIdx >= 0 ? all[existingIdx].lastStatus : undefined,
    totalDeliveries: existingIdx >= 0 ? (all[existingIdx].totalDeliveries || 0) : 0,
    successfulDeliveries: existingIdx >= 0 ? (all[existingIdx].successfulDeliveries || 0) : 0
  };

  if (existingIdx >= 0) {
    all[existingIdx] = config;
  } else {
    all.unshift(config);
  }

  saveWebhooks(all);
  return config;
}

/**
 * Remove um webhook por ID.
 */
export function deleteWebhook(id: string, userId?: string): boolean {
  const all = loadWebhooks();
  const filtered = all.filter(w => {
    if (w.id !== id) return true;
    if (userId && w.userId !== userId && w.userId !== 'default_system') return true;
    return false;
  });

  if (filtered.length !== all.length) {
    saveWebhooks(filtered);
    return true;
  }
  return false;
}

/**
 * Envia notificação HTTP POST para o webhook com payload estruturado e assinatura HMAC.
 */
export async function sendWebhookNotification(
  webhook: WebhookConfig,
  event: string,
  payloadData: any
): Promise<WebhookDeliveryLog> {
  const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const fullPayload = {
    event,
    deliveryId,
    timestamp,
    webhookId: webhook.id,
    webhookName: webhook.name,
    data: payloadData
  };

  const payloadString = JSON.stringify(fullPayload);
  const signature = generateHmacSignature(webhook.secret, payloadString);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'NanuCloud-Webhook-Dispatcher/2.4.0',
    'X-NanuCloud-Event': event,
    'X-NanuCloud-Delivery': deliveryId,
    'X-NanuCloud-Timestamp': timestamp,
    'X-NanuCloud-Signature': signature,
    ...(webhook.customHeaders || {})
  };

  const startTime = Date.now();
  let status: 'success' | 'failed' = 'failed';
  let httpStatusCode = 0;
  let responseBody = '';
  let errorMessage: string | undefined = undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeout);
    httpStatusCode = res.status;
    const resText = await res.text().catch(() => '');
    responseBody = resText.slice(0, 500); // guarda até 500 caracteres

    if (res.ok) {
      status = 'success';
    } else {
      status = 'failed';
      errorMessage = `Servidor remoto retornou código HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err: any) {
    status = 'failed';
    errorMessage = err.name === 'AbortError' ? 'Tempo limite de conexão esgotado (8s)' : err.message;
  }

  const durationMs = Date.now() - startTime;

  const log: WebhookDeliveryLog = {
    id: deliveryId,
    webhookId: webhook.id,
    webhookName: webhook.name,
    url: webhook.url,
    event,
    status,
    httpStatusCode,
    durationMs,
    payload: fullPayload,
    responseBody: responseBody || undefined,
    errorMessage,
    timestamp
  };

  // Atualizar contadores do webhook
  const all = loadWebhooks();
  const target = all.find(w => w.id === webhook.id);
  if (target) {
    target.lastTriggeredAt = timestamp;
    target.lastStatus = httpStatusCode;
    target.totalDeliveries = (target.totalDeliveries || 0) + 1;
    if (status === 'success') {
      target.successfulDeliveries = (target.successfulDeliveries || 0) + 1;
    }
    saveWebhooks(all);
  }

  // Gravar no histórico de logs
  const logs = loadLogs();
  logs.unshift(log);
  saveLogs(logs);

  return log;
}

/**
 * Dispara automaticamente webhooks cadastrados para o evento "simulation.completed".
 */
export async function triggerSimulationCompletedWebhooks(
  userId: string | undefined,
  simulationData: any
): Promise<void> {
  const all = loadWebhooks();
  const targetWebhooks = all.filter(w => {
    if (!w.isActive) return false;
    if (!w.events.includes('simulation.completed')) return false;
    if (userId && w.userId !== userId && w.userId !== 'default_system') return false;
    return true;
  });

  if (targetWebhooks.length === 0) return;

  console.log(`📡 [Webhook Service] Disparando ${targetWebhooks.length} webhook(s) para simulação concluída.`);

  // Disparo assíncrono em paralelo
  Promise.allSettled(
    targetWebhooks.map(wh => sendWebhookNotification(wh, 'simulation.completed', simulationData))
  ).catch(err => console.warn('⚠️ [Webhook Service] Erro ao disparar webhooks:', err));
}

/**
 * Retorna os logs de entregas.
 */
export function getDeliveryLogs(webhookId?: string): WebhookDeliveryLog[] {
  const logs = loadLogs();
  if (webhookId) {
    return logs.filter(l => l.webhookId === webhookId);
  }
  return logs;
}
