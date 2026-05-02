import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StreakBadge from '../components/StreakBadge';
import StatsButton from '../components/StatsButton';
import BreathingOrb from '../components/BreathingOrb';
import TimePickerCard from '../components/TimePickerCard';
import BeginButton from '../components/BeginButton';
import { getGreeting } from '../utils/greeting';
import { useState } from 'react';

const MIN_PREP = 0;
const MAX_PREP = 30;
const MIN_MED = 1;
const MAX_MED = 60;

export default function HomeScreen({ navigation }) {
  const greeting = getGreeting(new Date().getHours());
  const [prepTime, setPrepTime] = useState(1);
  const [meditationTime, setMeditationTime] = useState(10);

  const adjustPrep = (delta) =>
    setPrepTime((v) => Math.min(MAX_PREP, Math.max(MIN_PREP, v + delta)));

  const adjustMed = (delta) =>
    setMeditationTime((v) => Math.min(MAX_MED, Math.max(MIN_MED, v + delta)));

  const handleBegin = () => {
    navigation.navigate('Session', { prepTime, meditationTime });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <StreakBadge count={14} />
        <StatsButton onPress={() => navigation.navigate('Stats')} />
      </View>

      <View className="flex-1 items-center justify-center gap-2.5 px-7">
        <BreathingOrb />
        <View className="my-2 h-px w-10 bg-sand/40" />
        <Text className="text-center font-serif text-[28px] leading-[34px] text-brown">
          {greeting}
          {'\n'}
          <Text className="font-serif-italic text-terracotta">Observe reality as it is, not as you would like it to be.</Text>
        </Text>
        <Text className="text-center font-sans text-xs tracking-[0.3px] text-sand">
          Your practice awaits
        </Text>
      </View>

      <View className="gap-3 px-5 pb-4">
        <TimePickerCard
          label="Preparation"
          sublabel="Settle into stillness"
          value={String(prepTime)}
          unit="min"
          onDecrement={() => adjustPrep(-1)}
          onIncrement={() => adjustPrep(1)}
        />
        <TimePickerCard
          label="Meditation"
          sublabel="Jhanna practice"
          value={String(meditationTime)}
          unit="min"
          onDecrement={() => adjustMed(-1)}
          onIncrement={() => adjustMed(1)}
        />
      </View>

      <View className="px-5 pb-7">
        <BeginButton onPress={handleBegin} />
      </View>
    </SafeAreaView>
  );
}
