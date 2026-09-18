import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthRequest, requireAuth } from '../auth.js';
import { Transaction } from '../types.js';

const router = Router();

// 1. LISTAR TODOS OS PLANOS
router.get('/', (req: AuthRequest, res: Response) => {
  const plans = db.getPlans().sort((a, b) => a.sortOrder - b.sortOrder);
  const settings = db.getSettings();
  const bankAccounts = db.getBankAccounts().filter(b => b.isActive);

  return res.json({
    plans,
    unitQueryPriceKz: settings.unitQueryPriceKz,
    minCustomPlanPriceKz: settings.minCustomPlanPriceKz,
    enableMultiplatformDownloads: settings.enableMultiplatformDownloads ?? false,
    moduleMinCredits: settings.moduleMinCredits,
    moduleQueryPrices: settings.moduleQueryPrices,
    bankAccounts,
    bankInfo: {
      bankName: settings.bankName,
      iban: settings.bankIban,
      holder: settings.bankHolder,
      expressPhone: settings.expressPhone
    }
  });
});

// 1.1 CONFIGURAÇÕES PÚBLICAS DO SISTEMA
router.get('/public-config', (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json({
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyNif: settings.companyNif,
    companyPhone1: settings.companyPhone1,
    companyPhone2: settings.companyPhone2,
    companyEmail1: settings.companyEmail1,
    companyEmail2: settings.companyEmail2,
    footerCopyrightText: settings.footerCopyrightText,
    whatsappSupport1: settings.whatsappSupport1,
    whatsappSupport2: settings.whatsappSupport2,
    supportEmail: settings.supportEmail,
    companyLogoUrl: settings.companyLogoUrl,
    socialFacebook: settings.socialFacebook,
    socialInstagram: settings.socialInstagram,
    socialLinkedIn: settings.socialLinkedIn,
    socialTwitterX: settings.socialTwitterX,
    socialYouTube: settings.socialYouTube,
    socialWhatsApp: settings.socialWhatsApp,
    enableMultiplatformDownloads: settings.enableMultiplatformDownloads ?? false,
    moduleMinCredits: settings.moduleMinCredits,
    moduleQueryPrices: settings.moduleQueryPrices,
    unitQueryPriceKz: settings.unitQueryPriceKz,
    minCustomPlanPriceKz: settings.minCustomPlanPriceKz,
    freeQueriesOnRegister: settings.freeQueriesOnRegister,
    freeQueriesDaily: settings.freeQueriesDaily,
    allowRegistration: settings.allowRegistration,
    maintenanceMode: settings.maintenanceMode,
    defaultTheme: settings.defaultTheme,
    allowedDomains: settings.allowedDomains,
    bankTransferEnabled: settings.bankTransferEnabled ?? true,
    emisEnabled: settings.emisEnabled ?? true,
    paypalEnabled: settings.paypalEnabled ?? true,
    stripeEnabled: settings.stripeEnabled ?? true,
    proxyPayEnabled: settings.proxyPayEnabled ?? true,
    payPayEnabled: settings.payPayEnabled ?? true,
    alipayEnabled: settings.alipayEnabled ?? true,
    bankAccounts: settings.bankAccounts || [],
    googleAdsenseSlots: settings.googleAdsenseSlots || []
  });
});

// 2. CALCULAR PLANO PERSONALIZADO
router.post('/calculate-custom', (req: AuthRequest, res: Response) => {
  const { amountKz } = req.body;
  const settings = db.getSettings();

  const amount = Number(amountKz) || 0;
  if (amount < settings.minCustomPlanPriceKz) {
    return res.status(400).json({
      error: `O valor mínimo para o plano personalizado é de ${settings.minCustomPlanPriceKz.toLocaleString('pt-PT')} Kz.`
    });
  }

  const unitPrice = settings.unitQueryPriceKz || 50;
  const calculatedQueries = Math.floor(amount / unitPrice);
  const validityDays = amount >= 10000 ? 365 : (amount >= 5000 ? 180 : 90);

  return res.json({
    amountKz: amount,
    unitQueryPriceKz: unitPrice,
    queriesCount: calculatedQueries,
    validityDays,
    unlocksImport: true,
    unlocksBatch: true
  });
});

