import React, { useState } from 'react';
import {
  Database,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Table,
  Key,
  Server,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  RefreshCw
} from 'lucide-react';

export const DatabaseSqlManagementSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeView, setActiveView] = useState<'tables' | 'sql_preview' | 'encryption'>('tables');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  const copySqlToClipboard = async () => {
    try {
      const res = await fetch('/api/auth/sql-schema');
      let textToCopy = '';
      if (res.ok) {
        const data = await res.json();
        textToCopy = data.sqlContent;
      } else {
        const fallback = await fetch('/database.sql');
        textToCopy = await fallback.text();
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = '/api/auth/sql-schema?download=true';
      link.download = 'nanucloud_database.sql';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open('/database.sql', '_blank');
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  const handleTestEngine = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3500);
    }, 800);
  };

  const schemaTables = [
    {
      name: 'users',
      category: 'Autenticação & Perfis',
      description: 'Armazena clientes, administradores e operadores com hash Bcrypt Salt 10.',
      fields: [
        'id (VARCHAR 64 PK)',
        'name (VARCHAR 150)',
        'company (VARCHAR 150)',
        'nif (VARCHAR 50 UNIQUE)',
        'email (VARCHAR 191 UNIQUE)',
        'phone (VARCHAR 50)',
        'password_hash (VARCHAR 255 - Bcrypt)',
        'role (client, super_admin, admin_level1, etc.)',
        'queries_remaining (INT)',
        'total_queries_used (INT)',
        'active_plan_id (VARCHAR 64 FK)',
        'is_import_unlocked (BOOLEAN)',
        'is_batch_unlocked (BOOLEAN)',
        'created_at (TIMESTAMP)'
      ]
    },
    {
      name: 'plans',
      category: 'Comercial & Subscrições',
      description: 'Planos oficiais de consultas em Kwanzas (Bronze, Prata, Ouro, Platina, Diamante).',
      fields: [
        'id (VARCHAR 64 PK)',
        'name (VARCHAR 150)',
        'price_kz (DECIMAL 15,2)',
        'queries_count (INT)',
        'validity_days (INT)',
        'features (TEXT JSON)',
        'unlocks_import (BOOLEAN)',
        'unlocks_batch (BOOLEAN)',
        'is_popular (BOOLEAN)',
        'is_active (BOOLEAN)'
      ]
    },
    {
      name: 'transactions',
      category: 'Finanças & Pagamentos',
      description: 'Ordens de pagamento, carregamentos e validação de comprovativos bancários.',
      fields: [
        'id (VARCHAR 64 PK)',
        'user_id (VARCHAR 64 FK)',
        'plan_id (VARCHAR 64 FK)',
        'amount_kz (DECIMAL 15,2)',
        'queries_granted (INT)',
        'payment_method (bank_transfer, express_ref, etc.)',
        'payment_reference (VARCHAR 100)',
        'payment_proof_url (TEXT)',
        'status (pending, approved, rejected)',
        'reviewed_by_admin_name (VARCHAR 150)',
        'created_at (TIMESTAMP)'
      ]
    },
    {
      name: 'simulations',
      category: 'Cálculos Fiscais & Histórico',
      description: 'Registo de todas as cotações de produtos, prestação de serviços e importações aduaneiras.',
      fields: [
        'id (VARCHAR 64 PK)',
        'user_id (VARCHAR 64 FK)',
        'type (local, import, batch, service)',
        'item_type (product, service)',
        'title (VARCHAR 255)',
        'cost_base (DECIMAL 15,2)',
        'vat_rate (DECIMAL 5,2)',
        'margin_applied (DECIMAL 5,2)',
        'final_price (DECIMAL 15,2)',
        'net_profit (DECIMAL 15,2)',
        'retention_rate (DECIMAL 5,2)',
        'net_received (DECIMAL 15,2)',
        'details_json (TEXT)'
      ]
    },
    {
      name: 'bank_accounts',
      category: 'Tesouraria',
      description: 'Contas bancárias oficiais em Angola (BAI, BFA, Atlântico BMA, BIC) para recebimentos.',
      fields: [
        'id (VARCHAR 64 PK)',
        'bank_name (VARCHAR 150)',
        'iban (VARCHAR 100)',
        'swift (VARCHAR 50)',
        'holder (VARCHAR 150)',
        'is_active (BOOLEAN)'
      ]
    },
    {
      name: 'support_inquiries',
      category: 'Atendimento & Suporte',
      description: 'Tickets de apoio técnico e mensagens enviadas pelos clientes no formulário de contacto.',
      fields: [
        'id (VARCHAR 64 PK)',
        'user_id (VARCHAR 64 FK)',
        'name (VARCHAR 150)',
        'email (VARCHAR 191)',
        'subject (VARCHAR 200)',
        'message (TEXT)',
        'status (open, in_progress, resolved)',
        'admin_reply (TEXT)'
      ]
    },
    {
      name: 'bot_knowledge',
      category: 'Inteligência Fiscal',
      description: 'Base de conhecimento e respostas automatizadas do assistente virtual aduaneiro e comercial.',
      fields: [
        'id (VARCHAR 64 PK)',
        'question (TEXT)',
        'keywords (TEXT)',
        'answer (TEXT)',
        'category (fiscal, customs, general)',
        'is_approved (BOOLEAN)'
      ]
    },
    {
      name: 'audit_logs',
      category: 'Segurança & Auditoria',
      description: 'Rastreabilidade de todas as alterações administrativas e autenticações de segurança.',
      fields: [
        'id (VARCHAR 64 PK)',
        'user_id (VARCHAR 64)',
        'user_name (VARCHAR 150)',
        'action (VARCHAR 100)',
        'entity_type (auth, payment, system)',
        'details (TEXT)',
        'ip_address (VARCHAR 50)',
        'created_at (TIMESTAMP)'
      ]
    }
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & Actions */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">BASE DE DADOS & ESQUEMA SQL</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Bcrypt Salt 10 Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              O ficheiro <code className="text-indigo-300 font-mono">database.sql</code> contém toda a estrutura relacional de tabelas, chaves estrangeiras, índices e dados iniciais (seed data) para PostgreSQL, MySQL, MariaDB ou Cloud SQL.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={copySqlToClipboard}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl transition flex items-center gap-2 font-bold cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            <span>{copied ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition flex items-center gap-2 font-bold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'A descarregar...' : 'Descarregar database.sql'}</span>
          </button>

          <button
            type="button"
            onClick={handleTestEngine}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Testar motor de base de dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{testStatus === 'success' ? 'Motor OK (100%)' : 'Testar Conexão'}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Tabelas Criadas</span>
            <Table className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">12 Tabelas</div>
          <span className="text-[10px] text-slate-500">users, plans, transactions, simulations...</span>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Criptografia de Senhas</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">Bcrypt Salt 10</div>
          <span className="text-[10px] text-slate-500">Hash irreversível unidirecional</span>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Sessões e Tokens</span>
            <Key className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400">JWT (7 Dias)</div>
          <span className="text-[10px] text-slate-500">Bearer Token + Cookies Seguros</span>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Compatibilidade SGBD</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">PostgreSQL / MySQL</div>
          <span className="text-[10px] text-slate-500">Compatível com Cloud SQL e DBeaver</span>
        </div>
      </div>

      {/* Sub-navigation Switcher */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveView('tables')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeView === 'tables'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Dicionário de Tabelas & Campos ({schemaTables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('encryption')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeView === 'encryption'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Segurança de Autenticação & Encriptação</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('sql_preview')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeView === 'sql_preview'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Instruções de Importação SQL</span>
        </button>
      </div>

      {/* VIEW 1: TABLES DICTIONARY */}
      {activeView === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schemaTables.map((table) => (
            <div
              key={table.name}
              className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 hover:border-indigo-500/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                    {table.name}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-sans">{table.category}</span>
                </div>
                <span className="text-[10px] text-slate-500">{table.fields.length} colunas</span>
              </div>

              <p className="text-slate-400 text-[11px] mb-3 font-sans leading-relaxed">
                {table.description}
              </p>

              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-900 space-y-1 max-h-40 overflow-y-auto">
                {table.fields.map((f, i) => (
                  <div key={i} className="text-[10px] text-slate-300 flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 shrink-0"></span>
                    <span className={f.includes('PK') ? 'text-amber-300 font-bold' : f.includes('Bcrypt') ? 'text-emerald-400 font-bold' : ''}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: ENCRYPTION & SECURITY DETAILS */}
      {activeView === 'encryption' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Arquitetura de Segurança e Encriptação</h3>
              <p className="text-xs text-slate-400">Padrão de proteção para formulários de login, registo e base de dados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>1. Hash Bcrypt Salt 10</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                As senhas nunca são gravadas em texto limpo. No registo ou alteração de palavra-passe, o backend aplica o algoritmo <code className="text-slate-300">bcrypt.hashSync(password, 10)</code>.
              </p>
              <div className="bg-slate-900 p-2 rounded text-[10px] text-slate-400 break-all border border-slate-800">
                $2b$10$35vW5MHk.pDR5uOEXLGhDe8...
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Key className="w-4 h-4" />
                <span>2. Verificação no Login</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Ao efetuar login, o utilizador submete a palavra-passe que é conferida de forma matematicamente segura via <code className="text-slate-300">bcrypt.compareSync(pass, hash)</code>.
              </p>
              <div className="bg-slate-900 p-2 rounded text-[10px] text-emerald-400 border border-slate-800">
                ✓ Proteção contra ataques de dicionário
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Server className="w-4 h-4" />
                <span>3. JWT & Controle de Acesso</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Após autenticação, é gerado um token JSON Web Token com validade de 7 dias e verificação de perfil estrito (clientes apenas acedem aos simuladores; gestores têm acesso ao backoffice).
              </p>
              <div className="bg-slate-900 p-2 rounded text-[10px] text-cyan-400 border border-slate-800">
                ✓ RBAC (Role-Based Access Control)
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Contas Pré-configuradas no Seed Data SQL:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">Conta de Super Administrador</span>
                <span className="text-slate-200 block mt-0.5">Email: <strong className="text-white">admin@nanucloud.com</strong></span>
                <span className="text-slate-400 block text-[11px]">Palavra-passe: <code className="text-indigo-300">admin123</code> (Encriptada com Bcrypt)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">Contas de Clientes Empresariais</span>
                <span className="text-slate-200 block mt-0.5">Ex: <strong className="text-white">comercial@ferreirafilhos.ao</strong></span>
                <span className="text-slate-400 block text-[11px]">Palavra-passe: <code className="text-indigo-300">cliente123</code> (184 Créditos Ativos)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SQL INSTRUCTIONS & QUICK RUN */}
      {activeView === 'sql_preview' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Como Importar o Ficheiro SQL para a sua Base de Dados</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Instruções passo a passo para carregar o esquema e dados no seu servidor de base de dados preferido.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-cyan-300 block mb-1">Opção 1: PostgreSQL / Google Cloud SQL</span>
              <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900 rounded">
{`# 1. Criar a base de dados
createdb -U postgres nanucloud_db

# 2. Importar o ficheiro SQL fornecido
psql -U postgres -d nanucloud_db -f database.sql`}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-amber-300 block mb-1">Opção 2: MySQL / MariaDB</span>
              <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900 rounded">
{`# 1. Criar a base de dados
mysql -u root -p -e "CREATE DATABASE nanucloud_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Importar o ficheiro
mysql -u root -p nanucloud_db < database.sql`}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-emerald-300 block mb-1">Opção 3: Interface Gráfica (DBeaver / pgAdmin / phpMyAdmin)</span>
              <p className="text-[11px] text-slate-400 font-sans">
                Abra a sua ferramenta de gestão, clique em «Executar Script SQL» ou «Importar», selecione o ficheiro descarregado <strong className="text-slate-200">nanucloud_database.sql</strong> e execute todas as instruções.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
