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
