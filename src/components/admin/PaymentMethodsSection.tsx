import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Save,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Coins,
  QrCode,
  DollarSign,
  Zap,
  Webhook,
  Copy,
  Check,
  Play,
  RefreshCw,
  Radio
} from 'lucide-react';
import { UserSafe, BankAccount } from '../../types';
import { INITIAL_BANK_ACCOUNTS } from '../../data/mockDatabase';

export interface PaymentGatewayConfig {
  emisEnabled: boolean;
  emisEntityCode: string;
  emisSubEntity: string;
  emisTerminalId: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalSecret: string;
  paypalMode: 'sandbox' | 'live';
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  proxypayEnabled: boolean;
  instructionsText: string;
}

const DEFAULT_GATEWAYS: PaymentGatewayConfig = {
  emisEnabled: true,
  emisEntityCode: '99123',
  emisSubEntity: '001',
  emisTerminalId: 'MCX-NANU-01',
  paypalEnabled: true,
  paypalClientId: 'sb-nanucloud-client-id-2026',
  paypalSecret: '••••••••••••••••••••••••••••',
  paypalMode: 'live',
  stripeEnabled: false,
  stripePublishableKey: 'pk_live_nanucloud_stripe_public_key',
  stripeSecretKey: '••••••••••••••••••••••••••••',
  proxypayEnabled: false,
  instructionsText: 'Após efetuar a transferência bancária ou pagamento por Multicaixa, anexe o comprovativo na janela de subscrição para validação automática ou envie para suporte@nanucloud.com.'
};

