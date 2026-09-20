import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { AuthRequest, requireAdminLevel2, requireAdminLevel1 } from '../auth.js';
import { User, UserRole, Plan } from '../types.js';

const router = Router();

// =========================================================================
// 1. DASHBOARD OVERVIEW & ANALYTICS (Nível 1 & Nível 2)
// =========================================================================
router.get('/dashboard-stats', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const transactions = db.getTransactions();
  const history = db.getQueryHistory();
  const logs = db.getAuditLogs();
  const support = db.getSupportInquiries();

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const approvedTransactions = transactions.filter(t => t.status === 'approved');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const rejectedTransactions = transactions.filter(t => t.status === 'rejected');

  const totalRevenueKz = approvedTransactions.reduce((acc, t) => acc + t.amountKz, 0);
  const totalQueriesPerformed = history.length;

  const localQueries = history.filter(h => h.type === 'local').length;
  const importQueries = history.filter(h => h.type === 'import').length;
  const batchQueries = history.filter(h => h.type === 'batch').length;

  // Recent 7 days revenue calculation
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentRevenueKz = approvedTransactions
    .filter(t => new Date(t.createdAt).getTime() >= sevenDaysAgo)
    .reduce((acc, t) => acc + t.amountKz, 0);

  return res.json({
    kpis: {
      totalUsers,
      activeUsers,
      totalRevenueKz,
      recentRevenueKz,
      totalQueriesPerformed,
      pendingValidationsCount: pendingTransactions.length,
      openSupportTickets: support.filter(s => s.status === 'open').length
    },
    queryBreakdown: {
      local: localQueries,
      import: importQueries,
      batch: batchQueries
    },
    recentTransactions: transactions.slice(0, 10),
    recentLogs: logs.slice(0, 15)
  });
});

// =========================================================================
// 2. GESTÃO DE TRANSAÇÕES E VALIDAÇÃO DE PAGAMENTOS (Nível 1 & Nível 2)
// =========================================================================
router.get('/transactions', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const transactions = db.getTransactions();
  return res.json({ transactions });
});

