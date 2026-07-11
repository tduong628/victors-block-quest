# Victor's Block Learning Quest — V1 MVP Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working, offline-installable, bilingual (English + Vietnamese) PWA that proves the full learning loop — Discover → Find it → Match it → Create it → Challenge — end to end for a small "Starter Village" content slice (letters A–E, numbers 0–4), with local mastery tracking, a parent gate, and a V1 parent dashboard, before any further content or zones are built.

**Architecture:** Client-only React + TypeScript SPA built with Vite, installable as a PWA via `vite-plugin-pwa` (manifest + service worker, offline caching of JS/CSS/images/audio/lesson JSON). All learner state lives in IndexedDB via Dexie — no backend, no network calls at play time. Lesson content is data-driven (JSON packs validated with Zod) so later phases add content without touching engine code. Audio is 100% pre-generated static MP3 files — the app never calls a TTS API at runtime.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Phaser 3 (Challenge mini-game only), Dexie (IndexedDB), Zod (schema validation), Vitest + React Testing Library (unit/component tests), `fake-indexeddb` (Dexie test double), Playwright (offline/E2E smoke test).

## Global Constraints

- **Bilingual-always, no language picker.** Every lesson plays English audio, then Vietnamese audio, in that fixed order, every time. No session-level or per-lesson language mode toggle in V1. (Confirmed by John 2026-07-10 — overrides the spec doc's "Decisions Still Needed" question.)
- **No live TTS calls during play.** All spoken audio is pre-generated MP3, named `en_<itemId>.mp3` / `vi_<itemId>.mp3`, bundled as static assets. No ElevenLabs (or any) API key ever ships in the client bundle or touches app source code.
- **Offline-first.** After first install, the app must fully function with no network connection — lessons, audio, images, and progress tracking all work offline.
- **Target device:** Samsung S10 Ultra tablet, Chrome, installed to home screen as a PWA. Design and test at a tablet landscape viewport (e.g. 1600×1000 logical px) as the primary target; do not design mobile-portrait-first.
- **No copyrighted IP.** No Minecraft/Roblox/Spider-Man/Michael Jackson names, logos, character likenesses, skins, or music. Generic block-world, generic web-swing-inspired movement, generic music/dance stage only.
- **Local data only in V1.** No cloud sync, no accounts, no backend service. IndexedDB via Dexie is the sole datastore.
- **Mastery rule (exact, do not approximate):** an item is `mastered` when accuracy ≥ 80% AND total attempts ≥ 6 AND attempts span ≥ 2 distinct sessions. Mastery decays to `practicing` (never removes earned rewards) after 14 days with no play.
- **Scope of this plan:** ONLY the Starter Village vertical slice — 5 letters (A, B, C, D, E) + 5 numbers (0, 1, 2, 3, 4), 10 items total. Full A–Z/0–20 content, Alphabet Forest, Number Mine, Creative Studio (full canvas + block town), Dance & Celebration Stage, Skyline Swing Course, and cloud sync are **out of scope** — see "Future Phases" at the end of this document. Building all six zones and full content in one pass is not realistic for a single implementation pass; this slice must be built, installed on the real tablet, and validated first.

---

## File Structure

```
victors-block-quest/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── audio/                      # pre-generated MP3s (see Task 5)
│   │   ├── en_letter-A.mp3 ... en_number-4.mp3
│   │   ├── vi_letter-A.mp3 ... vi_number-4.mp3
│   │   └── en_ui_correct.mp3, vi_ui_correct.mp3, etc. (fixed UI phrases)
│   └── icons/                      # PWA icons (192, 512, maskable)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── lesson.ts               # Task 1 — shared type contracts
│   ├── data/
│   │   ├── db.ts                   # Task 2 — Dexie schema + recordAttempt
│   │   ├── mastery.ts              # Task 3 — pure mastery/decay engine
│   │   └── lessonPacks/
│   │       └── starter-village.ts  # Task 4 — content + Zod schema
│   ├── audio/
│   │   └── manifest.ts             # Task 5 — id → file path map + fallback
│   ├── components/
│   │   ├── activities/
│   │   │   ├── DiscoverActivity.tsx    # Task 7
│   │   │   ├── FindItActivity.tsx      # Task 8
│   │   │   ├── MatchItActivity.tsx     # Task 9
│   │   │   ├── CreateItActivity.tsx    # Task 10
│   │   │   └── ChallengeActivity.tsx   # Task 11 (Phaser wrapper)
│   │   ├── LessonRunner.tsx        # Task 12
│   │   ├── StarterVillageMap.tsx   # Task 13
│   │   ├── ParentGate.tsx          # Task 14
│   │   └── ParentDashboard.tsx     # Task 15
│   └── game/
│       └── ChallengeScene.ts       # Task 11 — Phaser scene
├── scripts/
│   └── generate-audio.mjs          # Task 5 — documented, NOT run by the implementer
├── tests/
│   └── e2e/offline-install.spec.ts # Task 16
└── docs/superpowers/plans/
    └── 2026-07-10-victors-block-quest-v1.md   (this file)
```

---

### Task 1: Project scaffold + shared type contracts

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Create: `src/types/lesson.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces (used by every later task):
```typescript
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
```

- [ ] **Step 1: Scaffold the Vite + React + TS project**

```bash
cd /Volumes/Claude/John/victors-block-quest
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom fake-indexeddb
npm install dexie zod framer-motion phaser
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind** — in `tailwind.config.ts`, set `content: ["./index.html", "./src/**/*.{ts,tsx}"]`. Add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/index.css` and import it in `src/main.tsx`.

- [ ] **Step 3: Configure Vitest** — add to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
```

Create `vitest.setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 4: Write the shared types file** — create `src/types/lesson.ts` with the exact contents shown in the Interfaces block above.

- [ ] **Step 5: Write the failing App test**

```typescript
// src/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the app shell without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- App.test.tsx`
Expected: FAIL — `App` doesn't render an element with `data-testid="app-shell"` yet (or `App.tsx` doesn't exist in that shape).

- [ ] **Step 7: Write minimal App.tsx**

```typescript
// src/App.tsx
export default function App() {
  return (
    <div data-testid="app-shell" className="h-screen w-screen bg-slate-900 text-white">
      Victor's Block Learning Quest
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- App.test.tsx`
Expected: PASS

- [ ] **Step 9: Verify the production build works**

Run: `npm run build`
Expected: exits 0, produces `dist/`

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite+React+TS project with Tailwind, Vitest, and shared lesson types"
```

---

### Task 2: Dexie/IndexedDB data layer

**Files:**
- Create: `src/data/db.ts`
- Test: `src/data/db.test.ts`

**Interfaces:**
- Consumes: `AttemptRecord`, `MasteryRecord`, `MasteryStatus`, `ActivityType` from `src/types/lesson.ts` (Task 1)
- Consumes: `computeMasteryStatus` from `src/data/mastery.ts` (Task 3 — **implement Task 3 before Task 2's `recordAttempt` step**, or stub it inline and replace; the task order below assumes Task 3 lands first since `db.ts` depends on it)
- Produces (used by every activity component, Tasks 7–15):
```typescript
export const db: VictorQuestDB;
export async function recordAttempt(
  itemId: string,
  activityType: ActivityType,
  correct: boolean,
  sessionId: string,
  nowMs?: number
): Promise<MasteryRecord>;
export async function getMasteryRecord(itemId: string): Promise<MasteryRecord | undefined>;
export async function getAllMastery(): Promise<MasteryRecord[]>;
export async function getRecentWrongAttempts(itemId: string, limit: number): Promise<AttemptRecord[]>;
```

> **Note on task order:** implement **Task 3 (mastery engine) before this task's Step 3**, since `recordAttempt` calls `computeMasteryStatus`. Tasks 2 and 3 are listed in file-structure order but must be built mastery-engine-first.

- [ ] **Step 1: Write the failing test for the Dexie schema and recordAttempt**

```typescript
// src/data/db.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- db.test.ts`
Expected: FAIL — `src/data/db.ts` does not exist yet.

- [ ] **Step 3: Implement the Dexie schema and functions**

```typescript
// src/data/db.ts
import Dexie, { Table } from "dexie";
import type { AttemptRecord, ActivityType, MasteryRecord } from "../types/lesson";
import { computeMasteryStatus } from "./mastery";

class VictorQuestDB extends Dexie {
  attempts!: Table<AttemptRecord, number>;
  mastery!: Table<MasteryRecord, string>;

  constructor() {
    super("victor-block-quest");
    this.version(1).stores({
      attempts: "++id, itemId, sessionId, timestampMs",
      mastery: "itemId, status, lastPlayedMs",
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

export async function getRecentWrongAttempts(itemId: string, limit: number): Promise<AttemptRecord[]> {
  const rows = await db.attempts.where("itemId").equals(itemId).and((a) => !a.correct).reverse().sortBy("timestampMs");
  return rows.slice(0, limit).reverse().length === limit
    ? rows.slice(-limit).reverse()
    : rows.reverse();
}
```

