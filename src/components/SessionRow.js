import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SessionRow({ session }) {
  return (
    <View
      className="mb-2 flex-row items-center gap-2.5 rounded-xl bg-card px-3 py-2.5"
      style={{ borderLeftWidth: 3.5, borderLeftColor: '#C8A96E' }}
    >
      <View className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand">
        <MaterialCommunityIcons name="clock-outline" size={16} color="#A0654A" />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="mb-0.5 font-sans-semibold text-xs text-brown" numberOfLines={1}>
          {session.type}
        </Text>
        <Text className="font-sans text-[10px] text-sand">
          {session.date} · {session.time}
        </Text>
      </View>

      <View className="shrink-0 rounded-lg bg-cream px-2 py-1">
        <Text className="font-sans-semibold text-[11px] text-brown">{session.duration}</Text>
      </View>
    </View>
  );
}
