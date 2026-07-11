import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LessonPack, MasteryRecord, LessonItem, MasteryStatus } from "../types/lesson";
import { getAllMastery } from "../data/db";
import { getDropSnapVariant, getSnapSoft } from "../lib/animation";
import { NODE_LAYOUT, HOME_POSITION, ZONE_GATEWAYS, buildTrailPath } from "../data/villageLayout";
import VoxelTile from "./VoxelTile";
import StatusRing from "./StatusRing";
import LessonRunner from "./LessonRunner";

export interface StarterVillageMapProps {
  pack: LessonPack;
  sessionId: string;
}

const NODE_SIZE = "clamp(88px, 9vw, 150px)";
const STATUS_LABEL: Record<MasteryStatus, string> = {
  new: "new",
  practicing: "practicing",
  nearly_mastered: "nearly mastered",
  mastered: "mastered",
};

function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="var(--surface-raised)" opacity="0.9" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="var(--surface-raised)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="16" r="1.6" fill="var(--ink-mute)" />
    </svg>
  );
}

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
      <path
        d="M4 12l8-7 8 7"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 11v8h12v-8" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
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

  const trailPath = buildTrailPath();

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-safe-area">
      <h1 className="font-ui text-xl font-semibold text-ink">Starter Village</h1>
      <div className="village-map">
        <svg className="village-trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d={trailPath}
            fill="none"
            stroke="var(--tp-300)"
            strokeWidth="1.1"
            strokeDasharray="2.4 2.2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...getSnapSoft(), delay: 0.1 }}
          />
        </svg>

        <div
          className="village-gateway"
          style={{ left: `${HOME_POSITION.x}%`, top: `${HOME_POSITION.y}%` }}
          aria-hidden="true"
        >
          <VoxelTile interactive={false} baseColor="var(--bt-300)" size={64} symbol={<HomeGlyph />} />
        </div>

        {ZONE_GATEWAYS.map((gateway) => (
          <div
            key={gateway.id}
            className="village-gateway flex flex-col items-center gap-1"
            style={{ left: `${gateway.x}%`, top: `${gateway.y}%` }}
            aria-hidden="true"
          >
            <VoxelTile interactive={false} baseColor="var(--ink-mute)" size={56} symbol={<LockGlyph />} />
            <span className="whitespace-nowrap rounded-pill bg-surface-raised/80 px-2 py-0.5 font-ui text-xs text-ink-mute">
              {gateway.label}
            </span>
          </div>
        ))}

        {pack.items.map((item, index) => {
          const record = masteryByItem[item.id];
          const status = record?.status ?? "new";
          const accuracy = record && record.totalAttempts > 0 ? record.correctAttempts / record.totalAttempts : 0;
          const pos = NODE_LAYOUT.find((n) => n.itemId === item.id);
          const baseColor = item.kind === "letter" ? "var(--tc-400)" : "var(--tp-400)";
          const drop = getDropSnapVariant();

          return (
            <motion.button
              key={item.id}
              type="button"
              data-testid={`village-node-${item.id}`}
              aria-label={`${item.kind === "letter" ? "Letter" : "Number"} ${item.symbolUpper}, ${STATUS_LABEL[status]}`}
              onClick={() => setActiveItem(item)}
              className="village-node flex flex-col items-center gap-2"
              style={pos ? { left: `${pos.x}%`, top: `${pos.y}%` } : undefined}
              initial={drop.initial}
              animate={drop.animate}
              transition={{ ...drop.transition, delay: index * 0.05 }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -3 }}
            >
              <VoxelTile
                interactive={false}
                baseColor={baseColor}
                size={NODE_SIZE}
                symbol={item.symbolUpper}
                symbolClassName="text-symbol-map"
                fillRatio={accuracy}
              />
              <span className="flex items-center gap-1.5 rounded-pill bg-surface-raised px-2.5 py-1 shadow-sm">
                <StatusRing status={status} size={18} />
                <span className="font-ui text-xs font-semibold uppercase tracking-[0.04em] text-ink-soft">
                  {STATUS_LABEL[status]}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
