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
  /** Límite semanal de jornada en horas: 48 hoy; 40 al concluir la reforma. */
  weeklyLimitHours: number;
  /** Minutos de tolerancia antes de marcar retardo. */
  lateToleranceMinutes: number;
  /** Minutos mínimos de tiempo extra para considerarlo (evita centavos por segundos). */
  overtimeMinimumMinutes: number;
  /** Checadas del mismo empleado separadas por menos de esto se consideran duplicadas. */
  duplicateWindowMinutes: number;
  /** Minutos semanales de tiempo extra pagados al doble antes de pasar a triple (art. 68: 9 h). */
  overtimeDoubleCapMinutes: number;
  /** Tope diario de tiempo extra (art. 66: 3 h). */
  overtimeDailyMaxMinutes: number;
  /** Días por semana en que se permite tiempo extra (art. 66: 3 veces). */
  overtimeMaxDaysPerWeek: number;
}

export const DEFAULT_POLICY: Policy = {
  timeZone: "America/Mexico_City",
  weeklyLimitHours: 48,
  lateToleranceMinutes: 10,
  overtimeMinimumMinutes: 30,
  duplicateWindowMinutes: 2,
  overtimeDoubleCapMinutes: 9 * 60,
  overtimeDailyMaxMinutes: 3 * 60,
  overtimeMaxDaysPerWeek: 3,
};

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
  | "OVERTIME_DAILY_OVER_3H"
  | "OVERTIME_MORE_THAN_3_DAYS"
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
  /** Primeras 9 h semanales de tiempo extra: pago al 200% (art. 67). */
  overtimeDoubleMinutes: number;
  /** Excedente de 9 h semanales: pago al 300% (art. 68). */
  overtimeTripleMinutes: number;
  alerts: ComplianceAlert[];
}
