import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatCard({ icon, value, label }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-sand px-2.5 py-3.5 gap-1">
      <MaterialCommunityIcons name={icon} size={14} color="#A0654A" style={{ opacity: 0.7 }} />
      <Text className="font-sans-semibold text-[26px] leading-tight text-brown">{value}</Text>
      <Text className="text-center font-sans text-[10px] leading-[13px] text-brown/75">{label}</Text>
    </View>
  );
}
