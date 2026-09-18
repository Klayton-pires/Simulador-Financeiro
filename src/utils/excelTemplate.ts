import * as XLSX from 'xlsx';

/**
 * Gera e descarrega a planilha modelo oficial NANUCLOUD (.xlsx ou .csv)
 * com cabeçalhos padronizados e dados de exemplo para produtos e serviços.
 */
export function downloadOfficialExcelTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Código / Ref': 'ART-001',
      'Nome do Produto / Descrição': 'Computador Portátil Core i7 16GB',
      'Categoria': 'Informática',
      'Preço de Custo (S/ IVA)': 350000,
      'Quantidade': 10,
      'Fornecedor': 'Tech Distribuidora Luanda'
    },
    {
      'Código / Ref': 'ART-002',
      'Nome do Produto / Descrição': 'Impressora Multifunções Laser',
      'Categoria': 'Escritório',
      'Preço de Custo (S/ IVA)': 120000,
      'Quantidade': 5,
      'Fornecedor': 'Office Imports Lda'
    },
    {
      'Código / Ref': 'ART-003',
      'Nome do Produto / Descrição': 'Caixa de Papel A4 80g (5 Resmas)',
      'Categoria': 'Consumíveis',
      'Preço de Custo (S/ IVA)': 18500,
      'Quantidade': 50,
      'Fornecedor': 'Papelaria Central'
    },
    {
      'Código / Ref': 'ART-004',
      'Nome do Produto / Descrição': 'Monitor LED 24 Polegadas IPS',
      'Categoria': 'Informática',
      'Preço de Custo (S/ IVA)': 85000,
      'Quantidade': 15,
      'Fornecedor': 'Tech Distribuidora Luanda'
    },
    {
      'Código / Ref': 'ART-005',
      'Nome do Produto / Descrição': 'Rato Óptico Sem Fios Ergonómico',
      'Categoria': 'Acessórios',
      'Preço de Custo (S/ IVA)': 6500,
      'Quantidade': 40,
      'Fornecedor': 'MegaStock Angola'
    },
    {
      'Código / Ref': 'SRV-101',
      'Nome do Produto / Descrição': 'Serviço de Instalação e Configuração de Rede',
      'Categoria': 'Serviços TI',
      'Preço de Custo (S/ IVA)': 0,
      'Quantidade': 1,
      'Fornecedor': 'Interno'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Ajustar larguras das colunas
  worksheet['!cols'] = [
    { wch: 15 }, // Código
    { wch: 45 }, // Descrição
    { wch: 18 }, // Categoria
    { wch: 25 }, // Preço de Custo
    { wch: 12 }, // Quantidade
    { wch: 28 }  // Fornecedor
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo NANUCLOUD');

  if (format === 'csv') {
    XLSX.writeFile(workbook, 'Modelo_Oficial_NANUCLOUD.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, 'Modelo_Oficial_NANUCLOUD.xlsx', { bookType: 'xlsx' });
  }
}
