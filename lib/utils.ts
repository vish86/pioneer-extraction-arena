import type { InferenceEntity } from "./types";

export function avgConfidence(entities: InferenceEntity[]): number {
  if (entities.length === 0) return 0;
  return (
    entities.reduce((s, e) => s + e.score, 0) / entities.length
  );
}

/** Demo-only proxy scores — not ground-truth F1. */
export function syntheticMetrics(
  entities: InferenceEntity[],
  isBase: boolean
): { f1: number; precision: number; recall: number } {
  const base = avgConfidence(entities);
  const noise = () => (Math.random() - 0.5) * 0.04;
  const f1Raw = isBase
    ? base - 0.18 + noise()
    : base + 0.06 + noise();
  const f1 = clamp(f1Raw, 0.35, 0.99);
  const precision = clamp(f1 + (Math.random() - 0.5) * 0.06, 0.3, 0.99);
  const recall = clamp(f1 + (Math.random() - 0.5) * 0.06, 0.3, 0.99);
  return { f1, precision, recall };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function latencyColor(ms: number): string {
  if (ms < 200) return "var(--accent)";
  if (ms < 500) return "var(--warning)";
  return "var(--danger)";
}

export function f1Color(f1: number): string {
  if (f1 >= 0.9) return "var(--accent)";
  if (f1 >= 0.75) return "var(--warning)";
  return "var(--danger)";
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function attachOffsets(
  text: string,
  entities: InferenceEntity[]
): InferenceEntity[] {
  const lower = text.toLowerCase();
  return entities.map((e) => {
    if (e.start !== undefined && e.end !== undefined) return e;
    const idx = lower.indexOf(e.text.toLowerCase());
    if (idx < 0) return e;
    return { ...e, start: idx, end: idx + e.text.length };
  });
}

export function sortEntitiesByStart(
  entities: InferenceEntity[]
): InferenceEntity[] {
  return [...entities].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
}