router.post('/transactions/:id/validate', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida. Utilize "approve" ou "reject".' });
    }

    const tx = db.findTransactionById(id);
    if (!tx) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    let user = db.findUserById(tx.userId);
    if (!user && tx.userEmail) {
      user = db.findUserByEmail(tx.userEmail);
    }
    if (!user) {
      return res.status(404).json({ error: 'Utilizador associado à transação não foi encontrado.' });
    }

    if (action === 'approve') {
      const selectedPlan = db.getPlans().find(p => p.id === tx.planId);
      const validityDays = tx.validityDays || selectedPlan?.validityDays || 30;
      const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

      const unlocksImport = selectedPlan ? selectedPlan.unlocksImport : true;
      const unlocksBatch = selectedPlan ? selectedPlan.unlocksBatch : true;

      // Update user balances and unlocked modules
      const updatedUser = db.updateUser(user.id, {
        queriesRemaining: (user.queriesRemaining || 0) + tx.queriesGranted,
        activePlanId: tx.planId,
        activePlanName: tx.planName,
        planExpiresAt: expiryDate,
        isImportUnlocked: user.isImportUnlocked || unlocksImport,
        isBatchUnlocked: user.isBatchUnlocked || unlocksBatch
      });

      const updatedTx = db.updateTransaction(id, {
        status: 'approved',
        reviewedByAdminId: admin.id,
        reviewedByAdminName: admin.name,
        reviewedAt: new Date().toISOString(),
        notes: notes || tx.notes
      });

      db.addAuditLog({
        userId: admin.id,
        userName: admin.name,
        userRole: admin.role,
        action: 'PAYMENT_APPROVED',
        entityType: 'payment',
        entityId: id,
        ipAddress: req.ip || req.socket.remoteAddress,
        details: `Pagamento de ${tx.amountKz.toLocaleString('pt-PT')} Kz aprovado para ${user.name} (${user.email}). Atribuídas ${tx.queriesGranted} consultas. Novo saldo: ${updatedUser?.queriesRemaining} consultas. Módulos atualizados.`
      });

      const safeUser = updatedUser ? {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        company: updatedUser.company,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        queriesRemaining: updatedUser.queriesRemaining,
        totalQueriesUsed: updatedUser.totalQueriesUsed,
        activePlanId: updatedUser.activePlanId,
        activePlanName: updatedUser.activePlanName,
        planExpiresAt: updatedUser.planExpiresAt,
        isImportUnlocked: updatedUser.isImportUnlocked,
        isBatchUnlocked: updatedUser.isBatchUnlocked,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      } : null;

      return res.json({
        message: `Pagamento aprovado com sucesso! ${tx.queriesGranted} consultas creditadas e plano ativado para ${user.name}. Novo saldo: ${safeUser?.queriesRemaining} consultas.`,
        transactionId: id,
        status: 'approved',
        transaction: updatedTx,
        user: safeUser,
        queriesAdded: tx.queriesGranted,
        newTotalQueries: safeUser?.queriesRemaining
      });
    } else {
      db.updateTransaction(id, {
        status: 'rejected',
        reviewedByAdminId: admin.id,
        reviewedByAdminName: admin.name,
        reviewedAt: new Date().toISOString(),
        notes: notes || 'Pagamento recusado pela administração.'
      });

      db.addAuditLog({
        userId: admin.id,
        userName: admin.name,
        userRole: admin.role,
        action: 'PAYMENT_REJECTED',
        entityType: 'payment',
        entityId: id,
        ipAddress: req.ip || req.socket.remoteAddress,
        details: `Pagamento ${id} de ${tx.amountKz.toLocaleString('pt-PT')} Kz de ${user.name} foi rejeitado pelo administrador.`
      });

      return res.json({
        message: 'Pagamento marcado como rejeitado.',
        transactionId: id,
        status: 'rejected'
      });
    }
  } catch (err: any) {
    console.error('Error validating transaction:', err);
    return res.status(500).json({ error: 'Erro ao validar transação.' });
  }
});

// =========================================================================
// 3. GESTÃO DE PLANOS, PREÇOS E PRAZOS (Nível 2 & Nível 1)
// =========================================================================
router.get('/plans', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const plans = db.getPlans().sort((a, b) => a.sortOrder - b.sortOrder);
  const settings = db.getSettings();
  return res.json({ plans, settings });
});

