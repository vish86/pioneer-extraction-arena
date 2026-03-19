import { NextResponse } from "next/server";
import { getPioneerApiKey, getTrainingJob } from "@/lib/pioneer";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!getPioneerApiKey()) {
    return NextResponse.json({ error: "No API key" }, { status: 503 });
  }
  const job = await getTrainingJob(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(job);
}
