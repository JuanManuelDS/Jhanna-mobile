import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function PulsingText({ text }) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.55, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animStyle}>
      <Text style={styles.pausedText}>{text}</Text>
    </Animated.View>
  );
}

export default function SessionControls({ isRunning, onPauseResume, onStop }) {
  return (
    <View style={styles.wrapper}>
      {!isRunning && <PulsingText text="PAUSED" />}
      {isRunning && <View style={styles.pausedSpacer} />}

      <View style={styles.buttons}>
        <Pressable
          onPress={onPauseResume}
          style={({ pressed }) => [styles.shadowTerracotta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause' : 'Resume'}
        >
          <View className="rounded-[28px] bg-terracotta px-[44px] py-[20px] items-center">
            <Text className="text-brown font-sans-medium text-base" style={styles.btnLetterSpacing}>
              {isRunning ? 'Pause' : 'Resume'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onStop}
          style={({ pressed }) => [styles.shadowCoral, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Stop"
        >
          <View className="rounded-[28px] bg-coral px-[44px] py-[20px] items-center">
            <Text className="text-brown font-sans-medium text-base" style={styles.btnLetterSpacing}>
              Stop
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    gap: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 14,
  },
  shadowTerracotta: {
    borderRadius: 28,
    shadowColor: '#E8936A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.33,
    shadowRadius: 10,
    elevation: 6,
  },
  shadowCoral: {
    borderRadius: 28,
    shadowColor: '#D4796A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 10,
    elevation: 6,
  },
  btnLetterSpacing: {
    letterSpacing: 1,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  pausedText: {
    color: '#A0654A',
    fontSize: 10,
    letterSpacing: 5,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_400Regular',
  },
  pausedSpacer: {
    height: 14,
  },
});
