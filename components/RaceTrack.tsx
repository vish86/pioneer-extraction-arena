"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import type { ModelConfig } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

type Lane = {
  model: ModelConfig;
  targetMs: number;
};

type Props = {
  active: boolean;
  models: ModelConfig[];
  /** Set when each lane finishes — triggers snap to 100% */
  done: Record<string, boolean>;
  latencies: Record<string, number>;
  entityCounts: Record<string, number>;
  winnerId: string | null;
};

export function RaceTrack({
  active,
  models,
  done,
  latencies,
  entityCounts,
  winnerId,
}: Props) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  const lanes: Lane[] = useMemo(() => {
    return models.map((m) => ({
      model: m,
      targetMs:
        m.isBase === true
          ? 130 + Math.floor(Math.random() * 40)
          : 105 + Math.floor(Math.random() * 30),
    }));
  }, [models]);

  useEffect(() => {
    if (!active) {
      setProgress({});
      return;
    }
    const start = Date.now();
    const initial: Record<string, number> = {};
    lanes.forEach((l) => {
      initial[l.model.id] = 0;
    });
    setProgress(initial);

    const tick = () => {
      const elapsed = Date.now() - start;
      const next: Record<string, number> = {};
      lanes.forEach((l) => {
        const id = l.model.id;
        if (done[id]) {
          next[id] = 100;
        } else {
          const p = Math.min(95, (elapsed / l.targetMs) * 95);
          next[id] = p;
        }
      });
      setProgress(next);
    };
    const id = setInterval(tick, 32);
    return () => clearInterval(id);
  }, [active, lanes, done]);

  useEffect(() => {
    lanes.forEach((l) => {
      if (done[l.model.id]) {
        setProgress((p) => ({ ...p, [l.model.id]: 100 }));
      }
    });
  }, [done, lanes]);

  if (!active && Object.keys(done).length === 0) return null;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2 sm:px-4">
        <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text)]">
          🏁 Race in Progress
        </span>
        {Object.values(done).every(Boolean) && models.length > 0 ? (
          <span className="rounded border border-[var(--accent)] bg-[var(--accent-dim)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
            Complete
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
        {lanes.map((lane) => {
          const id = lane.model.id;
          const pct = progress[id] ?? 0;
          const isDone = done[id];
          const lat = latencies[id];
          const ec = entityCounts[id];
          const win = winnerId === id;
          return (
            <div key={id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide">
                  {win && isDone ? (
                    <Crown className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <span className="w-4" />
                  )}
                  <span style={{ color: lane.model.hexColor }}>
                    {lane.model.label}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[var(--text-dim)]">
                  {isDone && ec !== undefined ? (
                    <>
                      {ec} ent · {lat ?? 0}ms
                    </>
                  ) : (
                    <span className="animate-pulse">…</span>
                  )}
                </div>
              </div>
              <div className="relative h-6 w-full overflow-hidden rounded bg-[var(--surface-2)]">
                <motion.div
                  className="absolute inset-y-0 left-0 flex items-center justify-center bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isDone ? lane.model.hexColor : undefined,
                    opacity: isDone ? 0.85 : 0.35,
                  }}
                  initial={false}
                  animate={{ width: `${pct}%` }}
                />
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] text-[var(--text)] mix-blend-difference"
                  style={{ opacity: 0.9 }}
                >
                  {isDone ? "✓" : `${Math.round(pct)}%`}
                </div>
              </div>
              <AnimatePresence>
                {isDone && ec !== undefined && ec > 0 ? (
                  <div className="flex h-1 gap-px">
                    {Array.from({ length: Math.min(12, ec) }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="h-1 flex-1 rounded-sm"
                        style={{
                          backgroundColor: lane.model.hexColor,
                          opacity: 0.4 + (i % 5) * 0.1,
                        }}
                        title={`entity ${i + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
