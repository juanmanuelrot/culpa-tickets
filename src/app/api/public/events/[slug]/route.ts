import { NextResponse } from "next/server";
import { getPublicEvent } from "@/lib/public-event";

// Public event details; see getPublicEvent for what each kind of event exposes.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const data = await getPublicEvent(slug);
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // The event page refreshes from here because its HTML is cached at the CDN,
  // so this must always reach the origin.
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
