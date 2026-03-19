"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import type {
  DomainKey,
  InferenceEntity,
  LeaderboardEntry,
  ModelConfig,
  ModelRaceResult,
  RaceState,
} from "@/lib/types";
import { getDomain } from "@/lib/scenarios";
import {
  addEntries,
  filterByDomain,
  loadLeaderboard,
  saveLeaderboard,
} from "@/lib/leaderboard";
import { attachOffsets, syntheticMetrics } from "@/lib/utils";
import { DomainSelector } from "./DomainSelector";
import { TextInputPanel } from "./TextInputPanel";
import { RaceTrack } from "./RaceTrack";
import { ExtractionCanvas } from "./ExtractionCanvas";
import { ScoreReveal } from "./ScoreReveal";
import { Leaderboard } from "./Leaderboard";
import { FineTunePanel } from "./FineTunePanel";
import { HackathonBar } from "./HackathonBar";
import { EvalPanel } from "./EvalPanel";

type InferenceMode = "unset" | "live" | "mixed" | "synthetic";

export function Arena() {
  const [domain, setDomain] = useState<DomainKey>("medical");
  const [text, setText] = useState(() => getDomain("medical").sample);
  const [raceState, setRaceState] = useState<RaceState>("idle");
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [results, setResults] = useState<ModelRaceResult[]>([]);
  const [entitiesByModel, setEntitiesByModel] = useState<
    Record<string, InferenceEntity[]>
  >({});
  const [laneDone, setLaneDone] = useState<Record<string, boolean>>({});
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [deltaF1, setDeltaF1] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scope, setScope] = useState<"domain" | "all">("domain");
  const [showFineTune, setShowFineTune] = useState(false);
  /** Non-completed jobs exist — fine-tuned lane stays demo until one COMPLETED */
  const [jobStatusHint, setJobStatusHint] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>("unset");

  const refreshModels = useCallback(async () => {
    const [cfg, jobsRes] = await Promise.all([
      fetch("/api/config").then((r) => r.json()) as Promise<{
        baseModelId: string;
        hasApiKey?: boolean;
      }>,
      fetch("/api/models?allStatuses=1").then((r) => r.json()) as Promise<{
        jobs: Array<{
          job_id: string;
          model_name: string;
          sortKeyMs?: number;
        }>;
        counts?: { total: number; completed: number };
      }>,
    ]);
    setHasApiKey(Boolean(cfg.hasApiKey));
    const jobs = jobsRes.jobs ?? [];
    const c = jobsRes.counts;
    if (c && c.total > 0 && c.completed === 0) {
      setJobStatusHint(
        `${c.total} training job(s) on Pioneer — none COMPLETED yet. Fine-tuned lane uses demo until a job finishes (this page rechecks every 15s).`
      );
    } else {
      setJobStatusHint(null);
    }
    /** Newest job when Pioneer sends timestamps; else last item (API often lists oldest first) */
    const hasTs = jobs.some((j) => (j.sortKeyMs ?? 0) > 0);
    const ft =
      jobs.length === 0
        ? null
        : hasTs
          ? jobs[0]
          : jobs[jobs.length - 1];
    const base: ModelConfig = {
      id: cfg.baseModelId ?? "base",
      label: "Base GLiNER",
      hexColor: "#9ca3af",
      isBase: true,
    };
    const second: ModelConfig = ft
      ? {
          id: ft.job_id,
          label: ft.model_name || "Fine-tuned GLiNER",
          hexColor: "#00ff88",
        }
      : {
          id: "demo-ft",
          label: "Fine-tuned GLiNER (demo)",
          hexColor: "#00ff88",
        };
    setModels([base, second]);
  }, []);

  useEffect(() => {
    setLeaderboard(loadLeaderboard());
    void refreshModels();
  }, [refreshModels]);

  /** Poll for COMPLETED jobs while only non-completed jobs exist */
  useEffect(() => {
    if (!jobStatusHint?.includes("none COMPLETED")) return;
    const id = setInterval(() => void refreshModels(), 15000);
    return () => clearInterval(id);
  }, [jobStatusHint, refreshModels]);

  const onDomainChange = (k: DomainKey) => {
    setDomain(k);
    setText(getDomain(k).sample);
    setRaceState("idle");
    setResults([]);
    setEntitiesByModel({});
  };

  const runExtraction = async () => {
    if (!text.trim() || models.length < 2) return;
    setRaceState("racing");
    setResults([]);
    setEntitiesByModel({});
    setLaneDone({});
    setLatencies({});
    setEntityCounts({});
    setWinnerId(null);

    const schema = getDomain(domain).schema;
    let anyDemo = false;
    let anyLive = false;

    const settled = await Promise.allSettled(
      models.map((m) =>
        fetch("/api/inference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_id: m.id,
            task: "extract_entities",
            text,
            schema,
            threshold: 0.5,
          }),
        }).then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "inference failed");
          return { model: m, data };
        })
      )
    );

    const nextEntities: Record<string, InferenceEntity[]> = {};
    const nextResults: ModelRaceResult[] = [];
    const done: Record<string, boolean> = {};
    const lat: Record<string, number> = {};
    const ec: Record<string, number> = {};

    settled.forEach((s, i) => {
      const m = models[i];
      if (s.status !== "fulfilled") {
        done[m.id] = true;
        return;
      }
      const { data } = s.value;
      if (data.demo === true) anyDemo = true;
      else anyLive = true;
      const raw = (data.entities ?? []) as InferenceEntity[];
      const entities = attachOffsets(text, raw);
      nextEntities[m.id] = entities;
      const latency = Number(data.latency_ms ?? 0);
      lat[m.id] = latency;
      ec[m.id] = entities.length;
      done[m.id] = true;
      const met = syntheticMetrics(entities, Boolean(m.isBase));
      nextResults.push({
        model: m,
        latency_ms: latency,
        entities,
        avgConfidence:
          entities.length === 0
            ? 0
            : entities.reduce((a, e) => a + e.score, 0) / entities.length,
        entityCount: entities.length,
        f1: met.f1,
        precision: met.precision,
        recall: met.recall,
      });
    });

    setLaneDone(done);
    setLatencies(lat);
    setEntityCounts(ec);
    setEntitiesByModel(nextEntities);
    setResults(nextResults);

    let win = nextResults[0]?.model.id ?? "";
    let best = -1;
    nextResults.forEach((r) => {
      if (r.f1 > best) {
        best = r.f1;
        win = r.model.id;
      }
    });
    setWinnerId(win);

    const baseR = nextResults.find((r) => r.model.isBase);
    const ftR = nextResults.find((r) => !r.model.isBase);
    const d =
      baseR && ftR ? Math.max(0, ftR.f1 - baseR.f1) : 0;
    setDeltaF1(d);

    const entries: LeaderboardEntry[] = nextResults.map((r) => ({
      id: `${Date.now()}-${r.model.id}`,
      modelLabel: r.model.label,
      modelId: r.model.id,
      domain,
      f1: r.f1,
      precision: r.precision,
      recall: r.recall,
      latency_ms: r.latency_ms,
      entityCount: r.entityCount,
      textLength: text.length,
      timestamp: Date.now(),
      isCurrentRun: true,
    }));
    const prev = loadLeaderboard().map((e) => ({ ...e, isCurrentRun: false }));
    const final = addEntries(prev, entries);
    saveLeaderboard(final);
    setLeaderboard(final);

    if (anyDemo && anyLive) setInferenceMode("mixed");
    else if (anyDemo) setInferenceMode("synthetic");
    else if (anyLive) setInferenceMode("live");
    else setInferenceMode("synthetic");

    setRaceState("complete");
  };

  const listForBoard = useMemo(() => {
    return filterByDomain(leaderboard, scope === "all" ? "all" : domain);
  }, [leaderboard, scope, domain]);

  const onFineTuneComplete = (jobId: string) => {
    void refreshModels();
    setModels((prev) => {
      const base = prev[0];
      if (!base) return prev;
      return [
        base,
        {
          id: jobId,
          label: "Fine-tuned GLiNER",
          hexColor: "#00ff88",
        },
      ];
    });
  };

  return (
    <div className="flex h-screen min-h-0 flex-col md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-[58] flex-col overflow-hidden border-b border-[var(--border)] md:border-b-0 md:border-r">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:px-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-widest text-[var(--accent)]">
              PIONEER
            </span>
            <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
              Extraction Arena
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-[var(--accent)] bg-[var(--accent-dim)] px-2 py-0.5 font-mono text-[9px] text-[var(--accent)]">
              LIVE
            </span>
            <span
              className="rounded border px-2 py-0.5 font-mono text-[9px]"
              style={{
                borderColor:
                  !hasApiKey
                    ? "var(--text-dim)"
                    : inferenceMode === "live"
                      ? "var(--accent)"
                      : inferenceMode === "mixed"
                        ? "var(--warning)"
                        : inferenceMode === "synthetic"
                          ? "var(--warning)"
                          : "var(--border-bright)",
                color:
                  !hasApiKey
                    ? "var(--text-dim)"
                    : inferenceMode === "live"
                      ? "var(--accent)"
                      : "var(--text-dim)",
              }}
              title="After Run Extraction: Live = Pioneer API response; Synthetic = fallback demo"
            >
              Inference:{" "}
              {!hasApiKey
                ? "no key (demo)"
                : inferenceMode === "unset"
                  ? "—"
                  : inferenceMode === "live"
                    ? "Live API"
                    : inferenceMode === "mixed"
                      ? "Mixed"
                      : "Synthetic"}
            </span>
            <Link
              href="https://pioneer.ai"
              className="font-mono text-[10px] text-[var(--text-dim)] hover:text-[var(--accent)]"
            >
              pioneer.ai →
            </Link>
          </div>
        </header>
        <HackathonBar />
        <EvalPanel models={models} />
        {jobStatusHint ? (
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 sm:px-4">
            <p className="font-mono text-[10px] leading-relaxed text-[var(--warning)]">
              {jobStatusHint}
            </p>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DomainSelector active={domain} onChange={onDomainChange} />
          <TextInputPanel
            domain={domain}
            text={text}
            onTextChange={setText}
            disabled={raceState === "racing"}
            modelCount={models.length || 2}
            onRun={() => void runExtraction()}
            onClear={() => setText("")}
          />
          <RaceTrack
            active={raceState === "racing" || raceState === "complete"}
            models={models}
            done={laneDone}
            latencies={latencies}
            entityCounts={entityCounts}
            winnerId={winnerId}
          />
          {raceState === "complete" && results.length > 0 ? (
            <>
              <ExtractionCanvas
                domain={domain}
                text={text}
                models={models}
                entitiesByModel={entitiesByModel}
              />
              <ScoreReveal
                results={results}
                winnerId={winnerId ?? ""}
                deltaF1={deltaF1}
                charCount={text.length}
              />
            </>
          ) : null}
        </div>
        <div className="shrink-0 border-t border-[var(--border)] p-3">
          <button
            type="button"
            onClick={() => setShowFineTune(true)}
            className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[var(--accent)] py-2 font-display text-xs font-bold uppercase text-[var(--accent)] hover:bg-[var(--accent-dim)]"
          >
            <FlaskConical className="h-4 w-4" />
            Fine-tune →
          </button>
        </div>
      </div>
      <div className="flex min-h-[40vh] min-w-0 flex-[42] flex-col md:min-h-0">
        <Leaderboard
          entries={listForBoard}
          domain={domain}
          scope={scope}
          onScope={setScope}
        />
      </div>
      <FineTunePanel
        open={showFineTune}
        onClose={() => setShowFineTune(false)}
        domain={domain}
        onComplete={onFineTuneComplete}
      />
    </div>
  );
}
