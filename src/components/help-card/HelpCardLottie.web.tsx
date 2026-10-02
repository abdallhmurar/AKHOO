import { HomeCardArrow } from '../HomeCardArrow'
import { useState } from "react";

type Locale = "ar" | "he" | "en";

type Props = {
  locale?: Locale;
  onPress: () => void;
};

// Metro needs static string literals to resolve requires - can't build the
// path from `locale` at runtime, so each language's video is required
// separately here and looked up below.
function assetUri(asset: unknown): string {
  return typeof asset === "string" ? asset : (asset as { uri: string }).uri;
}
const VIDEO_BY_LOCALE: Record<Locale, string> = {
  ar: assetUri(require("./help-card-video-ar.mp4")),
  he: assetUri(require("./help-card-video-he.mp4")),
  en: assetUri(require("./help-card-video-en.mp4")),
};

/** Text is baked into each per-language video now (from Grok) - no HTML text overlay. */
export default function HelpCardLottie({ locale = "ar", onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const videoUri = VIDEO_BY_LOCALE[locale] ?? VIDEO_BY_LOCALE.ar;

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
        key={locale}
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
      <HomeCardArrow tone="help" locale={locale} />
    </div>
  );
}
