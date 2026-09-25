import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

/**
 * 1. WEBHOOK PAYPAL - Ativação Imediata de Planos
 * Suporta PayPal IPN e Webhook Events (ex: PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED, PAYMENT.SALE.COMPLETED)
 */
router.post('/paypal', (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    console.log('🔔 [PayPal Webhook Recebido]:', JSON.stringify(payload).substring(0, 300));

    // Determinar evento ou payload direto
    const eventType = payload.event_type || payload.txn_type || 'PAYMENT.CAPTURE.COMPLETED';
    const resource = payload.resource || payload;

    // Extrair identificadores de transação, plano e utilizador
    const transactionId = 
      resource.custom_id || 
      resource.invoice_id || 
      resource.id || 
      payload.custom || 
      payload.transactionId || 
      payload.orderId || 
      payload.id;

    const userEmail = 
      resource.payer?.email_address || 
      resource.userEmail || 
      payload.payer_email || 
      payload.userEmail || 
      payload.email;

    const planIdCandidate = 
      resource.plan_id || 
      resource.custom_plan_id || 
      payload.planId || 
      payload.item_number;

    const amountVal = Number(
      resource.amount?.value || 
      payload.amount || 
      payload.mc_gross || 
      payload.gross_amount || 
      0
    );

    const rawStatus = (
      resource.status || 
      payload.payment_status || 
      payload.status || 
      'COMPLETED'
    ).toUpperCase();

    // Validar status de liquidação com sucesso no PayPal
    const isApproved = 
      rawStatus === 'COMPLETED' || 
      rawStatus === 'APPROVED' || 
      rawStatus === 'PAID' || 
      rawStatus === 'SUCCESS';

    if (!isApproved) {
      return res.status(200).json({
        received: true,
        status: rawStatus,
        message: `Status do PayPal (${rawStatus}) recebido, aguarda liquidação final para ativação de plano.`
      });
    }

    // 1. Localizar transação na base de dados (por ID ou por referência pendente)
    let tx = transactionId ? db.findTransactionById(transactionId) : undefined;
    if (!tx && userEmail) {
      tx = db.getTransactions().find(t => 
        t.userEmail?.toLowerCase() === userEmail.toLowerCase().trim() && 
        t.status === 'pending'
      );
    }

    // 2. Localizar utilizador no sistema
    let user = tx ? db.findUserById(tx.userId) : undefined;
    if (!user && userEmail) {
      user = db.findUserByEmail(userEmail.trim());
    }
    if (!user && transactionId) {
      // Tentar procurar se o transactionId é um userId
      user = db.findUserById(transactionId);
    }

    if (!user) {
      console.warn('⚠️ [PayPal Webhook]: Utilizador não encontrado para ativação:', { transactionId, userEmail });
      return res.status(404).json({ 
        error: 'Utilizador não encontrado no sistema NANUCLOUD para o e-mail/ID fornecido no Webhook.' 
      });
    }

    // 3. Determinar o plano a ativar
    const allPlans = db.getPlans();
    let selectedPlan = tx ? allPlans.find(p => p.id === tx.planId) : undefined;
    
    if (!selectedPlan && planIdCandidate) {
      selectedPlan = allPlans.find(p => p.id === planIdCandidate || p.name.toLowerCase().includes(String(planIdCandidate).toLowerCase()));
    }
    
    if (!selectedPlan) {
      // Se não encontrou por ID, tentar por valor aproximado ou padrão
      if (amountVal > 0) {
        selectedPlan = allPlans.find(p => Math.abs(p.priceKz - amountVal) < 1000) || allPlans[1] || allPlans[0];
      } else {
        selectedPlan = allPlans[1] || allPlans[0];
      }
    }

    const queriesToGrant = tx?.queriesGranted || selectedPlan?.queriesCount || 50;
    const validityDays = tx?.validityDays || selectedPlan?.validityDays || 30;
    const planName = tx?.planName || selectedPlan?.name || 'Plano PayPal Webhook';
    const planId = tx?.planId || selectedPlan?.id || 'plan_paypal';

    const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    // 4. ATIVAÇÃO IMEDIATA DO PLANO NO UTILIZADOR
    const newBalance = (user.queriesRemaining || 0) + queriesToGrant;
    db.updateUser(user.id, {
      queriesRemaining: newBalance,
      activePlanId: planId,
      activePlanName: planName,
      planExpiresAt: expiryDate,
      isImportUnlocked: true,
      isBatchUnlocked: true,
      isActive: true
    });

    // 5. REGISTAR OU ATUALIZAR TRANSAÇÃO COMO APROVADA
    const currentTxId = tx?.id || `tx_pp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const paymentRef = resource.id || payload.txn_id || `PP-${Date.now()}`;

    if (tx) {
      db.updateTransaction(tx.id, {
        status: 'approved',
        paymentMethod: 'paypal',
        paymentReference: paymentRef,
        reviewedByAdminName: 'PAYPAL_INSTANT_WEBHOOK',
        reviewedAt: new Date().toISOString(),
        notes: `Ativação automática instantânea via Webhook do PayPal (${eventType})`
      });
    } else {
      db.createTransaction({
        id: currentTxId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        planId,
        planName,
        amountKz: amountVal > 0 ? amountVal : (selectedPlan?.priceKz || 3000),
        queriesGranted: queriesToGrant,
        validityDays,
        paymentMethod: 'paypal',
        paymentReference: paymentRef,
        status: 'approved',
        reviewedByAdminName: 'PAYPAL_INSTANT_WEBHOOK',
        reviewedAt: new Date().toISOString(),
        notes: `Criado e liquidado automaticamente via Webhook do PayPal (${eventType})`,
        createdAt: new Date().toISOString()
      });
    }

    // 6. REGISTAR NA TRILHA DE AUDITORIA
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAYMENT_WEBHOOK_PAYPAL_ACTIVATED',
      entityType: 'payment',
      entityId: currentTxId,
      details: `Plano ${planName} ativado com sucesso via PayPal Webhook para ${user.name} (${user.email}). Creditadas +${queriesToGrant} consultas. Novo saldo: ${newBalance} consultas. Expira a: ${expiryDate.split('T')[0]}.`
    });

    console.log(`✅ [PayPal Webhook]: Plano "${planName}" ativado com sucesso para ${user.name}. Saldo: ${newBalance} créditos.`);

    return res.status(200).json({
      success: true,
      message: 'Plano ativado instantaneamente via Webhook PayPal.',
      transactionId: currentTxId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      planName,
      queriesGranted: queriesToGrant,
      newQueriesBalance: newBalance,
      planExpiresAt: expiryDate
    });
  } catch (err: any) {
    console.error('❌ Erro no processamento do Webhook do PayPal:', err);
    return res.status(500).json({ error: 'Erro interno ao processar webhook do PayPal: ' + err.message });
  }
});

/**
 * 2. WEBHOOK EMIS - Multicaixa Express / GPO / Referência Multicaixa Angola
 * Processa notificações de liquidação em tempo real do sistema financeiro de Angola
 */
router.post('/emis', (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    console.log('🔔 [EMIS Multicaixa Webhook Recebido]:', JSON.stringify(payload).substring(0, 300));

    // Campos de notificação EMIS / Multicaixa Express / GPO / SIBS Angola
    const reference = 
      payload.reference || 
      payload.referencia || 
      payload.paymentReference || 
      payload.ref ||
      payload.entityReference;

    const transactionId = 
      payload.transactionId || 
      payload.orderId || 
      payload.txId || 
      payload.id;

    const phone = 
      payload.phone || 
      payload.telefone || 
      payload.expressPhone || 
      payload.mobile;

    const userEmail = 
      payload.userEmail || 
      payload.email || 
      payload.clientEmail;

    const rawStatus = String(
      payload.status || 
      payload.estado || 
      payload.responseCode || 
      payload.code || 
      'PAID'
    ).toUpperCase();

    const amountKz = Number(
      payload.amount || 
      payload.valor || 
      payload.montante || 
      payload.amountKz || 
      0
    );

    // Validação de status de liquidação financeira EMIS
    // Protocolo Bancário Angolano: '00' = Aprovado / Sucesso interbancário
    const isApproved = 
      rawStatus === 'PAID' || 
      rawStatus === 'SUCCESS' || 
      rawStatus === 'APROVADO' || 
      rawStatus === '00' || 
      rawStatus === 'ACCEPTED' || 
      rawStatus === 'CONFIRMED';

    if (!isApproved) {
      return res.status(200).json({
        received: true,
        status: rawStatus,
        message: `Notificação EMIS recebida com estado '${rawStatus}'. Aguarda liquidação interbancária.`
      });
    }

    // 1. Localizar transação na base de dados
    let tx = transactionId ? db.findTransactionById(transactionId) : undefined;
    
    if (!tx && reference) {
      const cleanRef = String(reference).replace(/\s+/g, '').toLowerCase();
      tx = db.getTransactions().find(t => {
        if (!t.paymentReference) return false;
        const cleanExisting = t.paymentReference.replace(/\s+/g, '').toLowerCase();
        return cleanExisting.includes(cleanRef) || cleanRef.includes(cleanExisting);
      });
    }

    if (!tx && phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      tx = db.getTransactions().find(t => 
        t.status === 'pending' && 
        t.paymentReference && 
        t.paymentReference.replace(/\D/g, '').includes(cleanPhone)
      );
    }

    if (!tx && userEmail) {
      tx = db.getTransactions().find(t => 
        t.userEmail?.toLowerCase() === userEmail.toLowerCase().trim() && 
        t.status === 'pending'
      );
    }

    // 2. Localizar utilizador
    let user = tx ? db.findUserById(tx.userId) : undefined;
    if (!user && userEmail) {
      user = db.findUserByEmail(userEmail.trim());
    }
    if (!user && phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      user = db.getUsers().find(u => u.phone && u.phone.replace(/\D/g, '').includes(cleanPhone));
    }

    if (!user) {
      console.warn('⚠️ [EMIS Webhook]: Utilizador não localizado para ativação:', { reference, phone, userEmail });
      return res.status(404).json({ 
        error: 'Utilizador/Transação não encontrados para a notificação de pagamento EMIS.' 
      });
    }

    // 3. Determinar o plano e consultas correspondentes
    const allPlans = db.getPlans();
    let selectedPlan = tx ? allPlans.find(p => p.id === tx.planId) : undefined;
    
    if (!selectedPlan && amountKz > 0) {
      selectedPlan = allPlans.find(p => Math.abs(p.priceKz - amountKz) < 100);
    }
    if (!selectedPlan) {
      selectedPlan = allPlans[0];
    }

    const queriesToGrant = tx?.queriesGranted || selectedPlan?.queriesCount || 30;
    const validityDays = tx?.validityDays || selectedPlan?.validityDays || 30;
    const planName = tx?.planName || selectedPlan?.name || 'Plano Multicaixa Express';
    const planId = tx?.planId || selectedPlan?.id || 'plan_emis';

    const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    // 4. ATIVAÇÃO IMEDIATA DO PLANO NO UTILIZADOR
    const newBalance = (user.queriesRemaining || 0) + queriesToGrant;
    db.updateUser(user.id, {
      queriesRemaining: newBalance,
      activePlanId: planId,
      activePlanName: planName,
      planExpiresAt: expiryDate,
      isImportUnlocked: true,
      isBatchUnlocked: true,
      isActive: true
    });

    // 5. REGISTAR OU ATUALIZAR TRANSAÇÃO
    const currentTxId = tx?.id || `tx_emis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const paymentRef = reference || `MCX-${Date.now().toString().slice(-8)}`;

    if (tx) {
      db.updateTransaction(tx.id, {
        status: 'approved',
        paymentMethod: 'express_ref',
        paymentReference: paymentRef,
        reviewedByAdminName: 'EMIS_MULTICAIXA_WEBHOOK',
        reviewedAt: new Date().toISOString(),
        notes: `Ativação automática via Webhook EMIS (Ref: ${paymentRef})`
      });
    } else {
      db.createTransaction({
        id: currentTxId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        planId,
        planName,
        amountKz: amountKz || (selectedPlan?.priceKz || 1500),
        queriesGranted: queriesToGrant,
        validityDays,
        paymentMethod: 'express_ref',
        paymentReference: paymentRef,
        status: 'approved',
        reviewedByAdminName: 'EMIS_MULTICAIXA_WEBHOOK',
        reviewedAt: new Date().toISOString(),
        notes: `Criado e liquidado automaticamente via Webhook EMIS Multicaixa`,
        createdAt: new Date().toISOString()
      });
    }

    // 6. REGISTAR NA TRILHA DE AUDITORIA
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAYMENT_WEBHOOK_EMIS_ACTIVATED',
      entityType: 'payment',
      entityId: currentTxId,
      details: `Pagamento Multicaixa validado via Webhook EMIS para ${user.name} (Ref: ${paymentRef}). Creditadas +${queriesToGrant} consultas. Novo saldo: ${newBalance} consultas. Expira a: ${expiryDate.split('T')[0]}.`
    });

    console.log(`✅ [EMIS Webhook]: Plano "${planName}" ativado com sucesso para ${user.name} (Ref: ${paymentRef}).`);

    return res.status(200).json({
      success: true,
      message: 'Pagamento EMIS confirmado e plano ativado instantaneamente.',
      transactionId: currentTxId,
      reference: paymentRef,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      planName,
      queriesGranted: queriesToGrant,
      newQueriesBalance: newBalance,
      planExpiresAt: expiryDate
    });
  } catch (err: any) {
    console.error('❌ Erro no processamento do Webhook da EMIS:', err);
    return res.status(500).json({ error: 'Erro interno ao processar webhook da EMIS: ' + err.message });
  }
});

