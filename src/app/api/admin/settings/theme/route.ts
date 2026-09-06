import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isThemeName } from "@/lib/theme";
import { getSiteTheme, setSiteTheme } from "@/lib/theme-store";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ theme: await getSiteTheme() });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const theme = body?.theme;
  if (!isThemeName(theme)) {
    return NextResponse.json(
      { error: "theme debe ser 'classic' o 'halloween'" },
      { status: 400 }
    );
  }

  try {
    await setSiteTheme(theme);
    return NextResponse.json({ theme });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
