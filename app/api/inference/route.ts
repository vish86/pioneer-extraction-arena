import { NextResponse } from "next/server";
import { simulateInference } from "@/lib/demo-inference";
import { getBaseModelId, getPioneerApiKey, runInference } from "@/lib/pioneer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    model_id: string;
    task?: string;
    text: string;
    schema: string[];
    threshold?: number;
  };

  const t0 = Date.now();
  const baseId = getBaseModelId();
  const isBase = body.model_id === baseId || body.model_id === "base";
  const isDemoFt = body.model_id === "demo-ft";

  if (isDemoFt || (!getPioneerApiKey() && !isBase)) {
    const sim = simulateInference(body.text, body.schema, isBase);
    return NextResponse.json({
      entities: sim.entities,
      latency_ms: sim.latency_ms,
      model_id: body.model_id,
      demo: true,
    });
  }

  try {
    if (!getPioneerApiKey()) {
      const sim = simulateInference(body.text, body.schema, Boolean(isBase));
      return NextResponse.json({
        entities: sim.entities,
        latency_ms: sim.latency_ms,
        model_id: body.model_id,
        demo: true,
      });
    }

    const data = await runInference({
      model_id: body.model_id,
      task: "extract_entities",
      text: body.text,
      schema: body.schema,
      threshold: body.threshold,
    });
    const latency_ms = Date.now() - t0;
    return NextResponse.json({
      entities: data.entities ?? [],
      latency_ms,
      model_id: body.model_id,
    });
  } catch {
    const sim = simulateInference(body.text, body.schema, Boolean(isBase));
    return NextResponse.json({
      entities: sim.entities,
      latency_ms: sim.latency_ms,
      model_id: body.model_id,
      demo: true,
    });
  }
}
