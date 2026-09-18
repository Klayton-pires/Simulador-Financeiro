import { CountryFiscal } from '../types';

export interface CountryFiscalExtended extends CountryFiscal {
  officialPortal: string;
  currencySymbol: string;
  importantNotes: {
    products: string;
    services: string;
    importation: string;
  };
  logisticsHubs: {
    seaPorts: string[];
    airports: string[];
    landBorders: string[];
  };
}

export type CountryFiscalConfig = CountryFiscalExtended;

export const COUNTRIES_DB: Record<string, CountryFiscalExtended> = {
  AO: {
    code: 'AO',
    name: 'Angola',
    curr: 'Kz',
    currencySymbol: 'Kz',
    agency: 'Autoridade Tributária / Fisco',
    officialPortal: 'https://minfin.gov.ao',
    vatOptions: [
      { n: 'Geral (14%)', r: 14 },
      { n: 'Simplificado (7%)', r: 7 },
      { n: 'Cesta Básica (5%)', r: 5 },
      { n: 'Isento (0%) - Art. 12º CIVA', r: 0 }
    ],
    ii: 25,
    tpa: 0,
    retentionServiceRate: 6.5,
    statisticalTax: 0.5,
    margins: [10, 20, 30],
    defaultCustomsRate: 10,
    importantNotes: {
      products: 'Em Angola, a taxa geral de IVA é de 14%. Produtos da cesta básica e insumos agropecuários beneficiam de alíquota reduzida de 5% (Lei 17/23). Margens e taxas de TPA (Multicaixa por padrão 0% ou negociado) incidem no momento da venda.',
      services: 'Serviços prestados por sujeitos passivos a entidades obrigadas à retenção na fonte estão sujeitos à alíquota de 6.5% do Imposto sobre o Rendimento/Serviços (CIRS/Fisco).',
      importation: 'Despacho Aduaneiro: Os direitos aduaneiros (Pauta Aduaneira) variam de 2% a 50%, acrescidos de 0.5% de Taxa Estatística e 14% de IVA Aduaneiro sobre o Valor CIF aduaneiro.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Luanda', 'Porto do Lobito', 'Porto do Namibe', 'Porto de Cabinda'],
      airports: ['Aeroporto Internacional Dr. António Agostinho Neto (AIAAN)', 'Aeroporto 4 de Fevereiro (LAD)'],
      landBorders: ['Fronteira Santa Clara (Namíbia)', 'Fronteira Luvo (RDC)', 'Fronteira Massabi (Congo)']
    }
  },
  PT: {
    code: 'PT',
    name: 'Portugal',
    curr: '€',
    currencySymbol: '€',
    agency: 'AT - Autoridade Tributária e Aduaneira',
    officialPortal: 'https://portaldasfinancas.gov.pt',
    vatOptions: [
      { n: 'Normal (23%)', r: 23 },
      { n: 'Intermédia (13%)', r: 13 },
      { n: 'Reduzida (6%)', r: 6 },
      { n: 'Isento (0%) - Art. 9º CIVA', r: 0 }
    ],
    ii: 21,
    tpa: 0,
    retentionServiceRate: 11.5, // ou 25% consoante categoria profissional
    statisticalTax: 0.0,
    margins: [15, 25, 35],
    defaultCustomsRate: 6,
    importantNotes: {
      products: 'Em Portugal continental aplica-se a taxa normal de IVA de 23%, com alíquotas reduzidas (6%) para bens alimentares essenciais e 13% para restauração e combustíveis agrícolas.',
      services: 'Prestação de serviços por profissionais liberais sujeita a retenção na fonte de IRS à taxa de 11.5% (recibos verdes) ou 25% (atividades específicas da tabela do art. 151º do CIRS).',
      importation: 'Importações extra-comunitárias na UE estão sujeitas a Direitos Aduaneiros (TARIC) e IVA Aduaneiro de 23% liquidado no desalfandegamento.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Sines', 'Porto de Leixões', 'Porto de Lisboa', 'Porto de Setúbal'],
      airports: ['Aeroporto Humberto Delgado (LIS)', 'Aeroporto Francisco Sá Carneiro (OPO)'],
      landBorders: ['Vilar Formoso (Espanha)', 'Valença (Espanha)', 'Elvas / Caia (Espanha)']
    }
  },
  BR: {
    code: 'BR',
    name: 'Brasil',
    curr: 'R$',
    currencySymbol: 'R$',
    agency: 'Receita Federal do Brasil / SEFAZ',
    officialPortal: 'https://gov.br/receitafederal',
    vatOptions: [
      { n: 'ICMS Padrão (17% / 18%)', r: 18 },
      { n: 'PIS/COFINS + ICMS (22%)', r: 22 },
      { n: 'Simples Nacional (7%)', r: 7 },
      { n: 'Isento (0%)', r: 0 }
    ],
    ii: 15,
    tpa: 0,
    retentionServiceRate: 4.65, // PIS/COFINS/CSLL retidos + ISS
    statisticalTax: 0.5,
    margins: [15, 25, 40],
    defaultCustomsRate: 14,
    importantNotes: {
      products: 'Tributação de mercadorias no Brasil compreende ICMS estadual (17-20%), IPI federal e PIS/COFINS. Optantes do Simples Nacional possuem tributação unificada no DAS.',
      services: 'Serviços sujeitos a ISS municipal (2% a 5%) e retenções federais (4.65% PIS/COFINS/CSLL + 1.5% IRRF) conforme legislação da Receita Federal.',
      importation: 'Despacho Aduaneiro SISCOMEX: Imposto de Importação (II) variável de 0% a 35%, IPI, PIS/COFINS-Importação, AFRMM (marítimo 8%) e taxa de utilização do Siscomex.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Santos', 'Porto de Paranaguá', 'Porto de Itajaí', 'Porto de Suape'],
      airports: ['Aeroporto Internacional de Guarulhos (GRU)', 'Aeroporto de Viracopos (VCP)'],
      landBorders: ['Foz do Iguaçu (Paraguai/Argentina)', 'Uruguaiana (Argentina)', 'Corumbá (Bolívia)']
    }
  },
  MZ: {
    code: 'MZ',
    name: 'Moçambique',
    curr: 'MT',
    currencySymbol: 'MT',
    agency: 'AT - Autoridade Tributária de Moçambique',
    officialPortal: 'https://at.gov.mz',
    vatOptions: [
      { n: 'Geral (16%)', r: 16 },
      { n: 'Isento (0%)', r: 0 }
    ],
    ii: 32,
    tpa: 0,
    retentionServiceRate: 20.0,
    statisticalTax: 1.0,
    margins: [10, 20, 30],
    defaultCustomsRate: 20,
    importantNotes: {
      products: 'Em Moçambique a taxa normal do IVA é de 16% (Decreto 67/2022). Produtos essenciais e insumos agrícolas gozam de isenção.',
      services: 'Prestação de serviços por não residentes ou sem estabelecimento estável sujeita a retenção de IRPC à taxa liberatória de 20%.',
      importation: 'Pauta Aduaneira de Moçambique: Direitos aduaneiros de 0%, 5%, 7.5% e 20% acrescidos de IVA (16%) e taxa de serviço aduaneiro TSA.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Maputo', 'Porto da Beira', 'Porto de Nacala'],
      airports: ['Aeroporto Internacional de Maputo (MPM)', 'Aeroporto da Beira (BEW)'],
      landBorders: ['Ressano Garcia (África do Sul)', 'Machipanda (Zimbábue)', 'Calomue (Malawi)']
    }
  },
  CV: {
    code: 'CV',
    name: 'Cabo Verde',
    curr: 'CVE',
    currencySymbol: 'CVE',
    agency: 'DNRE - Direcção Nacional de Receitas do Estado',
    officialPortal: 'https://dnre.gov.cv',
    vatOptions: [
      { n: 'Geral (15%)', r: 15 },
      { n: 'Reduzido / Turístico (10%)', r: 10 },
      { n: 'Isento (0%)', r: 0 }
    ],
    ii: 22,
    tpa: 0,
    retentionServiceRate: 10.0,
    statisticalTax: 0.5,
    margins: [10, 20, 30],
    defaultCustomsRate: 15,
    importantNotes: {
      products: 'IVA em Cabo Verde: 15% taxa geral e 10% no setor hoteleiro e turístico, com isenções específicas no código do IVA.',
      services: 'Retenção na fonte para prestadores de serviços de 10% (IRPS categoria B) nos termos do Código do IRPS/DNRE.',
      importation: 'Direitos de Importação (DI) de 0% a 35%, Taxa Comunitária da CEDEAO (0.5%) e IVA aduaneiro de 15%.'
    },
    logisticsHubs: {
      seaPorts: ['Porto Grande (Mindelo)', 'Porto da Praia', 'Porto de Palmeira (Sal)'],
      airports: ['Aeroporto Internacional Amílcar Cabral (SID)', 'Aeroporto Nelson Mandela (RAI)'],
      landBorders: ['N/A - Estado Insular (Ligação Inter-Ilhas via Ferry)']
    }
  },
  CN: {
    code: 'CN',
    name: 'China',
    curr: '¥',
    currencySymbol: '¥',
    agency: 'STA - State Taxation Administration',
    officialPortal: 'https://chinatax.gov.cn',
    vatOptions: [
      { n: 'Standard (13%)', r: 13 },
      { n: 'Reduced (9%)', r: 9 },
      { n: 'Services (6%)', r: 6 },
      { n: 'Exempt (0%)', r: 0 }
    ],
    ii: 25,
    tpa: 0,
    retentionServiceRate: 10.0,
    statisticalTax: 0.0,
    margins: [10, 20, 30],
    defaultCustomsRate: 10,
    importantNotes: {
      products: 'IVA industrial na China: 13% em bens manufaturados, 9% em produtos agrícolas e transporte, 6% em serviços de TI e consultoria.',
      services: 'Retenção na fonte para empresas estrangeiras fornecedoras de serviços com taxa de 10% de imposto retido (WHT).',
      importation: 'Tarifas alfandegárias da China ad valorem sobre o valor CIF, além de IVA de importação e imposto sobre o consumo para itens de luxo.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Xangai', 'Porto de Ningbo-Zhoushan', 'Porto de Shenzhen', 'Porto de Guangzhou'],
      airports: ['Aeroporto Internacional de Xangai Pudong (PVG)', 'Aeroporto de Guangzhou Baiyun (CAN)'],
      landBorders: ['Khorgos (Cazaquistão)', 'Manzhouli (Rússia)', 'Pingxiang (Vietname)']
    }
  },
  US: {
    code: 'US',
    name: 'Estados Unidos (EUA)',
    curr: '$',
    currencySymbol: '$',
    agency: 'IRS / U.S. Customs and Border Protection (CBP)',
    officialPortal: 'https://irs.gov',
    vatOptions: [
      { n: 'Sales Tax Média (8.25%)', r: 8.25 },
      { n: 'Sales Tax Mínima (4%)', r: 4 },
      { n: 'Zero State Tax (0%) - Ex: Delaware/Oregon', r: 0 }
    ],
    ii: 21,
    tpa: 0,
    retentionServiceRate: 30.0, // Non-resident alien W-8BEN WHT
    statisticalTax: 0.35, // Merchandise Processing Fee (MPF)
    margins: [15, 30, 50],
    defaultCustomsRate: 5,
    importantNotes: {
      products: 'Nos EUA não existe IVA federal, vigorando a Sales & Use Tax estadual e municipal variando de 0% a 10.25% conforme o estado e condado.',
      services: 'Contratos e prestação de serviços por não-residentes sujeitos a retenção federal de 30% no formulário W-8BEN/W-8BEN-E salvo tratado bilateral.',
      importation: 'Harmonized Tariff Schedule (HTSUS) + Taxa de Processamento de Mercadorias (MPF: 0.3464%) e Harbor Maintenance Fee (HMF: 0.125% via marítima).'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Los Angeles', 'Porto de Long Beach', 'Porto de Nova Iorque/Nova Jersey', 'Porto de Houston'],
      airports: ['Aeroporto Internacional de Miami (MIA)', 'Aeroporto JFK (Nova Iorque)', 'Aeroporto Chicago O’Hare (ORD)'],
      landBorders: ['Laredo (México)', 'Otay Mesa (México)', 'Detroit Ambassador Bridge (Canadá)']
    }
  },
  DE: {
    code: 'DE',
    name: 'Alemanha',
    curr: '€',
    currencySymbol: '€',
    agency: 'BZSt - Bundeszentralamt für Steuern',
    officialPortal: 'https://bzst.de',
    vatOptions: [
      { n: 'MwSt Standard (19%)', r: 19 },
      { n: 'Reduzido (7%)', r: 7 },
      { n: 'Isento (0%)', r: 0 }
    ],
    ii: 15,
    tpa: 0,
    retentionServiceRate: 15.0,
    statisticalTax: 0.0,
    margins: [10, 20, 30],
    defaultCustomsRate: 6,
    importantNotes: {
      products: 'Mehrwertsteuer (MwSt) de 19% taxa normal e 7% reduzida para alimentos essenciais, livros e transporte público.',
      services: 'Retenção na fonte sobre prestação de serviços por entidades estrangeiras (Bauabzugsteuer 15% na construção civil e § 50a EStG).',
      importation: 'Alfandega da UE (Zoll) baseada na pauta comunitária TARIC + 19% Einfuhrumsatzsteuer (EUSt).'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Hamburgo', 'Porto de Bremen/Bremerhaven'],
      airports: ['Aeroporto de Frankfurt (FRA)', 'Aeroporto de Munique (MUC)'],
      landBorders: ['Fronteira com Polónia, Áustria, França, Países Baixos, Chéquia']
    }
  },
  AE: {
    code: 'AE',
    name: 'Emirados Árabes Unidos (Dubai)',
    curr: 'AED',
    currencySymbol: 'AED',
    agency: 'FTA - Federal Tax Authority',
    officialPortal: 'https://tax.gov.ae',
    vatOptions: [
      { n: 'Standard (5%)', r: 5 },
      { n: 'Free Zone / Isento (0%)', r: 0 }
    ],
    ii: 9,
    tpa: 0,
    retentionServiceRate: 0.0,
    statisticalTax: 0.0,
    margins: [10, 20, 35],
    defaultCustomsRate: 5,
    importantNotes: {
      products: 'IVA de 5% sobre a maioria dos bens de consumo. Zonas Francas (Designated Free Zones) gozam de benefícios aduaneiros e isenção em transferências intraterritório.',
      services: 'Imposto sobre as Sociedades de 9% sobre lucros acima de 375.000 AED. Retenção na fonte (Withholding Tax) é de 0%.',
      importation: 'Tarifa comum do GCC de 5% sobre o valor CIF na maioria dos bens importados, com desembaraço acelerado nos portos de Dubai.'
    },
    logisticsHubs: {
      seaPorts: ['Porto Jebel Ali (Dubai)', 'Porto Khalifa (Abu Dhabi)', 'Porto de Sharjah'],
      airports: ['Aeroporto Internacional de Dubai (DXB)', 'Aeroporto Dubai World Central (DWC)'],
      landBorders: ['Fronteira Al Ghuwaifat (Arábia Saudita)', 'Fronteira Hatta (Omã)']
    }
  },
  IN: {
    code: 'IN',
    name: 'Índia',
    curr: '₹',
    currencySymbol: '₹',
    agency: 'CBIC - Central Board of Indirect Taxes and Customs',
    officialPortal: 'https://cbic.gov.in',
    vatOptions: [
      { n: 'GST Standard (18%)', r: 18 },
      { n: 'GST Reduced (12%)', r: 12 },
      { n: 'GST Low (5%)', r: 5 },
      { n: 'GST Luxury (28%)', r: 28 },
      { n: 'Exempt (0%)', r: 0 }
    ],
    ii: 25,
    tpa: 0,
    retentionServiceRate: 10.0, // TDS (Tax Deducted at Source)
    statisticalTax: 0.0,
    margins: [10, 20, 30],
    defaultCustomsRate: 15,
    importantNotes: {
      products: 'Regime GST (Goods and Services Tax) dividido entre CGST, SGST e IGST com quatro faixas: 5%, 12%, 18% e 28%.',
      services: 'Serviços sujeitos a retenção TDS (Tax Deducted at Source) de 2% a 10% dependendo da natureza do contrato (Sec. 194C/194J).',
      importation: 'Basic Customs Duty (BCD) + Integrated GST (IGST) + Social Welfare Surcharge (SWS: 10% sobre o BCD).'
    },
    logisticsHubs: {
      seaPorts: ['Porto Jawaharlal Nehru (Nhava Sheva - Mumbai)', 'Porto de Mundra', 'Porto de Chennai'],
      airports: ['Aeroporto Internacional Indira Gandhi (DEL)', 'Aeroporto Chhatrapati Shivaji (BOM)'],
      landBorders: ['Fronteira Attari/Wagah', 'Fronteira Petrapole (Bangladesh)']
    }
  },
  JP: {
    code: 'JP',
    name: 'Japão',
    curr: '¥',
    currencySymbol: '¥',
    agency: 'NTA - National Tax Agency',
    officialPortal: 'https://nta.go.jp',
    vatOptions: [
      { n: 'Standard Consumption Tax (10%)', r: 10 },
      { n: 'Reduced (8%) - Alimentos & Bebidas', r: 8 },
      { n: 'Exempt (0%)', r: 0 }
    ],
    ii: 23.2,
    tpa: 0,
    retentionServiceRate: 10.21, // Inclui imposto de reconstrução
    statisticalTax: 0.0,
    margins: [10, 20, 30],
    defaultCustomsRate: 5,
    importantNotes: {
      products: 'Consumption Tax japonesa (JCT) é de 10% (7.8% nacional + 2.2% local) e 8% para bens alimentares não consumidos no local.',
      services: 'Retenção na fonte para profissionais independentes à taxa de 10.21% para valores até 1 milhão de ienes.',
      importation: 'Tarifas aduaneiras calculadas sobre o valor CIF + JCT de 10% no desembaraço.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Tóquio', 'Porto de Yokohama', 'Porto de Kobe', 'Porto de Nagoya'],
      airports: ['Aeroporto Internacional de Tóquio Narita (NRT)', 'Aeroporto Internacional de Haneda (HND)'],
      landBorders: ['N/A - Arquipélago']
    }
  },
  ZA: {
    code: 'ZA',
    name: 'África do Sul',
    curr: 'R',
    currencySymbol: 'R',
    agency: 'SARS - South African Revenue Service',
    officialPortal: 'https://sars.gov.za',
    vatOptions: [
      { n: 'Standard (15%)', r: 15 },
      { n: 'Zero Rate (0%)', r: 0 }
    ],
    ii: 27,
    tpa: 0,
    retentionServiceRate: 15.0,
    statisticalTax: 0.0,
    margins: [10, 20, 30],
    defaultCustomsRate: 15,
    importantNotes: {
      products: 'IVA na África do Sul é de 15% para a maioria dos bens e serviços, com taxa zero para 19 itens alimentares básicos.',
      services: 'Withholding Tax de 15% sobre honorários de serviços pagos a não-residentes sem convenção de dupla tributação.',
      importation: 'Customs Duty calculado de acordo com o acordo SACU e pauta da SARS + 15% de IVA aduaneiro (calculado sobre ATV = FOB + 10% + Direitos).'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Durban', 'Porto da Cidade do Cabo', 'Porto de Port Elizabeth', 'Porto de Coega'],
      airports: ['Aeroporto Internacional O.R. Tambo (JNB)', 'Aeroporto Internacional da Cidade do Cabo (CPT)'],
      landBorders: ['Beitbridge (Zimbábue)', 'Lebombo (Moçambique)', 'Maseru Bridge (Lesoto)']
    }
  },
  TR: {
    code: 'TR',
    name: 'Turquia',
    curr: '₺',
    currencySymbol: '₺',
    agency: 'GİB - Gelir İdaresi Başkanlığı',
    officialPortal: 'https://gib.gov.tr',
    vatOptions: [
      { n: 'KDV Standard (20%)', r: 20 },
      { n: 'Reduzido (10%)', r: 10 },
      { n: 'Super-Reduzido (1%)', r: 1 },
      { n: 'Isento (0%)', r: 0 }
    ],
    ii: 25,
    tpa: 0,
    retentionServiceRate: 20.0,
    statisticalTax: 0.0,
    margins: [10, 20, 35],
    defaultCustomsRate: 12,
    importantNotes: {
      products: 'Katma Değer Vergisi (KDV) standard de 20% (atualizado por decreto presidencial), com 10% para farmácia e alimentação básica e 1% para cereais.',
      services: 'Retenção na fonte (Stopaj) de 20% em pagamentos por serviços de consultoria e honorários a não-residentes.',
      importation: 'União Aduaneira com a UE (certificado A.TR para isenção tarifária em bens industriais) + KDV de 20%.'
    },
    logisticsHubs: {
      seaPorts: ['Porto de Ambarlı (Istambul)', 'Porto de Mersin', 'Porto de Izmir'],
      airports: ['Aeroporto Internacional de Istambul (IST)', 'Aeroporto Sabiha Gökçen (SAW)'],
      landBorders: ['Kapıkule (Bulgária)', 'Gürbulak (Irão)', 'Habur (Iraque)']
    }
  },
  OTHER: {
    code: 'OTHER',
    name: 'Outro País / Internacional',
    curr: 'USD',
    currencySymbol: '$',
    agency: 'Autoridade Tributária Internacional',
    officialPortal: 'https://oecd.org/tax',
    vatOptions: [
      { n: 'Padrão Internacional (20%)', r: 20 },
      { n: 'Padrão Médio (14%)', r: 14 },
      { n: 'Padrão Baixo (10%)', r: 10 },
      { n: 'Isento (0%)', r: 0 }
    ],
    ii: 20,
    tpa: 0,
    retentionServiceRate: 10.0,
    statisticalTax: 0.5,
    margins: [10, 20, 30],
    defaultCustomsRate: 10,
    importantNotes: {
      products: 'Para cálculos internacionais genéricos, configure as taxas locais de IVA e margem comercial de acordo com a legislação do país de destino.',
      services: 'Consulte a convenção de dupla tributação entre os países contratantes para determinar a taxa de retenção na fonte aplicável.',
      importation: 'Simulação aduaneira baseada nos Incoterms 2020 (CIF/FOB) e regras da Organização Mundial das Alfândegas (OMA).'
    },
    logisticsHubs: {
      seaPorts: ['Portos Marítimos Internacionais Oficiais'],
      airports: ['Aeroportos Internacionais de Carga'],
      landBorders: ['Postos Aduaneiros Terrestres']
    }
  }
};

