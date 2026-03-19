"use client";

import { useMemo } from "react";
import type { DomainKey, LeaderboardEntry } from "@/lib/types";
import { f1Color, latencyColor, timeAgo } from "@/lib/utils";
import { getDomain } from "@/lib/scenarios";

type Props = {
  entries: LeaderboardEntry[];
  domain: DomainKey;
  scope: "domain" | "all";
  onScope: (s: "domain" | "all") => void;
};

export function Leaderboard({ entries, domain, scope, onScope }: Props) {
  const filtered = useMemo(() => {
    const list =
      scope === "all"
        ? [...entries]
        : entries.filter((e) => e.domain === domain);
    return [...list].sort((a, b) => b.f1 - a.f1);
  }, [entries, domain, scope]);

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-3 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-display text-lg font-bold uppercase tracking-widest text-[var(--accent)]">
              🏆 Leaderboard
            </div>
            <div className="font-mono text-[10px] text-[var(--text-dim)]">
              Ranked by F1 (est.)
            </div>
          </div>
          <div className="flex rounded border border-[var(--border)] p-0.5">
            <button
              type="button"
              onClick={() => onScope("domain")}
              className={`rounded px-2 py-1 font-mono text-[9px] uppercase ${
                scope === "domain"
                  ? "bg-[var(--accent)] text-black"
                  : "text-[var(--text-dim)]"
              }`}
            >
              This domain
            </button>
            <button
              type="button"
              onClick={() => onScope("all")}
              className={`rounded px-2 py-1 font-mono text-[9px] uppercase ${
                scope === "all"
                  ? "bg-[var(--accent)] text-black"
                  : "text-[var(--text-dim)]"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[28px_1fr_48px_48px_52px] gap-1 border-b border-[var(--border)] px-2 py-2 font-mono text-[9px] uppercase text-[var(--text-dim)] sm:px-3">
        <span>#</span>
        <span>Model</span>
        <span className="text-right">F1</span>
        <span className="text-right">Prec</span>
        <span className="text-right">Time</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((e, i) => {
          const rank = i + 1;
          const d = getDomain(e.domain);
          const medal =
            rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
          return (
            <div
              key={e.id}
              className={`grid grid-cols-[28px_1fr_48px_48px_52px] items-center gap-1 border-b border-[var(--border)] px-2 py-2 text-[10px] sm:px-3 ${
                e.isCurrentRun ? "border-l-2 border-l-[var(--accent)]" : ""
              }`}
            >
              <span className="font-mono text-[var(--text-dim)]">
                {medal ?? rank}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-1">
                  <span
                    className="font-display text-[11px] font-bold uppercase"
                    style={{ color: f1Color(e.f1) }}
                  >
                    {e.modelLabel}
                  </span>
                  <span>{d.emoji}</span>
                  {e.isCurrentRun ? (
                    <span className="rounded bg-[var(--accent-dim)] px-1 font-mono text-[8px] text-[var(--accent)]">
                      YOU
                    </span>
                  ) : null}
                </div>
                <div className="font-mono text-[9px] text-[var(--text-dim)]">
                  {e.entityCount} ent · {e.textLength} chars
                </div>
              </div>
              <span
                className="text-right font-mono"
                style={{ color: f1Color(e.f1) }}
              >
                {e.f1.toFixed(2)}
              </span>
              <span
                className="text-right font-mono text-[var(--text-dim)]"
              >
                {e.precision.toFixed(2)}
              </span>
              <span
                className="text-right font-mono text-[var(--text-dim)]"
                style={{ color: latencyColor(e.latency_ms) }}
              >
                {timeAgo(e.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-[var(--border)] px-3 py-3 text-center text-[9px] text-[var(--text-dim)] sm:px-4">
        Pioneer · Configure{" "}
        <code className="text-[var(--accent)]">PIONEER_API_KEY</code> on Vercel
      </div>
    </div>
  );
}