/**
 * 3. WEBHOOK UNIFICADO (PAYPAL / EMIS ROUTER)
 * Permite que um único endpoint receba pagamentos de qualquer gateway
 */
router.post('/payment', (req: Request, res: Response) => {
  const payload = req.body || {};
  const gateway = (payload.gateway || '').toLowerCase();
  
  if (gateway === 'paypal' || payload.payer_email || payload.event_type?.includes('PAYMENT.')) {
    // Redirecionar internamente para o processador PayPal
    (router as any).handle({ ...req, url: '/paypal' }, res);
  } else {
    // Processar como EMIS Multicaixa
    (router as any).handle({ ...req, url: '/emis' }, res);
  }
});

/**
 * 4. SIMULAÇÃO / TESTE DE WEBHOOK (Disponível para Gestores testarem ativação instantânea)
 */
router.post('/simulate', (req: Request, res: Response) => {
  try {
    const { gateway, userEmail, planId, reference } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'E-mail do utilizador obrigatório para simular o webhook.' });
    }

    const user = db.findUserByEmail(userEmail.trim());
    if (!user) {
      return res.status(404).json({ error: `Utilizador com o e-mail "${userEmail}" não foi encontrado no sistema.` });
    }

    const allPlans = db.getPlans();
    const plan = allPlans.find(p => p.id === planId) || allPlans[0];
    const queries = plan.queriesCount || 30;
    const validityDays = plan.validityDays || 30;
    const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    const newBalance = (user.queriesRemaining || 0) + queries;
    db.updateUser(user.id, {
      queriesRemaining: newBalance,
      activePlanId: plan.id,
      activePlanName: plan.name,
      planExpiresAt: expiryDate,
      isImportUnlocked: true,
      isBatchUnlocked: true,
      isActive: true
    });

    const txId = `tx_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tx = db.createTransaction({
      id: txId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      amountKz: plan.priceKz,
      queriesGranted: queries,
      validityDays,
      paymentMethod: gateway === 'paypal' ? 'paypal' : 'express_ref',
      paymentReference: reference || (gateway === 'paypal' ? `PP-SIM-${Date.now()}` : `MCX-SIM-${Date.now().toString().slice(-6)}`),
      status: 'approved',
      reviewedByAdminName: `${(gateway || 'GATEWAY').toUpperCase()}_SIMULATED_WEBHOOK`,
      reviewedAt: new Date().toISOString(),
      notes: `Ativação disparada via simulador de testes de Webhook (${gateway || 'emis'})`,
      createdAt: new Date().toISOString()
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'WEBHOOK_SIMULATION_EXECUTED',
      entityType: 'payment',
      entityId: txId,
      details: `Simulação de Webhook ${(gateway || 'EMIS').toUpperCase()} executada com sucesso para ${user.name}. Creditadas +${queries} consultas. Novo saldo: ${newBalance} consultas.`
    });

    return res.json({
      success: true,
      message: `Simulação concluída com sucesso! Plano "${plan.name}" ativado via Webhook ${(gateway || 'EMIS').toUpperCase()}.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        queriesRemaining: newBalance,
        activePlanName: plan.name,
        planExpiresAt: expiryDate
      },
      transaction: tx
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao executar teste de webhook: ' + err.message });
  }
});

