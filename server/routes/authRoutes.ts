import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { generateToken, AuthRequest, authenticateUser, requireAuth, isStaffOrAdminRole } from '../auth.js';
import { User } from '../types.js';

const router = Router();

// Função auxiliar para retornar dados seguros do utilizador (sem passwordHash)
function toSafeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// =========================================================================
// 1. REGISTO DE NOVA EMPRESA / UTILIZADOR (COM ENCRIPTAÇÃO BCRYPT SALT 10)
// =========================================================================
router.post('/register', (req: Request, res: Response) => {
  try {
    const { name, companyName, nif, email, phone, password, category } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ error: 'A Razão Social / Nome da Empresa é obrigatória.' });
    }
    if (!nif || !nif.trim()) {
      return res.status(400).json({ error: 'O NIF da empresa é obrigatório para conformidade fiscal.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'O Email comercial é obrigatório.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNif = nif.trim();

    // Verificar se email ou NIF já existem
    const existingByEmail = db.findUserByEmail(cleanEmail);
    if (existingByEmail) {
      return res.status(409).json({ error: 'Já existe uma conta registada com este endereço de e-mail.' });
    }

    const existingByNif = db.getUsers().find(u => u.nif?.toLowerCase() === cleanNif.toLowerCase());
    if (existingByNif) {
      return res.status(409).json({ error: 'Já existe uma empresa registada com este NIF.' });
    }

    // Encriptação segura com Bcrypt Salt 10
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    const settings = db.getSettings();
    const bonusQueries = typeof settings.freeQueriesOnRegister === 'number' ? settings.freeQueriesOnRegister : 10;

    const newUser: User = {
      id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name?.trim() || companyName.trim(),
      company: companyName.trim(),
      nif: cleanNif,
      email: cleanEmail,
      phone: phone?.trim() || '+244 923 000 000',
      country: 'Angola',
      passwordHash,
      role: 'client',
      clientCategory: category || 'comercio',
      isActive: true,
      queriesRemaining: bonusQueries,
      totalQueriesUsed: 0,
      isImportUnlocked: false,
      isBatchUnlocked: false,
      isApiUnlocked: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    const token = generateToken(newUser);

    res.cookie('nanucloud_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: `Conta empresarial registada com sucesso! Recebeu ${bonusQueries} consultas de bónus de boas-vindas.`,
      user: toSafeUser(newUser),
      token
    });
  } catch (err: any) {
    console.error('Erro no registo de utilizador:', err);
    return res.status(500).json({ error: err.message || 'Erro ao processar registo.' });
  }
});

// =========================================================================
// 2. LOGIN DE UTILIZADOR COM VERIFICAÇÃO BCRYPT (ESTRITO: APENAS ATIVOS E INSCRITOS NA BD)
// =========================================================================
router.post('/login', (req: Request, res: Response) => {
  try {
    const { identifier, email, password } = req.body;
    const userIdentifier = identifier || email;

    if (!userIdentifier || !userIdentifier.trim()) {
      return res.status(400).json({ error: 'Por favor introduza o seu Email ou NIF.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'A palavra-passe de acesso é obrigatória.' });
    }

    const user = db.findUserByIdentifier(userIdentifier);
    if (!user) {
      return res.status(401).json({ 
        error: 'Nenhuma conta encontrada com este e-mail ou NIF na base de dados. Registe-se ou contacte o suporte.' 
      });
    }

    // Validação de estado ativo
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Esta conta encontra-se inativa ou suspensa na base de dados. Contacte a administração para reativação.' 
      });
    }

    // Validação estrita da palavra-passe com Bcrypt
    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas: palavra-passe incorreta.' 
      });
    }

    // Atualizar data de último acesso
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const token = generateToken(user);

    res.cookie('nanucloud_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      details: `Login de utilizador efetuado com sucesso via Bcrypt: ${user.email}`
    });

    return res.json({
      success: true,
      message: 'Sessão iniciada com sucesso!',
      user: toSafeUser(user),
      token
    });
  } catch (err: any) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno durante a autenticação.' });
  }
});

