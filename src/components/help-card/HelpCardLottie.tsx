import React, { useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LottieView from "lottie-react-native";

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

export default function HelpCardLottie({
  locale = "ar",
  onPress,
}: Props) {
  const pressed = useRef(new Animated.Value(0)).current;
  const copy = useMemo(() => COPY[locale] ?? COPY.ar, [locale]);

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
        accessibilityLabel={`${copy.title}. ${copy.line1}. ${copy.line2}`}
      >
        {/* ONE background only. Do not create a second card or blue panel. */}
        <Image
          source={require("./help-card-background-clean.png")}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />

        {/* Transparent animation overlay only. pointerEvents lives on this
            wrapper, not LottieView itself - this project's installed
            lottie-react-native version doesn't type that prop on LottieView. */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LottieView
            source={require("./help-card-3d-motion.json")}
            autoPlay
            loop
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Native text = changes with app language. */}
        <View pointerEvents="none" style={styles.copy}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[
              styles.title,
              {
                textAlign: copy.rtl ? "right" : "left",
                writingDirection: copy.rtl ? "rtl" : "ltr",
              },
            ]}
          >
            {copy.title}
          </Text>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[
              styles.line,
              {
                textAlign: copy.rtl ? "right" : "left",
                writingDirection: copy.rtl ? "rtl" : "ltr",
              },
            ]}
          >
            {copy.line1}
          </Text>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[
              styles.line,
              {
                textAlign: copy.rtl ? "right" : "left",
                writingDirection: copy.rtl ? "rtl" : "ltr",
              },
            ]}
          >
            {copy.line2}
          </Text>
        </View>
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
  copy: {
    position: "absolute",
    top: "24%",
    right: "5.5%",
    width: "42%",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  line: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 28,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.16)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
