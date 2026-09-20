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
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth, DEMO_CLIENTS } from '../context/AuthContext';

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
  const { loginClient, loginAdmin, registerClient } = useAuth();
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>(initialTab);
  const [clientMode, setClientMode] = useState<'login' | 'register'>('login');

  // Client Login fields
  const [clientEmailOrNif, setClientEmailOrNif] = useState('');
  const [clientPassword, setClientPassword] = useState('');

  // Client Register fields
  const [regName, setRegName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regNif, setRegNif] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCategory, setRegCategory] = useState<'comercio' | 'servicos' | 'importacao' | 'industria' | 'liberal' | 'outro'>('comercio');

  // Admin Login fields
  const [adminEmail, setAdminEmail] = useState('admin@nanucloud.com');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!clientEmailOrNif.trim()) {
      setErrorMsg('Por favor informe o Email ou NIF da sua empresa.');
      return;
    }

    const res = await loginClient(clientEmailOrNif, clientPassword);
    if (res.success) {
      setSuccessMsg('Sessão iniciada com sucesso na Área de Clientes!');
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess('client');
      }, 500);
    } else {
      setErrorMsg(res.error || 'Credenciais inválidas.');
    }
  };

  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await registerClient({
      name: regName,
      companyName: regCompanyName,
      nif: regNif,
      email: regEmail,
      phone: regPhone,
      category: regCategory
    }, regPassword || 'cliente123');

    if (res.success) {
      setSuccessMsg('Conta criada com sucesso com criptografia Bcrypt! Bem-vindo ao simulador.');
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess('client');
      }, 600);
    } else {
      setErrorMsg(res.error || 'Erro ao registar conta.');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await loginAdmin(adminEmail, adminPassword);
    if (res.success) {
      setSuccessMsg('Autenticado com sucesso no Painel de Gestão Administrativa!');
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess('admin');
      }, 500);
    } else {
      setErrorMsg(res.error || 'Erro de autenticação administrativa.');
    }
  };

  const handleQuickDemoClient = async (client: typeof DEMO_CLIENTS[0]) => {
    await loginClient(client.email);
    setSuccessMsg(`Sessão iniciada como "${client.company}" (${client.queriesRemaining} créditos)!`);
    setTimeout(() => {
      onClose();
      if (onLoginSuccess) onLoginSuccess('client');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#1E293B] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {activeTab === 'client' ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4 text-cyan-400" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                {activeTab === 'client' ? 'ÁREA RESERVADA DO CLIENTE' : 'ÁREA RESERVADA DOS GESTORES'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {activeTab === 'client'
                  ? 'Login da Empresa (Email ou NIF) e Registo de Nova Conta'
                  : 'Acesso Reservado à Gerência, Aprovações e Finanças'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/70 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('client');
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

        {/* TAB 1: CLIENT TAB */}
        {activeTab === 'client' && (
          <div className="p-6 space-y-5">
            {/* Switch between Login and Register */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClientMode('login')}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition ${
                    clientMode === 'login'
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Entrar com Conta
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('register')}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition ${
                    clientMode === 'register'
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Registar Nova Empresa
                </button>
              </div>
            </div>

            {/* Login Form */}
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Palavra-passe
                  </label>
                  <input
                    type="password"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="Palavra-passe (ou deixe vazio para acesso direto)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Aceder à Minha Conta de Cliente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Register Form */}
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
                      placeholder="ex: João Manuel"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" /> Sector de Atividade
                    </label>
                    <select
                      value={regCategory}
                      onChange={(e: any) => setRegCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="comercio">Comércio Geral</option>
                      <option value="servicos">Prestação de Serviços</option>
                      <option value="importacao">Importação & Logística</option>
                      <option value="industria">Indústria / Fabril</option>
                      <option value="liberal">Profissional Liberal</option>
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
                      placeholder="financeiro@empresa.ao"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Telefone
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
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
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
                    🔒 A sua senha será encriptada irreversivelmente e guardada na tabela <code className="text-indigo-300">users</code> da base de dados.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Criar Conta de Cliente</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Demo Clients for instant testing */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Clientes Demo com Saldo Real (1-Clique)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_CLIENTS.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickDemoClient(c)}
                    className="text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate max-w-[140px]">
                        {c.company}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        {c.queriesRemaining} Créditos
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {c.name} • {c.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN TAB */}
        {activeTab === 'admin' && (
          <div className="p-6 space-y-5">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3.5 rounded-xl text-xs font-mono text-cyan-300">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Portal de Administração do Sistema</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Gestão central de aprovação de pagamentos, chat de suporte, alteração de preços e atribuição/redução de créditos.
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Palavra-passe de Acesso
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Entrar na Área de Gestão Administrativa</span>
              </button>
            </form>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  loginAdmin('admin@nanucloud.com');
                  setSuccessMsg('Autenticado como Super Administrador!');
                  setTimeout(() => {
                    onClose();
                    if (onLoginSuccess) onLoginSuccess('admin');
                  }, 400);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Entrar Imediatamente como Super Administrador (Acesso Rápido)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
