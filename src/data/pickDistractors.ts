import type { LessonItem } from "../types/lesson";
import { db } from "./db";

export async function pickDistractors(
  item: LessonItem,
  allItems: LessonItem[],
  count: number
): Promise<LessonItem[]> {
  const byId = new Map(allItems.map((i) => [i.id, i]));

  // recent wrong attempts across the whole pack, most recent first, as a rough "what confuses Victor" signal
  // note: `correct` is not an indexed field on the attempts table (see src/data/db.ts), so this
  // must be a full-table scan + in-memory filter rather than a Dexie .where("correct") query.
  const allAttempts = await db.attempts.orderBy("timestampMs").reverse().toArray();
  const recentWrong = allAttempts.filter((a) => !a.correct);

  const confusedIds = recentWrong
    .map((a) => a.itemId)
    .filter((id) => id !== item.id && item.distractorPoolIds.includes(id));

  const prioritized = [...new Set(confusedIds)]
    .map((id) => byId.get(id))
    .filter((i): i is LessonItem => Boolean(i));

  const pool = item.distractorPoolIds
    .map((id) => byId.get(id))
    .filter((i): i is LessonItem => Boolean(i));

  const merged = [...prioritized, ...pool.filter((p) => !prioritized.some((pr) => pr.id === p.id))];

  // item.distractorPoolIds may hold fewer entries than `count` (Starter Village content only
  // guarantees >=2 per item — see src/data/lessonPacks/starter-village.test.ts). Fall back to the
  // full allItems set (excluding the target and anything already chosen) to fill remaining slots.
  const fallback = allItems.filter(
    (i) => i.id !== item.id && !merged.some((m) => m.id === i.id)
  );
  return [...merged, ...fallback].slice(0, count);
}
