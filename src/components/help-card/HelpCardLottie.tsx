import { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

type Locale = "ar" | "he" | "en";

type Props = {
  locale?: Locale;
  onPress: () => void;
};

// Metro needs static string literals to resolve requires - can't build the
// path from `locale` at runtime, so each language's video is required
// separately here and looked up below. Mirrors HelpCardLottie.web.tsx.
const VIDEO_BY_LOCALE: Record<Locale, number> = {
  ar: require("./help-card-video-ar.mp4"),
  he: require("./help-card-video-he.mp4"),
  en: require("./help-card-video-en.mp4"),
};

/** Text is baked into each per-language video now (from Grok) - no overlay. */
export default function HelpCardLottie({ locale = "ar", onPress }: Props) {
  const pressed = useRef(new Animated.Value(0)).current;
  const videoSource = VIDEO_BY_LOCALE[locale] ?? VIDEO_BY_LOCALE.ar;

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const animate = (value: number) => {
    Animated.spring(pressed, {
      toValue: value,
      useNativeDriver: true,
      speed: 26,
      bounciness: 4,
    }).start();
  };

  const scale = pressed.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  return (
    <Animated.View style={[styles.root, { transform: [{ scale }] }]}>
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        onPressIn={() => animate(1)}
        onPressOut={() => animate(0)}
        accessibilityRole="button"
      >
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    aspectRatio: 1905 / 826,
  },
  pressable: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "transparent",
  },
});
