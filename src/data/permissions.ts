import { PermissionDef, PermissionGroup } from '../types';

export const SYSTEM_PERMISSIONS: PermissionDef[] = [
  // Simulação e Cálculos
  {
    key: 'calc_local',
    label: 'Cálculo de Preço Local (Produtos)',
    category: 'Simulação e Cálculos',
    description: 'Permite simular formação de preço de venda e margens de lucro para comércio de mercadorias.'
  },
  {
    key: 'calc_services',
    label: 'Cálculo de Prestação de Serviços & Retenção',
    category: 'Simulação e Cálculos',
    description: 'Permite simular honorários sem preço de custo com retenção na fonte (6.5% Fisco Angola, 11.5% IRS, etc.).'
  },
  {
    key: 'calc_import_sea',
    label: 'Simulação Aduaneira Marítima',
    category: 'Simulação e Cálculos',
    description: 'Permite simular importações via frete marítimo (FCL/LCL, CBM/Volume e taxas portuárias).'
  },
  {
    key: 'calc_import_land',
    label: 'Simulação Aduaneira Terrestre (Rodoviária)',
    category: 'Simulação e Cálculos',
    description: 'Permite simular importações terrestres por Km e postos aduaneiros de fronteira.'
  },
  {
    key: 'calc_import_air',
    label: 'Simulação Aduaneira Aérea',
    category: 'Simulação e Cálculos',
    description: 'Permite simular importações aéreas com frete por Kg (peso real / taxável) e terminal de carga.'
  },
  {
    key: 'batch_excel',
    label: 'Operações em Lote via Excel (.xlsx)',
    category: 'Simulação e Cálculos',
    description: 'Permite carregar e processar planilhas de produtos em lote com limite de segurança.'
  },

  // Integrações e APIs
  {
    key: 'api_integration',
    label: 'Acesso e Configuração da API para ERP / Lojas',
    category: 'Integrações e APIs',
    description: 'Permite gerar chaves de API e integrar com PHC, Primavera, SAP, Odoo, WooCommerce, Shopify, Excel, etc.'
  },

  // Clientes e Atendimento
  {
    key: 'view_clients',
    label: 'Visualizar Menu e Lista de Clientes',
    category: 'Clientes e Atendimento',
    description: 'Permite consultar todos os clientes registados, planos ativos e saldos de consultas.'
  },
  {
    key: 'create_clients',
    label: 'Cadastrar Novos Clientes',
    category: 'Clientes e Atendimento',
    description: 'Permite à equipa registar clientes manualmente no sistema com plano e dados fiscais.'
  },
  {
    key: 'edit_clients',
    label: 'Editar Dados e Alterar Planos de Clientes',
    category: 'Clientes e Atendimento',
    description: 'Permite ao operador ajustar saldos, datas de expiração e trocar de plano.'
  },
  {
    key: 'manage_tickets',
    label: 'Gerir Tickets de Suporte e Atendimento',
    category: 'Clientes e Atendimento',
    description: 'Permite responder, alterar estado e prestar assistência nos tickets abertos.'
  },
  {
    key: 'transfer_tickets',
    label: 'Transferir Tickets Entre Utilizadores',
    category: 'Clientes e Atendimento',
    description: 'Permite delegar tickets para outros gestores ou departamentos especializados.'
  },

  // Fiscal e Auditoria
  {
    key: 'fiscal_matrix_edit',
    label: 'Edição Manual da Matriz de Taxas Fiscais',
    category: 'Fiscal e Auditoria',
    description: 'Permite atualizar diretamente os valores da tabela matriz de taxas dos países.'
  },
  {
    key: 'manual_payment_validate',
    label: 'Validação Manual de Pagamentos e Comprovativos',
    category: 'Fiscal e Auditoria',
    description: 'Permite auditar comprovativos bancários/MCX e aprovar recargas com registo de operador.'
  },
  {
    key: 'export_reports',
    label: 'Exportar Relatórios (Excel e PDF)',
    category: 'Fiscal e Auditoria',
    description: 'Permite extrair movimentos, histórico de consultas, faturamento e auditoria.'
  },
  {
    key: 'metrics_view',
    label: 'Visualizar Métricas Avançadas e Estatísticas',
    category: 'Fiscal e Auditoria',
    description: 'Permite aceder ao dashboard analítico de vendas de planos, ranking de clientes e gráficos.'
  },

  // Marketing e Comunicação
  {
    key: 'sms_email_marketing',
    label: 'Campanhas de SMS e E-mail Marketing',
    category: 'Marketing e Comunicação',
    description: 'Permite disparar alertas de saldo, comunicados fiscais e mensagens de celebração.'
  },

  // Administração e Sistema
  {
    key: 'db_engines_config',
    label: 'Configurar Motores de Banco de Dados (MySQL / MSSQL / etc)',
    category: 'Administração e Sistema',
    description: 'Permite testar conexões e gerar esquemas SQL para MySQL e MS SQL Server.'
  },
  {
    key: 'backup_system',
    label: 'Efetuar Backups e Restauração de Dados',
    category: 'Administração e Sistema',
    description: 'Permite gerar backups completos da base de dados e restaurar estados anteriores.'
  },
  {
    key: 'docs_deploy',
    label: 'Acesso aos Manuais Oficiais e Pacotes de Deploy',
    category: 'Administração e Sistema',
    description: 'Permite descarregar manuais técnicos em PDF e ficheiros de deploy (.bat, Docker, etc.).'
  },
  {
    key: 'system_settings_edit',
    label: 'Definições Globais da Empresa e Plataforma',
    category: 'Administração e Sistema',
    description: 'Permite configurar coordenadas bancárias, AdSense, contactos, temas e servidor central.'
  }
];

