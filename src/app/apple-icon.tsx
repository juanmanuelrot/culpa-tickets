import { ImageResponse } from "next/og";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";

/*
 * El ícono de home screen en iOS, el mismo dibujo que icon.tsx a 180 px.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function Icon() {
  const { palette } = THEMES[await getSiteTheme()];
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: palette.body,
          borderRadius: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 144,
            height: 128,
            background: palette.lcd,
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.ink,
            fontSize: 118,
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          c
        </div>
      </div>
    ),
    size
  );
}
