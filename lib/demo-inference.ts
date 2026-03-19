import type { InferenceEntity } from "./types";

/** Heuristic demo extraction when Pioneer is unavailable. */
export function simulateInference(
  text: string,
  schema: string[],
  isBase: boolean
): { entities: InferenceEntity[]; latency_ms: number } {
  const words = text.split(/\s+/).filter(Boolean);
  const count = isBase
    ? 4 + Math.floor(Math.random() * 2)
    : 7 + Math.floor(Math.random() * 3);
  const entities: InferenceEntity[] = [];
  let w = 0;
  for (let i = 0; i < count && w < words.length; i++) {
    const label = schema[i % schema.length];
    const len = 1 + Math.floor(Math.random() * 3);
    const chunk = words.slice(w, w + len).join(" ");
    w += len;
    if (!chunk) continue;
    const score = isBase
      ? 0.55 + Math.random() * 0.2
      : 0.78 + Math.random() * 0.18;
    entities.push({ text: chunk, label, score });
  }
  const latency_ms = isBase
    ? 130 + Math.floor(Math.random() * 40)
    : 105 + Math.floor(Math.random() * 30);
  return { entities, latency_ms };
}
