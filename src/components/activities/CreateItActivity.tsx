import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LessonItem } from "../../types/lesson";
import { saveArtwork } from "../../data/artwork";
import { getBrickPop, getHoverLift, getPressTap, getSnapSpring, prefersReducedMotion } from "../../lib/animation";

export interface CreateItActivityProps {
  item: LessonItem;
  onComplete: () => void;
}

const PALETTE = ["#f87171", "#fbbf24", "#34d399", "#38bdf8", "#a78bfa", "#f472b6"];

function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CreateItActivity({ item, onComplete }: CreateItActivityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [collecting, setCollecting] = useState(false);

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
    // toDataURL can throw (jsdom has no canvas backend; real browsers can throw on a
    // security-tainted canvas) — a child's save action must never get stuck on that.
    const canvas = canvasRef.current;
    let dataUrl = "";
    try {
      dataUrl = canvas ? canvas.toDataURL("image/png") : "";
    } catch {
      dataUrl = "";
    }
    await saveArtwork(item.id, dataUrl);
    // Visual-only: drives the shrink-to-corner collectible cue. onComplete fires
    // immediately after saveArtwork resolves, exactly as before this restyle.
    setCollecting(true);
    onComplete();
  }

  const reduced = prefersReducedMotion();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-surface p-safe-area">
      <motion.div
        animate={
          collecting && !reduced
            ? { scale: 0.22, x: 260, y: -220, opacity: 0 }
            : { scale: 1, x: 0, y: 0, opacity: 1 }
        }
        transition={getSnapSpring()}
        className="rounded-block border-4 border-surface-line bg-surface-sunken p-4 shadow-inner"
      >
        <canvas
          ref={canvasRef}
          data-testid="create-canvas"
          width={480}
          height={480}
          onMouseDown={handlePaint}
          onMouseMove={(e) => e.buttons === 1 && handlePaint(e)}
          className="rounded-card bg-surface-raised"
        />
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        {PALETTE.map((c) => {
          const selected = c === color;
          return (
            // Outer button is the 64px hit-slop target (§9); the painted circle inside is
            // the 56px visible swatch — this keeps the visible dot small while satisfying
            // both floors independently rather than growing the swatch to meet hit-slop.
            <motion.button
              key={c}
              aria-label={`color ${c}`}
              onClick={() => setColor(c)}
              whileTap={getPressTap()}
              className="relative flex h-16 w-16 items-center justify-center rounded-pill"
            >
              <motion.span
                animate={reduced ? undefined : { scale: selected ? 1.12 : 1 }}
                transition={getSnapSpring()}
                className="h-14 w-14 rounded-pill border-2 border-ink"
                style={{ backgroundColor: c }}
              />
              {selected && (
                <>
                  <span className="absolute inset-1 rounded-pill ring-4 ring-ink" aria-hidden="true" />
                  <motion.span
                    initial={reduced ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={getBrickPop()}
                    className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-pill bg-ink text-surface"
                    aria-hidden="true"
                  >
                    <CheckGlyph />
                  </motion.span>
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={handleSave}
        whileTap={getPressTap()}
        whileHover={getHoverLift()}
        className="min-h-[56px] rounded-pill bg-teal-pine-500 px-8 py-4 font-ui text-lg font-semibold text-surface shadow-md"
      >
        Save to Collection
      </motion.button>
    </div>
  );
}
