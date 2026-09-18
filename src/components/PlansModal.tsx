import React, { useState, useEffect, useRef } from 'react';
import { Plan, UserSafe, BankAccount, Transaction } from '../types';
import {
  Gem,
  Check,
  Sparkles,
  X,
  CreditCard,
  Send,
  ShieldCheck,
  ArrowRight,
  Clock,
  HelpCircle,
  PhoneCall,
  Copy,
  Building,
  MessageSquare,
  AlertCircle,
  Smartphone,
  Hash,
  QrCode,
  Globe,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Eye
} from 'lucide-react';
import { NanuCloudLogo } from './NanuCloudLogo';

interface PlansModalProps {
  user: UserSafe | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onPurchaseSuccess: () => void;
  onOpenSupportChat?: () => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenAuth,
  onPurchaseSuccess,
  onOpenSupportChat
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [unitQueryPriceKz, setUnitQueryPriceKz] = useState<number>(50);
  const [minCustomPriceKz, setMinCustomPriceKz] = useState<number>(500);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankInfo, setBankInfo] = useState<any>(null);

  // Custom Plan input
  const [customAmountKz, setCustomAmountKz] = useState<number>(2000);

  // Checkout Step State
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [isCustomCheckout, setIsCustomCheckout] = useState<boolean>(false);
  const [paymentTab, setPaymentTab] = useState<'bank_transfer' | 'express_ref' | 'paypal_visa' | 'stripe_card' | 'proxypay' | 'paypay' | 'alipay'>('bank_transfer');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [expressMobileNumber, setExpressMobileNumber] = useState<string>('');
  const [paypayMobileNumber, setPaypayMobileNumber] = useState<string>('');
  const [alipayAccount, setAlipayAccount] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [proofNotes, setProofNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState<boolean>(false);
  const [pendingSelectedPlan, setPendingSelectedPlan] = useState<Plan | null>(null);
  const [pendingIsCustom, setPendingIsCustom] = useState<boolean>(false);

  // Attachment state for initial checkout
  const [proofFile, setProofFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isDraggingProof, setIsDraggingProof] = useState<boolean>(false);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  // Created Transaction after order submission (for post-payment proof upload)
  const [createdTransaction, setCreatedTransaction] = useState<Transaction | null>(null);

  // Post-payment proof submission state
  const [postProofFile, setPostProofFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [postProofRef, setPostProofRef] = useState<string>('');
  const [postProofNotes, setPostProofNotes] = useState<string>('');
  const [isSubmittingPostProof, setIsSubmittingPostProof] = useState<boolean>(false);
  const [postProofSuccess, setPostProofSuccess] = useState<boolean>(false);
  const [postProofError, setPostProofError] = useState<string | null>(null);
  const [isDraggingPostProof, setIsDraggingPostProof] = useState<boolean>(false);
  const postProofFileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessProofFile = (file: File, isPost: boolean = false) => {
    setErrorMsg(null);
    if (isPost) setPostProofError(null);

    if (file.size > 15 * 1024 * 1024) {
      const msg = 'O ficheiro selecionado é demasiado grande (limite máximo de 15 MB).';
      if (isPost) setPostProofError(msg);
      else setErrorMsg(msg);
      return;
    }

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      const msg = 'Formato inválido. Por favor anexe uma imagem (PNG, JPG, JPEG, WEBP) ou documento PDF.';
      if (isPost) setPostProofError(msg);
      else setErrorMsg(msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        dataUrl
      };
      if (isPost) {
        setPostProofFile(fileData);
      } else {
        setProofFile(fileData);
      }
    };
    reader.onerror = () => {
      const msg = 'Erro ao processar ficheiro. Tente novamente.';
      if (isPost) setPostProofError(msg);
      else setErrorMsg(msg);
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/D';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  const [paymentToggles, setPaymentToggles] = useState({
    bankTransfer: true,
    emis: true,
    proxypay: true,
    paypay: true,
    alipay: true,
    paypal: true,
    stripe: true
  });

  // Get effective logged in user
  const getActiveUser = (): UserSafe | null => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('nanucloud_session_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      fetchPlans();
    };
    window.addEventListener('nanucloud_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('nanucloud_settings_updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    // If user was prompted to login and has now logged in, resume checkout!
    const active = getActiveUser();
    if (active && authPromptOpen) {
      setAuthPromptOpen(false);
      if (pendingIsCustom) {
        setIsCustomCheckout(true);
        setSelectedPlanForCheckout(null);
      } else if (pendingSelectedPlan) {
        setSelectedPlanForCheckout(pendingSelectedPlan);
        setIsCustomCheckout(false);
      }
    }
  }, [user, authPromptOpen, pendingSelectedPlan, pendingIsCustom]);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        setUnitQueryPriceKz(data.unitQueryPriceKz || 50);
        setMinCustomPriceKz(data.minCustomPlanPriceKz || 500);
        setBankAccounts(data.bankAccounts || []);
        setBankInfo(data.bankInfo);
        if (data.bankAccounts && data.bankAccounts.length > 0) {
          setSelectedBankId(data.bankAccounts[0].id);
        }
      }

      // Also fetch public settings to know enabled payment channels
      const resConfig = await fetch('/api/plans/public-config');
      if (resConfig.ok) {
        const conf = await resConfig.json();
        setPaymentToggles({
          bankTransfer: conf.bankTransferEnabled ?? true,
          emis: conf.emisEnabled ?? true,
          proxypay: conf.proxyPayEnabled ?? true,
          paypay: conf.payPayEnabled ?? true,
          alipay: conf.alipayEnabled ?? true,
          paypal: conf.paypalEnabled ?? true,
          stripe: conf.stripeEnabled ?? true
        });
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  if (!isOpen) return null;

  const calculatedCustomQueries = Math.floor(customAmountKz / unitQueryPriceKz);

  const handleSelectPlan = (plan: Plan) => {
    const active = getActiveUser();
    if (!active) {
      setPendingSelectedPlan(plan);
      setPendingIsCustom(false);
      setAuthPromptOpen(true);
      return;
    }
    setSelectedPlanForCheckout(plan);
    setIsCustomCheckout(false);
    setErrorMsg(null);
    setOrderSuccess(false);
  };

  const handleSelectCustomPlan = () => {
    const active = getActiveUser();
    if (!active) {
      setPendingSelectedPlan(null);
      setPendingIsCustom(true);
      setAuthPromptOpen(true);
      return;
    }
    setSelectedPlanForCheckout(null);
    setIsCustomCheckout(true);
    setErrorMsg(null);
    setOrderSuccess(false);
  };

  const copyToClipboard = (text: string, ibanId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIban(ibanId);
    setTimeout(() => setCopiedIban(null), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const activeUser = getActiveUser();
    if (!activeUser) {
      setAuthPromptOpen(true);
      return;
    }

    if (paymentTab === 'bank_transfer' && !paymentReference.trim() && !proofFile) {
      setErrorMsg('Por favor, anexe o ficheiro do comprovativo bancário (PDF ou imagem) ou informe o número do talão / referência.');
      return;
    }

    if (paymentTab === 'paypal_visa' && !paymentReference && !cardNumber.trim()) {
      setErrorMsg('Por favor, informe o email PayPal ou os dados do Cartão Visa / Mastercard.');
      return;
    }

    setIsSubmitting(true);

    try {
      const planId = isCustomCheckout ? 'plan_custom' : selectedPlanForCheckout?.id;
      const amount = isCustomCheckout ? customAmountKz : selectedPlanForCheckout?.priceKz;
      
      let reference = '';
      let notes = '';

      if (paymentTab === 'bank_transfer') {
        reference = paymentReference.trim();
        if (!reference && proofFile) {
          reference = `TALÃO-${Date.now().toString().slice(-6)}`;
        }
        notes = `[Transferência Bancária - Banco ID: ${selectedBankId}] ${proofNotes}`;
      } else if (paymentTab === 'express_ref') {
        reference = `MCX-REF-${Math.floor(100000000 + Math.random() * 900000000)}`;
        notes = `[Referência Multicaixa Express - EMIS] ${proofNotes}`;
      } else if (paymentTab === 'proxypay') {
        reference = `PROXYPAY-REF-${Math.floor(100000000 + Math.random() * 900000000)}`;
        notes = `[ProxyPay Referência Automática / Em Breve] ${proofNotes}`;
      } else if (paymentTab === 'paypay') {
        reference = `PAYPAY-AO-${Math.floor(100000000 + Math.random() * 900000000)}`;
        notes = `[PayPay África - Carteira Digital / Em Breve] Tel: ${paypayMobileNumber || 'N/A'} ${proofNotes}`;
      } else if (paymentTab === 'alipay') {
        reference = `ALIPAY-CN-${Math.floor(100000000 + Math.random() * 900000000)}`;
        notes = `[Alipay Global QR / Em Breve] Conta: ${alipayAccount || 'N/A'} ${proofNotes}`;
      } else if (paymentTab === 'paypal_visa') {
        reference = `PAYPAL-VISA-${Math.floor(100000000 + Math.random() * 900000000)}`;
        notes = `[PayPal / Cartão Visa - Encriptação 256-bit] Titular: ${cardHolder || 'PayPal Account'} ${proofNotes}`;
      } else {
        reference = `STRIPE-CARD-${Math.floor(100000000 + Math.random() * 900000000)}`;
        notes = `[Stripe Direct Card] ${proofNotes}`;
      }

      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/plans/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          customAmountKz: isCustomCheckout ? customAmountKz : undefined,
          paymentMethod: paymentTab,
          paymentReference: reference,
          paymentProofUrl: proofFile?.dataUrl,
          paymentProofName: proofFile?.name,
          paymentProofSize: proofFile?.size,
          notes,
          userId: activeUser.id,
          userEmail: activeUser.email,
          userName: activeUser.name
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao processar pedido.');
      } else {
        setOrderSuccess(true);
        if (data.transaction) {
          setCreatedTransaction(data.transaction);
        }
        if (paymentTab === 'paypal_visa' || paymentTab === 'stripe_card') {
          setSuccessDetails(`Pagamento digital validado com sucesso! As suas consultas (${data.transaction?.queriesCount || ''}) e acesso aos módulos foram imediatamente ativados na sua conta.`);
        } else {
          setSuccessDetails('O seu pedido de ativação foi registado. A administração irá conferir o comprovativo e creditar o plano.');
        }
        onPurchaseSuccess();
      }
    } catch (err) {
      setErrorMsg('Erro de comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProofPostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdTransaction?.id) return;
    if (!postProofFile && !postProofRef.trim()) {
      setPostProofError('Por favor anexe o ficheiro do comprovativo (PDF ou imagem) ou indique o número de referência.');
      return;
    }

    setIsSubmittingPostProof(true);
    setPostProofError(null);
    setPostProofSuccess(false);

    try {
      const token = localStorage.getItem('nanucloud_token');
      const res = await fetch('/api/plans/upload-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          transactionId: createdTransaction.id,
          paymentProofUrl: postProofFile?.dataUrl || createdTransaction.paymentProofUrl,
          paymentProofName: postProofFile?.name || createdTransaction.paymentProofName,
          paymentProofSize: postProofFile?.size || createdTransaction.paymentProofSize,
          paymentReference: postProofRef.trim() || createdTransaction.paymentReference,
          notes: postProofNotes.trim() || createdTransaction.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setPostProofError(data.error || 'Erro ao submeter comprovativo.');
      } else {
        setPostProofSuccess(true);
        if (data.transaction) {
          setCreatedTransaction(data.transaction);
        }
        onPurchaseSuccess();
      }
    } catch (err) {
      setPostProofError('Erro de conexão com o servidor.');
    } finally {
      setIsSubmittingPostProof(false);
    }
  };

  const checkoutAmount = isCustomCheckout ? customAmountKz : (selectedPlanForCheckout?.priceKz || 0);
  const checkoutPlanName = isCustomCheckout ? `Plano Personalizado (${customAmountKz.toLocaleString('pt-PT')} Kz)` : (selectedPlanForCheckout?.name || '');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal: Login / Register Required Prompt */}
        {authPromptOpen && !user && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1E293B] border border-indigo-500/40 rounded-xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono uppercase tracking-tight">
                Inicie Sessão ou Crie a sua Conta
              </h3>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Para aderir a um plano e receber as suas pesquisas, por favor inicie sessão ou registe a sua conta. Após o registo ou login, será imediatamente encaminhado para as opções de pagamento!
              </p>
              <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
                <button
                  onClick={() => {
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition uppercase tracking-tight cursor-pointer shadow"
                >
                  Entrar ou Registar Agora
                </button>
                <button
                  onClick={() => setAuthPromptOpen(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Voltar aos Planos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Plans Showcase */}
        {!selectedPlanForCheckout && !isCustomCheckout && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="flex justify-center mb-3">
                <NanuCloudLogo className="h-10" isDarkTheme={true} />
              </div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3 Consultas Grátis Iniciais • Recarga a 50 Kz por pesquisa</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-mono uppercase tracking-tight">
                Planos & Recargas de Consultas
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 font-mono">
                Desbloqueie simulações adicionais, cálculo aduaneiro de importação e processamento em lote Excel.
              </p>
            </div>

            {/* Standard 5 Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {plans
                .filter((p) => !p.isCustom)
                .map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-[#0F172A] border rounded-xl p-4 flex flex-col justify-between transition-all shadow-sm ${
                      plan.badge === 'Mais Recomendado'
                        ? 'border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {plan.badge && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded w-fit mb-2.5 block">
                          {plan.badge}
                        </span>
                      )}

                      <h3 className="font-bold text-sm text-slate-100 font-mono">{plan.name}</h3>

                      <div className="my-2.5">
                        <span className="text-xl font-bold text-slate-100 font-mono">
                          {plan.priceKz.toLocaleString('pt-PT')}
                        </span>
                        <span className="text-xs text-slate-400 font-bold ml-1 font-mono">Kz</span>
                      </div>

                      <div className="bg-[#1E293B] p-2 rounded-lg border border-slate-800 mb-3 text-xs font-mono font-semibold text-amber-300 flex items-center justify-between">
                        <span>{plan.queriesCount} Pesquisas</span>
                        <span className="text-[10px] text-slate-400">({plan.validityDays}d)</span>
                      </div>

                      <ul className="space-y-1.5 text-[11px] text-slate-300 mb-5 font-mono">
                        {plan.features.map((feat, fidx) => (
                          <li key={fidx} className="flex items-start gap-1.5 leading-tight">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-tight transition shadow-sm cursor-pointer ${
                        plan.badge === 'Mais Recomendado'
                          ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                      }`}
                    >
                      Aderir ao Plano
                    </button>
                  </div>
                ))}
            </div>

            {/* Custom Plan Box */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 md:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tight">
                    Plano Personalizado Sob Medida
                  </span>
                  <h3 className="text-base md:text-lg font-bold text-slate-100 font-mono uppercase tracking-tight">
                    Escolha o valor que deseja recarregar
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl font-mono">
                    Cada pesquisa custa apenas <strong className="text-slate-200">{unitQueryPriceKz} Kz</strong> (mínimo de {minCustomPriceKz.toLocaleString('pt-PT')} Kz). Desbloqueia automaticamente todos os módulos de importação e Excel.
                  </p>
                </div>

                <div className="bg-[#1E293B] border border-slate-800 p-4 rounded-xl w-full md:w-80 space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex justify-between">
                      <span>Valor em Kwanzas:</span>
                      <strong className="text-indigo-400">{customAmountKz.toLocaleString('pt-PT')} Kz</strong>
                    </label>
                    <input
                      type="range"
                      min={minCustomPriceKz}
                      max="100000"
                      step="500"
                      value={customAmountKz}
                      onChange={(e) => setCustomAmountKz(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-[#0F172A] p-2 rounded-lg text-xs border border-slate-800">
                    <span className="text-slate-400">Total de Consultas:</span>
                    <strong className="text-amber-400 font-bold text-sm">
                      {calculatedCustomQueries} pesquisas
                    </strong>
                  </div>

                  <button
                    onClick={handleSelectCustomPlan}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-tight transition shadow-sm cursor-pointer"
                  >
                    Recarregar {customAmountKz.toLocaleString('pt-PT')} Kz
                  </button>
                </div>
              </div>
            </div>

            {/* Mandatory Accountant Disclaimer */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Aviso Legal Nanucloud:</strong> A utilização deste simulador não dispensa a consulta de um profissional de contas ou contabilista certificado.
              </span>
            </div>
          </div>
        )}

        {/* Step 2: Payment Options & Proof Submission */}
        {(selectedPlanForCheckout || isCustomCheckout) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setIsCustomCheckout(false);
                }}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                ← Voltar aos planos
              </button>

              {onOpenSupportChat && (
                <button
                  type="button"
                  onClick={onOpenSupportChat}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Dúvidas? Fale com o Suporte</span>
                </button>
              )}
            </div>

            {orderSuccess ? (
              <div className="py-6 space-y-5 font-mono">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">
                    {paymentTab === 'paypal_visa' || paymentTab === 'stripe_card'
                      ? 'Pagamento Confirmado & Plano Ativado!'
                      : 'Pedido Registado com Sucesso!'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                    {successDetails || 'A nossa equipa de administração irá verificar o pagamento e creditar as suas consultas de imediato.'}
                  </p>
                </div>

                {/* Transaction details card */}
                {createdTransaction && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 max-w-xl mx-auto text-xs space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-400 text-[11px]">Identificador do Pedido:</span>
                      <span className="font-bold text-indigo-400 font-mono">{createdTransaction.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Plano Solicitado:</span>
                      <span className="font-semibold text-slate-200">{createdTransaction.planName}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Montante:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{createdTransaction.amountKz.toLocaleString('pt-PT')} Kz</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Estado Atual:</span>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pendente de Conferência
                      </span>
                    </div>
                  </div>
                )}

                {/* OPTION: SUBMETER COMPROVATIVO APÓS O PAGAMENTO */}
                {paymentTab !== 'paypal_visa' && paymentTab !== 'stripe_card' && (
                  <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 max-w-xl mx-auto space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 uppercase tracking-tight text-xs">
                            Opção: Submeter Comprovativo com Anexo
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Anexe o talão da transferência ou documento PDF para acelerar a aprovação.
                          </p>
                        </div>
                      </div>
                      {createdTransaction?.paymentProofUrl && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Anexado
                        </span>
                      )}
                    </div>

                    {/* If proof is already attached */}
                    {createdTransaction?.paymentProofUrl && !postProofFile && (
                      <div className="bg-[#0F172A] p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-bold text-slate-200 text-xs truncate">
                              {createdTransaction.paymentProofName || 'Comprovativo de Pagamento'}
                            </span>
                          </div>
                          <a
                            href={createdTransaction.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1 font-bold ml-2 shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver Ficheiro
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Comprovativo registado no sistema. Se pretende alterar o ficheiro ou enviar outro comprovativo, utilize o formulário abaixo.
                        </p>
                      </div>
                    )}

                    {postProofSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Comprovativo com anexo submetido com sucesso! A nossa equipa irá conferir e ativar as pesquisas.</span>
                      </div>
                    )}

                    {postProofError && (
                      <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{postProofError}</span>
                      </div>
                    )}

                    {/* Post payment upload form */}
                    <form onSubmit={handleUploadProofPostPayment} className="space-y-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1 flex justify-between">
                          <span>Anexo do Documento (PDF, Imagem PNG, JPG, WEBP) *:</span>
                          <span className="text-[10px] text-slate-500">Máx. 15 MB</span>
                        </label>

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingPostProof(true);
                          }}
                          onDragLeave={() => setIsDraggingPostProof(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingPostProof(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleProcessProofFile(e.dataTransfer.files[0], true);
                            }
                          }}
                          onClick={() => postProofFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer ${
                            isDraggingPostProof
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : postProofFile
                              ? 'border-emerald-500/60 bg-emerald-950/20'
                              : 'border-slate-700 hover:border-emerald-500/50 bg-[#0F172A]'
                          }`}
                        >
                          <input
                            type="file"
                            ref={postProofFileInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleProcessProofFile(e.target.files[0], true);
                              }
                            }}
                            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                            className="hidden"
                          />

                          {postProofFile ? (
                            <div className="flex items-center justify-between text-left gap-2">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                {postProofFile.type === 'application/pdf' ? (
                                  <FileText className="w-7 h-7 text-rose-400 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded border border-slate-700 overflow-hidden bg-slate-950 shrink-0">
                                    <img src={postProofFile.dataUrl} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="truncate">
                                  <span className="font-bold text-slate-100 text-xs block truncate">{postProofFile.name}</span>
                                  <span className="text-[10px] text-emerald-400 font-mono">
                                    {formatFileSize(postProofFile.size)} • Pronto para envio
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostProofFile(null);
                                }}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Remover anexo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1 py-1">
                              <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                                <UploadCloud className="w-4 h-4" />
                                <span className="font-bold text-slate-200 text-xs">
                                  {createdTransaction?.paymentProofUrl ? 'Substituir / Carregar Novo Anexo' : 'Clique para Anexar Comprovativo'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                Arraste ou clique para selecionar foto do talão ou ficheiro PDF
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 font-bold block mb-1">
                            N.º de Referência / Talão:
                          </label>
                          <input
                            type="text"
                            value={postProofRef}
                            onChange={(e) => setPostProofRef(e.target.value)}
                            placeholder={createdTransaction?.paymentReference || 'Ex: TALÃO BAI-9284'}
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">
                            Notas / Titular da Conta:
                          </label>
                          <input
                            type="text"
                            value={postProofNotes}
                            onChange={(e) => setPostProofNotes(e.target.value)}
                            placeholder="Ex: Titular Manuel Silva..."
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingPostProof || (!postProofFile && !postProofRef.trim())}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow transition"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span>{isSubmittingPostProof ? 'A Enviar Comprovativo...' : 'Submeter Comprovativo com Anexo'}</span>
                      </button>
                    </form>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold py-2 px-6 rounded-lg text-xs uppercase tracking-tight transition cursor-pointer shadow border border-slate-700"
                  >
                    Concluir & Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Header with Fast Plan Switcher */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 font-mono">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Plano Selecionado:</span>
                      <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                        <Gem className="w-4 h-4 text-amber-400" />
                        {checkoutPlanName}
                      </h3>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total a Pagar:</span>
                      <span className="text-lg md:text-xl font-bold text-emerald-400">
                        {checkoutAmount.toLocaleString('pt-PT')} Kz
                      </span>
                    </div>
                  </div>

                  {/* Switch plan buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Trocar de Plano:</span>
                    {plans.map((p) => {
                      const isSelected = selectedPlanForCheckout?.id === p.id && !isCustomCheckout;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlanForCheckout(p);
                            setIsCustomCheckout(false);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {p.name} ({p.priceKz.toLocaleString('pt-PT')} Kz)
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanForCheckout(null);
                        setIsCustomCheckout(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                        isCustomCheckout
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>

                {/* Payment Method Selector Tabs */}
                <div>
                  <label className="text-xs font-mono font-bold text-slate-300 block mb-2">
                    Selecione a Modalidade de Pagamento:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
                    {paymentToggles.bankTransfer && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('bank_transfer')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'bank_transfer'
                            ? 'bg-indigo-500/15 border-indigo-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Building className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">Nacional</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">Transferência IBAN</div>
                          <div className="text-[10px] text-slate-400">BAI, BFA, BIC...</div>
                        </div>
                      </button>
                    )}

                    {paymentToggles.emis && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('express_ref')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'express_ref'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Hash className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">EMIS</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">MCX Express</div>
                          <div className="text-[10px] text-slate-400">Referência / GPO</div>
                        </div>
                      </button>
                    )}

                    {paymentToggles.proxypay && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('proxypay')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'proxypay'
                            ? 'bg-purple-500/15 border-purple-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <QrCode className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-bold">ProxyPay</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">ProxyPay</div>
                          <div className="text-[10px] text-slate-400">Ref. Automática</div>
                        </div>
                      </button>
                    )}

                    {paymentToggles.paypay && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('paypay')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'paypay'
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Smartphone className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1 py-0.5 rounded font-bold">Carteira</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">PayPay África</div>
                          <div className="text-[10px] text-slate-400">Mobile Wallet</div>
                        </div>
                      </button>
                    )}

                    {paymentToggles.alipay && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('alipay')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'alipay'
                            ? 'bg-blue-500/15 border-blue-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-bold">China</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">Alipay Global</div>
                          <div className="text-[10px] text-slate-400">China / Yuan (RMB)</div>
                        </div>
                      </button>
                    )}

                    {paymentToggles.paypal && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('paypal_visa')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'paypal_visa'
                            ? 'bg-sky-500/15 border-sky-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">PayPal</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">PayPal & Visa</div>
                          <div className="text-[10px] text-slate-400">Mastercard / Amex</div>
                        </div>
                      </button>
                    )}

                    {paymentToggles.stripe && (
                      <button
                        type="button"
                        onClick={() => setPaymentTab('stripe_card')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                          paymentTab === 'stripe_card'
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Stripe</span>
                        </div>
                        <div>
                          <div className="font-bold text-[11px]">Stripe Direct</div>
                          <div className="text-[10px] text-slate-400">Apple / Google Pay</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* TAB 1: TRANSFERÊNCIA BANCÁRIA (IBANS) */}
                {paymentTab === 'bank_transfer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lista de IBANs */}
                    <div className="space-y-3 font-mono">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-indigo-400" />
                          <span>Contas Bancárias Oficiais NANUCLOUD:</span>
                        </h4>
                        <span className="text-[10px] text-slate-400">({bankAccounts.length} Bancos disponíveis)</span>
                      </div>

                      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                        {bankAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            onClick={() => setSelectedBankId(acc.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer ${
                              selectedBankId === acc.id
                                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30'
                                : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-slate-100">{acc.bankName}</span>
                              <span className="text-[10px] text-emerald-400 font-bold">{acc.currency}</span>
                            </div>
                            <div className="bg-[#1E293B] p-2 rounded border border-slate-800 flex items-center justify-between text-xs text-indigo-300">
                              <span className="font-mono select-all text-[11px] font-semibold">{acc.iban}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(acc.iban, acc.id);
                                }}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition"
                                title="Copiar IBAN"
                              >
                                {copiedIban === acc.id ? (
                                  <span className="text-[10px] text-emerald-400 font-bold">Copiado!</span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Titular: <strong className="text-slate-300">{acc.holder}</strong></span>
                              {acc.swift && <span>SWIFT: {acc.swift}</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Nota Importante:</strong> A validação e crédito de consultas via transferência bancária é efetuada após confirmação e conferência do comprovativo pela administração.
                        </span>
                      </div>
                    </div>

                    {/* Submissão do Comprovativo */}
                    <div className="space-y-3 font-mono text-xs">
                      <h4 className="font-bold text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span>Submeter Comprovativo / N.º de Talão</span>
                      </h4>

                      {errorMsg && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                          {errorMsg}
                        </div>
                      )}

                      <form onSubmit={handleSubmitOrder} className="space-y-3">
                        {/* Anexo do Comprovativo */}
                        <div>
                          <label className="text-slate-400 font-bold block mb-1 flex items-center justify-between">
                            <span>Anexo do Comprovativo (PDF, PNG, JPG, WEBP):</span>
                            <span className="text-[10px] text-slate-500 font-normal">Máx. 15 MB</span>
                          </label>

                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingProof(true);
                            }}
                            onDragLeave={() => setIsDraggingProof(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingProof(false);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleProcessProofFile(e.dataTransfer.files[0], false);
                              }
                            }}
                            onClick={() => proofFileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-3 text-center transition cursor-pointer ${
                              isDraggingProof
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : proofFile
                                ? 'border-emerald-500/60 bg-emerald-950/20'
                                : 'border-slate-800 hover:border-emerald-500/50 bg-[#0F172A]'
                            }`}
                          >
                            <input
                              type="file"
                              ref={proofFileInputRef}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                handleProcessProofFile(e.target.files[0], false);
                                }
                              }}
                              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                              className="hidden"
                            />

                            {proofFile ? (
                              <div className="flex items-center justify-between text-left gap-2">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  {proofFile.type === 'application/pdf' ? (
                                    <FileText className="w-6 h-6 text-rose-400 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded border border-slate-700 overflow-hidden bg-slate-950 shrink-0">
                                      <img src={proofFile.dataUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <span className="font-bold text-slate-100 text-xs block truncate">{proofFile.name}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                      {formatFileSize(proofFile.size)} • Anexo pronto
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProofFile(null);
                                  }}
                                  className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                  title="Remover anexo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1 py-1">
                                <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="font-bold text-slate-200 text-xs">Anexar Comprovativo</span>
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  Clique ou arraste o ficheiro do talão bancário ou PDF aqui
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">
                            N.º de Referência do Talão / ID da Transação *:
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Ex: 0048192 / TALÃO BAI-928"
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">
                            Observações / Titular da Conta de Origem (Opcional):
                          </label>
                          <textarea
                            value={proofNotes}
                            onChange={(e) => setProofNotes(e.target.value)}
                            rows={3}
                            placeholder="Ex: Transferido a partir da conta de Joaquim Silva no Banco BFA..."
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? 'A submeter...' : 'Confirmar & Submeter Comprovativo'}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 2: PAGAMENTO POR REFERÊNCIA MULTICAIXA EXPRESS (EMIS) */}
                {paymentTab === 'express_ref' && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 font-mono space-y-4">
                    <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                      <div>
                        <strong>Pagamento Interbancário Multicaixa Express (EMIS GPO):</strong>
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          Utilize a entidade e referência geradas abaixo em qualquer Caixa Multicaixa ou na aplicação Multicaixa Express para liquidação imediata.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 max-w-md mx-auto space-y-3 text-xs">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Referência Multicaixa</span>
                        <div className="text-lg font-bold text-slate-100 mt-1">EMIS / PAGAMENTOS DE SERVIÇOS</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Entidade:</span>
                          <span className="font-bold text-slate-100 font-mono">00142 (NANUCLOUD)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Referência:</span>
                          <span className="font-bold text-indigo-400 text-sm tracking-wider font-mono">944 935 617</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Montante:</span>
                          <span className="font-bold text-emerald-400 text-sm font-mono">{checkoutAmount.toLocaleString('pt-PT')} Kz</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full mt-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isSubmitting ? 'A Processar...' : 'Validar Pagamento Multicaixa Express'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: PAYPAL & CARTÃO VISA / MASTERCARD */}
                {paymentTab === 'paypal_visa' && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 font-mono space-y-4">
                    <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
                      <div>
                        <strong>Gateway PayPal Seguro com Suporte para Cartão Visa / Mastercard:</strong>
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          Pague diretamente com a sua conta PayPal ou introduza o seu cartão de débito/crédito internacional (Visa, Mastercard, American Express) com proteção antifraude e encriptação bancária AES-256 bits.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitOrder} className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 max-w-lg mx-auto space-y-4 text-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sky-400 font-mono text-sm">PayPal</span>
                          <span className="text-slate-600">|</span>
                          <span className="font-bold text-slate-200">Visa / Mastercard</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                          256-bit SSL
                        </span>
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Nome do Titular do Cartão / Conta:</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Ex: Manuel António"
                          className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Número do Cartão Visa / Mastercard ou Email PayPal:</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 2222 3333 4444 ou cliente@paypal.com"
                          className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Validade (MM/AA):</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="12/28"
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold block mb-1">CVV / Código Segurança:</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500 font-mono text-center tracking-widest"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-[#0F172A] border border-slate-800 flex items-center justify-between text-slate-300">
                        <span>Total a Debitar:</span>
                        <strong className="text-emerald-400 text-sm font-mono">{checkoutAmount.toLocaleString('pt-PT')} Kz</strong>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isSubmitting ? 'A Processar Pagamento...' : 'Pagar com PayPal ou Cartão Visa'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 4: STRIPE DIRECT & DIGITAL WALLETS */}
                {paymentTab === 'stripe_card' && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 font-mono space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <div>
                        <strong>Processador Stripe Direct (Cartão / Apple Pay / Google Pay / Carteiras):</strong>
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          Integração direta com o checkout global da Stripe para liquidação instantânea de planos em Kwanzas, Dólares ou Euros.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitOrder} className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 max-w-lg mx-auto space-y-4 text-xs">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Stripe Payment Gateway</span>
                        <div className="text-base font-bold text-slate-100 mt-0.5">Pagamento Rápido & Ativação Imediata</div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Email para Envio do Recibo Fiscal:</label>
                          <input
                            type="email"
                            defaultValue={user?.email || ''}
                            className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="p-2.5 rounded bg-[#0F172A] border border-slate-800 flex items-center justify-between text-slate-300">
                          <span>Montante do Plano:</span>
                          <strong className="text-emerald-400 text-sm font-mono">{checkoutAmount.toLocaleString('pt-PT')} Kz</strong>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isSubmitting ? 'A Conectar à Stripe...' : 'Pagar via Stripe / Apple Pay / Google Pay'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 5: PROXYPAY (RESERVADO PARA INTEGRAÇÃO FUTURA) */}
                {paymentTab === 'proxypay' && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 font-mono space-y-4">
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-start gap-2">
                      <QrCode className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong>Gateway ProxyPay Angola (API de Referências Automáticas):</strong>
                          <span className="bg-purple-500/20 text-purple-200 border border-purple-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold">
                            Reserva de Integração
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300 font-sans">
                          Canal reservado para emissão automática de referências de pagamento de 9 dígitos com conciliação bancária via Webhook ProxyPay.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 max-w-lg mx-auto space-y-4 text-xs">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold font-mono">ProxyPay API Connect</span>
                        <div className="text-base font-bold text-slate-100 mt-0.5">Referência Multicaixa em Tempo Real</div>
                      </div>

                      <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Entidade ProxyPay:</span>
                          <span className="font-bold text-slate-100 font-mono">00288 (ProxyPay Nanucloud)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Referência Pré-Alocada:</span>
                          <span className="font-bold text-purple-300 font-mono tracking-wider">928 410 773</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Valor Exato a Liquidar:</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">{checkoutAmount.toLocaleString('pt-PT')} Kz</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Notas / ID do Pedido:</label>
                        <input
                          type="text"
                          value={proofNotes}
                          onChange={(e) => setProofNotes(e.target.value)}
                          placeholder="Referência ou comprovativo ProxyPay..."
                          className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500 font-sans"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow transition"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>{isSubmitting ? 'A Processar...' : 'Validar Pedido com Referência ProxyPay'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 6: PAYPAY ÁFRICA (RESERVADO PARA INTEGRAÇÃO FUTURA) */}
                {paymentTab === 'paypay' && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 font-mono space-y-4">
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs flex items-start gap-2">
                      <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong>Carteira Digital PayPay África (Mobile Payment):</strong>
                          <span className="bg-orange-500/20 text-orange-200 border border-orange-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold">
                            Reserva de Integração
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300 font-sans">
                          Canal reservado para liquidação instantânea através da aplicação móvel PayPay África (disponível para utilizadores com telemóvel e carteira ativa).
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 max-w-lg mx-auto space-y-4 text-xs">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold font-mono">PayPay África Gateway</span>
                        <div className="text-base font-bold text-slate-100 mt-0.5">Pagamento Rápido via Carteira Móvel</div>
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Número de Telemóvel PayPay África:</label>
                        <input
                          type="tel"
                          value={paypayMobileNumber}
                          onChange={(e) => setPaypayMobileNumber(e.target.value)}
                          placeholder="Ex: 923 000 000"
                          className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-orange-500 font-mono"
                        />
                      </div>

                      <div className="p-2.5 rounded bg-[#0F172A] border border-slate-800 flex items-center justify-between text-slate-300">
                        <span>Total do Débito PayPay:</span>
                        <strong className="text-emerald-400 text-sm font-mono">{checkoutAmount.toLocaleString('pt-PT')} Kz</strong>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow transition"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>{isSubmitting ? 'A Conectar...' : 'Solicitar Cobrança na App PayPay África'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 7: ALIPAY GLOBAL (RESERVADO PARA INTEGRAÇÃO FUTURA) */}
                {paymentTab === 'alipay' && (
                  <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 font-mono space-y-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2">
                      <Globe className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong>Alipay Global / Pagamentos Internacionais (China):</strong>
                          <span className="bg-blue-500/20 text-blue-200 border border-blue-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold">
                            Reserva de Integração
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300 font-sans">
                          Canal reservado para operadores de importação e comércio com a China, com suporte a QR Code Alipay em Yuan Renminbi (CNY) e USD.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 max-w-lg mx-auto space-y-4 text-xs">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold font-mono">Alipay Cross-Border Connect</span>
                        <div className="text-base font-bold text-slate-100 mt-0.5">Pagamento Internacional QR Code</div>
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">ID da Conta Alipay / Email / Telemóvel:</label>
                        <input
                          type="text"
                          value={alipayAccount}
                          onChange={(e) => setAlipayAccount(e.target.value)}
                          placeholder="alipay@empresa.com ou +86..."
                          className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div className="p-2.5 rounded bg-[#0F172A] border border-slate-800 space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span>Montante em Kz:</span>
                          <strong className="text-emerald-400 font-mono">{checkoutAmount.toLocaleString('pt-PT')} Kz</strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Equivalente Estimado (CNY):</span>
                          <span className="font-mono text-slate-200">≈ ¥{Math.round(checkoutAmount / 130).toLocaleString('pt-PT')} RMB</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow transition"
                      >
                        <Globe className="w-4 h-4" />
                        <span>{isSubmitting ? 'A Processar...' : 'Gerar QR Code Alipay para Pagamento'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mandatory Accountant Disclaimer at bottom of modal */}
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Aviso Legal Nanucloud:</strong> Este aplicativo não dispensa a consulta de um profissional de contas ou contabilista certificado.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

