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

export default function SessionControls({ isRunning, confirmingStop, onPauseResume, onStop, onStopConfirm }) {
  return (
    <View style={styles.wrapper}>
      {!isRunning && <PulsingText text="PAUSED" />}
      {isRunning && <View style={styles.pausedSpacer} />}

      <View style={styles.buttons}>
        <Pressable
          onPress={onPauseResume}
          style={({ pressed }) => [styles.btn, styles.btnTerracotta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause' : 'Resume'}
        >
          <Text style={styles.btnText}>{isRunning ? 'Pause' : 'Resume'}</Text>
        </Pressable>

        <Pressable
          onPress={confirmingStop ? onStopConfirm : onStop}
          style={({ pressed }) => [styles.btn, styles.btnCoral, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={confirmingStop ? 'Confirm stop' : 'Stop'}
        >
          <Text style={styles.btnText}>{confirmingStop ? 'End session?' : 'Stop'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
    gap: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 14,
  },
  btn: {
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 34,
  },
  btnTerracotta: {
    backgroundColor: '#E8936A',
    shadowColor: '#E8936A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.33,
    shadowRadius: 10,
    elevation: 6,
  },
  btnCoral: {
    backgroundColor: '#D4796A',
    shadowColor: '#D4796A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: {
    color: '#A0654A',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    fontFamily: 'DMSans_500Medium',
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
