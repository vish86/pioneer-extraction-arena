import type { DomainKey, LeaderboardEntry } from "./types";

const KEY = "pioneer_leaderboard_v1";
const MAX = 50;

function seed(): LeaderboardEntry[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      modelLabel: "Fine-tuned GLiNER v2",
      modelId: "ft_demo",
      domain: "medical",
      f1: 0.97,
      precision: 0.96,
      recall: 0.98,
      latency_ms: 112,
      entityCount: 14,
      textLength: 420,
      timestamp: now - 14 * 60 * 1000,
    },
    {
      id: "seed-2",
      modelLabel: "Fine-tuned GLiNER v1",
      modelId: "ft_demo2",
      domain: "legal",
      f1: 0.93,
      precision: 0.92,
      recall: 0.94,
      latency_ms: 128,
      entityCount: 11,
      textLength: 380,
      timestamp: now - 32 * 60 * 1000,
    },
    {
      id: "seed-3",
      modelLabel: "Base GLiNER",
      modelId: "base",
      domain: "sales",
      f1: 0.71,
      precision: 0.7,
      recall: 0.72,
      latency_ms: 143,
      entityCount: 6,
      textLength: 310,
      timestamp: now - 58 * 60 * 1000,
    },
  ];
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  if (typeof window === "undefined") return;
  const trimmed = entries.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function addEntries(
  current: LeaderboardEntry[],
  newOnes: LeaderboardEntry[]
): LeaderboardEntry[] {
  const merged = [...newOnes, ...current];
  return merged.slice(0, MAX);
}

export function filterByDomain(
  entries: LeaderboardEntry[],
  domain: DomainKey | "all"
): LeaderboardEntry[] {
  if (domain === "all") return [...entries].sort((a, b) => b.f1 - a.f1);
  return entries
    .filter((e) => e.domain === domain)
    .sort((a, b) => b.f1 - a.f1);
}
