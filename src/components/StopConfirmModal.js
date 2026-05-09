import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function StopConfirmModal({ visible, onConfirm, onCancel }) {
  const backdropOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardTranslate = useSharedValue(12);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      cardTranslate.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      cardOpacity.value = withTiming(0, { duration: 160 });
      cardScale.value = withTiming(0.92, { duration: 160 });
      cardTranslate.value = withTiming(12, { duration: 160 });
    }
  }, [visible]);

  const backdropAnimStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslate.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, backdropAnimStyle]}
        pointerEvents="none"
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, styles.backdropOverlay]} />
      </Animated.View>

      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onCancel}
        testID="modal-backdrop"
        accessible={false}
      />

      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View style={[styles.cardShadow, cardAnimStyle]}>
          <Pressable onPress={() => {}} accessible={false}>
            <View className="w-[280px] rounded-[20px] bg-cream pt-8 px-7 pb-6 items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-1.5"
                style={styles.iconBg}
              >
                <Ionicons name="stop" size={22} color="#D4796A" style={styles.iconOpacity} />
              </View>

              <Text className="text-brown font-sans-semibold" style={styles.title}>
                End Session?
              </Text>

              <Text className="text-brown font-sans text-center mt-1.5 mb-3" style={styles.body}>
                Your progress for this session will be saved.
              </Text>

              <View className="w-full gap-2.5">
                <Pressable
                  onPress={onConfirm}
                  style={({ pressed }) => [styles.confirmShadow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="End Session"
                >
                  <View className="bg-coral rounded-[14px] py-[13px] items-center w-full">
                    <Text className="text-cream font-sans-medium" style={styles.btnText}>
                      End Session
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                >
                  <View
                    className="rounded-[14px] py-[13px] items-center w-full"
                    style={styles.cancelBorder}
                  >
                    <Text className="text-brown font-sans-medium" style={styles.btnText}>
                      Continue
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    backgroundColor: 'rgba(30,22,16,0.65)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardShadow: {
    borderRadius: 20,
    shadowColor: '#1E1610',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  iconBg: {
    backgroundColor: 'rgba(212,121,106,0.094)',
  },
  iconOpacity: {
    opacity: 0.85,
  },
  title: {
    fontSize: 17,
    letterSpacing: 0.17,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.6,
    maxWidth: 210,
  },
  btnText: {
    fontSize: 15,
    letterSpacing: 0.45,
  },
  cancelBorder: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(160,101,74,0.3)',
    opacity: 0.75,
  },
  confirmShadow: {
    borderRadius: 14,
    shadowColor: '#D4796A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
