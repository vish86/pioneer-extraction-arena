import { NextResponse } from "next/server";
import { getPioneerApiKey, getPioneerBaseUrl } from "@/lib/pioneer";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getPioneerApiKey()) {
    return NextResponse.json({ datasets: [] as { name: string }[] });
  }
  try {
    const res = await fetch(
      `${getPioneerBaseUrl().replace(/\/$/, "")}/felix/datasets`,
      {
        headers: {
          "X-API-Key": getPioneerApiKey()!,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return NextResponse.json({ datasets: [] });
    }
    const data = await res.json();
    const list = Array.isArray(data)
      ? data
      : (data as { datasets?: unknown }).datasets;
    const names: { name: string }[] = [];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (typeof item === "string") names.push({ name: item });
        else if (item && typeof item === "object" && "name" in item) {
          names.push({ name: String((item as { name: string }).name) });
        }
      }
    }
    return NextResponse.json({ datasets: names });
  } catch {
    return NextResponse.json({ datasets: [] });
  }
}