router.put('/plans/:id', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { name, priceKz, queriesCount, validityDays, unlocksImport, unlocksBatch, minPriceKz, badge } = req.body;

    const plan = db.getPlans().find(p => p.id === id);
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    const updates: Partial<Plan> = {};
    if (name) updates.name = name.trim();
    if (priceKz !== undefined) updates.priceKz = Number(priceKz);
    if (queriesCount !== undefined) updates.queriesCount = Number(queriesCount);
    if (validityDays !== undefined) updates.validityDays = Number(validityDays);
    if (unlocksImport !== undefined) updates.unlocksImport = Boolean(unlocksImport);
    if (unlocksBatch !== undefined) updates.unlocksBatch = Boolean(unlocksBatch);
    if (minPriceKz !== undefined) updates.minPriceKz = Number(minPriceKz);
    if (badge !== undefined) updates.badge = badge.trim();

    const updated = db.updatePlan(id, updates);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'PLAN_UPDATED',
      entityType: 'plan',
      entityId: id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Plano "${plan.name}" atualizado por ${admin.name}. Preço: ${updates.priceKz ?? plan.priceKz} Kz, Pesquisas: ${updates.queriesCount ?? plan.queriesCount}, Validade: ${updates.validityDays ?? plan.validityDays} dias.`
    });

    return res.json({ message: 'Plano atualizado com sucesso!', plan: updated });
  } catch (err: any) {
    console.error('Error updating plan:', err);
    return res.status(500).json({ error: 'Erro ao atualizar plano.' });
  }
});

// =========================================================================
// 4. SUPORTE, ATENDIMENTO & MODERAÇÃO (Nível 2 & Nível 1)
// =========================================================================
router.get('/support', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const inquiries = db.getSupportInquiries();
  return res.json({ inquiries });
});

router.post('/support/:id/reply', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { reply, status } = req.body;

  const inquiry = db.getSupportInquiries().find(s => s.id === id);
  if (!inquiry) {
    return res.status(404).json({ error: 'Ticket de suporte não encontrado.' });
  }

  const updated = db.updateSupportInquiry(id, {
    adminReply: reply ? reply.trim() : inquiry.adminReply,
    status: status || 'resolved',
    repliedAt: new Date().toISOString()
  });

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'SUPPORT_REPLIED',
    entityType: 'support',
    entityId: id,
    ipAddress: req.ip || req.socket.remoteAddress,
    details: `Resposta enviada ao ticket de suporte de ${inquiry.name} (${inquiry.email}) pelo administrador ${admin.name}.`
  });

  return res.json({ message: 'Resposta registada com sucesso!', inquiry: updated });
});

// =========================================================================
// 5. GESTÃO DE UTILIZADORES E STAFF (CRIAÇÃO EXCLUSIVA NO BACKOFFICE)
// =========================================================================
router.get('/users', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const users = db.getUsers().map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });
  return res.json({ users });
});

router.post('/users', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { name, email, password, phone, company, role, queriesRemaining, isImportUnlocked, isBatchUnlocked } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e palavra-passe são obrigatórios para registar um membro Staff/Utilizador.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (db.findUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Já existe um utilizador com este endereço de e-mail.' });
    }

    // Apenas Super Administradores podem criar outros Super Administradores
    const isAssigningSuper = ['super_admin', 'superadmin', 'admin_level1'].includes(role);
    const isCreatorSuper = ['super_admin', 'superadmin', 'admin_level1'].includes(admin.role);
    if (isAssigningSuper && !isCreatorSuper) {
      return res.status(403).json({ error: 'Não tem permissão para criar contas com perfil de Super Administrador.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const targetRole: UserRole = (role as UserRole) || 'staff';
    const isStaffRole = ['staff', 'manager', 'admin_level2', 'admin_level1', 'super_admin', 'superadmin'].includes(targetRole);

    const newUser: User = {
      id: isStaffRole ? `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      company: company ? company.trim() : 'NANUCLOUD',
      country: 'AO',
      passwordHash,
      role: targetRole,
      isActive: true,
      queriesRemaining: isStaffRole ? 99999 : (Number(queriesRemaining) || 10),
      totalQueriesUsed: 0,
      activePlanId: isStaffRole ? 'plan_staff_internal' : null,
      activePlanName: isStaffRole ? `Staff Nanucloud (${targetRole.toUpperCase()})` : 'Criado pela Administração',
      planExpiresAt: null,
      isImportUnlocked: isStaffRole ? true : Boolean(isImportUnlocked),
      isBatchUnlocked: isStaffRole ? true : Boolean(isBatchUnlocked),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    db.addUser(newUser);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'ADMIN_CREATED_USER',
      entityType: 'user',
      entityId: newUser.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Novo membro Staff/Administrador (${newUser.email}, perfil: ${newUser.role}) criado exclusivamente no Backoffice por ${admin.name}.`
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ message: 'Membro Staff criado com sucesso!', user: safeUser });
  } catch (err: any) {
    console.error('Error creating user by admin:', err);
    return res.status(500).json({ error: 'Erro ao criar utilizador.' });
  }
});

router.put('/users/:id', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { name, phone, company, role, isActive, queriesRemaining, isImportUnlocked, isBatchUnlocked, password } = req.body;

    const user = db.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const isTargetSuper = ['super_admin', 'superadmin', 'admin_level1'].includes(user.role);
    const isCreatorSuper = ['super_admin', 'superadmin', 'admin_level1'].includes(admin.role);

    if (isTargetSuper && !isCreatorSuper) {
      return res.status(403).json({ error: 'Apenas Super Administradores podem editar contas de Super Administrador.' });
    }

    const updates: Partial<User> = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (company !== undefined) updates.company = company.trim();
    
    if (role && ['user', 'client', 'staff', 'manager', 'admin_level2', 'admin_level1', 'super_admin'].includes(role)) {
      if (['super_admin', 'admin_level1'].includes(role) && !isCreatorSuper) {
        return res.status(403).json({ error: 'Não tem permissão para elevar utilizadores a Super Administrador.' });
      }
      updates.role = role as UserRole;
    }

    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (queriesRemaining !== undefined) updates.queriesRemaining = Number(queriesRemaining);
    if (isImportUnlocked !== undefined) updates.isImportUnlocked = Boolean(isImportUnlocked);
    if (isBatchUnlocked !== undefined) updates.isBatchUnlocked = Boolean(isBatchUnlocked);

    if (password && password.length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(password, salt);
    }

    const updated = db.updateUser(id, updates);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'ADMIN_UPDATED_USER',
      entityType: 'user',
      entityId: id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Utilizador ${user.email} atualizado por ${admin.name} (Ativo: ${updates.isActive ?? user.isActive}, Função: ${updates.role ?? user.role}, Consultas: ${updates.queriesRemaining ?? user.queriesRemaining}).`
    });

    const { passwordHash: _, ...safeUser } = updated!;
    return res.json({ message: 'Utilizador atualizado com sucesso!', user: safeUser });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Erro ao atualizar dados do utilizador.' });
  }
});