// =========================================================================
// 3. LOGIN ADMINISTRATIVO COM VERIFICAÇÃO BCRYPT (ESTRITO: APENAS ATIVOS E INSCRITOS NA BD)
// =========================================================================
router.post('/admin-login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'O e-mail administrativo é obrigatório.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'A palavra-passe administrativa é obrigatória.' });
    }

    const user = db.findUserByEmail(email.trim());
    if (!user) {
      return res.status(401).json({ error: 'Utilizador administrativo não registado na base de dados do sistema.' });
    }

    if (!isStaffOrAdminRole(user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado: Este perfil não possui credenciais de gestão administrativa.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Esta conta administrativa encontra-se inativa ou suspensa na base de dados.' 
      });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Credenciais administrativas inválidas: palavra-passe incorreta.' 
      });
    }

    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const token = generateToken(user);

    res.cookie('nanucloud_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ADMIN_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      details: `Sessão de gestão administrativa iniciada com sucesso por ${user.email}`
    });

    return res.json({
      success: true,
      message: 'Autenticado com sucesso na Área de Gestores!',
      user: toSafeUser(user),
      token
    });
  } catch (err: any) {
    console.error('Erro no login administrativo:', err);
    return res.status(500).json({ error: 'Erro no servidor de autenticação.' });
  }
});

// =========================================================================
// 3.1 REPOSIÇÃO DE SENHA - PEDIDO DE CÓDIGO OTP (/api/auth/forgot-password)
// =========================================================================
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Por favor indique o e-mail ou NIF associado à conta.' });
    }

    const user = db.findUserByIdentifier(identifier.trim());
    if (!user) {
      return res.status(404).json({ 
        error: 'Nenhuma conta encontrada na base de dados com este e-mail ou NIF.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Esta conta encontra-se inativa ou suspensa. Contacte a equipa de suporte.' 
      });
    }

    const otpCode = await db.createPasswordResetOtp(user.email);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'auth',
      entityId: user.id,
      details: `Código de reposição de senha solicitado para o utilizador ${user.email}`
    });

    return res.json({
      success: true,
      message: `Código de verificação gerado e enviado para ${user.email}. Válido por 15 minutos.`,
      emailMasked: user.email.replace(/(.{2})(.*)(?=@)/, (_gp1, h, t) => h + '*'.repeat(t.length)),
      devOtpPreview: otpCode // Exibe código na resposta para facilidade de testes em desenvolvimento
    });
  } catch (err: any) {
    console.error('Erro no pedido de reposição de senha:', err);
    return res.status(500).json({ error: 'Erro interno ao processar pedido de reposição de senha.' });
  }
});

// =========================================================================
// 3.2 REPOSIÇÃO DE SENHA - DEFINIÇÃO DE NOVA PALAVRA-PASSE (/api/auth/reset-password)
// =========================================================================
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { identifier, code, newPassword } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'O identificador (e-mail ou NIF) é obrigatório.' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'O código de verificação de 6 dígitos é obrigatório.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    const user = db.findUserByIdentifier(identifier.trim());
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado na base de dados.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Conta inativa ou suspensa.' });
    }

    const isCodeValid = await db.verifyAndConsumePasswordResetOtp(user.email, code);
    if (!isCodeValid) {
      return res.status(400).json({ 
        error: 'Código de verificação inválido, expirado ou já utilizado. Solicite um novo código.' 
      });
    }

    db.updateUserPassword(user.id, newPassword);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'auth',
      entityId: user.id,
      details: `Reposição de palavra-passe concluída com sucesso via Bcrypt Salt 10 para ${user.email}`
    });

    return res.json({
      success: true,
      message: 'Palavra-passe redefinida com sucesso na base de dados! Pode agora iniciar sessão com a sua nova senha.'
    });
  } catch (err: any) {
    console.error('Erro na redefinição de palavra-passe:', err);
    return res.status(500).json({ error: 'Erro ao redefinir a palavra-passe.' });
  }
});

