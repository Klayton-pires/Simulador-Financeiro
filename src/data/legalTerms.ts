export interface LegalTermSection {
  id: string;
  title: string;
  content: string;
  bulletPoints?: string[];
}

export interface LegalTermsConfig {
  version: string;
  lastUpdated: string;
  title: string;
  subtitle: string;
  disclaimerTitle: string;
  disclaimerContent: string;
  sections: LegalTermSection[];
  customClause?: string;
  contactSupportText: string;
  updatedBy?: string;
}

export const DEFAULT_LEGAL_TERMS: LegalTermsConfig = {
  version: '3.4.0',
  lastUpdated: '25/08/2026',
  title: 'TERMOS DE USO & POLÍTICA DE REEMBOLSO',
  subtitle: 'NANUCLOUD Tech Solutions — Transparência, Segurança e Isenção de Responsabilidade',
  disclaimerTitle: 'AVISO ESSENCIAL: NATUREZA DE SIMULADOR FISCAL E COMERCIAL',
  disclaimerContent: 'A plataforma NANUCLOUD é uma ferramenta tecnológica de simulação, modelagem comercial e suporte à tomada de decisão de precificação. A NANUCLOUD e os seus desenvolvedores não são agentes fiscais, autoridades governamentais nem substituem a consulta a Técnicos Oficiais de Contas (TOC), contabilistas certificados ou despachantes aduaneiros credenciados. Os resultados gerados dependem dos dados inseridos pelo próprio utilizador.',
  sections: [
    {
      id: 'terms_of_use',
      title: '1. Termos de Utilização do Serviço',
      content: 'Regras gerais de utilização e integridade da infraestrutura NANUCLOUD:',
      bulletPoints: [
        'Gratuidade e Acesso: O acesso básico e simulações diárias são disponibilizados gratuitamente. O utilizador pode optar por subscrever planos de consultas adicionais ou módulos avançados conforme as suas necessidades operacionais.',
        'Responsabilidade pelas Credenciais: O utilizador é o único responsável pela guarda, sigilo e não partilha dos seus dados de acesso. A NANUCLOUD não se responsabiliza por acessos não autorizados decorrentes de negligência do utilizador.',
        'Disponibilidade e Escalabilidade: Empregamos mecanismos inteligentes de limitação de volume para evitar sobrecargas no servidor e garantir que a aplicação funcione de forma fluida em todas as plataformas (Web, Desktop e Mobile).'
      ]
    },
    {
      id: 'liability',
      title: '2. Limitação de Responsabilidade & Aviso Obrigatório',
      content: 'A NANUCLOUD empenha-se em disponibilizar ferramentas matemáticas de cálculo e formação de preços. O Simulador Financeiro Nanucloud é uma plataforma privada e independente, sem qualquer vínculo institucional ou filiação com a Administração Geral Tributária (AGT) ou quaisquer órgãos governamentais.',
      bulletPoints: [
        'AVISO MANDATÓRIO: A utilização deste aplicativo tem caráter meramente informativo e NÃO DISPENSA a consulta de um profissional de contas ou contabilista certificado habilitado.',
        'A exatidão dos cálculos depende integralmente dos valores de custo, margem e enquadramento aduaneiro fornecidos pelo utilizador.',
        'Os relatórios e dossiês exportados servem como instrumento de apoio à gestão comercial interna e não constituem parecer jurídico-tributário vinculativo perante o Fisco ou autoridades estatais.'
      ]
    },
    {
      id: 'refunds',
      title: '3. Política de Reembolso e Devoluções',
      content: 'Como a plataforma disponibiliza testes e simulações gratuitas prévias antes de qualquer pagamento, as recargas de consultas e ativações de planos seguem critérios transparentes:',
      bulletPoints: [
        'Requisito de Provas Concretas: Pedidos de reembolso devem ser submetidos via Ticket de Suporte num prazo máximo de até 7 dias úteis após o pagamento, acompanhados de comprovativo de transação e evidência inequívoca de falha técnica insanável atribuível exclusivamente ao sistema.',
        'Consultas Utilizadas: Planos ou pacotes onde as consultas já tenham sido consumidas pelo utilizador não são elegíveis a reembolso proporcional.',
        'Resolução Amigável: A nossa equipa de apoio prioriza sempre a compensação imediata em créditos adicionais de consulta ou suporte prioritário personalizado para garantir a máxima satisfação de todos os clientes.'
      ]
    },
    {
      id: 'privacy',
      title: '4. Privacidade, Confidencialidade e Dados',
      content: 'Os dados de simulação e tabelas de custos submetidos pelo utilizador são confidenciais e protegidos por criptografia de ponta a ponta. A NANUCLOUD não comercializa nem partilha informações financeiras ou cadastrais de clientes com terceiros.',
      bulletPoints: [
        'Backups e auditoria são geridos em conformidade com as melhores práticas internacionais de proteção de dados.',
        'O utilizador pode a qualquer momento exportar ou solicitar a eliminação dos seus registros de histórico de consultas.'
      ]
    }
  ],
  customClause: 'Para questões legais ou contratos empresariais corporativos com SLA garantido, contacte o nosso departamento jurídico.',
  contactSupportText: 'suporte@nanucloud.com | +244 944 935 617 / +244 944 935 618'
};

const STORAGE_KEY = 'nanucloud_legal_terms';

export function getLegalTerms(): LegalTermsConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.title && Array.isArray(parsed.sections)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse legal terms from localStorage:', e);
  }
  return DEFAULT_LEGAL_TERMS;
}

export function saveLegalTerms(terms: LegalTermsConfig): void {
  try {
    const updated = {
      ...terms,
      lastUpdated: new Date().toLocaleDateString('pt-PT')
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nanucloud_legal_terms_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save legal terms:', e);
  }
}

export function resetLegalTermsToDefault(): LegalTermsConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('nanucloud_legal_terms_updated', { detail: DEFAULT_LEGAL_TERMS }));
  } catch (e) {
    console.error('Failed to reset legal terms:', e);
  }
  return DEFAULT_LEGAL_TERMS;
}
