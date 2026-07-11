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
