import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";

type Locale = "ar" | "he" | "en";

const COPY = {
  ar: {
    title: "بدي مساعدة",
    line1: "عندي مشكلة وبدي حدا",
    line2: "قريب يساعدني بسرعة وأمان",
    rtl: true,
  },
  he: {
    title: "אני צריך עזרה",
    line1: "יש לי בעיה ואני צריך מישהו",
    line2: "קרוב שיעזור לי מהר ובבטחה",
    rtl: true,
  },
  en: {
    title: "I need help",
    line1: "I have a problem and need someone",
    line2: "nearby to help quickly and safely",
    rtl: false,
  },
} as const;

type Props = {
  locale?: Locale;
  onPress: () => void;
};

const backgroundAsset = require("./help-card-background-clean.png");
const backgroundUri = typeof backgroundAsset === "string" ? backgroundAsset : backgroundAsset.uri;
const helpCardMotion = require("./help-card-3d-motion.json");

/**
 * Web: real DOM (img + lottie-web SVG), not React Native's Image/View or
 * lottie-react-native - those go through react-native-web/dotlottie's WASM
 * canvas, which kept painting an opaque backdrop over the photo no matter
 * what was tried. This mirrors the working standalone HTML preview exactly,
 * including preserveAspectRatio, which the earlier lottie-web attempt omitted.
 */
export default function HelpCardLottie({ locale = "ar", onPress }: Props) {
  const lottieRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);
  const copy = COPY[locale] ?? COPY.ar;

  useEffect(() => {
    if (!lottieRef.current) return;
    const anim = lottie.loadAnimation({
      container: lottieRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: helpCardMotion,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    });
    return () => anim.destroy();
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${copy.title}. ${copy.line1}. ${copy.line2}`}
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
      <img
        src={backgroundUri}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          zIndex: 1,
        }}
      />

      <div
        ref={lottieRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
          background: "transparent",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "24%",
          right: "5.5%",
          width: "42%",
          zIndex: 3,
          textAlign: copy.rtl ? "right" : "left",
          direction: copy.rtl ? "rtl" : "ltr",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 36,
            lineHeight: "42px",
            fontWeight: 900,
            marginBottom: 20,
            textShadow: "0 2px 5px rgba(0,0,0,0.22)",
          }}
        >
          {copy.title}
        </div>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 19,
            lineHeight: "28px",
            fontWeight: 600,
            textShadow: "0 1px 4px rgba(0,0,0,0.16)",
          }}
        >
          {copy.line1}
        </div>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 19,
            lineHeight: "28px",
            fontWeight: 600,
            textShadow: "0 1px 4px rgba(0,0,0,0.16)",
          }}
        >
          {copy.line2}
        </div>
      </div>
    </div>
  );
}
