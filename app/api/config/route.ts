import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Defaults for hackathon — override via env on Vercel */
const DEFAULT_TRAINING = "Dataset#0003";
const DEFAULT_EVAL = "Dataset#0004";

export async function GET() {
  const base = process.env.PIONEER_BASE_MODEL_ID?.trim() || "base";
  const hasKey = Boolean(process.env.PIONEER_API_KEY?.trim());
  const trainingDataset =
    process.env.PIONEER_TRAINING_DATASET?.trim() || DEFAULT_TRAINING;
  const evalDataset = process.env.PIONEER_EVAL_DATASET?.trim() || DEFAULT_EVAL;
  const hackathonTitle =
    process.env.PIONEER_HACKATHON_TITLE?.trim() || "Hackathon";
  /** Optional: shown when deployments API is empty */
  const deploymentHint =
    process.env.PIONEER_DEPLOYMENT_HINT?.trim() || "";

  return NextResponse.json({
    baseModelId: base,
    hasApiKey: hasKey,
    hackathonTitle,
    trainingDataset,
    evalDataset,
    deploymentHint,
  });
}