interface PaymentMethodsSectionProps {
  currentUser: UserSafe;
  showSaveNotice: (msg: string) => void;
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('nanucloud_bank_accounts_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_BANK_ACCOUNTS;
  });

  const [gateways, setGateways] = useState<PaymentGatewayConfig>(() => {
    const saved = localStorage.getItem('nanucloud_payment_gateways_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_GATEWAYS;
  });

  // Bank Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [formBankName, setFormBankName] = useState<string>('');
  const [formAccountNumber, setFormAccountNumber] = useState<string>('');
  const [formIban, setFormIban] = useState<string>('');
  const [formSwift, setFormSwift] = useState<string>('');
  const [formHolder, setFormHolder] = useState<string>('NANUCLOUD TECH SOLUTIONS LDA');
  const [formCurrency, setFormCurrency] = useState<string>('AOA (Kz)');
  const [formIsVisible, setFormIsVisible] = useState<boolean>(true);

  // Webhook State & Handlers
  const [testGateway, setTestGateway] = useState<'paypal' | 'emis'>('paypal');
  const [testEmail, setTestEmail] = useState<string>(currentUser.email || '');
  const [testPlanId, setTestPlanId] = useState<string>('plan_intermedio');
  const [testReference, setTestReference] = useState<string>('');
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookTestMessage, setWebhookTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const handleTriggerWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      setWebhookTestMessage({ type: 'error', text: 'Indique o e-mail do cliente para testar a ativação do plano.' });
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestMessage(null);
    try {
      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: testGateway,
          userEmail: testEmail.trim(),
          planId: testPlanId,
          reference: testReference.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar simulação do webhook.');
      }
      setWebhookTestMessage({
        type: 'success',
        text: `✅ ${data.message} Novo saldo: ${data.user?.queriesRemaining} consultas (Expira a ${data.user?.planExpiresAt?.split('T')[0]}).`
      });
      showSaveNotice(`Webhook ${testGateway.toUpperCase()} testado com sucesso!`);
    } catch (err: any) {
      setWebhookTestMessage({ type: 'error', text: err.message || 'Erro de conexão ao testar webhook.' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCopyEndpoint = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedEndpoint(path);
    setTimeout(() => setCopiedEndpoint(null), 2500);
  };

  const persistBanks = (updated: BankAccount[]) => {
    setBankAccounts(updated);
    localStorage.setItem('nanucloud_bank_accounts_db', JSON.stringify(updated));
  };

  const handleOpenAddBank = () => {
    setEditingBank(null);
    setFormBankName('');
    setFormAccountNumber('');
    setFormIban('');
    setFormSwift('');
    setFormHolder('NANUCLOUD TECH SOLUTIONS LDA');
    setFormCurrency('AOA (Kz)');
    setFormIsVisible(true);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setFormBankName(bank.bankName);
    setFormAccountNumber(bank.accountNumber || '');
    setFormIban(bank.iban);
    setFormSwift(bank.swift || '');
    setFormHolder(bank.holder);
    setFormCurrency(bank.currency || 'AOA (Kz)');
    setFormIsVisible(bank.isVisible);
    setIsBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankName.trim() || !formIban.trim()) {
      alert('Nome do Banco e IBAN são obrigatórios.');
      return;
    }

    if (editingBank) {
      const updated = bankAccounts.map((b) => {
        if (b.id === editingBank.id) {
          return {
            ...b,
            bankName: formBankName.trim(),
            accountNumber: formAccountNumber.trim(),
            iban: formIban.trim(),
            swift: formSwift.trim(),
            holder: formHolder.trim(),
            currency: formCurrency.trim(),
            isVisible: formIsVisible
          };
        }
        return b;
      });
      persistBanks(updated);
      setIsBankModalOpen(false);
      showSaveNotice(`Conta bancária "${formBankName}" atualizada com sucesso!`);
    } else {
      const newBank: BankAccount = {
        id: `bank_${Date.now()}`,
        bankName: formBankName.trim(),
        accountNumber: formAccountNumber.trim(),
        iban: formIban.trim(),
        swift: formSwift.trim(),
        holder: formHolder.trim(),
        currency: formCurrency.trim(),
        isActive: true,
        isVisible: formIsVisible
      };
      persistBanks([...bankAccounts, newBank]);
      setIsBankModalOpen(false);
      showSaveNotice(`Nova conta bancária "${newBank.bankName}" adicionada com sucesso!`);
    }
  };

  const handleToggleBankVisibility = (bank: BankAccount) => {
    const updated = bankAccounts.map((b) => (b.id === bank.id ? { ...b, isVisible: !b.isVisible } : b));
    persistBanks(updated);
    showSaveNotice(
      bank.isVisible
        ? `A conta "${bank.bankName}" agora está oculta para os clientes.`
        : `A conta "${bank.bankName}" agora está visível aos clientes no pagamento!`
    );
  };

  const handleDeleteBank = (bank: BankAccount) => {
    if (window.confirm(`Tem a certeza que deseja remover a conta bancária "${bank.bankName}"?`)) {
      const updated = bankAccounts.filter((b) => b.id !== bank.id);
      persistBanks(updated);
      showSaveNotice(`Conta bancária "${bank.bankName}" removida.`);
    }
  };

  const handleSaveGateways = () => {
    localStorage.setItem('nanucloud_payment_gateways_config', JSON.stringify(gateways));
    showSaveNotice('Configurações de gateways e meios de pagamento atualizadas!');
  };

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-8 animate-in fade-in duration-200 font-mono text-xs">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" /> FORMAS DE PAGAMENTO PARA OS CLIENTES
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
              Recebimentos & Cobrança
            </span>
          </div>
          <p className="text-slate-400 mt-1">
            Configure as contas bancárias (IBAN) disponibilizadas aos clientes para transferências e ative gateways de pagamento automático.
          </p>
        </div>
      </div>

      {/* SECTION 1: Coordenadas Bancárias */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-slate-100 uppercase text-xs">
              1. Contas Bancárias Oficiais para Clientes (Transferência / Depósito)
            </h4>
            <span className="text-[10px] text-slate-400">({bankAccounts.length} contas configuradas)</span>
          </div>

          <button
            type="button"
            onClick={handleOpenAddBank}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Conta Bancária
          </button>
        </div>

        {/* Bank Accounts Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((bank) => (
            <div
              key={bank.id}
              className={`p-4 rounded-xl border transition ${
                bank.isVisible
                  ? 'bg-slate-900/90 border-slate-700 shadow'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <h5 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{bank.bankName}</span>
                  </h5>
                  <span className="text-[10px] text-emerald-400 font-bold">{bank.currency || 'AOA (Kz)'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleBankVisibility(bank)}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      bank.isVisible
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title={bank.isVisible ? 'Ocultar aos clientes' : 'Tornar visível aos clientes'}
                  >
                    {bank.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{bank.isVisible ? 'Visível aos Clientes' : 'Oculto'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditBank(bank)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBank(bank)}
                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">IBAN:</span>
                  <strong className="text-slate-100 font-mono select-all">{bank.iban}</strong>
                </div>
                {bank.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nº de Conta:</span>
                    <span className="text-slate-200">{bank.accountNumber}</span>
                  </div>
                )}
                {bank.swift && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">SWIFT / BIC:</span>
                    <span className="text-slate-300">{bank.swift}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Titular da Conta:</span>
                  <span className="text-slate-400 truncate max-w-[220px]">{bank.holder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Gateways de Pagamento Eletrónico */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-slate-100 uppercase text-xs">
              2. Gateways & Meios de Pagamento Automático
            </h4>
          </div>

          <button
            type="button"
            onClick={handleSaveGateways}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Guardar Gateways
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Multicaixa EMIS */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <strong className="text-slate-200 text-xs">Multicaixa Referência (EMIS Angola)</strong>
              </div>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={gateways.emisEnabled}
                  onChange={(e) => setGateways({ ...gateways, emisEnabled: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Ativo</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Cód. Entidade:</label>
                <input
                  type="text"
                  value={gateways.emisEntityCode}
                  onChange={(e) => setGateways({ ...gateways, emisEntityCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Subentidade:</label>
                <input
                  type="text"
                  value={gateways.emisSubEntity}
                  onChange={(e) => setGateways({ ...gateways, emisSubEntity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Terminal ID:</label>
                <input
                  type="text"
                  value={gateways.emisTerminalId}
                  onChange={(e) => setGateways({ ...gateways, emisTerminalId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* PayPal Express */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <strong className="text-slate-200 text-xs">PayPal (Cartões Internacionais / USD / EUR)</strong>
              </div>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={gateways.paypalEnabled}
                  onChange={(e) => setGateways({ ...gateways, paypalEnabled: e.target.checked })}
                  className="rounded border-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <span>Ativo</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Client ID:</label>
                <input
                  type="text"
                  value={gateways.paypalClientId}
                  onChange={(e) => setGateways({ ...gateways, paypalClientId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Ambiente:</label>
                <select
                  value={gateways.paypalMode}
                  onChange={(e) => setGateways({ ...gateways, paypalMode: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="live">Produção (Live)</option>
                  <option value="sandbox">Ambiente Teste (Sandbox)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions to clients */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="block text-slate-300 font-bold text-[11px]">
            Instruções e Nota Exibida aos Clientes na Tela de Pagamento:
          </label>
          <textarea
            rows={2}
            value={gateways.instructionsText}
            onChange={(e) => setGateways({ ...gateways, instructionsText: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* SECTION 3: Webhooks de Ativação Instantânea (PayPal & EMIS Multicaixa) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-slate-100 uppercase text-xs">
              3. Webhooks de Ativação Automática de Planos (PayPal & EMIS Multicaixa)
            </h4>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Motor Ativo
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Configure estas URLs nos portais de integração do <strong>PayPal Developer</strong> e da <strong>EMIS Angola</strong>. 
          Quando o cliente liquida a subscrição, o webhook recebe a notificação em tempo real, credita automaticamente o saldo de consultas na conta do utilizador e desbloqueia os módulos contratados sem intervenção manual.
        </p>

        {/* URLs dos Webhooks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* PayPal Webhook Card */}
          <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Webhook PayPal Instantâneo</span>
              </div>
              <span className="text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                POST · JSON / IPN
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono">
              <code className="text-slate-300 truncate flex-1 select-all text-[11px]">
                /api/webhooks/paypal
              </code>
              <button
                type="button"
                onClick={() => handleCopyEndpoint('/api/webhooks/paypal')}
                className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedEndpoint === '/api/webhooks/paypal' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEndpoint === '/api/webhooks/paypal' ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <div>• <strong>Eventos:</strong> PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED</div>
              <div>• <strong>Ação:</strong> Identifica o cliente por e-mail ou order_id e ativa consultas no ato.</div>
            </div>
          </div>

          {/* EMIS Multicaixa Webhook Card */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webhook EMIS Multicaixa Express / GPO</span>
              </div>
              <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                POST · JSON
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono">
              <code className="text-slate-300 truncate flex-1 select-all text-[11px]">
                /api/webhooks/emis
              </code>
              <button
                type="button"
                onClick={() => handleCopyEndpoint('/api/webhooks/emis')}
                className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedEndpoint === '/api/webhooks/emis' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEndpoint === '/api/webhooks/emis' ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <div>• <strong>Eventos:</strong> Liquidação Multicaixa, Pagamento de Serviços (Ref), Express.</div>
              <div>• <strong>Ação:</strong> Cruza a referência ou telemóvel do cliente e liquida a transação.</div>
            </div>
          </div>
        </div>

        {/* Ferramenta de Teste de Webhook para Gestores */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <strong className="text-slate-200 text-xs">Simulador de Ativação Instantânea (Teste para Gestores)</strong>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Testar disparo em tempo real</span>
          </div>

          <form onSubmit={handleTriggerWebhookTest} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-mono">Gateway de Pagamento:</label>
              <select
                value={testGateway}
                onChange={(e) => setTestGateway(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="paypal">PayPal Webhook</option>
                <option value="emis">EMIS Multicaixa Webhook</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-mono">E-mail do Cliente:</label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-mono">Plano a Ativar:</label>
              <select
                value={testPlanId}
                onChange={(e) => setTestPlanId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="plan_basico">Plano Básico (30 consultas · 1.500 Kz)</option>
                <option value="plan_intermedio">Plano Intermédio (100 consultas · 3.500 Kz)</option>
                <option value="plan_avancado">Plano Avançado (250 consultas · 8.000 Kz)</option>
                <option value="plan_ilimitado">Plano Ilimitado Anual (10.000 consultas · 25.000 Kz)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isTestingWebhook}
                className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50 text-xs"
              >
                {isTestingWebhook ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A Processar...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Disparar Webhook</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {webhookTestMessage && (
            <div className={`p-3 rounded-lg text-xs font-mono border animate-in fade-in ${
              webhookTestMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {webhookTestMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add or Edit Bank */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                {editingBank ? `Editar Conta: ${editingBank.bankName}` : 'Adicionar Nova Conta Bancária'}
              </h4>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nome do Banco *</label>
                <input
                  type="text"
                  required
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  placeholder="Ex: Banco BAI Angola"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IBAN Oficial *</label>
                <input
                  type="text"
                  required
                  value={formIban}
                  onChange={(e) => setFormIban(e.target.value)}
                  placeholder="Ex: AO06.0040.0000.1234.5678.1018.9"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nº de Conta</label>
                  <input
                    type="text"
                    value={formAccountNumber}
                    onChange={(e) => setFormAccountNumber(e.target.value)}
                    placeholder="0040.0000.1234..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SWIFT / BIC</label>
                  <input
                    type="text"
                    value={formSwift}
                    onChange={(e) => setFormSwift(e.target.value)}
                    placeholder="BAIAAOLL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Titular da Conta</label>
                  <input
                    type="text"
                    value={formHolder}
                    onChange={(e) => setFormHolder(e.target.value)}
                    placeholder="NANUCLOUD TECH SOLUTIONS LDA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Moeda da Conta</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="AOA (Kz)">AOA (Kwanzas)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="USD ($)">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVisible}
                    onChange={(e) => setFormIsVisible(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Visível aos clientes na tela de pagamento</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Guardar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
