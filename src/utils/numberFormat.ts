/**
 * Utilitários de Formatação Numérica Fiscal Portuguesa / Angolana
 * Separador de milhares: Ponto (.)
 * Separador decimal: Vírgula (,) com suporte total a casas decimais
 */

/**
 * Converte qualquer valor inserido (com pontos de milhar, espaços ou vírgula/ponto decimal) num número JavaScript nativo.
 * Exemplos:
 * "1.250,500" -> 1250.5
 * "1.250,50" -> 1250.5
 * "10.500" -> 10500
 * "1 000" -> 1000
 * "1.000" -> 1000
 * "10.000" -> 10000
 * "100.000" -> 100000
 * "1.000.000" -> 1000000
 * "12,75" -> 12.75
 * "12.75" -> 12.75
 * "1,5" -> 1.5
 * "1.5" -> 1.5
 * "0,5" -> 0.5
 * "0.5" -> 0.5
 * "0,05" -> 0.05
 * "1500.50" -> 1500.5
 */
export function parseFormattedNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  if (!str) return 0;

  // Remover símbolos de moeda, porcentagem ou textos (ex: " Kz", " €", "$", "%")
  str = str.replace(/[^\d.,+\-\s\u00A0\u202F]/g, '').trim();

  // Remover todos os tipos de espaços de milhar
  str = str.replace(/[\s\u00A0\u202F]/g, '');

  if (!str) return 0;

  // Se contiver tanto ponto como vírgula:
  // ex: "1.250.000,50" ou "1,250,000.50"
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

  // Se contiver apenas vírgula: "1250,50" ou "1,5" ou "0,05" ou "1,000,000"
  if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length > 2) {
      // Múltiplas vírgulas -> milhares formato internacional
      str = str.replace(/,/g, '');
    } else {
      // Vírgula única -> separador decimal padrão PT/AO
      str = str.replace(',', '.');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Se contiver apenas ponto:
  // Pode ser separador de milhares ("1.000", "10.000", "100.000", "1.000.000")
  // ou decimal internacional ("10.5", "12.75", "0.50", "1.5", "0.05")
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2) {
      // Múltiplos pontos -> são milhares: "1.000.000"
      str = str.replace(/\./g, '');
    } else {
      // Ponto único:
      // Se tiver exatamente 3 dígitos após o ponto, parte inteira >= 1, e primeira parte for de 1 a 3 dígitos (ex: "1.000", "15.000", "250.000"):
      // Tratamos como milhar em conformidade com o formato contábil PT/AO
      if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3 && parts[0] !== '0') {
        str = parts[0] + parts[1];
      } else {
        // Ex: "0.500", "10.5", "25.75", "1.2", "1.5", "0.05", "1500.5" -> número decimal
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
 * Milhares com PONTO (.) e decimais com VÍRGULA (,) com até maxDecimals casas decimais.
 * Exemplo: 1250.5 -> "1.250,5"
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
 * permitindo introdução livre de casas decimais (quer através de vírgula ou ponto).
 */
export function formatLiveInput(input: string, maxDecimals: number = 3): string {
  if (!input) return '';

  // Limpar caracteres não numéricos exceto '.', ',' e '-'
  let clean = input.replace(/[^\d.,\-]/g, '');
  if (!clean) return '';

  const isNegative = clean.startsWith('-');
  if (isNegative) {
    clean = clean.replace(/-/g, '');
  }

  // Se o utilizador começou a digitar diretamente com separador decimal: '.' ou ','
  if (clean === '.' || clean === ',') {
    return (isNegative ? '-' : '') + '0,';
  }

  let integerPart = '';
  let decimalPart = '';
  let hasDecimal = false;

  if (clean.includes(',')) {
    // A última vírgula define o início da parte decimal
    const lastComma = clean.lastIndexOf(',');
    integerPart = clean.slice(0, lastComma).replace(/\./g, '');
    decimalPart = clean.slice(lastComma + 1).replace(/[.,]/g, '').slice(0, maxDecimals);
    hasDecimal = true;
  } else if (clean.includes('.')) {
    // Se terminar com ponto (ex: "14." ou "1.500."): o utilizador acabou de carregar em ponto decimal!
    if (clean.endsWith('.')) {
      integerPart = clean.slice(0, -1).replace(/\./g, '');
      decimalPart = '';
      hasDecimal = true;
    } else {
      const parts = clean.split('.');
      if (parts.length > 2) {
        // Múltiplos pontos no meio: formato de milhares contábeis (ex: "1.000.000")
        integerPart = clean.replace(/\./g, '');
        hasDecimal = false;
      } else {
        // Ponto único no meio:
        // Se a parte após o ponto tiver exatamente 3 dígitos e a parte inteira tiver 1-3 dígitos (ex: "1.500"):
        // Trata como milhar existente
        if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3 && parts[0] !== '0') {
          integerPart = parts[0] + parts[1];
          hasDecimal = false;
        } else {
          // Ex: "14.5", "0.05", "1500.5", "1.2", "1.25" -> é decimal digitado com ponto
          integerPart = parts[0];
          decimalPart = parts[1].replace(/[.,]/g, '').slice(0, maxDecimals);
          hasDecimal = true;
        }
      }
    }
  } else {
    integerPart = clean;
    hasDecimal = false;
  }

  // Formatar parte inteira com pontos de milhar
  let formattedInt = '';
  if (integerPart === '' || integerPart === '0') {
    formattedInt = integerPart === '0' || hasDecimal ? '0' : '';
  } else {
    const intNumber = parseInt(integerPart, 10);
    formattedInt = isNaN(intNumber)
      ? ''
      : new Intl.NumberFormat('de-DE', { useGrouping: true }).format(intNumber);
  }

  const prefix = isNegative ? '-' : '';

  if (hasDecimal) {
    return `${prefix}${formattedInt || '0'},${decimalPart}`;
  }

  return `${prefix}${formattedInt}`;
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