/**
 * 5. INFORMAÇÕES DE ENDPOINTS DE WEBHOOKS
 */
router.get('/info', (_req: Request, res: Response) => {
  return res.json({
    status: 'active',
    gateways: {
      paypal: {
        name: 'PayPal Global & Cartões Visa/Mastercard',
        endpoint: '/api/webhooks/paypal',
        method: 'POST',
        supportedEvents: [
          'PAYMENT.CAPTURE.COMPLETED', 
          'CHECKOUT.ORDER.APPROVED', 
          'PAYMENT.SALE.COMPLETED'
        ],
        description: 'Recebe eventos instantâneos do PayPal e ativa o plano e consultas do cliente automaticamente.'
      },
      emis: {
        name: 'EMIS Multicaixa Express / GPO Angola',
        endpoint: '/api/webhooks/emis',
        method: 'POST',
        supportedEvents: [
          'PAYMENT_CONFIRMED', 
          'TRANSACTION_SETTLED', 
          'PAID', 
          '00'
        ],
        description: 'Recebe a confirmação de liquidação bancária interbancária de Angola via Multicaixa e ativa as consultas imediatamente.'
      },
      unified: {
        name: 'Router Unificado de Pagamentos',
        endpoint: '/api/webhooks/payment',
        method: 'POST',
        description: 'Endpoint inteligente que deteta se a notificação é PayPal ou EMIS Multicaixa e encaminha automaticamente.'
      }
    }
  });
});

export default router;
