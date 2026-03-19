"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { ModelConfig } from "@/lib/types";
import { buildDatasetOptions } from "@/lib/dataset-options";

type Props = {
  models: ModelConfig[];
};

function evalLooksComplete(data: Record<string, unknown>): boolean {
  if (data.f1 !== undefined || data.precision !== undefined) return true;
  if (data.status && String(data.status).toUpperCase() === "COMPLETED")
    return true;
  return false;
}

export function EvalPanel({ models }: Props) {
  const [datasets, setDatasets] = useState<{ name: string }[]>([]);
  const [evalDataset, setEvalDataset] = useState("Dataset#0004");
  const [baseModel, setBaseModel] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/datasets").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ])
      .then(
        ([d, cfg]: [
          { datasets?: { name: string }[] },
          { evalDataset?: string; hasApiKey?: boolean },
        ]) => {
          setHasKey(Boolean(cfg.hasApiKey));
          const ev = cfg.evalDataset ?? "Dataset#0004";
          setDatasets(buildDatasetOptions(d.datasets ?? [], [ev]));
          setEvalDataset(ev);
        }
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (models.length === 0) return;
    setBaseModel((prev) => {
      if (prev && models.some((m) => m.id === prev)) return prev;
      return models.find((m) => m.isBase)?.id ?? models[0].id;
    });
  }, [models]);

  const runEval = async () => {
    setError(null);
    setResult(null);
    if (!hasKey) {
      setError("Set PIONEER_API_KEY to run eval");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_model: baseModel,
          dataset_name: evalDataset,
        }),
      });
      const start = await res.json();
      if (!res.ok) {
        setError(start.error ?? "Eval start failed");
        setLoading(false);
        return;
      }
      const evalId = start.eval_id ?? start.id as string | undefined;
      if (!evalId) {
        setError("No eval_id in response");
        setLoading(false);
        return;
      }
      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const gr = await fetch(`/api/evaluations/${encodeURIComponent(evalId)}`);
        const data = (await gr.json()) as Record<string, unknown>;
        if (!gr.ok) {
          setError(String(data.error ?? "Poll failed"));
          break;
        }
        setResult(data);
        if (evalLooksComplete(data)) break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-[var(--info)]" />
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[var(--info)]">
          Benchmark eval
        </span>
        <span className="font-mono text-[9px] text-[var(--text-dim)]">
          Pioneer POST /felix/evaluations
        </span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[140px] flex-1 flex-col gap-0.5 font-mono text-[9px] uppercase text-[var(--text-dim)]">
          Model (base_model)
          <select
            value={baseModel}
            onChange={(e) => setBaseModel(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-[11px] text-[var(--text)]"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.id.length > 12 ? ` (${m.id.slice(0, 8)}…)` : ` (${m.id})`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-0.5 font-mono text-[9px] uppercase text-[var(--text-dim)]">
          Eval dataset
          <select
            value={evalDataset}
            onChange={(e) => setEvalDataset(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-[11px] text-[var(--text)]"
          >
            {datasets.length === 0 ? (
              <option value={evalDataset}>{evalDataset}</option>
            ) : (
              datasets.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))
            )}
          </select>
        </label>
        <button
          type="button"
          disabled={loading || !hasKey}
          onClick={() => void runEval()}
          className="rounded bg-[var(--info)] px-4 py-2 font-display text-[11px] font-bold uppercase tracking-wide text-black hover:brightness-110 disabled:opacity-40"
        >
          {loading ? "Running…" : "Run eval"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 font-mono text-[10px] text-[var(--danger)]">{error}</p>
      ) : null}
      {result ? (
        <pre className="mt-2 max-h-40 overflow-auto rounded border border-[var(--border)] bg-black/30 p-2 font-mono text-[9px] text-[var(--text-dim)]">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
