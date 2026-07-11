import type { LessonItem, LessonPack } from "../../types/lesson";
import { lessonPackSchema } from "./schema";

export { lessonPackSchema } from "./schema";

const letterIds = ["A", "B", "C", "D", "E"];
const letterDistractors: Record<string, string[]> = {
  A: ["letter-B", "letter-D"],
  B: ["letter-A", "letter-D"],
  C: ["letter-D", "letter-E"],
  D: ["letter-B", "letter-A"],
  E: ["letter-C", "letter-D"],
};

const letters: LessonItem[] = letterIds.map((L) => ({
  id: `letter-${L}`,
  kind: "letter",
  symbolUpper: L,
  symbolLower: L.toLowerCase(),
  audioEn: `/audio/en_letter-${L}.mp3`,
  audioVi: `/audio/vi_letter-${L}.mp3`,
  viLabel: `chữ ${L}`,
  distractorPoolIds: letterDistractors[L].map((id) => id),
}));

const numberDistractors: Record<string, string[]> = {
  "0": ["number-1", "number-2"],
  "1": ["number-0", "number-2"],
  "2": ["number-1", "number-3"],
  "3": ["number-2", "number-4"],
  "4": ["number-3", "number-2"],
};

const numbers: LessonItem[] = ["0", "1", "2", "3", "4"].map((N) => ({
  id: `number-${N}`,
  kind: "number",
  symbolUpper: N,
  audioEn: `/audio/en_number-${N}.mp3`,
  audioVi: `/audio/vi_number-${N}.mp3`,
  viLabel: `số ${N}`,
  distractorPoolIds: numberDistractors[N].map((id) => id),
}));

export const starterVillagePack: LessonPack = {
  id: "starter-village",
  title: "Starter Village",
  items: [...letters, ...numbers],
};

lessonPackSchema.parse(starterVillagePack); // fail fast at import time if content is malformed
