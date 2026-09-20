-- ============================================================================
-- NANUCLOUD FISCAL SUITE & SIMULADOR COMERCIAL ANGOLA
-- FICHEIRO DE IMPORTAÇÃO E CRIAÇÃO DA BASE DE DADOS (SQL COMPLETO)
-- Compatibilidade: PostgreSQL 12+, MySQL 8+, MariaDB 10.5+, Cloud SQL
-- ============================================================================
-- Instruções de Execução / Importação:
--   PostgreSQL: psql -U seu_usuario -d sua_base_de_dados -f database.sql
--   MySQL:      mysql -u seu_usuario -p sua_base_de_dados < database.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELA DE PLANOS DE CONSULTAS E SUBSCRIÇÕES (plans)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price_kz DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  queries_count INT NOT NULL DEFAULT 0,
  queries_included INT NOT NULL DEFAULT 0,
  validity_days INT NOT NULL DEFAULT 30,
  unit_price_kz DECIMAL(15, 2) DEFAULT 0.00,
  features TEXT,
  unlocks_import BOOLEAN NOT NULL DEFAULT FALSE,
  unlocks_batch BOOLEAN NOT NULL DEFAULT FALSE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE UTILIZADORES E CLIENTES (users)
-- Senhas encriptadas com algoritmo Bcrypt (Salt Rounds = 10)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) NOT NULL,
  nif VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  phone VARCHAR(50) DEFAULT '+244 923 000 000',
  country VARCHAR(50) DEFAULT 'Angola',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  client_category VARCHAR(50) DEFAULT 'comercio',
  department VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  queries_remaining INT NOT NULL DEFAULT 0,
  total_queries_used INT NOT NULL DEFAULT 0,
  active_plan_id VARCHAR(64) REFERENCES plans(id) ON DELETE SET NULL,
  active_plan_name VARCHAR(150),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  is_import_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_batch_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_api_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_daily_credit_date VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nif ON users(nif);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 3. TABELA DE CONTAS BANCÁRIAS E RECARGAS (bank_accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(64) PRIMARY KEY,
  bank_name VARCHAR(150) NOT NULL,
  iban VARCHAR(100) NOT NULL,
  swift VARCHAR(50),
  holder VARCHAR(150) NOT NULL,
  currency VARCHAR(20) DEFAULT 'AOA (Kz)',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. TABELA DE TRANSAÇÕES E PAGAMENTOS (transactions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(150) NOT NULL,
  user_email VARCHAR(191) NOT NULL,
  company_name VARCHAR(150),
  nif VARCHAR(50),
  plan_id VARCHAR(64) NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  plan_name VARCHAR(150) NOT NULL,
  amount_kz DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  queries_granted INT NOT NULL DEFAULT 0,
  validity_days INT NOT NULL DEFAULT 30,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),
  payment_proof_name VARCHAR(255),
  payment_proof_url TEXT,
  payment_proof_size INT,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by_admin_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_admin_name VARCHAR(150),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ----------------------------------------------------------------------------
-- 5. TABELA DE HISTÓRICO DE SIMULAÇÕES FISCAIS E CÁLCULOS (simulations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulations (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  item_type VARCHAR(50) DEFAULT 'product',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(10) DEFAULT 'AO',
  cost_base DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 14.00,
  margin_applied DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  final_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  net_profit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  retention_rate DECIMAL(5, 2) DEFAULT 0.00,
  retention_amount DECIMAL(15, 2) DEFAULT 0.00,
  net_received DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'AOA',
  details_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);

-- ----------------------------------------------------------------------------
-- 6. TABELA DE TICKETS E CONTACTOS DE SUPORTE (support_inquiries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_inquiries (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_by_admin_name VARCHAR(150),
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE MENSAGENS DO CHAT EM DIRETO (chat_messages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(191),
  sender_name VARCHAR(150) NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(100),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. TABELA DA BASE DE CONHECIMENTO DO BOT FISCAL (bot_knowledge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id VARCHAR(64) PRIMARY KEY,
  question TEXT NOT NULL,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'pt',
  category VARCHAR(50) DEFAULT 'fiscal',
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  learned_from_admin_name VARCHAR(150),
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. TABELA DE LOGS DE AUDITORIA E SEGURANÇA (audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  user_name VARCHAR(150),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64),
  ip_address VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. TABELA DE CONFIGURAÇÕES GLOBAIS DO SISTEMA (system_settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DADOS INICIAIS (SEED DATA)
-- Senhas encriptadas com algoritmo Bcrypt Salt 10:
--   - Conta Administrador: admin@nanucloud.com (Senha: admin123)
--   - Contas Demo Clientes: (Senha: cliente123)
-- ============================================================================

INSERT INTO plans (id, name, description, price_kz, queries_count, queries_included, validity_days, unit_price_kz, features, unlocks_import, unlocks_batch, is_popular, is_active, sort_order)
VALUES 
  ('plan_bronze', 'Plano Bronze', 'Ideal para pequenos comerciantes e profissionais liberais.', 500.00, 10, 10, 30, 50.00, '["10 Consultas Comerciais", "Cálculo de IVA e Margens", "Simulação de Retenção", "Exportação Básica"]', TRUE, TRUE, FALSE, TRUE, 1),
  ('plan_silver', 'Plano Prata', 'Para pequenos negócios com fluxo regular de cotações.', 1500.00, 30, 30, 30, 50.00, '["30 Consultas Comerciais", "Cálculo de Lucro Líquido Real", "Suporte WhatsApp Prioritário"]', TRUE, TRUE, FALSE, TRUE, 2),
  ('plan_gold', 'Plano Ouro Pro', 'Inclui Módulo Completo de Importação Aduaneira.', 3000.00, 60, 60, 30, 50.00, '["60 Consultas", "Módulo de Importação Aduaneira Desbloqueado", "Pauta Aduaneira Completa"]', TRUE, TRUE, TRUE, TRUE, 3),
  ('plan_platinum', 'Plano Platina Business', 'Solução completa para empresas com cálculo em lote.', 5000.00, 100, 100, 30, 50.00, '["100 Consultas", "Operações em Lote (Excel até 1000 linhas)", "Desbloqueio de Todos os Módulos"]', TRUE, TRUE, FALSE, TRUE, 4),
  ('plan_diamond', 'Plano Diamante Enterprise', 'Consultoria e volume para grandes organizações.', 10000.00, 200, 200, 30, 50.00, '["200 Consultas VIP", "Atendimento por Super Administrador", "Acesso Total Irrestrito"]', TRUE, TRUE, FALSE, TRUE, 5)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price_kz = EXCLUDED.price_kz, 
  queries_count = EXCLUDED.queries_count;

INSERT INTO bank_accounts (id, bank_name, iban, swift, holder, currency, is_active)
VALUES
  ('bank_bai_01', 'Banco Angolano de Investimentos (BAI)', 'AO06 0040 0000 0692 4329 1010 6', 'BAIAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE),
  ('bank_bfa_02', 'Banco de Fomento Angola (BFA)', 'AO06 0006 0000 9745 7140 3018 1', 'BFAAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE),
  ('bank_bma_03', 'Banco Millennium Atlântico (BMA)', 'AO06 0055 0000 2469 9241 1017 7', 'BMAAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE),
  ('bank_bic_04', 'Banco BIC Angola', 'AO06 0051 0000 7027 5788 1519 5', 'BICAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, company, nif, email, phone, country, password_hash, role, department, is_active, queries_remaining, total_queries_used, is_import_unlocked, is_batch_unlocked, is_api_unlocked)
VALUES 
  ('usr_admin_nanucloud', 'Super Administrador NANUCLOUD', 'NANUCLOUD TECNOLOGIA LDA', '5001294819', 'admin@nanucloud.com', '+244 954 269 353', 'Angola', '$2b$10$35vW5MHk.pDR5uOEXLGhDe8QD2JGoa9riROP6duFZsl.uNV0k36CG', 'super_admin', 'Direção Geral & Finanças', TRUE, 999999, 0, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

INSERT INTO users (id, name, company, nif, email, phone, country, password_hash, role, client_category, is_active, queries_remaining, total_queries_used, active_plan_id, active_plan_name, is_import_unlocked, is_batch_unlocked, is_api_unlocked)
VALUES 
  ('cli_001', 'António Gaspar Ferreira', 'Ferreira & Filhos Comércio Geral Lda', '5412093847', 'comercial@ferreirafilhos.ao', '+244 923 456 789', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'comercio', TRUE, 184, 116, 'plan_gold', 'Plano Ouro Pro', TRUE, TRUE, FALSE),
  ('cli_002', 'Dra. Maria Eunice Santos', 'Santos & Associados Consultoria', '5409281742', 'maria.santos@santosconsultoria.co.ao', '+244 945 112 233', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'servicos', TRUE, 742, 258, 'plan_diamond', 'Plano Diamante Enterprise', TRUE, TRUE, TRUE),
  ('cli_003', 'Eng. Carlos Alberto Mendes', 'Mendes Import & Export Transitários', '5418829103', 'carlos.mendes@mendesimport.ao', '+244 912 887 766', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'importacao', TRUE, 45, 255, 'plan_gold', 'Plano Ouro Pro', TRUE, TRUE, FALSE),
  ('cli_004', 'Teresa Cristina Neto', 'Boutique & Cosméticos Luanda', '5420194831', 'loja@boutiqueluanda.com', '+244 933 654 321', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'comercio', TRUE, 8, 42, 'plan_bronze', 'Plano Bronze', FALSE, FALSE, FALSE)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash;