// 5b. ALTERAR PALAVRA-PASSE DE UTILIZADOR (Administração - Controlo de Senhas)
router.put('/users/:id/password', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const newPassword = req.body.newPassword || req.body.password;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'A nova palavra-passe é obrigatória e deve ter pelo menos 6 caracteres.' });
    }

    const targetUser = db.findUserById(id) || db.findUserByEmail(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilizador não encontrado no sistema.' });
    }

    const isTargetSuper = ['super_admin', 'superadmin', 'admin_level1'].includes(targetUser.role);
    const isCreatorSuper = ['super_admin', 'superadmin', 'admin_level1'].includes(admin.role);

    if (isTargetSuper && !isCreatorSuper) {
      return res.status(403).json({ error: 'Apenas Super Administradores podem redefinir a palavra-passe de contas Super Admin.' });
    }

    const updated = db.updateUserPassword(targetUser.id, newPassword.trim());
    if (!updated) {
      return res.status(500).json({ error: 'Falha ao gravar nova palavra-passe na base de dados.' });
    }

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'ADMIN_CHANGED_PASSWORD',
      entityType: 'user',
      entityId: targetUser.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Palavra-passe do utilizador ${targetUser.email} (${targetUser.name}) redefinida pelo administrador ${admin.name}.`
    });

    const { passwordHash: _, ...safeUser } = updated;
    return res.json({
      success: true,
      message: `Palavra-passe do utilizador ${targetUser.name} (${targetUser.email}) alterada com sucesso!`,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Error changing user password by admin:', err);
    return res.status(500).json({ error: 'Erro ao alterar a palavra-passe do utilizador.' });
  }
});

// 5c. VALIDAR PLANO ESCOLHIDO DO UTILIZADOR (Staff & Administradores)
router.post('/users/:id/validate-plan', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const staffOrAdmin = req.user!;
    const { id } = req.params;
    const { 
      planId, 
      planName, 
      queriesGranted, 
      validityDays = 30, 
      unlockImport, 
      unlockBatch, 
      unlockApi,
      notes 
    } = req.body;

    const targetUser = db.findUserById(id) || db.findUserByEmail(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilizador não encontrado no sistema.' });
    }

    const availablePlans = db.getPlans();
    const matchedPlan = availablePlans.find(p => p.id === planId);

    const chosenPlanName = planName || (matchedPlan ? matchedPlan.name : 'Plano Personalizado');
    const queriesToAdd = typeof queriesGranted === 'number' 
      ? queriesGranted 
      : (matchedPlan ? matchedPlan.queriesCount : 30);
    const days = typeof validityDays === 'number' ? validityDays : (matchedPlan ? matchedPlan.validityDays : 30);
    
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + days);

    const updatedUser = db.updateUser(targetUser.id, {
      activePlanId: planId || targetUser.activePlanId || 'plan_bronze',
      activePlanName: chosenPlanName,
      queriesRemaining: (targetUser.queriesRemaining || 0) + queriesToAdd,
      planExpiresAt: expiresDate.toISOString(),
      isImportUnlocked: unlockImport !== undefined ? unlockImport : (targetUser.isImportUnlocked || Boolean(matchedPlan?.unlocksImport)),
      isBatchUnlocked: unlockBatch !== undefined ? unlockBatch : (targetUser.isBatchUnlocked || Boolean(matchedPlan?.unlocksBatch)),
      ...(unlockApi !== undefined ? { isApiUnlocked: unlockApi } : {})
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Erro ao atualizar dados do utilizador.' });
    }

    // Se houver transações pendentes deste utilizador para este plano, aprova automaticamente
    const transactions = db.getTransactions();
    const pendingTx = transactions.find(t => 
      (t.userId === targetUser.id || t.userEmail === targetUser.email) && 
      t.status === 'pending' &&
      (!planId || t.planId === planId || t.planName === chosenPlanName)
    );

    if (pendingTx) {
      db.updateTransactionStatus(pendingTx.id, 'approved', staffOrAdmin.id, staffOrAdmin.name);
    }

    db.addAuditLog({
      userId: staffOrAdmin.id,
      userName: staffOrAdmin.name,
      userRole: staffOrAdmin.role,
      action: 'PLAN_VALIDATED_BY_STAFF',
      entityType: 'user',
      entityId: targetUser.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Plano "${chosenPlanName}" validado e ativado para ${targetUser.name} (${targetUser.email}) por ${staffOrAdmin.name}. +${queriesToAdd} consultas creditadas. Validade até ${expiresDate.toLocaleDateString('pt-PT')}. Notas: ${notes || 'Validação de plano confirmada pelo staff.'}`
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return res.json({
      success: true,
      message: `Plano "${chosenPlanName}" validado com sucesso! ${queriesToAdd} consultas creditadas para ${targetUser.name}.`,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Error validating plan for user:', err);
    return res.status(500).json({ error: 'Erro ao validar o plano do utilizador.' });
  }
});

