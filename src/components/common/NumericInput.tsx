import React, { useState, useEffect } from 'react';
import { parseFormattedNumber, formatLiveInput, formatPtNumber } from '../../utils/numberFormat';

interface NumericInputProps {
  id?: string;
  value: string | number;
  onChange: (value: string, formatted?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDecimals?: number;
  padDecimalsOnBlur?: boolean;
  min?: number;
  max?: number;
  hasError?: boolean;
  autoFocus?: boolean;
  name?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  maxDecimals = 3,
  padDecimalsOnBlur = false,
  min,
  max,
  hasError = false,
  autoFocus = false,
  name
}) => {
  // Mantém representação visual amigável no input
  const [displayValue, setDisplayValue] = useState<string>('');

  // Sincronizar quando o valor externo mudar
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('');
      return;
    }
    const strVal = String(value);
    // Se já tiver formato português com vírgula ou já estiver formatado
    if (strVal.includes(',') || strVal.includes('.')) {
      setDisplayValue(strVal);
    } else {
      const num = parseFormattedNumber(strVal);
      if (num === 0 && strVal !== '0') {
        setDisplayValue(strVal);
      } else {
        setDisplayValue(formatPtNumber(num, maxDecimals, false));
      }
    }
  }, [value, maxDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      setDisplayValue('');
      onChange('');
      return;
    }

    // Permite digitação com dígitos, ponto de milhar e vírgula decimal
    const formatted = formatLiveInput(raw, maxDecimals);
    setDisplayValue(formatted);
    onChange(formatted, formatted);
  };

  const handleBlur = () => {
    if (!displayValue.trim()) return;
    const num = parseFormattedNumber(displayValue);
    if (isNaN(num)) return;

    if (min !== undefined && num < min) {
      const formattedMin = formatPtNumber(min, maxDecimals, padDecimalsOnBlur);
      setDisplayValue(formattedMin);
      onChange(formattedMin, formattedMin);
      return;
    }

    if (max !== undefined && num > max) {
      const formattedMax = formatPtNumber(max, maxDecimals, padDecimalsOnBlur);
      setDisplayValue(formattedMax);
      onChange(formattedMax, formattedMax);
      return;
    }

    if (padDecimalsOnBlur) {
      const formatted = formatPtNumber(num, maxDecimals, true);
      setDisplayValue(formatted);
      onChange(formatted, formatted);
    }
  };

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck="false"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`${className} ${
        hasError
          ? 'border-rose-500 bg-rose-950/20 text-rose-100 ring-2 ring-rose-500/20'
          : ''
      }`}
    />
  );
};
