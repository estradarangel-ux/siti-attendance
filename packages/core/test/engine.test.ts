import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWeek, DEFAULT_POLICY, lftPolicy, type Punch, type ScheduledDay, type Shift } from "../src/index.ts";

const office: Shift = { kind: "diurna", start: "09:00", end: "18:00", unpaidBreakMinutes: 60 };
const night: Shift = { kind: "nocturna", start: "22:00", end: "05:00" };

/** Semana lun 2026-10-05 .. dom 2026-10-11; `restDays` sin turno. */
function week(shift: Shift, restDays = [6]): ScheduledDay[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: `2026-10-${String(5 + i).padStart(2, "0")}`,
    shift: restDays.includes(i) ? null : shift,
  }));
}

const p = (ts: string, employeeId = "E1"): Punch => ({ employeeId, timestamp: `${ts}-06:00` });

function inOut(day: string, inT: string, outT: string): Punch[] {
  return [p(`2026-10-${day}T${inT}:00`), p(`2026-10-${day}T${outT}:00`)];
}

test("jornada normal sin incidencias", () => {
  const punches = ["05", "06", "07", "08", "09", "10"].flatMap((d) => inOut(d, "08:58", "18:02"));
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  assert.equal(r.days[0].workedMinutes, 8 * 60 + 4);
  assert.equal(r.days[0].lateMinutes, 0);
  assert.equal(r.overtimeMinutes, 0);
  assert.deepEqual(r.alerts, []);
  assert.equal(r.days[6].absent, false); // domingo = descanso, no falta
});

test("retardo fuera de tolerancia y falta", () => {
  const punches = inOut("05", "09:25", "18:00");
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  assert.equal(r.days[0].lateMinutes, 25);
  assert.equal(r.days[1].absent, true);
});

test("checadas duplicadas se ignoran y checada única queda incompleta", () => {
  const punches = [p("2026-10-05T09:00:00"), p("2026-10-05T09:00:40"), p("2026-10-05T18:00:00"), p("2026-10-06T09:00:00")];
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  assert.equal(r.days[0].incomplete, false);
  assert.equal(r.days[0].workedMinutes, 8 * 60);
  assert.equal(r.days[1].incomplete, true);
});

test("tiempo extra 2026: dobles hasta 9 h, triples después; 4 días x 3 h es legal", () => {
  // 4 días saliendo a las 21:00 => 3 h extra diarias = 12 h extra.
  const punches = ["05", "06", "07", "08"].flatMap((d) => inOut(d, "09:00", "21:00"));
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  assert.equal(r.overtimeMinutes, 12 * 60);
  assert.equal(r.overtimeDoubleMinutes, 9 * 60);
  assert.equal(r.overtimeTripleMinutes, 3 * 60);
  assert.deepEqual(r.alerts, []);
});

test("alertas arts. 66 y 68: más de 4 h diarias, más de 4 días y más de 12 h totales", () => {
  // 5 días saliendo a las 23:00 => 5 h extra diarias (13 h trabajadas) = 25 h extra.
  const punches = ["05", "06", "07", "08", "09"].flatMap((d) => inOut(d, "09:00", "23:00"));
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  const codes = new Set(r.alerts.map((a) => a.code));
  for (const c of [
    "OVERTIME_DAILY_MAX_EXCEEDED",
    "DAILY_TOTAL_OVER_12H",
    "OVERTIME_TOO_MANY_DAYS",
    "OVERTIME_WEEKLY_MAX_EXCEEDED",
  ] as const) assert.ok(codes.has(c), c);
});

test("calendario gradual de la reforma (transitorios 2º y 4º)", () => {
  assert.equal(lftPolicy("2026-10-09").weeklyLimitHours, 48);
  assert.equal(lftPolicy("2027-03-01").weeklyLimitHours, 46);
  assert.equal(lftPolicy("2028-01-01").overtimeDoubleCapMinutes, 10 * 60);
  assert.equal(lftPolicy("2030-06-01").weeklyLimitHours, 40);
  assert.equal(lftPolicy("2035-06-01").overtimeDoubleCapMinutes, 12 * 60);
});

test("jornada de 40 h (2030) genera tiempo extra aunque no haya excedente diario", () => {
  const policy = lftPolicy("2030-01-07");
  const punches = ["05", "06", "07", "08", "09", "10"].flatMap((d) => inOut(d, "09:00", "18:00"));
  const r = computeWeek("E1", week(office), punches, policy);
  assert.equal(r.workedMinutes, 48 * 60);
  assert.equal(r.overtimeMinutes, 8 * 60);
  assert.ok(r.alerts.some((a) => a.code === "WEEKLY_LIMIT_EXCEEDED"));
});

test("turno nocturno que cruza la medianoche se asigna al día de entrada", () => {
  const punches = [p("2026-10-05T21:55:00"), p("2026-10-06T05:05:00")];
  const r = computeWeek("E1", week(night), punches, DEFAULT_POLICY);
  assert.equal(r.days[0].workedMinutes, 7 * 60 + 10);
  assert.equal(r.days[1].workedMinutes, 0);
});

test("trabajo en día de descanso y semana sin descanso", () => {
  const punches = ["05", "06", "07", "08", "09", "10", "11"].flatMap((d) => inOut(d, "09:00", "13:00"));
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  assert.equal(r.days[6].restDayWorkedMinutes, 4 * 60);
  assert.ok(r.alerts.some((a) => a.code === "NO_WEEKLY_REST_DAY"));
});
