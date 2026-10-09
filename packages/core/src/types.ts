/** Checada cruda proveniente de un dispositivo (Hikvision u otro). */
export interface Punch {
  employeeId: string;
  /** Instante de la checada (ISO 8601 con offset, p. ej. "2026-10-05T09:03:00-06:00"). */
  timestamp: string;
  deviceId?: string;
  /** Modo de verificación reportado por el equipo (face, fp, card...). */
  verifyMode?: string;
}

/** Tipo de jornada según LFT art. 60. */
export type ShiftKind = "diurna" | "nocturna" | "mixta";

/** Horario asignado a un empleado para un día. Horas en formato "HH:MM" local. */
export interface Shift {
  kind: ShiftKind;
  start: string;
  end: string;
  /** Minutos de descanso/comida NO computados como jornada (art. 63-64). */
  unpaidBreakMinutes?: number;
}

export interface Policy {
  /** Zona horaria IANA del centro de trabajo. */
  timeZone: string;
  /** Jornada ordinaria máxima semanal (art. 59 y transitorio 2º, DOF 01-05-2026). */
  weeklyLimitHours: number;
  /** Minutos de tolerancia antes de marcar retardo. */
  lateToleranceMinutes: number;
  /** Minutos mínimos de tiempo extra para considerarlo (evita centavos por segundos). */
  overtimeMinimumMinutes: number;
  /** Checadas del mismo empleado separadas por menos de esto se consideran duplicadas. */
  duplicateWindowMinutes: number;
  /** Tiempo extra semanal pagado al doble (art. 66 y transitorio 4º: 9 h en 2026 → 12 h en 2030). */
  overtimeDoubleCapMinutes: number;
  /** Excedente semanal permitido sobre el art. 66, pagado al triple (art. 68: 4 h). */
  overtimeTripleCapMinutes: number;
  /** Tope diario de tiempo extra (art. 66: 4 h). */
  overtimeDailyMaxMinutes: number;
  /** Días por semana con tiempo extra (art. 66: máximo 4). */
  overtimeMaxDaysPerWeek: number;
  /** Suma de jornada ordinaria y extraordinaria por día (art. 68: 12 h). */
  dailyTotalMaxMinutes: number;
}

/**
 * Reducción gradual de jornada, DOF 01-05-2026, transitorios 2º y 4º.
 * Cada valor rige a partir del 1 de enero del año indicado.
 */
export const LFT_GRADUAL_SCHEDULE: Record<number, { weeklyHours: number; overtimeDoubleHours: number }> = {
  2026: { weeklyHours: 48, overtimeDoubleHours: 9 },
  2027: { weeklyHours: 46, overtimeDoubleHours: 9 },
  2028: { weeklyHours: 44, overtimeDoubleHours: 10 },
  2029: { weeklyHours: 42, overtimeDoubleHours: 11 },
  2030: { weeklyHours: 40, overtimeDoubleHours: 12 },
};

/** Política con los topes legales vigentes en la fecha dada ("YYYY-MM-DD"). */
export function lftPolicy(date: string, overrides: Partial<Policy> = {}): Policy {
  const year = Math.min(Math.max(Number(date.slice(0, 4)), 2026), 2030);
  const step = LFT_GRADUAL_SCHEDULE[year];
  return {
    timeZone: "America/Mexico_City",
    lateToleranceMinutes: 10,
    overtimeMinimumMinutes: 30,
    duplicateWindowMinutes: 2,
    weeklyLimitHours: step.weeklyHours,
    overtimeDoubleCapMinutes: step.overtimeDoubleHours * 60,
    overtimeTripleCapMinutes: 4 * 60,
    overtimeDailyMaxMinutes: 4 * 60,
    overtimeMaxDaysPerWeek: 4,
    dailyTotalMaxMinutes: 12 * 60,
    ...overrides,
  };
}

export const DEFAULT_POLICY: Policy = lftPolicy("2026-01-01");

export interface DayResult {
  employeeId: string;
  /** Fecha local "YYYY-MM-DD". */
  date: string;
  firstIn?: string;
  lastOut?: string;
  workedMinutes: number;
  scheduledMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  /** Minutos laborados en día de descanso (art. 73: pago adicional al doble). */
  restDayWorkedMinutes: number;
  absent: boolean;
  /** Número impar de checadas o checada única: requiere revisión. */
  incomplete: boolean;
}

export type ComplianceCode =
  | "OVERTIME_DAILY_MAX_EXCEEDED"
  | "OVERTIME_TOO_MANY_DAYS"
  | "OVERTIME_WEEKLY_MAX_EXCEEDED"
  | "DAILY_TOTAL_OVER_12H"
  | "WEEKLY_LIMIT_EXCEEDED"
  | "NO_WEEKLY_REST_DAY";

export interface ComplianceAlert {
  code: ComplianceCode;
  article: string;
  message: string;
  date?: string;
}

export interface WeekResult {
  employeeId: string;
  days: DayResult[];
  workedMinutes: number;
  overtimeMinutes: number;
  /** Tiempo extra hasta el tope del año: se paga 100% más (art. 66). */
  overtimeDoubleMinutes: number;
  /** Excedente sobre el tope del art. 66: se paga 200% más (art. 68). */
  overtimeTripleMinutes: number;
  alerts: ComplianceAlert[];
}
