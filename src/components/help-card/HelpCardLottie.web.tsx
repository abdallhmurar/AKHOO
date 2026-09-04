import { useState } from "react";

type Locale = "ar" | "he" | "en";

const COPY = {
  ar: { text: "بدي مساعدة من أخوو", rtl: true },
  he: { text: "אני צריך עזרה מאחוו", rtl: true },
  en: { text: "I need help from AKHOO", rtl: false },
} as const;

type Props = {
  locale?: Locale;
  onPress: () => void;
};

const videoAsset = require("./help-card-video.mp4");
const videoUri = typeof videoAsset === "string" ? videoAsset : videoAsset.uri;

export default function HelpCardLottie({ locale = "ar", onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const copy = COPY[locale] ?? COPY.ar;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPress();
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1905 / 826",
        overflow: "hidden",
        borderRadius: 24,
        background: "transparent",
        cursor: "pointer",
        border: "none",
        padding: 0,
        display: "block",
        transform: pressed ? "scale(0.985)" : "scale(1)",
        transition: "transform 0.16s ease",
      }}
    >
      <video
        src={videoUri}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            direction: copy.rtl ? "rtl" : "ltr",
            color: "#0B1F33",
            fontSize: 22,
            fontWeight: 800,
            padding: "10px 22px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(4px)",
            whiteSpace: "nowrap",
          }}
        >
          {copy.text}
        </span>
      </div>
    </div>
  );
}
