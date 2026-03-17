import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "F&F Tickets";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#B54545",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Top decorative border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "#1A1A1A",
            display: "flex",
          }}
        />
        {/* Bottom decorative border */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "#1A1A1A",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 180,
              fontWeight: 900,
              color: "white",
              letterSpacing: "0.1em",
              lineHeight: 1,
              marginBottom: 16,
              display: "flex",
            }}
          >
            F&F
          </div>
          <div
            style={{
              fontSize: 36,
              color: "rgba(255, 255, 255, 0.9)",
              fontStyle: "italic",
              display: "flex",
            }}
          >
            Solo para nosotros
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
