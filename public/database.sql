-- ============================================================================
-- NANUCLOUD FISCAL SUITE & SIMULADOR COMERCIAL ANGOLA
-- FICHEIRO OFICIAL DE IMPORTAÇÃO E CRIAÇÃO DA BASE DE DADOS (SQL COMPLETO)
-- Versão do Esquema: 2.4.0 (Atualizado com todos os módulos, campos fiscais e SGBD)
-- Compatibilidade: PostgreSQL 12+, MySQL 8+, MariaDB 10.5+, Cloud SQL, SQLite
-- ============================================================================
-- Instruções de Execução / Importação no Terminal ou Ferramenta (DBeaver/pgAdmin/Workbench):
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
  min_price_kz DECIMAL(15, 2) DEFAULT 500.00,
  badge VARCHAR(50),
  features TEXT,
  unlocks_import BOOLEAN NOT NULL DEFAULT FALSE,
  unlocks_batch BOOLEAN NOT NULL DEFAULT FALSE,
  unlocks_api BOOLEAN NOT NULL DEFAULT FALSE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE GRUPOS DE PERMISSÕES (permission_groups)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permission_groups (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL,
  is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. TABELA DE UTILIZADORES, CLIENTES E OPERADORES (users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) NOT NULL,
  nif VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  phone VARCHAR(50) DEFAULT '+244 923 000 000',
  address TEXT,
  country VARCHAR(50) DEFAULT 'Angola',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  client_category VARCHAR(50) DEFAULT 'comercio',
  department VARCHAR(100),
  permission_group_id VARCHAR(64) REFERENCES permission_groups(id) ON DELETE SET NULL,
  custom_permissions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  queries_remaining INT NOT NULL DEFAULT 0,
  total_queries_used INT NOT NULL DEFAULT 0,
  active_plan_id VARCHAR(64) REFERENCES plans(id) ON DELETE SET NULL,
  active_plan_name VARCHAR(150),
  plan_expires_at TIMESTAMP,
  is_import_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_batch_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_api_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_phone VARCHAR(50),
  login_sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  birth_date VARCHAR(20),
  assigned_manager_id VARCHAR(64),
  assigned_manager_name VARCHAR(150),
  commercial_notes TEXT,
  last_daily_credit_date VARCHAR(20),
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_theme VARCHAR(50) DEFAULT 'dark',
  preferred_lang VARCHAR(10) DEFAULT 'pt',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nif ON users(nif);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_assigned_mgr ON users(assigned_manager_id);

-- ----------------------------------------------------------------------------
-- 4. TABELA DE CONTAS BANCÁRIAS E MEIOS DE RECARGA (bank_accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(64) PRIMARY KEY,
  bank_name VARCHAR(150) NOT NULL,
  account_number VARCHAR(50),
  iban VARCHAR(100) NOT NULL,
  swift VARCHAR(50),
  holder VARCHAR(150) NOT NULL,
  currency VARCHAR(20) DEFAULT 'AOA (Kz)',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. TABELA DE TRANSAÇÕES E PAGAMENTOS (transactions)
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
  currency VARCHAR(10) DEFAULT 'AOA',
  queries_granted INT NOT NULL DEFAULT 0,
  validity_days INT NOT NULL DEFAULT 30,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),
  emis_reference VARCHAR(100),
  emis_terminal VARCHAR(50),
  payment_proof_name VARCHAR(255),
  payment_proof_url TEXT,
  payment_proof_size INT,
  gateway_fee_kz DECIMAL(15, 2) DEFAULT 0.00,
  net_amount_kz DECIMAL(15, 2) DEFAULT 0.00,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by_admin_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_admin_name VARCHAR(150),
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ----------------------------------------------------------------------------
-- 6. TABELA DE VALIDAÇÕES MANUAIS DE PAGAMENTO (manual_payment_validations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manual_payment_validations (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(150) NOT NULL,
  client_email VARCHAR(191) NOT NULL,
  plan_id VARCHAR(64) NOT NULL,
  plan_name VARCHAR(150) NOT NULL,
  amount_kz DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL,
  proof_document_name VARCHAR(255),
  validated_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  validated_by_user_name VARCHAR(150) NOT NULL,
  validation_notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'approved',
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_manual_val_tx ON manual_payment_validations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_manual_val_client ON manual_payment_validations(client_id);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE SIMULAÇÕES FISCAIS E HISTÓRICO DE CÁLCULOS (simulations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulations (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  item_type VARCHAR(50) DEFAULT 'product',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(10) DEFAULT 'AO',
  currency VARCHAR(10) DEFAULT 'AOA',
  transport_mode VARCHAR(20),
  cost_base DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 14.00,
  vat_amount DECIMAL(15, 2) DEFAULT 0.00,
  margin_applied DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  final_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  net_profit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  retention_rate DECIMAL(5, 2) DEFAULT 0.00,
  retention_amount DECIMAL(15, 2) DEFAULT 0.00,
  net_received DECIMAL(15, 2) DEFAULT 0.00,
  deal_type VARCHAR(50),
  deal_amount DECIMAL(15, 2) DEFAULT 0.00,
  commission_rate DECIMAL(5, 2) DEFAULT 0.00,
  commission_gross DECIMAL(15, 2) DEFAULT 0.00,
  tpa_fee_rate DECIMAL(5, 2) DEFAULT 0.00,
  tpa_fee_amount DECIMAL(15, 2) DEFAULT 0.00,
  fob_amount DECIMAL(15, 2) DEFAULT 0.00,
  freight_amount DECIMAL(15, 2) DEFAULT 0.00,
  insurance_amount DECIMAL(15, 2) DEFAULT 0.00,
  cif_amount DECIMAL(15, 2) DEFAULT 0.00,
  customs_duty_rate DECIMAL(5, 2) DEFAULT 0.00,
  customs_duty_amount DECIMAL(15, 2) DEFAULT 0.00,
  iec_rate DECIMAL(5, 2) DEFAULT 0.00,
  iec_amount DECIMAL(15, 2) DEFAULT 0.00,
  statistical_fee DECIMAL(15, 2) DEFAULT 0.00,
  tps_fee DECIMAL(15, 2) DEFAULT 0.00,
  customs_vat_rate DECIMAL(5, 2) DEFAULT 0.00,
  customs_vat_amount DECIMAL(15, 2) DEFAULT 0.00,
  total_customs_costs DECIMAL(15, 2) DEFAULT 0.00,
  total_landed_cost DECIMAL(15, 2) DEFAULT 0.00,
  service_billing_mode VARCHAR(30),
  hourly_rate DECIMAL(15, 2) DEFAULT 0.00,
  total_hours DECIMAL(8, 2) DEFAULT 0.00,
  rate_per_km DECIMAL(15, 2) DEFAULT 0.00,
  distance_km DECIMAL(8, 2) DEFAULT 0.00,
  client_name VARCHAR(150),
  client_nif VARCHAR(50),
  details_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_type ON simulations(type);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);

-- ----------------------------------------------------------------------------
-- 8. TABELA DE TICKETS DE SUPORTE E ATENDIMENTO (support_tickets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(64) PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(150) NOT NULL,
  user_email VARCHAR(191) NOT NULL,
  user_phone VARCHAR(50),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(30) NOT NULL DEFAULT 'aberto',
  category VARCHAR(50) DEFAULT 'general',
  assigned_to_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_user_name VARCHAR(150),
  department VARCHAR(100),
  attachment_url TEXT,
  history_json TEXT,
  admin_reply TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_no ON support_tickets(ticket_number);

-- ----------------------------------------------------------------------------
-- 9. TABELA DE MENSAGENS DO CHAT EM DIRETO (chat_messages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(191),
  sender_email VARCHAR(191),
  sender_name VARCHAR(150) NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(100),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);

-- ----------------------------------------------------------------------------
-- 10. TABELA DA BASE DE CONHECIMENTO DO BOT FISCAL (bot_knowledge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id VARCHAR(64) PRIMARY KEY,
  question TEXT NOT NULL,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'pt',
  category VARCHAR(50) DEFAULT 'fiscal',
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  learned_from_admin_id VARCHAR(64),
  learned_from_admin_name VARCHAR(150),
  learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. TABELA DE PERGUNTAS NÃO RESOLVIDAS DO ASSISTENTE BOT (unresolved_bot_questions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unresolved_bot_questions (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  user_email VARCHAR(191),
  question TEXT NOT NULL,
  detected_language VARCHAR(10) DEFAULT 'pt',
  importance VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending',
  admin_answer TEXT,
  answered_by_admin_id VARCHAR(64),
  answered_by_admin_name VARCHAR(150),
  answered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. TABELA DE PROPOSTAS DE ATUALIZAÇÃO FISCAL DA IA (fiscal_proposals)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fiscal_proposals (
  id VARCHAR(64) PRIMARY KEY,
  country_code VARCHAR(10) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  current_value VARCHAR(100) NOT NULL,
  proposed_value VARCHAR(100) NOT NULL,
  source_law VARCHAR(255),
  reason TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  reviewed_by VARCHAR(150),
  reviewed_at TIMESTAMP,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fiscal_prop_country ON fiscal_proposals(country_code);
CREATE INDEX IF NOT EXISTS idx_fiscal_prop_status ON fiscal_proposals(status);

-- ----------------------------------------------------------------------------
-- 13. TABELA DE NOTIFICAÇÕES FISCAIS OFICIAIS (fiscal_notifications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fiscal_notifications (
  id VARCHAR(64) PRIMARY KEY,
  country_code VARCHAR(10) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  agency_name VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  old_rate VARCHAR(50),
  new_rate VARCHAR(50),
  effective_date VARCHAR(50),
  source_url TEXT,
  law_reference VARCHAR(255),
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  read_by_managers_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 14. TABELA DE CAMPANHAS DE MARKETING E COMUNICAÇÃO (marketing_campaigns)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  type VARCHAR(30) NOT NULL,
  category VARCHAR(50) DEFAULT 'promocao',
  target_audience VARCHAR(100),
  subject VARCHAR(200),
  message_template TEXT,
  message TEXT,
  sent_count INT DEFAULT 0,
  recipient_count INT DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 15. TABELA DE REGISTO DE ENVIOS DE SMS (sms_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_logs (
  id VARCHAR(64) PRIMARY KEY,
  phone_number VARCHAR(50) NOT NULL,
  country_code VARCHAR(10) DEFAULT 'AO',
  message_type VARCHAR(50) NOT NULL,
  message_content TEXT NOT NULL,
  recipient_name VARCHAR(150),
  sent_by_user_id VARCHAR(64),
  sent_by_user_name VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'delivered',
  gateway_response TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_logs(sent_at);

-- ----------------------------------------------------------------------------
-- 16. TABELA DE LOGS DE AUDITORIA E SEGURANÇA (audit_logs)
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
  before_snapshot_json TEXT,
  after_snapshot_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- ----------------------------------------------------------------------------
-- 17. TABELA DE CONFIGURAÇÕES GLOBAIS DO SISTEMA (system_settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 18. TABELA DE CHAVES DE API E INTEGRAÇÕES ERP (api_keys_and_integrations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys_and_integrations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  system_name VARCHAR(50) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_secret VARCHAR(255),
  webhook_url TEXT,
  permissions TEXT,
  sync_price_field_only BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_fields TEXT,
  queries_handled INT NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 19. TABELA DE MOTORES DE BASE DE DADOS EXTERNOS (database_engine_configs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS database_engine_configs (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  host VARCHAR(150) NOT NULL,
  port INT NOT NULL DEFAULT 5432,
  database_name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255),
  ssl BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  connection_status VARCHAR(30) NOT NULL DEFAULT 'disconnected',
  last_tested_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 20. TABELA DE CÓDIGOS DE VERIFICAÇÃO OTP (otp_verification_codes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verification_codes (
  id VARCHAR(64) PRIMARY KEY,
  identifier VARCHAR(191) NOT NULL,
  type VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_identifier ON otp_verification_codes(identifier);

-- ============================================================================
-- CARGA INICIAL DE DADOS DE ARRANQUE (SEED DATA)
-- ============================================================================

INSERT INTO permission_groups (id, name, description, permissions, is_system_default)
VALUES
  ('grp_superadmin', 'Administração Plena & TI', 'Acesso total irrestrito a todos os módulos, parametrização fiscal e base de dados.', '["calc_local","calc_services","calc_import_sea","calc_import_land","calc_import_air","batch_excel","api_integration","view_clients","create_clients","edit_clients","manage_tickets","transfer_tickets","fiscal_matrix_edit","manual_payment_validate","export_reports","sms_email_marketing","db_engines_config","backup_system","docs_deploy","metrics_view","system_settings_edit"]', TRUE),
  ('grp_fiscal_consulting', 'Consultoria Fiscal & Pauta', 'Operações de simulação, validação fiscal, pauta aduaneira e emissão de pareceres.', '["calc_local","calc_services","calc_import_sea","calc_import_land","calc_import_air","batch_excel","export_reports","fiscal_matrix_edit","view_clients","manage_tickets"]', TRUE),
  ('grp_commercial_support', 'Comercial & Atendimento', 'Gestão de clientes, validação de comprovativos bancários e tickets de suporte.', '["calc_local","calc_services","calc_import_sea","view_clients","create_clients","manage_tickets","manual_payment_validate","sms_email_marketing","export_reports"]', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO plans (id, name, description, price_kz, queries_count, queries_included, validity_days, unit_price_kz, min_price_kz, badge, features, unlocks_import, unlocks_batch, unlocks_api, is_popular, is_active, sort_order)
VALUES 
  ('plan_bronze', 'Plano Bronze', 'Ideal para pequenos comerciantes e profissionais liberais.', 500.00, 10, 10, 30, 50.00, 500.00, 'Arranque', '["10 Consultas Comerciais", "Cálculo de IVA e Margens", "Simulação de Retenção na Fonte", "Exportação Básica PDF"]', TRUE, TRUE, FALSE, FALSE, TRUE, 1),
  ('plan_silver', 'Plano Prata', 'Para pequenos negócios com fluxo regular de cotações diárias.', 1500.00, 30, 30, 30, 50.00, 1500.00, 'Recomendado', '["30 Consultas Comerciais", "Cálculo de Lucro Líquido Real", "Simulação de Prestação de Serviços", "Suporte WhatsApp Prioritário"]', TRUE, TRUE, FALSE, FALSE, TRUE, 2),
  ('plan_gold', 'Plano Ouro Pro', 'Inclui Módulo Completo de Importação Aduaneira e Despacho.', 3000.00, 60, 60, 30, 50.00, 3000.00, 'Mais Popular', '["60 Consultas Globais", "Módulo de Importação Aduaneira CIF/FOB", "Pauta Aduaneira Completa", "Simulação de Intermediação & Corretagem"]', TRUE, TRUE, TRUE, TRUE, TRUE, 3),
  ('plan_platinum', 'Plano Platina Business', 'Solução completa para empresas com cálculo massivo em lote.', 5000.00, 100, 100, 30, 50.00, 5000.00, 'Empresas', '["100 Consultas Avançadas", "Operações em Lote (Excel até 1000 linhas)", "Simulação Multimodal (Marítimo, Terrestre, Aéreo)", "Desbloqueio de Todos os Módulos"]', TRUE, TRUE, TRUE, FALSE, TRUE, 4),
  ('plan_diamond', 'Plano Diamante Enterprise', 'Consultoria e volume para grandes organizações e transitários.', 10000.00, 200, 200, 30, 50.00, 10000.00, 'VIP Total', '["200 Consultas VIP", "API REST para Integração ERP", "Atendimento Prioritário por Super Administrador", "Acesso Total Irrestrito"]', TRUE, TRUE, TRUE, FALSE, TRUE, 5)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price_kz = EXCLUDED.price_kz, 
  queries_count = EXCLUDED.queries_count;

INSERT INTO bank_accounts (id, bank_name, account_number, iban, swift, holder, currency, is_active, is_visible, sort_order)
VALUES
  ('bank_bai_01', 'Banco Angolano de Investimentos (BAI)', '06924329101', 'AO06 0040 0000 0692 4329 1010 6', 'BAIAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE, TRUE, 1),
  ('bank_bfa_02', 'Banco de Fomento Angola (BFA)', '97457140301', 'AO06 0006 0000 9745 7140 3018 1', 'BFAAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE, TRUE, 2),
  ('bank_bma_03', 'Banco Millennium Atlântico (BMA)', '24699241101', 'AO06 0055 0000 2469 9241 1017 7', 'BMAAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE, TRUE, 3),
  ('bank_bic_04', 'Banco BIC Angola', '70275788151', 'AO06 0051 0000 7027 5788 1519 5', 'BICAOLLU', 'KLAYTON PIRES', 'AOA (Kz)', TRUE, TRUE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, company, nif, email, phone, address, country, password_hash, role, department, permission_group_id, is_active, queries_remaining, total_queries_used, is_import_unlocked, is_batch_unlocked, is_api_unlocked, phone_verified, email_verified)
VALUES 
  ('usr_admin_nanucloud', 'Super Administrador NANUCLOUD', 'NANUCLOUD TECNOLOGIA LDA', '5001294819', 'admin@nanucloud.com', '+244 954 269 353', 'Edifício Kilamba, Luanda, Angola', 'Angola', '$2b$10$35vW5MHk.pDR5uOEXLGhDe8QD2JGoa9riROP6duFZsl.uNV0k36CG', 'super_admin', 'Direção Geral & Finanças', 'grp_superadmin', TRUE, 999999, 0, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

INSERT INTO users (id, name, company, nif, email, phone, address, country, password_hash, role, client_category, is_active, queries_remaining, total_queries_used, active_plan_id, active_plan_name, is_import_unlocked, is_batch_unlocked, is_api_unlocked, assigned_manager_name, phone_verified, email_verified)
VALUES 
  ('cli_001', 'António Gaspar Ferreira', 'Ferreira & Filhos Comércio Geral Lda', '5412093847', 'comercial@ferreirafilhos.ao', '+244 923 456 789', 'Av. 4 de Fevereiro, Marginal de Luanda', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'comercio', TRUE, 184, 116, 'plan_gold', 'Plano Ouro Pro', TRUE, TRUE, FALSE, 'Super Administrador NANUCLOUD', TRUE, TRUE),
  ('cli_002', 'Dra. Maria Eunice Santos', 'Santos & Associados Consultoria', '5409281742', 'maria.santos@santosconsultoria.co.ao', '+244 945 112 233', 'Talatona Park, Luanda Sul', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'servicos', TRUE, 742, 258, 'plan_diamond', 'Plano Diamante Enterprise', TRUE, TRUE, TRUE, 'Super Administrador NANUCLOUD', TRUE, TRUE),
  ('cli_003', 'Eng. Carlos Alberto Mendes', 'Mendes Import & Export Transitários', '5418829103', 'carlos.mendes@mendesimport.ao', '+244 912 887 766', 'Porto de Luanda, Terminal Cargas', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'importacao', TRUE, 45, 255, 'plan_gold', 'Plano Ouro Pro', TRUE, TRUE, FALSE, 'Super Administrador NANUCLOUD', TRUE, TRUE),
  ('cli_004', 'Teresa Cristina Neto', 'Boutique & Cosméticos Luanda', '5420194831', 'loja@boutiqueluanda.com', '+244 933 654 321', 'Rua Rainha Ginga, Baixa de Luanda', 'Angola', '$2b$10$5EABwXnSn3xDu1rs4TLLqew7L1E28Fs6XSrJdXleMKnXAgXOORd8y', 'client', 'comercio', TRUE, 8, 42, 'plan_bronze', 'Plano Bronze', FALSE, FALSE, FALSE, 'Super Administrador NANUCLOUD', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash;

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('app_name', 'NANUCLOUD SIMULADOR FISCAL & COMERCIAL', 'Nome da aplicação'),
  ('company_name', 'NANUCLOUD - Soluções Fiscais e Tecnológicas', 'Razão social da empresa'),
  ('company_nif', '5001294819', 'NIF da empresa gestora'),
  ('company_address', 'Edifício Kilamba, Luanda, Angola', 'Morada oficial'),
  ('whatsapp_support_1', '+244954269353', 'Contacto WhatsApp principal'),
  ('whatsapp_support_2', '+244947520740', 'Contacto WhatsApp secundário'),
  ('support_email', 'suporte@nanucloud.com', 'E-mail de apoio ao cliente'),
  ('default_vat_rate_ao', '14', 'Taxa normal de IVA em Angola (%)'),
  ('default_vat_rate_pt', '23', 'Taxa normal de IVA em Portugal (%)'),
  ('default_vat_rate_mz', '16', 'Taxa normal de IVA em Moçambique (%)'),
  ('default_vat_rate_cv', '15', 'Taxa normal de IVA em Cabo Verde (%)'),
  ('default_vat_rate_br', '17', 'Taxa média de ICMS no Brasil (%)'),
  ('unit_query_price_kz', '50', 'Preço base unitário por consulta avulsa (Kz)'),
  ('min_custom_plan_price_kz', '500', 'Valor mínimo para pacote personalizado (Kz)'),
  ('free_queries_on_register', '10', 'Consultas gratuitas atribuídas no registo de novo utilizador')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value;
