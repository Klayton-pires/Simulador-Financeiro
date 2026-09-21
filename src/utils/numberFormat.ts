/**
 * Utilitários de Formatação Numérica Fiscal Portuguesa / Angolana
 * Separador de milhares: Ponto (.)
 * Separador decimal: Vírgula (,) com até 3 casas decimais
 */

/**
 * Converte qualquer valor inserido (com pontos de milhar, espaços ou vírgula decimal) num número JavaScript nativo.
 * Exemplos:
 * "1.250,500" -> 1250.5
 * "10.500" -> 10500
 * "1 000" -> 1000
 * "1.000" -> 1000
 * "10.000" -> 10000
 * "100.000" -> 100000
 * "1.000.000" -> 1000000
 * "12,75" -> 12.75
 * "1500.50" -> 1500.5
 */
export function parseFormattedNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  if (!str) return 0;

  // Remover símbolos de moeda ou textos (ex: " Kz", " €", "$")
  str = str.replace(/[^\d.,+\-\s\u00A0\u202F]/g, '').trim();

  // Remover todos os tipos de espaços de milhar (espaço normal, nbsp, narrow nbsp)
  str = str.replace(/[\s\u00A0\u202F]/g, '');

  if (!str) return 0;

  // Se contiver tanto ponto como vírgula:
  // ex: "1.250.000,50" -> o último separador determina o decimal
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Formato PT/AO: "1.250.000,50" -> pontos são milhares, vírgula é decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato Internacional: "1,250,000.50" -> vírgulas são milhares, ponto é decimal
      str = str.replace(/,/g, '');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Se contiver apenas vírgula: "1250,500" ou "1,000,000"
  if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length > 2) {
      // Múltiplas vírgulas -> milhares formato internacional
      str = str.replace(/,/g, '');
    } else {
      // Vírgula única -> separador decimal padrão
      str = str.replace(',', '.');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Se contiver apenas ponto:
  // Pode ser separador de milhares ("1.000", "10.000", "100.000", "1.000.000")
  // ou decimal internacional ("10.5", "12.75", "0.50")
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2) {
      // Múltiplos pontos -> são milhares: "1.000.000"
      str = str.replace(/\./g, '');
    } else {
      // Ponto único:
      // Se tiver exatamente 3 dígitos após o ponto e parte inteira não nula ("1.000", "15.000", "250.000"),
      // tratamos como milhar em conformidade com o formato contábil PT/AO:
      if (parts[1].length === 3 && parts[0].length >= 1 && parts[0] !== '0') {
        str = parts[0] + parts[1];
      } else {
        // Ex: "0.500", "10.5", "25.75" -> número decimal
      }
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata um número ou string numérica para o formato contábil:
 * Milhares com PONTO (.) e decimais com VÍRGULA (,) com até 3 casas decimais.
 * Exemplo: 1250.5 -> "1.250,500" (ou "1.250,5" se padDecimals = false)
 */
export function formatPtNumber(
  val: number | string | null | undefined,
  maxDecimals: number = 3,
  padDecimals: boolean = false
): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFormattedNumber(val);
  if (isNaN(num)) return '';

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: padDecimals ? maxDecimals : 0,
    maximumFractionDigits: maxDecimals
  }).format(num);
}

/**
 * Formata a digitação amigável do utilizador, aceitando dígitos, ponto e vírgula,
 * mantendo o separador decimal consistente com vírgula (,).
 */
export function formatLiveInput(input: string, maxDecimals: number = 3): string {
  if (!input) return '';

  // Limpar caracteres não numéricos exceto '.', ',' e '-'
  let clean = input.replace(/[^\d.,\-]/g, '');
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
    const parts = clean.split('.');
    // Se digitou ponto num número curto com até maxDecimals casas, aceitar como separador decimal
    if (parts.length === 2 && parts[1].length <= maxDecimals && parts[0].length <= 3) {
      integerPart = parts[0];
      decimalSeparator = ',';
      decimalPart = parts[1].slice(0, maxDecimals);
    } else {
      integerPart = clean.replace(/\./g, '');
    }
  } else {
    integerPart = clean;
  }

  const intNumber = parseInt(integerPart, 10);
  const formattedInt = isNaN(intNumber)
    ? ''
    : new Intl.NumberFormat('de-DE', { useGrouping: true }).format(intNumber);

  if (decimalSeparator) {
    return `${formattedInt || '0'},${decimalPart}`;
  }

  return formattedInt;
}

/**
 * Formata moeda com 3 casas decimais e separadores (ex: 1.250,500 Kz)
 */
export function formatMoneyPt(val: number, currency: string = 'Kz'): string {
  return (
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(val) + ` ${currency}`
  );
}
