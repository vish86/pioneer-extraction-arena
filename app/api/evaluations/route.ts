import { NextResponse } from "next/server";
import {
  getPioneerApiKey,
  getPioneerBaseUrl,
  startEvaluation,
} from "@/lib/pioneer";

export const dynamic = "force-dynamic";

/** POST /felix/evaluations — start benchmark eval */
export async function POST(req: Request) {
  if (!getPioneerApiKey()) {
    return NextResponse.json(
      { error: "PIONEER_API_KEY not configured" },
      { status: 503 }
    );
  }
  try {
    const body = (await req.json()) as {
      base_model: string;
      dataset_name: string;
    };
    if (!body.base_model?.trim() || !body.dataset_name?.trim()) {
      return NextResponse.json(
        { error: "base_model and dataset_name required" },
        { status: 422 }
      );
    }
    const out = await startEvaluation({
      base_model: body.base_model.trim(),
      dataset_name: body.dataset_name.trim(),
    });
    const evalId = out.eval_id ?? out.id;
    return NextResponse.json({ ...out, eval_id: evalId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** GET /felix/evaluations — list evaluations */
export async function GET() {
  if (!getPioneerApiKey()) {
    return NextResponse.json({ evaluations: [], hint: "No API key" });
  }
  try {
    const res = await fetch(
      `${getPioneerBaseUrl().replace(/\/$/, "")}/felix/evaluations`,
      {
        headers: { "X-API-Key": getPioneerApiKey()! },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json(
        { evaluations: [], error: t || `HTTP ${res.status}` },
        { status: res.status === 401 ? 401 : 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ raw: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ evaluations: [], error: message }, { status: 502 });
  }
}
