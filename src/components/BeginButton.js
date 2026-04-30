import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BeginButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Begin Session"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <View className="flex-row items-center justify-center gap-2.5 rounded-[22px] bg-terracotta py-[18px]">
        <Text className="font-sans-medium text-base tracking-[0.3px] text-offwhite">
          Begin Session
        </Text>
        <MaterialCommunityIcons name="play" size={18} color="#FFF8F0" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 22,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    elevation: 4,
  },
});
