import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useEffect } from 'react';

function BellIcon({ ringing }) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!ringing) return;
    scale.value = withSequence(
      withTiming(1.45, { duration: 105 }),
      withTiming(1.45, { duration: 105 }),
      withTiming(1.3, { duration: 105 }),
      withTiming(1, { duration: 105 })
    );
    rotate.value = withSequence(
      withTiming(-15, { duration: 105 }),
      withTiming(15, { duration: 105 }),
      withTiming(-10, { duration: 105 }),
      withTiming(0, { duration: 105 })
    );
  }, [ringing]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2a7 7 0 0 0-7 7v3.17L3.29 14H20.7L19 12.17V9a7 7 0 0 0-7-7Z"
          fill="#A0654A"
          opacity="0.85"
        />
        <Path
          d="M10 17a2 2 0 0 0 4 0"
          stroke="#A0654A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </Svg>
    </Animated.View>
  );
}

export default function PhaseLabel({ phase, ringing, phaseKey }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-6);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = -6;
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, [phaseKey]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const label = phase === 'preparation' ? 'Preparation' : 'Meditation';

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <BellIcon ringing={ringing} />
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  text: {
    color: '#A0654A',
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.82,
    fontFamily: 'DMSans_400Regular',
  },
});
