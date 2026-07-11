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