// =========================================================================
// 3.3 CADASTRO E LOGIN RÁPIDO COM GOOGLE OU FACEBOOK (/api/auth/social-login)
// =========================================================================
router.post('/social-login', (req: Request, res: Response) => {
  try {
    const { provider, email, name, companyName, photoUrl } = req.body;

    if (!provider || !['google', 'facebook'].includes(provider)) {
      return res.status(400).json({ error: 'Provedor social inválido. Suportado: google ou facebook.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Endereço de e-mail não fornecido pela conta social.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name?.trim() || cleanEmail.split('@')[0];

    // Verificar se utilizador já existe na base de dados
    let user = db.findUserByEmail(cleanEmail);

    if (user) {
      // Utilizador existente: verificar se está ativo
      if (!user.isActive) {
        return res.status(403).json({ 
          error: 'Esta conta encontra-se suspensa ou inativa na base de dados. Contacte a administração.' 
        });
      }

      // Atualizar data de último login
      db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    } else {
      // Novo cliente: Registar na base de dados com créditos iniciais de boas-vindas
      const settings = db.getSettings();
      const bonusQueries = typeof settings.freeQueriesOnRegister === 'number' ? settings.freeQueriesOnRegister : 10;
      const cleanCompany = companyName?.trim() || `${cleanName} Comercial`;
      const generatedNif = `54${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Gerar password aleatória segura para integridade Bcrypt
      const randomSecret = `social_${Math.random().toString(36).substring(2, 15)}`;
      const passwordHash = bcrypt.hashSync(randomSecret, 10);

      const newUser: User = {
        id: `cli_${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        company: cleanCompany,
        nif: generatedNif,
        email: cleanEmail,
        phone: '+244 923 000 000',
        country: 'Angola',
        passwordHash,
        role: 'client',
        clientCategory: 'comercio',
        isActive: true,
        queriesRemaining: bonusQueries,
        totalQueriesUsed: 0,
        isImportUnlocked: false,
        isBatchUnlocked: false,
        isApiUnlocked: false,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString()
      };

      user = db.addUser(newUser);

      db.addAuditLog({
        userId: newUser.id,
        userName: newUser.name,
        userRole: newUser.role,
        action: 'SOCIAL_REGISTRATION',
        entityType: 'user',
        entityId: newUser.id,
        details: `Novo cliente registado rapidamente via ${provider.toUpperCase()}: ${newUser.email}`
      });
    }

    const token = generateToken(user);

    res.cookie('nanucloud_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SOCIAL_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      details: `Sessão iniciada via ${provider.toUpperCase()}: ${user.email}`
    });

    return res.json({
      success: true,
      message: `Autenticado com sucesso via ${provider === 'google' ? 'Google' : 'Facebook'}!`,
      user: toSafeUser(user),
      token
    });
  } catch (err: any) {
    console.error('Erro no login social:', err);
    return res.status(500).json({ error: 'Erro ao processar autenticação social.' });
  }
});

// =========================================================================
// 4. VERIFICAÇÃO DE SESSÃO ATUAL (/api/auth/me)
// =========================================================================
router.get('/me', authenticateUser, (req: AuthRequest, res: Response) => {
  if (req.user) {
    return res.json({
      authenticated: true,
      user: toSafeUser(req.user)
    });
  }
  return res.json({
    authenticated: false,
    user: null
  });
});

// =========================================================================
// 5. TERMINAR SESSÃO (/api/auth/logout)
// =========================================================================
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('nanucloud_token');
  return res.json({ success: true, message: 'Sessão terminada.' });
});

// =========================================================================
// 6. ALTERAÇÃO DE SENHA COM BCRYPT (/api/auth/change-password)
// =========================================================================
router.post('/change-password', authenticateUser, requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova palavra-passe deve conter pelo menos 6 caracteres.' });
    }

    if (currentPassword) {
      const isCurrentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return res.status(401).json({ error: 'A palavra-passe atual indicada está incorreta.' });
      }
    }

    db.updateUserPassword(user.id, newPassword);

    return res.json({
      success: true,
      message: 'Palavra-passe alterada e encriptada com Bcrypt Salt 10 com sucesso!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao alterar palavra-passe.' });
  }
});

// =========================================================================
// 7. DESCARGA E CONSULTA DO FICHEIRO SQL (/api/auth/sql-schema)
// =========================================================================
router.get('/sql-schema', (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'database.sql');
    if (fs.existsSync(filePath)) {
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      
      // Se solicitada a descarga como ficheiro anexo
      if (req.query.download === 'true') {
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', 'attachment; filename="nanucloud_database.sql"');
        return res.send(sqlContent);
      }

      return res.json({
        filename: 'nanucloud_database.sql',
        schemaVersion: '2.4.0',
        tablesCount: 20,
        supportedEngines: ['PostgreSQL 12+', 'MySQL 8+', 'MariaDB 10.5+', 'Cloud SQL', 'SQLite'],
        encryptionAlgorithm: 'Bcrypt (Salt Rounds = 10)',
        tables: [
          'plans',
          'permission_groups',
          'users',
          'bank_accounts',
          'transactions',
          'manual_payment_validations',
          'simulations',
          'support_tickets',
          'chat_messages',
          'bot_knowledge',
          'unresolved_bot_questions',
          'fiscal_proposals',
          'fiscal_notifications',
          'marketing_campaigns',
          'sms_logs',
          'audit_logs',
          'system_settings',
          'api_keys_and_integrations',
          'database_engine_configs',
          'otp_verification_codes'
        ],
        sqlContent
      });
    } else {
      return res.status(404).json({ error: 'Ficheiro database.sql não encontrado no servidor.' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao ler ficheiro SQL.' });
  }
});

export default router;
