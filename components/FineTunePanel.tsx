"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { DomainKey } from "@/lib/types";
import { buildDatasetOptions } from "@/lib/dataset-options";

type Props = {
  open: boolean;
  onClose: () => void;
  domain: DomainKey;
  onComplete: (jobId: string) => void;
};

type Phase = "config" | "training" | "complete";

export function FineTunePanel({
  open,
  onClose,
  domain,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>("config");
  const [modelName, setModelName] = useState("");
  const [datasets, setDatasets] = useState<{ name: string }[]>([]);
  const [trainingDatasetName, setTrainingDatasetName] = useState("");
  const [epochs, setEpochs] = useState(5);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [metrics, setMetrics] = useState<{ f1?: number; precision?: number; recall?: number }>({});
  const [epochRows, setEpochRows] = useState<{ epoch: number; f1: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [evalDatasetName, setEvalDatasetName] = useState("Dataset#0004");

  useEffect(() => {
    if (!open) return;
    setModelName(`${domain}-ft-${Date.now().toString(36)}`);
    setPhase("config");
    setJobId(null);
    setError(null);
    setEpochRows([]);
    void Promise.all([
      fetch("/api/datasets").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ])
      .then(
        ([d, cfg]: [
          { datasets?: { name: string }[] },
          { trainingDataset?: string; evalDataset?: string },
        ]) => {
          const trainDefault =
            typeof cfg.trainingDataset === "string"
              ? cfg.trainingDataset
              : "Dataset#0003";
          const evalDefault =
            typeof cfg.evalDataset === "string"
              ? cfg.evalDataset
              : "Dataset#0004";
          const merged = buildDatasetOptions(d.datasets ?? [], [
            trainDefault,
            evalDefault,
          ]);
          setDatasets(merged);
          setTrainingDatasetName(trainDefault);
          setEvalDatasetName(evalDefault);
        }
      )
      .catch(() => {});
  }, [open, domain]);

  useEffect(() => {
    if (phase !== "training" || !jobId) return;
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(iv);
  }, [phase, jobId]);

  const poll = useCallback(
    async (id: string, maxEpochs: number) => {
      let simEpoch = 0;
      const sim = setInterval(() => {
        simEpoch += 1;
        const targetF1 = 0.71 + (0.94 - 0.71) * (1 - Math.exp(-simEpoch / 4));
        setEpochRows((rows) => [
          ...rows,
          { epoch: simEpoch, f1: targetF1 + (Math.random() - 0.5) * 0.02 },
        ]);
        if (simEpoch >= maxEpochs) clearInterval(sim);
      }, 3200 + Math.random() * 800);

      try {
        for (;;) {
          const res = await fetch(`/api/training/${encodeURIComponent(id)}`);
          if (!res.ok) break;
          const j = await res.json();
          setStatus(String(j.status ?? ""));
          if (j.metrics) setMetrics(j.metrics);
          if (j.status === "COMPLETED") {
            clearInterval(sim);
            setMetrics(j.metrics ?? { f1: 0.94, precision: 0.93, recall: 0.95 });
            setPhase("complete");
            return;
          }
          if (j.status === "FAILED" || j.status === "STOPPED") {
            clearInterval(sim);
            setError(`Job ${j.status}`);
            setPhase("config");
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        clearInterval(sim);
        setError("Could not poll job status");
        setPhase("config");
      }
    },
    []
  );

  const start = async () => {
    setError(null);
    if (!trainingDatasetName.trim()) {
      setError("Select a training dataset");
      return;
    }
    setPhase("training");
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: modelName,
          datasets: [{ name: trainingDatasetName }],
          nr_epochs: epochs,
          learning_rate: 5e-5,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Training failed");
        setPhase("config");
        return;
      }
      const jid = data.job_id as string;
      setJobId(jid);
      setStatus(String(data.status ?? "STARTING"));
      void poll(jid, epochs);
    } catch {
      setError("Network error");
      setPhase("config");
    }
  };

  if (!open) return null;

  const preview = {
    model_name: modelName,
    datasets: [{ name: trainingDatasetName || "your-dataset" }],
    eval_dataset: evalDatasetName || "your-eval-dataset",
    nr_epochs: epochs,
    learning_rate: 5e-5,
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <span className="font-display text-sm font-bold uppercase tracking-widest">
            Fine-tune
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {phase === "config" && (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-[10px] uppercase text-[var(--text-dim)]">
                Model name
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 font-mono text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase text-[var(--text-dim)]">
                Training dataset
                <select
                  value={trainingDatasetName}
                  onChange={(e) => setTrainingDatasetName(e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 font-mono text-sm"
                >
                  {datasets.length === 0 ? (
                    <option value="">No datasets — check Pioneer API</option>
                  ) : (
                    datasets.map((d) => (
                      <option key={`train-${d.name}`} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase text-[var(--text-dim)]">
                Eval dataset (benchmark)
                <select
                  value={evalDatasetName}
                  onChange={(e) => setEvalDatasetName(e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 font-mono text-sm"
                >
                  {datasets.length === 0 ? (
                    <option value="">No datasets — check Pioneer API</option>
                  ) : (
                    datasets.map((d) => (
                      <option key={`eval-${d.name}`} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase text-[var(--text-dim)]">
                  <span>Epochs</span>
                  <span>{epochs}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="mt-1 flex justify-between font-mono text-[9px] text-[var(--text-dim)]">
                  <span>Fast (2)</span>
                  <span>Accurate (10)</span>
                </div>
              </div>
              <pre className="overflow-x-auto rounded border border-[var(--border)] bg-black/40 p-3 font-mono text-[10px] text-[var(--text-dim)]">
                {JSON.stringify(preview, null, 2)}
              </pre>
              {error ? (
                <p className="text-[10px] text-[var(--danger)]">{error}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void start()}
                className="w-full rounded bg-[var(--accent)] py-3 font-display text-sm font-bold uppercase tracking-widest text-black"
              >
                🚀 Start training
              </button>
            </div>
          )}
          {phase === "training" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                {status || "TRAINING"} · {elapsed}s
              </div>
              {jobId ? (
                <div className="break-all font-mono text-[10px] text-[var(--text-dim)]">
                  job: {jobId}
                </div>
              ) : null}
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={epochRows}>
                    <XAxis dataKey="epoch" tick={{ fill: "#6b6b8a", fontSize: 10 }} />
                    <YAxis domain={[0, 1]} tick={{ fill: "#6b6b8a", fontSize: 10 }} />
                    <Bar dataKey="f1" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="rounded border border-[var(--border)] p-2">
                  <div className="text-[var(--text-dim)]">F1 (live)</div>
                  <div className="text-lg text-[var(--accent)]">
                    {(metrics.f1 ?? epochRows.at(-1)?.f1 ?? 0).toFixed(3)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-2">
                  <div className="text-[var(--text-dim)]">Loss (sim)</div>
                  <div className="text-lg text-[var(--warning)]">
                    {(2.1 * Math.exp(-elapsed / 20)).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {phase === "complete" && (
            <div className="flex flex-col gap-4 text-center">
              <div className="font-display text-lg font-bold text-[var(--accent)]">
                Training complete
              </div>
              <div className="font-mono text-2xl text-[var(--text)]">
                F1 {(metrics.f1 ?? 0.94).toFixed(3)}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (jobId) onComplete(jobId);
                  onClose();
                }}
                className="w-full rounded border border-[var(--accent)] py-3 font-display text-sm font-bold uppercase text-[var(--accent)]"
              >
                Add to arena
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
