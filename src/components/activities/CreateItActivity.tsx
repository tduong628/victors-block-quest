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
