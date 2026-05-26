import { ImageResponse } from "next/og";

// Edge-rendered Open Graph image. Renders the seeded landing's editorial
// composition flattened into a single share image — same warm cream and
// charcoal palette, same masthead + headline + sub structure as the page.
// Uses system fonts (Georgia + ui-monospace) to avoid asset-loading
// complexity at the edge; customers can override this file with their own
// branded share card when they are ready to ship.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Day one — Cofounder";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f1f1ee",
        display: "flex",
        flexDirection: "column",
        padding: "72px 96px",
        color: "#202020",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: "ui-monospace, monospace",
          fontSize: 18,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(32,32,32,0.5)",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            background: "#879e3e",
            transform: "rotate(45deg)",
          }}
        />
        <span style={{ color: "rgba(32,32,32,0.8)" }}>Cofounder</span>
        <span style={{ color: "rgba(32,32,32,0.3)" }}>/</span>
        <span>Starter</span>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "auto",
          fontSize: 200,
          lineHeight: 0.92,
          letterSpacing: "-0.025em",
        }}
      >
        Day one.
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 32,
          fontFamily: "ui-monospace, monospace",
          fontSize: 32,
          fontStyle: "italic",
          color: "rgba(32,32,32,0.7)",
        }}
      >
        {"bluem, co-founded in New York."}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 64,
          fontFamily: "ui-monospace, monospace",
          fontSize: 16,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(32,32,32,0.4)",
        }}
      >
        NY · MMXXVI · Work in Progress
      </div>
    </div>,
    { ...size },
  );
}
