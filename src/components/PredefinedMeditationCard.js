import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function formatPrep(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) {
    const m = seconds / 60;
    return `${m} min prep`;
  }
  return `${seconds}s prep`;
}

export default function PredefinedMeditationCard({ meditation, selected, onPress }) {
  return (
    <Pressable
      onPress={() => onPress(meditation)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={meditation.name}
      className="flex-row items-center justify-between rounded-2xl border bg-cream/60 px-4 py-3"
      style={{
        borderColor: selected ? '#E8936A' : 'rgba(200,169,110,0.18)',
        backgroundColor: selected ? 'rgba(245,230,211,0.9)' : 'rgba(245,230,211,0.6)',
      }}
    >
      <View className="flex-1 gap-0.5 pr-3">
        <Text className="font-sans-medium text-[13px] text-brown">
          {meditation.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-sans text-[11px] text-sand">
            {meditation.meditationTime} min
          </Text>
          <View className="h-0.5 w-0.5 rounded-full bg-sand/50" />
          <Text className="font-sans text-[11px] text-sand">
            {formatPrep(meditation.prepTime)}
          </Text>
        </View>
        {meditation.description ? (
          <Text className="mt-0.5 font-sans text-[11px] text-brown/50">
            {meditation.description}
          </Text>
        ) : null}
      </View>
      <View
        className="h-8 w-8 items-center justify-center rounded-full border-[1.5px]"
        style={{
          borderColor: selected ? '#E8936A' : 'rgba(200,169,110,0.45)',
          backgroundColor: selected ? '#E8936A' : 'transparent',
        }}
      >
        {selected ? <Ionicons name="checkmark" size={16} color="#FFF8F0" /> : null}
      </View>
    </Pressable>
  );
}
