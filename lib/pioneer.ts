import type { PioneerJob } from "./types";

const DEFAULT_BASE = "https://api.pioneer.ai";

export function getPioneerBaseUrl(): string {
  return process.env.PIONEER_BASE_URL?.trim() || DEFAULT_BASE;
}

export function getPioneerApiKey(): string | undefined {
  const k = process.env.PIONEER_API_KEY?.trim();
  return k || undefined;
}

export function getBaseModelId(): string {
  return process.env.PIONEER_BASE_MODEL_ID?.trim() || "base";
}

async function pioneerFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const key = getPioneerApiKey();
  if (!key) throw new Error("PIONEER_API_KEY not configured");
  const url = `${getPioneerBaseUrl().replace(/\/$/, "")}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
    cache: "no-store",
  });
}

export async function listTrainingJobsRaw(): Promise<unknown> {
  const res = await pioneerFetch("/felix/training-jobs");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Pioneer ${res.status}`);
  }
  return res.json();
}

function extractJobArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  const candidates = [
    p.jobs,
    p.data,
    p.items,
    p.results,
    p.training_jobs,
    Array.isArray(p.data) ? p.data : null,
    p.data && typeof p.data === "object" && Array.isArray((p.data as { jobs?: unknown }).jobs)
      ? (p.data as { jobs: unknown[] }).jobs
      : null,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

export function normalizeJobs(payload: unknown): PioneerJob[] {
  return extractJobArray(payload)
    .map(normalizeOne)
    .filter(Boolean) as PioneerJob[];
}

function parseTimeMs(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" && !Number.isNaN(v)) {
    return v < 1e12 ? v * 1000 : v;
  }
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return undefined;
}

function bestSortKeyMs(o: Record<string, unknown>): number | undefined {
  const candidates = [
    o.completed_at,
    o.completedAt,
    o.finished_at,
    o.finishedAt,
    o.ended_at,
    o.updated_at,
    o.updatedAt,
    o.created_at,
    o.createdAt,
    o.started_at,
    o.startedAt,
  ];
  for (const c of candidates) {
    const ms = parseTimeMs(c);
    if (ms !== undefined) return ms;
  }
  return undefined;
}

function normalizeOne(row: unknown): PioneerJob | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const job_id = String(
    o.job_id ?? o.id ?? o.training_job_id ?? o.jobId ?? ""
  );
  const model_name = String(
    o.model_name ?? o.name ?? o.modelName ?? "model"
  );
  const rawStatus = o.status ?? o.state ?? o.job_status;
  const status = normalizeStatus(rawStatus);
  if (!job_id) return null;
  const metrics = o.metrics as PioneerJob["metrics"] | undefined;
  const sortKeyMs = bestSortKeyMs(o);
  return { job_id, model_name, status, metrics, sortKeyMs };
}

/** Newest first when any job has sortKeyMs; otherwise preserves input order */
export function sortJobsByRecency(jobs: PioneerJob[]): PioneerJob[] {
  const hasAny = jobs.some((j) => (j.sortKeyMs ?? 0) > 0);
  if (!hasAny) return jobs;
  return [...jobs].sort((a, b) => (b.sortKeyMs ?? 0) - (a.sortKeyMs ?? 0));
}

function normalizeStatus(raw: unknown): PioneerJob["status"] {
  const s = String(raw ?? "STARTING").toUpperCase();
  if (
    s === "STARTING" ||
    s === "TRAINING" ||
    s === "COMPLETED" ||
    s === "FAILED" ||
    s === "STOPPED"
  ) {
    return s as PioneerJob["status"];
  }
  if (s === "COMPLETE" || s === "SUCCESS" || s === "SUCCEEDED") {
    return "COMPLETED";
  }
  if (s === "RUNNING" || s === "IN_PROGRESS") {
    return "TRAINING";
  }
  return "STARTING";
}

export async function getTrainingJob(id: string): Promise<PioneerJob | null> {
  const res = await pioneerFetch(`/felix/training-jobs/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeOne(data);
}

export type InferenceRequest = {
  model_id: string;
  task: "extract_entities";
  text: string;
  schema: string[];
  threshold?: number;
};

export type InferenceResponse = {
  entities: Array<{
    text: string;
    label: string;
    score: number;
    start?: number;
    end?: number;
  }>;
};

export async function runInference(
  body: InferenceRequest
): Promise<InferenceResponse> {
  const res = await pioneerFetch("/inference", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      threshold: body.threshold ?? 0.5,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Inference ${res.status}`);
  }
  return res.json() as Promise<InferenceResponse>;
}

export async function startTrainingJob(body: {
  model_name: string;
  datasets: { name: string }[];
  nr_epochs: number;
  learning_rate: number;
}): Promise<{ job_id: string; status: string }> {
  const res = await pioneerFetch("/felix/training-jobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Training ${res.status}`);
  }
  return res.json() as Promise<{ job_id: string; status: string }>;
}

export async function startEvaluation(body: {
  base_model: string;
  dataset_name: string;
}): Promise<{ eval_id?: string; id?: string }> {
  const res = await pioneerFetch("/felix/evaluations", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Evaluation ${res.status}`);
  }
  return res.json() as Promise<{ eval_id?: string; id?: string }>;
}

export async function getEvaluation(id: string): Promise<unknown> {
  const res = await pioneerFetch(
    `/felix/evaluations/${encodeURIComponent(id)}`
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Get evaluation ${res.status}`);
  }
  return res.json();
}
