import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Building,
  Mail,
  Lock,
  Phone,
  Hash,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  Send,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'client' | 'admin';
  onLoginSuccess?: (role: 'client' | 'admin') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'client',
  onLoginSuccess
}) => {
  const { 
    loginClient, 
    loginAdmin, 
    registerClient, 
    loginSocial, 
    requestPasswordReset, 
    resetPassword 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'client' | 'admin'>(initialTab);
  const [clientMode, setClientMode] = useState<'login' | 'register' | 'forgot_password' | 'reset_password'>('login');

  // Client Login fields
  const [clientEmailOrNif, setClientEmailOrNif] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Client Register fields
  const [regName, setRegName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regNif, setRegNif] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCategory, setRegCategory] = useState<'comercio' | 'servicos' | 'importacao' | 'industria' | 'liberal' | 'outro'>('comercio');

  // Password Reset fields
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpDevHint, setOtpDevHint] = useState<string | null>(null);

  // Social Login Modal state
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'facebook'>('google');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialCompany, setSocialCompany] = useState('');

  // Admin Login fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Client Login Handler
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!clientEmailOrNif.trim()) {
      setErrorMsg('Por favor introduza o Email ou NIF da sua empresa.');
      return;
    }
    if (!clientPassword.trim()) {
      setErrorMsg('A palavra-passe de acesso é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginClient(clientEmailOrNif.trim(), clientPassword);
      if (res.success) {
        setSuccessMsg('Sessão iniciada com sucesso! Bem-vindo.');
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) onLoginSuccess('client');
        }, 500);
      } else {
        setErrorMsg(res.error || 'Credenciais inválidas ou utilizador inativo no banco de dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Client Registration Handler
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regCompanyName.trim() || !regEmail.trim() || !regNif.trim()) {
      setErrorMsg('Razão Social, NIF e Email da empresa são obrigatórios.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('A palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerClient({
        name: regName.trim(),
        companyName: regCompanyName.trim(),
        nif: regNif.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        category: regCategory
      }, regPassword);

      if (res.success) {
        setSuccessMsg('Conta de cliente registada com sucesso na base de dados! Bem-vindo.');
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) onLoginSuccess('client');
        }, 600);
      } else {
        setErrorMsg(res.error || 'Erro ao registar utilizador na base de dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Admin Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMsg('O e-mail e a palavra-passe administrativa são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(adminEmail.trim(), adminPassword);
      if (res.success) {
        setSuccessMsg('Autenticado com sucesso na Área de Gestão Administrativa!');
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) onLoginSuccess('admin');
        }, 500);
      } else {
        setErrorMsg(res.error || 'Credenciais administrativas incorretas ou conta suspensa.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Request Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setOtpDevHint(null);

    if (!resetIdentifier.trim()) {
      setErrorMsg('Introduza o Email ou NIF associado à sua conta de cliente.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(resetIdentifier.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'Código de verificação gerado com sucesso!');
        if (res.devOtpPreview) {
          setOtpDevHint(res.devOtpPreview);
          setResetCode(res.devOtpPreview);
        }
        setClientMode('reset_password');
      } else {
        setErrorMsg(res.error || 'Não foi possível encontrar uma conta ativa com os dados fornecidos.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Password Reset with New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetCode.trim()) {
      setErrorMsg('Por favor introduza o código de verificação de 6 dígitos.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da palavra-passe não coincide.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(resetIdentifier.trim(), resetCode.trim(), newPassword);
      if (res.success) {
        setSuccessMsg('Palavra-passe alterada com sucesso! Inicie sessão com a nova senha.');
        setClientEmailOrNif(resetIdentifier);
        setClientPassword('');
        setTimeout(() => {
          setClientMode('login');
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Código de verificação inválido ou expirado.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 6. Social Login Action Trigger
  const triggerSocialAuth = (provider: 'google' | 'facebook') => {
    setSocialProvider(provider);
    setSocialEmail(provider === 'google' ? 'utilizador@gmail.com' : 'cliente@facebook.com');
    setSocialName(provider === 'google' ? 'Conta Google' : 'Utilizador Facebook');
    setSocialCompany('Empresa Comercial ' + (provider === 'google' ? 'Google' : 'Facebook'));
    setSocialModalOpen(true);
  };

  const handleConfirmSocialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!socialEmail.trim()) {
      setErrorMsg('O endereço de e-mail é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginSocial(socialProvider, {
        email: socialEmail.trim(),
        name: socialName.trim(),
        companyName: socialCompany.trim()
      });

      if (res.success) {
        setSocialModalOpen(false);
        setSuccessMsg(
          res.isNewUser 
            ? `Conta criada e ativada via ${socialProvider === 'google' ? 'Google' : 'Facebook'}! Atribuídos 10 créditos bónus.`
            : `Autenticado com sucesso via ${socialProvider === 'google' ? 'Google' : 'Facebook'}!`
        );
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) onLoginSuccess('client');
        }, 600);
      } else {
        setErrorMsg(res.error || 'Erro ao processar autenticação social.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white tracking-wide">
                Autenticação NANUCLOUD
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Acesso seguro com criptografia Bcrypt e verificação em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('client');
              setClientMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'client'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Área do Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Área dos Gestores</span>
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: CLIENT AREA */}
        {/* ================================================================= */}
        {activeTab === 'client' && (
          <div className="p-6 space-y-5">
            
            {/* Quick Social Registration/Login (Google & Facebook) */}
            {(clientMode === 'login' || clientMode === 'register') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider">
                    Cadastro Rápido de Cliente
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">
                    +10 Créditos Grátis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => triggerSocialAuth('google')}
                    className="flex items-center justify-center gap-2.5 py-2.5 px-3 bg-slate-950 hover:bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-mono font-semibold text-slate-200 transition cursor-pointer shadow-sm group"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com Google</span>
                  </button>

                  {/* Facebook Button */}
                  <button
                    type="button"
                    onClick={() => triggerSocialAuth('facebook')}
                    className="flex items-center justify-center gap-2.5 py-2.5 px-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 hover:border-[#1877F2]/50 rounded-xl text-xs font-mono font-semibold text-[#1877F2] transition cursor-pointer shadow-sm group"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Entrar com Facebook</span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    ou com credenciais
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>
              </div>
            )}

            {/* Submode Switcher (Login / Register / Forgot Password) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    clientMode === 'login'
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Iniciar Sessão
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    clientMode === 'register'
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Registar Nova Empresa
                </button>
              </div>

              {clientMode !== 'login' && clientMode !== 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              )}
            </div>

            {/* 1. Client Standard Login Form */}
            {clientMode === 'login' && (
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email ou NIF da Empresa
                  </label>
                  <input
                    type="text"
                    required
                    value={clientEmailOrNif}
                    onChange={(e) => setClientEmailOrNif(e.target.value)}
                    placeholder="ex: comercial@empresa.ao ou 5412093847"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Palavra-passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetIdentifier(clientEmailOrNif);
                        setClientMode('forgot_password');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Esqueceu a palavra-passe?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="Introduza a sua palavra-passe"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Entrar na Minha Conta</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. Client Register Form */}
            {clientMode === 'register' && (
              <form onSubmit={handleClientRegister} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" /> Razão Social / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      placeholder="ex: Luanda Comercial Lda"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-400" /> NIF da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={regNif}
                      onChange={(e) => setRegNif(e.target.value)}
                      placeholder="ex: 5419082341"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> Nome do Responsável
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="ex: João Manuel Silva"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" /> Setor de Atividade
                    </label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="comercio">Comércio Geral & Retalho</option>
                      <option value="importacao">Importação & Logística</option>
                      <option value="servicos">Prestação de Serviços</option>
                      <option value="industria">Indústria Transformadora</option>
                      <option value="liberal">Profissão Liberal / Consultoria</option>
                      <option value="outro">Outro Setor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> Email Comercial *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="comercial@empresa.ao"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Telefone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+244 923 000 000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" /> Palavra-passe de Acesso *
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      Criptografia Bcrypt (Salt 10)
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres (ex: SenhaSegura2026)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    🔒 A sua senha será encriptada e guardada com segurança na tabela <code className="text-indigo-300">users</code> da base de dados.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Criar Conta de Cliente</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 3. Forgot Password - Request OTP Form */}
            {clientMode === 'forgot_password' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl text-xs font-mono text-indigo-300">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span>Recuperação e Reposição de Palavra-passe</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Introduza o Email ou NIF da sua empresa cadastrada. Geraremos um código OTP de verificação de 6 dígitos para validar a sua identidade.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email ou NIF Registado
                  </label>
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="ex: comercial@empresa.ao ou 5412093847"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Código de 6 Dígitos</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 4. Reset Password - Submit New Password Form */}
            {clientMode === 'reset_password' && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Código OTP Gerado com Sucesso</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Insira o código de 6 dígitos e defina a sua nova palavra-passe de acesso.
                  </p>
                  {otpDevHint && (
                    <div className="mt-2 p-2 bg-slate-950/80 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Código gerado (Ambiente de Teste):</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest">{otpDevHint}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Código de Verificação (6 Dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono text-center tracking-widest text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Nova Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Confirmar Nova Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova palavra-passe"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Atualizar Palavra-passe na Base de Dados</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ADMIN / MANAGERS TAB */}
        {/* ================================================================= */}
        {activeTab === 'admin' && (
          <div className="p-6 space-y-5">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3.5 rounded-xl text-xs font-mono text-cyan-300">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Portal de Administração do Sistema</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Acesso restrito para administradores ativos. Gestão central de aprovação de pagamentos, chat de suporte, tabela de preços e auditoria de segurança.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Administrativo
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@nanucloud.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Palavra-passe Administrativa
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Introduza a sua palavra-passe de gestor"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400">
                🛡️ <span className="text-slate-300 font-semibold">Segurança Reforçada:</span> Apenas contas com estado ativo e perfil administrativo registadas na tabela <code className="text-cyan-300">users</code> têm permissão de acesso.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Entrar na Área de Gestão Administrativa</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Social Login / Quick Signup Modal */}
      {socialModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {socialProvider === 'google' ? (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <h3 className="text-sm font-mono font-bold text-white">
                  Confirmar Acesso com {socialProvider === 'google' ? 'Google' : 'Facebook'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-mono text-slate-300">
              O seu perfil será automaticamente inscrito e ativado na base de dados com 10 créditos de boas-vindas:
            </p>

            <form onSubmit={handleConfirmSocialAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Endereço de Email ({socialProvider === 'google' ? 'Google' : 'Facebook'})
                </label>
                <input
                  type="email"
                  required
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Nome do Titular
                </label>
                <input
                  type="text"
                  required
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Nome Comercial / Empresa
                </label>
                <input
                  type="text"
                  value={socialCompany}
                  onChange={(e) => setSocialCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-mono font-bold text-xs text-white flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Confirmar & Entrar</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