/**
 * Super Admin Country Visibility & Custom Fiscal Matrix Helpers
 */
export const getActiveCountriesDb = (): Record<string, CountryFiscalExtended> => {
  try {
    const saved = localStorage.getItem('nanucloud_custom_fiscal_matrix');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...COUNTRIES_DB, ...parsed };
    }
  } catch (e) {
    // fallback
  }
  return COUNTRIES_DB;
};

export const getEffectiveCountryFiscal = (code: string): CountryFiscalExtended => {
  const db = getActiveCountriesDb();
  return db[code] || db['AO'] || COUNTRIES_DB['AO'];
};

export const saveCustomFiscalMatrix = (matrix: Record<string, CountryFiscalConfig>): void => {
  localStorage.setItem('nanucloud_custom_fiscal_matrix', JSON.stringify(matrix));
  window.dispatchEvent(new Event('nanucloud_custom_fiscal_matrix_updated'));
  window.dispatchEvent(new Event('nanucloud_countries_updated'));
};

export const getHiddenCountryCodes = (): string[] => {
  try {
    const saved = localStorage.getItem('nanucloud_hidden_countries');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const setHiddenCountryCodes = (codes: string[]): void => {
  localStorage.setItem('nanucloud_hidden_countries', JSON.stringify(codes));
  window.dispatchEvent(new Event('nanucloud_countries_updated'));
};

export const isCountryHidden = (code: string): boolean => {
  const hidden = getHiddenCountryCodes();
  return hidden.includes(code);
};

export const getAvailableCountryList = (isSuperAdmin: boolean = false): CountryFiscalExtended[] => {
  const db = getActiveCountriesDb();
  const all = Object.values(db);
  if (isSuperAdmin) return all;
  const hidden = getHiddenCountryCodes();
  return all.filter((c) => !hidden.includes(c.code));
};

export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
};