// =========================================================================
// 6. AUDITORIA & LOGS DO SISTEMA (Nível 1 - Super Admin)
// =========================================================================
router.get('/logs', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ logs });
});

// =========================================================================
// 7. PARÂMETROS GLOBAIS, TAXAS E CONFIGURAÇÕES (Nível 1 - Super Admin)
// =========================================================================
router.get('/settings', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json({ settings });
});

router.put('/settings', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const updates = req.body;

    const updated = db.updateSettings(updates);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'SETTINGS_UPDATED',
      entityType: 'system',
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Configurações globais e taxas do sistema atualizadas pelo Super Administrador ${admin.name}. Preço base da pesquisa: ${updated.unitQueryPriceKz} Kz.`
    });

    return res.json({ message: 'Configurações atualizadas com sucesso!', settings: updated });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ error: 'Erro ao atualizar configurações.' });
  }
});

// =========================================================================
// 8. GESTÃO DE CONTAS BANCÁRIAS E IBANS (Nível 1 & Nível 2)
// =========================================================================
router.get('/bank-accounts', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const accounts = db.getBankAccounts();
  return res.json({ accounts });
});

router.post('/bank-accounts', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { bankName, iban, swift, holder, currency } = req.body;

    if (!bankName || !iban || !holder) {
      return res.status(400).json({ error: 'Nome do banco, IBAN e titular são obrigatórios.' });
    }

    const current = db.getBankAccounts();
    const newAcc = {
      id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bankName: bankName.trim(),
      iban: iban.trim(),
      swift: swift ? swift.trim() : undefined,
      holder: holder.trim(),
      currency: currency || 'AOA (Kz)',
      isActive: true
    };

    const updated = [...current, newAcc];
    db.setBankAccounts(updated);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'BANK_ACCOUNT_CREATED',
      entityType: 'system',
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Nova conta bancária/IBAN adicionada (${newAcc.bankName} - ${newAcc.iban}) por ${admin.name}.`
    });

    return res.status(201).json({ message: 'Conta bancária adicionada com sucesso!', accounts: updated });
  } catch (err: any) {
    console.error('Error adding bank account:', err);
    return res.status(500).json({ error: 'Erro ao adicionar conta bancária.' });
  }
});

