import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE } from "@/components/og-card";

// Ver la nota en opengraph-image.tsx sobre por qué corre en Node.
export const runtime = "nodejs";

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
  return new ImageResponse(<OgCard wordmarkSrc={await wordmarkDataUri()} />, {
    ...size,
  });
}