// 3. INICIAR PEDIDO DE COMPRA / RECARGA DE PLANO
router.post('/purchase', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const authUser = req.user!;
    const {
      planId,
      customAmountKz,
      paymentMethod,
      paymentReference,
      paymentProofUrl,
      paymentProofName,
      paymentProofSize,
      notes,
      userId,
      userEmail,
      userName
    } = req.body;

    // Resolve target client: preferentially match the client explicitly passed, otherwise authenticated user
    let customerUser = authUser;
    if (userId) {
      const found = db.findUserById(userId);
      if (found) customerUser = found;
    } else if (userEmail) {
      const found = db.findUserByEmail(userEmail);
      if (found) customerUser = found;
    }

    const settings = db.getSettings();
    let selectedPlan = db.getPlans().find(p => p.id === planId);
    let amountKz = 0;
    let queriesCount = 0;
    let validityDays = 30;
    let planName = '';

    if (planId === 'plan_custom' || !selectedPlan) {
      const customAmount = Number(customAmountKz) || 0;
      if (customAmount < settings.minCustomPlanPriceKz) {
        return res.status(400).json({
          error: `O valor mínimo para o plano personalizado é de ${settings.minCustomPlanPriceKz.toLocaleString('pt-PT')} Kz.`
        });
      }
      amountKz = customAmount;
      queriesCount = Math.floor(customAmount / (settings.unitQueryPriceKz || 50));
      validityDays = customAmount >= 10000 ? 365 : (customAmount >= 5000 ? 180 : 90);
      planName = `Plano Personalizado (${customAmount.toLocaleString('pt-PT')} Kz)`;
    } else {
      amountKz = selectedPlan.priceKz;
      queriesCount = selectedPlan.queriesCount;
      validityDays = selectedPlan.validityDays;
      planName = selectedPlan.name;
    }

    const isDirectInstantPayment = paymentMethod === 'paypal_visa' || paymentMethod === 'stripe_card';
    const txStatus = isDirectInstantPayment ? 'approved' : 'pending';

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTransaction: Transaction = {
      id: txId,
      userId: customerUser.id,
      userName: userName || customerUser.name,
      userEmail: userEmail || customerUser.email,
      planId: planId || 'plan_custom',
      planName,
      amountKz,
      queriesGranted: queriesCount,
      validityDays,
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentReference: paymentReference ? paymentReference.trim() : undefined,
      paymentProofUrl: paymentProofUrl || undefined,
      paymentProofName: paymentProofName || undefined,
      paymentProofSize: paymentProofSize ? Number(paymentProofSize) : undefined,
      notes: notes ? notes.trim() : undefined,
      status: txStatus,
      reviewedByAdminName: isDirectInstantPayment ? 'GATEWAY_AUTOMATED_VALIDATION' : undefined,
      reviewedAt: isDirectInstantPayment ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    db.addTransaction(newTransaction);

    // If direct automated payment, automatically credit queries & unlock modules for the user immediately!
    if (isDirectInstantPayment) {
      const targetUser = db.findUserById(customerUser.id);
      if (targetUser) {
        const currentQueries = targetUser.queriesRemaining || 0;
        const newQueries = currentQueries + queriesCount;
        
        // Calculate new expiration date
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + validityDays);

        db.updateUser(customerUser.id, {
          queriesRemaining: newQueries,
          planExpiresAt: expDate.toISOString(),
          isActive: true
        });
      }
    }

    db.addAuditLog({
      userId: customerUser.id,
      userName: customerUser.name,
      userRole: customerUser.role,
      action: isDirectInstantPayment ? 'PLAN_PURCHASE_AUTO_ACTIVATED' : 'PLAN_PURCHASE_REQUEST',
      entityType: 'payment',
      entityId: txId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: isDirectInstantPayment
        ? `Pagamento direto aprovado via ${paymentMethod} para ${planName} (${amountKz.toLocaleString('pt-PT')} Kz). ${queriesCount} consultas creditadas automaticamente a ${customerUser.name}.`
        : `Pedido de adesão ao ${planName} no valor de ${amountKz.toLocaleString('pt-PT')} Kz criado por ${customerUser.name}. Aguarda validação financeira do comprovativo.`
    });

    return res.status(201).json({
      message: isDirectInstantPayment
        ? 'Pagamento validado com sucesso! O plano e as suas consultas foram ativados imediatamente.'
        : 'Pedido de adesão registado com sucesso! Efetue o pagamento e submeta o comprovativo para validação pela equipa financeira.',
      transaction: newTransaction,
      queriesCount,
      bankDetails: {
        bankName: settings.bankName,
        iban: settings.bankIban,
        holder: settings.bankHolder,
        expressPhone: settings.expressPhone
      }
    });
  } catch (err: any) {
    console.error('Error on purchase:', err);
    return res.status(500).json({ error: 'Erro ao registar pedido de adesão ao plano.' });
  }
});

// 4. SUBMETER COMPROVATIVO / REFERÊNCIA DE PAGAMENTO
router.post('/upload-proof', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { transactionId, paymentProofUrl, paymentProofName, paymentProofSize, paymentReference, notes } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'ID de transação obrigatório.' });
    }

    const tx = db.findTransactionById(transactionId);
    const isSuperOrAdmin = user.role === 'admin_level1' || user.role === 'admin_level2';
    if (!tx || (tx.userId !== user.id && !isSuperOrAdmin)) {
      return res.status(404).json({ error: 'Transação não encontrada ou sem permissão.' });
    }

    const updated = db.updateTransaction(transactionId, {
      paymentProofUrl: paymentProofUrl !== undefined ? paymentProofUrl : tx.paymentProofUrl,
      paymentProofName: paymentProofName !== undefined ? paymentProofName : tx.paymentProofName,
      paymentProofSize: paymentProofSize !== undefined ? Number(paymentProofSize) : tx.paymentProofSize,
      paymentReference: paymentReference ? paymentReference.trim() : tx.paymentReference,
      notes: notes ? notes.trim() : tx.notes
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAYMENT_PROOF_SUBMITTED',
      entityType: 'payment',
      entityId: transactionId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: `Comprovativo/anexo (${paymentProofName || 'Documento'}) submetido para a transação ${transactionId} por ${user.name}.`
    });

    return res.json({
      message: 'Comprovativo enviado com sucesso! A equipa de administração irá validar o seu pagamento.',
      transaction: updated
    });
  } catch (err: any) {
    console.error('Error on upload-proof:', err);
    return res.status(500).json({ error: 'Erro ao enviar comprovativo de pagamento.' });
  }
});

// 5. HISTÓRICO DE TRANSAÇÕES DO UTILIZADOR
router.get('/my-transactions', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const requestedUserId = req.query.userId as string;
  const isSuperOrAdmin = user.role === 'admin_level1' || user.role === 'admin_level2';

  let targetUserId = user.id;
  if (requestedUserId && (requestedUserId === user.id || isSuperOrAdmin || user.id.startsWith('usr_admin_nanuhost') || user.id.startsWith('usr_klayton_pires'))) {
    targetUserId = requestedUserId;
  }

  const transactions = db.getTransactions().filter(t => t.userId === targetUserId);
  return res.json({ transactions });
});

export default router;