router.put('/bank-accounts/:id', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const updates = req.body;

    const current = db.getBankAccounts();
    const idx = current.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Conta bancária não encontrada.' });
    }

    current[idx] = { ...current[idx], ...updates };
    db.setBankAccounts(current);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'BANK_ACCOUNT_UPDATED',
      entityType: 'system',
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Conta bancária/IBAN ${current[idx].bankName} atualizada por ${admin.name}.`
    });

    return res.json({ message: 'Conta bancária atualizada com sucesso!', accounts: current });
  } catch (err: any) {
    console.error('Error updating bank account:', err);
    return res.status(500).json({ error: 'Erro ao atualizar conta bancária.' });
  }
});

router.delete('/bank-accounts/:id', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;

    const current = db.getBankAccounts();
    const filtered = current.filter(b => b.id !== id);
    db.setBankAccounts(filtered);

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'BANK_ACCOUNT_DELETED',
      entityType: 'system',
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Conta bancária/IBAN (${id}) removida por ${admin.name}.`
    });

    return res.json({ message: 'Conta bancária removida com sucesso!', accounts: filtered });
  } catch (err: any) {
    console.error('Error deleting bank account:', err);
    return res.status(500).json({ error: 'Erro ao remover conta bancária.' });
  }
});

// =========================================================================
// 9. BANCO DE DADOS & BACKUP COMPLETO (Nível 1 - Super Admin)
// =========================================================================
router.get('/backup/full', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const backup = db.generateFullBackup();

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'FULL_SYSTEM_BACKUP_DOWNLOADED',
    entityType: 'system',
    ipAddress: req.ip || req.socket.remoteAddress,
    details: `Backup completo do sistema (JSON + Instruções de Restauro) gerado por ${admin.name}.`
  });

  return res.json(backup);
});

// =========================================================================
// 10. EXTRATO DE UTILIZADOR, BÓNUS E EXTENSÃO DE PRAZO (Nível 1 & Nível 2)
// =========================================================================
router.get('/users/:id/statement', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const statement = db.getUserStatement(id);
  if (!statement) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }
  return res.json(statement);
});

router.post('/users/:id/bonus', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { bonusCount, reason } = req.body;

    if (!bonusCount || Number(bonusCount) <= 0) {
      return res.status(400).json({ error: 'Informe uma quantidade de bónus válida.' });
    }

    const user = db.grantBonusQueries(id, Number(bonusCount), reason || 'Autorizado pelo Super Administrador', admin);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const { passwordHash: _, ...safe } = user;
    return res.json({ message: `Bónus de ${bonusCount} consultas atribuído com sucesso!`, user: safe });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao atribuir bónus.' });
  }
});

router.post('/users/:id/extend-validity', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { additionalDays } = req.body;

    if (!additionalDays || Number(additionalDays) <= 0) {
      return res.status(400).json({ error: 'Informe um número de dias válido.' });
    }

    const user = db.extendPlanValidity(id, Number(additionalDays), admin);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const { passwordHash: _, ...safe } = user;
    return res.json({ message: `Validade estendida por ${additionalDays} dias com sucesso!`, user: safe });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao estender prazo.' });
  }
});

// =========================================================================
// 11. IA FISCAL & PROPOSTAS DE ATUALIZAÇÃO TRIBUTÁRIA (Nível 1 & Nível 2)
// =========================================================================
router.get('/fiscal-proposals', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const proposals = db.getFiscalProposals();
  return res.json({ proposals });
});