export const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'grp_super_admin',
    name: 'Super Administrador (Acesso Total)',
    description: 'Permissões irrestritas em todos os módulos, configurações de infraestrutura e gestão de utilizadores.',
    permissions: SYSTEM_PERMISSIONS.map((p) => p.key),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'grp_admin',
    name: 'Administrador Operacional',
    description: 'Gestão de clientes, validação de pagamentos, tickets, relatórios, matriz fiscal e campanhas.',
    permissions: [
      'calc_local',
      'calc_services',
      'calc_import_sea',
      'calc_import_land',
      'calc_import_air',
      'batch_excel',
      'api_integration',
      'view_clients',
      'create_clients',
      'edit_clients',
      'manage_tickets',
      'transfer_tickets',
      'fiscal_matrix_edit',
      'manual_payment_validate',
      'export_reports',
      'sms_email_marketing',
      'metrics_view'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'grp_manager',
    name: 'Gestor de Contas e Atendimento',
    description: 'Atendimento e transferência de tickets, visualização e cadastro de clientes e consultas fiscais.',
    permissions: [
      'calc_local',
      'calc_services',
      'calc_import_sea',
      'calc_import_land',
      'calc_import_air',
      'batch_excel',
      'view_clients',
      'create_clients',
      'manage_tickets',
      'transfer_tickets',
      'export_reports'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'grp_user',
    name: 'Utilizador / Operador Padrão',
    description: 'Acesso às ferramentas de cálculo e simulação comercial.',
    permissions: [
      'calc_local',
      'calc_services',
      'calc_import_sea',
      'calc_import_land',
      'calc_import_air',
      'batch_excel',
      'export_reports'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'grp_client',
    name: 'Cliente / Assinante',
    description: 'Acesso aos módulos de acordo com o plano contratado (Local, Importação, Lotes, API).',
    permissions: [
      'calc_local',
      'calc_services',
      'calc_import_sea',
      'calc_import_land',
      'calc_import_air',
      'batch_excel',
      'api_integration'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export function hasUserPermission(user: any | null, permissionKey: string): boolean {
  if (!user) return false;
  // Super admin always has full access
  if (user.role === 'super_admin' || user.role === 'admin_level1') return true;

  // Check custom permissions on user
  if (user.customPermissions && Array.isArray(user.customPermissions)) {
    if (user.customPermissions.includes(permissionKey)) return true;
  }

  // Check group permissions
  if (user.permissionGroupId) {
    const savedGroups: PermissionGroup[] = JSON.parse(
      localStorage.getItem('nanucloud_permission_groups') || '[]'
    );
    const allGroups = [...DEFAULT_PERMISSION_GROUPS, ...savedGroups];
    const userGroup = allGroups.find((g) => g.id === user.permissionGroupId);
    if (userGroup && userGroup.permissions.includes(permissionKey)) {
      return true;
    }
  }

  // Fallback defaults based on role
  if (user.role === 'admin' || user.role === 'admin_level2') {
    const adminGrp = DEFAULT_PERMISSION_GROUPS.find((g) => g.id === 'grp_admin');
    return adminGrp?.permissions.includes(permissionKey) ?? false;
  }
  if (user.role === 'manager') {
    const managerGrp = DEFAULT_PERMISSION_GROUPS.find((g) => g.id === 'grp_manager');
    return managerGrp?.permissions.includes(permissionKey) ?? false;
  }
  if (user.role === 'user') {
    const userGrp = DEFAULT_PERMISSION_GROUPS.find((g) => g.id === 'grp_user');
    return userGrp?.permissions.includes(permissionKey) ?? false;
  }
  if (user.role === 'client') {
    const clientGrp = DEFAULT_PERMISSION_GROUPS.find((g) => g.id === 'grp_client');
    return clientGrp?.permissions.includes(permissionKey) ?? false;
  }

  return false;
}
