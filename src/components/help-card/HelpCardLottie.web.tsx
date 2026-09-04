import { useState } from "react";

type Locale = "ar" | "he" | "en";

type Props = {
  locale?: Locale;
  onPress: () => void;
};

const videoAsset = require("./help-card-video.mp4");
const videoUri = typeof videoAsset === "string" ? videoAsset : videoAsset.uri;

/**
 * Trying a video background instead of photo + Lottie. No text yet - just
 * getting the video itself showing correctly as a clickable button first.
 */
export default function HelpCardLottie({ onPress }: Props) {
  const [pressed, setPressed] = useState(false);

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
    </div>
  );
}
