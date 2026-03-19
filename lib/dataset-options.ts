/** Merge API datasets with defaults; dedupe; sort A→Z */
export function buildDatasetOptions(
  apiList: { name: string }[],
  ensurePresent: string[]
): { name: string }[] {
  const seen = new Set<string>();
  const out: { name: string }[] = [];
  for (const x of apiList) {
    const n = String(x.name ?? "").trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push({ name: n });
  }
  for (const raw of ensurePresent) {
    const n = raw.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push({ name: n });
  }
  out.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
  return out;
}
