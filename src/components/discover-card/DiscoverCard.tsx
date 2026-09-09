import { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

type Locale = "ar" | "he" | "en";

type Props = {
  locale?: Locale;
  title: string;
  description: string;
  onPress: () => void;
};

// Metro needs static string literals to resolve requires - can't build the
// path from `locale` at runtime, so each language's video is required
// separately here and looked up below. Mirrors DiscoverCard.web.tsx.
const VIDEO_BY_LOCALE: Record<Locale, number> = {
  ar: require("./discover-video-ar.mp4"),
  he: require("./discover-video-he.mp4"),
  en: require("./discover-video-en.mp4"),
};

/** Same pattern as HelpCardLottie.tsx / WantToHelpCard.tsx: text is baked into each per-language video, no overlay. */
export default function DiscoverCard({ locale = "ar", title, onPress }: Props) {
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
        accessibilityLabel={title}
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
