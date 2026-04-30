import { Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatsButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Statistics"
      className="h-[38px] flex-row items-center justify-center rounded-xl bg-brown/10 pl-2.5 pr-3"
    >
      <Text className="mr-1.5 font-sans-medium text-xs tracking-wide text-brown">
        Statistics
      </Text>
      <MaterialCommunityIcons name="chart-bar" size={16} color="#A0654A" />
    </Pressable>
  );
}
