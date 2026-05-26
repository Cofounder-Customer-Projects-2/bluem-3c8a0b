import { ImageResponse } from "next/og";

// Edge-rendered favicon. Renders the Cofounder olive caret diamond on the
// warm-cream surface so the seeded deploy carries a brand-marked tab even
// before the customer overrides this file with their own.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f1f1ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          background: "#879e3e",
          transform: "rotate(45deg)",
        }}
      />
    </div>,
    { ...size },
  );
}
