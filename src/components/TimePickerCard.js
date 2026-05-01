import { View, Text, Pressable } from 'react-native';

function StepButton({ symbol, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-8 w-8 items-center justify-center rounded-[10px] border-[1.5px] border-sand/50"
    >
      <Text className="font-sans text-base leading-none text-brown">
        {symbol}
      </Text>
    </Pressable>
  );
}

export default function TimePickerCard({ label, sublabel, value, unit, onDecrement, onIncrement }) {
  const noop = () => {};
  const handleDecrement = onDecrement ?? noop;
  const handleIncrement = onIncrement ?? noop;
  return (
    <View
      className="flex-row items-center justify-between rounded-[20px] border border-sand/25 bg-offwhite/80 px-5 py-4"
    >
      <View className="gap-0.5">
        <Text className="font-sans-medium text-[11px] uppercase tracking-[0.8px] text-sand">
          {label}
        </Text>
        {sublabel && (
          <Text className="font-sans text-[11px] text-brown/50">
            {sublabel}
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-3.5">
        <StepButton symbol="−" onPress={handleDecrement} />
        <View className="min-w-[52px] items-center">
          <Text className="font-serif text-[28px] leading-none text-brown">
            {value}
          </Text>
          <Text className="mt-0.5 font-sans text-[11px] text-sand">{unit}</Text>
        </View>
        <StepButton symbol="+" onPress={handleIncrement} />
      </View>
    </View>
  );
}
