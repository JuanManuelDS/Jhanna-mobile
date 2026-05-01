import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { formatMSS } from '../utils/timer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const R = 108;
const CX = 130;
const CY = 130;
const CIRCUMFERENCE = 2 * Math.PI * R;
// Rotate arc to start at 12 o'clock
const START_OFFSET = CIRCUMFERENCE * 0.25;

export default function CircularTimer({ phaseDurationSec, remainingSec, isPaused, phaseKey }) {
  const progress = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(progress);
    const target = remainingSec / phaseDurationSec;
    progress.value = target;
  }, [phaseKey]);

  useEffect(() => {
    cancelAnimation(progress);
    if (isPaused) return;
    const target = 0;
    const durationMs = remainingSec * 1000;
    progress.value = withTiming(target, {
      duration: durationMs,
      easing: Easing.linear,
    });
  }, [isPaused, phaseKey]);

  const animatedProps = useAnimatedProps(() => {
    const dash = CIRCUMFERENCE * progress.value;
    const gap = CIRCUMFERENCE - dash;
    return {
      strokeDasharray: [dash, gap],
    };
  });

  const timeLabel = formatMSS(remainingSec);

  return (
    <View style={styles.wrapper}>
      {/* Ambient glow behind SVG */}
      <View style={styles.glow} />
      <Svg width="260" height="260">
        {/* Track */}
        <Circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#c9a84c"
          strokeWidth="6"
          opacity="0.35"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#D4B856"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDashoffset={-START_OFFSET}
          animatedProps={animatedProps}
        />
        {/* Inner glow ring */}
        <Circle
          cx={CX}
          cy={CY}
          r={R - 14}
          fill="none"
          stroke="#D4B856"
          strokeWidth="1"
          opacity="0.12"
        />
      </Svg>

      {/* Centered text overlay */}
      <View style={styles.textOverlay}>
        <Text style={styles.timeText}>{timeLabel}</Text>
        <Text style={styles.remainingText}>REMAINING</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 260,
    height: 260,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 200,
    backgroundColor: 'transparent',
    // Radial gradient not supported natively; approximate with shadow
    shadowColor: '#D4B856',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#A0654A',
    fontSize: 46,
    fontWeight: '200',
    letterSpacing: 3,
    fontFamily: 'DMSans_400Regular',
  },
  remainingText: {
    color: '#A0654A',
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 4,
    opacity: 0.55,
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
  },
});
