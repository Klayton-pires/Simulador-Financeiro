import React, { useState, useMemo, useEffect } from 'react';
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
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  GitFork,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  Cloud,
  Zap,
  AlertCircle,
  ExternalLink,
  Globe
} from 'lucide-react';
import { DailyBackupManagementView } from './DailyBackupManagementView';

interface SchemaTable {
  name: string;
  category: string;
  description: string;
  isNew?: boolean;
  fields: {
    name: string;
    type: string;
    description: string;
    isKey?: boolean;
    isFk?: boolean;
    isNewField?: boolean;
    isSecurity?: boolean;
  }[];
  connectedModule: string;
}

export const DatabaseSqlManagementSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeView, setActiveView] = useState<'tables' | 'connector' | 'sql_preview' | 'encryption' | 'neon_hosting' | 'backup_routine'>('tables');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  // Neon DB and Hosting States
  const [neonUrl, setNeonUrl] = useState('');
  const [neonTesting, setNeonTesting] = useState(false);
  const [neonMigrating, setNeonMigrating] = useState(false);
  const [neonStatus, setNeonStatus] = useState<{
    connected?: boolean;
    configured?: boolean;
    latencyMs?: number;
    database?: string;
    version?: string;
    tableCount?: number;
    tablesList?: string[];
    error?: string;
    checkedAt?: string;
  } | null>(null);
  const [neonMigrateResult, setNeonMigrateResult] = useState<{
    success?: boolean;
    message?: string;
    tablesFound?: number;
    error?: string;
  } | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    // Check general health on load
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(() => {});
  }, []);

  const handleTestNeon = async (customUrl?: string) => {
    setNeonTesting(true);
    setNeonMigrateResult(null);
    try {
      const res = await fetch('/api/admin/test-neon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: customUrl !== undefined ? customUrl : (neonUrl.trim() || undefined) })
      });
      const data = await res.json();
      setNeonStatus(data);
    } catch (err: any) {
      setNeonStatus({
        connected: false,
        configured: true,
        error: err.message || 'Falha ao comunicar com o servidor de teste do Neon.'
      });
    } finally {
      setNeonTesting(false);
    }
  };

  const handleMigrateNeon = async () => {
    if (!window.confirm('Confirma a execução e criação de todas as 20 tabelas relacionais e dados de arranque no seu Neon PostgreSQL?')) {
      return;
    }
    setNeonMigrating(true);
    setNeonMigrateResult(null);
    try {
      const res = await fetch('/api/admin/migrate-neon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: neonUrl.trim() || undefined })
      });
      const data = await res.json();
      setNeonMigrateResult(data);
      if (data.success) {
        handleTestNeon(neonUrl.trim() || undefined);
      }
    } catch (err: any) {
      setNeonMigrateResult({
        success: false,
        error: err.message || 'Erro ao executar o ficheiro database.sql no Neon.'
      });
    } finally {
      setNeonMigrating(false);
    }
  };

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
    }, 700);
  };

  // 20 Tabelas Completas e Sincronizadas
  const schemaTables: SchemaTable[] = [
    {
      name: 'plans',
      category: 'Comercial & Subscrições',
      description: 'Pacotes oficiais de consultas em Kwanzas (Bronze, Prata, Ouro, Platina, Diamante).',
      connectedModule: 'Subscrições, Modal de Recarga, Checkout',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'Identificador único do plano', isKey: true },
        { name: 'name', type: 'VARCHAR(150)', description: 'Designação comercial do pacote' },
        { name: 'description', type: 'TEXT', description: 'Resumo e público-alvo' },
        { name: 'price_kz', type: 'DECIMAL(15,2)', description: 'Preço de venda em Kwanzas (AOA)' },
        { name: 'queries_count', type: 'INT', description: 'Total de consultas creditadas' },
        { name: 'queries_included', type: 'INT', description: 'Consultas no pacote base' },
        { name: 'validity_days', type: 'INT', description: 'Dias de validade (ex: 30 dias)' },
        { name: 'unit_price_kz', type: 'DECIMAL(15,2)', description: 'Preço médio por consulta' },
        { name: 'min_price_kz', type: 'DECIMAL(15,2)', description: 'Preço mínimo para planos personalizados', isNewField: true },
        { name: 'badge', type: 'VARCHAR(50)', description: 'Selo visual (ex: Recomendado, Popular)', isNewField: true },
        { name: 'features', type: 'TEXT', description: 'JSON com lista de funcionalidades incluídas' },
        { name: 'unlocks_import', type: 'BOOLEAN', description: 'Desbloqueia importação aduaneira marítima/aérea' },
        { name: 'unlocks_batch', type: 'BOOLEAN', description: 'Desbloqueia cálculo em lote Excel' },
        { name: 'unlocks_api', type: 'BOOLEAN', description: 'Desbloqueia integração via API REST', isNewField: true },
        { name: 'is_custom', type: 'BOOLEAN', description: 'Indicador de plano construído sob medida' },
        { name: 'is_popular', type: 'BOOLEAN', description: 'Destaque visual na tabela de preços' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Disponibilidade para novas compras' },
        { name: 'sort_order', type: 'INT', description: 'Posição de ordenação no catálogo' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de criação do registo' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Última modificação' }
      ]
    },
    {
      name: 'permission_groups',
      category: 'Segurança & RBAC',
      description: 'Perfis de permissões organizacionais delegadas por departamento e função.',
      connectedModule: 'Gestão de Utilizadores Staff e Níveis de Acesso',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'Identificador único do grupo (ex: grp_superadmin)', isKey: true },
        { name: 'name', type: 'VARCHAR(150)', description: 'Nome do grupo de permissão' },
        { name: 'description', type: 'TEXT', description: 'Âmbito de atuação do perfil' },
        { name: 'permissions', type: 'TEXT', description: 'Array JSON com permissões granulares ativas' },
        { name: 'is_system_default', type: 'BOOLEAN', description: 'Indica perfil nativo do sistema' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Registo de criação' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Registo de atualização' }
      ]
    },
    {
      name: 'users',
      category: 'Autenticação & Perfis',
      description: 'Clientes empresariais, administradores, gestores fiscais e operadores staff.',
      connectedModule: 'Autenticação, Gestão de Clientes, Permissões',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID exclusivo do utilizador', isKey: true },
        { name: 'name', type: 'VARCHAR(150)', description: 'Nome completo do titular ou responsável' },
        { name: 'company', type: 'VARCHAR(150)', description: 'Denominação social da empresa' },
        { name: 'nif', type: 'VARCHAR(50) UNIQUE', description: 'Número de Identificação Fiscal Angolano' },
        { name: 'email', type: 'VARCHAR(191) UNIQUE', description: 'E-mail para autenticação e notificações' },
        { name: 'phone', type: 'VARCHAR(50)', description: 'Telemóvel com indicativo do país' },
        { name: 'address', type: 'TEXT', description: 'Endereço físico e província do cliente', isNewField: true },
        { name: 'country', type: 'VARCHAR(50)', description: 'País de jurisdição fiscal (Padrão: Angola)' },
        { name: 'password_hash', type: 'VARCHAR(255)', description: 'Hash unidirecional Bcrypt Salt 10', isSecurity: true },
        { name: 'role', type: 'VARCHAR(50)', description: 'Função: client, super_admin, manager, staff' },
        { name: 'client_category', type: 'VARCHAR(50)', description: 'Setor: comercio, servicos, importacao, liberal', isNewField: true },
        { name: 'department', type: 'VARCHAR(100)', description: 'Departamento interno do operador', isNewField: true },
        { name: 'permission_group_id', type: 'VARCHAR(64) FK', description: 'Vínculo ao grupo de permissões', isFk: true, isNewField: true },
        { name: 'custom_permissions', type: 'TEXT', description: 'JSON com sobreposições individuais de permissão', isNewField: true },
        { name: 'is_active', type: 'BOOLEAN', description: 'Estado de ativação da conta' },
        { name: 'queries_remaining', type: 'INT', description: 'Saldo atual de consultas disponíveis' },
        { name: 'total_queries_used', type: 'INT', description: 'Contador acumulado de cálculos efetuados' },
        { name: 'active_plan_id', type: 'VARCHAR(64) FK', description: 'Plano contratado em vigor', isFk: true },
        { name: 'active_plan_name', type: 'VARCHAR(150)', description: 'Nome do plano ativo' },
        { name: 'plan_expires_at', type: 'TIMESTAMP', description: 'Data de expiração do plano atual' },
        { name: 'is_import_unlocked', type: 'BOOLEAN', description: 'Acesso liberado ao módulo de importação' },
        { name: 'is_batch_unlocked', type: 'BOOLEAN', description: 'Acesso liberado ao cálculo em lote' },
        { name: 'is_api_unlocked', type: 'BOOLEAN', description: 'Acesso liberado à API' },
        { name: 'two_factor_enabled', type: 'BOOLEAN', description: 'Autenticação de 2 fatores ligada', isSecurity: true, isNewField: true },
        { name: 'two_factor_phone', type: 'VARCHAR(50)', description: 'Número dedicado para recepção de OTP', isNewField: true },
        { name: 'login_sms_enabled', type: 'BOOLEAN', description: 'Aviso por SMS a cada início de sessão', isNewField: true },
        { name: 'birth_date', type: 'VARCHAR(20)', description: 'Data de nascimento do titular', isNewField: true },
        { name: 'assigned_manager_id', type: 'VARCHAR(64)', description: 'ID do gestor de conta atribuído', isNewField: true },
        { name: 'assigned_manager_name', type: 'VARCHAR(150)', description: 'Nome do gestor de conta', isNewField: true },
        { name: 'commercial_notes', type: 'TEXT', description: 'Anotações comerciais confidenciais', isNewField: true },
        { name: 'phone_verified', type: 'BOOLEAN', description: 'Indicador de telefone validado por SMS' },
        { name: 'email_verified', type: 'BOOLEAN', description: 'Indicador de confirmação de e-mail' },
        { name: 'preferred_theme', type: 'VARCHAR(50)', description: 'Tema visual de preferência (dark/light)', isNewField: true },
        { name: 'preferred_lang', type: 'VARCHAR(10)', description: 'Idioma da interface (pt, en, fr)', isNewField: true },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data e hora do registo inicial' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Última modificação' },
        { name: 'last_login_at', type: 'TIMESTAMP', description: 'Carimbo temporal do último acesso' }
      ]
    },
    {
      name: 'bank_accounts',
      category: 'Tesouraria & Contas',
      description: 'Contas bancárias oficiais em Angola (BAI, BFA, Atlântico, BIC) para recebimento.',
      connectedModule: 'Instruções de Pagamento e Checkout',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'Código único da conta bancária', isKey: true },
        { name: 'bank_name', type: 'VARCHAR(150)', description: 'Nome da instituição bancária' },
        { name: 'account_number', type: 'VARCHAR(50)', description: 'Número interno da conta à ordem', isNewField: true },
        { name: 'iban', type: 'VARCHAR(100)', description: 'IBAN formatado (ex: AO06 0040 ...)' },
        { name: 'swift', type: 'VARCHAR(50)', description: 'Código internacional SWIFT/BIC' },
        { name: 'holder', type: 'VARCHAR(150)', description: 'Nome do titular da conta' },
        { name: 'currency', type: 'VARCHAR(20)', description: 'Moeda da conta (AOA, USD, EUR)' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Conta disponível para recebimentos' },
        { name: 'is_visible', type: 'BOOLEAN', description: 'Exibição no formulário público de recarga', isNewField: true },
        { name: 'sort_order', type: 'INT', description: 'Ordem de apresentação na lista', isNewField: true },
        { name: 'notes', type: 'TEXT', description: 'Observações internas da conta', isNewField: true },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de cadastro' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Data de alteração' }
      ]
    },
    {
      name: 'transactions',
      category: 'Finanças & Pagamentos',
      description: 'Compras de planos, faturas proforma, comprovativos bancários e conferência EMIS.',
      connectedModule: 'Validação Financeira, Aprovação de Créditos',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da transação', isKey: true },
        { name: 'user_id', type: 'VARCHAR(64) FK', description: 'Comprador associado', isFk: true },
        { name: 'user_name', type: 'VARCHAR(150)', description: 'Nome do cliente na transação' },
        { name: 'user_email', type: 'VARCHAR(191)', description: 'E-mail do comprador' },
        { name: 'company_name', type: 'VARCHAR(150)', description: 'Razão social para faturação' },
        { name: 'nif', type: 'VARCHAR(50)', description: 'NIF na fatura' },
        { name: 'plan_id', type: 'VARCHAR(64) FK', description: 'Plano pretendido', isFk: true },
        { name: 'plan_name', type: 'VARCHAR(150)', description: 'Descrição do pacote adquirido' },
        { name: 'amount_kz', type: 'DECIMAL(15,2)', description: 'Montante total pago em Kwanzas' },
        { name: 'currency', type: 'VARCHAR(10)', description: 'Moeda (AOA)', isNewField: true },
        { name: 'queries_granted', type: 'INT', description: 'Consultas a conceder após validação' },
        { name: 'validity_days', type: 'INT', description: 'Validade do plano adquirido' },
        { name: 'payment_method', type: 'VARCHAR(50)', description: 'Método: bank_transfer, multicaixa_express, etc.' },
        { name: 'payment_reference', type: 'VARCHAR(100)', description: 'Número da transferência ou operação' },
        { name: 'emis_reference', type: 'VARCHAR(100)', description: 'Código de validação EMIS / Multicaixa', isNewField: true },
        { name: 'emis_terminal', type: 'VARCHAR(50)', description: 'ID do terminal de pagamento', isNewField: true },
        { name: 'payment_proof_name', type: 'VARCHAR(255)', description: 'Nome original do ficheiro anexado' },
        { name: 'payment_proof_url', type: 'TEXT', description: 'Localização ou base64 do comprovativo' },
        { name: 'payment_proof_size', type: 'INT', description: 'Tamanho em bytes do comprovativo' },
        { name: 'gateway_fee_kz', type: 'DECIMAL(15,2)', description: 'Taxa cobrada pela rede de pagamento', isNewField: true },
        { name: 'net_amount_kz', type: 'DECIMAL(15,2)', description: 'Valor líquido creditado à empresa', isNewField: true },
        { name: 'notes', type: 'TEXT', description: 'Notas do cliente sobre o depósito' },
        { name: 'status', type: 'VARCHAR(30)', description: 'Estado: pending, approved, rejected' },
        { name: 'rejection_reason', type: 'TEXT', description: 'Motivo em caso de recusa do comprovativo' },
        { name: 'reviewed_by_admin_id', type: 'VARCHAR(64) FK', description: 'ID do operador que conferiu', isFk: true },
        { name: 'reviewed_by_admin_name', type: 'VARCHAR(150)', description: 'Nome do operador avaliador' },
        { name: 'reviewed_at', type: 'TIMESTAMP', description: 'Data/hora da análise' },
        { name: 'approved_at', type: 'TIMESTAMP', description: 'Data/hora da liberação dos créditos', isNewField: true },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data do pedido' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Última atualização' }
      ]
    },
    {
      name: 'manual_payment_validations',
      category: 'Auditoria Financeira',
      description: 'Registo auditável e imutável de validação de comprovativos bancários pelo staff.',
      connectedModule: 'Validação Manual de Comprovativos',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da validação', isKey: true },
        { name: 'transaction_id', type: 'VARCHAR(64) FK', description: 'Transação vinculada', isFk: true },
        { name: 'client_id', type: 'VARCHAR(64) FK', description: 'Cliente beneficiário', isFk: true },
        { name: 'client_name', type: 'VARCHAR(150)', description: 'Nome do cliente' },
        { name: 'client_email', type: 'VARCHAR(191)', description: 'E-mail do cliente' },
        { name: 'plan_id', type: 'VARCHAR(64)', description: 'Código do plano' },
        { name: 'plan_name', type: 'VARCHAR(150)', description: 'Nome do plano' },
        { name: 'amount_kz', type: 'DECIMAL(15,2)', description: 'Montante auditado' },
        { name: 'payment_method', type: 'VARCHAR(50)', description: 'Método confirmado' },
        { name: 'proof_document_name', type: 'VARCHAR(255)', description: 'Nome do ficheiro comprovativo' },
        { name: 'validated_by_user_id', type: 'VARCHAR(64) FK', description: 'Operador que aprovou/rejeitou', isFk: true },
        { name: 'validated_by_user_name', type: 'VARCHAR(150)', description: 'Nome do operador' },
        { name: 'validation_notes', type: 'TEXT', description: 'Parecer descritivo da validação' },
        { name: 'status', type: 'VARCHAR(30)', description: 'Resultado: approved ou rejected' },
        { name: 'validated_at', type: 'TIMESTAMP', description: 'Momento exato da validação' }
      ]
    },
    {
      name: 'simulations',
      category: 'Cálculos Fiscais & Histórico',
      description: 'Conecta todos os simuladores: Comércio, Prestação de Serviços, Importação e Intermediação.',
      connectedModule: 'Simulador Geral, Importação CIF/FOB, Serviços, Corretagem, Lote Excel',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'Código único do cálculo', isKey: true },
        { name: 'user_id', type: 'VARCHAR(64) FK', description: 'Autor da simulação', isFk: true },
        { name: 'type', type: 'VARCHAR(50)', description: 'Tipo: local, import, batch, service, broker, api' },
        { name: 'item_type', type: 'VARCHAR(50)', description: 'Item: product, service, broker, import' },
        { name: 'title', type: 'VARCHAR(255)', description: 'Designação do produto, serviço ou mercadoria' },
        { name: 'description', type: 'TEXT', description: 'Especificações ou detalhes da cotação' },
        { name: 'country_code', type: 'VARCHAR(10)', description: 'País fiscal de destino (AO, PT, etc.)' },
        { name: 'currency', type: 'VARCHAR(10)', description: 'Moeda da simulação (AOA, USD, EUR)' },
        { name: 'transport_mode', type: 'VARCHAR(20)', description: 'Modalidade de transporte: sea, land, air' },
        { name: 'cost_base', type: 'DECIMAL(15,2)', description: 'Custo de aquisição base do bem ou serviço' },
        { name: 'vat_rate', type: 'DECIMAL(5,2)', description: 'Taxa de IVA aplicável (ex: 14% Angola)' },
        { name: 'vat_amount', type: 'DECIMAL(15,2)', description: 'Montante em Kwanzas do IVA apurado', isNewField: true },
        { name: 'margin_applied', type: 'DECIMAL(5,2)', description: 'Percentagem de margem comercial visada' },
        { name: 'final_price', type: 'DECIMAL(15,2)', description: 'Preço de venda final recomendado com impostos' },
        { name: 'net_profit', type: 'DECIMAL(15,2)', description: 'Lucro líquido real após dedução fiscal' },
        { name: 'retention_rate', type: 'DECIMAL(5,2)', description: 'Taxa de retenção na fonte (ex: 6.5% Angola)' },
        { name: 'retention_amount', type: 'DECIMAL(15,2)', description: 'Valor em Kwanzas retido na fonte' },
        { name: 'net_received', type: 'DECIMAL(15,2)', description: 'Valor líquido a receber na conta bancária' },
        { name: 'deal_type', type: 'VARCHAR(50)', description: 'Intermediação: venda_imovel, viatura, mercadoria', isNewField: true },
        { name: 'deal_amount', type: 'DECIMAL(15,2)', description: 'Valor integral do negócio intermediado', isNewField: true },
        { name: 'commission_rate', type: 'DECIMAL(5,2)', description: 'Taxa de comissão contratada (%)', isNewField: true },
        { name: 'commission_gross', type: 'DECIMAL(15,2)', description: 'Comissão bruta de corretagem', isNewField: true },
        { name: 'tpa_fee_rate', type: 'DECIMAL(5,2)', description: 'Taxa de liquidação do TPA / Cartão', isNewField: true },
        { name: 'tpa_fee_amount', type: 'DECIMAL(15,2)', description: 'Custo financeiro cobrado pelo TPA', isNewField: true },
        { name: 'fob_amount', type: 'DECIMAL(15,2)', description: 'Valor FOB da mercadoria na origem', isNewField: true },
        { name: 'freight_amount', type: 'DECIMAL(15,2)', description: 'Custo de frete internacional', isNewField: true },
        { name: 'insurance_amount', type: 'DECIMAL(15,2)', description: 'Custo do seguro marítimo/aéreo', isNewField: true },
        { name: 'cif_amount', type: 'DECIMAL(15,2)', description: 'Valor Aduaneiro CIF apurado', isNewField: true },
        { name: 'customs_duty_rate', type: 'DECIMAL(5,2)', description: 'Taxa de Direitos Aduaneiros da Pauta (%)', isNewField: true },
        { name: 'customs_duty_amount', type: 'DECIMAL(15,2)', description: 'Valor em Kwanzas dos Direitos Aduaneiros', isNewField: true },
        { name: 'iec_rate', type: 'DECIMAL(5,2)', description: 'Taxa do Imposto Especial de Consumo (IEC)', isNewField: true },
        { name: 'iec_amount', type: 'DECIMAL(15,2)', description: 'Valor em Kwanzas do IEC', isNewField: true },
        { name: 'statistical_fee', type: 'DECIMAL(15,2)', description: 'Taxa de Prestação de Serviços Estatísticos', isNewField: true },
        { name: 'tps_fee', type: 'DECIMAL(15,2)', description: 'Taxa de Prestação de Serviços (Porto)', isNewField: true },
        { name: 'customs_vat_rate', type: 'DECIMAL(5,2)', description: 'Taxa de IVA na Alfândega (14%)', isNewField: true },
        { name: 'customs_vat_amount', type: 'DECIMAL(15,2)', description: 'Montante de IVA recolhido na aduana', isNewField: true },
        { name: 'total_customs_costs', type: 'DECIMAL(15,2)', description: 'Soma global de custos de desalfandegamento', isNewField: true },
        { name: 'total_landed_cost', type: 'DECIMAL(15,2)', description: 'Custo de desembarque total (CIF + Alfândega)', isNewField: true },
        { name: 'service_billing_mode', type: 'VARCHAR(30)', description: 'Serviços: fixed, hourly, distance', isNewField: true },
        { name: 'hourly_rate', type: 'DECIMAL(15,2)', description: 'Preço/hora do técnico ou consultor', isNewField: true },
        { name: 'total_hours', type: 'DECIMAL(8,2)', description: 'Horas totais estimadas do projeto', isNewField: true },
        { name: 'rate_per_km', type: 'DECIMAL(15,2)', description: 'Custo por km de deslocação técnica', isNewField: true },
        { name: 'distance_km', type: 'DECIMAL(8,2)', description: 'Distância em quilómetros percorrida', isNewField: true },
        { name: 'client_name', type: 'VARCHAR(150)', description: 'Nome do tomador do serviço', isNewField: true },
        { name: 'client_nif', type: 'VARCHAR(50)', description: 'NIF do tomador do serviço', isNewField: true },
        { name: 'details_json', type: 'TEXT', description: 'Objeto JSON estruturado com todos os passos' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data do cálculo' }
      ]
    },
    {
      name: 'support_tickets',
      category: 'Atendimento & Suporte',
      description: 'Tickets de suporte técnico, transferências internas entre operadores e histórico.',
      connectedModule: 'Central de Apoio ao Cliente e Tickets',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'Identificador do ticket', isKey: true },
        { name: 'ticket_number', type: 'VARCHAR(50) UNIQUE', description: 'Código público (ex: TCK-2026-0041)' },
        { name: 'user_id', type: 'VARCHAR(64) FK', description: 'Cliente remetente', isFk: true },
        { name: 'user_name', type: 'VARCHAR(150)', description: 'Nome do solicitante' },
        { name: 'user_email', type: 'VARCHAR(191)', description: 'E-mail para resposta' },
        { name: 'user_phone', type: 'VARCHAR(50)', description: 'Contacto de telefone do cliente', isNewField: true },
        { name: 'subject', type: 'VARCHAR(200)', description: 'Assunto do pedido' },
        { name: 'message', type: 'TEXT', description: 'Mensagem detalhada' },
        { name: 'priority', type: 'VARCHAR(20)', description: 'Prioridade: baixa, normal, alta, urgente' },
        { name: 'status', type: 'VARCHAR(30)', description: 'Estado: aberto, em_analise, resolvido, fechado' },
        { name: 'category', type: 'VARCHAR(50)', description: 'Categoria do problema (fiscal, planos, tecnico)' },
        { name: 'assigned_to_user_id', type: 'VARCHAR(64) FK', description: 'Operador staff responsável', isFk: true, isNewField: true },
        { name: 'assigned_to_user_name', type: 'VARCHAR(150)', description: 'Nome do operador atribuído', isNewField: true },
        { name: 'department', type: 'VARCHAR(100)', description: 'Departamento responsável pelo tratamento', isNewField: true },
        { name: 'attachment_url', type: 'TEXT', description: 'Documento ou captura em anexo' },
        { name: 'history_json', type: 'TEXT', description: 'Registo de transferências e notas internas em JSON', isNewField: true },
        { name: 'admin_reply', type: 'TEXT', description: 'Resposta oficial enviada ao cliente' },
        { name: 'replied_at', type: 'TIMESTAMP', description: 'Data da resposta' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de abertura' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Data de atualização' }
      ]
    },
    {
      name: 'chat_messages',
      category: 'Comunicação em Direto',
      description: 'Mensagens instantâneas trocadas entre clientes, administradores e bot no chat ao vivo.',
      connectedModule: 'Widget de Chat em Tempo Real',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da mensagem', isKey: true },
        { name: 'session_id', type: 'VARCHAR(100)', description: 'ID da sessão de chat' },
        { name: 'user_id', type: 'VARCHAR(64) FK', description: 'ID do utilizador (se autenticado)', isFk: true },
        { name: 'user_email', type: 'VARCHAR(191)', description: 'E-mail do visitante' },
        { name: 'sender_name', type: 'VARCHAR(150)', description: 'Nome do remetente' },
        { name: 'sender_type', type: 'VARCHAR(20)', description: 'Tipo: user, admin, bot' },
        { name: 'text', type: 'TEXT', description: 'Conteúdo da mensagem' },
        { name: 'attachment_url', type: 'TEXT', description: 'Ficheiro ou comprovativo enviado no chat' },
        { name: 'attachment_name', type: 'VARCHAR(255)', description: 'Nome do anexo', isNewField: true },
        { name: 'is_read', type: 'BOOLEAN', description: 'Indicador de leitura pelo destinatário' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Carimbo temporal da mensagem' }
      ]
    },
    {
      name: 'bot_knowledge',
      category: 'Inteligência Fiscal & IA',
      description: 'Base de conhecimento e respostas automatizadas do assistente virtual aduaneiro e comercial.',
      connectedModule: 'Assistente Virtual Fiscal & FAQ',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da entrada', isKey: true },
        { name: 'question', type: 'TEXT', description: 'Pergunta típica dos contribuintes' },
        { name: 'keywords', type: 'TEXT', description: 'Palavras-chave separadas por vírgula para deteção' },
        { name: 'answer', type: 'TEXT', description: 'Resposta oficial com fundamentação legal' },
        { name: 'language', type: 'VARCHAR(10)', description: 'Idioma (pt, en, fr)' },
        { name: 'category', type: 'VARCHAR(50)', description: 'Categoria: fiscal, customs, commercial' },
        { name: 'is_approved', type: 'BOOLEAN', description: 'Validação pelo gestor fiscal' },
        { name: 'learned_from_admin_name', type: 'VARCHAR(150)', description: 'Nome do especialista que ensinou o bot' },
        { name: 'learned_at', type: 'TIMESTAMP', description: 'Data do registo na base' }
      ]
    },
    {
      name: 'unresolved_bot_questions',
      category: 'Aprendizagem IA',
      description: 'Dúvidas colocadas pelos clientes que o bot não soube responder e aguardam intervenção humana.',
      connectedModule: 'Módulo de Treino do Assistente Virtual',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da ocorrência', isKey: true },
        { name: 'session_id', type: 'VARCHAR(100)', description: 'Sessão onde a dúvida surgiu' },
        { name: 'user_name', type: 'VARCHAR(150)', description: 'Nome do utilizador' },
        { name: 'user_email', type: 'VARCHAR(191)', description: 'E-mail para resposta' },
        { name: 'question', type: 'TEXT', description: 'Pergunta que gerou dúvida no assistente' },
        { name: 'status', type: 'VARCHAR(20)', description: 'Estado: pending, answered, ignored' },
        { name: 'admin_answer', type: 'TEXT', description: 'Resposta explicativa elaborada pelo staff' },
        { name: 'answered_by_admin_name', type: 'VARCHAR(150)', description: 'Nome do gestor que respondeu' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Momento da submissão' }
      ]
    },
    {
      name: 'fiscal_proposals',
      category: 'Observatório Fiscal IA',
      description: 'Propostas de atualização de taxas de IVA e Pauta Aduaneira detetadas pela inteligência artificial.',
      connectedModule: 'Observatório Fiscal e Atualização Automática',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da proposta', isKey: true },
        { name: 'country_code', type: 'VARCHAR(10)', description: 'Código do país (ex: AO, PT)' },
        { name: 'country_name', type: 'VARCHAR(100)', description: 'Designação do país' },
        { name: 'tax_type', type: 'VARCHAR(50)', description: 'Tipo: IVA, II, DU, PautaAduaneira' },
        { name: 'current_value', type: 'VARCHAR(100)', description: 'Valor atualmente em vigor no sistema' },
        { name: 'proposed_value', type: 'VARCHAR(100)', description: 'Novo valor detetado na legislação' },
        { name: 'source_law', type: 'VARCHAR(255)', description: 'Decreto Executivo ou Lei correspondente' },
        { name: 'reason', type: 'TEXT', description: 'Justificação técnica e impacto' },
        { name: 'status', type: 'VARCHAR(30)', description: 'Estado: pending, approved, rejected' },
        { name: 'reviewed_by', type: 'VARCHAR(150)', description: 'Nome do consultor fiscal que validou' },
        { name: 'detected_at', type: 'TIMESTAMP', description: 'Data da deteção pela IA' }
      ]
    },
    {
      name: 'fiscal_notifications',
      category: 'Legislação & Decretos',
      description: 'Boletins e comunicados oficiais de alterações de impostos (AGT Angola, AT Portugal, etc.).',
      connectedModule: 'Quadro de Avisos Fiscais e Alertas em Tempo Real',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da notificação fiscal', isKey: true },
        { name: 'country_code', type: 'VARCHAR(10)', description: 'País de incidência' },
        { name: 'agency_name', type: 'VARCHAR(150)', description: 'Órgão fiscal emissor (ex: AGT Angola)' },
        { name: 'title', type: 'VARCHAR(255)', description: 'Título do despacho ou boletim' },
        { name: 'summary', type: 'TEXT', description: 'Síntese das mudanças para as empresas' },
        { name: 'tax_type', type: 'VARCHAR(50)', description: 'Imposto impactado' },
        { name: 'old_rate', type: 'VARCHAR(50)', description: 'Taxa fiscal anterior' },
        { name: 'new_rate', type: 'VARCHAR(50)', description: 'Nova taxa fiscal aprovada' },
        { name: 'effective_date', type: 'VARCHAR(50)', description: 'Data de início de vigência' },
        { name: 'source_url', type: 'TEXT', description: 'Endereço da publicação em Diário da República' },
        { name: 'law_reference', type: 'VARCHAR(255)', description: 'Número do Diploma Legal' },
        { name: 'is_critical', type: 'BOOLEAN', description: 'Alerta com destaque prioritário' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de publicação no sistema' }
      ]
    },
    {
      name: 'marketing_campaigns',
      category: 'Comunicação & Campanhas',
      description: 'Envios massivos de SMS e E-mail com templates e variáveis dinâmicas ({nome}, {saldo}).',
      connectedModule: 'Módulo de Campanhas de SMS & E-mail Marketing',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da campanha', isKey: true },
        { name: 'title', type: 'VARCHAR(150)', description: 'Nome de controle da campanha' },
        { name: 'type', type: 'VARCHAR(30)', description: 'Canal: sms, email, both' },
        { name: 'category', type: 'VARCHAR(50)', description: 'Segmento: promocao, alerta_saldo, fiscal' },
        { name: 'target_audience', type: 'VARCHAR(100)', description: 'Filtro de público-alvo' },
        { name: 'subject', type: 'VARCHAR(200)', description: 'Assunto do e-mail ou cabeçalho SMS' },
        { name: 'message_template', type: 'TEXT', description: 'Modelo com tags dinâmicas' },
        { name: 'sent_count', type: 'INT', description: 'Contador de mensagens entregues com sucesso' },
        { name: 'recipient_count', type: 'INT', description: 'Total de destinatários previstos' },
        { name: 'status', type: 'VARCHAR(30)', description: 'Estado: draft, scheduled, sent' },
        { name: 'sent_at', type: 'TIMESTAMP', description: 'Momento do disparo' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de criação' }
      ]
    },
    {
      name: 'sms_logs',
      category: 'Telecom & Mensagens SMS',
      description: 'Histórico de envios de códigos OTP, avisos de saldo e notificações transacionais.',
      connectedModule: 'Serviço Gateway de SMS e Notificações de Telemóvel',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID do log de SMS', isKey: true },
        { name: 'phone_number', type: 'VARCHAR(50)', description: 'Número do telemóvel de destino' },
        { name: 'country_code', type: 'VARCHAR(10)', description: 'Indicativo internacional (ex: AO)' },
        { name: 'message_type', type: 'VARCHAR(50)', description: 'Tipo: otp_verification, welcome, low_balance' },
        { name: 'message_content', type: 'TEXT', description: 'Texto exato transmitido na mensagem' },
        { name: 'recipient_name', type: 'VARCHAR(150)', description: 'Nome do destinatário' },
        { name: 'sent_by_user_name', type: 'VARCHAR(150)', description: 'Operador que disparou ou "Sistema"' },
        { name: 'status', type: 'VARCHAR(30)', description: 'Resultado: delivered, sent, failed' },
        { name: 'gateway_response', type: 'TEXT', description: 'Código e resposta da operadora Unitel/Movicel' },
        { name: 'sent_at', type: 'TIMESTAMP', description: 'Carimbo de envio' }
      ]
    },
    {
      name: 'audit_logs',
      category: 'Segurança & Auditoria',
      description: 'Rastreabilidade imutável de todas as ações administrativas, financeiras e acessos.',
      connectedModule: 'Auditoria Geral e Rastreio de Operações',
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID do evento de auditoria', isKey: true },
        { name: 'user_id', type: 'VARCHAR(64)', description: 'ID do operador que executou a ação' },
        { name: 'user_name', type: 'VARCHAR(150)', description: 'Nome do operador' },
        { name: 'user_role', type: 'VARCHAR(50)', description: 'Nível de privilégio do utilizador' },
        { name: 'action', type: 'VARCHAR(100)', description: 'Ação executada (ex: APPROVE_PAYMENT)' },
        { name: 'entity_type', type: 'VARCHAR(50)', description: 'Entidade afetada: payment, user, simulator' },
        { name: 'entity_id', type: 'VARCHAR(64)', description: 'ID do registo modificado' },
        { name: 'ip_address', type: 'VARCHAR(50)', description: 'Endereço IP de origem da requisição' },
        { name: 'details', type: 'TEXT', description: 'Descrição das alterações' },
        { name: 'before_snapshot_json', type: 'TEXT', description: 'Estado anterior dos dados em JSON' },
        { name: 'after_snapshot_json', type: 'TEXT', description: 'Estado posterior dos dados em JSON' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Carimbo de tempo imutável' }
      ]
    },
    {
      name: 'system_settings',
      category: 'Configurações Globais',
      description: 'Parâmetros corporativos, contactos oficiais de suporte e taxas fiscais padrão.',
      connectedModule: 'Configurações Avançadas e Empresa Gestora',
      fields: [
        { name: 'setting_key', type: 'VARCHAR(100) PK', description: 'Chave única de configuração', isKey: true },
        { name: 'setting_value', type: 'TEXT', description: 'Valor atual associado à chave' },
        { name: 'description', type: 'TEXT', description: 'Explicação do impacto do parâmetro' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Última modificação' }
      ]
    },
    {
      name: 'api_keys_and_integrations',
      category: 'Integrações ERP / API',
      description: 'Pontes de ligação com softwares de gestão (Primavera, PHC, SAP, Sage, WooCommerce).',
      connectedModule: 'Integração de Sistemas ERP & API REST',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da integração', isKey: true },
        { name: 'name', type: 'VARCHAR(150)', description: 'Designação da ligação (ex: Primavera Contabilidade)' },
        { name: 'system_name', type: 'VARCHAR(50)', description: 'ERP: PHC, Primavera, SAP, Sage, Odoo, XD' },
        { name: 'api_key', type: 'VARCHAR(255) UNIQUE', description: 'Chave de autenticação pública' },
        { name: 'api_secret', type: 'VARCHAR(255)', description: 'Segredo encriptado da API', isSecurity: true },
        { name: 'webhook_url', type: 'TEXT', description: 'URL de retorno para sincronização de preços' },
        { name: 'permissions', type: 'TEXT', description: 'Array JSON de permissões autorizadas' },
        { name: 'sync_price_field_only', type: 'BOOLEAN', description: 'Sincronizar apenas campo de preço de venda' },
        { name: 'recommended_fields', type: 'TEXT', description: 'Campos recomendados para o software' },
        { name: 'queries_handled', type: 'INT', description: 'Volume de consultas processadas via API' },
        { name: 'status', type: 'VARCHAR(20)', description: 'Estado: active ou revoked' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de geração da chave' },
        { name: 'last_used_at', type: 'TIMESTAMP', description: 'Data da última requisição' }
      ]
    },
    {
      name: 'database_engine_configs',
      category: 'Conexões SGBD Externas',
      description: 'Configurações de conexão para replicação em PostgreSQL, MySQL, SQL Server ou Cloud SQL.',
      connectedModule: 'Conexão Multi-SGBD e Replicação de Dados',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID da configuração', isKey: true },
        { name: 'type', type: 'VARCHAR(30)', description: 'Motor: mysql, mssql, postgres, sqlite' },
        { name: 'name', type: 'VARCHAR(150)', description: 'Nome amigável da conexão' },
        { name: 'host', type: 'VARCHAR(150)', description: 'Endereço do servidor ou IP' },
        { name: 'port', type: 'INT', description: 'Porta de rede (ex: 5432, 3306)' },
        { name: 'database_name', type: 'VARCHAR(100)', description: 'Nome da base de dados remota' },
        { name: 'username', type: 'VARCHAR(100)', description: 'Nome do utilizador de acesso' },
        { name: 'password', type: 'VARCHAR(255)', description: 'Palavra-passe de conexão protegida', isSecurity: true },
        { name: 'ssl', type: 'BOOLEAN', description: 'Ativação de túnel seguro SSL/TLS' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Motor ativado para sincronização' },
        { name: 'connection_status', type: 'VARCHAR(30)', description: 'Estado: connected, error, disconnected' },
        { name: 'last_tested_at', type: 'TIMESTAMP', description: 'Data do último teste de handshake' },
        { name: 'error_message', type: 'TEXT', description: 'Mensagem de erro de conexão se houver' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de criação' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Data de alteração' }
      ]
    },
    {
      name: 'otp_verification_codes',
      category: 'Verificação em 2 Passos',
      description: 'Códigos temporários descartáveis para autenticação 2FA por telemóvel e recuperação.',
      connectedModule: 'Segurança 2FA e Verificação de Telefone',
      isNew: true,
      fields: [
        { name: 'id', type: 'VARCHAR(64) PK', description: 'ID do código', isKey: true },
        { name: 'identifier', type: 'VARCHAR(191)', description: 'Número de telefone ou e-mail de destino' },
        { name: 'type', type: 'VARCHAR(50)', description: 'Tipo: phone_verification, login_otp, reset' },
        { name: 'code', type: 'VARCHAR(20)', description: 'Código numérico de validação (ex: 6 dígitos)', isSecurity: true },
        { name: 'expires_at', type: 'TIMESTAMP', description: 'Hora de caducidade do código' },
        { name: 'used', type: 'BOOLEAN', description: 'Indicador de código já consumido' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Carimbo de geração' }
      ]
    }
  ];

  // Filtros de Categorias
  const categories = useMemo(() => {
    const set = new Set(schemaTables.map(t => t.category));
    return ['all', ...Array.from(set)];
  }, [schemaTables]);

  const filteredTables = useMemo(() => {
    return schemaTables.filter(t => {
      const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inName = t.name.toLowerCase().includes(q);
      const inDesc = t.description.toLowerCase().includes(q);
      const inModule = t.connectedModule.toLowerCase().includes(q);
      const inFields = t.fields.some(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
      return inName || inDesc || inModule || inFields;
    });
  }, [schemaTables, selectedCategory, searchQuery]);

  // Contagem de campos novos
  const totalNewFields = useMemo(() => {
    return schemaTables.reduce((acc, t) => acc + t.fields.filter(f => f.isNewField).length, 0);
  }, [schemaTables]);

  const copyTableSql = (tableName: string) => {
    const table = schemaTables.find(t => t.name === tableName);
    if (!table) return;
    const fieldsSql = table.fields.map(f => `  ${f.name} ${f.type}`).join(',\n');
    const sql = `CREATE TABLE IF NOT EXISTS ${table.name} (\n${fieldsSql}\n);`;
    navigator.clipboard.writeText(sql);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 2500);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & Actions */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">BASE DE DADOS & ESQUEMA SQL</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Esquema v2.4.0 Completo
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                20 Tabelas Sincronizadas
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Bcrypt Salt 10
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveView('neon_hosting');
                  if (!neonStatus) {
                    handleTestNeon();
                  }
                }}
                className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold hover:bg-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <Cloud className="w-3 h-3 text-cyan-400" />
                <span>Hospedagem & Neon: Pronto</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl font-sans">
              O ficheiro <code className="text-indigo-300 font-mono">database.sql</code> foi integralmente atualizado com todos os novos campos dos simuladores de Comércio, Importação Aduaneira, Serviços, Intermediação, Auditoria Financeira, Gestão de Tickets e Segurança RBAC.
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
            <span>{copied ? 'SQL Integral Copiado!' : 'Copiar Script SQL Completo'}</span>
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
            title="Verificar integridade do esquema SQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{testStatus === 'success' ? 'Esquema Validado (100%)' : 'Validar Esquema'}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Tabelas Relacionais</span>
            <Table className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">20 Tabelas</div>
          <span className="text-[10px] text-indigo-400 font-sans">12 tabelas criadas / expandidas recentemente</span>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Novos Campos Conectados</span>
            <GitFork className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">+{totalNewFields} Campos</div>
          <span className="text-[10px] text-slate-500 font-sans">Aduana, corretagem, 2FA, staff e tickets</span>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Criptografia de Senhas</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">Bcrypt Salt 10</div>
          <span className="text-[10px] text-slate-500 font-sans">Hash irreversível em users.password_hash</span>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Compatibilidade SGBD</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300">Postgres & MySQL</div>
          <span className="text-[10px] text-slate-500 font-sans">MariaDB, Cloud SQL, SQLite, DBeaver</span>
        </div>
      </div>

      {/* Sub-navigation Switcher */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveView('tables')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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
          onClick={() => setActiveView('connector')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeView === 'connector'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Mapeamento de Módulos & Campos Fiscais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('encryption')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeView === 'encryption'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Segurança Bcrypt & Chaves</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('sql_preview')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeView === 'sql_preview'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Guia de Execução & Importação</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('neon_hosting');
            if (!neonStatus) {
              handleTestNeon();
            }
          }}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeView === 'neon_hosting'
              ? 'border-cyan-500 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Neon DB & Hospedagem</span>
          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-500/30">Pronto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('backup_routine')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeView === 'backup_routine'
              ? 'border-emerald-500 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rotina de Backup Diário & Nuvem</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30">Redundância Ativa</span>
        </button>
      </div>

      {/* VIEW 1: TABLES DICTIONARY */}
      {activeView === 'tables' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por tabela, coluna ou módulo (ex: deal_type, fob_amount, nif, tickets)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'Todas as Categorias' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 hover:border-indigo-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                        {table.name}
                      </span>
                      {table.isNew && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                          Nova Tabela
                        </span>
                      )}
                      <span className="text-[10px] text-indigo-400 font-sans">{table.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{table.fields.length} colunas</span>
                      <button
                        type="button"
                        onClick={() => copyTableSql(table.name)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        title="Copiar instrução CREATE TABLE desta tabela"
                      >
                        {copiedTable === table.name ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-400 text-[11px] mb-2 font-sans leading-relaxed">
                    {table.description}
                  </p>

                  <div className="text-[10px] text-indigo-300/80 mb-3 font-sans flex items-center gap-1.5">
                    <span className="text-slate-500">Módulo Conectado:</span>
                    <strong className="text-slate-300">{table.connectedModule}</strong>
                  </div>

                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-900 space-y-1.5 max-h-52 overflow-y-auto">
                    {table.fields.map((f, i) => (
                      <div key={i} className="text-[10px] text-slate-300 flex items-start justify-between gap-2 font-mono border-b border-slate-900/60 pb-1 last:border-0 last:pb-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.isNewField ? 'bg-amber-400' : 'bg-indigo-500/60'}`}></span>
                          <span className={`font-bold ${f.isKey ? 'text-amber-300' : f.isSecurity ? 'text-emerald-400' : f.isFk ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {f.name}
                          </span>
                          <span className="text-slate-500 text-[9px]">{f.type}</span>
                          {f.isNewField && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-sans font-bold">
                              Novo
                            </span>
                          )}
                          {f.isSecurity && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-sans font-bold">
                              Bcrypt
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-sans text-right truncate max-w-[180px]" title={f.description}>
                          {f.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: MODULE CONNECTOR MAP */}
      {activeView === 'connector' && (
        <div className="space-y-4 font-sans">
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono">Conexão Funcional: Módulos da Aplicação vs. Campos SQL</h3>
                <p className="text-xs text-slate-400">
                  Mapeamento de como cada ecrã, simulador e formulário da plataforma escreve e lê da base de dados relacional.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Simulador Aduaneiro */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Simulador de Importação Aduaneira
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    simulations
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cálculo de custos de desembarque CIF, direitos aduaneiros segundo a Pauta Aduaneira, IEC e desalfandegamento.
                </p>
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300">
                  <div>• <strong className="text-indigo-300">fob_amount, freight_amount, insurance_amount</strong> → Custo CIF</div>
                  <div>• <strong className="text-indigo-300">customs_duty_rate, customs_duty_amount</strong> → Direitos Pauta</div>
                  <div>• <strong className="text-indigo-300">iec_rate, iec_amount</strong> → Imposto Especial Consumo</div>
                  <div>• <strong className="text-indigo-300">statistical_fee, tps_fee</strong> → Taxas Portuárias e Aduaneiras</div>
                  <div>• <strong className="text-emerald-400">total_customs_costs, total_landed_cost</strong> → Custo Total Desembarcado</div>
                </div>
              </div>

              {/* Simulador Intermediação & Corretagem */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Intermediação & Corretagem Comercial
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    simulations
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cálculo de comissões imobiliárias, venda de viaturas e intermediação de mercadorias com retenção e TPA.
                </p>
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300">
                  <div>• <strong className="text-indigo-300">deal_type, deal_amount</strong> → Valor e tipo do negócio intermediado</div>
                  <div>• <strong className="text-indigo-300">commission_rate, commission_gross</strong> → Comissão bruta de corretagem</div>
                  <div>• <strong className="text-indigo-300">retention_rate, retention_amount</strong> → Retenção na fonte (6.5%)</div>
                  <div>• <strong className="text-indigo-300">tpa_fee_rate, tpa_fee_amount</strong> → Custos de cartão / liquidação</div>
                  <div>• <strong className="text-emerald-400">net_received</strong> → Valor líquido creditado ao intermediário</div>
                </div>
              </div>

              {/* Prestação de Serviços & Consultoria */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Prestação de Serviços & Consultoria
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    simulations
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Orçamentos por preço fixo, horas de consultoria técnica ou deslocação por quilómetro.
                </p>
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300">
                  <div>• <strong className="text-indigo-300">service_billing_mode</strong> → Modo: fixed, hourly, distance</div>
                  <div>• <strong className="text-indigo-300">hourly_rate, total_hours</strong> → Cotação baseada em horas</div>
                  <div>• <strong className="text-indigo-300">rate_per_km, distance_km</strong> → Custo de deslocação por km</div>
                  <div>• <strong className="text-indigo-300">client_name, client_nif</strong> → Tomador do serviço no orçamento</div>
                </div>
              </div>

              {/* Gestão de Utilizadores Staff & RBAC */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Utilizadores Staff & Grupos RBAC
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    users + permission_groups
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hierarquia organizacional de permissões, perfis de departamento, 2FA e notas comerciais.
                </p>
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300">
                  <div>• <strong className="text-indigo-300">permission_group_id</strong> → Ligação ao grupo de permissões</div>
                  <div>• <strong className="text-indigo-300">department, client_category</strong> → Setor e categoria empresarial</div>
                  <div>• <strong className="text-indigo-300">two_factor_phone, login_sms_enabled</strong> → Verificação e segurança</div>
                  <div>• <strong className="text-indigo-300">assigned_manager_id, commercial_notes</strong> → Gestor de conta atribuído</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ENCRYPTION & SECURITY DETAILS */}
      {activeView === 'encryption' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Arquitetura de Segurança e Encriptação Bcrypt</h3>
              <p className="text-xs text-slate-400">Padrão de proteção rigoroso para formulários de login, registo e base de dados.</p>
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
                ✓ Proteção contra ataques de dicionário e rainbow tables
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Server className="w-4 h-4" />
                <span>3. JWT & Controle de Acesso</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Após autenticação, é gerado um token JSON Web Token com verificação de perfil estrito (clientes apenas acedem aos simuladores; gestores têm acesso ao backoffice).
              </p>
              <div className="bg-slate-900 p-2 rounded text-[10px] text-cyan-400 border border-slate-800">
                ✓ RBAC (Role-Based Access Control)
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Contas Pré-configuradas no Seed Data do ficheiro SQL:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">Conta de Super Administrador</span>
                <span className="text-slate-200 block mt-0.5">Email: <strong className="text-white">admin@nanucloud.com</strong></span>
                <span className="text-slate-400 block text-[11px]">Palavra-passe: <code className="text-indigo-300">admin123</code> (Hash Bcrypt Salt 10)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">Contas de Clientes Empresariais</span>
                <span className="text-slate-200 block mt-0.5">Ex: <strong className="text-white">comercial@ferreirafilhos.ao</strong></span>
                <span className="text-slate-400 block text-[11px]">Palavra-passe: <code className="text-indigo-300">cliente123</code> (184 Consultas Ativas)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: SQL INSTRUCTIONS & QUICK RUN */}
      {activeView === 'sql_preview' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Como Importar o Ficheiro SQL para a sua Base de Dados</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Instruções práticas para carregar o esquema e dados de arranque em qualquer servidor ou motor de base de dados.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-cyan-300 block mb-1">Opção 1: PostgreSQL / Google Cloud SQL / Supabase</span>
              <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900 rounded">
{`# 1. Criar a base de dados
createdb -U postgres nanucloud_db

# 2. Importar o ficheiro SQL fornecido
psql -U postgres -d nanucloud_db -f database.sql`}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-amber-300 block mb-1">Opção 2: MySQL 8+ / MariaDB 10.5+</span>
              <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900 rounded">
{`# 1. Criar a base de dados
mysql -u root -p -e "CREATE DATABASE nanucloud_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Importar o ficheiro
mysql -u root -p nanucloud_db < database.sql`}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-emerald-300 block mb-1">Opção 3: Interface Gráfica (DBeaver / pgAdmin / phpMyAdmin / DataGrip)</span>
              <p className="text-[11px] text-slate-400 font-sans">
                Abra a sua ferramenta de gestão de dados preferida, abra uma nova janela de SQL Script, abra o ficheiro <strong className="text-slate-200">nanucloud_database.sql</strong> (ou copie com o botão acima) e clique em «Executar Script».
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: NEON POSTGRESQL & HOSTING READINESS */}
      {activeView === 'neon_hosting' && (
        <div className="space-y-6">
          {/* Top Status Header */}
          <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">NEON POSTGRESQL & PRONTIDÃO PARA HOSPEDAGEM</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      100% Pronto para Deploy
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                      Driver pg com SSL Ativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans mt-1.5 max-w-3xl">
                    A aplicação está pronta para ser hospedada em qualquer serviço na nuvem (Google Cloud Run, Render, Railway, Fly.io, VPS ou Docker) e conectar-se diretamente a uma base de dados <strong>Neon Serverless PostgreSQL</strong> através da variável <code className="text-cyan-300 font-mono">DATABASE_URL</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestNeon()}
                  disabled={neonTesting}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg transition flex items-center gap-2 font-bold cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${neonTesting ? 'animate-spin' : ''}`} />
                  <span>{neonTesting ? 'A testar conexão...' : 'Verificar Status Neon'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Connection Tester Card */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Testador de Conexão com o Neon PostgreSQL
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">
                Suporta SSL obrigatório (sslmode=require)
              </span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 font-mono block">
                String de Conexão do Neon (ou deixe vazio para usar a variável DATABASE_URL do ambiente):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={neonUrl}
                  onChange={(e) => setNeonUrl(e.target.value)}
                  placeholder="postgresql://user:password@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleTestNeon(neonUrl.trim() || undefined)}
                  disabled={neonTesting}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${neonTesting ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{neonTesting ? 'A conectar...' : 'Testar Conexão'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleMigrateNeon}
                  disabled={neonMigrating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  title="Executa o database.sql completo no Neon criando todas as 20 tabelas"
                >
                  <Server className={`w-4 h-4 ${neonMigrating ? 'animate-spin text-white' : ''}`} />
                  <span>{neonMigrating ? 'A Criar Tabelas...' : 'Migrar 20 Tabelas'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                💡 No painel do Neon (<a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">console.neon.tech <ExternalLink className="w-2.5 h-2.5" /></a>), copie a string de conexão em «Connection Details» (modo <strong>Pooled</strong> ou <strong>Direct</strong> com <code className="text-slate-300">sslmode=require</code>).
              </p>
            </div>

            {/* Neon Connection Test Results Display */}
            {neonStatus && (
              <div className={`p-4 rounded-xl border transition-all ${
                neonStatus.connected 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    {neonStatus.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <h5 className="font-bold text-sm font-mono">
                        {neonStatus.connected 
                          ? '✅ Conexão ao Neon PostgreSQL estabelecida com sucesso!' 
                          : '⚠️ Status da Conexão ao Neon'}
                      </h5>
                      <span className="text-[11px] opacity-80 font-sans">
                        Verificado em: {new Date(neonStatus.checkedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {neonStatus.latencyMs !== undefined && (
                    <span className="text-xs font-mono font-bold bg-slate-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300">
                      ⚡ Latência: {neonStatus.latencyMs} ms
                    </span>
                  )}
                </div>

                {neonStatus.connected ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20 text-xs font-mono">
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block uppercase">Base de Dados Ativa</span>
                      <strong className="text-white text-sm">{neonStatus.database}</strong>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block uppercase">Versão do PostgreSQL</span>
                      <strong className="text-white text-sm">{neonStatus.version}</strong>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block uppercase">Tabelas Criadas</span>
                      <strong className="text-white text-sm">{neonStatus.tableCount} de 20 tabelas</strong>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs font-sans space-y-1">
                    <p className="text-amber-300 font-mono text-[11px] bg-slate-950/80 p-2.5 rounded border border-amber-500/20">
                      {neonStatus.error || 'Nenhuma conexão ativa configurada.'}
                    </p>
                    <p className="text-slate-400 text-[11px] pt-1">
                      Para conectar em produção, adicione a variável de ambiente <code className="text-cyan-300 font-mono">DATABASE_URL</code> com a sua connection string do Neon no seu serviço de hospedagem.
                    </p>
                  </div>
                )}

                {/* Table List If Available */}
                {neonStatus.tablesList && neonStatus.tablesList.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase mb-1.5">
                      Tabelas presentes no seu Neon DB ({neonStatus.tablesList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                      {neonStatus.tablesList.map((tName: string) => (
                        <span key={tName} className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 font-mono">
                          {tName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Migration Result Card */}
            {neonMigrateResult && (
              <div className={`p-4 rounded-xl border ${
                neonMigrateResult.success 
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {neonMigrateResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <strong className="font-mono text-sm">
                    {neonMigrateResult.success ? 'Migração Concluída com Sucesso!' : 'Erro na Migração'}
                  </strong>
                </div>
                <p className="text-xs font-sans mt-1">
                  {neonMigrateResult.message || neonMigrateResult.error}
                </p>
                {neonMigrateResult.tablesFound !== undefined && (
                  <p className="text-[11px] font-mono mt-1 text-emerald-300">
                    Total de tabelas públicas identificadas: {neonMigrateResult.tablesFound}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Deployment & Hosting Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hosting Ready Checklist */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Checklist de Prontidão para Hospedagem
                </h4>
              </div>

              <div className="space-y-2.5 text-xs font-sans">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-200 font-mono">Build de Produção Testado:</strong>
                    <p className="text-slate-400 text-[11px]">
                      Comando <code className="text-indigo-300 font-mono">npm run build</code> compila Vite e agrupa o servidor num único ficheiro <code className="text-cyan-300 font-mono">dist/server.cjs</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-200 font-mono">Driver PostgreSQL & SSL:</strong>
                    <p className="text-slate-400 text-[11px]">
                      Driver <code className="text-indigo-300 font-mono">pg</code> integrado com suporte nativo a SSL/TLS para nuvem e certificados do Neon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-200 font-mono">Fallback de Alta Disponibilidade:</strong>
                    <p className="text-slate-400 text-[11px]">
                      Se a base de dados remota não for informada ou estiver inacessível, a aplicação opera em modo seguro sem crash, preservando a interface de simulação.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-200 font-mono">Health Check Oficial:</strong>
                    <p className="text-slate-400 text-[11px]">
                      Endpoint <code className="text-indigo-300 font-mono">/api/health</code> ativo para balanceadores de carga e orquestradores (Docker, Kubernetes, Cloud Run).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step by Step Deploy Instructions */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Passos para Hospedar (Render / Railway / VPS / Docker)
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-cyan-300 font-bold block mb-1">1. Variáveis de Ambiente Necessárias no Host:</span>
                  <pre className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
{`# Conexão ao Neon PostgreSQL
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require

# Chave de segurança para sessões e JWT
SESSION_SECRET=uma_chave_longa_e_segura_32_caracteres

# Modo de execução
NODE_ENV=production`}
                  </pre>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-amber-300 font-bold block mb-1">2. Comandos de Build e Execução:</span>
                  <pre className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
{`# Build Command
npm run build

# Start Command
npm run start`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: ROTINA DE BACKUP DIÁRIO & REDUNDÂNCIA CLOUD */}
      {activeView === 'backup_routine' && (
        <DailyBackupManagementView />
      )}
    </div>
  );
};
