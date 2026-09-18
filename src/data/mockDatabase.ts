import {
  BankAccount,
  DatabaseEngineConfig,
  AdsenseSlotConfig,
  SupportTicket,
  FiscalNotification,
  ApiIntegrationConfig,
  MarketingCampaign,
  ManualPaymentValidation,
  ConsultingAuditEntry,
  UserSafe
} from '../types';

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_ao_1',
    bankName: 'Banco BAI - Banco Angolano de Investimentos',
    accountNumber: '0040.0000.1234.5678.101',
    iban: 'AO06.0040.0000.1234.5678.1018.9',
    swift: 'BAIAAOLL',
    holder: 'NANUCLOUD TECH SOLUTIONS LDA',
    currency: 'AOA (Kz)',
    isActive: true,
    isVisible: true
  },
  {
    id: 'bank_ao_2',
    bankName: 'Banco BFA - Banco de Fomento Angola',
    accountNumber: '0006.0000.9876.5432.202',
    iban: 'AO06.0006.0000.9876.5432.2023.4',
    swift: 'BFAAAOLL',
    holder: 'NANUCLOUD TECH SOLUTIONS LDA',
    currency: 'AOA (Kz)',
    isActive: true,
    isVisible: true
  },
  {
    id: 'bank_ao_3',
    bankName: 'Banco BIC - Banco BIC Angola',
    accountNumber: '0011.0000.4567.8901.303',
    iban: 'AO06.0011.0000.4567.8901.3034.5',
    swift: 'BICAOLL',
    holder: 'NANUCLOUD TECH SOLUTIONS LDA',
    currency: 'AOA (Kz)',
    isActive: true,
    isVisible: true
  },
  {
    id: 'bank_ao_4',
    bankName: 'Banco Millennium Atlântico (BMA)',
    accountNumber: '0055.0000.3344.5566.404',
    iban: 'AO06.0055.0000.3344.5566.4045.6',
    swift: 'ATLAAOLL',
    holder: 'NANUCLOUD TECH SOLUTIONS LDA',
    currency: 'AOA (Kz)',
    isActive: true,
    isVisible: false
  },
  {
    id: 'bank_pt_5',
    bankName: 'Millennium BCP (Portugal / Europa)',
    accountNumber: '0033.0000.7788.9900.505',
    iban: 'PT50.0033.0000.7788.9900.5056.7',
    swift: 'BCPPTPLX',
    holder: 'NANUCLOUD GLOBAL SERVICES UNIPESSOAL',
    currency: 'EUR (€)',
    isActive: true,
    isVisible: true
  },
  {
    id: 'bank_us_6',
    bankName: 'Wise / JPMorgan Chase (USD Global)',
    accountNumber: '9876543210',
    iban: 'US89.CHAS.0000.9876.5432.1001.2',
    swift: 'CHASUS33',
    holder: 'NANUCLOUD INTERNATIONAL LLC',
    currency: 'USD ($)',
    isActive: true,
    isVisible: false
  }
];

export const INITIAL_DB_ENGINES: DatabaseEngineConfig[] = [];

export const INITIAL_ADSENSE_SLOTS: AdsenseSlotConfig[] = [
  {
    id: 'slot_top_banner',
    slotNumber: 1,
    title: 'Banner Superior (Topo da Simulação Gratuita)',
    position: 'topo_banner',
    slotId: 'ca-pub-9842183912739182/1002938475',
    format: 'horizontal',
    isActive: true
  },
  {
    id: 'slot_sidebar_banner',
    slotNumber: 2,
    title: 'Banner Lateral (Barra de Ferramentas / Notícias)',
    position: 'lateral_banner',
    slotId: 'ca-pub-9842183912739182/2093847561',
    format: 'rectangle',
    isActive: true
  },
  {
    id: 'slot_footer_banner',
    slotNumber: 3,
    title: 'Banner de Rodapé (Abaixo dos Resultados de Teste)',
    position: 'rodape_banner',
    slotId: 'ca-pub-9842183912739182/3094857612',
    format: 'horizontal',
    isActive: true
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [];

export const INITIAL_FISCAL_NOTIFICATIONS: FiscalNotification[] = [
  {
    id: 'notif_fisc_2026_01',
    countryCode: 'AO',
    countryName: 'Angola',
    agencyName: 'Autoridade Tributária / Fisco',
    title: 'Atualização da Pauta Aduaneira e Regime de Cesta Básica (Lei 17/23)',
    summary: 'Publicação oficial relativa à alíquota de 5% de IVA para produtos essenciais da cesta básica e insumos agropecuários devidamente certificados.',
    taxType: 'IVA',
    oldRate: '14%',
    newRate: '5%',
    effectiveDate: '2026-01-01',
    sourceUrl: 'https://minfin.gov.ao/legislacao-tributaria',
    lawReference: 'Lei nº 17/23 de 29 de Dezembro / Código do IVA Artigo 15º',
    isCritical: true,
    readByManagers: [
      {
        managerId: 'usr_admin_1',
        managerName: 'Super Administrador NANUCLOUD',
        readAt: '2026-08-21T08:00:00.000Z'
      }
    ],
    createdAt: '2026-08-20T12:00:00.000Z'
  },
  {
    id: 'notif_at_2026_02',
    countryCode: 'PT',
    countryName: 'Portugal',
    agencyName: 'AT - Autoridade Tributária e Aduaneira',
    title: 'Despacho da AT sobre Retenção na Fonte de Não Residentes',
    summary: 'Clarificação das regras de retenção na fonte (11.5% e 25%) em serviços de consultoria digital prestados à distância.',
    taxType: 'Retenção Fonte',
    oldRate: '25%',
    newRate: '11.5% (Recibos Verdes)',
    effectiveDate: '2026-03-01',
    sourceUrl: 'https://portaldasfinancas.gov.pt',
    lawReference: 'Circular Normativa AT nº 04/2026 / Art. 101º do CIRS',
    isCritical: false,
    readByManagers: [],
    createdAt: '2026-08-21T09:00:00.000Z'
  },
  {
    id: 'notif_rf_2026_03',
    countryCode: 'BR',
    countryName: 'Brasil',
    agencyName: 'Receita Federal do Brasil',
    title: 'Transição da Reforma Tributária: PIS/COFINS e Alíquotas de Referência',
    summary: 'Publicação da tabela de alíquotas de teste da CBS e IBS no âmbito da regulamentação da Emenda Constitucional.',
    taxType: 'Imposto Industrial',
    oldRate: '9.25%',
    newRate: 'Tabela Progressiva',
    effectiveDate: '2026-06-01',
    sourceUrl: 'https://gov.br/receitafederal',
    lawReference: 'Instrução Normativa RFB nº 2204/2026',
    isCritical: false,
    readByManagers: [],
    createdAt: '2026-08-21T11:30:00.000Z'
  }
];

export const INITIAL_API_CONFIGS: ApiIntegrationConfig[] = [];

export const INITIAL_CLIENTS: UserSafe[] = [];

export const INITIAL_STAFF_USERS: UserSafe[] = [];

export const INITIAL_MANUAL_PAYMENTS: ManualPaymentValidation[] = [];

export const INITIAL_AUDIT_LOGS: ConsultingAuditEntry[] = [];

