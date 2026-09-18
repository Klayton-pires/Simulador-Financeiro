import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { UserSafe } from '../types';
import { CountryFiscal } from '../types';

export interface DossierExportParams {
  title: string;
  moduleName: string;
  user: UserSafe | null;
  clientInfo?: {
    name?: string;
    nif?: string;
    company?: string;
    email?: string;
    phone?: string;
    country?: string;
    address?: string;
  };
  country: CountryFiscal;
  inputFields: {
    label: string;
    value: string | number;
    description?: string;
  }[];
  calculatedFields: {
    label: string;
    amount: number | string;
    rateOrMargin?: string;
    category?: string;
    isDeduction?: boolean;
    isFinalHighlight?: boolean;
    fiscalDestiny?: string;
  }[];
  legalNotes?: string[];
  summaryCards?: {
    label: string;
    value: string;
    subtext?: string;
  }[];
  notes?: string;
  dossierNumber?: string;
}

/**
 * Formata valores numéricos para padrão monetário sem expor qualquer fórmula matemática.
 */
export function formatCurrencyValue(val: number | string, curr: string = 'Kz'): string {
  if (typeof val === 'string') return `${val} ${curr}`;
  return (
    new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val) + ` ${curr}`
  );
}

/**
 * Gera e descarrega um Dossiê Oficial em formato PDF
 * Layout executivo profissional com dados do usuário, cliente, campos utilizados e cálculos finais (valores estáticos sem fórmulas).
 */
