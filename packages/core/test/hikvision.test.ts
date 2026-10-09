import { test } from "node:test";
import assert from "node:assert/strict";
import { eventKey, punchesFromAcsEvents, type HikAcsEvent } from "../src/index.ts";

const sample: HikAcsEvent[] = [
  { major: 5, minor: 75, time: "2026-10-09T08:59:12-06:00", employeeNoString: "1001", serialNo: 1, currentVerifyMode: "face" },
  { major: 5, minor: 76, time: "2026-10-09T09:00:01-06:00", employeeNoString: "1002", serialNo: 2 }, // rostro falló
  { major: 5, minor: 38, time: "2026-10-09T09:01:00-06:00", employeeNoString: "1003", serialNo: 3 },
  { major: 5, minor: 75, time: "2026-10-09T09:02:00-06:00", employeeNoString: "0", serialNo: 4 }, // sin persona
  { major: 3, minor: 75, time: "2026-10-09T09:03:00-06:00", employeeNoString: "1004", serialNo: 5 }, // no es ACS
];

test("solo verificaciones exitosas con persona identificada se vuelven checadas", () => {
  const punches = punchesFromAcsEvents(sample, "DS-K1T342-ABC");
  assert.deepEqual(
    punches.map((p) => [p.employeeId, p.verifyMode]),
    [["1001", "face"], ["1003", "card"]],
  );
  assert.equal(punches[0].deviceId, "DS-K1T342-ABC");
});

test("eventKey es estable para deduplicar push y pull", () => {
  assert.equal(eventKey("D1", sample[0]), eventKey("D1", { ...sample[0] }));
  assert.notEqual(eventKey("D1", sample[0]), eventKey("D2", sample[0]));
});
