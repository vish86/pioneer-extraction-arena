import { NextResponse } from "next/server";
import { getPioneerApiKey, startTrainingJob } from "@/lib/pioneer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!getPioneerApiKey()) {
    return NextResponse.json(
      { error: "PIONEER_API_KEY not configured" },
      { status: 503 }
    );
  }
  try {
    const body = (await req.json()) as {
      model_name: string;
      datasets: { name: string }[];
      nr_epochs: number;
      learning_rate: number;
    };
    const out = await startTrainingJob(body);
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Training failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
