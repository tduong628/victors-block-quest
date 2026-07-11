import Dexie, { type Table } from "dexie";
import type { AttemptRecord, ActivityType, MasteryRecord, ArtworkRecord } from "../types/lesson";
import { computeMasteryStatus } from "./mastery";

class VictorQuestDB extends Dexie {
  attempts!: Table<AttemptRecord, number>;
  mastery!: Table<MasteryRecord, string>;
  artwork!: Table<ArtworkRecord, number>;

  constructor() {
    super("victor-block-quest");
    this.version(1).stores({
      attempts: "++id, itemId, sessionId, timestampMs",
      mastery: "itemId, status, lastPlayedMs",
    });
    this.version(2).stores({
      attempts: "++id, itemId, sessionId, timestampMs",
      mastery: "itemId, status, lastPlayedMs",
      artwork: "++id, itemId, createdMs",
    });
  }
}

export const db = new VictorQuestDB();

export async function recordAttempt(
  itemId: string,
  activityType: ActivityType,
  correct: boolean,
  sessionId: string,
  nowMs: number = Date.now()
): Promise<MasteryRecord> {
  await db.attempts.add({ itemId, activityType, correct, timestampMs: nowMs, sessionId });

  const existing = await db.mastery.get(itemId);
  const base: MasteryRecord = existing ?? {
    itemId,
    status: "new",
    totalAttempts: 0,
    correctAttempts: 0,
    sessionsWithAttempt: [],
    lastPlayedMs: nowMs,
    lastCorrectMs: null,
  };

  const updated: MasteryRecord = {
    ...base,
    totalAttempts: base.totalAttempts + 1,
    correctAttempts: base.correctAttempts + (correct ? 1 : 0),
    sessionsWithAttempt: base.sessionsWithAttempt.includes(sessionId)
      ? base.sessionsWithAttempt
      : [...base.sessionsWithAttempt, sessionId],
    lastPlayedMs: nowMs,
    lastCorrectMs: correct ? nowMs : base.lastCorrectMs,
  };
  updated.status = computeMasteryStatus(updated, nowMs);

  await db.mastery.put(updated);
  return updated;
}

export async function getMasteryRecord(itemId: string): Promise<MasteryRecord | undefined> {
  return db.mastery.get(itemId);
}

export async function getAllMastery(): Promise<MasteryRecord[]> {
  return db.mastery.toArray();
}

export async function getRecentWrongAttempts(
  itemId: string,
  limit: number
): Promise<AttemptRecord[]> {
  const rows = await db.attempts
    .where("itemId")
    .equals(itemId)
    .and((attempt) => !attempt.correct)
    .sortBy("timestampMs");

  return rows.reverse().slice(0, limit);
}
