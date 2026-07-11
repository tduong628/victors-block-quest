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
    void playSequential([en, vi]); // English first, then Vietnamese always, per the bilingual-always rule
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
