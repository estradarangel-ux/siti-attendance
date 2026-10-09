import { addDays, hhmmToMinutes, toLocal } from "./time.ts";
import type { ComplianceAlert, DayResult, Policy, Punch, Shift, WeekResult } from "./types.ts";

/** Programación de un día: `shift` nulo = día de descanso. */
export interface ScheduledDay {
  date: string;
  shift: Shift | null;
}

/** Margen antes de la entrada y después de la salida para asignar checadas a un turno. */
const WINDOW_BEFORE_MIN = 4 * 60;
const WINDOW_AFTER_MIN = 8 * 60;

const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

/** Minuto absoluto (en hora local) de una checada, comparable entre días. */
function absMinutes(timestamp: string, timeZone: string): number {
  const { date, minutes } = toLocal(timestamp, timeZone);
  return dayNumber(date) * 1440 + minutes;
}

function shiftBounds(date: string, shift: Shift): { start: number; end: number } {
  const base = dayNumber(date) * 1440;
  const start = base + hhmmToMinutes(shift.start);
  let end = base + hhmmToMinutes(shift.end);
  if (end <= start) end += 1440; // turno que cruza la medianoche
  return { start, end };
}

/** Elimina checadas repetidas (el empleado pasa dos veces seguidas por el lector). */
export function dedupe(times: number[], windowMinutes: number): number[] {
  const sorted = [...times].sort((a, b) => a - b);
  const out: number[] = [];
  for (const t of sorted) {
    if (out.length === 0 || t - out[out.length - 1] >= windowMinutes) out.push(t);
  }
  return out;
}

