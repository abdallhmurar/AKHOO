import { useEffect, useState } from "react";

type Locale = "ar" | "he" | "en";

const COPY = {
  ar: { title: "بدي مساعدة", subtitle: "أحتاج مساعدة الآن من شخص قريب", rtl: true },
  he: { title: "אני צריך עזרה", subtitle: "אני זקוק לעזרה עכשיו ממישהו קרוב", rtl: true },
  en: { title: "I need help", subtitle: "I need help now from someone nearby", rtl: false },
} as const;

type Props = {
  locale?: Locale;
  onPress: () => void;
};

const videoAsset = require("./help-card-video.mp4");
const videoUri = typeof videoAsset === "string" ? videoAsset : videoAsset.uri;

const RAKKAS_FONT_LINK_ID = "help-card-rakkas-font";

export default function HelpCardLottie({ locale = "ar", onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const copy = COPY[locale] ?? COPY.ar;

  useEffect(() => {
    if (document.getElementById(RAKKAS_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = RAKKAS_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rakkas&display=swap";
    document.head.appendChild(link);
  }, []);

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
          right: "6%",
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
            fontFamily: "'Rakkas', cursive",
            color: "#CE2029",
            fontSize: 42,
            fontWeight: 400,
            lineHeight: 1.15,
            textShadow: "0 1px 2px rgba(255,255,255,0.6)",
          }}
        >
          {copy.title}
        </span>
        <span
          style={{
            fontFamily: "'Rakkas', cursive",
            color: "#111111",
            fontSize: 34,
            fontWeight: 400,
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
