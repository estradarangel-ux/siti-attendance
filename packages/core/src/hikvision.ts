import type { Punch } from "./types.ts";

/** Evento de control de acceso tal como lo entrega ISAPI (`AcsEvent.InfoList[]` o `AccessControllerEvent`). */
export interface HikAcsEvent {
  major: number;
  minor: number;
  time: string;
  employeeNoString?: string;
  attendanceStatus?: string;
  currentVerifyMode?: string;
  serialNo?: number;
}

/** major 5 = evento de control de acceso. */
const MAJOR_ACCESS_EVENT = 5;

/** minor de verificación exitosa (fuente comunitaria; validar contra la guía ISAPI oficial). */
export const SUCCESS_MINORS: Record<number, string> = {
  38: "card",
  75: "face",
  113: "fingerprint",
};

/**
 * Convierte eventos ISAPI en checadas. Descarta intentos fallidos, eventos de puerta
 * y eventos sin persona identificada (employeeNoString vacío o "0").
 */
export function punchesFromAcsEvents(events: HikAcsEvent[], deviceId: string): Punch[] {
  const punches: Punch[] = [];
  for (const e of events) {
    if (e.major !== MAJOR_ACCESS_EVENT || !(e.minor in SUCCESS_MINORS)) continue;
    const employeeId = e.employeeNoString?.trim();
    if (!employeeId || employeeId === "0") continue;
    punches.push({
      employeeId,
      timestamp: e.time,
      deviceId,
      verifyMode: e.currentVerifyMode ?? SUCCESS_MINORS[e.minor],
    });
  }
  return punches;
}

/** Clave idempotente para deduplicar eventos entre push en tiempo real y pull de conciliación. */
export function eventKey(deviceId: string, e: HikAcsEvent): string {
  return `${deviceId}:${e.serialNo ?? ""}:${e.time}:${e.employeeNoString ?? ""}`;
}
