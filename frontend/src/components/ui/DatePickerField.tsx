import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { getZodiacSign } from '../../utils/genealogy';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD or ''
  onChange: (val: string) => void;
  required?: boolean;
  showZodiac?: boolean;
  minYear?: number;
  maxYear?: number;
  helperText?: string;
  accentColor?: 'emerald' | 'purple';
}

const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  showZodiac = false,
  minYear = 1880,
  maxYear = new Date().getFullYear(),
  helperText,
  accentColor = 'emerald',
}) => {
  // Descomponer valor actual YYYY-MM-DD
  const { year, month, day } = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return { year: '', month: '', day: '' };
    }
    const parts = value.split('-');
    return {
      year: parts[0] || '',
      month: parts[1] || '',
      day: parts[2] || '',
    };
  }, [value]);

  // Lista de años descendente (ej. 2026, 2025 ... 1880)
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Días máximos del mes seleccionado
  const maxDays = useMemo(() => {
    if (!month) return 31;
    const m = parseInt(month, 10);
    const y = parseInt(year || '2000', 10);
    if (m === 2) {
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return isLeap ? 29 : 28;
    }
    if ([4, 6, 9, 11].includes(m)) return 30;
    return 31;
  }, [year, month]);

  const days = useMemo(() => {
    const list: string[] = [];
    for (let d = 1; d <= maxDays; d++) {
      list.push(String(d).padStart(2, '0'));
    }
    return list;
  }, [maxDays]);

  const handleYearChange = (newYear: string) => {
    if (!newYear && !month && !day) {
      onChange('');
      return;
    }
    const m = month || '01';
    const d = day || '01';
    onChange(`${newYear}-${m}-${d}`);
  };

  const handleMonthChange = (newMonth: string) => {
    if (!newMonth && !year && !day) {
      onChange('');
      return;
    }
    const y = year || String(maxYear);
    let d = day || '01';
    // Ajustar si el día excede el nuevo mes
    const mNum = parseInt(newMonth, 10);
    if (mNum === 2 && parseInt(d, 10) > 28) d = '28';
    if ([4, 6, 9, 11].includes(mNum) && parseInt(d, 10) > 30) d = '30';
    onChange(`${y}-${newMonth}-${d}`);
  };

  const handleDayChange = (newDay: string) => {
    if (!newDay && !year && !month) {
      onChange('');
      return;
    }
    const y = year || String(maxYear);
    const m = month || '01';
    onChange(`${y}-${m}-${newDay}`);
  };

  const handleClear = () => {
    onChange('');
  };

  const zodiac = showZodiac && value ? getZodiacSign(value) : null;

  const focusBorder = accentColor === 'purple' ? 'focus:border-purple-400' : 'focus:border-emerald-500';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <CalendarIcon className={`w-3.5 h-3.5 ${accentColor === 'purple' ? 'text-purple-400' : 'text-emerald-400'}`} />
          <span>{label}</span>
          {required && <span className="text-emerald-400">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
          >
            Limpiar fecha
          </button>
        )}
      </div>

      {/* Selectores de Día, Mes y Año */}
      <div className="grid grid-cols-3 gap-2">
        {/* Día */}
        <div>
          <select
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            className={`w-full bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 ${focusBorder} focus:outline-none transition-colors`}
          >
            <option value="">Día</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {parseInt(d, 10)}
              </option>
            ))}
          </select>
        </div>

        {/* Mes */}
        <div>
          <select
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={`w-full bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 ${focusBorder} focus:outline-none transition-colors truncate`}
          >
            <option value="">Mes</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className={`w-full bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 ${focusBorder} focus:outline-none font-mono transition-colors`}
          >
            <option value="">Año</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de Signo Zodiacal / Vista previa */}
      {zodiac && (
        <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-in fade-in duration-200 shadow-sm">
          <span className="text-base">{zodiac.symbol}</span>
          <span>Signo Zodiacal: <strong className="text-amber-200">{zodiac.name}</strong></span>
          <span className="text-[10px] text-amber-400/80">({zodiac.dates})</span>
        </div>
      )}

      {helperText && !zodiac && (
        <p className="text-[10px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
