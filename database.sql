-- ============================================================================
-- NANUCLOUD FISCAL SUITE & SIMULADOR COMERCIAL ANGOLA
-- FICHEIRO DE IMPORTAÇÃO E CRIAÇÃO DA BASE DE DADOS (SQL COMPLETO)
-- Compatibilidade: PostgreSQL 12+, MySQL 8+, MariaDB 10.5+, Cloud SQL
-- ============================================================================
-- Instruções de Execução / Importação:
--   PostgreSQL: psql -U seu_usuario -d sua_base_de_dados -f database.sql
--   MySQL:      mysql -u seu_usuario -p sua_base_de_dados < database.sql
-- ============================================================================

-- Desativar verificação de chaves estrangeiras temporariamente para importação limpa
-- (Descomente conforme o SGBD utilizado)
-- MySQL: SET FOREIGN_KEY_CHECKS = 0;

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
  features TEXT, -- JSON ou lista de funcionalidades delimitada
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
  password_hash VARCHAR(255) NOT NULL, -- Hash Bcrypt seguro
  role VARCHAR(50) NOT NULL DEFAULT 'client', -- 'client', 'super_admin', 'admin_level1', 'admin_level2', 'manager', 'staff'
  client_category VARCHAR(50) DEFAULT 'comercio', -- 'comercio', 'servicos', 'importacao', 'industria', 'liberal'
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
-- Registos de compras de planos e comprovativos bancários enviados
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
  payment_method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'multicaixa_express', 'express_ref', 'express_phone'
  payment_reference VARCHAR(100),
  payment_proof_name VARCHAR(255),
  payment_proof_url TEXT,
  payment_proof_size INT,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
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
-- Guarda cada cálculo realizado pelos utilizadores (produtos, serviços, importações)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulations (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'local', 'import', 'batch', 'service'
  item_type VARCHAR(50) DEFAULT 'product', -- 'product', 'service'
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
  details_json TEXT, -- Detalhes completos do cálculo em formato JSON
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
  status VARCHAR(30) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
  admin_reply TEXT,
  replied_by_admin_name VARCHAR(150),
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_status ON support_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_support_email ON support_inquiries(email);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE MENSAGENS DO CHAT EM DIRETO (chat_messages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(191),
  sender_name VARCHAR(150) NOT NULL,
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'admin', 'bot'
  text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(100),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);

-- ----------------------------------------------------------------------------
-- 8. TABELA DA BASE DE CONHECIMENTO DO BOT FISCAL (bot_knowledge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id VARCHAR(64) PRIMARY KEY,
  question TEXT NOT NULL,
  keywords TEXT NOT NULL, -- Termos de pesquisa ou array JSON
  answer TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'pt',
  category VARCHAR(50) DEFAULT 'fiscal', -- 'fiscal', 'customs', 'commercial', 'general'
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  learned_from_admin_name VARCHAR(150),
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. TABELA DE PERGUNTAS NÃO RESOLVIDAS DO BOT (unresolved_bot_questions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unresolved_bot_questions (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  user_email VARCHAR(191),
  question TEXT NOT NULL,
  detected_language VARCHAR(10) DEFAULT 'pt',
  importance VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'ignored', 'answered'
  admin_answer TEXT,
  answered_by_admin_name VARCHAR(150),
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. TABELA DE LOGS DE AUDITORIA E SEGURANÇA (audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  user_name VARCHAR(150),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'auth', 'payment', 'simulator', 'user', 'system'
  entity_id VARCHAR(64),
  ip_address VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- 11. TABELA DE CONFIGURAÇÕES GLOBAIS DO SISTEMA (system_settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. TABELA DE CHAVES DE API PARA INTEGRAÇÃO ERP (api_keys)
-- XD, Primavera, PHC, SAP, WinRest, Sage
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  system VARCHAR(50) NOT NULL, -- 'xd', 'primavera', 'phc', 'sap', 'winrest', 'sage', 'custom'
  permissions TEXT, -- Lista JSON de permissões
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'revoked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- DADOS INICIAIS (SEED DATA)
-- Senhas encriptadas com algoritmo Bcrypt Salt 10:
--   - Conta Administrador: admin@nanucloud.com (Senha: admin123)
--   - Contas Demo Clientes: (Senha: cliente123)
-- ============================================================================

-- Planos Oficiais de Subscrição
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

-- Contas Bancárias Oficiais para Recebimento em Angola
INSERT INTO bank_accounts (id, bank_name, iban, swift, holder, currency, is_active)
VALUES
  ('bank_bai_01', 'Banco Angolano de Investimentos (BAI)', 'AO06 0040 0000 0692 4329 1010 6', 'BAIAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE),
  ('bank_bfa_02', 'Banco de Fomento Angola (BFA)', 'AO06 0006 0000 9745 7140 3018 1', 'BFAAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE),
  ('bank_bma_03', 'Banco Millennium Atlântico (BMA)', 'AO06 0055 0000 2469 9241 1017 7', 'BMAAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE),
  ('bank_bic_04', 'Banco BIC Angola', 'AO06 0051 0000 7027 5788 1519 5', 'BICAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Super Administrador e Utilizadores Gestores (Senha admin123 = $2b$10$35vW5MHk.pDR5uOEXLGhDe8QD2JGoa9riROP6duFZsl.uNV0k36CG)
INSERT INTO users (id, name, company, nif, email, phone, country, password_hash, role, department, is_active, queries_remaining, total_queries_used, is_import_unlocked, is_batch_unlocked, is_api_unlocked)
VALUES 
  ('usr_admin_nanucloud', 'Super Administrador NANUCLOUD', 'NANUCLOUD TECNOLOGIA LDA', '5001294819', 'admin@nanucloud.com', '+244 954 269 353', 'Angola', '$2b$10$35vW5MHk.pDR5uOEXLGhDe8QD2JGoa9riROP6duFZsl.uNV0k36CG', 'super_admin', 'Direção Geral & Finanças', TRUE, 999999, 0, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Clientes Empresariais Angolanos Demonstrativos (Senha cliente123 = $2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y)
INSERT INTO users (id, name, company, nif, email, phone, country, password_hash, role, client_category, is_active, queries_remaining, total_queries_used, active_plan_id, active_plan_name, is_import_unlocked, is_batch_unlocked, is_api_unlocked)
VALUES 
  ('cli_001', 'António Gaspar Ferreira', 'Ferreira & Filhos Comércio Geral Lda', '5412093847', 'comercial@ferreirafilhos.ao', '+244 923 456 789', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'comercio', TRUE, 184, 116, 'plan_gold', 'Plano Ouro Pro', TRUE, TRUE, FALSE),
  ('cli_002', 'Dra. Maria Eunice Santos', 'Santos & Associados Consultoria', '5409281742', 'maria.santos@santosconsultoria.co.ao', '+244 945 112 233', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'servicos', TRUE, 742, 258, 'plan_diamond', 'Plano Diamante Enterprise', TRUE, TRUE, TRUE),
  ('cli_003', 'Eng. Carlos Alberto Mendes', 'Mendes Import & Export Transitários', '5418829103', 'carlos.mendes@mendesimport.ao', '+244 912 887 766', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'importacao', TRUE, 45, 255, 'plan_gold', 'Plano Ouro Pro', TRUE, TRUE, FALSE),
  ('cli_004', 'Teresa Cristina Neto', 'Boutique & Cosméticos Luanda', '5420194831', 'loja@boutiqueluanda.com', '+244 933 654 321', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'comercio', TRUE, 8, 42, 'plan_bronze', 'Plano Bronze', FALSE, FALSE, FALSE)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash;

-- Transações Demonstrativas de Compras de Planos
INSERT INTO transactions (id, user_id, user_name, user_email, company_name, nif, plan_id, plan_name, amount_kz, queries_granted, validity_days, payment_method, payment_reference, payment_proof_name, notes, status, created_at)
VALUES 
  ('tx_pay_001', 'cli_001', 'António Gaspar Ferreira', 'comercial@ferreirafilhos.ao', 'Ferreira & Filhos Comércio Geral Lda', '5412093847', 'plan_gold', 'Plano Ouro Pro (60 Consultas)', 3000.00, 60, 30, 'bank_transfer', 'BAI-COMP-2026-9921', 'Comprovativo_BAI_3000Kz.pdf', 'Transferência efetuada via BAI Directo para a conta NANUCLOUD.', 'pending', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
  ('tx_pay_002', 'cli_002', 'Dra. Maria Eunice Santos', 'maria.santos@santosconsultoria.co.ao', 'Santos & Associados Consultoria', '5409281742', 'plan_platinum', 'Plano Platina Business (100 Consultas)', 5000.00, 100, 30, 'express_ref', 'MCX-REF-89421893', 'Talao_Multicaixa_Express_5000Kz.jpg', 'Pagamento efetuado no ATM Multicaixa Express.', 'pending', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
  ('tx_pay_003', 'cli_003', 'Eng. Carlos Alberto Mendes', 'carlos.mendes@mendesimport.ao', 'Mendes Import & Export Transitários', '5418829103', 'plan_silver', 'Plano Prata (30 Consultas)', 1500.00, 30, 30, 'bank_transfer', 'BFA-TRANSF-110293', 'Talao_BFA_1500Kz.pdf', 'Transferência interbancária validada.', 'approved', CURRENT_TIMESTAMP - INTERVAL '36 hours')
ON CONFLICT (id) DO NOTHING;

-- Base de Conhecimento do Assistente Fiscal Virtual
INSERT INTO bot_knowledge (id, question, keywords, answer, language, category, is_approved)
VALUES
  ('kb_servicos_01', 'Como simular prestação de serviços e retenção na fonte?', 'servico,serviço,retencao,retenção,fonte,prestacao,prestação', 'O simulador NANUCLOUD permite simular tanto PRODUTOS como PRESTAÇÃO DE SERVIÇOS. Para serviços, introduza a taxa de Retenção na Fonte regulamentar de Angola (ex: 6.5%). O sistema calcula o valor bruto com IVA (14%), deduz a retenção e comissões TPA, apresentando o montante líquido real a receber na conta bancária.', 'pt', 'fiscal', TRUE),
  ('kb_aduaneira_02', 'Como funciona o cálculo de importação e despacho aduaneiro?', 'importacao,importação,aduana,aduaneiro,alfandega,alfândega,fob,cif,iec,pauta', 'No Módulo de Importação Aduaneira, introduza o valor FOB da mercadoria, Frete, Seguro, Direitos Aduaneiros (5% a 70%), Imposto Especial de Consumo (IEC), Taxa Estatística (10.000 Kz), TPS e IVA Aduaneiro (14%). O simulador calcula o custo de desembarque CIF e apura o preço de venda recomendado com margem líquida.', 'pt', 'customs', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Configurações Essenciais do Sistema
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('app_name', 'NANUCLOUD SIMULADOR FISCAL', 'Nome da aplicação'),
  ('company_name', 'NANUCLOUD - Soluções Fiscais e Tecnológicas', 'Razão social'),
  ('company_nif', '5001294819', 'NIF da empresa gestora'),
  ('company_address', 'Edifício Kilamba, Luanda, Angola', 'Morada'),
  ('whatsapp_support_1', '+244954269353', 'Contacto WhatsApp principal'),
  ('support_email', 'suporte@nanucloud.com', 'E-mail de apoio ao cliente'),
  ('default_vat_rate_ao', '14', 'Taxa normal de IVA em Angola (%)'),
  ('unit_query_price_kz', '50', 'Preço base unitário por consulta avulsa (Kz)')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value;

-- ============================================================================
-- FIM DO SCRIPT DE CRIAÇÃO E CARGA INICIAL
-- ============================================================================
