/** Normalize Pioneer GET /felix/deployments response */
export function normalizeDeployments(payload: unknown): Array<{
  id: string;
  label: string;
}> {
  const raw = extractArray(payload);
  const out: Array<{ id: string; label: string }> = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = String(
      o.id ?? o.deployment_id ?? o.deploymentId ?? o.name ?? ""
    );
    if (!id) continue;
    const label = String(o.name ?? o.model_name ?? o.label ?? id);
    out.push({ id, label });
  }
  return out;
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  for (const k of ["deployments", "data", "items", "results"]) {
    const v = p[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}