export function exportSimulationDossierPDF(params: DossierExportParams) {
  const {
    title,
    moduleName,
    user,
    clientInfo,
    country,
    inputFields,
    calculatedFields,
    legalNotes,
    summaryCards,
    notes,
    dossierNumber = `DOS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentColor: [number, number, number] = [79, 70, 229]; // Indigo-600
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald-500

  // 1. CABEÇALHO CORPORATIVO (Fundo Branco com Logo da Aplicação)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 30, 'F');

  // Linha de acento verde oficial Nanucloud
  doc.setDrawColor(0, 168, 89);
  doc.setLineWidth(0.8);
  doc.line(14, 28, 196, 28);

  // Logo Nanucloud desenhado em vetor de alta precisão
  // Ícone da Nuvem Verde
  doc.setDrawColor(0, 168, 89);
  doc.setFillColor(0, 168, 89);
  doc.roundedRect(14, 8, 8, 8, 2, 2, 'FD');
  doc.setFillColor(255, 255, 255);
  doc.circle(18, 12, 2.2, 'F');

  // Nome da Aplicação: Apenas Nanucloud
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(24, 24, 27); // #18181B
  doc.text('Nanu', 25, 15);
  const nanuWidth = doc.getTextWidth('Nanu');
  doc.setTextColor(0, 168, 89); // #00A859
  doc.text('cloud', 25 + nanuWidth, 15);

  // Referência e Data à Direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`REF: ${dossierNumber}`, 196, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}`, 196, 18, { align: 'right' });

  let currentY = 36;

  // 2. TÍTULO DO DOSSIÊ
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title.toUpperCase(), 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Módulo: ${moduleName} • Moeda Oficial: ${country.curr}`, 14, currentY);
  currentY += 8;

  // 3. SECÇÃO 1: DADOS DO UTILIZADOR & CLIENTE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. IDENTIFICAÇÃO DO UTILIZADOR E CLIENTE', 14, currentY);
  currentY += 3;

  const userDataRows = [
    [
      'Utilizador / Emitente:',
      user ? `${user.name} (${user.email})` : 'Utilizador Autorizado Nanucloud',
      'Cliente / Destinatário:',
      clientInfo?.name || 'Cliente Geral / Consumidor Final'
    ],
    [
      'Empresa / Organização:',
      user?.company || 'Nanucloud Client Workspace',
      'Empresa do Cliente:',
      clientInfo?.company || clientInfo?.name || 'Não especificado'
    ],
    [
      'NIF do Utilizador:',
      user?.nif || 'Não Registado',
      'NIF do Cliente:',
      clientInfo?.nif || 'Consumidor Final'
    ],
    [
      'Contacto / Telefone:',
      user?.phone || '+244 955 581 862',
      'Email / Contacto:',
      clientInfo?.email || clientInfo?.phone || 'Registo Interno'
    ],
    [
      'Plano de Subscrição:',
      user?.activePlanName || 'Plano Profissional Ativo',
      'País / Localização:',
      country.name
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 42 },
      1: { cellWidth: 58 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 42 },
      3: { cellWidth: 48 }
    },
    body: userDataRows
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 4. SECÇÃO 2: PARÂMETROS E CAMPOS UTILIZADOS NA SIMULAÇÃO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('2. PARÂMETROS E CAMPOS DE ENTRADA UTILIZADOS', 14, currentY);
  currentY += 3;

  const inputRows = inputFields.map((field) => [
    field.label,
    typeof field.value === 'number' ? formatCurrencyValue(field.value, country.curr) : String(field.value),
    field.description || 'Parâmetro de base da operação'
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 45, fontStyle: 'bold', textColor: [30, 41, 59] },
      2: { cellWidth: 75, textColor: [100, 116, 139] }
    },
    head: [['Campo / Variável Utilizada', 'Valor / Taxa Aplicada', 'Descrição do Parâmetro']],
    body: inputRows
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 5. SECÇÃO 3: DEMONSTRATIVO DE CÁLCULO E VALORES APURADOS (SEM EXPOSIÇÃO DE FÓRMULAS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('3. DEMONSTRATIVO DE VALORES APURADOS (RESULTADOS FINAIS)', 14, currentY);
  currentY += 3;

  const calcRows = calculatedFields.map((item) => {
    const formattedAmt = typeof item.amount === 'number'
      ? formatCurrencyValue(item.amount, country.curr)
      : String(item.amount);

    const prefix = item.isDeduction ? '(-) ' : item.isFinalHighlight ? '(=) ' : '';

    return [
      `${prefix}${item.label}`,
      item.rateOrMargin || '---',
      formattedAmt,
      item.fiscalDestiny || 'Liquidação da Operação'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 75, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 45, textColor: [71, 85, 105], fontSize: 7.5 }
    },
    head: [['Rubrica / Linha de Apuramento', 'Taxa / %', `Montante (${country.curr})`, 'Enquadramento / Destinatário']],
    body: calcRows,
    didParseCell: (data) => {
      // Destaque para linhas finais
      if (data.row.raw && String(data.row.raw[0]).includes('(=) PREÇO') || String(data.row.raw[0]).includes('LUCRO LÍQUIDO')) {
        data.cell.styles.fillColor = [236, 253, 245];
        data.cell.styles.textColor = [6, 95, 70];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Se necessário, quebrar página
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 6. CARDS DE DESTAQUE EXECUTIVO
  if (summaryCards && summaryCards.length > 0) {
    const cardWidth = (182 / summaryCards.length);
    let cardX = 14;

    summaryCards.forEach((card) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cardX, currentY, cardWidth - 3, 16, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), cardX + 3, currentY + 5);

      doc.setFontSize(10.5);
      doc.setTextColor(...primaryColor);
      doc.text(card.value, cardX + 3, currentY + 11);

      if (card.subtext) {
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(card.subtext, cardX + 3, currentY + 14.5);
      }

      cardX += cardWidth;
    });

    currentY += 22;
  }

  // 7. SECÇÃO 4: ANEXOS, FUNDAMENTAÇÃO LEGAL E NOTAS TÉCNICAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('4. ANEXOS: ENQUADRAMENTO FISCAL E NOTAS TÉCNICAS', 14, currentY);
  currentY += 4;

  const defaultLegalNotes = legalNotes && legalNotes.length > 0 ? legalNotes : [
    `Conformidade com o Código do IVA e Legislação Tributária vigente de ${country.name} (${country.agency}).`,
    `A retenção na fonte (se aplicável) constitui adiantamento dedutível ou crédito de imposto conforme as normas fiscais aplicáveis.`,
    `Cálculos e valores estáticos computados via algoritmo NANUCLOUD para estrita conformidade legal e auditoria fiscal.`
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  defaultLegalNotes.forEach((note) => {
    doc.text(`• ${note}`, 16, currentY);
    currentY += 4;
  });

  if (notes) {
    currentY += 1;
    doc.setFont('helvetica', 'italic');
    doc.text(`Observações Adicionais: ${notes}`, 16, currentY);
    currentY += 4;
  }

  // 8. RODAPÉ DE AUDITORIA & AVISO LEGAL
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 281, 196, 281);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Aviso Legal Nanucloud: A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.',
      14,
      285,
      { maxWidth: 155 }
    );
    doc.setFontSize(7);
    doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
  }

  // Fazer o download do arquivo PDF
  const safeFilename = `Nanucloud_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${dossierNumber}.pdf`;
  doc.save(safeFilename);
}

/**
 * Gera e descarrega um Dossiê Oficial em formato Excel (.xlsx)
 * REGRA RIGOROSA: NUNCA exporta fórmulas matemáticas (como =SOMA, =A1*B1).
 * Apenas exporta valores numéricos apurados e formatados, com layout executivo e folhas estruturadas.
 */
export function exportSimulationDossierExcel(params: DossierExportParams) {
  const {
    title,
    moduleName,
    user,
    clientInfo,
    country,
    inputFields,
    calculatedFields,
    legalNotes,
    notes,
    dossierNumber = `DOS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  } = params;

  const workbook = XLSX.utils.book_new();

  // ==========================================
  // FOLHA 1: Dossiê e Resumo Executivo
  // ==========================================
  const dossierRows: (string | number)[][] = [
    ['Nanucloud - Dossiê de Simulação'],
    [`Módulo Oficial: ${moduleName}`],
    [`Número de Referência: ${dossierNumber}`],
    [`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}`],
    [`Moeda Oficial: ${country.curr}`],
    [''],
    ['1. DADOS DO UTILIZADOR & CLIENTE (IDENTIFICAÇÃO)'],
    ['Campo', 'Informação do Utilizador', 'Informação do Cliente'],
    ['Nome / Razão Social', user?.name || 'Utilizador Autorizado Nanucloud', clientInfo?.name || 'Cliente Geral / Consumidor Final'],
    ['Empresa / Entidade', user?.company || 'Nanucloud Client Workspace', clientInfo?.company || clientInfo?.name || 'Não especificado'],
    ['NIF / Identificação Fiscal', user?.nif || 'Não Registado', clientInfo?.nif || 'Consumidor Final'],
    ['Email de Contacto', user?.email || 'suporte@nanucloud.com', clientInfo?.email || 'Registo Interno'],
    ['Telefone / WhatsApp', user?.phone || '+244 955 581 862', clientInfo?.phone || 'Não especificado'],
    ['Plano de Subscrição', user?.activePlanName || 'Plano Profissional', '---'],
    [''],
    ['2. CAMPOS E PARÂMETROS UTILIZADOS NA SIMULAÇÃO'],
    ['Campo / Variável Utilizada', 'Valor / Taxa Aplicada', 'Descrição do Parâmetro']
  ];

  // Adicionar parâmetros de entrada (valores estáticos)
  inputFields.forEach((field) => {
    dossierRows.push([
      field.label,
      typeof field.value === 'number' ? field.value : String(field.value),
      field.description || 'Parâmetro de base da operação'
    ]);
  });

  dossierRows.push(['']);
  dossierRows.push(['3. DEMONSTRATIVO DE VALORES APURADOS (CÁLCULOS FINAIS - SEM FÓRMULAS)']);
  dossierRows.push(['Rubrica / Linha de Apuramento', 'Taxa / Margem Aplicada', `Montante (${country.curr})`, 'Enquadramento / Destinatário']);

  // Adicionar valores calculados apurados (apenas valores puros, sem fórmulas como =A1*B1)
  calculatedFields.forEach((item) => {
    dossierRows.push([
      item.label,
      item.rateOrMargin || '---',
      typeof item.amount === 'number' ? item.amount : String(item.amount),
      item.fiscalDestiny || 'Liquidação da Operação'
    ]);
  });

  dossierRows.push(['']);
  dossierRows.push(['4. ENQUADRAMENTO FISCAL E OBSERVAÇÕES']);
  const activeLegalNotes = legalNotes && legalNotes.length > 0 ? legalNotes : [
    `Conformidade com o Código do IVA e Legislação Tributária vigente de ${country.name}.`,
    `A retenção na fonte (se aplicável) constitui adiantamento dedutível ou crédito de imposto conforme as normas fiscais aplicáveis.`,
    `Cálculos e valores estáticos computados via algoritmo Nanucloud.`
  ];

  activeLegalNotes.forEach((n) => {
    dossierRows.push(['Norma Aplicável:', n]);
  });

  if (notes) {
    dossierRows.push(['Observações Adicionais:', notes]);
  }

  dossierRows.push(['']);
  dossierRows.push(['Aviso Legal Nanucloud:', 'A utilização deste aplicativo tem caráter meramente informativo e estimativo, não dispensando a consulta de um profissional de contas ou contabilista certificado.']);
  dossierRows.push(['Contactos de Suporte:', '+244 955 581 862 / +244 955 580 653 • suporte@nanucloud.com']);

  const wsDossier = XLSX.utils.aoa_to_sheet(dossierRows);

  // Formatação de larguras das colunas
  wsDossier['!cols'] = [
    { wch: 38 },
    { wch: 35 },
    { wch: 32 },
    { wch: 38 }
  ];

  XLSX.utils.book_append_sheet(workbook, wsDossier, 'Dossie_Oficial_NANUCLOUD');

  // ==========================================
  // FOLHA 2: Tabela Estruturada de Resultados
  // ==========================================
  const structuredData = calculatedFields.map((item) => ({
    'Rubrica de Apuramento': item.label,
    'Taxa / Percentagem': item.rateOrMargin || '---',
    [`Montante Apurado (${country.curr})`]: typeof item.amount === 'number' ? item.amount : item.amount,
    'Enquadramento Fiscal': item.fiscalDestiny || 'Geral'
  }));

  const wsStructured = XLSX.utils.json_to_sheet(structuredData);
  wsStructured['!cols'] = [
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(workbook, wsStructured, 'Quadro_Valores_Calculados');

  // Gravar ficheiro Excel
  const safeFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${dossierNumber}.xlsx`;
  XLSX.writeFile(workbook, safeFilename, { bookType: 'xlsx' });
}
