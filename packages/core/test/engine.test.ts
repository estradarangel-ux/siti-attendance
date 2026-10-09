import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWeek, DEFAULT_POLICY, type Punch, type ScheduledDay, type Shift } from "../src/index.ts";

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

test("tiempo extra: dobles hasta 9 h, triples después, y alertas art. 66", () => {
  // 4 días saliendo a las 22:00 => 4 h extra diarias = 16 h extra.
  const punches = ["05", "06", "07", "08"].flatMap((d) => inOut(d, "09:00", "22:00"));
  const r = computeWeek("E1", week(office), punches, DEFAULT_POLICY);
  assert.equal(r.overtimeMinutes, 16 * 60);
  assert.equal(r.overtimeDoubleMinutes, 9 * 60);
  assert.equal(r.overtimeTripleMinutes, 7 * 60);
  const codes = r.alerts.map((a) => a.code);
  assert.ok(codes.includes("OVERTIME_DAILY_OVER_3H"));
  assert.ok(codes.includes("OVERTIME_MORE_THAN_3_DAYS"));
});

test("límite semanal de 40 h genera tiempo extra aunque no haya excedente diario", () => {
  const policy = { ...DEFAULT_POLICY, weeklyLimitHours: 40 };
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
