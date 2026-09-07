import { ImageResponse } from "next/og";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";

/*
 * El favicon: el celu visto de frente, cuerpo redondeado, LCD y una «c» en
 * tinta. Se dibuja por request para seguir al tema vigente.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const { palette } = THEMES[await getSiteTheme()];
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: palette.body,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 26,
            height: 23,
            background: palette.lcd,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.ink,
            fontSize: 21,
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          c
        </div>
      </div>
    ),
    { ...size, headers: { "cache-control": "public, max-age=300, s-maxage=300" } }
  );
}
