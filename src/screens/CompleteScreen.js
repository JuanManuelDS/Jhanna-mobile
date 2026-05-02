import { useCallback } from 'react';
import { View, Text, Pressable, BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';

function LotusIcon({ size = 68, color = '#E8936A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 42 C32 42 22 32 22 22 C22 14 27 10 32 10 C37 10 42 14 42 22 C42 32 32 42 32 42Z"
        fill={color}
        opacity={0.9}
      />
      <Path
        d="M32 42 C32 42 14 36 10 26 C7 18 10 12 15 10 C20 8 26 12 28 20 C30 28 32 42 32 42Z"
        fill={color}
        opacity={0.65}
      />
      <Path
        d="M32 42 C32 42 50 36 54 26 C57 18 54 12 49 10 C44 8 38 12 36 20 C34 28 32 42 32 42Z"
        fill={color}
        opacity={0.65}
      />
      <Path
        d="M32 42 C32 42 10 42 6 34 C3 27 6 20 12 18 C18 16 24 20 26 28 C28 34 32 42 32 42Z"
        fill={color}
        opacity={0.4}
      />
      <Path
        d="M32 42 C32 42 54 42 58 34 C61 27 58 20 52 18 C46 16 40 20 38 28 C36 34 32 42 32 42Z"
        fill={color}
        opacity={0.4}
      />
      <Path
        d="M26 44 Q32 50 38 44"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <Circle cx={32} cy={24} r={4} fill="#F5E6D3" opacity={0.7} />
    </Svg>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function StatRow({ label, value, valueTestID }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-sans-medium text-[13px] uppercase tracking-[0.06em] text-brown opacity-70">
        {label}
      </Text>
      <Text
        testID={valueTestID}
        className="font-sans-semibold text-[15px] text-[#6B4A35] flex-shrink ml-3 text-right"
      >
        {value}
      </Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
    >
      {({ pressed }) => (
        <View
          className="h-[54px] w-full items-center justify-center rounded-2xl"
          style={{ backgroundColor: pressed ? '#d97f58' : '#E8936A' }}
        >
          <Text className="font-sans-semibold text-base tracking-[0.01em] text-offwhite">
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
    >
      {({ pressed }) => (
        <View
          className="h-[54px] w-full items-center justify-center rounded-2xl border-[1.5px] border-brown"
          style={{ backgroundColor: pressed ? 'rgba(160,101,74,0.07)' : 'transparent' }}
        >
          <Text className="font-sans-semibold text-base tracking-[0.01em] text-brown">
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function CompleteScreen({ route, navigation }) {
  const { duration = 0, streakCount = 1, date } = route?.params ?? {};

  const sessionDate = date ? new Date(date) : new Date();
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedDuration = `${duration} min`;
  const formattedStreak = `${streakCount} consecutive days`;

  const handleReturnHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [navigation]);

  const handleViewStats = useCallback(() => {
    navigation.navigate('Statistics');
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleReturnHome();
        return true;
      });
      return () => sub.remove();
    }, [handleReturnHome])
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-6" style={{ gap: 20 }}>
        <View style={styles.card} className="w-full items-center rounded-3xl bg-sand">
          <LotusIcon size={68} color="#E8936A" />
          <Text className="mt-[18px] mb-6 text-center font-serif text-[28px] leading-[34px] text-brown">
            Session Complete
          </Text>
          <View className="w-full">
            <Divider />
            <StatRow label="Duration" value={formattedDuration} valueTestID="duration-value" />
            <Divider />
            <StatRow label="Date" value={formattedDate} valueTestID="date-value" />
            <Divider />
            <StatRow label="Streak" value={formattedStreak} valueTestID="streak-value" />
            <Divider />
          </View>
        </View>

        <View className="w-full" style={{ gap: 12 }}>
          <PrimaryButton label="Return Home" onPress={handleReturnHome} />
          <SecondaryButton label="View Statistics" onPress={handleViewStats} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 28,
    shadowColor: '#78461E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 6,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(160,101,74,0.18)',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    elevation: 4,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
