import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StreakBadge({ count }) {
  return (
    <View
      className="flex-row items-center rounded-[20px] border border-sand/35 bg-sand/20 pl-2.5 pr-3.5 py-1.5"
    >
      <MaterialCommunityIcons name="fire" size={18} color="#E8936A" />
      <Text className="ml-1.5 font-sans-semibold text-[15px] text-brown">
        {count}
      </Text>
      <Text className="ml-1.5 font-sans text-[11px] text-sand">
        day streak
      </Text>
    </View>
  );
}
