import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { clamp, parseNumeric } from '../utils/timeFormat';

function StepButton({ symbol, onPress, disabled, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="h-8 w-8 items-center justify-center rounded-[10px] border-[1.5px] border-sand/50"
      style={disabled ? { opacity: 0.35 } : null}
    >
      <Text className="font-sans text-base leading-none text-brown">{symbol}</Text>
    </Pressable>
  );
}

export default function EditableTimePickerCard({
  label,
  sublabel,
  value,
  min,
  max,
  step,
  unit,
  formatDisplay,
  formatEditing,
  onChange,
  testID,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const display = formatDisplay(value);
  const showUnit = typeof unit === 'function' ? unit(value) : unit;

  const beginEdit = () => {
    setDraft('');
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseNumeric(draft);
    if (Number.isNaN(parsed)) {
      setEditing(false);
      return;
    }
    const next = clamp(parsed, min, max);
    if (next !== value) onChange(next);
    setEditing(false);
  };

  const adjust = (delta) => {
    const next = clamp(value + delta, min, max);
    if (next !== value) onChange(next);
  };

  return (
    <View
      testID={testID}
      className="flex-row items-center justify-between rounded-2xl border border-sand/20 bg-cream/60 px-4 py-3.5"
    >
      <View className="gap-0.5">
        <Text className="font-sans-medium text-[11px] uppercase tracking-[0.8px] text-sand">
          {label}
        </Text>
        {sublabel && (
          <Text className="font-sans text-[11px] text-brown/50">{sublabel}</Text>
        )}
      </View>
      <View className="flex-row items-center gap-3.5">
        <StepButton
          symbol="−"
          onPress={() => adjust(-step)}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label}`}
        />
        <Pressable
          onPress={beginEdit}
          accessibilityLabel={`Edit ${label}`}
          className="min-w-[64px] items-center"
        >
          {editing ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
              onBlur={commit}
              onSubmitEditing={commit}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              returnKeyType="done"
              className="font-serif text-[28px] leading-none text-brown"
              style={{ minWidth: 60, textAlign: 'center', padding: 0 }}
            />
          ) : (
            <Text className="font-serif text-[28px] leading-none text-brown">
              {display}
            </Text>
          )}
          {showUnit ? (
            <Text className="mt-0.5 font-sans text-[11px] text-sand">{showUnit}</Text>
          ) : null}
        </Pressable>
        <StepButton
          symbol="+"
          onPress={() => adjust(step)}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label}`}
        />
      </View>
    </View>
  );
}
