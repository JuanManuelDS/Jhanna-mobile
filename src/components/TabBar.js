import { View, Text, Pressable } from 'react-native';

export default function TabBar({ tabs, active, onChange }) {
  return (
    <View className="flex-row border-b border-sand/20">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            className="flex-1 items-center pt-3 pb-2.5"
          >
            <Text
              className="font-sans-medium text-base tracking-[0.4px]"
              style={{ color: isActive ? '#A0654A' : 'rgba(160,101,74,0.4)' }}
            >
              {tab.label}
            </Text>
            <View
              className="mt-2 h-0.5 w-10 rounded-full"
              style={{ backgroundColor: isActive ? '#E8936A' : 'transparent' }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