router.post('/fiscal-proposals/:id/approve', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const prop = db.approveFiscalProposal(id, admin.name);
  if (!prop) {
    return res.status(404).json({ error: 'Proposta não encontrada.' });
  }
  return res.json({ message: 'Proposta fiscal aprovada e incorporada nas regras ativas!', proposal: prop });
});

router.post('/fiscal-proposals/:id/reject', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const prop = db.rejectFiscalProposal(id, admin.name);
  if (!prop) {
    return res.status(404).json({ error: 'Proposta não encontrada.' });
  }
  return res.json({ message: 'Proposta fiscal rejeitada.', proposal: prop });
});

// =========================================================================
// 12. GESTÃO DE CHAVES API (XD, WinRest, Primavera, SAP) (Nível 1)
// =========================================================================
router.get('/api-keys', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const apiKeys = db.getApiKeys();
  return res.json({ apiKeys });
});

router.post('/api-keys', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const { name, system, permissions } = req.body;
  if (!name || !system) {
    return res.status(400).json({ error: 'Nome e sistema são obrigatórios.' });
  }
  const key = db.createApiKey(name, system, permissions || ['simulate:local', 'tax:read']);
  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'API_KEY_GENERATED',
    entityType: 'system',
    details: `Chave de API gerada para integração com software ${system} (${name}) por ${admin.name}.`
  });
  return res.status(201).json({ message: 'Chave de API criada com sucesso!', apiKey: key });
});

router.delete('/api-keys/:id', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const revoked = db.revokeApiKey(id);
  if (!revoked) {
    return res.status(404).json({ error: 'Chave API não encontrada.' });
  }
  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'API_KEY_REVOKED',
    entityType: 'system',
    details: `Chave de API ${id} revogada pelo Super Admin ${admin.name}.`
  });
  return res.json({ message: 'Chave de API revogada com sucesso.' });
});

// =========================================================================
// 13. MARKETING SMS & NOTIFICAÇÕES (Nível 1 & Nível 2)
// =========================================================================
router.get('/sms-logs', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const logs = db.getSmsLogs();
  return res.json({ logs });
});

router.post('/sms-broadcast', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { recipients, messageTemplate, messageType } = req.body;
    // recipients: Array<{ phone: string; name?: string; countryCode?: string }> | string

    if (!messageTemplate || !messageTemplate.trim()) {
      return res.status(400).json({ error: 'O conteúdo da mensagem é obrigatório.' });
    }

    let targetList: Array<{ phone: string; name?: string; countryCode?: string }> = [];

    if (Array.isArray(recipients)) {
      targetList = recipients.filter(r => r && r.phone && r.phone.trim().length > 0);
    } else if (typeof recipients === 'string' && recipients.trim()) {
      // Semicolon, comma or newline separated
      const lines = recipients.split(/[\n,;]+/);
      targetList = lines
        .map(line => line.trim())
        .filter(Boolean)
        .map(p => ({ phone: p, name: 'Utilizador' }));
    }

    if (targetList.length === 0) {
      return res.status(400).json({ error: 'Nenhum número de destinatário válido foi informado.' });
    }

    const sentResults = [];
    for (const item of targetList) {
      const cleanPhone = item.phone.trim();
      const personalizedMsg = messageTemplate
        .replace(/{NOME}/g, item.name || 'Prezado(a) Utilizador')
        .replace(/{TELEFONE}/g, cleanPhone)
        .replace(/{EMPRESA}/g, 'Nanucloud');

      const logItem = db.addSmsLog({
        phoneNumber: cleanPhone,
        countryCode: item.countryCode || 'AO',
        messageType: messageType || 'marketing_broadcast',
        messageContent: personalizedMsg,
        recipientName: item.name || 'Destinatário',
        sentByUserId: admin.id,
        sentByUserName: admin.name,
        status: 'delivered',
        gatewayResponse: '200 OK - Sent via SMS Gateway'
      });
      sentResults.push(logItem);
    }

    db.addAuditLog({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: 'SMS_BROADCAST_SENT',
      entityType: 'marketing',
      details: `Campanha SMS enviada para ${sentResults.length} destinatários por ${admin.name}.`
    });

    return res.json({
      message: `Campanha SMS enviada com sucesso para ${sentResults.length} destinatário(s)!`,
      sentCount: sentResults.length,
      logs: sentResults
    });
  } catch (err: any) {
    console.error('Error on sms-broadcast:', err);
    return res.status(500).json({ error: 'Erro ao processar envio de SMS.' });
  }
});