> Implementation note for whoever writes `getRecentWrongAttempts`: Dexie's `.reverse().sortBy()` sorts ascending then reverses the whole array — verify against the test's exact expected order `[3000, 2000]` (newest first) and adjust the query until that assertion passes; don't trust this sketch blindly, the test is the source of truth.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- db.test.ts`
Expected: PASS (all 4 cases)

- [ ] **Step 5: Commit**

```bash
git add src/data/db.ts src/data/db.test.ts
git commit -m "feat: add Dexie data layer with recordAttempt and mastery persistence"
```

---

### Task 3: Mastery + decay engine (pure logic — implement before Task 2's Step 3)

**Files:**
- Create: `src/data/mastery.ts`
- Test: `src/data/mastery.test.ts`

**Interfaces:**
- Consumes: `MasteryRecord`, `MasteryStatus` from `src/types/lesson.ts` (Task 1)
- Produces (consumed by `src/data/db.ts` Task 2, and `src/components/ParentDashboard.tsx` Task 15):
```typescript
export const MASTERY_MIN_ACCURACY = 0.8;
export const MASTERY_MIN_ATTEMPTS = 6;
export const MASTERY_MIN_SESSIONS = 2;
export const DECAY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
export function computeMasteryStatus(record: MasteryRecord, nowMs: number): MasteryStatus;
```

- [ ] **Step 1: Write the failing tests**

```typescript
// src/data/mastery.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- mastery.test.ts`
Expected: FAIL — `src/data/mastery.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/data/mastery.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- mastery.test.ts`
Expected: PASS (all 8 cases)

- [ ] **Step 5: Commit**

```bash
git add src/data/mastery.ts src/data/mastery.test.ts
git commit -m "feat: add pure mastery-status and decay calculation engine"
```

---

### Task 4: Lesson content schema + Starter Village content pack

**Files:**
- Create: `src/data/lessonPacks/schema.ts`
- Create: `src/data/lessonPacks/starter-village.ts`
- Test: `src/data/lessonPacks/starter-village.test.ts`

**Interfaces:**
- Consumes: `LessonItem`, `LessonPack`, `ItemKind` from `src/types/lesson.ts` (Task 1)
- Produces (consumed by `LessonRunner`, `StarterVillageMap`, `FindItActivity`, `MatchItActivity` — Tasks 8, 9, 12, 13):
```typescript
export const lessonItemSchema: z.ZodType<LessonItem>;
export const lessonPackSchema: z.ZodType<LessonPack>;
export const starterVillagePack: LessonPack;
```

- [ ] **Step 1: Write the failing test**

```typescript
// src/data/lessonPacks/starter-village.test.ts
import { describe, it, expect } from "vitest";
import { starterVillagePack, lessonPackSchema } from "./starter-village";

describe("starterVillagePack", () => {
  it("validates against the lesson pack schema", () => {
    expect(() => lessonPackSchema.parse(starterVillagePack)).not.toThrow();
  });

  it("contains exactly 10 items: letters A-E and numbers 0-4", () => {
    const ids = starterVillagePack.items.map((i) => i.id).sort();
    expect(ids).toEqual([
      "letter-A", "letter-B", "letter-C", "letter-D", "letter-E",
      "number-0", "number-1", "number-2", "number-3", "number-4",
    ]);
  });

  it("every letter item has a lowercase symbol; every number item does not", () => {
    for (const item of starterVillagePack.items) {
      if (item.kind === "letter") expect(item.symbolLower).toBeTruthy();
      if (item.kind === "number") expect(item.symbolLower).toBeUndefined();
    }
  });

  it("every item has at least 2 distractor pool entries pointing at other valid item ids", () => {
    const validIds = new Set(starterVillagePack.items.map((i) => i.id));
    for (const item of starterVillagePack.items) {
      expect(item.distractorPoolIds.length).toBeGreaterThanOrEqual(2);
      for (const d of item.distractorPoolIds) {
        expect(validIds.has(d)).toBe(true);
        expect(d).not.toBe(item.id);
      }
    }
  });

  it("every item's audioEn/audioVi paths follow the en_<id>.mp3 / vi_<id>.mp3 convention", () => {
    for (const item of starterVillagePack.items) {
      expect(item.audioEn).toBe(`/audio/en_${item.id}.mp3`);
      expect(item.audioVi).toBe(`/audio/vi_${item.id}.mp3`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- starter-village.test.ts`
Expected: FAIL — files don't exist.

- [ ] **Step 3: Implement the Zod schema**

```typescript
// src/data/lessonPacks/schema.ts
import { z } from "zod";

export const lessonItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["letter", "number"]),
  symbolUpper: z.string().min(1),
  symbolLower: z.string().min(1).optional(),
  audioEn: z.string().startsWith("/audio/"),
  audioVi: z.string().startsWith("/audio/"),
  viLabel: z.string().min(1),
  distractorPoolIds: z.array(z.string()).min(1),
});

export const lessonPackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  items: z.array(lessonItemSchema).min(1),
});
```

- [ ] **Step 4: Implement the Starter Village content pack**

```typescript
// src/data/lessonPacks/starter-village.ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- starter-village.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/lessonPacks/
git commit -m "feat: add Zod-validated lesson pack schema and Starter Village content (A-E, 0-4)"
```

---

### Task 5: Audio manifest, fallback behavior, and the (documented, not executed) generation script

**Files:**
- Create: `src/audio/manifest.ts`
- Create: `scripts/generate-audio.mjs`
- Test: `src/audio/manifest.test.ts`

**Interfaces:**
- Consumes: `starterVillagePack` from `src/data/lessonPacks/starter-village.ts` (Task 4)
- Produces (consumed by `DiscoverActivity`, `LessonRunner` — Tasks 7, 12):
```typescript
export interface AudioClip { src: string; }
export function getItemAudio(itemId: string): { en: AudioClip; vi: AudioClip };
export function playSequential(clips: AudioClip[]): Promise<void>;
export const UI_PHRASE_IDS: readonly string[]; // fixed non-item phrases: correct, try_again, level_complete, welcome
```

