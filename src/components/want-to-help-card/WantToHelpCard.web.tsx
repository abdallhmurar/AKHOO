import { useState } from "react";

type Props = {
  title: string;
  description: string;
  onPress: () => void;
};

const videoAsset = require("./want-to-help-video.mp4");
const videoUri = typeof videoAsset === "string" ? videoAsset : videoAsset.uri;

/**
 * Same pattern as the Need Help card: real DOM video, no text overlay yet -
 * checking the video alone first before deciding how copy should sit on it.
 */
export default function WantToHelpCard({ title, onPress }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
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
