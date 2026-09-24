import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import simulatorRoutes from './server/routes/simulatorRoutes.js';
import plansRoutes from './server/routes/plansRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import chatRoutes from './server/routes/chatRoutes.js';
import aiTranslateRoutes from './server/routes/aiTranslateRoutes.js';
import authRoutes from './server/routes/authRoutes.js';
import { authenticateUser } from './server/auth.js';
import { db } from './server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Inicializar sincronização com Neon PostgreSQL se DATABASE_URL estiver configurada
  await db.initNeonSync().catch((err: any) => {
    console.warn('⚠️ [Neon Startup Warning]:', err.message);
  });

  // Inicializar motor de backups diários e redundância cloud
  const { initBackupScheduler } = await import('./server/backupService.js');
  initBackupScheduler();

  // Inicializar motor de backups diários e redundância cloud
const { initBackupScheduler } = await import('./server/backupService.js');
initBackupScheduler();

// --- ADICIONE ESTE BLOCO INTEIRO AQUI ---
app.use(cors({
  origin: [
    'https://simulador-financeiro-pzy5.onrender.com',
    'https://simulador.nanucloud.com'
  ],
  credentials: true
}));
// ----------------------------------------

// Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(authenticateUser);

  // Health check
  app.get('/api/health', async (_req, res) => {
    const hasNeon = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL);
    let neonConnected = false;
    let neonLatencyMs: number | undefined;

    if (hasNeon) {
      try {
        const { testNeonConnection } = await import('./server/neon.js');
        const neonStatus = await testNeonConnection();
        neonConnected = neonStatus.connected;
        neonLatencyMs = neonStatus.latencyMs;
      } catch {
        neonConnected = false;
      }
    }

    res.json({ 
      status: 'ok', 
      hostingReady: true,
      neonConfigured: hasNeon,
      neonConnected,
      neonLatencyMs,
      database: hasNeon ? (neonConnected ? 'neon_postgresql_connected' : 'neon_configured_connecting') : 'ready_for_neon_database_url', 
      tablesSupported: 20,
      schemaVersion: '2.4.0',
      encryption: 'bcrypt_salt_10',
      auth: 'jwt_and_bcrypt', 
      nodeEnv: process.env.NODE_ENV || 'development',
      time: new Date().toISOString() 
    });
  });

  // Public Support Ticket Submission (Stateless)
  app.post('/api/support/submit', (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
    }

    const newInquiry = {
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      subject: subject ? subject.trim() : 'Contacto Geral',
      message: message.trim(),
      status: 'open' as const,
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      message: 'Mensagem enviada com sucesso! A nossa equipa entrará em contacto brevemente.',
      inquiry: newInquiry
    });
  });

  // Mount API modules (Connected with Database Tables and Bcrypt Auth)
  app.use('/api/auth', authRoutes);
  app.use('/api/simulator', simulatorRoutes);
  app.use('/api/plans', plansRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/ai', aiTranslateRoutes);

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const dbStatus = db.isNeonConnected() ? 'Neon PostgreSQL (Active)' : 'Fallback In-Memory';
    console.log(`🚀 Nanucloud Server running on http://0.0.0.0:${PORT} (Database: ${dbStatus}, Auth: Bcrypt Salt 10 + JWT)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
