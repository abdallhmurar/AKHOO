import { useState } from "react";

type Locale = "ar" | "he" | "en";

const COPY = {
  ar: { title: "بدي مساعدة", subtitle: "من أخوو", rtl: true },
  he: { title: "אני צריך עזרה", subtitle: "מאחוו", rtl: true },
  en: { title: "I need help", subtitle: "from AKHOO", rtl: false },
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
          top: 0,
          bottom: 0,
          right: copy.rtl ? "6%" : undefined,
          left: copy.rtl ? undefined : "6%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          pointerEvents: "none",
          maxWidth: "60%",
          direction: copy.rtl ? "rtl" : "ltr",
          textAlign: copy.rtl ? "right" : "left",
        }}
      >
        <span
          style={{
            color: "#0F3FBF",
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.15,
            textShadow: "0 1px 2px rgba(255,255,255,0.6)",
          }}
        >
          {copy.title}
        </span>
        <span
          style={{
            color: "#5B7FDB",
            fontSize: 24,
            fontWeight: 600,
            marginTop: 8,
            textShadow: "0 1px 2px rgba(255,255,255,0.6)",
          }}
        >
          {copy.subtitle}
        </span>
      </div>
    </div>
  );
}
