import { NextResponse } from "next/server";
import {
  getPioneerApiKey,
  listTrainingJobsRaw,
  normalizeJobs,
  sortJobsByRecency,
} from "@/lib/pioneer";
import type { PioneerJob } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/models — COMPLETED jobs only (for fine-tuned inference).
 * GET /api/models?allStatuses=1 — all jobs + counts (debug why list is empty).
 */
export async function GET(req: Request) {
  if (!getPioneerApiKey()) {
    return NextResponse.json({
      jobs: [] as PioneerJob[],
      hint: "Set PIONEER_API_KEY in .env.local",
    });
  }
  const { searchParams } = new URL(req.url);
  const allStatuses = searchParams.get("allStatuses") === "1";

  try {
    const raw = await listTrainingJobsRaw();
    const all = normalizeJobs(raw);
    const completedOnly = all.filter((j) => j.status === "COMPLETED");
    const completed = sortJobsByRecency(completedOnly);

    if (allStatuses) {
      return NextResponse.json({
        jobs: completed,
        allJobs: all,
        counts: {
          total: all.length,
          completed: completed.length,
        },
        note:
          completed.length === 0 && all.length > 0
            ? "Jobs exist but none are COMPLETED yet; wait for training or use ?allStatuses=1 to inspect."
            : undefined,
      });
    }

    return NextResponse.json({ jobs: completed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list jobs";
    return NextResponse.json(
      {
        jobs: [] as PioneerJob[],
        error: message,
        hint:
          "Pioneer returned an error. Check key, credits, and PIONEER_BASE_URL.",
      },
      { status: 502 }
    );
  }
}
