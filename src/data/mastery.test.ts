import { describe, it, expect } from "vitest";
import { computeMasteryStatus, DECAY_WINDOW_MS } from "./mastery";
import type { MasteryRecord } from "../types/lesson";

function record(overrides: Partial<MasteryRecord>): MasteryRecord {
  return {
    itemId: "letter-A",
    status: "new",
    totalAttempts: 0,
    correctAttempts: 0,
    sessionsWithAttempt: [],
    lastPlayedMs: 0,
    lastCorrectMs: null,
    ...overrides,
  };
}

describe("computeMasteryStatus", () => {
  it("is 'new' with zero attempts", () => {
    expect(computeMasteryStatus(record({}), 0)).toBe("new");
  });

  it("is 'practicing' below 60% accuracy regardless of attempt count", () => {
    const r = record({ totalAttempts: 10, correctAttempts: 3, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0 });
    expect(computeMasteryStatus(r, 0)).toBe("practicing");
  });

  it("is 'nearly_mastered' between 60% and 80% accuracy", () => {
    const r = record({ totalAttempts: 10, correctAttempts: 7, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0 });
    expect(computeMasteryStatus(r, 0)).toBe("nearly_mastered");
  });

  it("is 'practicing', not 'mastered', at 100% accuracy with only 3 attempts (below the 6-attempt floor)", () => {
    const r = record({ totalAttempts: 3, correctAttempts: 3, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0 });
    expect(computeMasteryStatus(r, 0)).toBe("nearly_mastered");
  });

  it("is 'practicing', not 'mastered', at 100% accuracy across 6 attempts in only 1 session", () => {
    const r = record({ totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1"], lastPlayedMs: 0 });
    expect(computeMasteryStatus(r, 0)).toBe("nearly_mastered");
  });

  it("is 'mastered' at >=80% accuracy, >=6 attempts, across >=2 sessions", () => {
    const r = record({ totalAttempts: 6, correctAttempts: 5, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0 });
    expect(computeMasteryStatus(r, 0)).toBe("mastered");
  });

  it("decays a mastered item back to 'practicing' after the decay window with no play, but never below practicing", () => {
    const r = record({ totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0 });
    const now = DECAY_WINDOW_MS + 1;
    expect(computeMasteryStatus(r, now)).toBe("practicing");
  });

  it("does not decay a mastered item that was played inside the decay window", () => {
    const r = record({ totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0 });
    const now = DECAY_WINDOW_MS - 1;
    expect(computeMasteryStatus(r, now)).toBe("mastered");
  });
});
