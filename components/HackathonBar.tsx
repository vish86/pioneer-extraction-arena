"use client";

import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";

type Config = {
  hackathonTitle: string;
  trainingDataset: string;
  evalDataset: string;
  deploymentHint: string;
};

type Dep = { id: string; label: string };

export function HackathonBar() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [depErr, setDepErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/config")
      .then((r) => r.json())
      .then((c: Config) => setCfg(c))
      .catch(() => setCfg(null));
    void fetch("/api/deployments")
      .then((r) => r.json())
      .then(
        (d: {
          deployments?: Dep[];
          error?: string;
        }) => {
          setDeps(d.deployments ?? []);
          setDepErr(d.error ?? null);
        }
      )
      .catch(() => setDeps([]));
  }, []);

  if (!cfg) return null;

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 sm:px-4">
      <div className="mb-2 flex items-center gap-2">
        <Rocket className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
          {cfg.hackathonTitle}
        </span>
      </div>
      <div className="grid gap-2 font-mono text-[10px] leading-snug sm:grid-cols-2">
        <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
          <div className="text-[var(--text-dim)]">Training dataset</div>
          <div className="text-[var(--text)]">{cfg.trainingDataset}</div>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
          <div className="text-[var(--text-dim)]">Eval dataset</div>
          <div className="text-[var(--text)]">{cfg.evalDataset}</div>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 sm:col-span-2">
          <div className="text-[var(--text-dim)]">Deployments</div>
          {deps.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-[var(--text)]">
              {deps.map((d) => (
                <li key={d.id}>
                  <span className="text-[var(--accent)]">{d.label}</span>
                  <span className="text-[var(--text-dim)]"> · {d.id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 text-[var(--text-dim)]">
              {cfg.deploymentHint ||
                (depErr
                  ? `Could not load (${depErr.slice(0, 80)})`
                  : "None returned by API — set PIONEER_DEPLOYMENT_HINT to show your deployment name.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
