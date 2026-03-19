"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { DomainKey, InferenceEntity, ModelConfig } from "@/lib/types";
import { getDomain } from "@/lib/scenarios";
import { attachOffsets, sortEntitiesByStart } from "@/lib/utils";

type Props = {
  domain: DomainKey;
  text: string;
  models: ModelConfig[];
  entitiesByModel: Record<string, InferenceEntity[]>;
};

export function ExtractionCanvas({
  domain,
  text,
  models,
  entitiesByModel,
}: Props) {
  const d = getDomain(domain);
  const [tab, setTab] = useState(models[0]?.id ?? "");

  const best = useMemo(() => {
    let max = -1;
    let id = models[0]?.id;
    models.forEach((m) => {
      const ents = entitiesByModel[m.id] ?? [];
      const avg =
        ents.length === 0
          ? 0
          : ents.reduce((s, e) => s + e.score, 0) / ents.length;
      if (avg > max) {
        max = avg;
        id = m.id;
      }
    });
    return id ?? tab;
  }, [models, entitiesByModel, tab]);

  const activeId = tab || best || models[0]?.id;
  const entities = sortEntitiesByStart(
    attachOffsets(text, entitiesByModel[activeId] ?? [])
  );

  const segments = useMemo(() => {
    if (!text) return [];
    const out: Array<
      | { type: "plain"; s: string }
      | { type: "ent"; s: string; label: string; score: number }
    > = [];
    let cursor = 0;
    for (const e of entities) {
      const start = e.start ?? text.indexOf(e.text);
      const end = e.end ?? start + e.text.length;
      if (start < 0) continue;
      if (start > cursor) {
        out.push({ type: "plain", s: text.slice(cursor, start) });
      }
      out.push({
        type: "ent",
        s: text.slice(start, end),
        label: e.label,
        score: e.score,
      });
      cursor = end;
    }
    if (cursor < text.length) {
      out.push({ type: "plain", s: text.slice(cursor) });
    }
    if (out.length === 0 && text) out.push({ type: "plain", s: text });
    return out;
  }, [text, entities]);

  const labels = useMemo(() => {
    const set = new Set<string>();
    (entitiesByModel[activeId] ?? []).forEach((e) => set.add(e.label));
    return Array.from(set);
  }, [entitiesByModel, activeId]);

  return (
    <div className="flex flex-col border-b border-[var(--border)]">
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-2 py-2 sm:px-3">
        {models.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setTab(m.id)}
            className={`rounded px-2 py-1 font-display text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
              activeId === m.id
                ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                : "text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-3 py-2">
        {labels.map((lb) => (
          <div key={lb} className="flex items-center gap-1.5 text-[10px]">
            <span
              className="h-2 w-2 rounded-sm"
              style={{
                backgroundColor: d.entityColors[lb] ?? "#888",
              }}
            />
            <span className="font-mono text-[var(--text-dim)]">{lb}</span>
          </div>
        ))}
      </div>
      <div className="px-3 py-4 font-mono text-sm leading-relaxed text-[var(--text)] sm:px-4">
        {segments.map((seg, i) =>
          seg.type === "plain" ? (
            <span key={i}>{seg.s}</span>
          ) : (
            <motion.span
              key={i}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (i % 12) * 0.03 }}
              className="inline-block rounded border px-1 py-0.5"
              style={{
                backgroundColor: `${d.entityColors[seg.label] ?? "#888"}35`,
                borderColor: `${d.entityColors[seg.label] ?? "#888"}40`,
                color: d.entityColors[seg.label] ?? "#e0e0f0",
              }}
              title={`${seg.label} · ${(seg.score * 100).toFixed(1)}%`}
            >
              {seg.s}
            </motion.span>
          )
        )}
      </div>
    </div>
  );
}
