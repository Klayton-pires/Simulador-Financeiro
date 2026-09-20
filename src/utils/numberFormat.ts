/**
 * Utilitários de Formatação Numérica Fiscal Portuguesa / Angolana
 * Separador de milhares: Ponto (.)
 * Separador decimal: Vírgula (,) com até 3 casas decimais
 */

/**
 * Converte qualquer valor inserido (com pontos de milhar e vírgula decimal) num número JavaScript nativo.
 * Exemplos:
 * "1.250,500" -> 1250.5
 * "10.500" -> 10500
 * "12,750" -> 12.75
 * "1500.50" -> 1500.5
 */
export function parseFormattedNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  if (!str) return 0;

  // Se contiver tanto ponto como vírgula:
  // ex: "1.250.000,500" -> remover pontos de milhar e trocar vírgula por ponto
  if (str.includes('.') && str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  // Se contiver apenas vírgula: "1250,500"
  if (str.includes(',')) {
    const clean = str.replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  // Se contiver apenas ponto, verificar se é separador de milhares ou decimal
  // No contexto padrão do app, se tiver 3 casas após o ponto no final (ex: "1.000" ou "15.000"),
  // mas se o utilizador digitou "10.5", tratamos como decimal.
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2) {
      // múltiplos pontos -> são milhares: "1.000.000"
      const num = parseFloat(str.replace(/\./g, ''));
      return isNaN(num) ? 0 : num;
    }
    // Apenas um ponto: se a última parte tiver exatamente 3 dígitos e for número grande,
    // ou se o utilizador colou formato internacional.
    // Para consistência com separador decimal por vírgula:
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata um número ou string numérica para o formato:
 * Milhares com PONTO (.) e decimais com VÍRGULA (,) com até 3 casas decimais.
 * Exemplo: 1250.5 -> "1.250,500" (ou "1.250,5" se maxDecimals = 3 sem padding forçado)
 */
export function formatPtNumber(
  val: number | string | null | undefined,
  maxDecimals: number = 3,
  padDecimals: boolean = false
): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFormattedNumber(val);
  if (isNaN(num)) return '';

  if (padDecimals) {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: maxDecimals,
      maximumFractionDigits: maxDecimals
    }).format(num);
  }

  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  }).format(num);
}

/**
 * Formata a digitação ao vivo do utilizador, aceitando dígitos, ponto e vírgula,
 * garantindo separador de milhares com ponto (.) e até 3 casas decimais com vírgula (,).
 */
export function formatLiveInput(input: string, maxDecimals: number = 3): string {
  if (!input) return '';

  // Substituir eventuais múltiplos pontos ou vírgulas
  // Se o utilizador digitou '.', mas não digitou ',', permitimos que o ponto seja convertido para vírgula se for decimal
  // ou preservamos digitação amigável.
  
  // Limpar caracteres não numéricos exceto '.' e ','
  let clean = input.replace(/[^\d.,]/g, '');
  if (!clean) return '';

  // Determinar se há parte decimal
  let decimalSeparator = '';
  let integerPart = '';
  let decimalPart = '';

  if (clean.includes(',')) {
    const parts = clean.split(',');
    integerPart = parts[0].replace(/\./g, '');
    decimalSeparator = ',';
    decimalPart = parts.slice(1).join('').replace(/[.,]/g, '').slice(0, maxDecimals);
  } else if (clean.includes('.')) {
    // Se o utilizador digitou '.', converter para ',' como separador decimal se vier no final,
    // a menos que seja um ponto de milhar completo.
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length <= maxDecimals) {
      integerPart = parts[0];
      decimalSeparator = ',';
      decimalPart = parts[1].slice(0, maxDecimals);
    } else {
      // múltiplos pontos ou milhares
      integerPart = clean.replace(/\./g, '');
    }
  } else {
    integerPart = clean;
  }

  // Formatar a parte inteira com pontos de milhar
  const intNumber = parseInt(integerPart, 10);
  const formattedInt = isNaN(intNumber)
    ? ''
    : new Intl.NumberFormat('pt-PT', { useGrouping: true }).format(intNumber);

  if (decimalSeparator) {
    return `${formattedInt || '0'},${decimalPart}`;
  }

  return formattedInt;
}

/**
 * Formata moeda com 3 casas decimais e separadores portugueses (1.250,500 Kz)
 */
export function formatMoneyPt(val: number, currency: string = 'Kz'): string {
  return (
    new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(val) + ` ${currency}`
  );
}
