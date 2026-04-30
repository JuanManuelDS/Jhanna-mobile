import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StreakBadge from '../components/StreakBadge';
import StatsButton from '../components/StatsButton';
import BreathingOrb from '../components/BreathingOrb';
import TimePickerCard from '../components/TimePickerCard';
import BeginButton from '../components/BeginButton';
import { getGreeting } from '../utils/greeting';

export default function HomeScreen() {
  const greeting = getGreeting(new Date().getHours());
  const noop = () => {};

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <StreakBadge count={14} />
        <StatsButton onPress={noop} />
      </View>

      <View className="flex-1 items-center justify-center gap-2.5 px-7">
        <BreathingOrb />
        <View className="my-2 h-px w-10 bg-sand/40" />
        <Text className="text-center font-serif text-[28px] leading-[34px] text-brown">
          {greeting}
          {'\n'}
          <Text className="font-serif-italic text-terracotta">be still.</Text>
        </Text>
        <Text className="text-center font-sans text-xs tracking-[0.3px] text-sand">
          Your practice awaits
        </Text>
      </View>

      <View className="gap-3 px-5 pb-4">
        <TimePickerCard
          label="Preparation"
          sublabel="Settle into stillness"
          value="1"
          unit="min"
        />
        <TimePickerCard
          label="Meditation"
          sublabel="Jhanna practice"
          value="10"
          unit="min"
        />
      </View>

      <View className="px-5 pb-7">
        <BeginButton onPress={noop} />
      </View>
    </SafeAreaView>
  );
}
