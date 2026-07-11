import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MasteryRecord, MasteryStatus } from "../types/lesson";
import { getAllMastery } from "../data/db";
import { getPressTap, getHoverLift } from "../lib/animation";
import StatusRing from "./StatusRing";

export interface ParentDashboardProps {
  onClose: () => void;
}

const STATUS_LABEL: Record<MasteryStatus, string> = {
  new: "New",
  practicing: "Practicing",
  nearly_mastered: "Nearly Mastered",
  mastered: "Mastered",
};

export default function ParentDashboard({ onClose }: ParentDashboardProps) {
  const [records, setRecords] = useState<MasteryRecord[]>([]);

  useEffect(() => {
    void getAllMastery().then(setRecords);
  }, []);

  const lastUpdatedMs = records.reduce((max, r) => Math.max(max, r.lastPlayedMs), 0);

  return (
    <div data-surface="parent" className="flex min-h-full w-full flex-col gap-6 overflow-y-auto bg-pd-bg p-8 font-ui text-pd-ink">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ui text-2xl font-bold text-pd-ink">Starter Village — Progress</h1>
          <p className="font-ui text-sm text-pd-ink-soft">
            {lastUpdatedMs > 0 ? `Last updated ${new Date(lastUpdatedMs).toLocaleString()}` : "No sessions recorded yet"}
          </p>
        </div>
        <motion.button
          onClick={onClose}
          whileTap={getPressTap()}
          whileHover={getHoverLift()}
          className="rounded-pd bg-pd-panel px-4 py-2 font-ui text-sm font-semibold text-pd-ink border border-pd-line"
        >
          Close
        </motion.button>
      </div>

      <div className="overflow-auto rounded-pd border border-pd-line bg-pd-panel">
        <table className="w-full text-left font-ui">
          <thead>
            <tr className="sticky top-0 bg-pd-panel text-xs font-semibold uppercase tracking-[0.04em] text-pd-ink-soft">
              <th className="border-b border-pd-line px-4 py-3">Item</th>
              <th className="border-b border-pd-line px-4 py-3">Status</th>
              <th className="border-b border-pd-line px-4 py-3 text-right">Accuracy</th>
              <th className="border-b border-pd-line px-4 py-3 text-right">Attempts</th>
              <th className="border-b border-pd-line px-4 py-3">Last Played</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, index) => {
              const accuracy = r.totalAttempts === 0 ? 0 : Math.round((r.correctAttempts / r.totalAttempts) * 100);
              return (
                <tr
                  key={r.itemId}
                  data-testid={`dashboard-row-${r.itemId}`}
                  className={index % 2 === 1 ? "bg-pd-bg" : "bg-pd-panel"}
                >
                  <td className="border-b border-pd-line px-4 py-2.5 font-medium text-pd-ink">{r.itemId}</td>
                  <td className="border-b border-pd-line px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <StatusRing status={r.status} size={20} />
                      <span className="text-sm font-medium text-pd-ink">{STATUS_LABEL[r.status]}</span>
                    </span>
                  </td>
                  <td className="border-b border-pd-line px-4 py-2.5 text-right">
                    <span className="flex flex-col items-end gap-1">
                      <span className="tabular-nums text-sm font-semibold text-pd-ink">{accuracy}%</span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-pill bg-pd-line">
                        <span
                          className="block h-full rounded-pill bg-pd-accent"
                          style={{ width: `${accuracy}%` }}
                        />
                      </span>
                    </span>
                  </td>
                  <td className="border-b border-pd-line px-4 py-2.5 text-right tabular-nums text-sm text-pd-ink">
                    {r.correctAttempts}/{r.totalAttempts}
                  </td>
                  <td className="border-b border-pd-line px-4 py-2.5 text-sm text-pd-ink-soft">
                    {new Date(r.lastPlayedMs).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-pd-line pt-4 font-ui text-xs italic text-pd-ink-soft">
        Smart review queue (confusable pairs) and daily session/volume controls ship in Phase 2, once
        the full A–Z/0–20 content set exists — a 10-item slice doesn't have enough confusable pairs to
        make that feature meaningful yet.
      </p>
    </div>
  );
}
