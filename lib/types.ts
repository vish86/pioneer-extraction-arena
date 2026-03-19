export type TaskType = "extract_entities" | "classify_text" | "extract_json";

export type JobStatus =
  | "STARTING"
  | "TRAINING"
  | "COMPLETED"
  | "FAILED"
  | "STOPPED";

export type DomainKey = "medical" | "legal" | "sales" | "news";

export type RaceState = "idle" | "racing" | "complete";

export type InferenceEntity = {
  text: string;
  label: string;
  score: number;
  start?: number;
  end?: number;
};

export type ModelConfig = {
  id: string;
  label: string;
  hexColor: string;
  isBase?: boolean;
};

export type ModelRaceResult = {
  model: ModelConfig;
  latency_ms: number;
  entities: InferenceEntity[];
  avgConfidence: number;
  entityCount: number;
  f1: number;
  precision: number;
  recall: number;
};

export type RunResult = {
  id: string;
  timestamp: number;
  domain: DomainKey;
  textLength: number;
  models: ModelRaceResult[];
  winner: string;
  deltaF1: number;
};

export type LeaderboardEntry = {
  id: string;
  rank?: number;
  modelLabel: string;
  modelId: string;
  domain: DomainKey;
  f1: number;
  precision: number;
  recall: number;
  latency_ms: number;
  entityCount: number;
  textLength: number;
  timestamp: number;
  isCurrentRun?: boolean;
};

/** Milliseconds since epoch — from Pioneer timestamps when present; used to pick latest job */
export type PioneerJob = {
  job_id: string;
  model_name: string;
  status: JobStatus;
  metrics?: { f1?: number; precision?: number; recall?: number };
  sortKeyMs?: number;
};
