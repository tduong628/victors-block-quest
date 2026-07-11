// src/types/lesson.ts
export type ItemKind = "letter" | "number";
export type MasteryStatus = "new" | "practicing" | "nearly_mastered" | "mastered";
export type ActivityType = "discover" | "find_it" | "match_it" | "create_it" | "challenge";

export interface LessonItem {
  id: string;              // e.g. "letter-A", "number-7"
  kind: ItemKind;
  symbolUpper: string;     // "A" or "7"
  symbolLower?: string;    // "a" — letters only, undefined for numbers
  audioEn: string;         // "/audio/en_letter-A.mp3"
  audioVi: string;         // "/audio/vi_letter-A.mp3"
  viLabel: string;         // "chữ A" or "số 7" — spoken/display Vietnamese label
  distractorPoolIds: string[]; // other item ids eligible as "Find it" / "Match it" distractors
}

export interface LessonPack {
  id: string;               // "starter-village"
  title: string;
  items: LessonItem[];
}

export interface AttemptRecord {
  id?: number;               // Dexie autoincrement primary key
  itemId: string;
  activityType: ActivityType;
  correct: boolean;
  timestampMs: number;
  sessionId: string;
}

export interface MasteryRecord {
  itemId: string;             // primary key
  status: MasteryStatus;
  totalAttempts: number;
  correctAttempts: number;
  sessionsWithAttempt: string[];  // distinct sessionIds seen (drives the "2 sessions" rule)
  lastPlayedMs: number;
  lastCorrectMs: number | null;
}