> **Audio asset sourcing — do NOT generate audio inside this Codex dispatch.** The actual MP3 files (10 items × 2 languages + ~6 fixed UI phrases = 32 clips) must be generated via the already-authorized ElevenLabs MCP connection in the orchestrating Claude session — not by a raw API key inside this project. `scripts/generate-audio.mjs` below exists as **documentation of the pipeline for future phases** (so Phase 2+ can regenerate the full A–Z/0–20 library from a private machine with its own `ELEVENLABS_API_KEY` env var); it is not meant to run as part of this task. Until real audio files exist in `public/audio/`, `getItemAudio`/`playSequential` must degrade gracefully (see Step 3's error-handling test) rather than crash the lesson.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/audio/manifest.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getItemAudio, playSequential, UI_PHRASE_IDS } from "./manifest";

describe("getItemAudio", () => {
  it("returns en/vi audio paths following the naming convention for a known item", () => {
    const clips = getItemAudio("letter-A");
    expect(clips.en.src).toBe("/audio/en_letter-A.mp3");
    expect(clips.vi.src).toBe("/audio/vi_letter-A.mp3");
  });
});

describe("UI_PHRASE_IDS", () => {
  it("includes the fixed reward/instruction phrases the spec calls out", () => {
    expect(UI_PHRASE_IDS).toContain("correct");
    expect(UI_PHRASE_IDS).toContain("try_again");
    expect(UI_PHRASE_IDS).toContain("level_complete");
  });
});

describe("playSequential", () => {
  beforeEach(() => {
    // jsdom's HTMLMediaElement has no real playback; stub play()/onended wiring per clip.
    vi.stubGlobal("Audio", vi.fn().mockImplementation(() => {
      const instance: any = { play: vi.fn().mockResolvedValue(undefined), onended: null, onerror: null };
      // simulate playback finishing on next microtask so playSequential's promise resolves
      queueMicrotask(() => instance.onended && instance.onended());
      return instance;
    }));
  });

  it("plays clips in order and resolves once the last one ends", async () => {
    await expect(
      playSequential([{ src: "/audio/en_letter-A.mp3" }, { src: "/audio/vi_letter-A.mp3" }])
    ).resolves.toBeUndefined();
  });

  it("does not throw if a clip fails to load (missing file before audio is generated)", async () => {
    vi.stubGlobal("Audio", vi.fn().mockImplementation(() => {
      const instance: any = { play: vi.fn().mockRejectedValue(new Error("404")), onended: null, onerror: null };
      queueMicrotask(() => instance.onerror && instance.onerror(new Event("error")));
      return instance;
    }));
    await expect(playSequential([{ src: "/audio/en_missing.mp3" }])).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- manifest.test.ts`
Expected: FAIL — `src/audio/manifest.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/audio/manifest.ts
import { starterVillagePack } from "../data/lessonPacks/starter-village";

export interface AudioClip {
  src: string;
}

export const UI_PHRASE_IDS = ["correct", "try_again", "level_complete", "welcome", "level_locked", "streak"] as const;

const itemById = new Map(starterVillagePack.items.map((i) => [i.id, i]));

export function getItemAudio(itemId: string): { en: AudioClip; vi: AudioClip } {
  const item = itemById.get(itemId);
  if (!item) throw new Error(`Unknown lesson item id: ${itemId}`);
  return { en: { src: item.audioEn }, vi: { src: item.audioVi } };
}

export function playSequential(clips: AudioClip[]): Promise<void> {
  return clips.reduce<Promise<void>>(
    (chain, clip) => chain.then(() => playOne(clip)),
    Promise.resolve()
  );
}

function playOne(clip: AudioClip): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(clip.src);
    audio.onended = () => resolve();
    audio.onerror = () => resolve(); // missing/broken clip must never block the lesson — fail silent, not fail loud
    audio.play().catch(() => resolve());
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Write the documented (not executed) generation script**

```javascript
// scripts/generate-audio.mjs
// Run manually, off-tablet, on a machine with ELEVENLABS_API_KEY set. NEVER commit the key.
// Usage: ELEVENLABS_API_KEY=... node scripts/generate-audio.mjs
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY is required. This script is never run from inside the app or CI.");
  process.exit(1);
}

// itemId -> { en: text, vi: text }. Extend this table as content packs grow.
const PHRASES = {
  "letter-A": { en: "A", vi: "chữ A" },
  "letter-B": { en: "B", vi: "chữ B" },
  "letter-C": { en: "C", vi: "chữ C" },
  "letter-D": { en: "D", vi: "chữ D" },
  "letter-E": { en: "E", vi: "chữ E" },
  "number-0": { en: "zero", vi: "số không" },
  "number-1": { en: "one", vi: "số một" },
  "number-2": { en: "two", vi: "số hai" },
  "number-3": { en: "three", vi: "số ba" },
  "number-4": { en: "four", vi: "số bốn" },
};

const VOICE_ID_EN = process.env.ELEVENLABS_VOICE_EN ?? "REPLACE_WITH_CHOSEN_ENGLISH_VOICE_ID";
const VOICE_ID_VI = process.env.ELEVENLABS_VOICE_VI ?? "REPLACE_WITH_CHOSEN_VIETNAMESE_VOICE_ID";
const OUT_DIR = path.resolve(process.cwd(), "public/audio");

async function synth(text, voiceId, outFile) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed for "${text}": HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  console.log(`wrote ${outFile}`);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const [itemId, { en, vi }] of Object.entries(PHRASES)) {
  await synth(en, VOICE_ID_EN, path.join(OUT_DIR, `en_${itemId}.mp3`));
  await synth(vi, VOICE_ID_VI, path.join(OUT_DIR, `vi_${itemId}.mp3`));
}
```

- [ ] **Step 6: Commit**

```bash
git add src/audio/manifest.ts src/audio/manifest.test.ts scripts/generate-audio.mjs
git commit -m "feat: add audio manifest with graceful-fallback playback and documented (unexecuted) TTS pipeline script"
```

> **Handoff note for the orchestrating session (not a Codex/NEO step):** after this task lands, generate the real 32 MP3 files via the connected ElevenLabs MCP (small batch first — validate Vietnamese voice quality per the spec's own recommendation before finalizing), then drop them into `public/audio/` with the exact filenames `getItemAudio`/`UI_PHRASE_IDS` expect. The app must already work (silently, with no audio) before those files exist, per Step 3's `onerror` fallback — this is a deliberate ordering so audio generation doesn't block engine development.

---

### Task 6: PWA manifest + service worker (offline caching)

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.webmanifest` (or generated by `vite-plugin-pwa`)
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`
- Test: `tests/e2e/offline-install.spec.ts` (full test written and run in Task 16 — this task only needs a manual/dev-server smoke check)

- [ ] **Step 1: Install and configure `vite-plugin-pwa`**

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts (add to plugins array alongside react())
import { VitePWA } from "vite-plugin-pwa";

// inside defineConfig({ plugins: [react(), VitePWA({ ... })] })
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["icons/*.png"],
  manifest: {
    name: "Victor's Block Learning Quest",
    short_name: "Block Quest",
    description: "Bilingual letters and numbers learning adventure",
    theme_color: "#0f172a",
    background_color: "#0f172a",
    display: "standalone",
    orientation: "landscape",
    start_url: "/",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,mp3,json}"],
    runtimeCaching: [
      {
        urlPattern: /\/audio\/.*\.mp3$/,
        handler: "CacheFirst",
        options: { cacheName: "audio-cache", expiration: { maxEntries: 200 } },
      },
    ],
  },
})
```

- [ ] **Step 2: Placeholder icons** — generate three simple placeholder PNGs (block/tablet icon, any solid-color square is acceptable for this task; final art comes later) at the required sizes and save to `public/icons/`.

- [ ] **Step 3: Manual smoke check**

Run: `npm run build && npm run preview`
Then in Chrome DevTools → Application → Manifest: confirm the manifest loads with no errors and `Service Workers` shows one activated and running. This is a manual check, not a scripted test — the scripted offline check is Task 16.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts public/icons/
git commit -m "feat: add PWA manifest and service worker with cache-first audio caching"
```

---

### Task 7: Discover activity

**Files:**
- Create: `src/components/activities/DiscoverActivity.tsx`
- Test: `src/components/activities/DiscoverActivity.test.tsx`

**Interfaces:**
- Consumes: `LessonItem` (Task 1), `getItemAudio`/`playSequential` (Task 5)
- Produces (consumed by `LessonRunner`, Task 12):
```typescript
export interface DiscoverActivityProps {
  item: LessonItem;
  onComplete: () => void;
}
export default function DiscoverActivity(props: DiscoverActivityProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/activities/DiscoverActivity.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DiscoverActivity from "./DiscoverActivity";
import type { LessonItem } from "../../types/lesson";

vi.mock("../../audio/manifest", () => ({
  getItemAudio: () => ({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

const item: LessonItem = {
  id: "letter-A", kind: "letter", symbolUpper: "A", symbolLower: "a",
  audioEn: "/audio/en_letter-A.mp3", audioVi: "/audio/vi_letter-A.mp3",
  viLabel: "chữ A", distractorPoolIds: ["letter-B", "letter-D"],
};

describe("DiscoverActivity", () => {
  it("shows the giant symbol", () => {
    render(<DiscoverActivity item={item} onComplete={vi.fn()} />);
    expect(screen.getByTestId("discover-symbol")).toHaveTextContent("A");
  });

  it("calls onComplete when the child taps Continue", () => {
    const onComplete = vi.fn();
    render(<DiscoverActivity item={item} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- DiscoverActivity.test.tsx`
Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Implement**

```typescript
// src/components/activities/DiscoverActivity.tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import type { LessonItem } from "../../types/lesson";
import { getItemAudio, playSequential } from "../../audio/manifest";

export interface DiscoverActivityProps {
  item: LessonItem;
  onComplete: () => void;
}

export default function DiscoverActivity({ item, onComplete }: DiscoverActivityProps) {
  useEffect(() => {
    const { en, vi } = getItemAudio(item.id);
    void playSequential([en, vi]); // English first, then Vietnamese — always, per the bilingual-always rule
  }, [item.id]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <motion.div
        data-testid="discover-symbol"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="text-[12rem] font-black leading-none text-amber-300"
      >
        {item.symbolUpper}
      </motion.div>
      <button
        onClick={onComplete}
        className="rounded-full bg-emerald-500 px-8 py-4 text-2xl font-bold text-white active:scale-95"
      >
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- DiscoverActivity.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/activities/DiscoverActivity.tsx src/components/activities/DiscoverActivity.test.tsx
git commit -m "feat: add Discover activity with bilingual audio and giant animated symbol"
```

---

### Task 8: Find-it activity (adaptive distractors)

**Files:**
- Create: `src/data/pickDistractors.ts`
- Create: `src/components/activities/FindItActivity.tsx`
- Test: `src/data/pickDistractors.test.ts`
- Test: `src/components/activities/FindItActivity.test.tsx`

**Interfaces:**
- Consumes: `LessonItem` (Task 1), `getRecentWrongAttempts` (Task 2), `recordAttempt` (Task 2)
- Produces (consumed by `LessonRunner`, Task 12):
```typescript
export async function pickDistractors(item: LessonItem, allItems: LessonItem[], count: number): Promise<LessonItem[]>;

export interface FindItActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}
export default function FindItActivity(props: FindItActivityProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test for `pickDistractors`**

```typescript
// src/data/pickDistractors.test.ts
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { pickDistractors } from "./pickDistractors";
import { db, recordAttempt } from "./db";
import { starterVillagePack } from "./lessonPacks/starter-village";

describe("pickDistractors", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("returns `count` distractors, none of which is the target item", async () => {
    const target = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    const distractors = await pickDistractors(target, starterVillagePack.items, 3);
    expect(distractors).toHaveLength(3);
    expect(distractors.every((d) => d.id !== target.id)).toBe(true);
  });

  it("prioritizes items the learner recently got wrong when confused with the target", async () => {
    const target = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    // simulate Victor repeatedly mis-tapping letter-B when shown letter-A
    await recordAttempt("letter-A", "find_it", false, "s1", 1000);
    await db.attempts.add({ itemId: "letter-B", activityType: "find_it", correct: false, timestampMs: 1000, sessionId: "s1" });
    const distractors = await pickDistractors(target, starterVillagePack.items, 2);
    expect(distractors.map((d) => d.id)).toContain("letter-B");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- pickDistractors.test.ts`
Expected: FAIL — `src/data/pickDistractors.ts` does not exist.

- [ ] **Step 3: Implement `pickDistractors`**

```typescript
// src/data/pickDistractors.ts
import type { LessonItem } from "../types/lesson";
import { db } from "./db";

export async function pickDistractors(
  item: LessonItem,
  allItems: LessonItem[],
  count: number
): Promise<LessonItem[]> {
  const byId = new Map(allItems.map((i) => [i.id, i]));

  // recent wrong attempts across the whole pack, most recent first, as a rough "what confuses Victor" signal
  const recentWrong = await db.attempts
    .where("correct").equals(0)
    .reverse()
    .sortBy("timestampMs");

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
  return merged.slice(0, count);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- pickDistractors.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing component test**

```typescript
// src/components/activities/FindItActivity.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FindItActivity from "./FindItActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

vi.mock("../../data/pickDistractors", () => ({
  pickDistractors: vi.fn().mockResolvedValue([
    starterVillagePack.items.find((i) => i.id === "letter-B"),
    starterVillagePack.items.find((i) => i.id === "letter-D"),
  ]),
}));
vi.mock("../../data/db", () => ({ recordAttempt: vi.fn().mockResolvedValue({}) }));

describe("FindItActivity", () => {
  const target = starterVillagePack.items.find((i) => i.id === "letter-A")!;

  it("shows the target among 3 choices (1 correct + 2 distractors) and calls onComplete(true) on a correct tap", async () => {
    const onComplete = vi.fn();
    render(
      <FindItActivity item={target} allItems={starterVillagePack.items} sessionId="s1" onComplete={onComplete} />
    );
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^[A-Za-z0-9]$/ })).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true));
  });

  it("calls onComplete(false) on an incorrect tap", async () => {
    const onComplete = vi.fn();
    render(
      <FindItActivity item={target} allItems={starterVillagePack.items} sessionId="s1" onComplete={onComplete} />
    );
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^[A-Za-z0-9]$/ })).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(false));
  });
});
```

- [ ] **Step 6: Run test to verify it fails, then implement**

```typescript
// src/components/activities/FindItActivity.tsx
import { useEffect, useState } from "react";
import type { LessonItem } from "../../types/lesson";
import { pickDistractors } from "../../data/pickDistractors";
import { recordAttempt } from "../../data/db";

export interface FindItActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

export default function FindItActivity({ item, allItems, sessionId, onComplete }: FindItActivityProps) {
  const [choices, setChoices] = useState<LessonItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    pickDistractors(item, allItems, 2).then((distractors) => {
      if (cancelled) return;
      const shuffled = [item, ...distractors].sort(() => Math.random() - 0.5);
      setChoices(shuffled);
    });
    return () => { cancelled = true; };
  }, [item, allItems]);

  async function handleChoice(choiceId: string) {
    const correct = choiceId === item.id;
    await recordAttempt(item.id, "find_it", correct, sessionId);
    onComplete(correct);
  }

  if (!choices) return <div>Loading…</div>;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <p className="text-2xl font-semibold text-white">Find {item.symbolUpper}</p>
      <div className="flex gap-6">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className="rounded-2xl bg-slate-700 px-10 py-8 text-6xl font-black text-white active:scale-95"
          >
            {choice.symbolUpper}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Run: `npm run test -- FindItActivity.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/data/pickDistractors.ts src/data/pickDistractors.test.ts src/components/activities/FindItActivity.tsx src/components/activities/FindItActivity.test.tsx
git commit -m "feat: add Find-it activity with mistake-adaptive distractor selection"
```

---

### Task 9: Match-it activity (uppercase-to-lowercase / audio-to-symbol)

**Files:**
- Create: `src/components/activities/MatchItActivity.tsx`
- Test: `src/components/activities/MatchItActivity.test.tsx`

**Interfaces:**
- Consumes: `LessonItem` (Task 1), `recordAttempt` (Task 2)
- Produces (consumed by `LessonRunner`, Task 12):
```typescript
export interface MatchItActivityProps {
  item: LessonItem;
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}
export default function MatchItActivity(props: MatchItActivityProps): JSX.Element;
```

For letters (`kind === "letter"`): show the uppercase symbol and 3 lowercase choices (1 correct + 2 wrong, drawn from `symbolLower` of other Starter Village items), tap to match. For numbers: show the item's spoken-number word choices instead (reuse the same tap-to-match mechanic against `symbolUpper` of 3 candidate numbers) — numbers have no case pair, so this activity for numbers becomes "symbol to symbol" matching against a shuffled duplicate, which is intentionally simple for V1's 0–4 range.

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/activities/MatchItActivity.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MatchItActivity from "./MatchItActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

vi.mock("../../data/db", () => ({ recordAttempt: vi.fn().mockResolvedValue({}) }));

describe("MatchItActivity — letters", () => {
  const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;

  it("shows the uppercase prompt and calls onComplete(true) when the matching lowercase is tapped", async () => {
    const onComplete = vi.fn();
    render(<MatchItActivity item={item} sessionId="s1" onComplete={onComplete} />);
    expect(screen.getByTestId("match-prompt")).toHaveTextContent("A");
    fireEvent.click(screen.getByRole("button", { name: "a" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- MatchItActivity.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/components/activities/MatchItActivity.tsx
import { useMemo } from "react";
import type { LessonItem } from "../../types/lesson";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";
import { recordAttempt } from "../../data/db";

export interface MatchItActivityProps {
  item: LessonItem;
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

export default function MatchItActivity({ item, sessionId, onComplete }: MatchItActivityProps) {
  const choices = useMemo(() => {
    if (item.kind === "letter") {
      const wrongPool = starterVillagePack.items.filter((i) => i.kind === "letter" && i.id !== item.id);
      const wrong = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 2);
      return [item, ...wrong].map((i) => i.symbolLower!).sort(() => Math.random() - 0.5);
    }
    const wrongPool = starterVillagePack.items.filter((i) => i.kind === "number" && i.id !== item.id);
    const wrong = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 2);
    return [item, ...wrong].map((i) => i.symbolUpper).sort(() => Math.random() - 0.5);
  }, [item]);

  const correctChoice = item.kind === "letter" ? item.symbolLower! : item.symbolUpper;

  async function handleChoice(choice: string) {
    const correct = choice === correctChoice;
    await recordAttempt(item.id, "match_it", correct, sessionId);
    onComplete(correct);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div data-testid="match-prompt" className="text-8xl font-black text-amber-300">
        {item.symbolUpper}
      </div>
      <div className="flex gap-6">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleChoice(choice)}
            className="rounded-2xl bg-slate-700 px-10 py-8 text-6xl font-black text-white active:scale-95"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- MatchItActivity.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/activities/MatchItActivity.tsx src/components/activities/MatchItActivity.test.tsx
git commit -m "feat: add Match-it activity for uppercase/lowercase and number matching"
```

---

### Task 10: Create-it activity (block-art coloring canvas)

**Files:**
- Create: `src/components/activities/CreateItActivity.tsx`
- Create: `src/data/artwork.ts` (Dexie table for saved art, extends the schema from Task 2)
- Test: `src/data/artwork.test.ts`
- Test: `src/components/activities/CreateItActivity.test.tsx`

**Interfaces:**
- Consumes: `db` (Task 2, extended here with an `artwork` table via a Dexie version bump)
- Produces (consumed by `LessonRunner`, Task 12, and later the Creative Studio zone in Phase 2):
```typescript
export interface ArtworkRecord { id?: number; itemId: string; dataUrl: string; createdMs: number; }
export async function saveArtwork(itemId: string, dataUrl: string): Promise<ArtworkRecord>;
export async function getArtworkForItem(itemId: string): Promise<ArtworkRecord[]>;

export interface CreateItActivityProps {
  item: LessonItem;
  onComplete: () => void;
}
export default function CreateItActivity(props: CreateItActivityProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test for the artwork data layer**

```typescript
// src/data/artwork.test.ts
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./db";
import { saveArtwork, getArtworkForItem } from "./artwork";

describe("artwork storage", () => {
  beforeEach(async () => {
    await db.artwork.clear();
  });

  it("saves and retrieves artwork for an item", async () => {
    await saveArtwork("letter-A", "data:image/png;base64,AAA");
    const saved = await getArtworkForItem("letter-A");
    expect(saved).toHaveLength(1);
    expect(saved[0].dataUrl).toBe("data:image/png;base64,AAA");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- artwork.test.ts`
Expected: FAIL — `db.artwork` table and `src/data/artwork.ts` do not exist.

- [ ] **Step 3: Bump the Dexie schema version and implement**

```typescript
// src/data/db.ts — MODIFY: add a new versioned store (Dexie requires an explicit version bump, never edit version(1) in place)
// Add directly below the existing `this.version(1).stores({...})` call:
this.version(2).stores({
  attempts: "++id, itemId, sessionId, timestampMs",
  mastery: "itemId, status, lastPlayedMs",
  artwork: "++id, itemId, createdMs",
});
```

Also add to the `VictorQuestDB` class body: `artwork!: Table<ArtworkRecord, number>;` and import `ArtworkRecord` from `../types/lesson` (add it there too, next to `AttemptRecord`):

```typescript
// src/types/lesson.ts — ADD
export interface ArtworkRecord {
  id?: number;
  itemId: string;
  dataUrl: string;
  createdMs: number;
}
```

```typescript
// src/data/artwork.ts
import { db } from "./db";
import type { ArtworkRecord } from "../types/lesson";

export async function saveArtwork(itemId: string, dataUrl: string, nowMs: number = Date.now()): Promise<ArtworkRecord> {
  const id = await db.artwork.add({ itemId, dataUrl, createdMs: nowMs });
  return { id, itemId, dataUrl, createdMs: nowMs };
}

export async function getArtworkForItem(itemId: string): Promise<ArtworkRecord[]> {
  return db.artwork.where("itemId").equals(itemId).toArray();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- artwork.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing component test**

```typescript
// src/components/activities/CreateItActivity.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateItActivity from "./CreateItActivity";
import type { LessonItem } from "../../types/lesson";

vi.mock("../../data/artwork", () => ({ saveArtwork: vi.fn().mockResolvedValue({}) }));

const item: LessonItem = {
  id: "letter-A", kind: "letter", symbolUpper: "A", symbolLower: "a",
  audioEn: "/audio/en_letter-A.mp3", audioVi: "/audio/vi_letter-A.mp3",
  viLabel: "chữ A", distractorPoolIds: ["letter-B"],
};

describe("CreateItActivity", () => {
  it("shows a color palette and a Save button, and calls onComplete after saving", async () => {
    const onComplete = vi.fn();
    render(<CreateItActivity item={item} onComplete={onComplete} />);
    expect(screen.getByTestId("create-canvas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onComplete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Implement**

```typescript
// src/components/activities/CreateItActivity.tsx
import { useRef, useState } from "react";
import type { LessonItem } from "../../types/lesson";
import { saveArtwork } from "../../data/artwork";

export interface CreateItActivityProps {
  item: LessonItem;
  onComplete: () => void;
}

const PALETTE = ["#f87171", "#fbbf24", "#34d399", "#38bdf8", "#a78bfa", "#f472b6"];

export default function CreateItActivity({ item, onComplete }: CreateItActivityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);

  function handlePaint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL("image/png") : "";
    await saveArtwork(item.id, dataUrl);
    onComplete();
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <canvas
        ref={canvasRef}
        data-testid="create-canvas"
        width={480}
        height={480}
        onMouseDown={handlePaint}
        onMouseMove={(e) => e.buttons === 1 && handlePaint(e)}
        className="rounded-3xl border-4 border-slate-600 bg-white"
      />
      <div className="flex gap-3">
        {PALETTE.map((c) => (
          <button
            key={c}
            aria-label={`color ${c}`}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className="h-10 w-10 rounded-full border-2 border-white"
          />
        ))}
      </div>
      <button onClick={handleSave} className="rounded-full bg-emerald-500 px-8 py-4 text-2xl font-bold text-white">
        Save
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- CreateItActivity.test.tsx artwork.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/data/artwork.ts src/data/artwork.test.ts src/data/db.ts src/types/lesson.ts src/components/activities/CreateItActivity.tsx src/components/activities/CreateItActivity.test.tsx
git commit -m "feat: add Create-it block-art canvas activity with saved artwork collectibles"
```

---

### Task 11: Challenge mini-game (Phaser)

**Files:**
- Create: `src/game/ChallengeScene.ts`
- Create: `src/components/activities/ChallengeActivity.tsx`
- Test: `src/game/ChallengeScene.test.ts` (pure scoring logic only — Phaser rendering itself is not unit tested, see note below)
- Test: `src/components/activities/ChallengeActivity.test.tsx`

**Interfaces:**
- Consumes: `LessonItem` (Task 1), `recordAttempt` (Task 2)
- Produces (consumed by `LessonRunner`, Task 12):
```typescript
export function scoreCollectible(targetId: string, collectedId: string): boolean; // pure, testable scoring rule
export interface ChallengeActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void; // correct = collected more right than wrong within the 45s window
}
export default function ChallengeActivity(props: ChallengeActivityProps): JSX.Element;
```

> **Testing note:** Phaser scenes render to a real canvas and are not meaningfully unit-testable in jsdom. Extract every piece of game *logic* (scoring, win/lose threshold, spawn selection) into plain functions that ARE unit tested (`scoreCollectible` below); the Phaser scene itself wires those functions to sprites and input, verified by manual play-test on the dev server plus the Task 16 Playwright smoke test (which only checks the activity mounts and the canvas element appears, not gameplay pixels).

- [ ] **Step 1: Write the failing test for the pure scoring function**

```typescript
// src/game/ChallengeScene.test.ts
import { describe, it, expect } from "vitest";
import { scoreCollectible } from "./ChallengeScene";

describe("scoreCollectible", () => {
  it("is true when the collected id matches the target id", () => {
    expect(scoreCollectible("letter-A", "letter-A")).toBe(true);
  });
  it("is false when the collected id does not match", () => {
    expect(scoreCollectible("letter-A", "letter-B")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ChallengeScene.test.ts`
Expected: FAIL — `src/game/ChallengeScene.ts` does not exist.

- [ ] **Step 3: Implement the scoring function and Phaser scene**

```typescript
// src/game/ChallengeScene.ts
import Phaser from "phaser";
import type { LessonItem } from "../types/lesson";

export function scoreCollectible(targetId: string, collectedId: string): boolean {
  return targetId === collectedId;
}

export interface ChallengeResult {
  correctCollected: number;
  wrongCollected: number;
}

export class ChallengeScene extends Phaser.Scene {
  private target!: LessonItem;
  private pool!: LessonItem[];
  private result: ChallengeResult = { correctCollected: 0, wrongCollected: 0 };
  private onFinish!: (result: ChallengeResult) => void;
  private timeLeftMs = 45_000;

  constructor() {
    super("ChallengeScene");
  }

  init(data: { target: LessonItem; pool: LessonItem[]; onFinish: (result: ChallengeResult) => void }) {
    this.target = data.target;
    this.pool = data.pool;
    this.onFinish = data.onFinish;
    this.result = { correctCollected: 0, wrongCollected: 0 };
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e293b");
    this.spawnBatch();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeftMs -= 1000;
        if (this.timeLeftMs <= 0) this.finish();
      },
    });
  }

  private spawnBatch() {
    const candidates = [this.target, ...this.pool.filter((p) => p.id !== this.target.id)].slice(0, 6);
    candidates.forEach((item, i) => {
      const x = 100 + i * 120;
      const y = 200 + (i % 2 === 0 ? 0 : 150);
      const text = this.add.text(x, y, item.symbolUpper, { fontSize: "48px", color: "#fbbf24" }).setInteractive();
      text.on("pointerdown", () => {
        const correct = scoreCollectible(this.target.id, item.id);
        if (correct) this.result.correctCollected += 1;
        else this.result.wrongCollected += 1;
        text.destroy();
      });
    });
  }

  private finish() {
    this.onFinish(this.result);
  }
}
```

```typescript
// src/components/activities/ChallengeActivity.tsx
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { ChallengeScene, type ChallengeResult } from "../../game/ChallengeScene";
import type { LessonItem } from "../../types/lesson";
import { recordAttempt } from "../../data/db";

export interface ChallengeActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

export default function ChallengeActivity({ item, allItems, sessionId, onComplete }: ChallengeActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    async function handleFinish(result: ChallengeResult) {
      const wasCorrect = result.correctCollected > result.wrongCollected;
      await recordAttempt(item.id, "challenge", wasCorrect, sessionId);
      onComplete(wasCorrect);
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 480,
      parent: containerRef.current,
      scene: [ChallengeScene],
    });

    game.scene.start("ChallengeScene", { target: item, pool: allItems, onFinish: handleFinish });

    return () => game.destroy(true);
  }, [item, allItems, sessionId, onComplete]);

  return <div ref={containerRef} data-testid="challenge-canvas-host" />;
}
```

- [ ] **Step 4: Run scoring test to verify it passes**

Run: `npm run test -- ChallengeScene.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing mount test for the component (mocks Phaser — no real canvas rendering in jsdom)**

```typescript
// src/components/activities/ChallengeActivity.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChallengeActivity from "./ChallengeActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

vi.mock("phaser", () => ({
  default: {
    AUTO: 0,
    Game: vi.fn().mockImplementation(() => ({
      scene: { start: vi.fn() },
      destroy: vi.fn(),
    })),
    Scene: class {},
  },
}));

describe("ChallengeActivity", () => {
  it("mounts a canvas host div for Phaser to attach to", () => {
    const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    render(
      <ChallengeActivity item={item} allItems={starterVillagePack.items} sessionId="s1" onComplete={vi.fn()} />
    );
    expect(screen.getByTestId("challenge-canvas-host")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- ChallengeActivity.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/game/ src/components/activities/ChallengeActivity.tsx src/components/activities/ChallengeActivity.test.tsx
git commit -m "feat: add Phaser-based Challenge mini-game with pure, unit-tested scoring logic"
```

---

### Task 12: Lesson orchestrator (LessonRunner)

**Files:**
- Create: `src/components/LessonRunner.tsx`
- Test: `src/components/LessonRunner.test.tsx`

**Interfaces:**
- Consumes: all 5 activity components (Tasks 7–11), `LessonItem`, `LessonPack` (Task 1)
- Produces (consumed by `StarterVillageMap`, Task 13):
```typescript
export interface LessonRunnerProps {
  item: LessonItem;
  pack: LessonPack;
  sessionId: string;
  onLessonComplete: (result: { itemId: string; activitiesCorrect: number; activitiesTotal: number }) => void;
}
export default function LessonRunner(props: LessonRunnerProps): JSX.Element;
```

Sequences the 5 activities per the spec's 5-part loop. Per the spec's "rotate activities so it does not feel like school," Discover always runs first (it's the introduction) and Challenge always runs last (it's the culminating mini-game); Find it, Match it, and Create it run in a shuffled order in between, re-randomized on every lesson entry.

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/LessonRunner.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LessonRunner from "./LessonRunner";
import { starterVillagePack } from "../data/lessonPacks/starter-village";

vi.mock("./activities/DiscoverActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={onComplete}>discover-done</button>,
}));
vi.mock("./activities/FindItActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(true)}>find-it-done</button>,
}));
vi.mock("./activities/MatchItActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(true)}>match-it-done</button>,
}));
vi.mock("./activities/CreateItActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={onComplete}>create-it-done</button>,
}));
vi.mock("./activities/ChallengeActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(true)}>challenge-done</button>,
}));