function fmt(abs: number): string {
  const day = Math.floor(abs / 1440);
  const m = Math.round(abs - day * 1440);
  const date = new Date(day * 86_400_000).toISOString().slice(0, 10);
  return `${date}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function computeDay(
  employeeId: string,
  day: ScheduledDay,
  times: number[],
  policy: Policy,
): DayResult {
  const punches = dedupe(times, policy.duplicateWindowMinutes);
  const incomplete = punches.length % 2 === 1;

  let worked = 0;
  for (let i = 0; i + 1 < punches.length; i += 2) worked += punches[i + 1] - punches[i];

  const result: DayResult = {
    employeeId,
    date: day.date,
    firstIn: punches.length ? fmt(punches[0]) : undefined,
    lastOut: punches.length > 1 ? fmt(punches[punches.length - 1]) : undefined,
    workedMinutes: 0,
    scheduledMinutes: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    overtimeMinutes: 0,
    restDayWorkedMinutes: 0,
    absent: false,
    incomplete,
  };

  if (!day.shift) {
    result.workedMinutes = Math.round(worked);
    result.restDayWorkedMinutes = result.workedMinutes;
    return result;
  }

  const { start, end } = shiftBounds(day.date, day.shift);
  const breakMin = day.shift.unpaidBreakMinutes ?? 0;
  result.scheduledMinutes = end - start - breakMin;

  if (punches.length === 0) {
    result.absent = true;
    return result;
  }

  // Con una sola pareja entrada/salida, el descanso no se checó: se descuenta el pactado.
  if (punches.length === 2) worked = Math.max(0, worked - breakMin);
  result.workedMinutes = Math.round(worked);

  const late = punches[0] - start;
  if (late > policy.lateToleranceMinutes) result.lateMinutes = Math.round(late);

  if (punches.length > 1) {
    const early = end - punches[punches.length - 1];
    if (early > 0) result.earlyLeaveMinutes = Math.round(early);
  }

  const extra = result.workedMinutes - result.scheduledMinutes;
  if (extra >= policy.overtimeMinimumMinutes) result.overtimeMinutes = extra;

  return result;
}

/**
 * Calcula una semana laboral (7 días consecutivos) para un empleado:
 * asigna checadas a turnos, calcula cada día y aplica las reglas semanales de la LFT.
 */
export function computeWeek(
  employeeId: string,
  week: ScheduledDay[],
  punches: Punch[],
  policy: Policy,
): WeekResult {
  const own = punches
    .filter((p) => p.employeeId === employeeId)
    .map((p) => absMinutes(p.timestamp, policy.timeZone));

  const buckets = new Map<string, number[]>(week.map((d) => [d.date, []]));
  for (const t of own) {
    const target = assignToDay(t, week);
    if (target) buckets.get(target)!.push(t);
  }

  const days = week.map((d) => computeDay(employeeId, d, buckets.get(d.date)!, policy));

  const workedMinutes = days.reduce((s, d) => s + d.workedMinutes, 0);
  const dailyOvertime = days.reduce((s, d) => s + d.overtimeMinutes, 0);
  // Para el límite semanal se ignoran los minutos sueltos bajo el mínimo de tiempo extra
  // (llegar 2 min antes cada día no debe generar horas extra).
  const effectiveMinutes = days.reduce((s, d) => s + effective(d), 0);
  const weeklyExcess = Math.max(0, effectiveMinutes - policy.weeklyLimitHours * 60);
  const overtimeMinutes = Math.max(dailyOvertime, weeklyExcess);
  const overtimeDoubleMinutes = Math.min(overtimeMinutes, policy.overtimeDoubleCapMinutes);

  return {
    employeeId,
    days,
    workedMinutes,
    overtimeMinutes,
    overtimeDoubleMinutes,
    overtimeTripleMinutes: overtimeMinutes - overtimeDoubleMinutes,
    alerts: complianceAlerts(days, effectiveMinutes, overtimeMinutes, policy),
  };
}

function effective(d: DayResult): number {
  if (d.scheduledMinutes === 0) return d.workedMinutes;
  return Math.min(d.workedMinutes, d.scheduledMinutes) + d.overtimeMinutes;
}

function assignToDay(t: number, week: ScheduledDay[]): string | undefined {
  // Primero: la ventana del turno programado (soporta turnos nocturnos).
  for (const d of week) {
    if (!d.shift) continue;
    const { start, end } = shiftBounds(d.date, d.shift);
    if (t >= start - WINDOW_BEFORE_MIN && t <= end + WINDOW_AFTER_MIN) return d.date;
  }
  // Si no cae en ningún turno, se asigna a su fecha calendario (p. ej. día de descanso).
  const date = addDays("1970-01-01", Math.floor(t / 1440));
  return week.some((d) => d.date === date) ? date : undefined;
}

function complianceAlerts(
  days: DayResult[],
  effectiveMinutes: number,
  overtimeMinutes: number,
  policy: Policy,
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];
  const h = (m: number) => (m / 60).toFixed(1);
  const overtimeDays = days.filter((d) => d.overtimeMinutes > 0);

  for (const d of overtimeDays) {
    if (d.overtimeMinutes > policy.overtimeDailyMaxMinutes) {
      alerts.push({
        code: "OVERTIME_DAILY_MAX_EXCEEDED",
        article: "LFT art. 66",
        date: d.date,
        message: `Tiempo extra de ${h(d.overtimeMinutes)} h excede el tope diario de ${h(policy.overtimeDailyMaxMinutes)} h.`,
      });
    }
  }
  for (const d of days) {
    if (d.workedMinutes > policy.dailyTotalMaxMinutes) {
      alerts.push({
        code: "DAILY_TOTAL_OVER_12H",
        article: "LFT art. 68",
        date: d.date,
        message: `Jornada total de ${h(d.workedMinutes)} h supera el máximo de ${h(policy.dailyTotalMaxMinutes)} h diarias.`,
      });
    }
  }
  if (overtimeDays.length > policy.overtimeMaxDaysPerWeek) {
    alerts.push({
      code: "OVERTIME_TOO_MANY_DAYS",
      article: "LFT art. 66",
      message: `Tiempo extra en ${overtimeDays.length} días de la semana (máximo ${policy.overtimeMaxDaysPerWeek}).`,
    });
  }
  const overtimeMax = policy.overtimeDoubleCapMinutes + policy.overtimeTripleCapMinutes;
  if (overtimeMinutes > overtimeMax) {
    alerts.push({
      code: "OVERTIME_WEEKLY_MAX_EXCEEDED",
      article: "LFT arts. 66 y 68",
      message: `Tiempo extra semanal de ${h(overtimeMinutes)} h supera el máximo permitido de ${h(overtimeMax)} h.`,
    });
  }
  if (effectiveMinutes > policy.weeklyLimitHours * 60) {
    alerts.push({
      code: "WEEKLY_LIMIT_EXCEEDED",
      article: "LFT art. 59 y transitorio 2º",
      message: `Jornada semanal de ${h(effectiveMinutes)} h supera la jornada máxima de ${policy.weeklyLimitHours} h.`,
    });
  }
  if (days.length === 7 && days.every((d) => d.workedMinutes > 0)) {
    alerts.push({
      code: "NO_WEEKLY_REST_DAY",
      article: "LFT art. 69",
      message: "La persona trabajadora laboró los 7 días: falta el día de descanso semanal.",
    });
  }
  return alerts;
}
