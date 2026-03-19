import { NextResponse } from "next/server";
import { getPioneerApiKey, getPioneerBaseUrl } from "@/lib/pioneer";
import { normalizeDeployments } from "@/lib/deployments";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getPioneerApiKey()) {
    return NextResponse.json({ deployments: [] });
  }
  try {
    const res = await fetch(
      `${getPioneerBaseUrl().replace(/\/$/, "")}/felix/deployments`,
      {
        headers: { "X-API-Key": getPioneerApiKey()! },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({
        deployments: [] as ReturnType<typeof normalizeDeployments>,
        error: t || `HTTP ${res.status}`,
      });
    }
    const data = await res.json();
    return NextResponse.json({ deployments: normalizeDeployments(data) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ deployments: [], error: message });
  }
}
