import { useEffect, useState } from "react";

type Locale = "ar" | "he" | "en";

const COPY = {
  ar: {
    title: "بدي مساعدة",
    subtitle: "أحتاج مساعدة الآن من شخص قريب",
    rtl: true,
    fontFamily: "'Lateef', serif",
    titleSize: 44,
    subtitleSize: 32,
  },
  he: {
    title: "אני צריך עזרה",
    subtitle: "אני זקוק לעזרה עכשיו ממישהו קרוב",
    rtl: true,
    fontFamily: "'Gveret Levin', cursive",
    // Handwriting script reads cramped small - sized up a bit more than the others.
    titleSize: 48,
    subtitleSize: 36,
  },
  en: {
    title: "I need help",
    subtitle: "I need help now from someone nearby",
    rtl: false,
    fontFamily: "'Iosevka Charon Mono', monospace",
    // Monospace runs wider per character than the others - sized down so the
    // subtitle doesn't overflow the 60% box, with tighter tracking on the title.
    titleSize: 34,
    subtitleSize: 22,
  },
} as const;

type Props = {
  locale?: Locale;
  onPress: () => void;
};

const videoAsset = require("./help-card-video.mp4");
const videoUri = typeof videoAsset === "string" ? videoAsset : videoAsset.uri;

const FONT_LINK_ID = "help-card-fonts";
const FONT_LINK_HREF =
  "https://fonts.googleapis.com/css2?family=Lateef&family=Gveret+Levin&family=Iosevka+Charon+Mono&display=swap";

export default function HelpCardLottie({ locale = "ar", onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const copy = COPY[locale] ?? COPY.ar;

  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_LINK_HREF;
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
            fontFamily: copy.fontFamily,
            color: "#CE2029",
            fontSize: copy.titleSize,
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: copy.rtl ? undefined : "-0.5px",
            textShadow: "0 1px 2px rgba(255,255,255,0.6)",
          }}
        >
          {copy.title}
        </span>
        <span
          style={{
            fontFamily: copy.fontFamily,
            color: "#111111",
            fontSize: copy.subtitleSize,
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
