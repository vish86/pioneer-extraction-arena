"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { ModelRaceResult } from "@/lib/types";
import { f1Color } from "@/lib/utils";

function useCountUp(target: number, active: boolean, duration = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) {
      setV(0);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - u, 3);
      setV(target * eased);
      if (u < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);
  return v;
}

function ScoreCard({
  r,
  win,
  delay,
}: {
  r: ModelRaceResult;
  win: boolean;
  delay: number;
}) {
  const anim = useCountUp(r.f1, true, 800);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded border p-3 ${
        win
          ? "border-[var(--accent)] bg-[var(--accent-dim)]"
          : "border-[var(--border)] bg-[var(--surface-2)]"
      }`}
      style={{
        boxShadow: win ? "0 0 24px var(--accent-dim)" : undefined,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="font-display text-sm font-bold uppercase"
          style={{ color: r.model.hexColor }}
        >
          {r.model.label}
        </span>
        {win ? (
          <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">
            WINNER
          </span>
        ) : null}
      </div>
      <div
        className="font-display text-4xl font-bold leading-none"
        style={{ color: f1Color(r.f1) }}
      >
        {anim.toFixed(3)}
      </div>
      <div className="text-[10px] text-[var(--text-dim)]">F1 (est.)</div>
      <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[10px] text-[var(--text-dim)]">
        <div>
          <div className="text-[var(--text)]">{r.precision.toFixed(2)}</div>
          <div>Prec</div>
        </div>
        <div>
          <div className="text-[var(--text)]">{r.recall.toFixed(2)}</div>
          <div>Rec</div>
        </div>
        <div>
          <div className="text-[var(--text)]">{r.latency_ms}ms</div>
          <div>Speed</div>
        </div>
      </div>
    </motion.div>
  );
}

type Props = {
  results: ModelRaceResult[];
  winnerId: string;
  deltaF1: number;
  charCount: number;
};

export function ScoreReveal({
  results,
  winnerId,
  deltaF1,
  charCount,
}: Props) {
  const topF1 = Math.max(...results.map((r) => r.f1));
  const showChampion = topF1 > 0.95;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-4 sm:px-4"
    >
      {showChampion ? (
        <div className="mb-3 w-full rounded border border-[var(--accent)] bg-[var(--accent-dim)] py-2 text-center font-display text-sm font-bold uppercase tracking-widest text-[var(--accent)]">
          👑 New Champion! 👑
        </div>
      ) : null}
      <div className="mb-4 text-center">
        <div className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
          Round complete
        </div>
        <div className="font-mono text-[10px] text-[var(--text-dim)]">
          {charCount} chars · {results.length} models
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r, idx) => (
          <ScoreCard
            key={r.model.id}
            r={r}
            win={r.model.id === winnerId}
            delay={idx * 0.1}
          />
        ))}
      </div>
      {deltaF1 > 0.01 ? (
        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-sm text-[var(--accent)]">
          <TrendingUp className="h-4 w-4" />
          Fine-tuned wins by +{deltaF1.toFixed(3)} F1
        </div>
      ) : null}
      <div className="mt-4 rounded border border-dashed border-[var(--border-bright)] p-3 text-center">
        <div className="font-display text-xs font-bold uppercase text-[var(--text)]">
          Want higher accuracy on your domain?
        </div>
        <p className="mt-1 text-[10px] text-[var(--text-dim)]">
          Fine-tune on your data — train from the panel →
        </p>
      </div>
    </motion.div>
  );
}
