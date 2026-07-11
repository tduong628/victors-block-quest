import type { MasteryRecord, MasteryStatus } from "../types/lesson";

export const MASTERY_MIN_ACCURACY = 0.8;
export const MASTERY_NEARLY_ACCURACY = 0.6;
export const MASTERY_MIN_ATTEMPTS = 6;
export const MASTERY_MIN_SESSIONS = 2;
export const DECAY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function computeMasteryStatus(record: MasteryRecord, nowMs: number): MasteryStatus {
  if (record.totalAttempts === 0) return "new";

  const accuracy = record.correctAttempts / record.totalAttempts;
  const meetsAttempts = record.totalAttempts >= MASTERY_MIN_ATTEMPTS;
  const meetsSessions = record.sessionsWithAttempt.length >= MASTERY_MIN_SESSIONS;
  const meetsAccuracy = accuracy >= MASTERY_MIN_ACCURACY;

  if (meetsAttempts && meetsSessions && meetsAccuracy) {
    const isStale = nowMs - record.lastPlayedMs > DECAY_WINDOW_MS;
    return isStale ? "practicing" : "mastered";
  }

  return accuracy >= MASTERY_NEARLY_ACCURACY ? "nearly_mastered" : "practicing";
}