describe("LessonRunner", () => {
  it("runs Discover first, Challenge last, and calls onLessonComplete after all 5 activities finish", async () => {
    const onLessonComplete = vi.fn();
    const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    render(
      <LessonRunner item={item} pack={starterVillagePack} sessionId="s1" onLessonComplete={onLessonComplete} />
    );

    expect(screen.getByText("discover-done")).toBeInTheDocument();
    fireEvent.click(screen.getByText("discover-done"));

    // three middle activities in some order — click whichever renders each time, 3 times
    for (let i = 0; i < 3; i++) {
      const btn = await screen.findByText(/-done$/);
      expect(btn.textContent).not.toBe("discover-done");
      expect(btn.textContent).not.toBe("challenge-done");
      fireEvent.click(btn);
    }

    expect(await screen.findByText("challenge-done")).toBeInTheDocument();
    fireEvent.click(screen.getByText("challenge-done"));

    await waitFor(() => expect(onLessonComplete).toHaveBeenCalledOnce());
    const result = onLessonComplete.mock.calls[0][0];
    expect(result.itemId).toBe("letter-A");
    expect(result.activitiesTotal).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- LessonRunner.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/components/LessonRunner.tsx
import { useMemo, useState } from "react";
import type { LessonItem, LessonPack } from "../types/lesson";
import DiscoverActivity from "./activities/DiscoverActivity";
import FindItActivity from "./activities/FindItActivity";
import MatchItActivity from "./activities/MatchItActivity";
import CreateItActivity from "./activities/CreateItActivity";
import ChallengeActivity from "./activities/ChallengeActivity";

type Step = "discover" | "find_it" | "match_it" | "create_it" | "challenge";

export interface LessonRunnerProps {
  item: LessonItem;
  pack: LessonPack;
  sessionId: string;
  onLessonComplete: (result: { itemId: string; activitiesCorrect: number; activitiesTotal: number }) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function LessonRunner({ item, pack, sessionId, onLessonComplete }: LessonRunnerProps) {
  const steps = useMemo<Step[]>(
    () => ["discover", ...shuffle(["find_it", "match_it", "create_it"] as Step[]), "challenge"],
    [item.id]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  function advance(wasCorrect: boolean) {
    const nextCorrect = correctCount + (wasCorrect ? 1 : 0);
    if (stepIndex === steps.length - 1) {
      onLessonComplete({ itemId: item.id, activitiesCorrect: nextCorrect, activitiesTotal: steps.length });
      return;
    }
    setCorrectCount(nextCorrect);
    setStepIndex(stepIndex + 1);
  }

  const step = steps[stepIndex];
  switch (step) {
    case "discover":
      return <DiscoverActivity item={item} onComplete={() => advance(true)} />;
    case "find_it":
      return <FindItActivity item={item} allItems={pack.items} sessionId={sessionId} onComplete={advance} />;
    case "match_it":
      return <MatchItActivity item={item} sessionId={sessionId} onComplete={advance} />;
    case "create_it":
      return <CreateItActivity item={item} onComplete={() => advance(true)} />;
    case "challenge":
      return <ChallengeActivity item={item} allItems={pack.items} sessionId={sessionId} onComplete={advance} />;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- LessonRunner.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/LessonRunner.tsx src/components/LessonRunner.test.tsx
git commit -m "feat: add LessonRunner orchestrating the 5-part lesson loop with shuffled middle activities"
```

---

### Task 13: Starter Village level map

**Files:**
- Create: `src/components/StarterVillageMap.tsx`
- Test: `src/components/StarterVillageMap.test.tsx`

**Interfaces:**
- Consumes: `LessonPack`, `MasteryRecord` (Task 1), `getAllMastery` (Task 2), `LessonRunner` (Task 12)
- Produces (consumed by `App.tsx`):
```typescript
export interface StarterVillageMapProps {
  pack: LessonPack;
  sessionId: string;
}
export default function StarterVillageMap(props: StarterVillageMapProps): JSX.Element;
```

Renders one tappable node per item in `pack.items`. All 10 Starter Village items are unlocked from the start (per spec: "Starter Village: First five letters and numbers 0-4, highly guided" — no gating within this single small zone; item-level locking between zones is a Phase 2 concern once Alphabet Forest/Number Mine exist). Each node shows the symbol and a mastery-status badge (new/practicing/nearly_mastered/mastered) sourced live from Dexie. Tapping a node opens `LessonRunner` for that item in a full-screen overlay; completing the lesson returns to the map with the badge refreshed.

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/StarterVillageMap.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StarterVillageMap from "./StarterVillageMap";
import { starterVillagePack } from "../data/lessonPacks/starter-village";

vi.mock("../data/db", () => ({
  getAllMastery: vi.fn().mockResolvedValue([
    { itemId: "letter-A", status: "mastered", totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0, lastCorrectMs: 0 },
  ]),
}));
vi.mock("./LessonRunner", () => ({
  default: ({ onLessonComplete }: any) => (
    <button onClick={() => onLessonComplete({ itemId: "letter-B", activitiesCorrect: 5, activitiesTotal: 5 })}>
      finish-lesson
    </button>
  ),
}));

describe("StarterVillageMap", () => {
  it("renders 10 nodes and shows letter-A's mastered badge from live data", async () => {
    render(<StarterVillageMap pack={starterVillagePack} sessionId="s1" />);
    expect(await screen.findAllByTestId(/^village-node-/)).toHaveLength(10);
    expect(screen.getByTestId("village-node-letter-A")).toHaveTextContent(/mastered/i);
  });

  it("opens LessonRunner on tap and returns to the map after lesson completion", async () => {
    render(<StarterVillageMap pack={starterVillagePack} sessionId="s1" />);
    await waitFor(() => screen.getAllByTestId(/^village-node-/));
    fireEvent.click(screen.getByTestId("village-node-letter-B"));
    expect(await screen.findByText("finish-lesson")).toBeInTheDocument();
    fireEvent.click(screen.getByText("finish-lesson"));
    await waitFor(() => expect(screen.queryByText("finish-lesson")).not.toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- StarterVillageMap.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/components/StarterVillageMap.tsx
import { useEffect, useState } from "react";
import type { LessonPack, MasteryRecord, LessonItem } from "../types/lesson";
import { getAllMastery } from "../data/db";
import LessonRunner from "./LessonRunner";

export interface StarterVillageMapProps {
  pack: LessonPack;
  sessionId: string;
}

export default function StarterVillageMap({ pack, sessionId }: StarterVillageMapProps) {
  const [masteryByItem, setMasteryByItem] = useState<Record<string, MasteryRecord>>({});
  const [activeItem, setActiveItem] = useState<LessonItem | null>(null);

  async function refreshMastery() {
    const all = await getAllMastery();
    setMasteryByItem(Object.fromEntries(all.map((m) => [m.itemId, m])));
  }

  useEffect(() => {
    void refreshMastery();
  }, []);

  if (activeItem) {
    return (
      <LessonRunner
        item={activeItem}
        pack={pack}
        sessionId={sessionId}
        onLessonComplete={async () => {
          await refreshMastery();
          setActiveItem(null);
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-5 gap-6 p-10">
      {pack.items.map((item) => {
        const status = masteryByItem[item.id]?.status ?? "new";
        return (
          <button
            key={item.id}
            data-testid={`village-node-${item.id}`}
            onClick={() => setActiveItem(item)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-slate-800 p-6"
          >
            <span className="text-5xl font-black text-white">{item.symbolUpper}</span>
            <span className="text-sm uppercase tracking-wide text-emerald-300">{status}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- StarterVillageMap.test.tsx`
Expected: PASS

- [ ] **Step 5: Wire into `App.tsx`**

```typescript
// src/App.tsx — replace the placeholder body with:
import { useMemo } from "react";
import StarterVillageMap from "./components/StarterVillageMap";
import { starterVillagePack } from "./data/lessonPacks/starter-village";

export default function App() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  return (
    <div data-testid="app-shell" className="h-screen w-screen bg-slate-900 text-white">
      <StarterVillageMap pack={starterVillagePack} sessionId={sessionId} />
    </div>
  );
}
```

Update `src/App.test.tsx`'s render to account for the async mastery fetch if needed (wrap assertions in `waitFor` or keep the existing `app-shell` assertion, which is synchronous and still valid).

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: PASS (all suites)

- [ ] **Step 7: Commit**

```bash
git add src/components/StarterVillageMap.tsx src/components/StarterVillageMap.test.tsx src/App.tsx
git commit -m "feat: add Starter Village level map wired into App as the entry screen"
```

---

### Task 14: Parent gate

**Files:**
- Create: `src/components/ParentGate.tsx`
- Test: `src/components/ParentGate.test.tsx`

**Interfaces:**
- Produces (consumed by `App.tsx` routing to `ParentDashboard`, Task 15):
```typescript
export interface ParentGateProps {
  onUnlock: () => void;
  holdMs?: number; // default 3000, overridable for fast tests
}
export default function ParentGate(props: ParentGateProps): JSX.Element;
```

Mechanism per spec: hold a button for 3 seconds, then answer a randomly generated two-digit math question (e.g. `47 + 12 = ?`) before `onUnlock` fires.

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/ParentGate.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ParentGate from "./ParentGate";

describe("ParentGate", () => {
  it("shows a math question only after holding the gate button, and unlocks only on the correct answer", async () => {
    vi.useFakeTimers();
    const onUnlock = vi.fn();
    render(<ParentGate onUnlock={onUnlock} holdMs={100} />);

    expect(screen.queryByTestId("parent-math-question")).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("parent-gate-hold"));
    vi.advanceTimersByTime(150);
    await waitFor(() => expect(screen.getByTestId("parent-math-question")).toBeInTheDocument());

    const question = screen.getByTestId("parent-math-question").textContent ?? "";
    const match = question.match(/(\d+)\s*\+\s*(\d+)/);
    expect(match).not.toBeNull();
    const [, a, b] = match!;
    const correctAnswer = String(Number(a) + Number(b));

    fireEvent.change(screen.getByTestId("parent-math-input"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onUnlock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("parent-math-input"), { target: { value: correctAnswer } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onUnlock).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("does not show the math question if the hold is released early", () => {
    vi.useFakeTimers();
    render(<ParentGate onUnlock={vi.fn()} holdMs={3000} />);
    fireEvent.mouseDown(screen.getByTestId("parent-gate-hold"));
    vi.advanceTimersByTime(500);
    fireEvent.mouseUp(screen.getByTestId("parent-gate-hold"));
    vi.advanceTimersByTime(3000);
    expect(screen.queryByTestId("parent-math-question")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ParentGate.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/components/ParentGate.tsx
import { useRef, useState } from "react";

export interface ParentGateProps {
  onUnlock: () => void;
  holdMs?: number;
}

function randomTwoDigit(): number {
  return Math.floor(Math.random() * 90) + 10; // 10-99
}

export default function ParentGate({ onUnlock, holdMs = 3000 }: ParentGateProps) {
  const [question, setQuestion] = useState<{ a: number; b: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startHold() {
    timerRef.current = setTimeout(() => {
      setQuestion({ a: randomTwoDigit(), b: randomTwoDigit() });
    }, holdMs);
  }

  function cancelHold() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function submit() {
    if (!question) return;
    if (Number(answer) === question.a + question.b) {
      onUnlock();
    } else {
      setError(true);
      setAnswer("");
    }
  }

  if (question) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p data-testid="parent-math-question" className="text-3xl text-white">
          {question.a} + {question.b} = ?
        </p>
        <input
          data-testid="parent-math-input"
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="rounded-lg border p-2 text-xl"
        />
        <button onClick={submit} className="rounded-full bg-emerald-500 px-6 py-3 text-white">
          Submit
        </button>
        {error && <p className="text-red-400">Try again</p>}
      </div>
    );
  }

  return (
    <button
      data-testid="parent-gate-hold"
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className="fixed bottom-2 right-2 h-8 w-8 rounded-full bg-slate-700 opacity-40"
      aria-label="Parent settings"
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- ParentGate.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ParentGate.tsx src/components/ParentGate.test.tsx
git commit -m "feat: add parent gate — 3s hold + two-digit math challenge"
```

---

### Task 15: Parent dashboard (V1)

**Files:**
- Create: `src/components/ParentDashboard.tsx`
- Test: `src/components/ParentDashboard.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `getAllMastery` (Task 2), `MasteryRecord` (Task 1), `starterVillagePack` (Task 4), `ParentGate` (Task 14)
- V1 dashboard scope, matching the spec's Parent Dashboard section for exactly what this slice's data supports: mastery status per item, per-item attempts/correct/last-played, and an English-vs-Vietnamese note (deferred to real per-language accuracy — see below). **Smart review queue (confusable pairs) and full session-time/volume controls are explicitly deferred to Phase 2**, since with only 10 items and no confusable-pair metadata wired into `MasteryRecord` yet, a meaningful review queue needs the fuller item set; a placeholder section says so rather than faking data.

> **Known V1 gap, called out on purpose:** `AttemptRecord`/`MasteryRecord` as defined in Task 1 do not currently track which language (EN/VI) an attempt happened in, because in the bilingual-always model every attempt exposes the learner to both languages every time — there is no meaningful "EN accuracy vs VI accuracy" split when both are always shown together. If John wants a real EN-vs-VI performance split later (e.g. after Phase 2 adds an optional language mode), that requires adding a `language` field to `AttemptRecord` and is a schema change, not a dashboard-only change — flag it as a Phase 2 decision rather than building a fake number now.

```typescript
export interface ParentDashboardProps {
  onClose: () => void;
}
export default function ParentDashboard(props: ParentDashboardProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/ParentDashboard.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ParentDashboard from "./ParentDashboard";

vi.mock("../data/db", () => ({
  getAllMastery: vi.fn().mockResolvedValue([
    { itemId: "letter-A", status: "mastered", totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 1000, lastCorrectMs: 1000 },
    { itemId: "number-0", status: "practicing", totalAttempts: 2, correctAttempts: 1, sessionsWithAttempt: ["s1"], lastPlayedMs: 900, lastCorrectMs: 900 },
  ]),
}));

describe("ParentDashboard", () => {
  it("renders a row per item with accuracy computed from correct/total attempts", async () => {
    render(<ParentDashboard onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("dashboard-row-letter-A")).toBeInTheDocument());
    expect(screen.getByTestId("dashboard-row-letter-A")).toHaveTextContent("100%");
    expect(screen.getByTestId("dashboard-row-number-0")).toHaveTextContent("50%");
  });

  it("calls onClose when the close button is tapped", async () => {
    const onClose = vi.fn();
    render(<ParentDashboard onClose={onClose} />);
    await waitFor(() => screen.getByTestId("dashboard-row-letter-A"));
    screen.getByRole("button", { name: /close/i }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ParentDashboard.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/components/ParentDashboard.tsx
import { useEffect, useState } from "react";
import type { MasteryRecord } from "../types/lesson";
import { getAllMastery } from "../data/db";

export interface ParentDashboardProps {
  onClose: () => void;
}

export default function ParentDashboard({ onClose }: ParentDashboardProps) {
  const [records, setRecords] = useState<MasteryRecord[]>([]);

  useEffect(() => {
    void getAllMastery().then(setRecords);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 bg-slate-900 p-8 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parent Dashboard — Starter Village</h1>
        <button onClick={onClose} className="rounded-full bg-slate-700 px-4 py-2">
          Close
        </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm uppercase text-slate-400">
            <th>Item</th><th>Status</th><th>Accuracy</th><th>Attempts</th><th>Last Played</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const accuracy = r.totalAttempts === 0 ? 0 : Math.round((r.correctAttempts / r.totalAttempts) * 100);
            return (
              <tr key={r.itemId} data-testid={`dashboard-row-${r.itemId}`}>
                <td>{r.itemId}</td>
                <td>{r.status}</td>
                <td>{accuracy}%</td>
                <td>{r.correctAttempts}/{r.totalAttempts}</td>
                <td>{new Date(r.lastPlayedMs).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-slate-400">
        Smart review queue (confusable pairs) and daily session/volume controls ship in Phase 2, once
        the full A–Z/0–20 content set exists — a 10-item slice doesn't have enough confusable pairs to
        make that feature meaningful yet.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- ParentDashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Wire `ParentGate` + `ParentDashboard` into `App.tsx`**

```typescript
// src/App.tsx — final V1 version
import { useMemo, useState } from "react";
import StarterVillageMap from "./components/StarterVillageMap";
import ParentGate from "./components/ParentGate";
import ParentDashboard from "./components/ParentDashboard";
import { starterVillagePack } from "./data/lessonPacks/starter-village";

export default function App() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div data-testid="app-shell" className="h-screen w-screen bg-slate-900 text-white">
      {dashboardOpen ? (
        <ParentDashboard onClose={() => setDashboardOpen(false)} />
      ) : (
        <>
          <StarterVillageMap pack={starterVillagePack} sessionId={sessionId} />
          <ParentGate onUnlock={() => setDashboardOpen(true)} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: PASS (all suites)

- [ ] **Step 7: Commit**

```bash
git add src/components/ParentDashboard.tsx src/components/ParentDashboard.test.tsx src/App.tsx
git commit -m "feat: add V1 parent dashboard and wire parent gate into the app shell"
```

---

### Task 16: Offline install smoke test (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/offline-install.spec.ts`
- Modify: `package.json` (add `test:e2e` script)

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Configure Playwright**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run build && npm run preview -- --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 1600, height: 1000 }, // tablet landscape target
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 3: Write the failing test**

```typescript
// tests/e2e/offline-install.spec.ts
import { test, expect } from "@playwright/test";

test("app loads, registers a service worker, and still renders after going offline", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-shell")).toBeVisible();

  // wait for the service worker to activate
  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true));

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("app-shell")).toBeVisible();

  // the Starter Village map should still render 10 nodes fully offline
  await expect(page.locator('[data-testid^="village-node-"]')).toHaveCount(10);
});

test("tapping a village node opens a lesson and Discover shows the symbol offline", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true));
  await context.setOffline(true);
  await page.reload();

  await page.getByTestId("village-node-letter-A").click();
  await expect(page.getByTestId("discover-symbol")).toHaveText("A");
});
```

- [ ] **Step 4: Add the script and run**

```json
// package.json — add to "scripts"
"test:e2e": "playwright test"
```

Run: `npm run test:e2e`
Expected: PASS — both scenarios. If the service worker isn't registering, re-check Task 6's `VitePWA` config (`registerType`, `workbox.globPatterns` must include `mp3` and `json`) before touching test code.

- [ ] **Step 5: Manual, on-device verification checklist (not scripted — do this by hand on the actual tablet)**

1. Open Chrome on the Samsung S10 Ultra, navigate to the dev/preview URL served from the same network.
2. Chrome menu → "Install app" (or the install banner) → confirm it installs to the home screen with the correct icon and name "Block Quest".
3. Launch from the home screen icon — confirm it opens full-screen (no browser chrome), landscape.
4. Turn on Airplane Mode. Relaunch the installed app. Confirm the Starter Village map and at least one full lesson (all 5 activities) work with zero network.
5. Play a lesson to `mastered` status (6+ attempts, ≥80% correct, across 2 separate app-close/reopen sessions) and confirm the parent dashboard reflects it.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e/ package.json
git commit -m "test: add Playwright offline-install smoke test and on-device verification checklist"
```

---

## Self-Review Notes (per the writing-plans skill's required self-check)

- **Spec coverage:** Discover/Find-it/Match-it/Create-it/Challenge (Tasks 7–11) ✓. Bilingual-always audio (Task 5, 7) ✓. Offline PWA (Task 6, 16) ✓. IndexedDB via Dexie (Task 2) ✓. JSON lesson packs (Task 4) ✓. Mastery rule exact thresholds + decay (Task 3) ✓. Parent gate exact mechanism (Task 14) ✓. Parent dashboard mastery/accuracy/attempts/last-played (Task 15) ✓. Pre-generated audio, no runtime TTS, no exposed API key (Task 5) ✓. Rewards/XP/collectible blocks: **partially covered** — Create-it produces a saved collectible (artwork), but XP points and a level-map "unlock next zone" progression are explicitly Phase 2+ (there's only one zone in this slice, so "unlocking the next zone" has nothing to unlock into yet — noted in Global Constraints). Smart review queue and session/volume controls: explicitly deferred, documented in Task 15's dashboard copy rather than silently dropped.
- **Placeholder scan:** no TBD/TODO/"add appropriate" language in any step; every code step has complete, runnable code.
- **Type consistency:** `LessonItem`, `LessonPack`, `AttemptRecord`, `MasteryRecord`, `ArtworkRecord` are defined once in Task 1/Task 10 and imported (never redefined) in every later task. `recordAttempt(itemId, activityType, correct, sessionId, nowMs?)` signature is identical everywhere it's called (Tasks 8, 9, 11). `MasteryStatus` string values (`new`/`practicing`/`nearly_mastered`/`mastered`) are consistent between Task 3's engine and Task 13/15's UI rendering.

---

## Future Phases (roadmap only — NOT detailed task plans, write these fresh once V1 ships and is validated on the tablet)

- **Phase 2 — Full content + review queue:** expand `lessonPacks` to the remaining 21 letters and 16 numbers (Alphabet Forest, Number Mine zones); add `language` field to `AttemptRecord` if a real EN/VI split becomes worth building; build the smart review queue for confusable pairs (`b/d`, `p/q`, `6/9`, `12/20`) — needs a `confusablePairs` content field added to the `LessonItem`/schema; add session time-limit and audio-volume parent controls.
- **Phase 3 — Creative Studio + rewards economy:** full block-town builder using earned Create-it artwork + new cosmetic items; XP and level-map "unlock next zone" progression once Phase 2 gives it something to unlock; avatar cosmetics.
- **Phase 4 — Dance & Celebration Stage, Skyline Swing Course:** generic beat-driven celebration screens (non-copyrighted); generic web-swing-style Phaser traversal mini-game reusing the Challenge scene's scoring pattern.
- **Phase 5 — Optional cloud sync:** Supabase/Firebase backend for multi-child profiles and parental cloud backup — explicitly out of scope until a V1 has real play data to justify it.
- **Audio library completion:** once Phase 2 content lands, regenerate the full audio library via `scripts/generate-audio.mjs` (Task 5) run manually off-device with a real `ELEVENLABS_API_KEY`, after validating Vietnamese voice quality on the small V1 batch already shipped.
