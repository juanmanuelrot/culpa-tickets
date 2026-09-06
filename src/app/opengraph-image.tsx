import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE } from "@/components/og-card";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";

// Runtime de Node (no edge) para poder leer el logo del disco e incrustarlo:
// Satori no resuelve rutas relativas y no queremos que la imagen dependa de
// que el sitio se pueda pedir a sí mismo.
export const runtime = "nodejs";
// La paleta sale de la DB, así que la imagen se genera por request.
export const dynamic = "force-dynamic";

export const alt = "Culpa";
export const size = OG_SIZE;
export const contentType = "image/png";

async function wordmarkDataUri() {
  const file = await readFile(
    path.join(process.cwd(), "public", "culpa-wordmark.png")
  );
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function Image() {
  const theme = THEMES[await getSiteTheme()];
  return new ImageResponse(
    <OgCard wordmarkSrc={await wordmarkDataUri()} theme={theme} />,
    { ...size }
  );
}