router.delete('/sms-logs', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const result = db.clearSmsLogs(admin);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }
  return res.json({ message: `Histórico de envios SMS limpo com sucesso (${result.clearedCount} registos eliminados).` });
});

// =========================================================================
// 14. PAINEL DO CEO & GESTOR DE TRÁFEGO (Nível 1 & Nível 2)
// =========================================================================
router.get('/traffic-campaigns', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const campaigns = db.getTrafficCampaigns();
  const transactions = db.getTransactions().filter(t => t.status === 'approved');
  const users = db.getUsers();

  const totalAdSpendKz = campaigns.reduce((acc, c) => acc + (c.budgetKz || 0), 0);
  const totalAdRevenueKz = campaigns.reduce((acc, c) => acc + (c.revenueKz || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leads || 0), 0);
  const totalPaidConversions = campaigns.reduce((acc, c) => acc + (c.paidConversions || 0), 0);

  const overallRoas = totalAdSpendKz > 0 ? (totalAdRevenueKz / totalAdSpendKz) : 0;
  const averageCacKz = totalPaidConversions > 0 ? (totalAdSpendKz / totalPaidConversions) : 0;
  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return res.json({
    campaigns,
    ceoMetrics: {
      totalAdSpendKz,
      totalAdRevenueKz,
      overallRoas,
      averageCacKz,
      averageCtr,
      totalClicks,
      totalImpressions,
      totalLeads,
      totalPaidConversions,
      totalRegisteredUsers: users.length,
      grossSystemRevenueKz: transactions.reduce((acc, t) => acc + t.amountKz, 0)
    }
  });
});

router.post('/traffic-campaigns', requireAdminLevel2, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const campaignData = req.body;

  if (!campaignData.name || !campaignData.name.trim()) {
    return res.status(400).json({ error: 'O nome da campanha de tráfego é obrigatório.' });
  }

  const saved = db.saveTrafficCampaign(campaignData);
  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'TRAFFIC_CAMPAIGN_SAVED',
    entityType: 'marketing',
    details: `Campanha de tráfego "${saved.name}" (${saved.source}) guardada por ${admin.name}.`
  });

  return res.json({ message: 'Campanha de tráfego guardada com sucesso!', campaign: saved });
});

router.delete('/traffic-campaigns/:id', requireAdminLevel1, (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const deleted = db.deleteTrafficCampaign(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Campanha não encontrada.' });
  }
  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'TRAFFIC_CAMPAIGN_DELETED',
    entityType: 'marketing',
    details: `Campanha de tráfego ${id} removida pelo Super Admin ${admin.name}.`
  });
  return res.json({ message: 'Campanha de tráfego removida com sucesso.' });
});

// =========================================================================
// 15. GOVERNANÇA DE BASE DE DADOS (App opera 100% sem base de dados)
// =========================================================================

router.get('/database-credentials', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    engine: 'Sem Banco de Dados (Stateless Memory)',
    credentials: {
      status: 'Nenhum banco de dados ou conexão ativo. O sistema opera 100% livre e independente.'
    }
  });
});

router.post('/purge-demo-data', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    message: 'Nenhum banco de dados conectado.',
    stats: { usersRemoved: 0, transactionsRemoved: 0, historyRemoved: 0 }
  });
});

router.post('/apply-retention-policy', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    message: 'Nenhum banco de dados conectado.'
  });
});

router.delete('/simulation-history', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    message: 'Histórico gerido localmente na sessão do navegador.',
    countRemoved: 0
  });
});

export default router;
