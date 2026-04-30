import { Text, View } from 'react-native';

export default function BreathingOrb() {
  return (
    <View className="my-1 items-center justify-center">
      <View className="h-[110px] w-[110px] items-center justify-center rounded-full border border-terracotta/25 bg-terracotta/15">
        <View className="absolute h-[78px] w-[78px] items-center justify-center rounded-full border border-terracotta/20 bg-gold/10" />
        <Text className="z-10 text-[28px]">🪷</Text>
      </View>
    </View>
  );
}
