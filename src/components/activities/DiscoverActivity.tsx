import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LessonItem } from "../../types/lesson";
import { getItemAudio, playSequential } from "../../audio/manifest";
import { getScaleInVariant, getPressTap, getHoverLift } from "../../lib/animation";

export interface DiscoverActivityProps {
  item: LessonItem;
  onComplete: () => void;
}

// Purely cosmetic playback cue (DESIGN_SPEC.md §5.2) — approximates "EN lights, then VI
// lights" without touching audio/manifest.ts's real playback promise chain, so the audio
// logic and its test contract stay untouched.
const EN_DOT_MS = 1400;

export default function DiscoverActivity({ item, onComplete }: DiscoverActivityProps) {
  const [activeLang, setActiveLang] = useState<"en" | "vi" | null>("en");

  useEffect(() => {
    const { en, vi } = getItemAudio(item.id);
    void playSequential([en, vi]); // English first, then Vietnamese always, per the bilingual-always rule

    setActiveLang("en");
    const toVi = setTimeout(() => setActiveLang("vi"), EN_DOT_MS);
    return () => clearTimeout(toVi);
  }, [item.id]);

  const scaleIn = getScaleInVariant();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-10 bg-surface p-safe-area">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[min(60vw,32rem)] w-[min(60vw,32rem)] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--tc-300), transparent 70%)" }}
      />

      <motion.div
        data-testid="discover-symbol"
        initial={scaleIn.initial}
        animate={scaleIn.animate}
        transition={scaleIn.transition}
        className="relative font-symbol text-symbol-hero font-bold leading-none text-ink"
      >
        {item.symbolUpper}
      </motion.div>

      <div className="relative flex items-center gap-3" aria-hidden="true">
        <span
          className="h-3 w-3 rounded-pill transition-colors duration-normal"
          style={{ background: activeLang === "en" ? "var(--terracotta-ink)" : "var(--surface-line)" }}
        />
        <span className="font-ui text-xs uppercase tracking-[0.08em] text-ink-mute">EN</span>
        <span
          className="ml-3 h-3 w-3 rounded-pill transition-colors duration-normal"
          style={{ background: activeLang === "vi" ? "var(--teal-ink)" : "var(--surface-line)" }}
        />
        <span className="font-ui text-xs uppercase tracking-[0.08em] text-ink-mute" lang="vi">
          VI
        </span>
      </div>

      <motion.button
        onClick={onComplete}
        whileTap={getPressTap()}
        whileHover={getHoverLift()}
        className="relative min-h-[56px] rounded-pill bg-teal-pine-500 px-10 py-4 font-ui text-lg font-semibold text-surface shadow-md"
      >
        Continue
      </motion.button>
    </div>
  );
}
