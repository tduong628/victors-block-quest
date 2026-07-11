import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, recordAttempt, getMasteryRecord, getRecentWrongAttempts } from "./db";

describe("recordAttempt", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("creates a new mastery record on first attempt with status 'new' -> re-evaluated to 'practicing'", async () => {
    const record = await recordAttempt("letter-A", "find_it", true, "session-1", 1000);
    expect(record.itemId).toBe("letter-A");
    expect(record.totalAttempts).toBe(1);
    expect(record.correctAttempts).toBe(1);
    expect(record.sessionsWithAttempt).toEqual(["session-1"]);
  });

  it("accumulates attempts across calls and persists via db.mastery", async () => {
    await recordAttempt("letter-A", "find_it", true, "session-1", 1000);
    await recordAttempt("letter-A", "find_it", false, "session-1", 2000);
    const stored = await getMasteryRecord("letter-A");
    expect(stored?.totalAttempts).toBe(2);
    expect(stored?.correctAttempts).toBe(1);
  });

  it("tracks distinct session ids, not attempt count, for the sessions-with-attempt list", async () => {
    await recordAttempt("letter-A", "find_it", true, "session-1", 1000);
    await recordAttempt("letter-A", "find_it", true, "session-1", 1500);
    await recordAttempt("letter-A", "find_it", true, "session-2", 2000);
    const stored = await getMasteryRecord("letter-A");
    expect(stored?.sessionsWithAttempt).toEqual(["session-1", "session-2"]);
  });

  it("getRecentWrongAttempts returns only incorrect attempts for the item, most recent first", async () => {
    await recordAttempt("letter-A", "find_it", true, "session-1", 1000);
    await recordAttempt("letter-A", "find_it", false, "session-1", 2000);
    await recordAttempt("letter-A", "find_it", false, "session-1", 3000);
    const wrong = await getRecentWrongAttempts("letter-A", 5);
    expect(wrong.map((w) => w.timestampMs)).toEqual([3000, 2000]);
  });
});
