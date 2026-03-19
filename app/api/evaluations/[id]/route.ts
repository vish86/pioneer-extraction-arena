import { NextResponse } from "next/server";
import { getEvaluation, getPioneerApiKey } from "@/lib/pioneer";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!getPioneerApiKey()) {
    return NextResponse.json({ error: "No API key" }, { status: 503 });
  }
  try {
    const data = await getEvaluation(id);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
